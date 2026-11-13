"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AVAILABILITY_SLOTS } from "@/features/appointments/availability.js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function target(doctorId, day, status) {
  const query = new URLSearchParams();
  if (uuid.test(doctorId)) query.set("medico", doctorId);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) query.set("dia", day);
  if (status) query.set("resultado", status);
  return `/administracao/horarios?${query}`;
}

async function changeAvailability(formData, operation) {
  const doctorId = String(formData.get("doctorId") || "");
  const day = String(formData.get("day") || "");
  const slots = formData.getAll("slots").map(String);
  if (!uuid.test(doctorId) || !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    slots.length > AVAILABILITY_SLOTS.length || new Set(slots).size !== slots.length ||
    slots.some((slot) => !AVAILABILITY_SLOTS.includes(slot))) {
    redirect(target(doctorId, day, "invalido"));
  }
  if (process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true") {
    redirect(target(doctorId, day, "indisponivel"));
  }
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims?.sub) redirect("/login?redirect=%2Fadministracao%2Fhorarios");

  const { error } = operation === "reset"
    ? await supabase.rpc("admin_reset_doctor_day", { p_doctor_id: doctorId, p_day: day })
    : await supabase.rpc("admin_set_doctor_day", { p_doctor_id: doctorId, p_day: day, p_slots: slots });
  if (error) {
    const result = error.code === "42501" ? "negado" : error.code === "23514" ? "ocupado" :
      error.code === "22023" ? "invalido" : "erro";
    redirect(target(doctorId, day, result));
  }
  revalidatePath("/administracao/horarios");
  redirect(target(doctorId, day, operation === "reset" ? "restaurado" : "salvo"));
}

export async function saveAvailability(formData) {
  return changeAvailability(formData, "save");
}

export async function resetAvailability(formData) {
  return changeAvailability(formData, "reset");
}
