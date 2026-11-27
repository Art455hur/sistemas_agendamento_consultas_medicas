"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import Dialog from "@/components/ui/Dialog.js";
import Icon from "@/components/ui/Icon.js";
import { appointmentStatusLabels } from "@/features/appointments/appointment-format.js";
import { recordAppointmentOutcome } from "./actions";
import { filterAgenda, filters } from "./agenda-view";
import agenda from "./agenda.module.css";

const symbols = { completed: "✓", no_show: "!", cancelled: "×" };

function StatusPill({ status }) {
  return (
    <span className={agenda.status} data-status={status}>
      <span aria-hidden="true">{symbols[status] ?? "•"}</span>
      {appointmentStatusLabels[status]}
    </span>
  );
}

function ConfirmButton({ children, pendingText, className }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending}>{pending ? pendingText : children}</button>;
}

const outcomes = {
  completed: {
    title: "Marcar como atendida?",
    confirm: "Sim, marcar como atendida",
    pending: "Registrando...",
    className: "ui-button ui-button-primary",
    text: "Depois disso, o registro do atendimento fica disponível para anotações e exames.",
  },
  no_show: {
    title: "Registrar falta do paciente?",
    confirm: "Sim, registrar falta",
    pending: "Registrando...",
    className: "ui-button ui-button-danger",
    text: "A consulta passa a constar como \"Paciente faltou\".",
  },
};

// Resultado de uma consulta que já passou do horário, com confirmação antes de gravar.
function OutcomeActions({ entry, day }) {
  const [choice, setChoice] = useState(null);
  const outcome = choice && outcomes[choice];
  return (
    <>
      <button type="button" className="ui-button ui-button-primary" onClick={() => setChoice("completed")}
        aria-label={`Marcar como atendida: ${entry.patient}, ${entry.time}`}>
        <Icon name="check" size={16} /> Marcar como atendida
      </button>
      <button type="button" className={agenda.ghostButton} onClick={() => setChoice("no_show")}
        aria-label={`Paciente faltou: ${entry.patient}, ${entry.time}`}>
        Paciente faltou
      </button>
      {outcome && (
        <Dialog title={outcome.title} onClose={() => setChoice(null)}>
          <p className="ui-dialog-text">
            Consulta de <strong>{entry.patient}</strong> às {entry.time}{entry.specialty ? ` · ${entry.specialty}` : ""}.
            {" "}{outcome.text}
          </p>
          <form action={recordAppointmentOutcome}>
            <input type="hidden" name="appointmentId" value={entry.id} />
            <input type="hidden" name="day" value={day} />
            <input type="hidden" name="outcome" value={choice} />
            <div className="ui-dialog-actions">
              <button type="button" className="ui-button ui-button-secondary" onClick={() => setChoice(null)} data-autofocus>
                Voltar
              </button>
              <ConfirmButton className={outcome.className} pendingText={outcome.pending}>{outcome.confirm}</ConfirmButton>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}

function Actions({ entry, day }) {
  if (entry.status === "pending") return <OutcomeActions entry={entry} day={day} />;
  if (entry.status === "completed") {
    return (
      <Link className="ui-button ui-button-secondary" href={`/medico/atendimento/${entry.id}`} prefetch={false}
        aria-label={`Abrir atendimento: ${entry.patient}, ${entry.time}`}>
        Abrir atendimento <Icon name="arrow" size={16} />
      </Link>
    );
  }
  if (entry.status === "scheduled") return <span className={agenda.actionNote}>Disponível a partir do horário</span>;
  return <span className={agenda.actionNote}>Sem ações disponíveis</span>;
}

export default function AgendaList({ entries, day }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const matches = filterAgenda(entries, query, status);
  const filtered = Boolean(status || query.trim());
  const total = entries.length === 1 ? "1 consulta organizada por horário" : `${entries.length} consultas organizadas por horário`;

  return (
    <>
      <div className={agenda.sectionTitle}>
        <div>
          <h2 id="doctor-agenda-heading">Consultas do dia</h2>
          <p>{total}</p>
        </div>
        <button type="button" className={agenda.mobileFilterButton} onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen} aria-controls="doctor-agenda-filters">
          <Icon name="filter" size={18} /> Filtros <span aria-hidden="true">{filtersOpen ? "−" : "+"}</span>
        </button>
      </div>

      <div id="doctor-agenda-filters" className={filtersOpen ? `${agenda.filters} ${agenda.filtersOpen}` : agenda.filters}>
        <label className={agenda.searchField}>
          <Icon name="search" size={19} />
          <span className={agenda.srOnly}>Buscar na agenda</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar paciente, especialidade ou horário" maxLength={120} autoComplete="off" />
        </label>
        <label className={agenda.selectField}>
          <span>Situação</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todas as situações</option>
            {filters.map(([value]) => <option key={value} value={value}>{appointmentStatusLabels[value]}</option>)}
          </select>
        </label>
      </div>

      {filtered && <p className={agenda.matchCount} role="status">
        {matches.length === 1 ? "1 consulta exibida" : `${matches.length} consultas exibidas`}
      </p>}

      {matches.length > 0 ? (
        <ul className={agenda.appointments}>
          {matches.map((entry) => (
            <li key={entry.id} className={entry.isNext ? `${agenda.appointment} ${agenda.appointmentNext}` : agenda.appointment}>
              <div className={agenda.time}>
                <strong><time dateTime={entry.scheduledAt}>{entry.time}</time></strong>
                <span>30 min</span>
              </div>
              <div className={agenda.patient}>
                <div className={agenda.patientLine}>
                  <h3>{entry.patient}</h3>
                  {entry.isNext && <span className={agenda.nextLabel}>PRÓXIMO ATENDIMENTO</span>}
                </div>
                <p>{entry.specialty ? <>{entry.specialty} <span aria-hidden="true">•</span> </> : null}Hospital Sapiens</p>
              </div>
              <div className={agenda.appointmentStatus}><StatusPill status={entry.status} /></div>
              <div className={agenda.appointmentActions}><Actions entry={entry} day={day} /></div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={agenda.emptyState}>
          <span className={agenda.iconBox}><Icon name="search" /></span>
          <h3>Nenhum resultado para estes filtros</h3>
          <p>Tente ajustar a busca ou a situação selecionada.</p>
          <button type="button" className="ui-button ui-button-secondary" onClick={() => { setQuery(""); setStatus(""); }}>
            Limpar filtros
          </button>
        </div>
      )}
    </>
  );
}
