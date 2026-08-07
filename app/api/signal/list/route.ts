import { NextResponse } from 'next/server'
import { requireAdmin, serviceClient } from '../../../../lib/signal-admin'

export const dynamic = 'force-dynamic'

// GET /api/signal/list — recent daily drops + recent weekly episodes (admin only).
export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? 'Not signed in' : 'Admin only' },
      { status: gate.status },
    )
  }

  const svc = serviceClient()
  const cols = 'id, content_date, angle, payload, posted, created_at'

  const [daily, episodes] = await Promise.all([
    svc.from('signal_content').select(cols).eq('content_type', 'daily').order('content_date', { ascending: false }).limit(60),
    svc.from('signal_content').select(cols).eq('content_type', 'episode').order('created_at', { ascending: false }).limit(12),
  ])

  if (daily.error) return NextResponse.json({ error: daily.error.message }, { status: 500 })
  return NextResponse.json({ items: daily.data ?? [], episodes: episodes.data ?? [] })
}
