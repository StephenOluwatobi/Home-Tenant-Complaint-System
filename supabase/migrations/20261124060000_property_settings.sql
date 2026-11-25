create table public.property_settings (
  singleton boolean primary key default true check (singleton),
  admin_name text not null check (char_length(btrim(admin_name)) >= 2),
  admin_email text not null check (
    admin_email = '' or admin_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  property_name text not null check (char_length(btrim(property_name)) >= 2),
  property_address text not null,
  contact_phone text not null,
  updated_at timestamptz not null default now()
);

insert into public.property_settings (admin_name, admin_email, property_name, property_address, contact_phone, updated_at)
values ('Landlord / Management', '', 'Asiawu Oyenihun Holdings',
        'Ahindero Area, Fate/Tanke, Ilorin', '0803 000 0000', '2026-11-01T09:00:00Z');

alter table public.property_settings enable row level security;
revoke all on table public.property_settings from public, anon, authenticated;
grant select on table public.property_settings to authenticated;

create policy "Managers can read property settings"
  on public.property_settings for select to authenticated
  using (
    exists (select 1 from public.portal_managers where user_id = (select auth.uid()))
  );

create function public.get_resident_property_settings()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce((
    select jsonb_build_object('property_name', property_name, 'property_address', property_address)
    from public.property_settings
    where singleton and exists (
      select 1 from public.unit_occupancies
      where user_id = (select auth.uid()) and ended_at is null
    )
  ), 'null'::jsonb);
$$;

create function public.update_property_settings(
  p_admin_name text, p_admin_email text, p_property_name text,
  p_property_address text, p_contact_phone text
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  saved public.property_settings%rowtype;
begin
  if not exists (
    select 1 from public.portal_managers where user_id = (select auth.uid())
  ) then
    raise exception 'Management access is required' using errcode = '42501';
  end if;

  update public.property_settings
  set admin_name = regexp_replace(p_admin_name, '^[[:space:]]+|[[:space:]]+$', '', 'g'),
      admin_email = lower(btrim(p_admin_email)),
      property_name = regexp_replace(p_property_name, '^[[:space:]]+|[[:space:]]+$', '', 'g'),
      property_address = btrim(p_property_address),
      contact_phone = btrim(p_contact_phone),
      updated_at = statement_timestamp()
  where singleton
  returning * into strict saved;
  return to_jsonb(saved) - 'singleton';
end;
$$;

revoke all on function public.get_resident_property_settings(),
  public.update_property_settings(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.get_resident_property_settings(),
  public.update_property_settings(text, text, text, text, text) to authenticated;
