insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('complaint-photos', 'complaint-photos', false, 2097152,
        array['image/jpeg', 'image/png', 'image/webp']);

-- All photo downloads go through the app's live complaint access check.
create policy "Complaint photo objects require the server"
  on storage.objects as restrictive for all to anon, authenticated
  using (bucket_id <> 'complaint-photos')
  with check (bucket_id <> 'complaint-photos');

alter table public.complaints
  add column photo_path text unique,
  add column photo_content_type text,
  add column photo_size_bytes integer,
  add constraint complaint_photo_metadata check (
    num_nonnulls(photo_path, photo_content_type, photo_size_bytes) = 0
    or (
      num_nonnulls(photo_path, photo_content_type, photo_size_bytes) = 3
      and photo_content_type in ('image/jpeg', 'image/png', 'image/webp')
      and photo_size_bytes between 1 and 2097152
    )
  );

create table public.complaint_photo_submissions (
  id uuid primary key,
  occupancy_id uuid not null references public.unit_occupancies (id) on delete restrict,
  payload_hash text not null,
  object_path text not null unique,
  lease_id uuid,
  lease_until timestamptz,
  cleaning boolean not null default false,
  complaint_id uuid unique references public.complaints (id) on delete cascade
);

alter table public.complaint_photo_submissions enable row level security;
revoke all on table public.complaint_photo_submissions from public, anon, authenticated;

create function public.reserve_complaint_photo(
  p_user_id uuid, p_id uuid, p_hash text, p_lease uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_id uuid;
  attempt public.complaint_photo_submissions%rowtype;
begin
  select id into active_id from public.unit_occupancies
  where user_id = p_user_id and ended_at is null
    and not exists (select 1 from public.portal_managers where user_id = p_user_id)
  for share;
  if active_id is null then
    raise exception 'An active tenant occupancy is required' using errcode = '42501';
  end if;

  insert into public.complaint_photo_submissions (id, occupancy_id, payload_hash, object_path)
  values (p_id, active_id, p_hash, active_id::text || '/' || p_id::text)
  on conflict (id) do nothing;

  select * into attempt from public.complaint_photo_submissions where id = p_id for update;
  if attempt.occupancy_id <> active_id or attempt.payload_hash <> p_hash then
    raise exception 'Submission identifier is already in use' using errcode = '23505';
  end if;
  if attempt.complaint_id is not null then
    return jsonb_build_object('id', attempt.complaint_id);
  end if;
  if attempt.lease_until > clock_timestamp() then
    return 'null'::jsonb;
  end if;

  update public.complaint_photo_submissions
  set lease_id = p_lease, lease_until = clock_timestamp() + interval '2 minutes', cleaning = false
  where id = p_id;
  return jsonb_build_object('path', attempt.object_path);
end;
$$;

create function public.finish_complaint_photo(
  p_user_id uuid, p_id uuid, p_lease uuid, p_categories text[], p_description text,
  p_content_type text, p_size integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_id uuid;
  object_path text;
  saved_id uuid;
begin
  select id into active_id from public.unit_occupancies
  where user_id = p_user_id and ended_at is null
    and not exists (select 1 from public.portal_managers where user_id = p_user_id)
  for share;
  if active_id is null then
    raise exception 'An active tenant occupancy is required' using errcode = '42501';
  end if;

  select attempt.object_path into object_path from public.complaint_photo_submissions as attempt
  where id = p_id and occupancy_id = active_id and lease_id = p_lease
    and not cleaning and complaint_id is null and lease_until > clock_timestamp()
  for update;
  if object_path is null then
    raise exception 'Upload attempt expired';
  end if;

  perform 1 from storage.objects
  where bucket_id = 'complaint-photos' and name = object_path
    and metadata->>'mimetype' = p_content_type and metadata->>'size' = p_size::text
  for share;
  if not found then
    raise exception 'Uploaded file could not be verified';
  end if;

  insert into public.complaints (occupancy_id, categories, description, photo_path, photo_content_type, photo_size_bytes)
  values (active_id, p_categories, p_description, object_path, p_content_type, p_size)
  returning id into saved_id;
  update public.complaint_photo_submissions
  set complaint_id = saved_id, lease_id = null, lease_until = null
  where id = p_id;
  return saved_id;
end;
$$;

-- Claim cleanup before deleting an object, so a completed or concurrent attempt
-- cannot lose its file. Keep the reservation if Storage cleanup fails.
create function public.discard_complaint_photo(
  p_id uuid, p_lease uuid, p_removed boolean default false, p_retry boolean default false
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleanup_path text;
begin
  if p_removed then
    delete from public.complaint_photo_submissions
    where id = p_id and lease_id = p_lease and cleaning and complaint_id is null;
  elsif p_retry then
    update public.complaint_photo_submissions
    set lease_id = null, lease_until = null
    where id = p_id and lease_id = p_lease and not cleaning and complaint_id is null;
  else
    update public.complaint_photo_submissions
    set cleaning = true, lease_until = clock_timestamp() + interval '2 minutes'
    where id = p_id and lease_id = p_lease and complaint_id is null
    returning object_path into cleanup_path;
  end if;
  return cleanup_path;
end;
$$;

revoke all on function public.reserve_complaint_photo(uuid, uuid, text, uuid),
  public.finish_complaint_photo(uuid, uuid, uuid, text[], text, text, integer),
  public.discard_complaint_photo(uuid, uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function public.reserve_complaint_photo(uuid, uuid, text, uuid),
  public.finish_complaint_photo(uuid, uuid, uuid, text[], text, text, integer),
  public.discard_complaint_photo(uuid, uuid, boolean, boolean) to service_role;
