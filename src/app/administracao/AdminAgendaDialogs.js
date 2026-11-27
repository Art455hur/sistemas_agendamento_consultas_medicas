"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { cancelAdminAppointment, rescheduleAdminAppointment } from "@/app/administracao/actions";
import AdminCreateAppointmentForm from "@/app/administracao/AdminCreateAppointmentForm";
import Dialog from "@/components/ui/Dialog.js";
import Icon from "@/components/ui/Icon.js";
import styles from "./page.module.css";

function SubmitButton({ children, pendingText, className = "ui-button ui-button-primary" }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending}>{pending ? pendingText : children}</button>;
}

// Botão "Novo agendamento" da agenda do admin, com o formulário numa janela.
export function NewAppointmentButton({ patients, doctors, initialDay, minDay, maxDay, disabledReason }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ui-button ui-button-primary" onClick={() => setOpen(true)}>
        <Icon name="plus" size={18} />
        Novo agendamento
      </button>
      {open && (
        <Dialog title="Novo agendamento" onClose={() => setOpen(false)}>
          {disabledReason ? (
            <p className={styles.modalNote}>{disabledReason}</p>
          ) : (
            <>
              <p className={styles.dialogLead}>Escolha um paciente, um médico ativo e um horário livre.</p>
              <AdminCreateAppointmentForm patients={patients} doctors={doctors} initialDay={initialDay} minDay={minDay} maxDay={maxDay} />
            </>
          )}
        </Dialog>
      )}
    </>
  );
}

// Ações de uma consulta futura: remarcar e cancelar, cada uma numa janela.
export function AppointmentActions({ appointment }) {
  const [dialog, setDialog] = useState(null);
  return (
    <div className={styles.rowActions}>
      <button type="button" className={styles.linkButton} onClick={() => setDialog("reschedule")}>Remarcar</button>
      <button type="button" className={styles.dangerLink} onClick={() => setDialog("cancel")}>Cancelar</button>

      {dialog === "reschedule" && (
        <Dialog title="Remarcar consulta" onClose={() => setDialog(null)}>
          <div className={styles.currentTime}>
            <span>Horário atual</span>
            <strong>{appointment.dateLabel}, às {appointment.time}</strong>
            <small>{appointment.patient} · {appointment.doctor}</small>
          </div>
          <form action={rescheduleAdminAppointment} className={styles.dialogForm}>
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <div className={styles.dialogRow}>
              <label className={styles.field}>
                <span>Nova data</span>
                <input type="date" name="day" defaultValue={appointment.date} required />
              </label>
              <label className={styles.field}>
                <span>Novo horário</span>
                <input type="time" name="time" min="08:00" max="17:30" step="1800" defaultValue={appointment.time} required />
              </label>
            </div>
            <p className={styles.modalNote}>Horários de 30 em 30 minutos, das 08:00 às 17:30. O sistema confere se o horário está livre ao salvar.</p>
            <div className="ui-dialog-actions">
              <button type="button" className="ui-button ui-button-secondary" onClick={() => setDialog(null)}>Voltar</button>
              <SubmitButton pendingText="Remarcando...">Confirmar novo horário</SubmitButton>
            </div>
          </form>
        </Dialog>
      )}

      {dialog === "cancel" && (
        <Dialog title="Cancelar consulta?" onClose={() => setDialog(null)}>
          <p className="ui-dialog-text">
            Você está prestes a cancelar a consulta de <strong>{appointment.patient}</strong> com {appointment.doctor},
            {" "}em {appointment.dateLabel}, às {appointment.time}. O registro histórico é preservado.
          </p>
          <form action={cancelAdminAppointment}>
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <input type="hidden" name="day" value={appointment.date} />
            <div className="ui-dialog-actions">
              <button type="button" className="ui-button ui-button-secondary" onClick={() => setDialog(null)} data-autofocus>Manter consulta</button>
              <SubmitButton pendingText="Cancelando..." className="ui-button ui-button-danger">Sim, cancelar consulta</SubmitButton>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
