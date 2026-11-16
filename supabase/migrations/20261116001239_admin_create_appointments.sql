-- Administrador ativo pode agendar para um paciente ativo do Hospital Sapiens.
-- Não abre INSERT direto na tabela nem reutiliza o RPC reservado ao paciente.
create function private.admin_booking_slots(p_patient_id uuid, p_doctor_id uuid, p_day date)
returns table(slot time without time zone)
language plpgsql stable security definer set search_path = ''
as $function$
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;

  if p_day is null
    or p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date + 365
    or not exists (
      select 1 from public.profiles p
      where p.id = p_patient_id and p.role = 'patient' and p.patient_active
    )
    or not exists (
      select 1 from public.profiles p
      join public.hospital_staff hs on hs.profile_id = p.id and hs.hospital_id = 1
      join public.specialties s on lower(trim(s.name)) = lower(trim(p.specialty))
      where p.id = p_doctor_id and p.role = 'doctor' and hs.active and s.active
    ) then
    raise exception using errcode = '22023', message = 'Paciente, médico ou dia inválido.';
  end if;

  return query
    select d.slot from private.doctor_day_slots(p_doctor_id, p_day) d
    where (p_day + d.slot) at time zone 'America/Sao_Paulo' > now()
      and not exists (
        select 1 from public.appointments a
        where a.status = 'scheduled'
          and a.scheduled_at = (p_day + d.slot) at time zone 'America/Sao_Paulo'
          and (a.doctor_id = p_doctor_id or a.patient_id = p_patient_id)
      )
    order by d.slot;
end;
$function$;

create function private.admin_create_appointment(
  p_patient_id uuid,
  p_doctor_id uuid,
  p_day date,
  p_time time without time zone,
  p_reason text default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $function$
declare
  v_doctor_name text;
  v_specialty text;
  v_scheduled_at timestamptz;
  v_id uuid;
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;

  if p_patient_id is null or p_doctor_id is null or p_day is null or p_time is null
    or length(coalesce(p_reason, '')) > 2000
    or p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date + 365 then
    raise exception using errcode = '22023', message = 'Dados da consulta inválidos.';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = p_patient_id and p.role = 'patient' and p.patient_active
  ) then
    raise exception using errcode = '22023', message = 'Paciente ativo obrigatório.';
  end if;

  select p.full_name, s.name into v_doctor_name, v_specialty
  from public.profiles p
  join public.hospital_staff hs on hs.profile_id = p.id and hs.hospital_id = 1
  join public.specialties s on lower(trim(s.name)) = lower(trim(p.specialty))
  where p.id = p_doctor_id and p.role = 'doctor' and hs.active and s.active;
  if not found then
    raise exception using errcode = '22023', message = 'Médico ativo obrigatório.';
  end if;

  if not exists (
    select 1 from private.doctor_day_slots(p_doctor_id, p_day) d where d.slot = p_time
  ) then
    raise exception using errcode = '22023', message = 'Horário indisponível para este médico.';
  end if;

  v_scheduled_at := (p_day + p_time) at time zone 'America/Sao_Paulo';
  if v_scheduled_at <= now() then
    raise exception using errcode = '22023', message = 'Escolha um horário futuro.';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.status = 'scheduled' and a.scheduled_at = v_scheduled_at
      and (a.doctor_id = p_doctor_id or a.patient_id = p_patient_id)
  ) then
    raise exception using errcode = '23505', message = 'O médico ou paciente já possui consulta neste horário.';
  end if;

  insert into public.appointments
    (patient_id, doctor_id, doctor_name, specialty, scheduled_at, reason)
  values
    (p_patient_id, p_doctor_id, v_doctor_name, v_specialty, v_scheduled_at,
     nullif(trim(p_reason), ''))
  returning id into v_id;
  -- Índices únicos parciais permanecem a última defesa sob concorrência.
  return v_id;
end;
$function$;

revoke all on function private.admin_booking_slots(uuid, uuid, date) from public, anon, authenticated;
revoke all on function private.admin_create_appointment(uuid, uuid, date, time without time zone, text) from public, anon, authenticated;
grant execute on function private.admin_booking_slots(uuid, uuid, date) to authenticated;
grant execute on function private.admin_create_appointment(uuid, uuid, date, time without time zone, text) to authenticated;

create function public.admin_booking_slots(p_patient_id uuid, p_doctor_id uuid, p_day date)
returns table(slot time without time zone)
language sql stable security invoker set search_path = ''
as $function$
  select * from private.admin_booking_slots(p_patient_id, p_doctor_id, p_day);
$function$;

create function public.admin_create_appointment(
  p_patient_id uuid,
  p_doctor_id uuid,
  p_day date,
  p_time time without time zone,
  p_reason text default null
)
returns uuid
language sql security invoker set search_path = ''
as $function$
  select private.admin_create_appointment(p_patient_id, p_doctor_id, p_day, p_time, p_reason);
$function$;

revoke all on function public.admin_booking_slots(uuid, uuid, date) from public, anon, authenticated;
revoke all on function public.admin_create_appointment(uuid, uuid, date, time without time zone, text) from public, anon, authenticated;
grant execute on function public.admin_booking_slots(uuid, uuid, date) to authenticated;
grant execute on function public.admin_create_appointment(uuid, uuid, date, time without time zone, text) to authenticated;
