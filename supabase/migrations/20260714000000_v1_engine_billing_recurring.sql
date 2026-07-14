-- ────────────────────────────────────────────────────────────────────────────
-- VV Growth Ad Engine v1 — paid, standalone product
-- Additive migration: self-serve billing, recurring analysis snapshots,
-- change detection, report recipients, Founders Program seat counter.
-- Safe to run on prod (project ofqnhlkjazlsfctldbng): only ADD COLUMN / CREATE.
-- Nothing here drops or rewrites existing data.
-- ────────────────────────────────────────────────────────────────────────────

-- ── 1. clients: billing + analysis cadence ──────────────────────────────────
-- Entitlement (single source of truth): an account has access when
--   is_founder = true  OR  subscription_status in ('trialing','active').
alter table public.clients
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status    text    not null default 'none',
        -- none | trialing | active | past_due | canceled
  add column if not exists trial_ends_at          timestamptz,
  add column if not exists current_period_end     timestamptz,
  add column if not exists is_founder             boolean not null default false,
  add column if not exists founder_granted_at     timestamptz,
  add column if not exists analysis_cadence       text    not null default 'weekly',
        -- weekly | biweekly | monthly | off
  add column if not exists next_run_at            timestamptz,
  add column if not exists report_send_day        smallint not null default 1; -- 1 = Monday

comment on column public.clients.subscription_status is
  'none|trialing|active|past_due|canceled — with is_founder, drives dashboard access';
comment on column public.clients.is_founder is
  'Admin-grantable free-for-life flag. Bypasses billing entirely.';

-- ── 2. analysis_runs: one row per recurring (or manual) analysis run ─────────
-- The snapshot "envelope": every re-analysis produces one run, and the
-- campaign rows for that run point back to it via campaign_snapshots.run_id.
create table if not exists public.analysis_runs (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  run_at        timestamptz not null default now(),
  triggered_by  text not null default 'cron',   -- cron | manual
  cadence       text,                            -- snapshot of cadence at run time
  status        text not null default 'complete',-- running | complete | error
  summary       jsonb,                           -- totals, counts by health, biggest leak
  created_at    timestamptz not null default now()
);
create index if not exists analysis_runs_client_run_idx
  on public.analysis_runs(client_id, run_at desc);

-- Tie each campaign snapshot to the run that produced it (null for legacy rows).
alter table public.campaign_snapshots
  add column if not exists run_id uuid references public.analysis_runs(id) on delete set null;
create index if not exists campaign_snapshots_run_idx
  on public.campaign_snapshots(run_id);

-- ── 3. run_changes: what changed vs the previous run (change detection) ──────
create table if not exists public.run_changes (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references public.analysis_runs(id) on delete cascade,
  client_id     uuid not null references public.clients(id) on delete cascade,
  campaign_name text,
  change_type   text,   -- state_flip | new_leak | resolved | cpa_trend | scaling_candidate
  prev_health   text,
  new_health    text,
  detail        jsonb,  -- { prev: {...}, curr: {...}, delta: {...} }
  created_at    timestamptz not null default now()
);
create index if not exists run_changes_run_idx on public.run_changes(run_id);
create index if not exists run_changes_client_idx on public.run_changes(client_id);

-- ── 4. report_recipients: who receives the emailed report ───────────────────
create table if not exists public.report_recipients (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  email      text not null,
  label      text,             -- e.g. "Partner", "Client"
  added_at   timestamptz not null default now(),
  unique (client_id, email)
);
create index if not exists report_recipients_client_idx
  on public.report_recipients(client_id);

-- Link a generated report back to the run that produced it.
alter table public.weekly_briefs
  add column if not exists run_id uuid references public.analysis_runs(id) on delete set null;

-- ── 5. Founders Program — public live seat counter + private claims ─────────
-- Single public row the landing page reads (and subscribes to via realtime).
create table if not exists public.founders_program (
  id            smallint primary key default 1 check (id = 1),
  seats_total   smallint not null default 4,
  seats_claimed smallint not null default 0,
  updated_at    timestamptz not null default now()
);
insert into public.founders_program (id, seats_total, seats_claimed)
  values (1, 4, 0)
  on conflict (id) do nothing;

-- One row per claimed seat (private — never exposed to anon).
create table if not exists public.founders_seats (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.clients(id) on delete set null,
  brand      text,
  claimed_at timestamptz not null default now()
);

-- Keep the public counter in sync with claimed rows.
create or replace function public.sync_founders_claimed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.founders_program
     set seats_claimed = (select count(*) from public.founders_seats),
         updated_at    = now()
   where id = 1;
  return null;
end;
$$;

drop trigger if exists trg_founders_seats on public.founders_seats;
create trigger trg_founders_seats
  after insert or delete on public.founders_seats
  for each row execute function public.sync_founders_claimed();

-- ── 6. Row-Level Security ───────────────────────────────────────────────────
-- Reads from the dashboard use the user's session; writes to run/change tables
-- happen from edge functions using the service role (which bypasses RLS).

alter table public.analysis_runs     enable row level security;
alter table public.run_changes       enable row level security;
alter table public.report_recipients enable row level security;
alter table public.founders_program  enable row level security;
alter table public.founders_seats    enable row level security;

-- Members of a client can read that client's runs / changes.
drop policy if exists "members read analysis_runs" on public.analysis_runs;
create policy "members read analysis_runs" on public.analysis_runs
  for select using (
    client_id in (select client_id from public.client_users where user_id = auth.uid())
  );

drop policy if exists "members read run_changes" on public.run_changes;
create policy "members read run_changes" on public.run_changes
  for select using (
    client_id in (select client_id from public.client_users where user_id = auth.uid())
  );

-- Members can manage their own report recipient list.
drop policy if exists "members read recipients" on public.report_recipients;
create policy "members read recipients" on public.report_recipients
  for select using (
    client_id in (select client_id from public.client_users where user_id = auth.uid())
  );
drop policy if exists "members write recipients" on public.report_recipients;
create policy "members write recipients" on public.report_recipients
  for all using (
    client_id in (select client_id from public.client_users where user_id = auth.uid())
  ) with check (
    client_id in (select client_id from public.client_users where user_id = auth.uid())
  );

-- The seat counter is public (anon + authenticated may read the number only).
drop policy if exists "public reads counter" on public.founders_program;
create policy "public reads counter" on public.founders_program
  for select using (true);

-- founders_seats: no policies => only the service role can read/write claims.

-- ── 7. Realtime: push counter changes to the landing page ───────────────────
alter publication supabase_realtime add table public.founders_program;
