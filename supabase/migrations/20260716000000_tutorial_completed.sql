-- First-run dashboard tutorial (Fix 1c). Per-client flag so the walkthrough
-- shows exactly once, then never again — mirrors the existing
-- onboarding_complete pattern on clients. "Replay tutorial" in Settings uses a
-- client-side flag and does NOT reset this column.
alter table public.clients
  add column if not exists tutorial_completed boolean not null default false;
