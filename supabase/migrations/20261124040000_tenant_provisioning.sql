alter table public.unit_occupancies
  add column full_name text check (char_length(full_name) between 2 and 160),
  add column contact text not null default '' check (char_length(contact) <= 160);

create function public.tenant_login_email(p_unit integer)
returns text
language sql stable security definer set search_path = ''
as $$
  select account.email::text
  from public.unit_occupancies as occupancy
  join auth.users as account on account.id = occupancy.user_id
  where occupancy.unit_number = p_unit and occupancy.ended_at is null;
$$;

create function public.tenant_provisioning_state(
  p_manager uuid, p_unit integer, p_request uuid, p_email text
)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  candidate uuid;
  candidate_occupancy uuid;
  ended boolean;
begin
  if not exists (select 1 from public.portal_managers where user_id = p_manager) then
    raise exception 'Management access is required' using errcode = '42501';
  end if;

  select account.id, occupancy.id, occupancy.ended_at is not null
    into candidate, candidate_occupancy, ended
  from auth.users as account
  left join public.unit_occupancies as occupancy on occupancy.user_id = account.id
  where account.email = p_email
    and account.raw_app_meta_data->>'tcms_assignment' = p_request::text
    and account.raw_app_meta_data->>'tcms_unit' = p_unit::text;

  return jsonb_build_object(
    'user_id', candidate, 'occupancy_id', candidate_occupancy, 'ended', ended,
    'occupied', exists (
      select 1 from public.unit_occupancies where unit_number = p_unit and ended_at is null
    )
  );
end;
$$;

create function public.assign_unit_tenant(
  p_manager uuid, p_user uuid, p_unit integer, p_request uuid, p_full_name text, p_contact text
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  occupancy public.unit_occupancies%rowtype;
begin
  if not exists (select 1 from public.portal_managers where user_id = p_manager) then
    raise exception 'Management access is required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from auth.users where id = p_user
      and raw_app_meta_data->>'tcms_assignment' = p_request::text
      and raw_app_meta_data->>'tcms_unit' = p_unit::text
  ) then
    raise exception 'Invalid tenant account' using errcode = '22023';
  end if;

  -- Serialize assignments, with the existing partial unique index as a backstop.
  perform 1 from public.units where number = p_unit for update;
  select * into occupancy from public.unit_occupancies where user_id = p_user;
  if occupancy.id is null then
    insert into public.unit_occupancies (user_id, unit_number, full_name, contact)
    values (p_user, p_unit, p_full_name, p_contact)
    returning * into occupancy;
  elsif occupancy.unit_number <> p_unit or occupancy.ended_at is not null then
    raise exception 'The assignment is no longer active' using errcode = '23505';
  end if;

  return jsonb_build_object('id', occupancy.id, 'unit_number', occupancy.unit_number,
    'full_name', occupancy.full_name, 'contact', occupancy.contact);
end;
$$;

create function public.edit_unit_tenant(p_id uuid, p_unit integer, p_full_name text, p_contact text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  result jsonb;
begin
  if not exists (select 1 from public.portal_managers where user_id = (select auth.uid())) then
    raise exception 'Management access is required' using errcode = '42501';
  end if;

  update public.unit_occupancies
  set full_name = p_full_name, contact = p_contact
  where id = p_id and unit_number = p_unit and ended_at is null
  returning jsonb_build_object('id', id, 'unit_number', unit_number,
    'full_name', full_name, 'contact', contact) into result;
  return coalesce(result, 'null'::jsonb);
end;
$$;

create function public.vacate_unit_tenant(p_id uuid, p_unit integer)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.portal_managers where user_id = (select auth.uid())) then
    raise exception 'Management access is required' using errcode = '42501';
  end if;

  perform 1 from public.units where number = p_unit for update;
  update public.unit_occupancies set ended_at = clock_timestamp()
  where id = p_id and unit_number = p_unit and ended_at is null;
  return found or exists (
    select 1 from public.unit_occupancies
    where id = p_id and unit_number = p_unit and ended_at is not null
  );
end;
$$;

revoke all on function public.tenant_login_email(integer),
  public.tenant_provisioning_state(uuid, integer, uuid, text),
  public.assign_unit_tenant(uuid, uuid, integer, uuid, text, text) from public, anon, authenticated;
grant execute on function public.tenant_login_email(integer),
  public.tenant_provisioning_state(uuid, integer, uuid, text),
  public.assign_unit_tenant(uuid, uuid, integer, uuid, text, text) to service_role;

revoke all on function public.edit_unit_tenant(uuid, integer, text, text),
  public.vacate_unit_tenant(uuid, integer) from public, anon, authenticated;
grant execute on function public.edit_unit_tenant(uuid, integer, text, text),
  public.vacate_unit_tenant(uuid, integer) to authenticated;
