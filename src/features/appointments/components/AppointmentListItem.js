"use client";

import Link from "next/link";
import { formatDate } from "../../../shared/formatting/date.js";

function getStatusClass(status) {
    if (status === "Cancelada") {
      return "status status-cancelled";
    }

    if (status === "Concluída") {
      return "status status-completed";
    }

    return "status status-scheduled";
  }

export default function AppointmentListItem({ appointment, cancelling, onCancel }) {
  return (
                  <article
                    className="appointment-item"
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
                              onCancel(
                                appointment.id
                              )
                            }
                          >
                            {cancelling === appointment.id ? "Cancelando..." : "Cancelar consulta"}
                          </button>
                        </div>
                      )}
                  </article>
  );
}
