import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH = "https://graph.facebook.com/v19.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function classifyHealth(roas: number, spend: number, conversions: number): string {
  if (spend === 0) return "weak";
  if (roas >= 3 && conversions > 0) return "strong";
  if (roas >= 1.5) return "weak";
  if (roas > 0 && roas < 1.5 && spend > 50) return "bleeding";
  if (conversions === 0 && spend > 100) return "dead";
  return "weak";
}

const isPurchase = (t: string) =>
  t === "purchase" || t === "offsite_conversion.fb_pixel_purchase";

// Extract the standard performance shape from any Meta insights row.
function perf(row: any): { spend: number; conversions: number; revenue: number; roas: number } {
  const spend = parseFloat(row?.spend ?? "0");
  const conv = (row?.actions ?? []).find((a: any) => isPurchase(a.action_type));
  const conversions = conv ? parseInt(conv.value) : 0;
  const val = (row?.action_values ?? []).find((a: any) => isPurchase(a.action_type));
  let revenue = val ? parseFloat(val.value) : 0;
  const r = row?.purchase_roas ?? [];
  let roas = r.length > 0 ? parseFloat(r[0].value) : (spend > 0 && revenue > 0 ? revenue / spend : 0);
  if (revenue === 0 && roas > 0 && spend > 0) revenue = roas * spend;
  return { spend, conversions, revenue, roas };
}

async function getJSON(url: string): Promise<any> {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    return { error: { message: String(e) } };
  }
}

