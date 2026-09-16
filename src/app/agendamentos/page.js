"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserMenu, {
  SidebarUser,
} from "../../components/UserMenu";

export default function MeusAgendamentos() {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("scheduled");

  useEffect(() => {
    const savedAppointments = JSON.parse(
      localStorage.getItem("appointments") || "[]"
    );

    const now = new Date();
    let appointmentsWereUpdated = false;

    const updatedAppointments = savedAppointments.map(
      (appointment) => {
        const isScheduled =
          appointment.status === "Agendada" ||
          !appointment.status;

        if (
          !isScheduled ||
          !appointment.date ||
          !appointment.time
        ) {
          return appointment;
        }

        const appointmentDate = new Date(
          `${appointment.date}T${appointment.time}`
        );

        const isValidDate = !Number.isNaN(
          appointmentDate.getTime()
        );

        if (isValidDate && appointmentDate < now) {
          appointmentsWereUpdated = true;

          return {
            ...appointment,
            status: "Concluída",
          };
        }

        return appointment;
      }
    );

    if (appointmentsWereUpdated) {
      localStorage.setItem(
        "appointments",
        JSON.stringify(updatedAppointments)
      );
    }

    setAppointments(updatedAppointments);
    const parameters = new URLSearchParams(
  window.location.search
);

const requestedTab = parameters.get("aba");

const validTabs = [
  "scheduled",
  "completed",
  "cancelled",
];

if (validTabs.includes(requestedTab)) {
  setActiveTab(requestedTab);
}
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

  function cancelAppointment(appointmentId) {
    const confirmed = window.confirm(
      "Deseja realmente cancelar esta consulta?"
    );

    if (!confirmed) {
      return;
    }

    const updatedAppointments = appointments.map(
      (appointment) => {
        if (appointment.id === appointmentId) {
          return {
            ...appointment,
            status: "Cancelada",
          };
        }

        return appointment;
      }
    );

    setAppointments(updatedAppointments);

    localStorage.setItem(
      "appointments",
      JSON.stringify(updatedAppointments)
    );
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>+</span>
          <strong>AgendaSaúde</strong>
        </div>

        <nav className="sidebar-menu">
          <Link href="/">🏠 Início</Link>

          <Link href="/agendar">
            🗓️ Agendar consulta
          </Link>

          <Link
            href="/agendamentos"
            className="active"
          >
            📋 Meus agendamentos
          </Link>

          <Link href="/perfil">👤 Perfil</Link>
        </nav>

        <SidebarUser />
      </aside>

      <main className="dashboard-content">
        <header className="topbar">
          <div className="topbar-title">
            Meus agendamentos
          </div>

          <UserMenu />
        </header>

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

          {filteredAppointments.length === 0 ? (
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
                            onClick={() =>
                              cancelAppointment(
                                appointment.id
                              )
                            }
                          >
                            Cancelar consulta
                          </button>
                        </div>
                      )}
                  </article>
                )
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}