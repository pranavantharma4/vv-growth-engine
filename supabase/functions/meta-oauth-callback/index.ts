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

  // Parse return_url from state
  let returnUrl = `${SITE_URL}/dashboard/connect?connected=meta`
  let clientId: string | null = null

  if (stateRaw) {
    try {
      const state = JSON.parse(decodeURIComponent(stateRaw))
      clientId = state.client_id || null
      if (state.return_url) returnUrl = state.return_url
    } catch (_) {}
  }

  // Handle OAuth errors from Facebook
  if (error) {
    const errorUrl = `${SITE_URL}/dashboard/connect?error=${encodeURIComponent(errorDesc || error)}`
    return Response.redirect(errorUrl, 302)
  }

  if (!code || !clientId) {
    return Response.redirect(`${SITE_URL}/dashboard/connect?error=Missing+code+or+client+id`, 302)
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
