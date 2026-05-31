import { NextResponse } from 'next/server'
import { requireAdmin, serviceClient } from '../../../../lib/signal-admin'

export const dynamic = 'force-dynamic'

// GET /api/signal/list — most recent generations (admin only).
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
    .select('id, platform, content, angle, created_at, used')
    .order('created_at', { ascending: false })
    .limit(120)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}
