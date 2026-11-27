"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deactivatePatient, reactivatePatient } from "@/app/administracao/actions";
import Icon from "@/components/ui/Icon.js";
import { formatPhone } from "@/shared/formatting/patient-fields.js";
import PatientEditForm from "./PatientEditForm";
import styles from "@/app/administracao/page.module.css";

function initials(patient) {
  const text = patient.full_name?.trim() || patient.email || "";
  return text.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "PA";
}

function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function StatusButton({ active }) {
  const { pending } = useFormStatus();
  return (
    <button className={active ? styles.dangerLink : styles.linkButton} type="submit" disabled={pending}>
      {pending ? "Salvando..." : active ? "Desativar paciente" : "Reativar paciente"}
    </button>
  );
}

// Lista de pacientes com edição num painel ao lado (no celular, o painel substitui a lista).
export default function PatientManager({ patients, today }) {
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const filtered = patients.filter((patient) => {
    const searchable = normalize(`${patient.full_name ?? ""} ${patient.email ?? ""} ${patient.phone ?? ""}`);
    return terms.every((term) => searchable.includes(term));
  });
  const selected = patients.find((patient) => patient.id === selectedId);

  return (
    <div className={selected ? `${styles.splitLayout} ${styles.hasDetail}` : styles.splitLayout}>
      <div className={`${styles.panel} ${styles.listPanel}`}>
        <div className={styles.panelHead}>
          <div>
            <h3>Pacientes cadastrados</h3>
            <p role="status" aria-live="polite">
              {terms.length ? `${filtered.length} de ${patients.length} pacientes` : `${patients.length} ${patients.length === 1 ? "paciente encontrado" : "pacientes encontrados"}`}
            </p>
          </div>
        </div>
        <div className={styles.listSearch}>
          <label className={styles.searchField}>
            <Icon name="search" size={18} />
            <span className={styles.srOnly}>Buscar paciente</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, e-mail ou telefone" />
          </label>
        </div>
        {filtered.map((patient) => (
          <div className={patient.id === selectedId ? `${styles.recordRow} ${styles.recordRowSelected}` : styles.recordRow} key={patient.id}>
            <div className={styles.personCell}>
              <span className={styles.initials} aria-hidden="true">{initials(patient)}</span>
              <div>
                <strong>{patient.full_name?.trim() || "Paciente sem nome"}</strong>
                <small>{patient.phone ? formatPhone(patient.phone) : patient.email}</small>
              </div>
            </div>
            <span className={patient.active ? styles.statusActive : styles.statusInactive}>{patient.active ? "Ativo" : "Inativo"}</span>
            <button type="button" className={styles.linkButton} onClick={() => setSelectedId(patient.id)} aria-label={`Editar ${patient.full_name || patient.email}`}>
              <Icon name="edit" size={15} /> Editar
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className={styles.emptyRow}>{patients.length === 0 ? "Nenhum paciente cadastrado." : "Nenhum paciente encontrado com essa busca."}</p>
        )}
      </div>

      {selected && (
        <aside className={`${styles.panel} ${styles.detailPanel}`} aria-labelledby="editar-paciente">
          <div className={styles.panelHead}>
            <div>
              <button type="button" className={styles.mobileBack} onClick={() => setSelectedId(null)}>← Voltar para a lista</button>
              <p className={styles.cardKicker}>Editar paciente</p>
              <h3 id="editar-paciente">{selected.full_name?.trim() || "Paciente sem nome"}</h3>
              <p>{selected.email}</p>
            </div>
            <button type="button" className={styles.desktopClose} aria-label="Fechar edição" onClick={() => setSelectedId(null)}>
              <Icon name="close" />
            </button>
          </div>
          <PatientEditForm key={selected.id} patient={selected} today={today} />
          <div className={styles.dangerZone}>
            <h4>{selected.active ? "Desativar paciente" : "Reativar paciente"}</h4>
            <p>
              {selected.active
                ? "A conta e as consultas antigas são preservadas. Consultas futuras são canceladas e o paciente não consegue agendar até ser reativado."
                : "O paciente volta a poder agendar consultas."}
            </p>
            <p className={styles.mutedNote}>
              {selected.appointment_count} {Number(selected.appointment_count) === 1 ? "consulta" : "consultas"} no histórico
            </p>
            <form action={selected.active ? deactivatePatient : reactivatePatient}>
              <input type="hidden" name="patientId" value={selected.id} />
              <StatusButton active={selected.active} />
            </form>
          </div>
        </aside>
      )}
    </div>
  );
}
