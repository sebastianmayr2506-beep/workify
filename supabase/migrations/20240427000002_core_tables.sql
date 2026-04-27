-- Core tables for Workify

-- profiles (extends auth.users)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  settings   jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- customers
create table public.customers (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  primary_contact_name text,
  primary_email        text,
  primary_phone        text,
  awork_url            text,
  extra_links          jsonb default '[]',
  notes                text,
  is_archived          boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- projects
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  name        text not null,
  description text,
  status      public.project_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- tasks
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  customer_id  uuid not null references public.customers(id) on delete cascade,
  project_id   uuid references public.projects(id) on delete set null,
  title        text not null,
  description  text,
  status       public.task_status not null default 'open',
  priority     public.task_priority not null default 'medium',
  due_date     date,
  half_billing boolean not null default false,
  source       public.task_source not null default 'manual',
  source_meta  jsonb,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- time_entries
create table public.time_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  task_id    uuid not null references public.tasks(id) on delete cascade,
  started_at timestamptz not null,
  ended_at   timestamptz,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Constraint: max. one running timer per user
create unique index time_entries_one_running_per_user
  on public.time_entries (user_id)
  where ended_at is null;

-- task_notes
create table public.task_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  task_id    uuid not null references public.tasks(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- meetings
create table public.meetings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  customer_id  uuid not null references public.customers(id) on delete cascade,
  title        text not null,
  meeting_date timestamptz not null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- questions
create table public.questions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  customer_id         uuid not null references public.customers(id) on delete cascade,
  task_id             uuid references public.tasks(id) on delete set null,
  meeting_id          uuid references public.meetings(id) on delete set null,
  direction           public.question_direction not null default 'customer',
  assigned_to         text,
  question            text not null,
  answer              text,
  status              public.question_status not null default 'open',
  ask_at_next_meeting boolean not null default false,
  asked_at            timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- meeting_tasks (M:N)
create table public.meeting_tasks (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  task_id    uuid not null references public.tasks(id) on delete cascade,
  primary key (meeting_id, task_id)
);

-- task_templates
create table public.task_templates (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  default_title       text,
  default_description text,
  default_priority    public.task_priority,
  default_customer_id uuid references public.customers(id) on delete set null,
  default_project_id  uuid references public.projects(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-update updated_at via trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.customers
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.time_entries
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.task_notes
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.meetings
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.questions
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.task_templates
  for each row execute procedure public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
