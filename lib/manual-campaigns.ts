import { SupabaseClient } from '@supabase/supabase-js'

// Dashboard pages filter `campaign_snapshots` by `snapshot_date = today`. The
// Meta sync edge function rewrites a row per active campaign each day, so its
// data is always present for today. Manual entries have no such daemon — so we
// copy the most-recent snapshot per `manual_*` campaign into today on demand.
export async function carryForwardManualCampaigns(
  supabase: SupabaseClient,
  clientId: string,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  const { count } = await supabase
    .from('campaign_snapshots')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('snapshot_date', today)
    .like('campaign_id', 'manual_%')

  if ((count ?? 0) > 0) return

  const { data: recent } = await supabase
    .from('campaign_snapshots')
    .select('campaign_id, campaign_name, platform, spend, impressions, clicks, conversions, revenue, roas, ctr, cpa, health, status')
    .eq('client_id', clientId)
    .like('campaign_id', 'manual_%')
    .order('snapshot_date', { ascending: false })
    .limit(200)

  if (!recent || recent.length === 0) return

  const seen = new Set<string>()
  const toInsert: any[] = []
  for (const row of recent) {
    if (seen.has(row.campaign_id)) continue
    seen.add(row.campaign_id)
    toInsert.push({
      client_id: clientId,
      ...row,
      snapshot_date: today,
      synced_at: new Date().toISOString(),
    })
  }

  if (toInsert.length > 0) {
    await supabase
      .from('campaign_snapshots')
      .upsert(toInsert, { onConflict: 'client_id,campaign_id,snapshot_date' })
  }
}
