"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardData() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const savedAppointments = JSON.parse(
      localStorage.getItem("appointments") || "[]"
    );

    setAppointments(savedAppointments);
  }, []);

  const scheduledAppointments = appointments.filter(
    (appointment) => appointment.status !== "Cancelada"
  );

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "Concluída"
  );

  const cancelledAppointments = appointments.filter(
    (appointment) => appointment.status === "Cancelada"
  );

  const nextAppointment = [...scheduledAppointments].sort((first, second) => {
    const firstDate = `${first.date}T${first.time}`;
    const secondDate = `${second.date}T${second.time}`;

    return firstDate.localeCompare(secondDate);
  })[0];

  function formatDate(date) {
    if (!date || !date.includes("-")) {
      return date;
    }

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  return (
    <>
      <section className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">🗓️</div>

          <div>
            <strong>{scheduledAppointments.length}</strong>
            <span>Próximas consultas</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">✓</div>

          <div>
            <strong>{completedAppointments.length}</strong>
            <span>Consultas concluídas</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">✕</div>

          <div>
            <strong>{cancelledAppointments.length}</strong>
            <span>Consultas canceladas</span>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Próxima consulta</h2>

        {nextAppointment ? (
          <div className="appointment-card">
            <div>
              <span className="card-label">CONSULTA AGENDADA</span>
              <h3>{nextAppointment.specialty}</h3>

              <p>
                <strong>{nextAppointment.doctor}</strong>
              </p>

              <p>🗓️ {formatDate(nextAppointment.date)}</p>
              <p>🕐 {nextAppointment.time}</p>
            </div>

            <Link href="/agendamentos">Ver detalhes</Link>
          </div>
        ) : (
          <div className="appointment-card">
            <div>
              <span className="card-label">NENHUMA CONSULTA</span>
              <h3>Você não possui consultas agendadas</h3>
              <p>Marque uma nova consulta com um especialista.</p>
            </div>

            <Link href="/agendar">Agendar agora</Link>
          </div>
        )}
      </section>
    </>
  );
}