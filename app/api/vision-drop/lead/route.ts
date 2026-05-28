import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// POST /api/vision-drop/lead — captures name + email at the start of the funnel.
// Idempotent: re-submitting the same email updates the name (so a prospect that
// abandons and returns from a different device doesn't get a unique-key error).
export async function POST(req: Request) {
  try {
    const { name, email } = await req.json()

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const normalizedEmail = email.trim().toLowerCase()
    const cleanName = name.trim().slice(0, 80)

    const { data, error } = await supabase
      .from('vision_drop_leads')
      .upsert(
        { name: cleanName, email: normalizedEmail },
        { onConflict: 'email' },
      )
      .select('id, name, email, meta_connected')
      .single()

    if (error) {
      console.error('vision_drop lead upsert error:', error)
      return NextResponse.json({ error: 'Could not save lead' }, { status: 500 })
    }

    return NextResponse.json({ lead: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
