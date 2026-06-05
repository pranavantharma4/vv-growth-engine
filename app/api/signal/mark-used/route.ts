import { NextResponse } from 'next/server'
import { requireAdmin, serviceClient } from '../../../../lib/signal-admin'

export const dynamic = 'force-dynamic'

// POST /api/signal/mark-used  { id, key, posted }
// Toggles a single posting-checklist item (e.g. "post:x", "carousel:ig",
// "reel:tiktok") inside the day's payload._posted map (admin only).
export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? 'Not signed in' : 'Admin only' },
      { status: gate.status },
    )
  }

  const { id, key, posted } = await req.json().catch(() => ({}))
  if (!id || !key) return NextResponse.json({ error: 'id and key required' }, { status: 400 })

  const svc = serviceClient()
  const { data: row, error: readErr } = await svc
    .from('signal_content')
    .select('id, payload')
    .eq('id', id)
    .maybeSingle()
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const payload = (row.payload || {}) as any
  const map = { ...(payload._posted || {}) }
  if (posted) map[key] = true
  else delete map[key]
  payload._posted = map

  const { error: updErr } = await svc
    .from('signal_content')
    .update({ payload })
    .eq('id', id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
