import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_APP_ID = Deno.env.get("META_APP_ID")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET")!;

const FRONTEND_URL = "https://vv-growth-engine.vercel.app";
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`;

serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(`${FRONTEND_URL}/dashboard/connect?error=meta_denied`, 302);
  }

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  let clientId: string;
  try {
    clientId = atob(state);
  } catch {
    return new Response("Invalid state", { status: 400 });
  }

  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ client_id: META_APP_ID, client_secret: META_APP_SECRET, redirect_uri: REDIRECT_URI, code })
  );

  if (!tokenRes.ok) {
    console.error("Token exchange failed:", await tokenRes.text());
    return Response.redirect(`${FRONTEND_URL}/dashboard/connect?error=meta_token_failed`, 302);
  }

  const { access_token: shortToken } = await tokenRes.json();

  const longTokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({ grant_type: "fb_exchange_token", client_id: META_APP_ID, client_secret: META_APP_SECRET, fb_exchange_token: shortToken })
  );

  if (!longTokenRes.ok) {
    console.error("Long token exchange failed:", await longTokenRes.text());
    return Response.redirect(`${FRONTEND_URL}/dashboard/connect?error=meta_longtoken_failed`, 302);
  }

  const { access_token: longToken, expires_in } = await longTokenRes.json();

  const adAccountsRes = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${longToken}`
  );
  const adAccountsData = await adAccountsRes.json();
  const adAccounts = adAccountsData?.data ?? [];
  const primaryAccount = adAccounts.find((a: { account_status: number }) => a.account_status === 1) ?? adAccounts[0];

  const expiresAt = new Date(Date.now() + (expires_in ?? 5183944) * 1000).toISOString();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error: upsertError } = await supabase
    .from("ad_connections")
    .upsert(
      {
        client_id: clientId,
        platform: "meta",
        access_token: longToken,
        refresh_token: null,
        account_id: primaryAccount?.id?.replace("act_", "") ?? null,
        account_name: primaryAccount?.name ?? null,
        expires_at: expiresAt,
        is_active: true,
        last_synced_at: null,
      },
      { onConflict: "client_id,platform" }
    );

  if (upsertError) {
    console.error("DB upsert failed:", upsertError);
    return Response.redirect(`${FRONTEND_URL}/dashboard/connect?error=meta_db_failed`, 302);
  }

  return Response.redirect(`${FRONTEND_URL}/dashboard/connect?success=meta_connected`, 302);
});
