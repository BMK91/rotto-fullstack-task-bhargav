create table public.shortlists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recruiter_id uuid not null references public.recruiters(id) on delete cascade,
  name varchar(100) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shortlist_candidates (
  id uuid primary key default gen_random_uuid(),
  shortlist_id uuid not null references public.shortlists(id) on delete cascade,
  candidate_id text not null references public.candidates(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint shortlist_candidates_shortlist_id_candidate_id_unique unique (shortlist_id, candidate_id)
);

create index shortlists_company_id_idx
  on public.shortlists(company_id);

create index shortlist_candidates_shortlist_id_idx
  on public.shortlist_candidates(shortlist_id);

create index shortlist_candidates_candidate_id_idx
  on public.shortlist_candidates(candidate_id);

