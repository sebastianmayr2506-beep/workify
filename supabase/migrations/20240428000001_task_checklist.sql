-- Checklist items (subtasks) for tasks
create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  content text not null,
  is_done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index task_checklist_items_task_id_idx on public.task_checklist_items(task_id);
create index task_checklist_items_user_id_idx on public.task_checklist_items(user_id);

-- updated_at trigger
create trigger task_checklist_items_set_updated_at
  before update on public.task_checklist_items
  for each row execute function public.set_updated_at();

-- RLS
alter table public.task_checklist_items enable row level security;

create policy "checklist_select_own" on public.task_checklist_items
  for select using (auth.uid() = user_id);

create policy "checklist_insert_own" on public.task_checklist_items
  for insert with check (auth.uid() = user_id);

create policy "checklist_update_own" on public.task_checklist_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "checklist_delete_own" on public.task_checklist_items
  for delete using (auth.uid() = user_id);
