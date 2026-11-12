-- Uma configuração por médico/dia substitui a grade inicial. Sem linha, valem
-- os cinco horários existentes; array vazio significa dia sem atendimento.
create table public.doctor_day_availability (
  doctor_id uuid not null references public.profiles(id),
  day date not null,
  slots time without time zone[] not null,
  primary key (doctor_id, day),
  constraint doctor_day_availability_slots_check check (
    array_position(slots, null) is null and cardinality(slots) <= 5
  )
);
alter table public.doctor_day_availability enable row level security;
revoke all on table public.doctor_day_availability from public, anon, authenticated;

create function private.doctor_day_slots(p_doctor_id uuid, p_day date)
returns table(slot time without time zone)
language sql stable security definer set search_path = '' as $function$
  select s.slot
  from unnest(coalesce(
    (select a.slots from public.doctor_day_availability a
      where a.doctor_id = p_doctor_id and a.day = p_day),
    array[time '08:00', time '09:00', time '10:30', time '14:00', time '15:30']
  )) s(slot);
$function$;
revoke all on function private.doctor_day_slots(uuid, date) from public, anon, authenticated;

create function private.admin_get_doctor_day(p_doctor_id uuid, p_day date)
returns table(slots time without time zone[], customized boolean, booked time without time zone[])
language plpgsql stable security definer set search_path = '' as $function$
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;
  if p_day is null or not exists (
    select 1 from public.profiles p join public.hospital_staff s on s.profile_id = p.id
    where p.id = p_doctor_id and p.role = 'doctor' and s.hospital_id = 1
  ) then
    raise exception using errcode = '22023', message = 'Médico ou dia inválido.';
  end if;
  return query select array(select d.slot from private.doctor_day_slots(p_doctor_id, p_day) d order by d.slot),
    exists (select 1 from public.doctor_day_availability a where a.doctor_id = p_doctor_id and a.day = p_day),
    array(select (a.scheduled_at at time zone 'America/Sao_Paulo')::time
      from public.appointments a where a.doctor_id = p_doctor_id and a.status = 'scheduled'
        and a.scheduled_at >= (p_day::timestamp at time zone 'America/Sao_Paulo')
        and a.scheduled_at < ((p_day + 1)::timestamp at time zone 'America/Sao_Paulo')
      order by a.scheduled_at);
end;
$function$;

create function private.admin_set_doctor_day(p_doctor_id uuid, p_day date, p_slots time without time zone[])
returns void
language plpgsql security definer set search_path = '' as $function$
declare v_slots time without time zone[];
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;
  if p_day is null or p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date + 365
    or not exists (
      select 1 from public.profiles p join public.hospital_staff s on s.profile_id = p.id
      where p.id = p_doctor_id and p.role = 'doctor' and s.hospital_id = 1 and s.active
    ) then
    raise exception using errcode = '22023', message = 'Médico ativo ou dia futuro obrigatório.';
  end if;
  if p_slots is null or cardinality(p_slots) > 5 or array_position(p_slots, null) is not null
    or exists (select 1 from unnest(p_slots) s(slot) where s.slot not in
      (time '08:00', time '09:00', time '10:30', time '14:00', time '15:30'))
    or (select count(distinct s.slot) from unnest(p_slots) s(slot)) <> cardinality(p_slots) then
    raise exception using errcode = '22023', message = 'Horários inválidos ou repetidos.';
  end if;
  select coalesce(array_agg(s.slot order by s.slot), array[]::time without time zone[])
    into v_slots from unnest(p_slots) s(slot);
  -- Uma configuração nova não pode ocultar reservas que já estão agendadas.
  if exists (
    select 1 from public.appointments a
    where a.doctor_id = p_doctor_id and a.status = 'scheduled'
      and (a.scheduled_at at time zone 'America/Sao_Paulo')::date = p_day
      and (a.scheduled_at at time zone 'America/Sao_Paulo')::time <> all(v_slots)
  ) then
    raise exception using errcode = '23514', message = 'Há consultas agendadas em horários removidos.';
  end if;
  insert into public.doctor_day_availability(doctor_id, day, slots)
    values (p_doctor_id, p_day, v_slots)
    on conflict (doctor_id, day) do update set slots = excluded.slots;
end;
$function$;

