import { appointmentDisplayStatus, clinicDateTime } from "../../features/appointments/appointment-format.js";

export const filters = [
  ["scheduled", "Agendadas"],
  ["pending", "Aguardando registro"],
  ["completed", "Atendidas"],
  ["no_show", "Faltas"],
  ["cancelled", "Canceladas"],
];

export function summarizeAgenda(appointments, now) {
  const counts = Object.fromEntries(filters.map(([value]) => [value, 0]));
  let upcoming = null;
  let upcomingAt = Infinity;
  const rows = appointments.map((row) => {
    const status = appointmentDisplayStatus(row, now);
    const patient = row.patient_name?.trim() || "Paciente sem nome";
    const item = { ...row, status, patient, time: clinicDateTime(row.scheduled_at).time };
    counts[status]++;
    const at = Date.parse(row.scheduled_at);
    if (status === "scheduled" && at < upcomingAt) {
      upcoming = item;
      upcomingAt = at;
    }
    return item;
  });
  return { rows, counts, upcoming };
}

function normalize(value) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function filterAgenda(rows, query, status) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return rows.filter((row) => {
    if (status && row.status !== status) return false;
    const searchable = normalize([row.patient, row.specialty, row.time].filter(Boolean).join(" "));
    return terms.every((term) => searchable.includes(term));
  });
}
