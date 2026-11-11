-- Versão alinhada à migration registrada no projeto Supabase de testes.
-- As operações abaixo são as únicas escritas de equipe disponíveis à sessão web.
-- Nenhuma delas cria contas Auth ou concede o papel de administrador.
create function private.is_active_hospital_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.hospital_staff s on s.profile_id = p.id
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and s.hospital_id = 1
      and s.active
  );
$$;

revoke all on function private.is_active_hospital_admin() from public, anon, authenticated;

-- SECURITY DEFINER é necessário para consultar auth.users sem revelar a tabela
-- aos clientes. Cada função checa o administrador ATIVO antes de ler ou escrever.
create function public.admin_list_staff()
returns table (profile_id uuid, email text, full_name text, staff_role text, active boolean)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not private.is_active_hospital_admin() then
    raise exception 'Acesso administrativo negado' using errcode = '42501';
  end if;

  return query
    select p.id, u.email::text, p.full_name, p.role, s.active
    from public.hospital_staff s
    join public.profiles p on p.id = s.profile_id
    join auth.users u on u.id = p.id
    where s.hospital_id = 1
    order by p.full_name, u.email;
end;
$$;

create function public.admin_assign_staff(p_email text, p_role text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_target uuid;
  v_old_role text;
begin
  if not private.is_active_hospital_admin() then
    raise exception 'Acesso administrativo negado' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('doctor', 'receptionist') then
    raise exception 'Papel inválido para funcionário' using errcode = '22023';
  end if;
  if p_email is null or length(trim(p_email)) not between 3 and 254 then
    raise exception 'E-mail inválido' using errcode = '22023';
  end if;

  select p.id, p.role into v_target, v_old_role
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(trim(p_email))
  for update of p;

  if v_target is null then
    raise exception 'Conta não encontrada; crie-a em Auth primeiro' using errcode = 'P0002';
  end if;
  if v_target = (select auth.uid()) or v_old_role = 'admin' then
    raise exception 'O administrador não pode alterar o próprio papel nem outro administrador' using errcode = '42501';
  end if;
  if v_old_role not in ('patient', 'doctor', 'receptionist') then
    raise exception 'Papel atual inválido' using errcode = '22023';
  end if;
  if v_old_role <> p_role and exists (
    select 1 from public.appointments a
    where a.patient_id = v_target or a.doctor_id = v_target
  ) then
    raise exception 'Conta com consultas vinculadas não pode trocar de papel' using errcode = '23514';
  end if;

  update public.profiles set role = p_role where id = v_target;
  insert into public.hospital_staff (profile_id, hospital_id, active)
    values (v_target, 1, true)
    on conflict (profile_id) do update set active = true;
end;
$$;

create function public.admin_deactivate_staff(p_profile_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if not private.is_active_hospital_admin() then
    raise exception 'Acesso administrativo negado' using errcode = '42501';
  end if;
  if p_profile_id is null or p_profile_id = (select auth.uid()) then
    raise exception 'Não é possível desativar a própria conta' using errcode = '42501';
  end if;
  select role into v_role from public.profiles where id = p_profile_id for update;
  if v_role is null or v_role not in ('doctor', 'receptionist') then
    raise exception 'Somente médicos e secretárias podem ser desativados aqui' using errcode = '42501';
  end if;

  update public.hospital_staff set active = false
  where profile_id = p_profile_id and hospital_id = 1;
  if not found then
    raise exception 'Vínculo não encontrado' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_list_staff() from public, anon, authenticated;
revoke all on function public.admin_assign_staff(text, text) from public, anon, authenticated;
revoke all on function public.admin_deactivate_staff(uuid) from public, anon, authenticated;
grant execute on function public.admin_list_staff() to authenticated;
grant execute on function public.admin_assign_staff(text, text) to authenticated;
grant execute on function public.admin_deactivate_staff(uuid) to authenticated;
