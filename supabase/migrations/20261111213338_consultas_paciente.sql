-- CRUD do paciente via RPCs estreitas. Sem escrita direta em appointments.
-- Funções privilegiadas ficam em private, fora dos schemas expostos no Data API.
alter table public.profiles add column specialty text
  check (specialty is null or length(trim(specialty)) between 1 and 120);
alter table public.appointments add column doctor_name text;
update public.appointments a set doctor_name = p.full_name
  from public.profiles p where p.id = a.doctor_id;

create unique index appointments_one_active_patient_slot_idx
  on public.appointments(patient_id, scheduled_at) where status = 'scheduled';

create function private.assert_booking_patient() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'patient'
  ) then
    raise exception using errcode = '42501', message = 'Paciente autenticado obrigatório.';
  end if;
end;
$$;
revoke all on function private.assert_booking_patient() from public, anon, authenticated;

-- Retorna apenas o catálogo público do profissional; nunca telefone ou dados do paciente.
create function private.booking_doctors()
returns table(id uuid, full_name text, specialty text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception using errcode = '42501', message = 'Sessão obrigatória.'; end if;
  return query select p.id, p.full_name, p.specialty
    from public.profiles p join public.hospital_staff s on s.profile_id = p.id
    where p.role = 'doctor' and s.active and p.specialty is not null
    order by p.specialty, p.full_name, p.id;
end;
$$;
revoke all on function private.booking_doctors() from public, anon, authenticated;

-- Grade inicial da clínica, no fuso America/Manaus. Gestão de disponibilidade é outro card.
-- Revela somente horários livres, sem expor quem reservou horários ocupados.
create function private.booking_slots(p_doctor_id uuid, p_date date, p_appointment_id uuid default null)
returns table(scheduled_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception using errcode = '42501', message = 'Sessão obrigatória.'; end if;
  return query
    select (p_date + t.slot) at time zone 'America/Manaus' as scheduled_at
    from unnest(array[time '08:00', time '09:00', time '10:30', time '14:00', time '15:30']) t(slot)
    where exists (select 1 from private.booking_doctors() d where d.id = p_doctor_id)
      and (p_date + t.slot) at time zone 'America/Manaus' > now()
      and not exists (
        select 1 from public.appointments a
        where a.status = 'scheduled'
          and a.scheduled_at = (p_date + t.slot) at time zone 'America/Manaus'
          and (a.doctor_id = p_doctor_id or a.patient_id = auth.uid())
          and not (a.id = coalesce(p_appointment_id, '00000000-0000-0000-0000-000000000000'::uuid) and a.patient_id = auth.uid())
      ) order by 1;
end;
$$;
revoke all on function private.booking_slots(uuid, date, uuid) from public, anon, authenticated;

create function private.validate_booking_slot(p_doctor_id uuid, p_scheduled_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_booking_patient();
  if p_scheduled_at is null or not isfinite(p_scheduled_at) or p_scheduled_at <= now()
    or (p_scheduled_at at time zone 'America/Manaus')::time not in
      (time '08:00', time '09:00', time '10:30', time '14:00', time '15:30')
    or not exists (select 1 from private.booking_doctors() d where d.id = p_doctor_id)
  then raise exception using errcode = '22023', message = 'Profissional ou horário inválido.'; end if;
end;
$$;
revoke all on function private.validate_booking_slot(uuid, timestamptz) from public, anon, authenticated;

create function private.create_patient_appointment(p_doctor_id uuid, p_scheduled_at timestamptz, p_reason text default null)
returns setof public.appointments language plpgsql security definer set search_path = '' as $$
declare v_doctor record;
begin
  perform private.validate_booking_slot(p_doctor_id, p_scheduled_at);
  if length(coalesce(p_reason, '')) > 2000 then
    raise exception using errcode = '22023', message = 'Motivo muito longo.';
  end if;
  select * into strict v_doctor from private.booking_doctors() where id = p_doctor_id;
  return query insert into public.appointments
    (patient_id, doctor_id, doctor_name, specialty, scheduled_at, reason)
    values (auth.uid(), v_doctor.id, v_doctor.full_name, v_doctor.specialty, p_scheduled_at, nullif(trim(p_reason), ''))
    returning *;
  -- Índices únicos garantem exclusividade de médico e paciente mesmo sob concorrência.
end;
$$;
revoke all on function private.create_patient_appointment(uuid, timestamptz, text) from public, anon, authenticated;

create function private.reschedule_patient_appointment(p_appointment_id uuid, p_scheduled_at timestamptz)
returns setof public.appointments language plpgsql security definer set search_path = '' as $$
declare v_appointment public.appointments;
begin
  perform private.assert_booking_patient();
  select * into v_appointment from public.appointments
    where id = p_appointment_id and patient_id = auth.uid()
      and status = 'scheduled' and scheduled_at > now() for update;
  if not found then raise exception using errcode = 'P0002', message = 'Consulta indisponível.'; end if;
  perform private.validate_booking_slot(v_appointment.doctor_id, p_scheduled_at);
  -- Não aceita mudar paciente, médico, especialidade, motivo ou estado.
  return query update public.appointments set scheduled_at = p_scheduled_at
    where id = v_appointment.id returning *;
end;
$$;
revoke all on function private.reschedule_patient_appointment(uuid, timestamptz) from public, anon, authenticated;

create function private.cancel_patient_appointment(p_appointment_id uuid)
returns setof public.appointments language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_booking_patient();
  return query update public.appointments set status = 'cancelled'
    where id = p_appointment_id and patient_id = auth.uid()
      and status = 'scheduled' and scheduled_at > now() returning *;
  if not found then raise exception using errcode = 'P0002', message = 'Consulta indisponível.'; end if;
end;
$$;
revoke all on function private.cancel_patient_appointment(uuid) from public, anon, authenticated;

-- Apenas estas operações limitadas são delegadas ao cliente autenticado.
-- Os wrappers do schema exposto são SECURITY INVOKER e não recebem privilégios próprios.
grant usage on schema private to authenticated;
grant execute on function private.booking_doctors() to authenticated;
grant execute on function private.booking_slots(uuid, date, uuid) to authenticated;
grant execute on function private.create_patient_appointment(uuid, timestamptz, text) to authenticated;
grant execute on function private.reschedule_patient_appointment(uuid, timestamptz) to authenticated;
grant execute on function private.cancel_patient_appointment(uuid) to authenticated;

create function public.booking_doctors()
returns table(id uuid, full_name text, specialty text)
language sql stable security invoker set search_path = '' as $$ select * from private.booking_doctors(); $$;
create function public.booking_slots(p_doctor_id uuid, p_date date, p_appointment_id uuid default null)
returns table(scheduled_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.booking_slots(p_doctor_id, p_date, p_appointment_id); $$;
create function public.create_patient_appointment(p_doctor_id uuid, p_scheduled_at timestamptz, p_reason text default null)
returns setof public.appointments
language sql security invoker set search_path = '' as $$ select * from private.create_patient_appointment(p_doctor_id, p_scheduled_at, p_reason); $$;
create function public.reschedule_patient_appointment(p_appointment_id uuid, p_scheduled_at timestamptz)
returns setof public.appointments
language sql security invoker set search_path = '' as $$ select * from private.reschedule_patient_appointment(p_appointment_id, p_scheduled_at); $$;
create function public.cancel_patient_appointment(p_appointment_id uuid)
returns setof public.appointments
language sql security invoker set search_path = '' as $$ select * from private.cancel_patient_appointment(p_appointment_id); $$;

revoke all on function public.booking_doctors() from public, anon, authenticated;
revoke all on function public.booking_slots(uuid, date, uuid) from public, anon, authenticated;
revoke all on function public.create_patient_appointment(uuid, timestamptz, text) from public, anon, authenticated;
revoke all on function public.reschedule_patient_appointment(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.cancel_patient_appointment(uuid) from public, anon, authenticated;
grant execute on function public.booking_doctors() to authenticated;
grant execute on function public.booking_slots(uuid, date, uuid) to authenticated;
grant execute on function public.create_patient_appointment(uuid, timestamptz, text) to authenticated;
grant execute on function public.reschedule_patient_appointment(uuid, timestamptz) to authenticated;
grant execute on function public.cancel_patient_appointment(uuid) to authenticated;


