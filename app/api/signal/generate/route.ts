import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAdmin, serviceClient } from '../../../../lib/signal-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Rotating lens so each day's batch feels fresh.
const ANGLES = ['proof', 'education', 'behind-the-scenes', 'provocative', 'contrarian'] as const

const ANGLE_BRIEF: Record<string, string> = {
  proof: 'Lead with evidence — real numbers, before/after, the exact waste VAI catches. Make the reader feel the receipts.',
  education: 'Teach one sharp, non-obvious thing about Meta performance (frequency, ROAS, creative fatigue, attribution). Useful even if they never buy.',
  'behind-the-scenes': 'Builder energy — what we are shipping inside VV, how the intelligence works, the craft. Quietly confident, not braggy.',
  provocative: 'Name the uncomfortable truth about how much ad spend is quietly bleeding. Pattern-interrupt hooks. Never insulting — sharp, not snarky.',
  contrarian: 'Take the defensible against-the-grain position (e.g. "more budget is not the answer", "dashboards lie"). Back it with reasoning.',
}

function dayOfYearUTC(): number {
  const now = new Date()
  const start = Date.UTC(now.getUTCFullYear(), 0, 0)
  return Math.floor((Date.now() - start) / 86_400_000)
}

export async function POST() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? 'Not signed in' : 'Admin only' },
      { status: gate.status },
    )
  }

  const angle = ANGLES[dayOfYearUTC() % ANGLES.length]
  const angleBrief = ANGLE_BRIEF[angle]

  const anthropic = new Anthropic()

  const system = `You are the voice of Vanguard Visuals (VV) — an elite Meta Ads intelligence firm whose product, VAI, reads a brand's entire ad account and tells them in plain English what's working, what's bleeding money, and exactly what to do next, every Monday.

VOICE: premium, editorial, confident. The voice of an intelligence firm, not a hype-house. Plain English, never jargon-soup. Never salesy, never cringe, no emoji spam, no "🚀", no "Let's gooo", no fake urgency, no growth-bro clichés. Short sentences with weight. You sound like the smartest, calmest person in the room who already knows the answer. Specific over vague — concrete numbers and scenarios beat adjectives.

Never fabricate specific client names or testimonials. Illustrative numbers (e.g. "$3,200/mo at 1.8x ROAS") are fine as examples; real-sounding named case studies are not.

The audit link is: vngrdvisuals.com/audit`

  const user = `Today's ANGLE OF THE DAY is "${angle}". ${angleBrief}
Bias the set toward this lens while keeping variety.

Generate VV's marketing content for today as a single JSON object — no prose, no markdown fences. Exact shape:
{
  "x": [ 15 strings ],
  "linkedin": [ 5 strings ],
  "instagram": [ 3 objects, each { "caption": "...", "image_prompt": "..." } ]
}

X (15 posts):
- Each under 280 characters TOTAL including hashtags. Hard limit.
- A varied mix: provocative hooks about wasted ad spend; plain-English insights about Meta campaign performance; behind-the-scenes of building VV; proof-style posts.
- Vary the form: some are single one-liners; a few are mini-threads (use "\\n\\n" line breaks within the one string to separate beats — still under 280 total).
- 3-4 of them should end with the link vngrdvisuals.com/audit (only some — not all).
- Each post ends with 1-3 strategic, relevant hashtags (e.g. #MetaAds #PerformanceMarketing #DTC #ROAS). Tasteful, never spammy. No emoji clutter.

LinkedIn (5 posts):
- Longer, professional, story-driven. A clear narrative or insight with a point.
- Use line breaks for readability.
- Each ends with a SOFT call to action pointing to the free audit at vngrdvisuals.com/audit, then 3-5 relevant professional hashtags (e.g. #PerformanceMarketing #PaidSocial #Ecommerce #MarketingStrategy).

Instagram (3 posts) — each is an OBJECT with two fields:
- "caption": punchy, scroll-stopping, designed to pair with a visual. End each caption with 8-12 relevant, reach-optimizing hashtags (mix broad + niche, e.g. #MetaAds #PerformanceMarketing #DTCbrands #EcommerceMarketing #AdSpend #ROAS #DigitalMarketing #MarketingTips #PaidAds #ScalingBrands).
- "image_prompt": a ready-to-paste image-generation prompt the admin can paste straight into Claude or an image tool to create the matching visual. Be concrete and on-brand: dark, premium, editorial, gold accents, cinematic, the VV aesthetic; describe subject, mood, composition, palette, and any text overlay. One vivid paragraph.

Return ONLY the JSON object.`

  let parsed: { x?: string[]; linkedin?: string[]; instagram?: any[] } | null = null
  let rawError = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    parsed = JSON.parse(cleaned)
  } catch (e: any) {
    rawError = e?.message || String(e)
  }

  if (!parsed || (!parsed.x && !parsed.linkedin && !parsed.instagram)) {
    return NextResponse.json(
      { error: `Generation failed${rawError ? `: ${rawError}` : ''}. Check ANTHROPIC_API_KEY.` },
      { status: 502 },
    )
  }

  // Flatten into rows, clamp X to 280 chars defensively.
  const rows: { platform: string; content: string; angle: string; image_prompt?: string | null }[] = []
  for (const c of (parsed.x || [])) {
    const t = String(c).trim()
    if (t) rows.push({ platform: 'x', content: t.slice(0, 280), angle })
  }
  for (const c of (parsed.linkedin || [])) {
    const t = String(c).trim()
    if (t) rows.push({ platform: 'linkedin', content: t, angle })
  }
  for (const ig of (parsed.instagram || [])) {
    // Instagram items are objects { caption, image_prompt }; tolerate plain strings too.
    const caption = typeof ig === 'string' ? ig : String(ig?.caption ?? '')
    const imgPrompt = typeof ig === 'string' ? null : (ig?.image_prompt ? String(ig.image_prompt) : null)
    const t = caption.trim()
    if (t) rows.push({ platform: 'instagram', content: t, angle, image_prompt: imgPrompt })
  }

  const svc = serviceClient()
  const { data: inserted, error: insErr } = await svc
    .from('signal_content')
    .insert(rows)
    .select('id, platform, content, angle, created_at, used, image_prompt')

  if (insErr) {
    return NextResponse.json({ error: `Saved-to-DB failed: ${insErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ angle, count: inserted?.length ?? 0, items: inserted ?? [] })
}
