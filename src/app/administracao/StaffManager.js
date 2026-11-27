"use client";

import { useState } from "react";
import { filterStaff } from "@/features/staff/filter-staff.js";
import { deactivateStaff, reactivateStaff } from "@/app/administracao/actions";
import Dialog from "@/components/ui/Dialog.js";
import Icon from "@/components/ui/Icon.js";
import StaffAssignmentForm from "./StaffAssignmentForm";
import styles from "./page.module.css";

const roleLabel = { admin: "Administrador", doctor: "Médico", receptionist: "Secretaria" };

function initials(member) {
  const text = member.full_name?.trim() || member.email || "";
  return text.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

// Lista da equipe com busca e filtros; vincular e editar abrem numa janela.
export default function StaffManager({ staff, specialties, canEdit = true }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState(null);
  const filtered = filterStaff(staff, { query, role, status });
  const hasFilters = Boolean(query) || role !== "all" || status !== "all";
  const editingMember = editing && editing !== "new" ? staff.find((member) => member.profile_id === editing) : null;

  function clearFilters() {
    setQuery("");
    setRole("all");
    setStatus("all");
  }

  return (
    <>
      {canEdit && (
        <div className={styles.sectionAction}>
          <button type="button" className="ui-button ui-button-primary" onClick={() => setEditing("new")}>
            <Icon name="plus" size={18} />
            Vincular conta existente
          </button>
        </div>
      )}

      <div className={`${styles.panel} ${styles.filters}`} role="search" aria-label="Filtrar equipe">
        <label className={styles.searchField}>
          <Icon name="search" size={18} />
          <span className={styles.srOnly}>Buscar profissional</span>
          <input id="staff-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou e-mail" />
        </label>
        <label>
          <span className={styles.srOnly}>Função</span>
          <select id="staff-filter-role" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">Todas as funções</option>
            <option value="doctor">Médico</option>
            <option value="receptionist">Secretaria</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <label>
          <span className={styles.srOnly}>Situação</span>
          <select id="staff-filter-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Todas as situações</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </label>
        <button type="button" className={styles.linkButton} onClick={clearFilters} disabled={!hasFilters}>Limpar filtros</button>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h3>Profissionais vinculados</h3>
            <p role="status" aria-live="polite">
              {hasFilters ? `${filtered.length} de ${staff.length} vínculos` : `${staff.length} ${staff.length === 1 ? "vínculo encontrado" : "vínculos encontrados"}`}
            </p>
          </div>
        </div>
        <div className={styles.tableHeader} aria-hidden="true">
          <span>Profissional</span><span>Função</span><span>Situação</span><span>Ações</span>
        </div>
        {filtered.map((member) => (
          <div className={styles.tableRow} key={member.profile_id}>
            <div className={styles.personCell}>
              <span className={styles.initials} aria-hidden="true">{initials(member)}</span>
              <div>
                <strong>{member.full_name?.trim() || member.email}</strong>
                <small>{member.email}</small>
              </div>
            </div>
            <span data-label="Função">{roleLabel[member.staff_role] ?? member.staff_role}</span>
            <span data-label="Situação"><span className={member.active ? styles.statusActive : styles.statusInactive}>{member.active ? "Ativo" : "Inativo"}</span></span>
            <div className={styles.rowActions}>
              {member.staff_role !== "admin" ? (
                <>
                  {canEdit && (
                    <button type="button" className={styles.linkButton} onClick={() => setEditing(member.profile_id)} aria-label={`Editar ${member.email}`}>
                      Editar
                    </button>
                  )}
                  <form action={member.active ? deactivateStaff : reactivateStaff}>
                    <input type="hidden" name="profileId" value={member.profile_id} />
                    <button
                      className={member.active ? styles.dangerLink : styles.linkButton}
                      type="submit"
                      aria-label={`${member.active ? "Desativar" : "Reativar"} ${member.email}`}
                    >
                      {member.active ? "Desativar" : "Reativar"}
                    </button>
                  </form>
                </>
              ) : (
                <small className={styles.mutedNote}>Conta administrativa</small>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className={styles.emptyRow}>
            {staff.length === 0 ? "Ainda não há vínculos de funcionários." : "Nenhum profissional encontrado. Altere a busca ou limpe os filtros."}
          </p>
        )}
      </div>
      <p className={styles.staffHint}>Desativar não exclui o usuário nem cancela consultas existentes.</p>

      {canEdit && editing && (
        <Dialog
          title={editingMember ? "Editar vínculo" : "Vincular conta existente"}
          onClose={() => setEditing(null)}
        >
          <StaffAssignmentForm
            key={editing}
            member={editingMember}
            specialties={specialties}
            onCancel={() => setEditing(null)}
          />
        </Dialog>
      )}
    </>
  );
}
