-- Escrita administrativa limitada a remarcar ou cancelar consultas futuras.
-- O histórico permanece preservado e a disponibilidade do profissional é validada no banco.
create function private.admin_reschedule_appointment(
  p_id uuid,
  p_day date,
  p_time time without time zone
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_appointment public.appointments;
  v_scheduled_at timestamptz;
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;

  if p_id is null or p_day is null or p_time is null
    or p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date + 365 then
    raise exception using errcode = '22023', message = 'Data ou horário inválido.';
  end if;

  select a.* into v_appointment
  from public.appointments a
  join public.hospital_staff s on s.profile_id = a.doctor_id and s.hospital_id = 1
  where a.id = p_id
    and a.status = 'scheduled'
    and a.scheduled_at > now()
  for update of a;

  if not found then
    raise exception using errcode = 'P0002', message = 'Consulta futura não encontrada.';
  end if;

  if not exists (
    select 1
    from public.hospital_staff s
    where s.profile_id = v_appointment.doctor_id
      and s.hospital_id = 1
      and s.active
  ) then
    raise exception using errcode = '22023', message = 'O profissional não está ativo.';
  end if;

  if not exists (
    select 1
    from private.doctor_day_slots(v_appointment.doctor_id, p_day) s
    where s.slot = p_time
  ) then
    raise exception using errcode = '22023', message = 'O horário não está disponível para este profissional.';
  end if;

  v_scheduled_at := (p_day + p_time) at time zone 'America/Sao_Paulo';
  if v_scheduled_at <= now() then
    raise exception using errcode = '22023', message = 'Escolha um horário futuro.';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.id <> v_appointment.id
      and a.status = 'scheduled'
      and a.scheduled_at = v_scheduled_at
      and (a.doctor_id = v_appointment.doctor_id or a.patient_id = v_appointment.patient_id)
  ) then
    raise exception using errcode = '23505', message = 'O médico ou paciente já possui uma consulta neste horário.';
  end if;

  update public.appointments
  set scheduled_at = v_scheduled_at
  where id = v_appointment.id;
end;
$function$;

create function private.admin_cancel_appointment(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;

  if p_id is null then
    raise exception using errcode = '22023', message = 'Consulta inválida.';
  end if;

  update public.appointments a
  set status = 'cancelled'
  where a.id = p_id
    and a.status = 'scheduled'
    and a.scheduled_at > now()
    and exists (
      select 1
      from public.hospital_staff s
      where s.profile_id = a.doctor_id
        and s.hospital_id = 1
    );

  if not found then
    raise exception using errcode = 'P0002', message = 'Consulta futura não encontrada.';
  end if;
end;
$function$;

revoke all on function private.admin_reschedule_appointment(uuid, date, time without time zone) from public, anon, authenticated;
revoke all on function private.admin_cancel_appointment(uuid) from public, anon, authenticated;
grant execute on function private.admin_reschedule_appointment(uuid, date, time without time zone) to authenticated;
grant execute on function private.admin_cancel_appointment(uuid) to authenticated;

create function public.admin_reschedule_appointment(
  p_id uuid,
  p_day date,
  p_time time without time zone
)
returns void
language sql
security invoker
set search_path = ''
as $function$
  select private.admin_reschedule_appointment(p_id, p_day, p_time);
$function$;

create function public.admin_cancel_appointment(p_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $function$
  select private.admin_cancel_appointment(p_id);
$function$;

revoke all on function public.admin_reschedule_appointment(uuid, date, time without time zone) from public, anon, authenticated;
revoke all on function public.admin_cancel_appointment(uuid) from public, anon, authenticated;
grant execute on function public.admin_reschedule_appointment(uuid, date, time without time zone) to authenticated;
grant execute on function public.admin_cancel_appointment(uuid) to authenticated;
