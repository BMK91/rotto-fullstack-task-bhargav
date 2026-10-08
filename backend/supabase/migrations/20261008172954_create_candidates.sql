create table public.candidates (
  id text primary key,

  full_name text not null,
  avatar_url text,
  headline text,

  current_title text not null,
  current_company text not null,
  current_company_logo_url text,

  role text not null,
  seniority text not null,
  years_experience integer not null,

  location_city text not null,
  location_state text not null,
  location_country text not null,

  open_to_work boolean not null default false,

  skills text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidate_experiences (
  id bigint generated always as identity primary key,
  candidate_id text not null
    references public.candidates(id)
    on delete cascade,

  title text not null,
  company text not null,
  company_logo_url text,
  company_type text,
  start_year integer,
  end_year integer,
  description text
);

create table public.candidate_education (
  id bigint generated always as identity primary key,
  candidate_id text not null
    references public.candidates(id)
    on delete cascade,

  school text not null,
  degree text,
  field text,
  graduation_year integer
);

create index candidates_role_idx
  on public.candidates(role);

create index candidates_seniority_idx
  on public.candidates(seniority);

create index candidates_location_city_idx
  on public.candidates(location_city);

create index candidates_years_experience_idx
  on public.candidates(years_experience);

create index candidates_open_to_work_idx
  on public.candidates(open_to_work);

create index candidates_skills_gin_idx
  on public.candidates using gin(skills);

create index candidate_experiences_candidate_id_idx
  on public.candidate_experiences(candidate_id);

create index candidate_experiences_company_type_idx
  on public.candidate_experiences(company_type);

create index candidate_experiences_company_idx
  on public.candidate_experiences(company);

create index candidate_education_candidate_id_idx
  on public.candidate_education(candidate_id);

create index candidate_education_school_idx
  on public.candidate_education(school);