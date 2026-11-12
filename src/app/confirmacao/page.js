"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UserMenu, {
  SidebarUser,
} from "../../components/UserMenu";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";
import { appointmentFromRow } from "../../lib/appointments";

export default function Confirmacao() {
  const [appointment, setAppointment] =
    useState(undefined);

  useEffect(() => {
    let active = true;
    const parameters = new URLSearchParams(
      window.location.search
    );

    const appointmentId =
      parameters.get("id");

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.from("appointments")
        .select("id, doctor_id, specialty, doctor_name, scheduled_at, reason, status")
        .eq("id", appointmentId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (active) setAppointment(!error && data ? appointmentFromRow(data) : null);
        });
      return () => { active = false; };
    }

    const savedAppointments = JSON.parse(
      localStorage.getItem("appointments") || "[]"
    );

    const confirmedAppointment =
      savedAppointments.find(
        (savedAppointment) =>
          String(savedAppointment.id) ===
          String(appointmentId)
      );

    setAppointment(
      confirmedAppointment || null
    );
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

          <Link href="/agendamentos">
            📋 Meus agendamentos
          </Link>

          <Link href="/perfil">
            👤 Perfil
          </Link>
        </nav>

        <SidebarUser />
      </aside>

      <main className="dashboard-content">
        <header className="topbar">
          <div className="topbar-title">
            Confirmação
          </div>

          <UserMenu />
        </header>

        <div className="confirmation-content">
          {appointment === undefined ? (
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
      </main>
    </div>
  );
}

