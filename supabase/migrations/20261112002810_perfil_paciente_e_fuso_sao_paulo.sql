-- Dados cadastrais do paciente ficam em profiles, sob as políticas RLS existentes.
alter table public.profiles
  add column if not exists cpf text,
  add column if not exists birth_date date;

alter table public.profiles
  add constraint profiles_cpf_digits_check
    check (cpf is null or cpf ~ '^[0-9]{11}$'),
  add constraint profiles_birth_date_check
    check (birth_date is null or birth_date <= current_date);

create unique index if not exists profiles_cpf_unique_idx
  on public.profiles (cpf)
  where cpf is not null;

grant update (full_name, phone, cpf, birth_date)
  on public.profiles to authenticated;

create or replace function private.create_patient_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_cpf text;
  v_phone text;
  v_birth_date date;
begin
  v_cpf := nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'cpf', ''), '[^0-9]', '', 'g'), '');
  v_phone := nullif(left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30), '');
  v_birth_date := nullif(new.raw_user_meta_data ->> 'birth_date', '')::date;

  if v_cpf is not null and v_cpf !~ '^[0-9]{11}$' then
    raise exception using errcode = '22023', message = 'CPF inválido.';
  end if;

  insert into public.profiles (id, full_name, phone, cpf, birth_date)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'name', ''), 120),
    v_phone,
    v_cpf,
    v_birth_date
  );
  return new;
end;
$function$;

-- O projeto está na região de São Paulo; horários exibidos e aceitos seguem esse fuso.
create or replace function private.booking_slots(
  p_doctor_id uuid,
  p_date date,
  p_appointment_id uuid default null
)
returns table(scheduled_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Sessão obrigatória.';
  end if;

  return query
    select (p_date + t.slot) at time zone 'America/Sao_Paulo' as scheduled_at
    from unnest(array[time '08:00', time '09:00', time '10:30', time '14:00', time '15:30']) t(slot)
    where exists (select 1 from private.booking_doctors() d where d.id = p_doctor_id)
      and (p_date + t.slot) at time zone 'America/Sao_Paulo' > now()
      and not exists (
        select 1 from public.appointments a
        where a.status = 'scheduled'
          and a.scheduled_at = (p_date + t.slot) at time zone 'America/Sao_Paulo'
          and (a.doctor_id = p_doctor_id or a.patient_id = auth.uid())
          and not (a.id = coalesce(p_appointment_id, '00000000-0000-0000-0000-000000000000'::uuid) and a.patient_id = auth.uid())
      )
    order by 1;
end;
$function$;

create or replace function private.validate_booking_slot(
  p_doctor_id uuid,
  p_scheduled_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform private.assert_booking_patient();
  if p_scheduled_at is null or not isfinite(p_scheduled_at) or p_scheduled_at <= now()
    or (p_scheduled_at at time zone 'America/Sao_Paulo')::time not in
      (time '08:00', time '09:00', time '10:30', time '14:00', time '15:30')
    or not exists (select 1 from private.booking_doctors() d where d.id = p_doctor_id)
  then
    raise exception using errcode = '22023', message = 'Profissional ou horário inválido.';
  end if;
end;
$function$;

create or replace function public.booking_slots(
  p_doctor_id uuid,
  p_date date,
  p_appointment_id uuid default null
)
returns table(scheduled_at timestamptz)
language sql
stable
set search_path = ''
as $function$
  select * from private.booking_slots(p_doctor_id, p_date, p_appointment_id);
$function$;

revoke all on function private.create_patient_profile() from public, anon, authenticated;

