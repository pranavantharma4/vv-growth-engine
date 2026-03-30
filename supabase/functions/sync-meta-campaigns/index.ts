import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Health classification logic — mirrors the platform's STRONG/WEAK/BLEEDING/DEAD system
function classifyHealth(roas: number, spend: number, conversions: number): string {
  if (spend === 0) return "weak";
  if (roas >= 3 && conversions > 0) return "strong";
  if (roas >= 1.5) return "weak";
  if (roas > 0 && roas < 1.5 && spend > 50) return "bleeding";
  if (conversions === 0 && spend > 100) return "dead";
  return "weak";
}

serve(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { client_id } = body;

    if (!client_id) {
      return new Response(JSON.stringify({ error: "client_id required" }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Get the Meta connection for this client
    const { data: conn, error: connErr } = await supabase
      .from("ad_connections")
      .select("*")
      .eq("client_id", client_id)
      .eq("platform", "meta")
      .eq("is_active", true)
      .single();

    if (connErr || !conn) {
      return new Response(JSON.stringify({ error: "No active Meta connection found" }), {
        status: 404, headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Check token expiry
    if (conn.expires_at && new Date(conn.expires_at) < new Date()) {
      await supabase.from("ad_connections")
        .update({ is_active: false })
        .eq("id", conn.id);
      return new Response(JSON.stringify({ error: "Meta token expired. Client must reconnect." }), {
        status: 401, headers: { "Content-Type": "application/json" }
      });
    }

    const accessToken = conn.access_token;

    // 3. Log sync start
    const { data: syncLog } = await supabase.from("sync_logs").insert({
      client_id,
      platform: "meta",
      status: "running",
      started_at: new Date().toISOString(),
    }).select().single();

    const syncLogId = syncLog?.id;

    // 4. Get ad accounts for this token
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`
    );
    const adAccountsData = await adAccountsRes.json();

    if (adAccountsData.error) {
      await supabase.from("sync_logs").update({
        status: "failed",
        error_message: adAccountsData.error.message,
        completed_at: new Date().toISOString(),
      }).eq("id", syncLogId);
      return new Response(JSON.stringify({ error: adAccountsData.error.message }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

    const adAccounts = (adAccountsData.data || []).filter(
      (a: { account_status: number }) => a.account_status === 1
    );

    if (adAccounts.length === 0) {
      await supabase.from("sync_logs").update({
        status: "failed",
        error_message: "No active ad accounts found on this Meta account",
        completed_at: new Date().toISOString(),
      }).eq("id", syncLogId);
      return new Response(JSON.stringify({ error: "No active ad accounts found" }), {
        status: 404, headers: { "Content-Type": "application/json" }
      });
    }

    // 5. Pull campaigns + insights for each ad account (last 30 days)
    const today = new Date();
    const since = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split("T")[0];
    const until = today.toISOString().split("T")[0];

    let totalSynced = 0;
    const snapshots = [];

    for (const account of adAccounts) {
      const accountId = account.id; // already includes "act_" prefix

      // Fetch campaigns with insights in one call using fields + date_preset
      const campaignsRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/campaigns?` +
        new URLSearchParams({
          fields: [
            "id",
            "name",
            "status",
            `insights.time_range({"since":"${since}","until":"${until}"}){spend,impressions,clicks,actions,action_values,purchase_roas}`
          ].join(","),
          limit: "100",
          access_token: accessToken,
        })
      );

      const campaignsData = await campaignsRes.json();

      if (campaignsData.error) {
        console.error(`Error fetching campaigns for ${accountId}:`, campaignsData.error);
        continue;
      }

      const campaigns = campaignsData.data || [];

      for (const campaign of campaigns) {
        // Only sync active or paused campaigns (skip deleted/archived)
        if (!["ACTIVE", "PAUSED"].includes(campaign.status)) continue;

        const insights = campaign.insights?.data?.[0] ?? null;

        const spend = parseFloat(insights?.spend ?? "0");
        const impressions = parseInt(insights?.impressions ?? "0");
        const clicks = parseInt(insights?.clicks ?? "0");

        // Conversions = purchase actions
        const actions = insights?.actions ?? [];
        const purchaseAction = actions.find(
          (a: { action_type: string }) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
        );
        const conversions = purchaseAction ? parseInt(purchaseAction.value) : 0;

        // Revenue = purchase action values
        const actionValues = insights?.action_values ?? [];
        const purchaseValue = actionValues.find(
          (a: { action_type: string }) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
        );
        const revenue = purchaseValue ? parseFloat(purchaseValue.value) : 0;

        // ROAS
        const roasData = insights?.purchase_roas ?? [];
        const roas = roasData.length > 0
          ? parseFloat(roasData[0].value)
          : spend > 0 && revenue > 0
            ? revenue / spend
            : 0;

        const health = classifyHealth(roas, spend, conversions);

        snapshots.push({
          client_id,
          platform: "meta",
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          status: campaign.status.toLowerCase(),
          spend: Math.round(spend * 100) / 100,
          impressions,
          clicks,
          conversions,
          revenue: Math.round(revenue * 100) / 100,
          roas: Math.round(roas * 100) / 100,
          health,
          snapshot_date: until,
          synced_at: new Date().toISOString(),
        });

        totalSynced++;
      }
    }

    // 6. Upsert all snapshots
    if (snapshots.length > 0) {
      const { error: upsertErr } = await supabase
        .from("campaign_snapshots")
        .upsert(snapshots, { onConflict: "client_id,campaign_id,snapshot_date" });

      if (upsertErr) {
        console.error("Upsert error:", upsertErr);
        await supabase.from("sync_logs").update({
          status: "failed",
          error_message: upsertErr.message,
          completed_at: new Date().toISOString(),
        }).eq("id", syncLogId);
        return new Response(JSON.stringify({ error: upsertErr.message }), {
          status: 500, headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 7. Update last_synced_at on the connection
    await supabase.from("ad_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", conn.id);

    // 8. Complete the sync log
    await supabase.from("sync_logs").update({
      status: "success",
      campaigns_synced: totalSynced,
      completed_at: new Date().toISOString(),
    }).eq("id", syncLogId);

    return new Response(JSON.stringify({
      success: true,
      campaigns_synced: totalSynced,
      message: `Synced ${totalSynced} campaigns from Meta Ads`,
    }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
});
