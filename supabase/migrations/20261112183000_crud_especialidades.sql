-- CRUD de especialidades do Hospital Sapiens.
-- Mantém appointments.specialty como texto histórico e profiles.specialty por compatibilidade.
-- Novos cadastros de médicos passam a aceitar apenas especialidades ativas deste catálogo.

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint specialties_name_length check (length(trim(name)) between 2 and 120)
);

create unique index specialties_name_ci_idx
  on public.specialties (lower(trim(name)));

alter table public.specialties enable row level security;
revoke all on table public.specialties from public, anon, authenticated;

-- Preserva as especialidades já usadas por médicos antes da criação do catálogo.
insert into public.specialties (name)
select distinct on (lower(trim(p.specialty))) trim(p.specialty)
from public.profiles p
where p.role = 'doctor'
  and p.specialty is not null
  and length(trim(p.specialty)) between 2 and 120
order by lower(trim(p.specialty)), trim(p.specialty);

create function private.admin_list_specialties()
returns table(id uuid, name text, active boolean)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;

  return query
    select s.id, s.name, s.active
    from public.specialties s
    order by s.active desc, lower(s.name), s.id;
end;
$$;

create function private.create_specialty(p_name text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_id uuid;
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;
  if length(v_name) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'Nome de especialidade inválido.';
  end if;

  insert into public.specialties(name)
  values (v_name)
  returning id into v_id;

  return v_id;
end;
$$;

create function private.update_specialty(p_id uuid, p_name text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_old_name text;
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;
  if p_id is null or length(v_name) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'Especialidade inválida.';
  end if;

  select s.name into v_old_name
  from public.specialties s
  where s.id = p_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Especialidade não encontrada.';
  end if;

  update public.specialties
  set name = v_name, updated_at = now()
  where id = p_id;

  -- Mantém os médicos no nome canônico sem alterar o texto histórico das consultas.
  update public.profiles
  set specialty = v_name
  where role = 'doctor'
    and specialty is not null
    and lower(trim(specialty)) = lower(trim(v_old_name));
end;
$$;

create function private.set_specialty_active(p_id uuid, p_active boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode = '42501', message = 'Acesso administrativo negado.';
  end if;
  if p_id is null or p_active is null then
    raise exception using errcode = '22023', message = 'Especialidade inválida.';
  end if;

  update public.specialties
  set active = p_active, updated_at = now()
  where id = p_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Especialidade não encontrada.';
  end if;
end;
$$;

revoke all on function private.admin_list_specialties() from public, anon, authenticated;
revoke all on function private.create_specialty(text) from public, anon, authenticated;
revoke all on function private.update_specialty(uuid, text) from public, anon, authenticated;
revoke all on function private.set_specialty_active(uuid, boolean) from public, anon, authenticated;

grant execute on function private.admin_list_specialties() to authenticated;
grant execute on function private.create_specialty(text) to authenticated;
grant execute on function private.update_specialty(uuid, text) to authenticated;
grant execute on function private.set_specialty_active(uuid, boolean) to authenticated;

create function public.admin_list_specialties()
returns table(id uuid, name text, active boolean)
language sql stable security invoker
set search_path = ''
as $$ select * from private.admin_list_specialties(); $$;

create function public.admin_create_specialty(p_name text)
returns uuid
language sql security invoker
set search_path = ''
as $$ select private.create_specialty(p_name); $$;

create function public.admin_update_specialty(p_id uuid, p_name text)
returns void
language sql security invoker
set search_path = ''
as $$ select private.update_specialty(p_id, p_name); $$;

create function public.admin_set_specialty_active(p_id uuid, p_active boolean)
returns void
language sql security invoker
set search_path = ''
as $$ select private.set_specialty_active(p_id, p_active); $$;

revoke all on function public.admin_list_specialties() from public, anon, authenticated;
revoke all on function public.admin_create_specialty(text) from public, anon, authenticated;
revoke all on function public.admin_update_specialty(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_set_specialty_active(uuid, boolean) from public, anon, authenticated;

grant execute on function public.admin_list_specialties() to authenticated;
grant execute on function public.admin_create_specialty(text) to authenticated;
grant execute on function public.admin_update_specialty(uuid, text) to authenticated;
grant execute on function public.admin_set_specialty_active(uuid, boolean) to authenticated;

-- O cadastro de médicos usa o nome canônico e rejeita especialidades inativas/ausentes.
create or replace function private.save_hospital_staff(
  p_email text, p_role text, p_full_name text, p_specialty text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_profile public.profiles;
  v_name text;
  v_specialty text;
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode='42501', message='Acesso administrativo negado.';
  end if;
  if p_role is null or p_role not in ('doctor','receptionist')
    or p_email is null or length(trim(p_email)) not between 3 and 254 then
    raise exception using errcode='22023', message='E-mail ou função inválidos.';
  end if;
  select p.* into v_profile from public.profiles p join auth.users u on u.id=p.id
    where lower(u.email)=lower(trim(p_email)) for update of p;
  if not found then raise exception using errcode='P0002', message='Conta não encontrada.'; end if;
  if v_profile.id=auth.uid() or v_profile.role='admin' then
    raise exception using errcode='42501', message='Não é permitido alterar administradores.';
  end if;
  if v_profile.role not in ('patient','doctor','receptionist') then
    raise exception using errcode='22023', message='Papel atual inválido.';
  end if;
  if v_profile.role<>p_role and exists (
    select 1 from public.appointments a where a.patient_id=v_profile.id or a.doctor_id=v_profile.id
  ) then raise exception using errcode='23514', message='Conta com consultas não pode trocar de função.'; end if;

  v_name := trim(coalesce(p_full_name,v_profile.full_name));
  if v_name is null or length(v_name) not between 3 and 120 then
    raise exception using errcode='22023', message='Informe o nome do profissional.';
  end if;

  if p_role='doctor' then
    select s.name into v_specialty
    from public.specialties s
    where s.active
      and lower(trim(s.name)) = lower(trim(coalesce(p_specialty, v_profile.specialty, '')))
    limit 1;

    if v_specialty is null then
      raise exception using errcode='22023', message='Selecione uma especialidade ativa.';
    end if;
  else
    v_specialty := null;
  end if;

  update public.profiles set role=p_role,full_name=v_name,specialty=v_specialty where id=v_profile.id;
  insert into public.hospital_staff(profile_id,hospital_id,active) values(v_profile.id,1,true)
    on conflict(profile_id) do update set active=true;
end;
$$;

-- Médicos de especialidade inativa deixam de aparecer para novos agendamentos.
create or replace function private.booking_doctors()
returns table(id uuid, full_name text, specialty text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Sessão obrigatória.';
  end if;

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

create or replace function private.reactivate_hospital_staff(p_profile_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_profile public.profiles;
begin
  if auth.uid() is null or not private.is_active_hospital_admin() then
    raise exception using errcode='42501', message='Acesso administrativo negado.';
  end if;
  select * into v_profile from public.profiles where id=p_profile_id for update;
  if not found then raise exception using errcode='P0002', message='Funcionário não encontrado.'; end if;
  if p_profile_id=auth.uid() or v_profile.role not in ('doctor','receptionist') then
    raise exception using errcode='42501', message='Somente médicos e secretarias podem ser reativados.';
  end if;
  if length(trim(coalesce(v_profile.full_name,''))) not between 3 and 120
    or (
      v_profile.role='doctor'
      and not exists (
        select 1 from public.specialties s
        where s.active and lower(trim(s.name))=lower(trim(coalesce(v_profile.specialty,'')))
      )
    )
  then
    raise exception using errcode='22023', message='Complete os dados do profissional com uma especialidade ativa antes de reativar.';
  end if;
  update public.hospital_staff set active=true
    where profile_id=p_profile_id and hospital_id=1;
  if not found then raise exception using errcode='P0002', message='Vínculo não encontrado.'; end if;
end;
$$;
