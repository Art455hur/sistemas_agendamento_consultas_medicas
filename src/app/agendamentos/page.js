"use client";

import ErrorNotice from "@/components/feedback/ErrorNotice.js";

import AppointmentListItem from "@/features/appointments/components/AppointmentListItem.js";
import { isPastAppointmentStatus } from "@/features/appointments/appointment-format.js";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppointments } from "@/features/appointments/hooks/useAppointments.js";
import { cancelAppointment as cancelSavedAppointment } from "@/features/appointments/services/appointments.js";
import PatientShell from "@/components/layout/PatientShell.js";
import Dialog from "@/components/ui/Dialog.js";
import { formatDate } from "@/shared/formatting/date.js";

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("aba");
  const lastScrolledLocation = useRef("");
  const { appointments, loading, error, retry } = useAppointments();
  const [activeTab, setActiveTab] = useState("scheduled");
  const [cancelling, setCancelling] = useState(null);
  const [actionError, setActionError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  useEffect(() => {
    if (["scheduled", "completed", "cancelled"].includes(requestedTab)) setActiveTab(requestedTab);
  }, [requestedTab]);

  useEffect(() => {
    if (loading || error || !window.location.hash.startsWith("#consulta-")) return;
    const location = window.location.search + window.location.hash;
    if (lastScrolledLocation.current === location) return;
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch { return; }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ block: "center" });
      lastScrolledLocation.current = location;
    }
  }, [activeTab, appointments, loading, error, searchParams]);

  const scheduledAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "Agendada" ||
      !appointment.status
  );

  const historyAppointments = appointments.filter(
    (appointment) =>
      isPastAppointmentStatus(appointment.status)
  );

  const cancelledAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "Cancelada"
  );

  const appointmentsByTab = {
    scheduled: scheduledAppointments,
    completed: historyAppointments,
    cancelled: cancelledAppointments,
  };

  const filteredAppointments =
    appointmentsByTab[activeTab];

  const emptyMessages = {
    scheduled: {
      title: "Nenhuma consulta agendada",
      description:
        "Você ainda não possui consultas futuras.",
    },
    completed: {
      title: "Nenhuma consulta no histórico",
      description:
        "Suas consultas passadas aparecerão aqui, com a situação de cada uma.",
    },
    cancelled: {
      title: "Nenhuma consulta cancelada",
      description:
        "Você não possui consultas canceladas.",
    },
  };

  const currentEmptyMessage =
    emptyMessages[activeTab];

  // Abre o card de confirmação; o cancelamento só acontece em "Sim, cancelar consulta".
  function askToCancel(appointmentId) {
    if (cancelling) return;
    setActionError("");
    setCancelTarget(appointments.find((appointment) => appointment.id === appointmentId) || null);
  }

  async function confirmCancel() {
    const appointmentId = cancelTarget.id;
    setCancelling(appointmentId);
    setActionError("");
    try {
      await cancelSavedAppointment(appointmentId);
      setCancelTarget(null);
    } catch (failure) {
      setActionError(failure.message || "Não foi possível cancelar a consulta. Tente novamente.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <PatientShell title="Meus agendamentos" activePath="/agendamentos">

        <div className="appointments-content">
          <header className="appointments-heading">
            <div>
              <h1>Meus agendamentos</h1>

              <p>
                Acompanhe e gerencie suas consultas.
              </p>
            </div>

            <Link
              href="/agendar"
              className="new-appointment-button"
            >
              + Nova consulta
            </Link>
          </header>

          <section className="appointments-tabs">
            <button
              type="button"
              className={
                activeTab === "scheduled"
                  ? "appointments-tab active"
                  : "appointments-tab"
              }
              onClick={() =>
                setActiveTab("scheduled")
              }
            >
              Próximas
              <span>
                {scheduledAppointments.length}
              </span>
            </button>

            <button
              type="button"
              className={
                activeTab === "completed"
                  ? "appointments-tab active"
                  : "appointments-tab"
              }
              onClick={() =>
                setActiveTab("completed")
              }
            >
              Histórico
              <span>
                {historyAppointments.length}
              </span>
            </button>

            <button
              type="button"
              className={
                activeTab === "cancelled"
                  ? "appointments-tab active"
                  : "appointments-tab"
              }
              onClick={() =>
                setActiveTab("cancelled")
              }
            >
              Canceladas
              <span>
                {cancelledAppointments.length}
              </span>
            </button>
          </section>

          {actionError && !cancelTarget && <p role="alert">{actionError}</p>}
          {loading ? <p role="status">Carregando consultas...</p> : error ? <ErrorNotice message={error} onRetry={retry} /> : filteredAppointments.length === 0 ? (
            <section className="empty-appointments">
              <div>🗓️</div>

              <h2>
                {currentEmptyMessage.title}
              </h2>

              <p>
                {currentEmptyMessage.description}
              </p>

              {activeTab === "scheduled" && (
                <Link href="/agendar">
                  Agendar consulta
                </Link>
              )}
            </section>
          ) : (
            <section className="appointments-list">
              {filteredAppointments.map(
                (appointment) => (
                  <AppointmentListItem
                    key={appointment.id}
                    appointment={appointment}
                    cancelling={cancelling}
                    onCancel={askToCancel}
                  />
                )
              )}
            </section>
          )}
        </div>
        {cancelTarget && (
          <Dialog title="Cancelar consulta?" onClose={() => { setCancelTarget(null); setActionError(""); }} busy={Boolean(cancelling)}>
            <p className="ui-dialog-text">
              Você está prestes a cancelar a consulta com <strong>{cancelTarget.doctor}</strong>,
              {" "}em {formatDate(cancelTarget.date)}, às {cancelTarget.time}.
            </p>
            {actionError && <p className="ui-dialog-error" role="alert">{actionError}</p>}
            <div className="ui-dialog-actions">
              <button type="button" className="ui-button ui-button-secondary" onClick={() => { setCancelTarget(null); setActionError(""); }} disabled={Boolean(cancelling)} data-autofocus>
                Manter consulta
              </button>
              <button type="button" className="ui-button ui-button-danger" onClick={confirmCancel} disabled={Boolean(cancelling)}>
                {cancelling ? "Cancelando..." : "Sim, cancelar consulta"}
              </button>
            </div>
          </Dialog>
        )}
    </PatientShell>
  );
}

export default function MeusAgendamentos() {
  return (
    <Suspense fallback={<p role="status">Carregando consultas...</p>}>
      <AppointmentsContent />
    </Suspense>
  );
}
