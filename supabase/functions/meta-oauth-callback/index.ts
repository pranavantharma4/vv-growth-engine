import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const META_APP_ID = Deno.env.get('META_APP_ID')!
const META_APP_SECRET = Deno.env.get('META_APP_SECRET')!
const SITE_URL = Deno.env.get('SITE_URL') || 'https://www.vngrdvisuals.com'

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const stateRaw = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const errorDesc = url.searchParams.get('error_description')

  // Parse return_url and routing keys from state
  let returnUrl = `${SITE_URL}/dashboard/connect?connected=meta`
  let clientId: string | null = null
  let source: string | null = null
  let leadEmail: string | null = null

  if (stateRaw) {
    try {
      const state = JSON.parse(decodeURIComponent(stateRaw))
      clientId = state.client_id || null
      source = state.source || null
      leadEmail = state.lead_email || null
      if (state.return_url) returnUrl = state.return_url
    } catch (_) {}
  }

  const isVisionDrop = source === 'vision_drop'
  const errorReturnBase = isVisionDrop
    ? `${SITE_URL}/vision-drop/connect`
    : `${SITE_URL}/dashboard/connect`

  // Handle OAuth errors from Facebook
  if (error) {
    return Response.redirect(`${errorReturnBase}?error=${encodeURIComponent(errorDesc || error)}`, 302)
  }

  if (!code) {
    return Response.redirect(`${errorReturnBase}?error=Missing+authorization+code`, 302)
  }

  if (isVisionDrop ? !leadEmail : !clientId) {
    return Response.redirect(`${errorReturnBase}?error=Missing+lead+or+client+identifier`, 302)
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`

    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${META_APP_SECRET}` +
      `&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', JSON.stringify(tokenData))
      return Response.redirect(`${SITE_URL}/dashboard/connect?error=Token+exchange+failed`, 302)
    }

    const shortToken = tokenData.access_token

    // Exchange for long-lived token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${META_APP_ID}` +
      `&client_secret=${META_APP_SECRET}` +
      `&fb_exchange_token=${shortToken}`
    )
    const longTokenData = await longTokenRes.json()
    const accessToken = longTokenData.access_token || shortToken
    const expiresIn = longTokenData.expires_in || 5184000 // 60 days default
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Get ad accounts
    const accountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status,currency&access_token=${accessToken}`
    )
    const accountsData = await accountsRes.json()
    const accounts = accountsData.data || []

    // ── Vision Drop branch: save token onto the lead row, then redirect back
    //    to the prospect flow. No client / ad_connections involvement. ──
    if (isVisionDrop && leadEmail) {
      const firstAccount = accounts.find((a: any) => a.account_status === 1) || accounts[0]
      const acctId = firstAccount ? String(firstAccount.id).replace('act_', '') : null
      const acctName = firstAccount?.name || (accounts.length === 0 ? 'No ad accounts found' : null)

      const { error: vdErr } = await supabase
        .from('vision_drop_leads')
        .update({
          meta_connected: true,
          meta_access_token: accessToken,
          meta_account_id: acctId,
          meta_account_name: acctName,
          meta_token_expires_at: expiresAt,
        })
        .eq('email', leadEmail.toLowerCase())

      if (vdErr) {
        console.error('vision_drop update error:', JSON.stringify(vdErr))
        return Response.redirect(`${SITE_URL}/vision-drop/connect?error=Database+error`, 302)
      }
      if (accounts.length === 0) {
        return Response.redirect(`${SITE_URL}/vision-drop/connect?error=No+ad+accounts+found+on+this+Facebook+account`, 302)
      }
      return Response.redirect(returnUrl, 302)
    }

    if (accounts.length === 0) {
      // Still save the connection — user may not have ad accounts yet
      await supabase.from('ad_connections').upsert({
        client_id: clientId,
        platform: 'meta',
        is_active: true,
        access_token: accessToken,
        expires_at: expiresAt,
        account_id: null,
        account_name: 'No ad accounts found',
        last_synced_at: null,
      }, { onConflict: 'client_id,platform' })

      return Response.redirect(`${SITE_URL}/dashboard/connect?error=No+ad+accounts+found+on+this+Facebook+account`, 302)
    }

    // Use first active account
    const account = accounts.find((a: any) => a.account_status === 1) || accounts[0]
    const accountId = account.id.replace('act_', '')
    const accountName = account.name

    // Save connection
    const { error: upsertErr } = await supabase.from('ad_connections').upsert({
      client_id: clientId,
      platform: 'meta',
      is_active: true,
      access_token: accessToken,
      expires_at: expiresAt,
      account_id: accountId,
      account_name: accountName,
      last_synced_at: null,
    }, { onConflict: 'client_id,platform' })

    if (upsertErr) {
      console.error('Upsert error:', JSON.stringify(upsertErr))
      return Response.redirect(`${SITE_URL}/dashboard/connect?error=Database+error`, 302)
    }

    console.log(`Meta connected: client=${clientId}, account=${accountId}, name=${accountName}`)

    // Redirect back to return_url — this brings them back into the app
    return Response.redirect(returnUrl, 302)

  } catch (err: any) {
    console.error('OAuth callback error:', err.message)
    return Response.redirect(`${SITE_URL}/dashboard/connect?error=${encodeURIComponent(err.message)}`, 302)
  }
})
