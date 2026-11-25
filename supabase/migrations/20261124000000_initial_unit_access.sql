create table public.units (
  number smallint primary key check (number between 1 and 5)
);

create table public.portal_managers (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table public.unit_occupancies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete restrict,
  unit_number smallint not null references public.units (number) on delete restrict,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  check (ended_at is null or ended_at >= started_at)
);

create unique index one_active_occupancy_per_unit
  on public.unit_occupancies (unit_number)
  where ended_at is null;

alter table public.units enable row level security;
alter table public.portal_managers enable row level security;
alter table public.unit_occupancies enable row level security;

revoke all on table public.units, public.portal_managers, public.unit_occupancies
  from public, anon, authenticated;
grant select on table public.units, public.portal_managers, public.unit_occupancies
  to authenticated;

create policy "Managers can read their own membership"
  on public.portal_managers for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Managers can read all occupancies"
  on public.unit_occupancies for select to authenticated
  using (
    exists (select 1 from public.portal_managers where user_id = (select auth.uid()))
  );

create policy "Tenants can read their own active occupancy"
  on public.unit_occupancies for select to authenticated
  using (user_id = (select auth.uid()) and ended_at is null);

create policy "Managers can read all units"
  on public.units for select to authenticated
  using (
    exists (select 1 from public.portal_managers where user_id = (select auth.uid()))
  );

create policy "Tenants can read their own active unit"
  on public.units for select to authenticated
  using (
    exists (
      select 1
      from public.unit_occupancies as occupancy
      where occupancy.unit_number = units.number
        and occupancy.user_id = (select auth.uid())
        and occupancy.ended_at is null
    )
  );

create function public.get_portal_access()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.portal_managers where user_id = (select auth.uid())
    ) then jsonb_build_object('role', 'management')
    else coalesce(
      (
        select jsonb_build_object(
          'role', 'tenant',
          'unit', unit_number,
          'occupancy_id', id
        )
        from public.unit_occupancies
        where user_id = (select auth.uid()) and ended_at is null
      ),
      'null'::jsonb
    )
  end;
$$;

revoke all on function public.get_portal_access() from public, anon, authenticated;
grant execute on function public.get_portal_access() to authenticated;

insert into public.units (number) values (1), (2), (3), (4), (5);