// Group account-level breakdown insight rows into a per-campaign map of the top
// segments by spend. `keyFields` defines the breakdown label.
function groupBreakdown(
  rows: any[],
  keyFields: string[],
  topN: number,
): Record<string, any[]> {
  const byCampaign: Record<string, any[]> = {};
  for (const row of rows) {
    const cid = row.campaign_id;
    if (!cid) continue;
    const label = keyFields.map((f) => row[f] ?? "unknown").join(" / ");
    const p = perf(row);
    (byCampaign[cid] ||= []).push({
      segment: label,
      spend: Math.round(p.spend * 100) / 100,
      roas: Math.round(p.roas * 100) / 100,
      conversions: p.conversions,
      impressions: parseInt(row.impressions ?? "0"),
    });
  }
  for (const cid of Object.keys(byCampaign)) {
    byCampaign[cid] = byCampaign[cid]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, topN);
  }
  return byCampaign;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { client_id } = body;

    if (!client_id) {
      return new Response(JSON.stringify({ error: "client_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: conn, error: connErr } = await supabase
      .from("ad_connections")
      .select("*")
      .eq("client_id", client_id)
      .eq("platform", "meta")
      .eq("is_active", true)
      .single();

    if (connErr || !conn) {
      return new Response(JSON.stringify({ error: "No active Meta connection found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (conn.expires_at && new Date(conn.expires_at) < new Date()) {
      await supabase.from("ad_connections").update({ is_active: false }).eq("id", conn.id);
      return new Response(JSON.stringify({ error: "Meta token expired. Client must reconnect." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const accessToken = conn.access_token;

    const { data: syncLog } = await supabase.from("sync_logs").insert({
      client_id,
      platform: "meta",
      status: "running",
      started_at: new Date().toISOString(),
    }).select().single();

    const syncLogId = syncLog?.id;

    const adAccountsData = await getJSON(
      `${GRAPH}/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`
    );

    if (adAccountsData.error) {
      await supabase.from("sync_logs").update({
        status: "failed",
        error_message: adAccountsData.error.message,
        completed_at: new Date().toISOString(),
      }).eq("id", syncLogId);
      return new Response(JSON.stringify({ error: adAccountsData.error.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
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
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const today = new Date();
    const since = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const until = today.toISOString().split("T")[0];
    const trendSince = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const timeRange = `{"since":"${since}","until":"${until}"}`;

    let totalSynced = 0;
    const snapshots = [];

    for (const account of adAccounts) {
      const accountId = account.id; // already in "act_XXXX" form

      // 1) Aggregate per-campaign metrics (expanded granular insight fields) + objective.
      const campaignsData = await getJSON(
        `${GRAPH}/${accountId}/campaigns?` +
        new URLSearchParams({
          fields: [
            "id",
            "name",
            "status",
            "objective",
            `insights.time_range(${timeRange}){spend,impressions,clicks,actions,action_values,purchase_roas,frequency,reach,cpm,cpc,ctr,cost_per_action_type}`,
          ].join(","),
          limit: "100",
          access_token: accessToken,
        })
      );
      if (campaignsData.error) { console.error(`Error for ${accountId}:`, campaignsData.error); continue; }
      const campaigns = campaignsData.data || [];

      // 2-5) Granular breakdowns — ONE account-level call each (level=campaign),
      // so cost stays flat regardless of campaign count. Failures degrade
      // gracefully to empty maps rather than aborting the sync.
      const [demoRes, placeRes, trendRes, adsetRes] = await Promise.all([
        getJSON(`${GRAPH}/${accountId}/insights?` + new URLSearchParams({
          level: "campaign",
          breakdowns: "age,gender",
          time_range: timeRange,
          fields: "campaign_id,spend,impressions,actions,action_values,purchase_roas",
          limit: "1000",
          access_token: accessToken,
        })),
        getJSON(`${GRAPH}/${accountId}/insights?` + new URLSearchParams({
          level: "campaign",
          breakdowns: "publisher_platform,platform_position",
          time_range: timeRange,
          fields: "campaign_id,spend,impressions,actions,action_values,purchase_roas",
          limit: "1000",
          access_token: accessToken,
        })),
        getJSON(`${GRAPH}/${accountId}/insights?` + new URLSearchParams({
          level: "campaign",
          time_increment: "1",
          time_range: `{"since":"${trendSince}","until":"${until}"}`,
          fields: "campaign_id,date_start,spend,impressions,actions,action_values,purchase_roas",
          limit: "1000",
          access_token: accessToken,
        })),
        getJSON(`${GRAPH}/${accountId}/adsets?` + new URLSearchParams({
          fields: "campaign_id,bid_strategy,daily_budget,optimization_goal",
          limit: "500",
          access_token: accessToken,
        })),
      ]);

      const demoMap = groupBreakdown(demoRes?.data ?? [], ["age", "gender"], 10);
      const placeMap = groupBreakdown(placeRes?.data ?? [], ["publisher_platform", "platform_position"], 8);

      // Daily trend: per-campaign ordered series of {date, spend, roas}.
      const trendMap: Record<string, any[]> = {};
      for (const row of (trendRes?.data ?? [])) {
        const cid = row.campaign_id;
        if (!cid) continue;
        const p = perf(row);
        (trendMap[cid] ||= []).push({
          date: row.date_start,
          spend: Math.round(p.spend * 100) / 100,
          roas: Math.round(p.roas * 100) / 100,
          conversions: p.conversions,
        });
      }
      for (const cid of Object.keys(trendMap)) {
        trendMap[cid].sort((a, b) => (a.date < b.date ? -1 : 1));
      }

      // Ad-set level bid strategy + summed daily budget (Meta returns minor units).
      const adsetMap: Record<string, { bid_strategy: string | null; daily_budget: number; optimization_goal: string | null }> = {};
      for (const as of (adsetRes?.data ?? [])) {
        const cid = as.campaign_id;
        if (!cid) continue;
        const entry = adsetMap[cid] ||= { bid_strategy: null, daily_budget: 0, optimization_goal: null };
        if (!entry.bid_strategy && as.bid_strategy) entry.bid_strategy = as.bid_strategy;
        if (!entry.optimization_goal && as.optimization_goal) entry.optimization_goal = as.optimization_goal;
        if (as.daily_budget) entry.daily_budget += parseFloat(as.daily_budget) / 100;
      }

      for (const campaign of campaigns) {
        if (!["ACTIVE", "PAUSED"].includes(campaign.status)) continue;

        const insights = campaign.insights?.data?.[0] ?? null;
        const { spend, conversions, revenue, roas } = perf(insights);
        const impressions = parseInt(insights?.impressions ?? "0");
        const clicks = parseInt(insights?.clicks ?? "0");
        const reach = parseInt(insights?.reach ?? "0");
        const frequency = insights?.frequency ? parseFloat(insights.frequency) : null;
        const cpm = insights?.cpm ? parseFloat(insights.cpm) : null;
        const cpc = insights?.cpc ? parseFloat(insights.cpc) : null;

        // cost per result — prefer Meta's purchase cost, else derive from spend/conv
        const cprRow = (insights?.cost_per_action_type ?? []).find((a: any) => isPurchase(a.action_type));
        const cost_per_result = cprRow
          ? parseFloat(cprRow.value)
          : (conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : null);

        const cid = campaign.id;
        const adset = adsetMap[cid] ?? null;
        const health = classifyHealth(roas, spend, conversions);

        snapshots.push({
          client_id,
          platform: "meta",
          campaign_id: cid,
          campaign_name: campaign.name,
          status: campaign.status.toLowerCase(),
          spend: Math.round(spend * 100) / 100,
          impressions,
          clicks,
          conversions,
          revenue: Math.round(revenue * 100) / 100,
          roas: Math.round(roas * 100) / 100,
          // NOTE: ctr and cpa are GENERATED columns in campaign_snapshots —
          // never write them; Postgres computes them. We persist cpc (plain
          // column) and cost_per_result (plain) instead.
          cpc: cpc != null ? Math.round(cpc * 100) / 100 : null,
          reach,
          frequency: frequency != null ? Math.round(frequency * 100) / 100 : null,
          cpm: cpm != null ? Math.round(cpm * 100) / 100 : null,
          cost_per_result,
          objective: campaign.objective ?? null,
          bid_strategy: adset?.bid_strategy ?? null,
          daily_budget: adset && adset.daily_budget > 0 ? Math.round(adset.daily_budget * 100) / 100 : null,
          demographic_breakdown: demoMap[cid] ?? [],
          placement_breakdown: placeMap[cid] ?? [],
          daily_trend: trendMap[cid] ?? [],
          health,
          snapshot_date: until,
          synced_at: new Date().toISOString(),
        });

        totalSynced++;
      }
    }

    if (snapshots.length > 0) {
      const { error: upsertErr } = await supabase
        .from("campaign_snapshots")
        .upsert(snapshots, { onConflict: "client_id,campaign_id,snapshot_date" });

      if (upsertErr) {
        await supabase.from("sync_logs").update({
          status: "failed",
          error_message: upsertErr.message,
          completed_at: new Date().toISOString(),
        }).eq("id", syncLogId);
        return new Response(JSON.stringify({ error: upsertErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    await supabase.from("ad_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", conn.id);

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
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Sync error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
