alter table public.appointments
  drop constraint appointments_status_check,
  add constraint appointments_status_check
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show'));

-- Não abre escrita direta: a única mudança permitida aqui é o desfecho da própria consulta.
create function private.doctor_record_appointment_outcome(p_id uuid, p_outcome text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_doctor_id uuid := auth.uid();
begin
  if v_doctor_id is null or not exists (
    select 1 from public.profiles p
    join public.hospital_staff s on s.profile_id = p.id
    where p.id = v_doctor_id and p.role = 'doctor' and s.hospital_id = 1 and s.active
  ) then
    raise exception using errcode = '42501', message = 'Vínculo médico ativo obrigatório.';
  end if;

  if p_id is null or p_outcome is null or p_outcome not in ('completed', 'no_show') then
    raise exception using errcode = '22023', message = 'Resultado inválido.';
  end if;

  update public.appointments a
    set status = p_outcome
    where a.id = p_id and a.doctor_id = v_doctor_id and a.status = 'scheduled'
      and a.scheduled_at <= statement_timestamp();

  if not found then
    raise exception using errcode = 'P0002', message = 'Consulta indisponível para registrar resultado.';
  end if;
end;
$$;

revoke all on function private.doctor_record_appointment_outcome(uuid, text) from public, anon, authenticated;
grant execute on function private.doctor_record_appointment_outcome(uuid, text) to authenticated;

create function public.doctor_record_appointment_outcome(p_id uuid, p_outcome text)
returns void
language sql security invoker set search_path = '' as $$
  select private.doctor_record_appointment_outcome(p_id, p_outcome);
$$;

revoke all on function public.doctor_record_appointment_outcome(uuid, text) from public, anon, authenticated;
grant execute on function public.doctor_record_appointment_outcome(uuid, text) to authenticated;
