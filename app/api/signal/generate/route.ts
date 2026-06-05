import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAdmin, serviceClient } from '../../../../lib/signal-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Rotating lens so each day's content feels fresh.
const ANGLES = ['proof', 'education', 'contrarian', 'behind-the-scenes', 'build-in-public'] as const

const ANGLE_BRIEF: Record<string, string> = {
  proof: 'Lead with evidence — real numbers, before/after, the exact waste VAI catches. Make the reader feel the receipts.',
  education: 'Teach one sharp, non-obvious thing about Meta performance (frequency, ROAS, creative fatigue, attribution). Useful even if they never buy.',
  contrarian: 'Take a defensible against-the-grain position (e.g. "more budget is not the answer", "dashboards lie"). Back it with reasoning, never snark.',
  'behind-the-scenes': 'Builder energy — what we are shipping inside VV, how the intelligence works, the craft. Quietly confident, not braggy.',
  'build-in-public': 'Share a real metric, decision, or lesson from building VV itself. Transparent, founder-voice, specific.',
}

// UTC day-of-year so the angle + date line up deterministically across the app.
function dayOfYearUTC(): number {
  const start = Date.UTC(new Date().getUTCFullYear(), 0, 0)
  return Math.floor((Date.now() - start) / 86_400_000)
}
function todayStrUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

const SYSTEM = `You are the voice of Vanguard Visuals (VV) — an elite Meta Ads intelligence firm whose product, VAI, reads a brand's entire ad account and tells them in plain English what's working, what's bleeding money, and exactly what to do next, every Monday.

VOICE: premium, editorial, confident — an intelligence firm, not a hype-house. Plain English, never jargon-soup. Never salesy, never cringe, no emoji spam, no "🚀", no "Let's gooo", no fake urgency, no growth-bro clichés. Short sentences with weight. The smartest, calmest person in the room who already knows the answer. Concrete numbers and scenarios beat adjectives.

Never fabricate client names or testimonials. Illustrative numbers (e.g. "$3,200/mo at 1.8x ROAS") are fine; real-sounding named case studies are not.

The audit link is: vngrdvisuals.com/audit`

function buildUserPrompt(angle: string, brief: string): string {
  return `Today's ANGLE is "${angle}". ${brief}
Build ONE core idea/insight for today and express it across everything below. Return a SINGLE JSON object — no prose, no markdown fences. Exact shape:

{
  "core_idea": "one sentence — the single insight all of today's content expresses",
  "post": {
    "x": "tweet under 280 chars TOTAL incl hashtags; 1-3 hashtags",
    "linkedin": "story or insight format with line breaks; soft CTA to the audit at vngrdvisuals.com/audit; 3-5 hashtags at the end",
    "instagram": "punchy caption; 8-12 hashtags at the end",
    "tiktok": { "caption": "caption with 3-5 hashtags", "on_screen_text": "the on-screen text overlay suggestion" }
  },
  "carousel": {
    "title": "the carousel's working title",
    "slides": ["exact text for slide 1", "exact text for slide 2", "...5-6 slides total, each slide's full text written out"],
    "instagram_caption": "IG caption for the carousel with 8-12 hashtags",
    "tiktok_caption": "TikTok caption for the carousel with 3-5 hashtags",
    "image_prompts": [{ "slide": 1, "prompt": "copyable image-generation prompt for any slide that needs a visual — dark, premium, editorial, gold accents, cinematic VV aesthetic; subject, mood, composition, palette, any text overlay" }]
  },
  "reel": {
    "concept": "one line — what the reel is",
    "hook": "the spoken/on-screen hook line for the first 3 seconds",
    "shots": ["shot 1: exactly what to screen-record or say to camera", "shot 2: ...", "...practical shots the team can film in under 20 minutes total"],
    "on_screen_captions": ["on-screen caption beat 1", "beat 2", "..."],
    "instagram_caption": "IG caption for the reel with 8-12 hashtags",
    "tiktok_caption": "TikTok caption for the reel with 3-5 hashtags"
  }
}

RULES:
- All four "post" variations express the SAME core idea, adapted per platform — not four different ideas.
- The carousel is IG + TikTok only. 5-6 slides, each slide's exact on-slide text fully written. Add an image prompt only for slides that genuinely need a visual.
- The reel must be shootable in under 20 minutes — screen-recordings of VAI output or simple talk-to-camera. Keep shot instructions concrete and practical.
- X stays strictly under 280 characters total including hashtags.
- Hashtags tasteful and relevant (e.g. #MetaAds #PerformanceMarketing #DTC #ROAS #PaidSocial), never spammy, no emoji clutter.

Return ONLY the JSON object.`
}

