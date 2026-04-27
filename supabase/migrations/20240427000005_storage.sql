-- Storage bucket for ticket screenshots

insert into storage.buckets (id, name, public)
values ('ticket-screenshots', 'ticket-screenshots', false);

-- RLS: only own files
create policy "ticket-screenshots: owner select" on storage.objects
  for select using (
    bucket_id = 'ticket-screenshots' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "ticket-screenshots: owner insert" on storage.objects
  for insert with check (
    bucket_id = 'ticket-screenshots' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "ticket-screenshots: owner delete" on storage.objects
  for delete using (
    bucket_id = 'ticket-screenshots' and auth.uid()::text = (storage.foldername(name))[1]
  );
