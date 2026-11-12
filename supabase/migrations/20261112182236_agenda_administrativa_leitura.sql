-- Leitura estreita da agenda do Hospital Sapiens para administrador ativo.
-- Não amplia a política de SELECT do paciente/médico nem libera escrita.
create function private.list_hospital_appointments(p_day date)
returns table (
  id uuid,
  patient_name text,
  doctor_name text,
  specialty text,
  scheduled_at timestamptz,
  status text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;
  if p_day is null then
    raise exception using errcode = '22023', message = 'Informe um dia válido.';
  end if;

  return query
    select a.id, p.full_name, coalesce(a.doctor_name, d.full_name),
           a.specialty, a.scheduled_at, a.status
    from public.appointments a
    join public.hospital_staff s on s.profile_id = a.doctor_id and s.hospital_id = 1
    join public.profiles p on p.id = a.patient_id
    join public.profiles d on d.id = a.doctor_id
    where a.scheduled_at >= (p_day::timestamp at time zone 'America/Sao_Paulo')
      and a.scheduled_at < ((p_day + 1)::timestamp at time zone 'America/Sao_Paulo')
    order by a.scheduled_at, a.id
    limit 200;
end;
$$;

revoke all on function private.list_hospital_appointments(date) from public, anon, authenticated;
grant execute on function private.list_hospital_appointments(date) to authenticated;

create function public.admin_list_appointments(p_day date)
returns table (
  id uuid,
  patient_name text,
  doctor_name text,
  specialty text,
  scheduled_at timestamptz,
  status text
)
language sql stable security invoker set search_path = '' as $$
  select * from private.list_hospital_appointments(p_day);
$$;

revoke all on function public.admin_list_appointments(date) from public, anon, authenticated;
grant execute on function public.admin_list_appointments(date) to authenticated;
