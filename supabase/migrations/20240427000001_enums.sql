-- Enums for Workify

create type public.task_status as enum ('open', 'in_progress', 'waiting', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.task_source as enum ('manual', 'ai_import', 'template');
create type public.project_status as enum ('planned', 'active', 'on_hold', 'done');
create type public.question_direction as enum ('internal', 'customer');
create type public.question_status as enum ('open', 'answered', 'wont_answer');
