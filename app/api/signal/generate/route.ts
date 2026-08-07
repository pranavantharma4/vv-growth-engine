import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAdmin, serviceClient } from '../../../../lib/signal-admin'
import {
  VV_VOICE, VV_EDGE,
  CAROUSEL_PILLARS, PILLAR_BRIEF, type CarouselPillar,
} from '../../../../lib/signal-knowledge'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const MODEL = 'claude-sonnet-4-6'

// UTC day-of-year / week so rotation + dates line up deterministically.
function dayOfYearUTC(): number {
  const start = Date.UTC(new Date().getUTCFullYear(), 0, 0)
  return Math.floor((Date.now() - start) / 86_400_000)
}
function todayStrUTC(): string {
  return new Date().toISOString().slice(0, 10)
}
// ISO-week key like "2026-W32" — the identity of a weekly episode.
function isoWeekKeyUTC(): string {
  const d = new Date()
  const day = (d.getUTCDay() + 6) % 7 // Mon=0
  const thursday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3))
  const year = thursday.getUTCFullYear()
  const firstThursday = new Date(Date.UTC(year, 0, 4))
  const week = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

const anthropic = new Anthropic()

async function callClaude(system: string, user: string): Promise<{ parsed: any | null; error: string }> {
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    return { parsed: JSON.parse(cleaned), error: '' }
  } catch (e: any) {
    return { parsed: null, error: e?.message || String(e) }
  }
}

// ── DAILY DROP: value carousel + single post ──────────────────────────────
// Engagement is NOT generated. The engagement checklist is built client-side
// from the editable standing list — you read each real post and reply yourself,
// so there is no pre-written reply text to generate.
function buildDailyPrompt(pillar: CarouselPillar): string {
  return `Produce today's VV Signal daily drop. Return a SINGLE JSON object — no prose, no markdown fences.

Today's CAROUSEL PILLAR is "${pillar}". ${PILLAR_BRIEF[pillar]}

${VV_EDGE}

── PART 1 — VALUE CAROUSEL (the centerpiece) ──
6–8 slides of INSANE, VV-only value on the "${pillar}" pillar.
- Slide 1 is the HOOK: eye-catching and polarizing — challenge a belief media buyers hold. It earns the swipe or it failed. NEVER generic ("5 tips").
- Every slide = one punchy idea in plain English, built on specific numbers/mechanisms from VV's edge above. Single-stat, screenshot-worthy slides are ideal.
- The carousel builds to a payoff.
- Last slide = a soft value-CTA, not salesy (e.g. "This is what VV reads automatically" / "Run yours — link in bio").
- For EACH slide, write an IMAGE PROMPT for a designer: VV dark editorial aesthetic, gold accent (#c9a84c) on near-black (#050509), cinematic, one bold stat or line per frame. Specify subject, composition, mood, and any on-frame text.

── PART 2 — SINGLE POST (the quick daily post) ──
ONE strong standalone post. YOU pick the single format that will get the most engagement today: contrarian one-liner, a single stat + insight, a short build-in-public note, or a mini-teardown. State which format you chose.
- X + LinkedIn are the PRIMARY platforms.
- X: 1–2 hashtags max, and the post body must NOT contain a link — if a link belongs, put it in a separate "first_reply" field to post as the first reply.
- LinkedIn: a strong hook as the first line, short punchy lines, 3–5 hashtags at the end.
- Include an image_prompt only if the post genuinely needs a visual (else empty string).

EXACT JSON SHAPE:
{
  "carousel": {
    "title": "working title",
    "slides": [{ "text": "exact on-slide text", "image_prompt": "designer image prompt for this slide" }],
    "cta": "the soft value-CTA line (also the last slide's text)",
    "ig_caption": "Instagram caption for the carousel, 8–12 hashtags",
    "tiktok_caption": "TikTok caption, 3–5 hashtags"
  },
  "single_post": {
    "format": "which format you chose and why in <=8 words",
    "x": { "body": "the X post, no link in body, 1–2 hashtags", "first_reply": "the link/CTA to post as first reply, or empty string" },
    "linkedin": "the LinkedIn post — hook first line, short lines, 3–5 hashtags",
    "image_prompt": "image prompt if it needs a visual, else empty string"
  }
}

Return ONLY the JSON object.`
}

