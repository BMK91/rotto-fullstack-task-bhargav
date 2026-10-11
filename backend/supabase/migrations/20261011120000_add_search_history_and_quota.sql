alter table public.companies
  add column plan text not null default 'free'
    check (plan in ('free', 'paid')),
  add column searches_used integer not null default 0
    check (searches_used >= 0);

create table public.search_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  brief text not null,
  filters jsonb not null,
  result_ids jsonb not null,
  created_at timestamptz not null default now()
);

create index search_runs_company_created_idx
  on public.search_runs(company_id, created_at desc);

alter table public.search_runs enable row level security;
