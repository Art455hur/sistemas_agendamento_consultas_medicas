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

export async function assignStaff(formData) {
  if (!authEnabled()) redirect(resultUrl("indisponivel"));

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();
  if (email.length < 3 || email.length > 254 || !["doctor", "receptionist"].includes(role) ||
      fullName.length < 3 || fullName.length > 120 || specialty.length > 120 ||
      (role === "doctor" && !specialty)) {
    redirect(resultUrl("invalido"));
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const claims = authData?.claims;
  if (authError || !claims?.sub) redirect("/login?redirect=%2Fadministracao");

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
    redirect(resultUrl("erro"));
  }
  revalidatePath("/administracao");
  redirect(resultUrl("atribuido"));
}

export async function deactivateStaff(formData) {
  if (!authEnabled()) redirect(resultUrl("indisponivel"));

  const profileId = String(formData.get("profileId") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
    redirect(resultUrl("invalido"));
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const claims = authData?.claims;
  if (authError || !claims?.sub) redirect("/login?redirect=%2Fadministracao");

  const { error } = await supabase.rpc("admin_deactivate_staff", { p_profile_id: profileId });
  if (error) redirect(resultUrl(error.code === "42501" ? "negado" : "erro"));
  revalidatePath("/administracao");
  redirect(resultUrl("desativado"));
}

export async function reactivateStaff(formData) {
  if (!authEnabled()) redirect(resultUrl("indisponivel"));

  const profileId = String(formData.get("profileId") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
    redirect(resultUrl("invalido"));
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims?.sub) redirect("/login?redirect=%2Fadministracao");

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
