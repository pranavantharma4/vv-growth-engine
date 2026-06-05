import { NextResponse } from 'next/server'
import { requireAdmin, serviceClient } from '../../../../lib/signal-admin'

export const dynamic = 'force-dynamic'

// GET /api/signal/list — recent structured daily docs (admin only), newest first.
export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? 'Not signed in' : 'Admin only' },
      { status: gate.status },
    )
  }

  const svc = serviceClient()
  const { data, error } = await svc
    .from('signal_content')
    .select('id, content_date, angle, payload, posted, created_at')
    .eq('content_type', 'daily')
    .order('content_date', { ascending: false })
    .limit(60)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}
