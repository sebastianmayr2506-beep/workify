-- Row Level Security policies for Workify
-- Every table: only the owning user can CRUD their own rows.

-- profiles
alter table public.profiles enable row level security;

create policy "profiles: own row only" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- customers
alter table public.customers enable row level security;

create policy "customers: own rows only" on public.customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- projects
alter table public.projects enable row level security;

create policy "projects: own rows only" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tasks
alter table public.tasks enable row level security;

create policy "tasks: own rows only" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- time_entries
alter table public.time_entries enable row level security;

create policy "time_entries: own rows only" on public.time_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- task_notes
alter table public.task_notes enable row level security;

create policy "task_notes: own rows only" on public.task_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- meetings
alter table public.meetings enable row level security;

create policy "meetings: own rows only" on public.meetings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- questions
alter table public.questions enable row level security;

create policy "questions: own rows only" on public.questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- meeting_tasks: allow if user owns the meeting
alter table public.meeting_tasks enable row level security;

create policy "meeting_tasks: own meetings only" on public.meeting_tasks
  for all using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_tasks.meeting_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_tasks.meeting_id and m.user_id = auth.uid()
    )
  );

-- task_templates
alter table public.task_templates enable row level security;

create policy "task_templates: own rows only" on public.task_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
