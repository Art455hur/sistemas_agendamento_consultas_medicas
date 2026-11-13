"use client";

import ErrorNotice from "@/components/feedback/ErrorNotice.js";

import { formatDate } from "../../../shared/formatting/date.js";

import Link from "next/link";
import { useAppointments } from "../hooks/useAppointments.js";

export default function DashboardData() {
  const { appointments, loading, error, retry } = useAppointments();

  const now = new Date();

  const scheduledAppointments = appointments.filter(
    (appointment) => {
      const appointmentDate = new Date(
        appointment.scheduledAt || `${appointment.date}T${appointment.time}`
      );

      return (
        appointment.status === "Agendada" &&
        appointmentDate >= now
      );
    }
  );

  const completedAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "Concluída"
  );

  const cancelledAppointments = appointments.filter(
    (appointment) =>
      appointment.status === "Cancelada"
  );

  const nextAppointment = [...scheduledAppointments].sort(
    (first, second) => {
      const firstDate = `${first.date}T${first.time}`;
      const secondDate = `${second.date}T${second.time}`;

      return firstDate.localeCompare(secondDate);
    }
  )[0];

  if (loading) return <p role="status">Carregando consultas...</p>;
  if (error) return <ErrorNotice message={error} onRetry={retry} />;
  return (
    <>
      <section className="summary-cards">
  <Link
    href="/agendamentos?aba=scheduled"
    className="summary-card"
  >
    <div className="summary-icon">🗓️</div>

    <div>
      <strong>{scheduledAppointments.length}</strong>
      <span>Próximas consultas</span>
    </div>
  </Link>

  <Link
    href="/agendamentos?aba=completed"
    className="summary-card"
  >
    <div className="summary-icon">✓</div>

    <div>
      <strong>{completedAppointments.length}</strong>
      <span>Consultas concluídas</span>
    </div>
  </Link>

  <Link
    href="/agendamentos?aba=cancelled"
    className="summary-card"
  >
    <div className="summary-icon">✕</div>

    <div>
      <strong>{cancelledAppointments.length}</strong>
      <span>Consultas canceladas</span>
    </div>
  </Link>
</section>

      <section className="dashboard-section">
        <h2>Próxima consulta</h2>

        {nextAppointment ? (
          <div className="appointment-card">
            <div>
              <span className="card-label">
                CONSULTA AGENDADA
              </span>

              <h3>{nextAppointment.specialty}</h3>

              <p>
                <strong>{nextAppointment.doctor}</strong>
              </p>

              <p>
                🗓️ {formatDate(nextAppointment.date)}
              </p>

              <p>🕐 {nextAppointment.time}</p>
            </div>

            <Link href="/agendamentos">
              Ver detalhes
            </Link>
          </div>
        ) : (
          <div className="appointment-card">
            <div>
              <span className="card-label">
                NENHUMA CONSULTA
              </span>

              <h3>
                Você não possui consultas agendadas
              </h3>

              <p>
                Marque uma nova consulta com um especialista.
              </p>
            </div>

            <Link href="/agendar">
              Agendar agora
            </Link>
          </div>
        )}
      </section>
    </>
  );
}