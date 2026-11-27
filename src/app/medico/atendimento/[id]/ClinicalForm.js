"use client";

import { useActionState, useState } from "react";
import Icon from "@/components/ui/Icon.js";
import { saveClinicalNote } from "./actions";
import { clinicalFields } from "./fields";
import styles from "./clinical.module.css";

function Field({ field, value, onChange }) {
  const { name, label, hint, maxLength, rows, required } = field;
  return (
    <div className={name === "evolution" ? `${styles.field} ${styles.mainNotes}` : styles.field}>
      <label htmlFor={`note-${name}`}>
        {label}
        {required ? <em>Obrigatório</em> : <small>Opcional</small>}
      </label>
      {hint && <p id={`note-${name}-hint`} className={styles.hint}>{hint}</p>}
      <textarea id={`note-${name}`} name={name} value={value} onChange={onChange}
        maxLength={maxLength} rows={rows} required={required} autoComplete="off"
        placeholder={required ? "Escreva a avaliação clínica e a evolução do paciente..."
          : name === "diagnosis" ? "Descreva, se necessário..." : "Registre orientações e próximos passos..."}
        aria-describedby={hint ? `note-${name}-hint` : undefined} />
    </div>
  );
}

export default function ClinicalForm({ id, revision, initial, saved }) {
  const [values, setValues] = useState(initial);
  const [state, action, pending] = useActionState(saveClinicalNote.bind(null, id, revision), null);
  const [main, ...optional] = clinicalFields;
  const update = (name) => (event) => setValues({ ...values, [name]: event.target.value });
  const changed = clinicalFields.some(({ name }) => values[name] !== initial[name]);

  return (
    <section id="anotacoes" className={`${styles.recordCard} ${styles.notesCard}`} aria-labelledby="notes-heading">
      <div className={styles.cardHeading}>
        <div>
          <span className={styles.sectionIcon}><Icon name="note" /></span>
          <div>
            <h2 id="notes-heading">Anotações clínicas</h2>
            <p>Informações registradas nesta consulta</p>
          </div>
        </div>
        <span className={styles.manualSave}>Salvamento manual</span>
      </div>

      {saved && !changed && (
        <div className={styles.saveSuccess} role="status">
          <span><Icon name="check" size={18} /></span>
          <div>
            <strong>Registro salvo com sucesso</strong>
            <p>{saved}</p>
          </div>
        </div>
      )}

      <form action={action}>
        <fieldset disabled={pending} className={styles.fieldset}>
          <Field field={main} value={values[main.name]} onChange={update(main.name)} />
          <div className={styles.twoFields}>
            {optional.map((field) => <Field key={field.name} field={field} value={values[field.name]} onChange={update(field.name)} />)}
          </div>
          {state?.message && <p className={styles.formError} role="alert"><Icon name="alert" size={18} /> {state.message}</p>}
          <div className={styles.saveRow}>
            <span>
              <Icon name="clock" size={16} />
              {revision > 0 ? `Versão atual: ${revision}. Cada salvamento preserva a versão anterior.` : "Nenhuma anotação salva para esta consulta."}
            </span>
            <button type="submit" className="ui-button ui-button-primary" disabled={!values.evolution.trim()}>
              <Icon name="check" size={17} /> {pending ? "Salvando..." : "Salvar registro"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
