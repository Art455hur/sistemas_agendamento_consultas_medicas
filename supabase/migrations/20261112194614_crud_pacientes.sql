-- CRUD administrativo de pacientes.
-- O cadastro (Create) continua sendo feito pelo fluxo público do Supabase Auth.
-- A administração ganha leitura, edição e desativação/reativação lógica,
-- preservando consultas históricas e sem excluir contas de auth.users.

alter table public.profiles
  add column patient_active boolean not null default true;

create or replace function private.assert_booking_patient()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'patient'
      and p.patient_active
  ) then
    raise exception using errcode = '42501', message = 'Paciente ativo autenticado obrigatório.';
  end if;
end;
$$;

revoke all on function private.assert_booking_patient() from public, anon, authenticated;

-- Paciente desativado deixa de consultar/editar o próprio perfil pela Data API.
drop policy if exists "profile_self_select" on public.profiles;
create policy "profile_self_select" on public.profiles
  for select to authenticated
  using (
    (select auth.uid()) = id
    and (role <> 'patient' or patient_active)
  );

drop policy if exists "profile_self_update" on public.profiles;
create policy "profile_self_update" on public.profiles
  for update to authenticated
  using (
    (select auth.uid()) = id
    and (role <> 'patient' or patient_active)
  )
  with check (
    (select auth.uid()) = id
    and (role <> 'patient' or patient_active)
  );

-- Paciente desativado deixa de ler as próprias consultas; médico ativo mantém a regra existente.
drop policy if exists "appointment_patient_or_doctor_select" on public.appointments;
create policy "appointment_patient_or_doctor_select" on public.appointments
  for select to authenticated
  using (
    (
      (select auth.uid()) = patient_id
      and exists (
        select 1
        from public.profiles p
        where p.id = (select auth.uid())
          and p.role = 'patient'
          and p.patient_active
      )
    )
    or (
      (select auth.uid()) = doctor_id
      and exists (
        select 1
        from public.hospital_staff s
        where s.profile_id = (select auth.uid())
          and s.hospital_id = 1
          and s.active
      )
    )
  );

-- Catálogo de médicos é reservado a pacientes ativos.
create or replace function private.booking_doctors()
returns table(id uuid, full_name text, specialty text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_booking_patient();

  return query
    select p.id, p.full_name, s.name
    from public.profiles p
    join public.hospital_staff hs on hs.profile_id = p.id
    join public.specialties s on lower(trim(s.name)) = lower(trim(p.specialty))
    where p.role = 'doctor'
      and hs.active
      and s.active
    order by s.name, p.full_name, p.id;
end;
$$;

create function private.admin_list_patients()
returns table(
  id uuid,
  email text,
  full_name text,
  phone text,
  cpf text,
  birth_date date,
  active boolean,
  appointment_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;

  return query
    select
      p.id,
      u.email::text,
      p.full_name,
      p.phone,
      p.cpf,
      p.birth_date,
      p.patient_active,
      count(a.id)::bigint
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.appointments a on a.patient_id = p.id
    where p.role = 'patient'
    group by p.id, u.email, p.full_name, p.phone, p.cpf, p.birth_date, p.patient_active
    order by p.patient_active desc, lower(coalesce(p.full_name, '')), lower(coalesce(u.email, '')), p.id;
end;
$$;

create function private.admin_update_patient(
  p_id uuid,
  p_full_name text,
  p_phone text,
  p_cpf text,
  p_birth_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_full_name, ''));
  v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '');
  v_cpf text := nullif(regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g'), '');
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;

  if p_id is null
    or length(v_name) not between 3 and 120
    or (v_phone is not null and length(v_phone) not between 10 and 11)
    or (p_birth_date is not null and p_birth_date > current_date)
    or (v_cpf is not null and not private.is_valid_cpf(v_cpf))
  then
    raise exception using errcode = '22023', message = 'Dados do paciente inválidos.';
  end if;

  update public.profiles
  set
    full_name = v_name,
    phone = v_phone,
    cpf = v_cpf,
    birth_date = p_birth_date
  where id = p_id
    and role = 'patient';

  if not found then
    raise exception using errcode = 'P0002', message = 'Paciente não encontrado.';
  end if;
end;
$$;

create function private.admin_set_patient_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;

  if p_id is null or p_active is null then
    raise exception using errcode = '22023', message = 'Paciente inválido.';
  end if;

  update public.profiles
  set patient_active = p_active
  where id = p_id
    and role = 'patient';

  if not found then
    raise exception using errcode = 'P0002', message = 'Paciente não encontrado.';
  end if;

  if not p_active then
    update public.appointments
    set status = 'cancelled'
    where patient_id = p_id
      and status = 'scheduled'
      and scheduled_at > now();
  end if;
end;
$$;

revoke all on function private.admin_list_patients() from public, anon, authenticated;
revoke all on function private.admin_update_patient(uuid, text, text, text, date) from public, anon, authenticated;
revoke all on function private.admin_set_patient_active(uuid, boolean) from public, anon, authenticated;

grant execute on function private.admin_list_patients() to authenticated;
grant execute on function private.admin_update_patient(uuid, text, text, text, date) to authenticated;
grant execute on function private.admin_set_patient_active(uuid, boolean) to authenticated;

create function public.admin_list_patients()
returns table(
  id uuid,
  email text,
  full_name text,
  phone text,
  cpf text,
  birth_date date,
  active boolean,
  appointment_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$ select * from private.admin_list_patients(); $$;

create function public.admin_update_patient(
  p_id uuid,
  p_full_name text,
  p_phone text,
  p_cpf text,
  p_birth_date date
)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.admin_update_patient(p_id, p_full_name, p_phone, p_cpf, p_birth_date); $$;

create function public.admin_set_patient_active(p_id uuid, p_active boolean)
returns void
language sql
security invoker
set search_path = ''
as $$ select private.admin_set_patient_active(p_id, p_active); $$;

revoke all on function public.admin_list_patients() from public, anon, authenticated;
revoke all on function public.admin_update_patient(uuid, text, text, text, date) from public, anon, authenticated;
revoke all on function public.admin_set_patient_active(uuid, boolean) from public, anon, authenticated;

grant execute on function public.admin_list_patients() to authenticated;
grant execute on function public.admin_update_patient(uuid, text, text, text, date) to authenticated;
grant execute on function public.admin_set_patient_active(uuid, boolean) to authenticated;
