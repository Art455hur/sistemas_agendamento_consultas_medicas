-- Expande o CRUD de disponibilidade diária para horários configuráveis de 30 em 30 minutos.
-- Mantém o limite da clínica: início entre 08:00 e 17:30, no fuso America/Sao_Paulo.
alter table public.doctor_day_availability
  drop constraint doctor_day_availability_slots_check;

alter table public.doctor_day_availability
  add constraint doctor_day_availability_slots_check
  check (array_position(slots, null) is null and cardinality(slots) <= 20);

create or replace function private.admin_set_doctor_day(
  p_doctor_id uuid,
  p_day date,
  p_slots time without time zone[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_slots time without time zone[];
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;

  if p_day is null
    or p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date + 365
    or not exists (
      select 1
      from public.profiles p
      join public.hospital_staff s on s.profile_id = p.id
      where p.id = p_doctor_id
        and p.role = 'doctor'
        and s.hospital_id = 1
        and s.active
    ) then
    raise exception using errcode = '22023', message = 'Médico ativo ou dia futuro obrigatório.';
  end if;

  if p_slots is null
    or cardinality(p_slots) > 20
    or array_position(p_slots, null) is not null
    or exists (
      select 1
      from unnest(p_slots) s(slot)
      where s.slot < time '08:00'
        or s.slot >= time '18:00'
        or extract(minute from s.slot) not in (0, 30)
        or extract(second from s.slot) <> 0
    )
    or (select count(distinct s.slot) from unnest(p_slots) s(slot)) <> cardinality(p_slots) then
    raise exception using errcode = '22023', message = 'Horários inválidos ou repetidos.';
  end if;

  select coalesce(array_agg(s.slot order by s.slot), array[]::time without time zone[])
    into v_slots
  from unnest(p_slots) s(slot);

  if exists (
    select 1
    from public.appointments a
    where a.doctor_id = p_doctor_id
      and a.status = 'scheduled'
      and (a.scheduled_at at time zone 'America/Sao_Paulo')::date = p_day
      and (a.scheduled_at at time zone 'America/Sao_Paulo')::time <> all(v_slots)
  ) then
    raise exception using errcode = '23514', message = 'Há consultas agendadas em horários removidos.';
  end if;

  insert into public.doctor_day_availability (doctor_id, day, slots)
    values (p_doctor_id, p_day, v_slots)
    on conflict (doctor_id, day) do update set slots = excluded.slots;
end;
$function$;
