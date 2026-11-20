"use client";

import { useState } from "react";
import { filterStaff } from "@/features/staff/filter-staff.js";
import { deactivateStaff, reactivateStaff } from "@/app/administracao/actions";
import StaffAssignmentForm from "./StaffAssignmentForm";
import styles from "./page.module.css";

const roleLabel = { admin: "Administrador", doctor: "Médico", receptionist: "Secretaria" };

export default function StaffManager({ staff, specialties, canEdit = true }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [editor, setEditor] = useState({ id: "", revision: 0 });
  const filtered = filterStaff(staff, { query, role, status });

  function selectMember(id) {
    setEditor((current) => ({ id, revision: current.revision + 1 }));
  }

  function clearFilters() {
    setQuery("");
    setRole("all");
    setStatus("all");
  }

  return (
    <>
      <div className={styles.staffFilters} role="search" aria-label="Filtrar equipe">
        <div>
          <label htmlFor="staff-search">Buscar profissional</label>
          <input id="staff-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou e-mail" />
        </div>
        <div>
          <label htmlFor="staff-filter-role">Função</label>
          <select id="staff-filter-role" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">Todas as funções</option>
            <option value="doctor">Médico</option>
            <option value="receptionist">Secretaria</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div>
          <label htmlFor="staff-filter-status">Situação</label>
          <select id="staff-filter-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Todas as situações</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
        <button type="button" className={styles.staffEditButton} onClick={clearFilters} disabled={!query && role === "all" && status === "all"}>Limpar filtros</button>
      </div>
      <p className={styles.staffHint} role="status" aria-live="polite">Exibindo {filtered.length} de {staff.length} vínculos.</p>
      <div className={styles.staffList}>
        {filtered.map((member) => (
          <div className={styles.staffRow} key={member.profile_id}>
            <div>
              <strong>{member.full_name?.trim() || member.email}</strong>
              <span>{member.email} · {roleLabel[member.staff_role] ?? member.staff_role}</span>
            </div>
            <span className={member.active ? styles.active : styles.inactive}>{member.active ? "Ativo" : "Inativo"}</span>
            {member.staff_role !== "admin" && (
              <>
                {canEdit && <button type="button" className={styles.staffEditButton} onClick={() => selectMember(member.profile_id)} aria-label={`Editar ${member.email}`}>Editar</button>}
                <form action={member.active ? deactivateStaff : reactivateStaff}>
                  <input type="hidden" name="profileId" value={member.profile_id} />
                  <button className={member.active ? styles.deactivate : styles.reactivate} type="submit" aria-label={`${member.active ? "Desativar" : "Reativar"} ${member.email}`}>
                    {member.active ? "Desativar" : "Reativar"}
                  </button>
                </form>
              </>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p>{staff.length === 0 ? "Ainda não há vínculos de funcionários." : "Nenhum profissional encontrado. Altere a busca ou limpe os filtros."}</p>}
      </div>
      {canEdit && <StaffAssignmentForm key={`${editor.id}:${editor.revision}`} staff={staff} specialties={specialties} selectedId={editor.id} onSelectMember={selectMember} />}
    </>
  );
}
