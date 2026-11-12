import { createClient, isSupabaseConfigured } from "./supabase/client.js";
import { appointmentError, clinicDateTime, fromAppointmentRow } from "../features/appointments/appointment-format.js";

const legacyDoctors = {
  Cardiologia: "Dra. Mariana Silva", Ortopedia: "Dr. Lucas Ferreira",
  Dermatologia: "Dra. Camila Rodrigues", Pediatria: "Dra. Juliana Costa",
  Ginecologia: "Dra. Fernanda Lima", "Clínica Geral": "Dr. Rafael Almeida",
  Neurologia: "Dr. Paulo Mendes", Oftalmologia: "Dra. Beatriz Alves",
};

function localAppointments() {
  return JSON.parse(localStorage.getItem("appointments") || "[]").map((item) => ({
    ...item, doctorId: item.doctorId || item.doctor,
    status: item.status === "Cancelada" ? "Cancelada"
      : new Date(`${item.date}T${item.time}`) < new Date() ? "Concluída" : item.status || "Agendada",
  }));
}

function changed() {
  window.dispatchEvent(new Event("appointmentsUpdated"));
}

function saveLocal(items) {
  localStorage.setItem("appointments", JSON.stringify(items));
  changed();
}

async function patientClient() {
  const client = createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Sua sessão expirou. Entre novamente.");
  return { client, user };
}

async function rpc(name, args) {
  const { client } = await patientClient();
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(appointmentError(error));
  return data;
}

export async function getAppointments() {
  if (!isSupabaseConfigured()) return localAppointments();
  const { client, user } = await patientClient();
  const { data, error } = await client.from("appointments")
    .select("id, doctor_id, doctor_name, specialty, scheduled_at, reason, status")
    .eq("patient_id", user.id).order("scheduled_at");
  if (error) throw new Error(appointmentError(error));
  return data.map((row) => fromAppointmentRow(row));
}

export async function getAppointment(id) {
  if (!id) return null;
  if (!isSupabaseConfigured()) return localAppointments().find((item) => String(item.id) === String(id)) || null;
  const { client, user } = await patientClient();
  const { data, error } = await client.from("appointments")
    .select("id, doctor_id, doctor_name, specialty, scheduled_at, reason, status")
    .eq("id", id).eq("patient_id", user.id).maybeSingle();
  if (error) throw new Error(appointmentError(error));
  return data ? fromAppointmentRow(data) : null;
}

export async function getBookingDoctors() {
  if (!isSupabaseConfigured()) return Object.entries(legacyDoctors)
    .map(([specialty, full_name]) => ({ id: full_name, full_name, specialty }));
  return (await rpc("booking_doctors")) || [];
}

export async function getBookingSlots(doctorId, date, appointmentId = null) {
  if (!doctorId || !date) return [];
  if (!isSupabaseConfigured()) {
    const appointments = localAppointments();
    return ["08:00", "09:00", "10:30", "14:00", "15:30"]
      .filter((time) => new Date(`${date}T${time}`) > new Date() && !appointments.some((item) =>
        item.status === "Agendada" && item.date === date && item.time === time &&
        String(item.id) !== String(appointmentId)))
      .map((time) => ({ time, scheduledAt: `${date}T${time}` }));
  }
  const rows = await rpc("booking_slots", { p_doctor_id: doctorId, p_date: date, p_appointment_id: appointmentId });
  return rows.map((row) => ({ time: clinicDateTime(row.scheduled_at).time, scheduledAt: row.scheduled_at }));
}

export async function saveAppointment(form, appointmentId = null) {
  if (!isSupabaseConfigured()) {
    const appointments = localAppointments();
    if (new Date(form.scheduledAt) <= new Date()) throw new Error("Escolha um horário futuro.");
    if (appointments.some((item) => item.status === "Agendada" && item.date === form.date && item.time === form.time &&
      String(item.id) !== String(appointmentId))) throw new Error("Você já possui uma consulta neste horário.");
    const current = appointmentId ? appointments.find((item) => String(item.id) === String(appointmentId)) : null;
    if (appointmentId && current?.status !== "Agendada") throw new Error("Consulta indisponível para alteração.");
    const item = current ? { ...current, date: form.date, time: form.time, scheduledAt: form.scheduledAt }
      : { ...form, id: crypto.randomUUID(), status: "Agendada" };
    saveLocal(current ? appointments.map((saved) => saved.id === current.id ? item : saved) : [...appointments, item]);
    return item;
  }
  const rows = appointmentId
    ? await rpc("reschedule_patient_appointment", { p_appointment_id: appointmentId, p_scheduled_at: form.scheduledAt })
    : await rpc("create_patient_appointment", { p_doctor_id: form.doctorId, p_scheduled_at: form.scheduledAt, p_reason: form.reason });
  if (!rows?.[0]) throw new Error("Não foi possível confirmar a consulta.");
  changed();
  return fromAppointmentRow(rows[0]);
}

export async function cancelAppointment(id) {
  if (!isSupabaseConfigured()) {
    saveLocal(localAppointments().map((item) => String(item.id) === String(id) ? { ...item, status: "Cancelada" } : item));
    return;
  }
  await rpc("cancel_patient_appointment", { p_appointment_id: id });
  changed();
}
