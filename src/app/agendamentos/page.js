"use client";

import AppointmentListItem from "@/features/appointments/components/AppointmentListItem.js";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppointments } from "@/features/appointments/hooks/useAppointments.js";
import { cancelAppointment as cancelSavedAppointment } from "@/features/appointments/services/appointments.js";
import PatientShell from "@/components/layout/PatientShell.js";

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("aba");
  const { appointments, loading, error } = useAppointments();
  const [activeTab, setActiveTab] = useState("scheduled");
  const [cancelling, setCancelling] = useState(null);
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    if (["scheduled", "completed", "cancelled"].includes(requestedTab)) setActiveTab(requestedTab);
  }, [requestedTab]);

  useEffect(() => {
    if (loading || error || !window.location.hash.startsWith("#consulta-")) return;
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch { return; }
    document.getElementById(id)?.scrollIntoView({ block: "center" });
  }, [activeTab, appointments, loading, error, searchParams]);

  const scheduledAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "Agendada" ||
      !appointment.status
  );

  const completedAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "Concluída"
  );

  const cancelledAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "Cancelada"
  );

  const appointmentsByTab = {
    scheduled: scheduledAppointments,
    completed: completedAppointments,
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
      title: "Nenhuma consulta concluída",
      description:
        "Seu histórico de consultas concluídas aparecerá aqui.",
    },
    cancelled: {
      title: "Nenhuma consulta cancelada",
      description:
        "Você não possui consultas canceladas.",
    },
  };

  const currentEmptyMessage =
    emptyMessages[activeTab];

  async function cancelAppointment(appointmentId) {
    if (cancelling || !window.confirm("Deseja realmente cancelar esta consulta?")) return;
    setCancelling(appointmentId);
    setActionError("");
    try { await cancelSavedAppointment(appointmentId); }
    catch (failure) { setActionError(failure.message); }
    finally { setCancelling(null); }
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
              Concluídas
              <span>
                {completedAppointments.length}
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

          {actionError && <p role="alert">{actionError}</p>}
          {loading ? <p role="status">Carregando consultas...</p> : error ? <p role="alert">{error}</p> : filteredAppointments.length === 0 ? (
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
                    onCancel={cancelAppointment}
                  />
                )
              )}
            </section>
          )}
        </div>
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
