"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

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
  if (email.length < 3 || email.length > 254 || !["doctor", "receptionist"].includes(role)) {
    redirect(resultUrl("invalido"));
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const claims = authData?.claims;
  if (authError || !claims?.sub) redirect("/login?redirect=%2Fadministracao");

  const { error } = await supabase.rpc("admin_assign_staff", {
    p_email: email,
    p_role: role,
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
