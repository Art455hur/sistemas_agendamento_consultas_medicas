"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAvailabilitySlot } from "@/features/appointments/availability.js";
import { createClient } from "@/lib/supabase/server";

const validUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function validDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(`${day}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === day;
}
function outcome(code, day) {
  const query = new URLSearchParams({ resultado: code });
  if (validDay(day)) query.set("dia", day);
  return `/secretaria?${query.toString()}#agenda`;
}
function errorCode(error) {
  return { "42501": "negado", "23505": "conflito", "P0002": "nao-encontrada", "22023": "invalido" }[error?.code] || "erro";
}
async function authenticatedClient() {
  if (process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true") redirect(outcome("indisponivel"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login?redirect=%2Fsecretaria");
  return supabase;
}
function refresh() {
  revalidatePath("/secretaria");
  revalidatePath("/agendamentos");
  revalidatePath("/dashboard");
  revalidatePath("/administracao");
}

export async function createAppointment(_previousState, formData) {
  const patientId = String(formData.get("patientId") ?? "");
  const doctorId = String(formData.get("doctorId") ?? "");
  const day = String(formData.get("day") ?? "");
  const time = String(formData.get("time") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!validUuid(patientId) || !validUuid(doctorId) || !validDay(day) || !isAvailabilitySlot(time) || reason.length > 2000) {
    return { message: "Confira o paciente, o profissional e a data, e selecione novamente um horário livre." };
  }
  const supabase = await authenticatedClient();
  const { data: appointmentId, error } = await supabase.rpc("receptionist_create_appointment", {
    p_patient_id: patientId, p_doctor_id: doctorId, p_day: day, p_time: time, p_reason: reason || null,
  });
  if (error || !appointmentId) {
    const message = {
      conflito: "O paciente ou o profissional já tem consulta nesse horário. Atualize os horários e escolha outro.",
      invalido: "A data, o paciente ou o horário não está mais disponível. Confira os dados e atualize os horários.",
      negado: "Não foi possível agendar: confira se seu vínculo de secretaria continua ativo.",
    }[errorCode(error)];
    if (!message) console.error("[secretaria] falha ao agendar:", error?.code || "SEM_ID");
    return { message: message || "Não foi possível confirmar o agendamento. Consulte a agenda antes de tentar novamente." };
  }
  refresh();
  redirect(outcome("criada", day));
}

export async function rescheduleAppointment(formData) {
  const id = String(formData.get("appointmentId") ?? "");
  const day = String(formData.get("day") ?? "");
  const time = String(formData.get("time") ?? "");
  if (!validUuid(id) || !validDay(day) || !isAvailabilitySlot(time)) redirect(outcome("invalido", day));
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("receptionist_reschedule_appointment", { p_id: id, p_day: day, p_time: time });
  if (error) redirect(outcome(errorCode(error), day));
  refresh();
  redirect(outcome("remarcada", day));
}

export async function cancelAppointment(formData) {
  const id = String(formData.get("appointmentId") ?? "");
  const day = String(formData.get("day") ?? "");
  if (!validUuid(id) || !validDay(day)) redirect(outcome("invalido", day));
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("receptionist_cancel_appointment", { p_id: id });
  if (error) redirect(outcome(errorCode(error), day));
  refresh();
  redirect(outcome("cancelada", day));
}
