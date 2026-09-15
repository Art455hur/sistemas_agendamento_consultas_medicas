"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserMenu, {
  SidebarUser,
} from "../../components/UserMenu";
export default function MeusAgendamentos() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const savedAppointments = JSON.parse(
      localStorage.getItem("appointments") || "[]"
    );

    setAppointments(savedAppointments);
  }, []);

  function formatDate(date) {
    if (!date || !date.includes("-")) {
      return date;
    }

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  function cancelAppointment(indexToCancel) {
    const confirmed = window.confirm(
      "Deseja realmente cancelar esta consulta?"
    );

    if (!confirmed) {
      return;
    }

    const updatedAppointments = appointments.map(
      (appointment, index) => {
        if (index === indexToCancel) {
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

          <Link href="/agendamentos" className="active">
            📋 Meus agendamentos
          </Link>

          <Link href="/perfil">👤 Perfil</Link>
        </nav>

        <SidebarUser />
      </aside>

      <main className="dashboard-content">
        <header className="topbar">
          <div className="topbar-title">Meus agendamentos</div>

          <UserMenu />
        </header>

        <div className="appointments-content">
          <header className="appointments-heading">
            <div>
              <h1>Meus agendamentos</h1>
              <p>Acompanhe e gerencie suas consultas.</p>
            </div>

            <Link href="/agendar" className="new-appointment-button">
              + Nova consulta
            </Link>
          </header>

          {appointments.length === 0 ? (
            <section className="empty-appointments">
              <div>🗓️</div>
              <h2>Nenhuma consulta agendada</h2>
              <p>Você ainda não possui consultas cadastradas.</p>

              <Link href="/agendar">Agendar consulta</Link>
            </section>
          ) : (
            <section className="appointments-list">
              {appointments.map((appointment, index) => (
                <article className="appointment-item" key={index}>
                  <div className="appointment-item-icon">🩺</div>

                  <div className="appointment-item-info">
                    <span
                      className={
                        appointment.status === "Cancelada"
                          ? "status status-cancelled"
                          : "status status-scheduled"
                      }
                    >
                      {appointment.status || "Agendada"}
                    </span>

                    <h2>{appointment.specialty}</h2>
                    <p className="appointment-doctor">
                      {appointment.doctor}
                    </p>

                    <div className="appointment-details">
                      <span>🗓️ {formatDate(appointment.date)}</span>
                      <span>🕐 {appointment.time}</span>
                    </div>

                    {appointment.reason && (
                      <p className="appointment-reason">
                        <strong>Motivo:</strong> {appointment.reason}
                      </p>
                    )}
                  </div>

                  {appointment.status !== "Cancelada" && (
                    <button
                      type="button"
                      className="cancel-appointment"
                      onClick={() => cancelAppointment(index)}
                    >
                      Cancelar consulta
                    </button>
                  )}
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}