create table public.hiring_submissions (
 id uuid primary key,
 name text not null check (length(btrim(name)) between 1 and 60),
 birth date not null,
 phone text not null check (phone ~ '^[0-9]{9,15}$'),
 questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 10 and 30),
 submitted_at timestamptz not null default now()
);
create table public.hiring_reviews (
 submission_id uuid primary key references public.hiring_submissions(id) on delete restrict,
 reviewed_at timestamptz not null default now()
);
alter table public.hiring_submissions enable row level security;
alter table public.hiring_reviews enable row level security;
revoke all on public.hiring_submissions,public.hiring_reviews from anon,authenticated;
grant select,insert on public.hiring_submissions to service_role;
grant select,insert,update on public.hiring_reviews to service_role;
create index hiring_submissions_created_idx on public.hiring_submissions(submitted_at desc,id desc);
