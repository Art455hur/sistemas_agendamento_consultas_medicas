"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/ui/Icon.js";
import { appointmentStatusLabels } from "@/features/appointments/appointment-format.js";
import AppointmentControls from "./AppointmentControls";
import desk from "./secretaria.module.css";

const normalize = (text) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const statuses = ["scheduled", "pending", "completed", "no_show", "cancelled"];

function Empty({ icon = "calendar", title, text, children }) {
  return (
    <div className={desk.empty}>
      <span className={desk.emptyIcon}><Icon name={icon} /></span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}

// Lista do dia: filtros na tela (situação e busca) e as ações de cada consulta futura.
export default function AgendaResults({ entries, dateForm, bookingHref, today, maxDay, isToday }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const terms = normalize(search).trim().split(/\s+/).filter(Boolean);
  const visible = entries.filter((entry) => {
    if (status && entry.status !== status) return false;
    const text = normalize([entry.patient, entry.doctor, entry.specialty].join(" "));
    return terms.every((term) => text.includes(term));
  });
  const filtered = Boolean(status || terms.length);

  return <>
    <div className={desk.filtersCard}>
      {dateForm}
      <label className={desk.field}>
        <span>Situação</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todas</option>
          {statuses.map((value) => <option key={value} value={value}>{appointmentStatusLabels[value]}</option>)}
        </select>
      </label>
      <label className={`${desk.field} ${desk.searchField}`}>
        <span>Buscar na agenda</span>
        <span className={desk.searchInput}>
          <Icon name="search" size={18} />
          <input type="search" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Paciente, profissional ou especialidade" autoComplete="off" />
        </span>
      </label>
    </div>

    <div className={desk.listHeading}>
      <div>
        <h2 id="agenda-heading">Consultas do dia</h2>
        <span role={filtered ? "status" : undefined}>
          {visible.length} {visible.length === 1 ? "consulta" : "consultas"}{filtered ? ` de ${entries.length}` : ""}
        </span>
      </div>
      <Link className={`ui-button ui-button-primary ${desk.mobileNew}`} href={bookingHref}>
        <Icon name="plus" size={18} /> Novo agendamento
      </Link>
    </div>

    {entries.length === 0 ? (
      <Empty title="Nenhuma consulta nesta data" text="A clínica ainda não tem consultas agendadas para o dia selecionado.">
        {!isToday && <Link className="ui-button ui-button-secondary" href="/secretaria">Voltar para hoje</Link>}
      </Empty>
    ) : visible.length === 0 ? (
      <Empty icon="search" title="Nenhum resultado para os filtros" text="Tente ajustar a situação ou os termos da busca.">
        <button type="button" className="ui-button ui-button-secondary" onClick={() => { setStatus(""); setSearch(""); }}>
          Limpar filtros
        </button>
      </Empty>
    ) : (
      <ul className={desk.list}>
        {visible.map((entry) => (
          <li key={entry.id} className={desk.card}>
            <div className={desk.timeBox}>
              <Icon name="clock" size={18} />
              <strong><time dateTime={entry.scheduledAt}>{entry.time}</time></strong>
            </div>
            <div className={desk.cardMain}>
              <div className={desk.patientLine}>
                <h3>{entry.patient}</h3>
                <span className={desk.pill} data-status={entry.status}>{appointmentStatusLabels[entry.status]}</span>
              </div>
              <p>{entry.doctor}{entry.specialty && <><span aria-hidden="true">•</span>{entry.specialty}</>}</p>
            </div>
            {entry.status === "scheduled" && (
              <AppointmentControls appointment={entry} today={today} maxDay={maxDay} />
            )}
          </li>
        ))}
      </ul>
    )}
  </>;
}
