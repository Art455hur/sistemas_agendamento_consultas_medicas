"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { selectedDay } from "./day";

export async function recordAppointmentOutcome(formData) {
  const day = selectedDay(formData.get("day"));
  const id = formData.get("appointmentId");
  const outcome = formData.get("outcome");
  const destination = day ? `/medico?dia=${day}` : "/medico";
  const result = (code) => redirect(`/medico?${new URLSearchParams({
    ...(day ? { dia: day } : {}), resultado: code,
  })}#doctor-agenda-heading`);

  if (!day || typeof id !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)
      || !["completed", "no_show"].includes(outcome)) result("invalido");
  if (process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) result("erro");

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims?.sub) redirect(`/login?${new URLSearchParams({ redirect: destination })}`);

  const { error } = await supabase.rpc("doctor_record_appointment_outcome", { p_id: id, p_outcome: outcome });
  if (error) result(({ "42501": "negado", "22023": "invalido", P0002: "indisponivel" })[error.code] || "erro");

  for (const path of ["/medico", "/secretaria", "/administracao", "/agendamentos", "/dashboard"]) revalidatePath(path);
  result("salvo");
}
