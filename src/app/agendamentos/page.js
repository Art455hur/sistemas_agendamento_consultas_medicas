"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppointments } from "@/features/appointments/hooks/useAppointments.js";
import { cancelAppointment as cancelSavedAppointment } from "@/features/appointments/services/appointments.js";
import PatientShell from "@/components/layout/PatientShell.js";

export default function MeusAgendamentos() {
  const { appointments, loading, error } = useAppointments();
  const [activeTab, setActiveTab] = useState("scheduled");
  const [cancelling, setCancelling] = useState(null);
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("aba");
    if (["scheduled", "completed", "cancelled"].includes(requestedTab)) setActiveTab(requestedTab);
  }, []);

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

  function formatDate(date) {
    if (!date || !date.includes("-")) {
      return date;
    }

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  function getStatusClass(status) {
    if (status === "Cancelada") {
      return "status status-cancelled";
    }

    if (status === "Concluída") {
      return "status status-completed";
    }

    return "status status-scheduled";
  }

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
                  <article
                    className="appointment-item"
                    key={appointment.id}
                  >
                    <div className="appointment-item-icon">
                      🩺
                    </div>

                    <div className="appointment-item-info">
                      <span
                        className={getStatusClass(
                          appointment.status
                        )}
                      >
                        {appointment.status ||
                          "Agendada"}
                      </span>

                      <h2>
                        {appointment.specialty}
                      </h2>

                      <p className="appointment-doctor">
                        {appointment.doctor}
                      </p>

                      <div className="appointment-details">
                        <span>
                          🗓️{" "}
                          {formatDate(
                            appointment.date
                          )}
                        </span>

                        <span>
                          🕐 {appointment.time}
                        </span>
                      </div>

                      {appointment.reason && (
                        <p className="appointment-reason">
                          <strong>Motivo:</strong>{" "}
                          {appointment.reason}
                        </p>
                      )}
                    </div>

                    {appointment.status !==
                      "Cancelada" &&
                      appointment.status !==
                        "Concluída" && (
                        <div className="appointment-actions">
                          <Link
                            href={`/agendar?remarcar=${appointment.id}`}
                            className="reschedule-appointment"
                          >
                            Remarcar
                          </Link>

                          <button
                            type="button"
                            className="cancel-appointment"
                            disabled={Boolean(cancelling)}
                            onClick={() =>
                              cancelAppointment(
                                appointment.id
                              )
                            }
                          >
                            {cancelling === appointment.id ? "Cancelando..." : "Cancelar consulta"}
                          </button>
                        </div>
                      )}
                  </article>
                )
              )}
            </section>
          )}
        </div>
    </PatientShell>
  );
}