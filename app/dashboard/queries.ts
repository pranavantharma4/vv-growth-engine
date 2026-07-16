'use client'
// Central React Query layer for the dashboard. Every tab used to re-run its
// own Supabase fetch on mount (useEffect), so switching back to a tab you'd
// already visited always hit the network again and showed a spinner. These
// hooks move that data into a shared QueryClient (provider lives in layout.tsx,
// ABOVE the per-tab routes) so a revisited tab renders from cache instantly and
// only revalidates in the background. Keys are scoped by client id so switching
// the active client never shows another client's data.
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { carryForwardManualCampaigns } from '@/lib/manual-campaigns'

// One shared browser Supabase client for all dashboard queries.
const supabase = createClientComponentClient()

// Query-key factory — keep every key here so prefetch + invalidate stay in sync.
export const qk = {
  dashboard: (clientId?: string) => ['dashboard', clientId] as const,
  campaigns: (clientId?: string) => ['campaigns', clientId] as const,
  latestBrief: (clientId?: string) => ['latest-brief', clientId] as const,
  reports: (clientId?: string) => ['reports', clientId] as const,
  optimizeHistory: (clientId?: string) => ['optimize-history', clientId] as const,
}

// Latest available snapshot date for a client — NOT strictly today, so the UI
// never goes blank on a day the daily sync hasn't run yet. Shared by every
// campaign-reading query below.
async function latestSnapshotDay(clientId: string): Promise<string> {
  const { data } = await supabase
    .from('campaign_snapshots')
    .select('snapshot_date')
    .eq('client_id', clientId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.snapshot_date || new Date().toISOString().split('T')[0]
}

async function fetchCampaigns(clientId: string) {
  const day = await latestSnapshotDay(clientId)
  const { data } = await supabase
    .from('campaign_snapshots')
    .select('*')
    .eq('client_id', clientId)
    .eq('snapshot_date', day)
    .order('spend', { ascending: false })
  return data || []
}

// Dashboard home needs campaigns + the latest brief together. It also carries
// forward manually-entered campaigns first (side effect preserved from the old
// inline load()).
async function fetchDashboard(clientId: string) {
  await carryForwardManualCampaigns(supabase, clientId).catch(() => {})
  const day = await latestSnapshotDay(clientId)
  const [campsRes, briefRes] = await Promise.all([
    supabase
      .from('campaign_snapshots')
      .select('*')
      .eq('client_id', clientId)
      .eq('snapshot_date', day)
      .order('spend', { ascending: false }),
    supabase
      .from('weekly_briefs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  return { campaigns: campsRes.data || [], brief: briefRes.data || null }
}

async function fetchLatestBrief(clientId: string) {
  const { data } = await supabase
    .from('weekly_briefs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data || null
}

async function fetchReports(clientId: string) {
  const { data } = await supabase
    .from('weekly_briefs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return data || []
}

async function fetchOptimizeHistory(clientId: string) {
  const { data } = await supabase
    .from('optimization_blueprints')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return data || []
}

// ---- Hooks --------------------------------------------------------------

export function useDashboardData(clientId?: string) {
  return useQuery({
    queryKey: qk.dashboard(clientId),
    queryFn: () => fetchDashboard(clientId as string),
    enabled: !!clientId,
  })
}

export function useCampaigns(clientId?: string) {
  return useQuery({
    queryKey: qk.campaigns(clientId),
    queryFn: () => fetchCampaigns(clientId as string),
    enabled: !!clientId,
  })
}

export function useLatestBrief(clientId?: string) {
  return useQuery({
    queryKey: qk.latestBrief(clientId),
    queryFn: () => fetchLatestBrief(clientId as string),
    enabled: !!clientId,
  })
}

export function useReports(clientId?: string) {
  return useQuery({
    queryKey: qk.reports(clientId),
    queryFn: () => fetchReports(clientId as string),
    enabled: !!clientId,
  })
}

export function useOptimizeHistory(clientId?: string) {
  return useQuery({
    queryKey: qk.optimizeHistory(clientId),
    queryFn: () => fetchOptimizeHistory(clientId as string),
    enabled: !!clientId,
  })
}

// Prefetch helper — warm a tab's cache before the user clicks it (e.g. on nav
// hover, or right after the dashboard mounts) so the first visit is already
// instant. Takes the layout's QueryClient directly so it can be called from
// event handlers. Safe to call repeatedly; React Query dedupes + respects
// staleTime, so an already-cached tab is a no-op.
export function warmTab(qc: QueryClient, path: string, clientId?: string) {
  if (!clientId) return
  if (path.endsWith('/dashboard')) qc.prefetchQuery({ queryKey: qk.dashboard(clientId), queryFn: () => fetchDashboard(clientId) })
  else if (path.endsWith('/campaigns')) qc.prefetchQuery({ queryKey: qk.campaigns(clientId), queryFn: () => fetchCampaigns(clientId) })
  else if (path.endsWith('/reports')) qc.prefetchQuery({ queryKey: qk.reports(clientId), queryFn: () => fetchReports(clientId) })
  else if (path.endsWith('/brief')) qc.prefetchQuery({ queryKey: qk.latestBrief(clientId), queryFn: () => fetchLatestBrief(clientId) })
  else if (path.endsWith('/optimize')) qc.prefetchQuery({ queryKey: qk.optimizeHistory(clientId), queryFn: () => fetchOptimizeHistory(clientId) })
}
