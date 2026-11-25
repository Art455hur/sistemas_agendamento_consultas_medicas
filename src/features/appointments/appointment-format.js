// Todos os horários da clínica usam o mesmo fuso, inclusive em outro aparelho.
export const CLINIC_TIME_ZONE = "America/Sao_Paulo";

const clinicFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });

export function clinicDateTime(value) {
  const parts = clinicFormatter.formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type).value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export const appointmentStatusLabels = Object.freeze({
  scheduled: "Agendada",
  pending: "Aguardando registro",
  completed: "Atendida",
  no_show: "Paciente faltou",
  cancelled: "Cancelada",
});

export function appointmentDisplayStatus(row, now = Date.now()) {
  if (!Object.hasOwn(appointmentStatusLabels, row.status)) return "scheduled";
  if (row.status === "scheduled" && Date.parse(row.scheduled_at) <= now) return "pending";
  return row.status;
}

export function isPastAppointmentStatus(status) {
  return ["Concluída", "Atendida", "Paciente faltou", "Aguardando registro"].includes(status);
}

export function fromAppointmentRow(row, now = new Date()) {
  return {
    id: row.id, doctorId: row.doctor_id,
    doctor: row.doctor_name || "Profissional", specialty: row.specialty,
    scheduledAt: row.scheduled_at, ...clinicDateTime(row.scheduled_at),
    reason: row.reason || "",
    status: appointmentStatusLabels[appointmentDisplayStatus(row, now)],
  };
}

export function appointmentError(error) {
  if (error?.code === "23505") return "Esse horário acabou de ser reservado. Escolha outro horário.";
  if (error?.code === "42501") return "Sua conta não pode realizar esta ação. Entre como paciente.";
  if (error?.code === "P0002") return "Consulta não encontrada ou indisponível para alteração.";
  if (error?.code === "22023") return "Confira o profissional e escolha um horário futuro disponível.";
  return "Não foi possível acessar as consultas. Confira sua conexão e tente novamente.";
}
