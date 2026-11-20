"use client";

import { useState } from "react";
import styles from "@/app/administracao/page.module.css";
import desk from "./secretaria.module.css";

const normalize = (text) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function AgendaResults({ entries }) {
  const [search, setSearch] = useState("");
  const query = normalize(search.trim());
  const visible = entries.filter(({ keywords }) => normalize(keywords).includes(query));

  return <>
    <label className={desk.search}>
      Buscar nas consultas
      <input type="search" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Paciente, profissional ou especialidade" />
    </label>
    {visible.length > 0
      ? <div className={styles.agendaList}>{visible.map(({ item }) => item)}</div>
      : <p role="status" className={styles.agendaEmpty}>Nenhuma consulta corresponde aos filtros.</p>}
  </>;
}
