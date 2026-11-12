-- Validação no banco, inclusive em chamadas diretas à API.
-- Preserva CPFs antigos sem reescrever dados ou bloquear edições de outros campos.
create function private.is_valid_cpf(p_cpf text)
returns boolean
language plpgsql immutable strict security invoker
set search_path = ''
as $$
declare
  v_length integer;
  v_index integer;
  v_sum integer;
  v_remainder integer;
  v_digit integer;
begin
  -- O banco guarda somente números; a aplicação remove a máscara.
  if p_cpf !~ '^[0-9]{11}$' or p_cpf = repeat(left(p_cpf, 1), 11) then
    return false;
  end if;
  for v_length in 9..10 loop
    v_sum := 0;
    for v_index in 1..v_length loop
      v_sum := v_sum + substring(p_cpf, v_index, 1)::integer * (v_length + 2 - v_index);
    end loop;
    v_remainder := v_sum % 11;
    v_digit := case when v_remainder < 2 then 0 else 11 - v_remainder end;
    if substring(p_cpf, v_length + 1, 1)::integer <> v_digit then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

revoke all on function private.is_valid_cpf(text) from public, anon, authenticated;
-- A função invoker do trigger precisa validar atualizações feitas pelo titular.
grant execute on function private.is_valid_cpf(text) to authenticated;

create function private.validate_profile_cpf()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.cpf is not distinct from old.cpf then
      return new;
    end if;
  end if;
  -- NULL continua permitido para perfis ainda sem CPF, como funcionários.
  if new.cpf is not null and not private.is_valid_cpf(new.cpf) then
    raise exception using
      errcode = '23514',
      constraint = 'profiles_cpf_checksum_check',
      message = 'CPF inválido.';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_profile_cpf() from public, anon, authenticated;

create trigger profiles_validate_cpf
before insert or update of cpf on public.profiles
for each row execute function private.validate_profile_cpf();