create function private.admin_reset_doctor_day(p_doctor_id uuid, p_day date)
returns void
language plpgsql security definer set search_path = '' as $function$
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;
  if p_day is null or p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date + 365
    or not exists (select 1 from public.profiles p join public.hospital_staff s on s.profile_id = p.id
      where p.id = p_doctor_id and p.role = 'doctor' and s.hospital_id = 1 and s.active) then
    raise exception using errcode = '22023', message = 'Médico ativo ou dia válido obrigatório.';
  end if;
  delete from public.doctor_day_availability a where a.doctor_id = p_doctor_id and a.day = p_day;
end;
$function$;

revoke all on function private.admin_get_doctor_day(uuid, date) from public, anon, authenticated;
revoke all on function private.admin_set_doctor_day(uuid, date, time without time zone[]) from public, anon, authenticated;
revoke all on function private.admin_reset_doctor_day(uuid, date) from public, anon, authenticated;
grant execute on function private.admin_get_doctor_day(uuid, date) to authenticated;
grant execute on function private.admin_set_doctor_day(uuid, date, time without time zone[]) to authenticated;
grant execute on function private.admin_reset_doctor_day(uuid, date) to authenticated;

create function public.admin_get_doctor_day(p_doctor_id uuid, p_day date)
returns table(slots time without time zone[], customized boolean, booked time without time zone[])
language sql stable security invoker set search_path = '' as $function$
  select * from private.admin_get_doctor_day(p_doctor_id, p_day);
$function$;
create function public.admin_set_doctor_day(p_doctor_id uuid, p_day date, p_slots time without time zone[])
returns void language sql security invoker set search_path = '' as $function$
  select private.admin_set_doctor_day(p_doctor_id, p_day, p_slots);
$function$;
create function public.admin_reset_doctor_day(p_doctor_id uuid, p_day date)
returns void language sql security invoker set search_path = '' as $function$
  select private.admin_reset_doctor_day(p_doctor_id, p_day);
$function$;
revoke all on function public.admin_get_doctor_day(uuid, date) from public, anon, authenticated;
revoke all on function public.admin_set_doctor_day(uuid, date, time without time zone[]) from public, anon, authenticated;
revoke all on function public.admin_reset_doctor_day(uuid, date) from public, anon, authenticated;
grant execute on function public.admin_get_doctor_day(uuid, date) to authenticated;
grant execute on function public.admin_set_doctor_day(uuid, date, time without time zone[]) to authenticated;
grant execute on function public.admin_reset_doctor_day(uuid, date) to authenticated;

-- O mesmo critério governa a listagem e a criação/remarcação de consultas.
create or replace function private.booking_slots(
  p_doctor_id uuid, p_date date, p_appointment_id uuid default null
)
returns table(scheduled_at timestamptz)
language plpgsql stable security definer set search_path = '' as $function$
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Sessão obrigatória.';
  end if;
  return query
    select (p_date + t.slot) at time zone 'America/Sao_Paulo' as scheduled_at
    from private.doctor_day_slots(p_doctor_id, p_date) t
    where exists (select 1 from private.booking_doctors() d where d.id = p_doctor_id)
      and (p_date + t.slot) at time zone 'America/Sao_Paulo' > now()
      and not exists (
        select 1 from public.appointments a
        where a.status = 'scheduled'
          and a.scheduled_at = (p_date + t.slot) at time zone 'America/Sao_Paulo'
          and (a.doctor_id = p_doctor_id or a.patient_id = auth.uid())
          and not (a.id = coalesce(p_appointment_id, '00000000-0000-0000-0000-000000000000'::uuid) and a.patient_id = auth.uid())
      ) order by 1;
end;
$function$;

create or replace function private.validate_booking_slot(
  p_doctor_id uuid, p_scheduled_at timestamptz
)
returns void
language plpgsql security definer set search_path = '' as $function$
begin
  perform private.assert_booking_patient();
  if p_scheduled_at is null or not isfinite(p_scheduled_at) or p_scheduled_at <= now()
    or not exists (select 1 from private.booking_doctors() d where d.id = p_doctor_id)
    or not exists (
      select 1 from private.doctor_day_slots(p_doctor_id,
        (p_scheduled_at at time zone 'America/Sao_Paulo')::date) s
      where s.slot = (p_scheduled_at at time zone 'America/Sao_Paulo')::time
    ) then
    raise exception using errcode = '22023', message = 'Profissional ou horário inválido.';
  end if;
end;
$function$;
