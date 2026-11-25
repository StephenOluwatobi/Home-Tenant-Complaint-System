create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  occupancy_id uuid not null references public.unit_occupancies (id) on delete restrict,
  categories text[] not null check (
    array_ndims(categories) = 1
    and cardinality(categories) between 1 and 5
    and array_position(categories, null) is null
    and categories <@ array['Plumbing', 'Electrical', 'Structural', 'Appliance', 'Others']
  ),
  description text not null check (char_length(description) between 10 and 500),
  status text not null default 'Pending' check (status in ('Pending', 'In-Progress', 'Resolved')),
  created_at timestamptz not null default now()
);

create index complaints_occupancy_created_at_idx
  on public.complaints (occupancy_id, created_at desc);

alter table public.complaints enable row level security;
revoke all on table public.complaints from public, anon, authenticated;
grant select on table public.complaints to authenticated;

create policy "Managers can read all complaints"
  on public.complaints for select to authenticated
  using (
    exists (select 1 from public.portal_managers where user_id = (select auth.uid()))
  );

create policy "Tenants can read complaints for their active occupancy"
  on public.complaints for select to authenticated
  using (
    exists (
      select 1
      from public.unit_occupancies as occupancy
      where occupancy.id = complaints.occupancy_id
        and occupancy.user_id = (select auth.uid())
        and occupancy.ended_at is null
    )
  );

-- Submission owns the identity and status columns. App callers can only supply text.
create function public.create_complaint(p_categories text[], p_description text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  active_occupancy_id uuid;
  complaint_id uuid;
begin
  if caller_id is null or exists (
    select 1 from public.portal_managers where user_id = caller_id
  ) then
    raise exception 'An active tenant occupancy is required' using errcode = '42501';
  end if;

  -- Serialize with an update that ends this occupancy.
  select id into active_occupancy_id
  from public.unit_occupancies
  where user_id = caller_id and ended_at is null
  for share;

  if active_occupancy_id is null then
    raise exception 'An active tenant occupancy is required' using errcode = '42501';
  end if;

  insert into public.complaints (occupancy_id, categories, description)
  values (active_occupancy_id, p_categories, regexp_replace(p_description, '^[[:space:]]+|[[:space:]]+$', '', 'g'))
  returning id into complaint_id;

  return complaint_id;
end;
$$;

revoke all on function public.create_complaint(text[], text) from public, anon, authenticated;
grant execute on function public.create_complaint(text[], text) to authenticated;
