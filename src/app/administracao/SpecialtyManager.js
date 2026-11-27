"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createSpecialty, deactivateSpecialty, reactivateSpecialty, updateSpecialty } from "@/app/administracao/actions";
import Dialog from "@/components/ui/Dialog.js";
import Icon from "@/components/ui/Icon.js";
import styles from "./page.module.css";

function SubmitButton({ children, pendingText = "Salvando...", className = "ui-button ui-button-primary" }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending}>{pending ? pendingText : children}</button>;
}

// Catálogo de especialidades: renomear na própria linha e cadastrar numa janela.
export default function SpecialtyManager({ specialties }) {
  const [renaming, setRenaming] = useState(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className={styles.sectionAction}>
        <button type="button" className="ui-button ui-button-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} />
          Cadastrar especialidade
        </button>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h3>Especialidades cadastradas</h3>
            <p>Ative ou desative áreas disponíveis para novos agendamentos.</p>
          </div>
        </div>
        {specialties.map((specialty) => (
          <div className={styles.specialtyItem} key={specialty.id}>
            <div>
              <strong>{specialty.name}</strong>
            </div>
            <span className={specialty.active ? styles.statusActive : styles.statusInactive}>{specialty.active ? "Ativa" : "Inativa"}</span>
            <div className={styles.rowActions}>
              <button type="button" className={styles.linkButton} onClick={() => setRenaming(renaming === specialty.id ? null : specialty.id)}>
                Renomear
              </button>
              <form action={specialty.active ? deactivateSpecialty : reactivateSpecialty}>
                <input type="hidden" name="specialtyId" value={specialty.id} />
                <button className={specialty.active ? styles.dangerLink : styles.linkButton} type="submit">
                  {specialty.active ? "Desativar" : "Reativar"}
                </button>
              </form>
            </div>
            {renaming === specialty.id && (
              <form action={updateSpecialty} className={styles.renameForm}>
                <input type="hidden" name="specialtyId" value={specialty.id} />
                <label className={styles.field}>
                  <span>Novo nome</span>
                  <input id={`specialty-${specialty.id}`} name="name" type="text" minLength={2} maxLength={120} required defaultValue={specialty.name} autoFocus />
                </label>
                <button type="button" className="ui-button ui-button-secondary" onClick={() => setRenaming(null)}>Cancelar</button>
                <SubmitButton>Salvar</SubmitButton>
              </form>
            )}
          </div>
        ))}
        {specialties.length === 0 && <p className={styles.emptyRow}>Ainda não há especialidades cadastradas.</p>}
      </div>
      <p className={styles.staffHint}>
        Desativar não apaga consultas antigas. Médicos de uma especialidade inativa deixam de aparecer para novos agendamentos até a reativação.
      </p>

      {creating && (
        <Dialog title="Cadastrar especialidade" onClose={() => setCreating(false)}>
          <form action={createSpecialty} className={styles.dialogForm}>
            <label className={styles.field}>
              <span>Nome da especialidade</span>
              <input id="new-specialty" name="name" type="text" minLength={2} maxLength={120} required placeholder="Ex.: Pediatria" autoFocus />
            </label>
            <p className={styles.modalNote}>A especialidade nova já fica ativa para vincular médicos.</p>
            <div className="ui-dialog-actions">
              <button type="button" className="ui-button ui-button-secondary" onClick={() => setCreating(false)}>Cancelar</button>
              <SubmitButton>Cadastrar</SubmitButton>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
