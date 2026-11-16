"use client";

import { useState } from "react";
import { formatCpf, formatPhone } from "@/shared/formatting/patient-fields.js";
import { updatePatient } from "@/app/administracao/actions";
import styles from "@/app/administracao/page.module.css";

export default function PatientEditForm({ patient, today }) {
  const [phone, setPhone] = useState(formatPhone(patient.phone || ""));
  const [cpf, setCpf] = useState(formatCpf(patient.cpf || ""));

  return (
    <form action={updatePatient} className={styles.patientForm}>
      <input type="hidden" name="patientId" value={patient.id} />
      <div>
        <label htmlFor={`patient-name-${patient.id}`}>Nome completo</label>
        <input id={`patient-name-${patient.id}`} name="fullName" type="text" minLength={3} maxLength={120} required defaultValue={patient.full_name || ""} />
      </div>
      <div>
        <label htmlFor={`patient-phone-${patient.id}`}>Telefone</label>
        <input id={`patient-phone-${patient.id}`} name="phone" type="tel" inputMode="numeric" maxLength={15} value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} placeholder="(69) 99999-9999" />
      </div>
      <div>
        <label htmlFor={`patient-cpf-${patient.id}`}>CPF</label>
        <input id={`patient-cpf-${patient.id}`} name="cpf" type="text" inputMode="numeric" maxLength={14} value={cpf} onChange={(event) => setCpf(formatCpf(event.target.value))} placeholder="000.000.000-00" />
      </div>
      <div>
        <label htmlFor={`patient-birth-${patient.id}`}>Nascimento</label>
        <input id={`patient-birth-${patient.id}`} name="birthDate" type="date" max={today} defaultValue={patient.birth_date || ""} />
      </div>
      <button type="submit">Salvar alterações</button>
    </form>
  );
}
