alter table public.complaints
  add column technician text check (char_length(technician) between 1 and 60),
  add column resolved_at timestamptz;

create function public.update_complaint(
  p_id uuid,
  p_status text default null,
  p_technician text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not exists (
    select 1 from public.portal_managers where user_id = (select auth.uid())
  ) then
    raise exception 'Management access is required' using errcode = '42501';
  end if;

  if p_status is null and p_technician is null then
    raise exception 'A status or technician is required' using errcode = '22023';
  end if;

  update public.complaints as complaint
  set status = coalesce(p_status, complaint.status),
      technician = case
        when p_technician is null then complaint.technician
        else nullif(regexp_replace(p_technician, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '')
      end,
      resolved_at = case
        when p_status is null then complaint.resolved_at
        when p_status <> 'Resolved' then null
        when complaint.status = 'Resolved' then coalesce(complaint.resolved_at, statement_timestamp())
        else statement_timestamp()
      end
  from public.unit_occupancies as occupancy
  where complaint.id = p_id and occupancy.id = complaint.occupancy_id
  returning jsonb_build_object(
    'id', complaint.id,
    'categories', complaint.categories,
    'description', complaint.description,
    'status', complaint.status,
    'created_at', complaint.created_at,
    'technician', complaint.technician,
    'resolved_at', complaint.resolved_at,
    'occupancy', jsonb_build_object('unit_number', occupancy.unit_number)
  ) into result;

  return coalesce(result, 'null'::jsonb);
end;
$$;

revoke all on function public.update_complaint(uuid, text, text) from public, anon, authenticated;
grant execute on function public.update_complaint(uuid, text, text) to authenticated;