// ── WEEKLY EPISODE: full script + recording notes + daily reel breakdown ──
function buildEpisodePrompt(weekKey: string): string {
  return `Produce this week's VV "Read Your Account" episode (${weekKey}) — a filmable short-doc episode plus the reels cut from it. Return a SINGLE JSON object, no prose, no fences.

${VV_EDGE}

THE EPISODE:
- COLD OPEN: a polarizing hook for the first 10 seconds that stops the scroll — challenge a media-buyer belief, tied to a real leak.
- 3 SEGMENTS, ~45 seconds each. Each segment teaches ONE Meta-ads leak/insight from VV's edge above (e.g. the WEAK trap, frequency fatigue, the overlap tax, dead placements, the CPA ceiling). Write the FULL spoken script for each — VV voice, plain English, concrete numbers.
- BRIDGES: one line to transition into each segment.
- CLOSE: land the throughline + a soft value line (not salesy).
- NEXT-EP TEASE: one line teasing next week.

RECORDING NOTES:
- SETUP: white wall, horizontal 4K, mic, moody exposure, plain dark top. State it concisely.
- PER SEGMENT: how to deliver it and what to emphasize.

ANIMATION / VISUAL CUES:
- Inside each segment's script, mark exactly where a UI walkthrough or animated stat belongs using bracket tags like "[UI: Placements breakdown — dead placement in red]" or "[STAT: frequency 3.8x rising]". Put the segment's cue list in its "ui_cues" array too, so the editor knows what to build after filming.

DAILY REEL BREAKDOWN:
- Split the episode into 3–5 short reels (one per day). For each reel: the HOOK line (first 3 seconds), WHICH segment/clip it pulls from, the ON-SCREEN CAPTION text, and a 1-line POST CAPTION. Each reel must stand alone.

EXACT JSON SHAPE:
{
  "title": "episode title",
  "cold_open": "the full cold-open script (first ~10s)",
  "segments": [
    { "title": "segment title", "script": "full spoken script with inline [UI:…]/[STAT:…] cues", "bridge": "one-line bridge into this segment", "ui_cues": ["cue 1", "cue 2"] }
  ],
  "close": "the closing script",
  "next_tease": "one-line tease for next week",
  "recording_notes": { "setup": "the setup line", "per_segment": ["how to deliver segment 1", "segment 2", "segment 3"] },
  "reels": [
    { "hook": "first-3-seconds hook line", "source": "which segment/clip it pulls from", "on_screen_caption": "on-screen caption text", "post_caption": "1-line post caption" }
  ]
}

Return ONLY the JSON object.`
}

// POST /api/signal/generate  { section: 'daily' | 'episode', force? }
export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.status === 401 ? 'Not signed in' : 'Admin only' },
      { status: gate.status },
    )
  }

  const body = await req.json().catch(() => ({}))
  const section: 'daily' | 'episode' = body?.section === 'episode' ? 'episode' : 'daily'
  const force = !!body?.force
  const svc = serviceClient()

  if (section === 'episode') {
    const weekKey = isoWeekKeyUTC()
    const { data: existing } = await svc
      .from('signal_content')
      .select('id, content_date, angle, payload, posted, created_at')
      .eq('content_type', 'episode')
      .eq('angle', weekKey)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (existing && !force) return NextResponse.json({ cached: true, item: existing })

    const { parsed, error } = await callClaude(VV_VOICE, buildEpisodePrompt(weekKey))
    if (!parsed || !Array.isArray(parsed.segments)) {
      return NextResponse.json(
        { error: `Episode generation failed${error ? `: ${error}` : ''}. Check ANTHROPIC_API_KEY.` },
        { status: 502 },
      )
    }
    parsed._posted = {}
    const row = {
      platform: 'episode',
      content: parsed.title ? String(parsed.title) : `VV episode ${weekKey}`,
      content_type: 'episode',
      content_date: todayStrUTC(),
      angle: weekKey,
      payload: parsed,
      posted: false,
      used: false,
    }
    const saved = await upsert(svc, existing?.id, row)
    if ('error' in saved) return NextResponse.json({ error: saved.error }, { status: 500 })
    return NextResponse.json({ cached: false, item: saved.item })
  }

  // ── daily ──
  const date = todayStrUTC()
  const pillar = CAROUSEL_PILLARS[dayOfYearUTC() % CAROUSEL_PILLARS.length]

  const { data: existing } = await svc
    .from('signal_content')
    .select('id, content_date, angle, payload, posted, created_at')
    .eq('content_type', 'daily')
    .eq('content_date', date)
    .limit(1)
    .maybeSingle()
  if (existing && !force) return NextResponse.json({ cached: true, item: existing })

  const { parsed, error } = await callClaude(VV_VOICE, buildDailyPrompt(pillar))
  if (!parsed || (!parsed.carousel && !parsed.single_post)) {
    return NextResponse.json(
      { error: `Generation failed${error ? `: ${error}` : ''}. Check ANTHROPIC_API_KEY.` },
      { status: 502 },
    )
  }
  parsed.pillar = pillar
  parsed._posted = {}
  const row = {
    platform: 'daily',
    content: parsed.carousel?.title ? String(parsed.carousel.title) : 'VV Signal daily drop',
    content_type: 'daily',
    content_date: date,
    angle: pillar,
    payload: parsed,
    posted: false,
    used: false,
  }
  const saved = await upsert(svc, existing?.id, row)
  if ('error' in saved) return NextResponse.json({ error: saved.error }, { status: 500 })
  return NextResponse.json({ cached: false, item: saved.item })
}

async function upsert(svc: any, existingId: string | undefined, row: any): Promise<{ item: any } | { error: string }> {
  const cols = 'id, content_date, angle, payload, posted, created_at'
  if (existingId) {
    const { data, error } = await svc.from('signal_content').update(row).eq('id', existingId).select(cols).maybeSingle()
    if (error) return { error: `Save failed: ${error.message}` }
    return { item: data }
  }
  const { data, error } = await svc.from('signal_content').insert(row).select(cols).maybeSingle()
  if (error) return { error: `Save failed: ${error.message}` }
  return { item: data }
}
