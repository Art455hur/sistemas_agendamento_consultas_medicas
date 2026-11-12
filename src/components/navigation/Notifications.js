"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppointments } from "../../features/appointments/hooks/useAppointments.js";
import { formatDate } from "../../shared/formatting/date.js";

export default function Notifications() {
  const { appointments, loading, error } = useAppointments();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const now = new Date();

  const scheduledAppointments =
    appointments
      .filter((appointment) => {
        const appointmentDate =
          new Date(
            appointment.scheduledAt || `${appointment.date}T${appointment.time}`
          );

        return (
          (appointment.status ===
            "Agendada" ||
            !appointment.status) &&
          appointmentDate >= now
        );
      })
      .sort((first, second) => {
        const firstDate =
          `${first.date}T${first.time}`;

        const secondDate =
          `${second.date}T${second.time}`;

        return firstDate.localeCompare(
          secondDate
        );
      });

  const cancelledAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        "Cancelada"
    );

  const nextAppointment =
    scheduledAppointments[0];

  const hasNotifications =
    scheduledAppointments.length > 0 ||
    cancelledAppointments.length > 0;

  return (
      <div className="notification-wrapper">
        <button
          type="button"
          className="notification-button"
          aria-label="Abrir notificações"
          aria-expanded={
            notificationsOpen
          }
          onClick={() =>
            setNotificationsOpen(
              (currentValue) =>
                !currentValue
            )
          }
        >
          🔔

          {scheduledAppointments.length >
            0 && (
            <span className="notification-badge">
              {
                scheduledAppointments.length
              }
            </span>
          )}
        </button>

        {notificationsOpen && (
          <div className="notification-panel">
            <div className="notification-panel-header">
              <strong>
                Notificações
              </strong>

              <button
                type="button"
                aria-label="Fechar notificações"
                onClick={() =>
                  setNotificationsOpen(
                    false
                  )
                }
              >
                ✕
              </button>
            </div>

            {loading ? <p role="status">Carregando notificações...</p> : error ? <p role="alert">{error}</p> : hasNotifications ? (
              <div className="notification-list">
                {nextAppointment && (
                  <div className="notification-item">
                    <span className="notification-item-icon">
                      🗓️
                    </span>

                    <div>
                      <strong>
                        Próxima consulta
                      </strong>

                      <p>
                        {
                          nextAppointment.specialty
                        }{" "}
                        com{" "}
                        {
                          nextAppointment.doctor
                        }
                      </p>

                      <small>
                        {formatDate(
                          nextAppointment.date
                        )}{" "}
                        às{" "}
                        {
                          nextAppointment.time
                        }
                      </small>
                    </div>
                  </div>
                )}

                {scheduledAppointments.length >
                  1 && (
                  <div className="notification-item">
                    <span className="notification-item-icon">
                      📋
                    </span>

                    <div>
                      <strong>
                        Consultas agendadas
                      </strong>

                      <p>
                        Você possui{" "}
                        {
                          scheduledAppointments.length
                        }{" "}
                        consultas futuras.
                      </p>
                    </div>
                  </div>
                )}

                {cancelledAppointments.length >
                  0 && (
                  <div className="notification-item">
                    <span className="notification-item-icon">
                      ✕
                    </span>

                    <div>
                      <strong>
                        Consultas canceladas
                      </strong>

                      <p>
                        Você possui{" "}
                        {
                          cancelledAppointments.length
                        }{" "}
                        {cancelledAppointments.length ===
                        1
                          ? " consulta cancelada."
                          : " consultas canceladas."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="notification-empty">
                <span>🔔</span>

                <p>
                  Nenhuma notificação no
                  momento.
                </p>
              </div>
            )}

            <Link
              href="/agendamentos"
              className="notification-link"
              onClick={() =>
                setNotificationsOpen(
                  false
                )
              }
            >
              Ver meus agendamentos
            </Link>
          </div>
        )}
      </div>
  );
}
