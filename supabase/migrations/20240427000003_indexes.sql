-- Performance indexes for Workify

-- tasks: Heute-Ansicht + Listen
create index tasks_user_status_due on public.tasks (user_id, status, due_date);
create index tasks_customer_id     on public.tasks (customer_id);
create index tasks_project_id      on public.tasks (project_id);

-- time_entries: Reports + laufender Timer
create index time_entries_user_started  on public.time_entries (user_id, started_at desc);
create index time_entries_task_started  on public.time_entries (task_id, started_at desc);

-- questions: globale Übersicht + Filter
create index questions_user_status          on public.questions (user_id, status);
create index questions_customer_status      on public.questions (customer_id, status);
create index questions_task_id              on public.questions (task_id);
create index questions_user_direction_status on public.questions (user_id, direction, status);
create index questions_next_meeting         on public.questions (user_id, ask_at_next_meeting)
  where status = 'open';

-- customers: filter by archived
create index customers_user_archived on public.customers (user_id, is_archived);

-- meetings
create index meetings_customer_date on public.meetings (customer_id, meeting_date desc);
