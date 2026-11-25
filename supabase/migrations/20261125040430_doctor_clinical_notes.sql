-- Registro clínico separado da agenda; cada salvamento acrescenta uma versão.
create table private.doctor_clinical_note_versions (
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  revision integer not null check (revision > 0),
  author_id uuid not null references public.profiles(id) on delete restrict,
  evolution text not null check (char_length(evolution) <= 6000 and evolution ~ '[^[:space:]]'),
  diagnosis text check (char_length(diagnosis) <= 2000),
  plan text check (char_length(plan) <= 4000),
  recorded_at timestamptz not null default statement_timestamp(),
  primary key (appointment_id, revision)
);

alter table private.doctor_clinical_note_versions enable row level security;
revoke all on table private.doctor_clinical_note_versions from public, anon, authenticated;

create function private.active_clinical_doctor()
returns uuid
language plpgsql stable security invoker set search_path = '' as $$
declare
  v_doctor uuid := auth.uid();
begin
  if v_doctor is null or not exists (
    select 1 from public.profiles p
    join public.hospital_staff s on s.profile_id = p.id
    where p.id = v_doctor and p.role = 'doctor' and s.hospital_id = 1 and s.active
  ) then
    raise exception using errcode = '42501', message = 'Vínculo médico ativo obrigatório.';
  end if;
  return v_doctor;
end;
$$;
revoke all on function private.active_clinical_doctor() from public, anon, authenticated;

create function private.doctor_get_clinical_note(p_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_doctor uuid := private.active_clinical_doctor();
  v_note jsonb;
begin
  select jsonb_build_object(
    'patient_name', p.full_name, 'specialty', a.specialty, 'scheduled_at', a.scheduled_at,
    'revision', coalesce(n.revision, 0), 'recorded_at', n.recorded_at,
    'evolution', n.evolution, 'diagnosis', n.diagnosis, 'plan', n.plan
  ) into v_note
  from public.appointments a
  join public.profiles p on p.id = a.patient_id
  left join lateral (
    select v.revision, v.recorded_at, v.evolution, v.diagnosis, v.plan
    from private.doctor_clinical_note_versions v
    where v.appointment_id = a.id and v.author_id = v_doctor
    order by v.revision desc limit 1
  ) n on true
  where a.id = p_id and a.doctor_id = v_doctor and a.status = 'completed'
    and a.scheduled_at <= statement_timestamp();

  if not found then raise exception using errcode = 'P0002', message = 'Registro clínico indisponível.'; end if;
  return v_note;
end;
$$;

create function private.doctor_save_clinical_note(
  p_id uuid, p_revision integer, p_evolution text, p_diagnosis text, p_plan text
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_doctor uuid := private.active_clinical_doctor();
  v_revision integer;
begin
  if p_id is null or p_revision is null or p_revision < 0
    or p_evolution is null or p_evolution !~ '[^[:space:]]' or char_length(p_evolution) > 6000
    or char_length(p_diagnosis) > 2000 or char_length(p_plan) > 4000 then
    raise exception using errcode = '22023', message = 'Registro inválido.';
  end if;

  -- Serializa salvamentos do mesmo atendimento e não sobrescreve uma versão mais recente.
  perform 1 from public.appointments a
    where a.id = p_id and a.doctor_id = v_doctor and a.status = 'completed'
      and a.scheduled_at <= statement_timestamp() for update;
  if not found then raise exception using errcode = 'P0002', message = 'Registro clínico indisponível.'; end if;

  select coalesce(max(v.revision), 0) into v_revision
    from private.doctor_clinical_note_versions v where v.appointment_id = p_id;
  if v_revision <> p_revision then raise exception using errcode = '40001', message = 'Registro atualizado em outra sessão.'; end if;

  insert into private.doctor_clinical_note_versions(appointment_id, revision, author_id, evolution, diagnosis, plan)
    values (p_id, v_revision + 1, v_doctor, p_evolution, p_diagnosis, p_plan);
  return v_revision + 1;
end;
$$;

revoke all on function private.doctor_get_clinical_note(uuid) from public, anon, authenticated;
revoke all on function private.doctor_save_clinical_note(uuid, integer, text, text, text) from public, anon, authenticated;
grant execute on function private.doctor_get_clinical_note(uuid) to authenticated;
grant execute on function private.doctor_save_clinical_note(uuid, integer, text, text, text) to authenticated;

create function public.doctor_get_clinical_note(p_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select private.doctor_get_clinical_note(p_id);
$$;

create function public.doctor_save_clinical_note(
  p_id uuid, p_revision integer, p_evolution text, p_diagnosis text, p_plan text
) returns integer language sql security invoker set search_path = '' as $$
  select private.doctor_save_clinical_note(p_id, p_revision, p_evolution, p_diagnosis, p_plan);
$$;

revoke all on function public.doctor_get_clinical_note(uuid) from public, anon, authenticated;
revoke all on function public.doctor_save_clinical_note(uuid, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.doctor_get_clinical_note(uuid) to authenticated;
grant execute on function public.doctor_save_clinical_note(uuid, integer, text, text, text) to authenticated;
