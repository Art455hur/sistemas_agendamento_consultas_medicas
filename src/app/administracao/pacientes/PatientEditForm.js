"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { formatCpf, formatPhone } from "@/shared/formatting/patient-fields.js";
import { updatePatient } from "@/app/administracao/actions";
import styles from "@/app/administracao/page.module.css";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="ui-button ui-button-primary" disabled={pending}>
      {pending ? "Salvando..." : "Salvar alterações"}
    </button>
  );
}

export default function PatientEditForm({ patient, today }) {
  const [phone, setPhone] = useState(formatPhone(patient.phone || ""));
  const [cpf, setCpf] = useState(formatCpf(patient.cpf || ""));

  return (
    <form action={updatePatient} className={styles.patientEditGrid}>
      <input type="hidden" name="patientId" value={patient.id} />
      <div className={`${styles.field} ${styles.fieldWide}`}>
        <label htmlFor={`patient-name-${patient.id}`}>Nome completo</label>
        <input id={`patient-name-${patient.id}`} name="fullName" type="text" minLength={3} maxLength={120} required defaultValue={patient.full_name || ""} />
      </div>
      <div className={styles.field}>
        <label htmlFor={`patient-phone-${patient.id}`}>Telefone</label>
        <input id={`patient-phone-${patient.id}`} name="phone" type="tel" inputMode="numeric" maxLength={15} value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} placeholder="(69) 99999-9999" />
      </div>
      <div className={styles.field}>
        <label htmlFor={`patient-cpf-${patient.id}`}>CPF</label>
        <input id={`patient-cpf-${patient.id}`} name="cpf" type="text" inputMode="numeric" maxLength={14} value={cpf} onChange={(event) => setCpf(formatCpf(event.target.value))} placeholder="000.000.000-00" />
      </div>
      <div className={styles.field}>
        <label htmlFor={`patient-birth-${patient.id}`}>Data de nascimento</label>
        <input id={`patient-birth-${patient.id}`} name="birthDate" type="date" max={today} defaultValue={patient.birth_date || ""} />
      </div>
      <div className={styles.fieldWide}>
        <SaveButton />
      </div>
    </form>
  );
}
