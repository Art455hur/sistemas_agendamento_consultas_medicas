"use client";

import { useActionState, useState } from "react";
import { saveClinicalNote } from "./actions";
import { clinicalFields } from "./fields";
import styles from "./clinical.module.css";

export default function ClinicalForm({ id, revision, initial }) {
  const [values, setValues] = useState(initial);
  const [state, action, pending] = useActionState(saveClinicalNote.bind(null, id, revision), null);
  return <form action={action} className={styles.form}>
    <div>
      <h2>Anotações clínicas</h2>
      <p>O campo Anotações do atendimento é obrigatório. Os demais são opcionais.</p>
    </div>
    <fieldset disabled={pending}>
      {clinicalFields.map(({ name, label, hint, maxLength, rows, required }) => (
        <div key={name} className={styles.field}>
          <label htmlFor={`note-${name}`}>{label}{required ? " *" : " (opcional)"}</label>
          {hint && <small id={`note-${name}-hint`} className={styles.hint}>{hint}</small>}
          <textarea id={`note-${name}`} name={name} value={values[name]}
            onChange={(event) => setValues({ ...values, [name]: event.target.value })}
            maxLength={maxLength} rows={rows} required={required} autoComplete="off"
            aria-describedby={hint ? `note-${name}-hint` : undefined} />
        </div>
      ))}
      <div className={styles.actions}>
        <button type="submit">{pending ? "Salvando…" : "Salvar registro"}</button>
        <span>Cada salvamento preserva a versão anterior.</span>
      </div>
    </fieldset>
    {state?.message && <p className={styles.error} role="alert">{state.message}</p>}
  </form>;
}
