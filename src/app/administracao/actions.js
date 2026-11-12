"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function authEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH === "true" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

function resultUrl(result) {
  return `/administracao?resultado=${result}`;
}

function patientResultUrl(result) {
  return `/administracao/pacientes?resultado=${result}`;
}

function validUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function authenticatedClient() {
  if (!authEnabled()) redirect(resultUrl("indisponivel"));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login?redirect=%2Fadministracao");
  return supabase;
}

function specialtyErrorResult(error) {
  if (error?.code === "42501") return "negado";
  if (error?.code === "23505") return "especialidade-duplicada";
  if (error?.code === "P0002") return "especialidade-nao-encontrada";
  if (error?.code === "22023") return "especialidade-invalida";
  return "erro";
}

export async function assignStaff(formData) {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();
  if (email.length < 3 || email.length > 254 || !["doctor", "receptionist"].includes(role) ||
      fullName.length < 3 || fullName.length > 120 || specialty.length > 120 ||
      (role === "doctor" && !specialty)) {
    redirect(resultUrl("invalido"));
  }

  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("admin_save_staff", {
    p_email: email,
    p_role: role,
    p_full_name: fullName,
    p_specialty: role === "doctor" ? specialty : null,
  });
  if (error) {
    if (error.code === "42501") redirect(resultUrl("negado"));
    if (error.code === "P0002") redirect(resultUrl("nao-encontrado"));
    if (error.code === "23514") redirect(resultUrl("consultas"));
    if (error.code === "22023") redirect(resultUrl("especialidade-invalida"));
    redirect(resultUrl("erro"));
  }
  revalidatePath("/administracao");
  redirect(resultUrl("atribuido"));
}

export async function deactivateStaff(formData) {
  const profileId = String(formData.get("profileId") ?? "");
  if (!validUuid(profileId)) redirect(resultUrl("invalido"));

  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("admin_deactivate_staff", { p_profile_id: profileId });
  if (error) redirect(resultUrl(error.code === "42501" ? "negado" : "erro"));
  revalidatePath("/administracao");
  redirect(resultUrl("desativado"));
}

export async function reactivateStaff(formData) {
  const profileId = String(formData.get("profileId") ?? "");
  if (!validUuid(profileId)) redirect(resultUrl("invalido"));

  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("admin_reactivate_staff", { p_profile_id: profileId });
  if (error) {
    if (error.code === "42501") redirect(resultUrl("negado"));
    if (error.code === "22023") redirect(resultUrl("dados-incompletos"));
    if (error.code === "P0002") redirect(resultUrl("vinculo-nao-encontrado"));
    redirect(resultUrl("erro"));
  }
  revalidatePath("/administracao");
  redirect(resultUrl("reativado"));
}

export async function createSpecialty(formData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 120) redirect(resultUrl("especialidade-invalida"));

  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("admin_create_specialty", { p_name: name });
  if (error) redirect(resultUrl(specialtyErrorResult(error)));

  revalidatePath("/administracao");
  redirect(resultUrl("especialidade-criada"));
}

export async function updateSpecialty(formData) {
  const id = String(formData.get("specialtyId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!validUuid(id) || name.length < 2 || name.length > 120) {
    redirect(resultUrl("especialidade-invalida"));
  }

  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("admin_update_specialty", {
    p_id: id,
    p_name: name,
  });
  if (error) redirect(resultUrl(specialtyErrorResult(error)));

  revalidatePath("/administracao");
  redirect(resultUrl("especialidade-atualizada"));
}

async function setSpecialtyActive(formData, active) {
  const id = String(formData.get("specialtyId") ?? "");
  if (!validUuid(id)) redirect(resultUrl("especialidade-invalida"));

  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("admin_set_specialty_active", {
    p_id: id,
    p_active: active,
  });
  if (error) redirect(resultUrl(specialtyErrorResult(error)));

  revalidatePath("/administracao");
  redirect(resultUrl(active ? "especialidade-reativada" : "especialidade-desativada"));
}

export async function deactivateSpecialty(formData) {
  return setSpecialtyActive(formData, false);
}

export async function reactivateSpecialty(formData) {
  return setSpecialtyActive(formData, true);
}


function patientErrorResult(error) {
  if (error?.code === "42501") return "negado";
  if (error?.code === "23505") return "cpf-duplicado";
  if (error?.code === "P0002") return "paciente-nao-encontrado";
  if (error?.code === "22023" || error?.code === "23514") return "paciente-invalido";
  return "erro";
}

export async function updatePatient(formData) {
  const id = String(formData.get("patientId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const cpf = String(formData.get("cpf") ?? "").replace(/\D/g, "");
  const birthDate = String(formData.get("birthDate") ?? "").trim();

  if (
    !validUuid(id) ||
    fullName.length < 3 ||
    fullName.length > 120 ||
    (phone && (phone.length < 10 || phone.length > 11)) ||
    (cpf && cpf.length !== 11) ||
    (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate))
  ) {
    redirect(patientResultUrl("paciente-invalido"));
  }

  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("admin_update_patient", {
    p_id: id,
    p_full_name: fullName,
    p_phone: phone || null,
    p_cpf: cpf || null,
    p_birth_date: birthDate || null,
  });
  if (error) redirect(patientResultUrl(patientErrorResult(error)));

  revalidatePath("/administracao/pacientes");
  redirect(patientResultUrl("paciente-atualizado"));
}

async function setPatientActive(formData, active) {
  const id = String(formData.get("patientId") ?? "");
  if (!validUuid(id)) redirect(patientResultUrl("paciente-invalido"));

  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("admin_set_patient_active", {
    p_id: id,
    p_active: active,
  });
  if (error) redirect(patientResultUrl(patientErrorResult(error)));

  revalidatePath("/administracao/pacientes");
  redirect(patientResultUrl(active ? "paciente-reativado" : "paciente-desativado"));
}

export async function deactivatePatient(formData) {
  return setPatientActive(formData, false);
}

export async function reactivatePatient(formData) {
  return setPatientActive(formData, true);
}