type DailyContent = {
  core_idea?: string
  post?: { x?: string; linkedin?: string; instagram?: string; tiktok?: { caption?: string; on_screen_text?: string } }
  carousel?: { title?: string; slides?: string[]; instagram_caption?: string; tiktok_caption?: string; image_prompts?: { slide?: number; prompt?: string }[] }
  reel?: { concept?: string; hook?: string; shots?: string[]; on_screen_captions?: string[]; instagram_caption?: string; tiktok_caption?: string }
}

// POST /api/signal/generate  { force?: boolean }
// One Claude call → the full day's structured content, cached per date in signal_content.
export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? 'Not signed in' : 'Admin only' },
      { status: gate.status },
    )
  }

  const { force } = await req.json().catch(() => ({ force: false }))
  const date = todayStrUTC()
  const angle = ANGLES[dayOfYearUTC() % ANGLES.length]
  const svc = serviceClient()

  // Cache: re-opening / non-forced calls never burn an API call if today already exists.
  const { data: existing } = await svc
    .from('signal_content')
    .select('id, content_date, angle, payload, posted, created_at')
    .eq('content_type', 'daily')
    .eq('content_date', date)
    .limit(1)
    .maybeSingle()

  if (existing && !force) {
    return NextResponse.json({ cached: true, item: existing })
  }

  // ── exactly ONE Claude call ──
  const angleBrief = ANGLE_BRIEF[angle]
  let parsed: DailyContent | null = null
  let rawError = ''
  try {
    const anthropic = new Anthropic()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: 'user', content: buildUserPrompt(angle, angleBrief) }],
    })
    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    parsed = JSON.parse(cleaned)
  } catch (e: any) {
    rawError = e?.message || String(e)
  }

  if (!parsed || (!parsed.post && !parsed.carousel && !parsed.reel)) {
    return NextResponse.json(
      { error: `Generation failed${rawError ? `: ${rawError}` : ''}. Check ANTHROPIC_API_KEY.` },
      { status: 502 },
    )
  }

  // Defensive clamp: X strictly under 280.
  if (parsed.post?.x) parsed.post.x = String(parsed.post.x).slice(0, 280)

  // Per-item "posted" checklist lives inside the payload under _posted, keyed by
  // item id (e.g. "post:x", "carousel:ig", "reel:tiktok"). Regenerating resets it.
  ;(parsed as any)._posted = {}

  // One row per day. The legacy platform/content columns stay non-null to satisfy
  // NOT NULL constraints; the real content lives in payload (jsonb).
  const row = {
    platform: 'daily',
    content: parsed.core_idea ? String(parsed.core_idea) : 'Daily VV Signal content',
    content_type: 'daily',
    content_date: date,
    angle,
    payload: parsed as any,
    posted: false,
    used: false,
  }

  let saved: any = null
  if (existing) {
    const { data, error } = await svc
      .from('signal_content')
      .update(row)
      .eq('id', existing.id)
      .select('id, content_date, angle, payload, posted, created_at')
      .maybeSingle()
    if (error) return NextResponse.json({ error: `Save failed: ${error.message}` }, { status: 500 })
    saved = data
  } else {
    const { data, error } = await svc
      .from('signal_content')
      .insert(row)
      .select('id, content_date, angle, payload, posted, created_at')
      .maybeSingle()
    if (error) return NextResponse.json({ error: `Save failed: ${error.message}` }, { status: 500 })
    saved = data
  }

  return NextResponse.json({ cached: false, item: saved })
}
