-- Um save por conta. O progresso fica em JSON para evoluir junto com o Atlas.
create table if not exists public.atlas_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default '{"schemaVersion":1,"currentMilestone":null,"completedMilestones":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint atlas_saves_progress_is_object check (jsonb_typeof(progress) = 'object')
);

alter table public.atlas_saves enable row level security;

revoke all on table public.atlas_saves from public, anon, authenticated;
grant select, insert, update on table public.atlas_saves to authenticated;

drop policy if exists atlas_saves_select_own on public.atlas_saves;
create policy atlas_saves_select_own
  on public.atlas_saves
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists atlas_saves_insert_own on public.atlas_saves;
create policy atlas_saves_insert_own
  on public.atlas_saves
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists atlas_saves_update_own on public.atlas_saves;
create policy atlas_saves_update_own
  on public.atlas_saves
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.atlas_saves_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$function$;

drop trigger if exists atlas_saves_set_updated_at on public.atlas_saves;
create trigger atlas_saves_set_updated_at
  before update on public.atlas_saves
  for each row execute function public.atlas_saves_set_updated_at();
