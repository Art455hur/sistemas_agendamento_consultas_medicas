"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAppointment } from "@/features/appointments/services/appointments.js";
import PatientShell from "@/components/layout/PatientShell.js";

export default function Confirmacao() {
  const [appointment, setAppointment] =
    useState(undefined);

  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const id = new URLSearchParams(window.location.search).get("id");
    getAppointment(id).then((item) => { if (active) setAppointment(item); })
      .catch((failure) => { if (active) { setError(failure.message); setAppointment(null); } });
    return () => { active = false; };
  }, []);

  function formatDate(date) {
    if (!date || !date.includes("-")) {
      return date;
    }

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  return (
    <PatientShell title="Confirmação" homeHref="/">

        <div className="confirmation-content">
          {error ? <p role="alert">{error}</p> : appointment === undefined ? (
            <section className="confirmation-card">
              <p>Carregando confirmação...</p>
            </section>
          ) : appointment ? (
            <section className="confirmation-card">
              <div className="confirmation-icon">
                ✓
              </div>

              <h1>
                Consulta agendada com sucesso!
              </h1>

              <p className="confirmation-description">
                Sua consulta foi registrada no sistema.
                Confira os dados abaixo.
              </p>

              <div className="confirmation-details">
                <div>
                  <span>Especialidade</span>
                  <strong>
                    {appointment.specialty}
                  </strong>
                </div>

                <div>
                  <span>Profissional</span>
                  <strong>
                    {appointment.doctor}
                  </strong>
                </div>

                <div>
                  <span>Data</span>
                  <strong>
                    {formatDate(
                      appointment.date
                    )}
                  </strong>
                </div>

                <div>
                  <span>Horário</span>
                  <strong>
                    {appointment.time}
                  </strong>
                </div>

                {appointment.reason && (
                  <div className="confirmation-reason">
                    <span>
                      Motivo da consulta
                    </span>

                    <strong>
                      {appointment.reason}
                    </strong>
                  </div>
                )}
              </div>

              <div className="confirmation-actions">
                <Link
                  href="/agendamentos"
                  className="confirmation-primary"
                >
                  Ver meus agendamentos
                </Link>

                <Link
                  href="/"
                  className="confirmation-secondary"
                >
                  Voltar ao início
                </Link>
              </div>
            </section>
          ) : (
            <section className="confirmation-card">
              <div className="confirmation-icon confirmation-icon-error">
                !
              </div>

              <h1>Consulta não encontrada</h1>

              <p className="confirmation-description">
                Não foi possível encontrar os dados
                dessa consulta.
              </p>

              <div className="confirmation-actions">
                <Link
                  href="/agendar"
                  className="confirmation-primary"
                >
                  Agendar consulta
                </Link>

                <Link
                  href="/"
                  className="confirmation-secondary"
                >
                  Voltar ao início
                </Link>
              </div>
            </section>
          )}
        </div>
    </PatientShell>
  );
}