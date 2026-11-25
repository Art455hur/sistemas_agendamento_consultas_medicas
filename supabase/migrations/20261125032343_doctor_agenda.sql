-- Consulta de leitura: o médico recebe apenas a sua agenda e os nomes necessários.
-- O acesso direto a perfis de pacientes continua sujeito às políticas existentes.
create function private.doctor_list_appointments(p_day date)
returns table(id uuid, patient_name text, specialty text, scheduled_at timestamptz, status text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_doctor_id uuid := auth.uid();
begin
  if v_doctor_id is null or not exists (
    select 1
    from public.profiles p
    join public.hospital_staff s on s.profile_id = p.id
    where p.id = v_doctor_id and p.role = 'doctor' and s.hospital_id = 1 and s.active
  ) then
    raise exception using errcode = '42501', message = 'Vínculo médico ativo obrigatório.';
  end if;

  if p_day is null or not isfinite(p_day) or p_day not between date '0001-01-01' and date '9999-12-31' then
    raise exception using errcode = '22023', message = 'Informe um dia válido.';
  end if;

  return query
    select a.id, p.full_name, a.specialty, a.scheduled_at, a.status
    from public.appointments a
    join public.profiles p on p.id = a.patient_id
    where a.doctor_id = v_doctor_id
      and a.scheduled_at >= (p_day::timestamp at time zone 'America/Sao_Paulo')
      and a.scheduled_at < ((p_day + 1)::timestamp at time zone 'America/Sao_Paulo')
    order by a.scheduled_at, a.id
    limit 201;
end;
$$;

revoke all on function private.doctor_list_appointments(date) from public, anon, authenticated;
grant execute on function private.doctor_list_appointments(date) to authenticated;

create function public.doctor_list_appointments(p_day date)
returns table(id uuid, patient_name text, specialty text, scheduled_at timestamptz, status text)
language sql stable security invoker set search_path = '' as $$
  select * from private.doctor_list_appointments(p_day);
$$;

revoke all on function public.doctor_list_appointments(date) from public, anon, authenticated;
grant execute on function public.doctor_list_appointments(date) to authenticated;
