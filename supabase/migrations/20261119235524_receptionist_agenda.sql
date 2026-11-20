-- Secretaria ativa: agenda operacional, sem acesso ao CRUD administrativo.
create function private.is_active_hospital_receptionist()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.hospital_staff s on s.profile_id=p.id
    where p.id=auth.uid() and p.role='receptionist' and s.hospital_id=1 and s.active
  );
$$;
revoke all on function private.is_active_hospital_receptionist() from public, anon, authenticated;

create function private.receptionist_catalog()
returns table(id uuid, name text, kind text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_hospital_receptionist() then
    raise exception using errcode='42501', message='Acesso da secretaria negado.';
  end if;
  return query
    select p.id, p.full_name as name, 'patient'::text as kind from public.profiles p
    where p.role='patient' and p.patient_active
    union all
    select p.id, p.full_name, 'doctor'::text from public.profiles p
    join public.hospital_staff s on s.profile_id=p.id and s.hospital_id=1
    join public.specialties sp on lower(trim(sp.name))=lower(trim(p.specialty))
    where p.role='doctor' and s.active and sp.active
    order by name,id;
end;
$$;

create function private.receptionist_list_appointments(p_day date)
returns table(id uuid, patient_name text, doctor_name text, specialty text, scheduled_at timestamptz, status text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_hospital_receptionist() then
    raise exception using errcode='42501', message='Acesso da secretaria negado.';
  end if;
  if p_day is null then raise exception using errcode='22023', message='Informe um dia válido.'; end if;
  return query
    select a.id,p.full_name,coalesce(a.doctor_name,d.full_name),a.specialty,a.scheduled_at,a.status
    from public.appointments a
    join public.hospital_staff s on s.profile_id=a.doctor_id and s.hospital_id=1
    join public.profiles p on p.id=a.patient_id
    join public.profiles d on d.id=a.doctor_id
    where a.scheduled_at >= (p_day::timestamp at time zone 'America/Sao_Paulo')
      and a.scheduled_at < ((p_day+1)::timestamp at time zone 'America/Sao_Paulo')
    order by a.scheduled_at,a.id limit 200;
end;
$$;

create function private.receptionist_booking_slots(p_patient_id uuid,p_doctor_id uuid,p_day date)
returns table(slot time without time zone)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_hospital_receptionist() then
    raise exception using errcode='42501', message='Acesso da secretaria negado.';
  end if;
  if p_day is null or p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date+365
    or not exists (select 1 from public.profiles p where p.id=p_patient_id and p.role='patient' and p.patient_active)
    or not exists (
      select 1 from public.profiles p
      join public.hospital_staff s on s.profile_id=p.id and s.hospital_id=1
      join public.specialties sp on lower(trim(sp.name))=lower(trim(p.specialty))
      where p.id=p_doctor_id and p.role='doctor' and s.active and sp.active
    ) then raise exception using errcode='22023', message='Paciente, médico ou dia inválido.'; end if;
  return query
    select d.slot from private.doctor_day_slots(p_doctor_id,p_day) d
    where (p_day+d.slot) at time zone 'America/Sao_Paulo' > now()
      and not exists (
        select 1 from public.appointments a
        where a.status='scheduled' and a.scheduled_at=(p_day+d.slot) at time zone 'America/Sao_Paulo'
          and (a.doctor_id=p_doctor_id or a.patient_id=p_patient_id)
      ) order by d.slot;
end;
$$;

create function private.receptionist_create_appointment(
  p_patient_id uuid,p_doctor_id uuid,p_day date,p_time time without time zone,p_reason text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_doctor_name text; v_specialty text; v_at timestamptz; v_id uuid;
begin
  if auth.uid() is null or not private.is_active_hospital_receptionist() then
    raise exception using errcode='42501', message='Acesso da secretaria negado.';
  end if;
  if p_patient_id is null or p_doctor_id is null or p_day is null or p_time is null
    or length(coalesce(p_reason,''))>2000
    or p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date+365 then
    raise exception using errcode='22023', message='Dados da consulta inválidos.';
  end if;
  if not exists (select 1 from public.profiles p where p.id=p_patient_id and p.role='patient' and p.patient_active) then
    raise exception using errcode='22023', message='Paciente ativo obrigatório.';
  end if;
  select p.full_name,sp.name into v_doctor_name,v_specialty from public.profiles p
  join public.hospital_staff s on s.profile_id=p.id and s.hospital_id=1
  join public.specialties sp on lower(trim(sp.name))=lower(trim(p.specialty))
  where p.id=p_doctor_id and p.role='doctor' and s.active and sp.active;
  if not found then raise exception using errcode='22023', message='Médico ativo obrigatório.'; end if;
  if not exists (select 1 from private.doctor_day_slots(p_doctor_id,p_day) d where d.slot=p_time) then
    raise exception using errcode='22023', message='Horário indisponível.';
  end if;
  v_at := (p_day+p_time) at time zone 'America/Sao_Paulo';
  if v_at<=now() then raise exception using errcode='22023', message='Escolha um horário futuro.'; end if;
  if exists (select 1 from public.appointments a where a.status='scheduled' and a.scheduled_at=v_at
    and (a.doctor_id=p_doctor_id or a.patient_id=p_patient_id)) then
    raise exception using errcode='23505', message='Conflito de horário.';
  end if;
  insert into public.appointments(patient_id,doctor_id,doctor_name,specialty,scheduled_at,reason)
  values(p_patient_id,p_doctor_id,v_doctor_name,v_specialty,v_at,nullif(trim(p_reason),'')) returning id into v_id;
  return v_id;
end;
$$;

create function private.receptionist_reschedule_appointment(p_id uuid,p_day date,p_time time without time zone)
returns void language plpgsql security definer set search_path = '' as $$
declare v_appointment public.appointments; v_at timestamptz;
begin
  if auth.uid() is null or not private.is_active_hospital_receptionist() then
    raise exception using errcode='42501', message='Acesso da secretaria negado.';
  end if;
  if p_id is null or p_day is null or p_time is null
    or p_day < (now() at time zone 'America/Sao_Paulo')::date
    or p_day > (now() at time zone 'America/Sao_Paulo')::date+365 then
    raise exception using errcode='22023', message='Data ou horário inválido.';
  end if;
  select a.* into v_appointment from public.appointments a
  join public.hospital_staff s on s.profile_id=a.doctor_id and s.hospital_id=1
  where a.id=p_id and a.status='scheduled' and a.scheduled_at>now() for update of a;
  if not found then raise exception using errcode='P0002', message='Consulta futura não encontrada.'; end if;
  if not exists (
    select 1 from public.profiles p
    join public.hospital_staff s on s.profile_id=p.id and s.hospital_id=1
    where p.id=v_appointment.doctor_id and p.role='doctor' and s.active
  ) then raise exception using errcode='22023', message='Médico inativo.'; end if;
  if not exists (select 1 from private.doctor_day_slots(v_appointment.doctor_id,p_day) d where d.slot=p_time) then
    raise exception using errcode='22023', message='Horário indisponível.';
  end if;
  v_at := (p_day+p_time) at time zone 'America/Sao_Paulo';
  if v_at<=now() then raise exception using errcode='22023', message='Escolha um horário futuro.'; end if;
  if exists (select 1 from public.appointments a where a.id<>p_id and a.status='scheduled' and a.scheduled_at=v_at
    and (a.doctor_id=v_appointment.doctor_id or a.patient_id=v_appointment.patient_id)) then
    raise exception using errcode='23505', message='Conflito de horário.';
  end if;
  update public.appointments set scheduled_at=v_at where id=p_id;
end;
$$;

create function private.receptionist_cancel_appointment(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_hospital_receptionist() then
    raise exception using errcode='42501', message='Acesso da secretaria negado.';
  end if;
  if p_id is null then raise exception using errcode='22023', message='Consulta inválida.'; end if;
  update public.appointments a set status='cancelled'
  where a.id=p_id and a.status='scheduled' and a.scheduled_at>now()
    and exists (select 1 from public.hospital_staff s where s.profile_id=a.doctor_id and s.hospital_id=1);
  if not found then raise exception using errcode='P0002', message='Consulta futura não encontrada.'; end if;
end;
$$;

-- Funções privilegiadas só no schema privado; wrappers públicos são invoker.
revoke all on function private.receptionist_catalog() from public,anon,authenticated;
revoke all on function private.receptionist_list_appointments(date) from public,anon,authenticated;
revoke all on function private.receptionist_booking_slots(uuid,uuid,date) from public,anon,authenticated;
revoke all on function private.receptionist_create_appointment(uuid,uuid,date,time without time zone,text) from public,anon,authenticated;
revoke all on function private.receptionist_reschedule_appointment(uuid,date,time without time zone) from public,anon,authenticated;
revoke all on function private.receptionist_cancel_appointment(uuid) from public,anon,authenticated;
grant execute on function private.receptionist_catalog() to authenticated;
grant execute on function private.receptionist_list_appointments(date) to authenticated;
grant execute on function private.receptionist_booking_slots(uuid,uuid,date) to authenticated;
grant execute on function private.receptionist_create_appointment(uuid,uuid,date,time without time zone,text) to authenticated;
grant execute on function private.receptionist_reschedule_appointment(uuid,date,time without time zone) to authenticated;
grant execute on function private.receptionist_cancel_appointment(uuid) to authenticated;

create function public.receptionist_catalog()
returns table(id uuid,name text,kind text) language sql stable security invoker set search_path = '' as $$
  select * from private.receptionist_catalog();
$$;
create function public.receptionist_list_appointments(p_day date)
returns table(id uuid,patient_name text,doctor_name text,specialty text,scheduled_at timestamptz,status text)
language sql stable security invoker set search_path = '' as $$
  select * from private.receptionist_list_appointments(p_day);
$$;
create function public.receptionist_booking_slots(p_patient_id uuid,p_doctor_id uuid,p_day date)
returns table(slot time without time zone) language sql stable security invoker set search_path = '' as $$
  select * from private.receptionist_booking_slots(p_patient_id,p_doctor_id,p_day);
$$;
create function public.receptionist_create_appointment(
  p_patient_id uuid,p_doctor_id uuid,p_day date,p_time time without time zone,p_reason text default null
) returns uuid language sql security invoker set search_path = '' as $$
  select private.receptionist_create_appointment(p_patient_id,p_doctor_id,p_day,p_time,p_reason);
$$;
create function public.receptionist_reschedule_appointment(p_id uuid,p_day date,p_time time without time zone)
returns void language sql security invoker set search_path = '' as $$
  select private.receptionist_reschedule_appointment(p_id,p_day,p_time);
$$;
create function public.receptionist_cancel_appointment(p_id uuid)
returns void language sql security invoker set search_path = '' as $$
  select private.receptionist_cancel_appointment(p_id);
$$;
revoke all on function public.receptionist_catalog() from public,anon,authenticated;
revoke all on function public.receptionist_list_appointments(date) from public,anon,authenticated;
revoke all on function public.receptionist_booking_slots(uuid,uuid,date) from public,anon,authenticated;
revoke all on function public.receptionist_create_appointment(uuid,uuid,date,time without time zone,text) from public,anon,authenticated;
revoke all on function public.receptionist_reschedule_appointment(uuid,date,time without time zone) from public,anon,authenticated;
revoke all on function public.receptionist_cancel_appointment(uuid) from public,anon,authenticated;
grant execute on function public.receptionist_catalog() to authenticated;
grant execute on function public.receptionist_list_appointments(date) to authenticated;
grant execute on function public.receptionist_booking_slots(uuid,uuid,date) to authenticated;
grant execute on function public.receptionist_create_appointment(uuid,uuid,date,time without time zone,text) to authenticated;
grant execute on function public.receptionist_reschedule_appointment(uuid,date,time without time zone) to authenticated;
grant execute on function public.receptionist_cancel_appointment(uuid) to authenticated;
