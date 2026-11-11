-- N2: um hospital, com perfis de funcionário vinculados à instituição.
-- Esta migração não cria administradores e não permite cadastro de equipe pelo cliente.
create table public.hospital (
  id smallint primary key default 1 check (id = 1),
  name text not null check (length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now()
);

insert into public.hospital (id, name) values (1, 'Hospital Sapiens');

create table public.hospital_staff (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  hospital_id smallint not null default 1 references public.hospital(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index hospital_staff_hospital_id_idx on public.hospital_staff(hospital_id);

alter table public.hospital enable row level security;
alter table public.hospital_staff enable row level security;

revoke all on public.hospital from anon, authenticated;
revoke all on public.hospital_staff from anon, authenticated;
grant select on public.hospital to authenticated;
grant select on public.hospital_staff to authenticated;

create policy hospital_authenticated_read on public.hospital
  for select to authenticated using (true);

-- Um funcionário só vê o próprio vínculo. Leitura administrativa e escrita
-- serão implementadas com verificação de papel no banco em etapa própria.
create policy hospital_staff_self_read on public.hospital_staff
  for select to authenticated
  using (profile_id = (select auth.uid()));
