export type Client = {
  id: string
  name: string
  plan: string
  status: string
  monthly_ad_spend: number | null
  industry: string | null
  contact_email: string | null
  contact_name: string | null
  created_at: string
  updated_at: string
  notification_preferences?: {
    weekly: boolean
    leaks: boolean
    reports: boolean
    sync: boolean
  }
}

export type CampaignSnapshot = {
  id: string
  client_id: string
  platform: string
  campaign_id: string
  campaign_name: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  roas: number
  ctr: number | null
  cpa: number | null
  health: string
  snapshot_date: string
  synced_at: string
}

export type AdConnection = {
  id: string
  client_id: string
  platform: string
  account_id: string | null
  account_name: string | null
  is_active: boolean
  last_synced_at: string | null
}

export type BiggestLeak = {
  client_id: string
  campaign_name: string
  platform: string
  spend: number
  roas: number
  health: string
}

export type ClientHealthSummary = {
  client_id: string
  client_name: string
  plan: string
  status: string
  total_campaigns: number
  strong_count: number
  weak_count: number
  bleeding_count: number
  dead_count: number
  total_spend: number
  wasted_spend: number
  avg_roas: number
  last_synced: string | null
}

export function fmtMoney(n: number): string {
  return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : '$' + Math.round(n)
}

export function roasColor(r: number): string {
  return r >= 3 ? 'var(--green)' : r >= 1.5 ? 'var(--gold)' : 'var(--red)'
}