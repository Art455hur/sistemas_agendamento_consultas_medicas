const APP_STATUS = {
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export function appointmentFromRow(row) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(row.scheduled_at));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    id: row.id,
    doctorId: row.doctor_id,
    specialty: row.specialty,
    doctor: row.doctor_name || "Profissional de saúde",
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
    reason: row.reason || "",
    status: APP_STATUS[row.status] || "Agendada",
    scheduledAt: row.scheduled_at,
  };
}

export function scheduledAtFromLocal(date, time) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

export async function listPatientAppointments(supabase) {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, doctor_id, specialty, doctor_name, scheduled_at, reason, status")
    .order("scheduled_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(appointmentFromRow);
}

