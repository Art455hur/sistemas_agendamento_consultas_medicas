-- Completa os dados do profissional sem liberar edição de papéis pelo cliente.
-- Não altera perfis existentes; a gravação exige uma ação do administrador ativo.
create function private.save_hospital_staff(
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
    v_specialty := nullif(trim(coalesce(p_specialty,v_profile.specialty)), '');
    if v_specialty is null or length(v_specialty)>120 then
      raise exception using errcode='22023', message='Informe a especialidade do médico.';
    end if;
  else
    v_specialty := null;
  end if;

  update public.profiles set role=p_role,full_name=v_name,specialty=v_specialty where id=v_profile.id;
  insert into public.hospital_staff(profile_id,hospital_id,active) values(v_profile.id,1,true)
    on conflict(profile_id) do update set active=true;
end;
$$;
revoke all on function private.save_hospital_staff(text,text,text,text) from public,anon,authenticated;
grant execute on function private.save_hospital_staff(text,text,text,text) to authenticated;

create function public.admin_save_staff(p_email text,p_role text,p_full_name text,p_specialty text)
returns void language sql security invoker set search_path='' as $$
  select private.save_hospital_staff(p_email,p_role,p_full_name,p_specialty);
$$;
revoke all on function public.admin_save_staff(text,text,text,text) from public,anon,authenticated;
grant execute on function public.admin_save_staff(text,text,text,text) to authenticated;

-- Clientes antigos só podem vincular médicos cujos dados já estejam completos.
create or replace function public.admin_assign_staff(p_email text,p_role text)
returns void language sql security invoker set search_path='' as $$
  select private.save_hospital_staff(p_email,p_role,null,null);
$$;
revoke all on function public.admin_assign_staff(text,text) from public,anon,authenticated;
grant execute on function public.admin_assign_staff(text,text) to authenticated;
