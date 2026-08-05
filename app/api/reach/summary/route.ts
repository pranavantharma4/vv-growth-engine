import { NextResponse } from 'next/server'
import { requireAdmin, serviceClient } from '../../../../lib/signal-admin'

export const dynamic = 'force-dynamic'

// GET /api/reach/summary — read-only outreach snapshot (admin only).
// All aggregation happens in the public.reach_summary() SECURITY DEFINER
// function so the outreach schema never has to be exposed to PostgREST.
export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? 'Not signed in' : 'Admin only' },
      { status: gate.status },
    )
  }

  const svc = serviceClient()
  const { data, error } = await svc.rpc('reach_summary')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ summary: data })
}
