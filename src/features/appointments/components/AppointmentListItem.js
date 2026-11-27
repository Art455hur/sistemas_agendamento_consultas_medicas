"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon.js";
import { formatDate, formatLongDate } from "../../../shared/formatting/date.js";

const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

function statusTone(status) {
  if (status === "Cancelada" || status === "Paciente faltou") return "ph-tone-danger";
  if (status === "Aguardando registro") return "ph-tone-warning";
  if (status === "Concluída" || status === "Atendida") return "ph-tone-neutral";
  return "ph-tone-success";
}

function dateParts(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return null;
  return {
    day: date.slice(8, 10),
    month: shortMonth.format(new Date(`${date}T12:00:00Z`)).replace(".", "").toUpperCase(),
  };
}

// Item da lista de "Meus agendamentos" no visual do protótipo.
export default function AppointmentListItem({ appointment, cancelling, onCancel }) {
  const status = appointment.status || "Agendada";
  const parts = dateParts(appointment.date);
  const longDate = formatLongDate(appointment.date);
  const canChange = status === "Agendada";

  return (
    <article className="ph-card ph-appointment" id={`consulta-${appointment.id}`}>
      <div className="ph-appointment-date" aria-hidden="true">
        <strong>{parts?.day ?? "--"}</strong>
        <span>{parts?.month ?? ""}</span>
        <small>{appointment.time}</small>
      </div>

      <div className="ph-appointment-copy">
        <div>
          <span className={`ph-status-pill ${statusTone(status)}`}><span aria-hidden="true" />{status}</span>
          <span>
            {longDate ? `${longDate.weekday}, ${longDate.dayMonth} de ${longDate.year}` : formatDate(appointment.date)}
            {" · "}{appointment.time}
          </span>
        </div>
        <h2>{appointment.doctor}</h2>
        <p>{appointment.specialty} · Hospital Sapiens</p>
        {appointment.reason && <small><strong>Motivo:</strong> {appointment.reason}</small>}
      </div>

      {canChange && (
        <div className="ph-appointment-actions">
          <Link href={`/agendar?remarcar=${appointment.id}`} className="ui-button ui-button-secondary">
            Remarcar <Icon name="edit" size={16} />
          </Link>
          <button
            type="button"
            className="ui-button ui-button-quiet"
            disabled={Boolean(cancelling)}
            onClick={() => onCancel(appointment.id)}
          >
            {cancelling === appointment.id ? "Cancelando..." : "Cancelar consulta"}
          </button>
        </div>
      )}
    </article>
  );
}
