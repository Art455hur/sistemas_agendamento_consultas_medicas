"use client";

import { useState } from "react";
import { assignStaff } from "@/app/administracao/actions";
import styles from "@/app/administracao/page.module.css";

export default function StaffAssignmentForm({ staff, specialties }) {
  const existing = staff.filter((member) => member.staff_role === "doctor" || member.staff_role === "receptionist");
  const [selected, setSelected] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("doctor");
  const [specialty, setSpecialty] = useState("");
  const keepExistingSpecialty = role === "doctor" && existing.some((member) => member.profile_id === selected && member.staff_role === "doctor");

  function selectMember(id) {
    const member = existing.find((person) => person.profile_id === id);
    setSelected(id);
    setEmail(member?.email || "");
    setName(member?.full_name || "");
    setRole(member?.staff_role || "doctor");
    setSpecialty("");
  }

  return (
    <div className={styles.staffEditor}>
      <div className={styles.staffPicker}>
        <label htmlFor="existing-staff">Selecionar profissional já vinculado</label>
        <select id="existing-staff" value={selected} onChange={(event) => selectMember(event.target.value)}>
          <option value="">Vincular outra conta</option>
          {existing.map((member) => (
            <option key={member.profile_id} value={member.profile_id}>
              {member.full_name?.trim() || member.email} · {member.staff_role === "doctor" ? "Médico" : "Secretaria"}{member.active ? "" : " · Inativo"}
            </option>
          ))}
        </select>
        <small>Selecione um profissional para preencher e-mail, nome e função automaticamente.</small>
      </div>
      <form action={assignStaff} className={styles.staffForm}>
        <div>
          <label htmlFor="staff-email">E-mail de uma conta já criada</label>
          <input id="staff-email" name="email" type="email" maxLength={254} required readOnly={Boolean(selected)} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="funcionario@exemplo.com" />
        </div>
        <div>
          <label htmlFor="staff-name">Nome do profissional</label>
          <input id="staff-name" name="fullName" type="text" minLength={3} maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome completo" />
        </div>
        <div>
          <label htmlFor="staff-specialty">Especialidade</label>
          <select id="staff-specialty" name="specialty" required={role === "doctor" && !keepExistingSpecialty} value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
            <option value="">{keepExistingSpecialty ? "Manter especialidade atual" : "Selecione para médicos"}</option>
            {specialties.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
          <small>{keepExistingSpecialty ? "Deixe em branco para manter a atual; se ela estiver inativa, escolha outra." : "Obrigatória para novos médicos; para secretaria, deixe em branco."}</small>
        </div>
        <div>
          <label htmlFor="staff-role">Função</label>
          <select id="staff-role" name="role" required value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="doctor">Médico</option>
            <option value="receptionist">Secretaria</option>
          </select>
        </div>
        <button type="submit">Salvar e ativar vínculo</button>
      </form>
      <p className={styles.staffHint}>Desativar não exclui o usuário nem cancela consultas existentes.</p>
    </div>
  );
}
