-- Base mínima da N2. Nenhuma política de escrita de agendamentos é aberta ainda.
create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'patient'
    check (role in ('patient', 'doctor', 'receptionist', 'admin')),
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  doctor_id uuid not null references public.profiles(id),
  specialty text not null,
  scheduled_at timestamptz not null,
  reason text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint different_patient_and_doctor check (patient_id <> doctor_id)
);

create index appointments_patient_date_idx
  on public.appointments(patient_id, scheduled_at);
create index appointments_doctor_date_idx
  on public.appointments(doctor_id, scheduled_at);
create unique index appointments_one_active_doctor_slot_idx
  on public.appointments(doctor_id, scheduled_at) where status = 'scheduled';

alter table public.profiles enable row level security;
alter table public.appointments enable row level security;

-- Evita que um paciente altere seu próprio papel ou IDs pelo Data API.
revoke all on public.profiles from anon, authenticated;
revoke all on public.appointments from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant select on public.appointments to authenticated;

create policy "profile_self_select" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profile_self_update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "appointment_patient_or_doctor_select" on public.appointments
  for select to authenticated
  using ((select auth.uid()) = patient_id or (select auth.uid()) = doctor_id);

-- Os papéis vêm do banco, não de user_metadata editável no cadastro.
create function private.create_patient_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', ''), 120));
  return new;
end;
$$;

revoke all on function private.create_patient_profile() from public, anon, authenticated;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function private.create_patient_profile();
