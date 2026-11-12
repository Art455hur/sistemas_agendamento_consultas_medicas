-- Reativa somente um vínculo existente, preservando os dados do profissional.
create function private.reactivate_hospital_staff(p_profile_id uuid)
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
    or (v_profile.role='doctor' and length(trim(coalesce(v_profile.specialty,''))) not between 1 and 120)
  then
    raise exception using errcode='22023', message='Complete os dados do profissional antes de reativar.';
  end if;
  update public.hospital_staff set active=true
    where profile_id=p_profile_id and hospital_id=1;
  if not found then raise exception using errcode='P0002', message='Vínculo não encontrado.'; end if;
end;
$$;
revoke all on function private.reactivate_hospital_staff(uuid) from public,anon,authenticated;
grant execute on function private.reactivate_hospital_staff(uuid) to authenticated;

create function public.admin_reactivate_staff(p_profile_id uuid)
returns void language sql security invoker set search_path='' as $$
  select private.reactivate_hospital_staff(p_profile_id);
$$;
revoke all on function public.admin_reactivate_staff(uuid) from public,anon,authenticated;
grant execute on function public.admin_reactivate_staff(uuid) to authenticated;
