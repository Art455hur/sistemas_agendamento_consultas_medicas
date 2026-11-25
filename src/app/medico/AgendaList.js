"use client";

import { useState } from "react";
import { filterAgenda, filters } from "./agenda-view";
import agenda from "./agenda.module.css";

export default function AgendaList({ entries }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const matches = filterAgenda(entries, query, status);
  const filtered = Boolean(status || query.trim());

  return (
    <>
      <div className={agenda.filterBar}>
        <label>Buscar na agenda
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Paciente, especialidade ou horário" maxLength={120} autoComplete="off" />
        </label>
        <label>Situação
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todas</option>
            {filters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {filtered && <button className={agenda.secondary} type="button" onClick={() => { setQuery(""); setStatus(""); }}>
          Limpar filtros
        </button>}
      </div>
      <p className={agenda.matchCount} role="status">
        {matches.length === 1 ? "1 consulta exibida" : `${matches.length} consultas exibidas`}
      </p>
      {matches.length > 0
        ? <ul className={agenda.list}>{matches.map(({ id, item }) => <li className={agenda.row} key={id}>{item}</li>)}</ul>
        : <div className={agenda.empty}>
          <strong>Nenhuma consulta corresponde aos filtros</strong>
          <p>Experimente outro termo ou limpe os filtros para ver a agenda completa.</p>
        </div>}
    </>
  );
}
