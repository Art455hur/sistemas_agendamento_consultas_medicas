// Avisos derivados do estado atual, sem gravar uma segunda cópia das consultas.
export function appointmentNotifications(appointments, now = new Date()) {
  const upcoming = [];
  const cancelled = [];
  for (const appointment of appointments) {
    if (appointment.id === undefined || appointment.id === null) continue;
    const scheduledAt = new Date(appointment.scheduledAt || `${appointment.date}T${appointment.time}`).getTime();
    if (!Number.isFinite(scheduledAt)) continue;
    const isCancelled = appointment.status === "Cancelada";
    const isScheduled = !appointment.status || appointment.status === "Agendada";
    if (!isCancelled && (!isScheduled || scheduledAt < now.getTime())) continue;
    const tab = isCancelled ? "cancelled" : "scheduled";
    const notification = {
      id: String(appointment.id),
      kind: tab,
      scheduledAt,
      title: isCancelled ? "Consulta cancelada" : "Consulta agendada",
      icon: isCancelled ? "✕" : "🗓️",
      specialty: appointment.specialty,
      doctor: appointment.doctor,
      date: appointment.date,
      time: appointment.time,
      href: `/agendamentos?aba=${tab}#consulta-${encodeURIComponent(appointment.id)}`,
    };
    (isCancelled ? cancelled : upcoming).push(notification);
  }
  upcoming.sort((a, b) => a.scheduledAt - b.scheduledAt || a.id.localeCompare(b.id));
  cancelled.sort((a, b) => b.scheduledAt - a.scheduledAt || a.id.localeCompare(b.id));
  if (upcoming[0]) upcoming[0].title = "Próxima consulta";
  return [...upcoming, ...cancelled];
}
