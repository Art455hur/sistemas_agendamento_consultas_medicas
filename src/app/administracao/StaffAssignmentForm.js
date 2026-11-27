"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { assignStaff } from "@/app/administracao/actions";
import styles from "@/app/administracao/page.module.css";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="ui-button ui-button-primary" disabled={pending}>
      {pending ? "Salvando..." : "Salvar e ativar vínculo"}
    </button>
  );
}

// Formulário da janela "Vincular conta existente" / "Editar vínculo".
// Vincula uma conta que já existe no Supabase Auth; não cria nem altera senha.
export default function StaffAssignmentForm({ member = null, specialties, onCancel }) {
  const [role, setRole] = useState(member?.staff_role === "receptionist" ? "receptionist" : "doctor");
  const keepExistingSpecialty = role === "doctor" && member?.staff_role === "doctor";

  return (
    <form action={assignStaff} className={styles.dialogForm}>
      <p className={styles.dialogLead}>
        {member ? "Atualize o nome, a função ou a especialidade do profissional." : "Ative o vínculo de uma conta já cadastrada no AgendaSaúde."}
      </p>
      <label className={styles.field}>
        <span>E-mail da conta</span>
        <input
          id="staff-email"
          name="email"
          type="email"
          maxLength={254}
          required
          readOnly={Boolean(member)}
          defaultValue={member?.email || ""}
          placeholder="profissional@email.com"
          autoFocus={!member}
        />
      </label>
      <label className={styles.field}>
        <span>Nome completo</span>
        <input
          id="staff-name"
          name="fullName"
          type="text"
          minLength={3}
          maxLength={120}
          required
          defaultValue={member?.full_name || ""}
          placeholder="Nome do profissional"
          autoFocus={Boolean(member)}
        />
      </label>
      <label className={styles.field}>
        <span>Função</span>
        <select id="staff-role" name="role" required value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="doctor">Médico</option>
          <option value="receptionist">Secretaria</option>
        </select>
      </label>
      {role === "doctor" && (
        <label className={styles.field}>
          <span>Especialidade ativa</span>
          <select id="staff-specialty" name="specialty" required={!keepExistingSpecialty} defaultValue="">
            <option value="">{keepExistingSpecialty ? `Manter a atual${member?.specialty ? ` (${member.specialty})` : ""}` : "Selecione a especialidade"}</option>
            {specialties.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </label>
      )}
      <p className={styles.modalNote}>
        A conta existente será vinculada à clínica. Nenhuma senha será criada ou alterada.
      </p>
      <div className="ui-dialog-actions">
        <button type="button" className="ui-button ui-button-secondary" onClick={onCancel}>Cancelar</button>
        <SubmitButton />
      </div>
    </form>
  );
}
