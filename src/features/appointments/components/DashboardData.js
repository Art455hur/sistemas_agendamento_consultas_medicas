"use client";

import { useState } from "react";
import Link from "next/link";
import ErrorNotice from "@/components/feedback/ErrorNotice.js";
import Dialog from "@/components/ui/Dialog.js";
import Icon from "@/components/ui/Icon.js";
import { formatDate, formatLongDate } from "../../../shared/formatting/date.js";
import { useAppointments } from "../hooks/useAppointments.js";
import { cancelAppointment } from "../services/appointments.js";

function capitalize(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

function Detail({ icon, title, text }) {
  return (
    <div className="ph-detail">
      <span aria-hidden="true"><Icon name={icon} size={19} /></span>
      <p><strong>{title}</strong><small>{text}</small></p>
    </div>
  );
}

// Próxima consulta do paciente, com remarcar e cancelar, no visual do protótipo.
export default function DashboardData() {
  const { appointments, loading, error, retry } = useAppointments();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const now = new Date();
  const nextAppointment = appointments
    .filter((appointment) => {
      const appointmentDate = new Date(appointment.scheduledAt || `${appointment.date}T${appointment.time}`);
      return appointment.status === "Agendada" && appointmentDate >= now;
    })
    .sort((first, second) => `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`))[0];

  function closeCancel() {
    setConfirmingCancel(false);
    setCancelError("");
  }

  async function confirmCancel() {
    setCancelling(true);
    setCancelError("");
    try {
      await cancelAppointment(nextAppointment.id);
      setConfirmingCancel(false);
    } catch (failure) {
      setCancelError(failure.message || "Não foi possível cancelar a consulta. Tente novamente.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <p className="ph-status" role="status">Carregando consultas...</p>;
  if (error) return <ErrorNotice message={error} onRetry={retry} />;

  const longDate = nextAppointment ? formatLongDate(nextAppointment.date) : null;
  const dateTitle = longDate ? `${capitalize(longDate.weekday)}, ${longDate.dayMonth}` : formatDate(nextAppointment?.date);

  return (
    <>
      <section className="ph-next" aria-labelledby="proxima-consulta">
        <div className="ph-section-heading">
          <div>
            <p className="ph-eyebrow">Sua agenda</p>
            <h2 id="proxima-consulta">Próxima consulta</h2>
          </div>
          {nextAppointment && <span className="ph-status-pill"><span aria-hidden="true" />Agendada</span>}
        </div>

        {nextAppointment ? (
          <div className="ph-card ph-next-card">
            <div className="ph-next-date">
              <span className="ph-soft-icon" aria-hidden="true"><Icon name="calendar" size={26} /></span>
              <div>
                <strong>{dateTitle}</strong>
                <span>{longDate ? `${longDate.year} · às ${nextAppointment.time}` : `às ${nextAppointment.time}`}</span>
              </div>
            </div>
            <div className="ph-next-details">
              <Detail icon="user" title={nextAppointment.doctor} text={nextAppointment.specialty} />
              <Detail icon="pin" title="Hospital Sapiens" text="Unidade principal" />
            </div>
            <div className="ph-card-actions">
              <Link className="ui-button ui-button-secondary" href={`/agendar?remarcar=${nextAppointment.id}`}>
                Remarcar
              </Link>
              <button type="button" className="ui-button ui-button-quiet" onClick={() => setConfirmingCancel(true)}>
                Cancelar consulta
              </button>
            </div>
          </div>
        ) : (
          <div className="ph-card ph-empty">
            <span className="ph-soft-icon" aria-hidden="true"><Icon name="calendar" /></span>
            <h3>Você não possui consultas agendadas</h3>
            <p>Escolha uma especialidade e encontre o melhor horário para você.</p>
            <Link className="ui-button ui-button-primary" href="/agendar">
              Agendar consulta <Icon name="arrow" size={18} />
            </Link>
          </div>
        )}
      </section>

      <div className="ph-callout">
        <span className="ph-soft-icon" aria-hidden="true"><Icon name="calendar" /></span>
        <div>
          <strong>Precisa de outro atendimento?</strong>
          <p>Encontre o melhor horário para sua próxima consulta.</p>
        </div>
        <Link href="/agendar">Ver horários <Icon name="arrow" size={16} /></Link>
      </div>

      {confirmingCancel && nextAppointment && (
        <Dialog title="Cancelar consulta?" onClose={closeCancel} busy={cancelling}>
          <p className="ui-dialog-text">
            Você está prestes a cancelar a consulta com <strong>{nextAppointment.doctor}</strong>,
            {" "}em {longDate ? `${longDate.dayMonth} de ${longDate.year}` : formatDate(nextAppointment.date)}, às {nextAppointment.time}.
          </p>
          {cancelError && <p className="ui-dialog-error" role="alert">{cancelError}</p>}
          <div className="ui-dialog-actions">
            <button type="button" className="ui-button ui-button-secondary" onClick={closeCancel} disabled={cancelling} data-autofocus>
              Manter consulta
            </button>
            <button type="button" className="ui-button ui-button-danger" onClick={confirmCancel} disabled={cancelling}>
              {cancelling ? "Cancelando..." : "Sim, cancelar consulta"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
