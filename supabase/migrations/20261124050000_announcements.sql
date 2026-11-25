create table public.announcements (
  id uuid primary key,
  title text not null check (char_length(btrim(title)) >= 3),
  tag text not null check (tag in ('Maintenance', 'Security', 'Sanitation', 'General')),
  details text not null check (char_length(btrim(details)) >= 10),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index announcements_latest_idx on public.announcements (created_at desc, id desc);

alter table public.announcements enable row level security;
revoke all on table public.announcements from public, anon, authenticated;
grant select on table public.announcements to authenticated;

create policy "Managers and active tenants can read announcements"
  on public.announcements for select to authenticated
  using (
    exists (select 1 from public.portal_managers where user_id = (select auth.uid()))
    or exists (
      select 1 from public.unit_occupancies
      where user_id = (select auth.uid()) and ended_at is null
    )
  );

create function public.publish_announcement(p_id uuid, p_title text, p_tag text, p_details text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  clean_title text := regexp_replace(p_title, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  clean_details text := regexp_replace(p_details, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  saved public.announcements%rowtype;
begin
  if not exists (select 1 from public.portal_managers where user_id = caller_id) then
    raise exception 'Management access is required' using errcode = '42501';
  end if;

  -- A retry with the same ID returns the same announcement.
  insert into public.announcements (id, title, tag, details, created_by)
  values (p_id, clean_title, p_tag, clean_details, caller_id)
  on conflict (id) do nothing
  returning * into saved;

  if not found then
    select * into saved from public.announcements
    where id = p_id and title = clean_title and tag = p_tag
      and details = clean_details and created_by = caller_id;
    if not found then
      raise exception 'Announcement identifier is already in use' using errcode = '23505';
    end if;
  end if;
  return to_jsonb(saved) - 'created_by';
end;
$$;

create function public.delete_announcement(p_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.portal_managers where user_id = (select auth.uid())
  ) then
    raise exception 'Management access is required' using errcode = '42501';
  end if;

  delete from public.announcements where id = p_id;
  return true;
end;
$$;

revoke all on function public.publish_announcement(uuid, text, text, text),
  public.delete_announcement(uuid) from public, anon, authenticated;
grant execute on function public.publish_announcement(uuid, text, text, text),
  public.delete_announcement(uuid) to authenticated;
