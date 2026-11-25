-- Small private exam files, bounded to five per consultation. No public URLs.
create table public.doctor_exam_files (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  slot smallint not null check (slot between 1 and 5),
  label text not null check (length(trim(label)) between 1 and 80),
  mime text not null,
  content bytea not null check (octet_length(content) between 1 and 2097152),
  unique (appointment_id, slot),
  check (case mime
    when 'application/pdf' then substring(content from 1 for 5) = decode('255044462d','hex')
    when 'image/jpeg' then substring(content from 1 for 3) = decode('ffd8ff','hex')
    when 'image/png' then substring(content from 1 for 8) = decode('89504e470d0a1a0a','hex')
    else false end)
);
alter table public.doctor_exam_files enable row level security;
revoke all on public.doctor_exam_files from public, anon, authenticated;
grant select, insert (appointment_id,slot,label,mime,content) on public.doctor_exam_files to authenticated;

create function private.can_access_doctor_exam(p_id uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.appointments a
    join public.profiles p on p.id=a.doctor_id
    join public.hospital_staff s on s.profile_id=p.id
    where a.id=p_id and p.id=(select auth.uid()) and p.role='doctor'
      and s.active and s.hospital_id=1 and a.status='completed' and a.scheduled_at<=now());
$$;
revoke all on function private.can_access_doctor_exam(uuid) from public, anon;
grant execute on function private.can_access_doctor_exam(uuid) to authenticated;
create policy doctor_exam_read on public.doctor_exam_files for select to authenticated
  using (private.can_access_doctor_exam(appointment_id));
create policy doctor_exam_add on public.doctor_exam_files for insert to authenticated
  with check (private.can_access_doctor_exam(appointment_id));

create index doctor_patient_history_idx on public.appointments(doctor_id, patient_id, scheduled_at desc, id)
  where status='completed';
create function public.doctor_visit_history(p_id uuid, p_offset integer default 0)
returns table(id uuid, note jsonb, exams jsonb)
language sql stable security invoker set search_path = '' as $$
  select h.id, public.doctor_get_clinical_note(h.id),
    coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'label', e.label) order by e.slot)
      from public.doctor_exam_files e where e.appointment_id=h.id), '[]'::jsonb)
  from (
    select a.id,a.scheduled_at from public.appointments current_visit
    join public.appointments a on a.patient_id=current_visit.patient_id and a.doctor_id=current_visit.doctor_id
    where current_visit.id=p_id and private.can_access_doctor_exam(current_visit.id)
      and a.status='completed' and a.scheduled_at<current_visit.scheduled_at
    order by a.scheduled_at desc,a.id limit 5 offset greatest(0,p_offset)
  ) h order by h.scheduled_at desc,h.id;
$$;
revoke all on function public.doctor_visit_history(uuid,integer) from public, anon;
grant execute on function public.doctor_visit_history(uuid,integer) to authenticated;
