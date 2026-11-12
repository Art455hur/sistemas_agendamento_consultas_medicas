-- Versão alinhada à migration registrada no projeto Supabase de testes.
-- Um médico desativado não pode ler consultas mesmo usando a Data API diretamente.
-- O acesso do paciente às próprias consultas permanece inalterado.
drop policy if exists "appointment_patient_or_doctor_select" on public.appointments;

create policy "appointment_patient_or_doctor_select" on public.appointments
  for select to authenticated
  using (
    (select auth.uid()) = patient_id
    or (
      (select auth.uid()) = doctor_id
      and exists (
        select 1 from public.hospital_staff s
        where s.profile_id = (select auth.uid())
          and s.hospital_id = 1
          and s.active
      )
    )
  );
