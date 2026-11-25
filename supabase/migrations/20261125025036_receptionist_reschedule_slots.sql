-- Consulta somente a disponibilidade, sem gravar nem expor IDs de pacientes.
create function private.receptionist_reschedule_slots(p_id uuid, p_day date)
returns table(slot time without time zone)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_appointment public.appointments;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if auth.uid() is null or not private.is_active_hospital_receptionist() then
    raise exception using errcode = '42501', message = 'Acesso da secretaria negado.';
  end if;
  if p_id is null or p_day is null or p_day < v_today or p_day > v_today + 365 then
    raise exception using errcode = '22023', message = 'Consulta ou data inválida.';
  end if;

  select a.* into v_appointment
  from public.appointments a
  join public.hospital_staff s on s.profile_id = a.doctor_id and s.hospital_id = 1 and s.active
  join public.profiles d on d.id = a.doctor_id and d.role = 'doctor'
  where a.id = p_id and a.status = 'scheduled' and a.scheduled_at > now();
  if not found then
    raise exception using errcode = 'P0002', message = 'Consulta futura com médico ativo não encontrada.';
  end if;

  return query
    select d.slot
    from private.doctor_day_slots(v_appointment.doctor_id, p_day) d
    cross join lateral (select (p_day + d.slot) at time zone 'America/Sao_Paulo' as starts_at) t
    where t.starts_at > now()
      and t.starts_at <> v_appointment.scheduled_at
      and not exists (
        select 1 from public.appointments other
        where other.status = 'scheduled' and other.scheduled_at = t.starts_at
          and (other.doctor_id = v_appointment.doctor_id or other.patient_id = v_appointment.patient_id)
      )
    order by d.slot;
end;
$$;

create function public.receptionist_reschedule_slots(p_id uuid, p_day date)
returns table(slot time without time zone)
language sql stable security invoker set search_path = '' as $$
  select * from private.receptionist_reschedule_slots(p_id, p_day);
$$;

revoke all on function private.receptionist_reschedule_slots(uuid, date) from public, anon, authenticated;
revoke all on function public.receptionist_reschedule_slots(uuid, date) from public, anon, authenticated;
grant execute on function private.receptionist_reschedule_slots(uuid, date) to authenticated;
grant execute on function public.receptionist_reschedule_slots(uuid, date) to authenticated;
