"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAppointment } from "@/features/appointments/services/appointments.js";
import PatientShell from "@/components/layout/PatientShell.js";
import Icon from "@/components/ui/Icon.js";
import { formatDate, formatLongDate } from "@/shared/formatting/date.js";

function Detail({ icon, title, text }) {
  return (
    <div className="ph-detail">
      <span aria-hidden="true"><Icon name={icon} size={19} /></span>
      <p><strong>{title}</strong><small>{text}</small></p>
    </div>
  );
}

export default function Confirmacao() {
  const [appointment, setAppointment] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const id = new URLSearchParams(window.location.search).get("id");
    getAppointment(id).then((item) => { if (active) setAppointment(item); })
      .catch((failure) => { if (active) { setError(failure.message); setAppointment(null); } });
    return () => { active = false; };
  }, []);

  const longDate = appointment ? formatLongDate(appointment.date) : null;

  return (
    <PatientShell title="Confirmação" homeHref="/dashboard">
      <div className="ph-page ph-result-page">
        {error ? (
          <p className="ph-alert ph-alert-error" role="alert"><Icon name="warning" size={18} />{error}</p>
        ) : appointment === undefined ? (
          <p className="ph-status" role="status">Carregando confirmação...</p>
        ) : appointment ? (
          <section className="ph-card ph-result">
            <span className="ph-result-icon" aria-hidden="true"><Icon name="check" size={30} /></span>
            <p className="ph-eyebrow">Agendamento concluído</p>
            <h1>Consulta agendada com sucesso</h1>
            <p>Seu horário com {appointment.doctor} foi reservado.</p>
            <div className="ph-result-summary">
              <Detail
                icon="calendar"
                title={longDate ? `${longDate.dayMonth} de ${longDate.year}` : formatDate(appointment.date)}
                text={longDate ? longDate.weekday : "Data da consulta"}
              />
              <Detail icon="clock" title={appointment.time} text="Horário de Brasília" />
              <Detail icon="pin" title="Hospital Sapiens" text={appointment.specialty} />
            </div>
            {appointment.reason && (
              <p className="ph-result-reason"><strong>Motivo:</strong> {appointment.reason}</p>
            )}
            <div className="ph-result-actions">
              <Link href="/agendamentos" className="ui-button ui-button-primary">
                Ver meus agendamentos <Icon name="arrow" size={18} />
              </Link>
              <Link href="/dashboard" className="ui-button ui-button-secondary">
                Voltar ao início
              </Link>
            </div>
          </section>
        ) : (
          <section className="ph-card ph-result">
            <span className="ph-result-icon ph-result-icon-error" aria-hidden="true"><Icon name="warning" size={30} /></span>
            <h1>Consulta não encontrada</h1>
            <p>Não foi possível encontrar os dados dessa consulta.</p>
            <div className="ph-result-actions">
              <Link href="/agendar" className="ui-button ui-button-primary">Agendar consulta</Link>
              <Link href="/dashboard" className="ui-button ui-button-secondary">Voltar ao início</Link>
            </div>
          </section>
        )}
      </div>
    </PatientShell>
  );
}
