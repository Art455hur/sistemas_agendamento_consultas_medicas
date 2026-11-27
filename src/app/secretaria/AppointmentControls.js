"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Dialog from "@/components/ui/Dialog.js";
import Icon from "@/components/ui/Icon.js";
import { createClient } from "@/lib/supabase/client";
import { cancelAppointment, rescheduleAppointment } from "./actions";
import desk from "./secretaria.module.css";

const shortDate = (day) => day.split("-").reverse().join("/");

function Submit({ children, pendingText, className }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending}>{pending ? pendingText : children}</button>;
}

// Remarcar: escolhe data e um horário livre do mesmo médico, revisa "De → Para" e confirma.
function RescheduleDialog({ appointment, today, maxDay, onClose }) {
  const [day, setDay] = useState(appointment.date);
  const [time, setTime] = useState("");
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const validDay = Boolean(day && day >= today && day <= maxDay);
  const ready = result?.day === day && result.revision === revision;
  const slots = ready && !result.error ? result.slots.filter((slot) => !(day === appointment.date && slot === appointment.time)) : [];

  useEffect(() => {
    if (!validDay) return undefined;
    let current = true;
    createClient().rpc("receptionist_reschedule_slots", { p_id: appointment.id, p_day: day })
      .then(({ data, error }) => {
        if (current) setResult({ day, revision, slots: (data ?? []).map(({ slot }) => slot.slice(0, 5)), error: Boolean(error) });
      })
      .catch(() => { if (current) setResult({ day, revision, slots: [], error: true }); });
    return () => { current = false; };
  }, [appointment.id, day, revision, validDay]);

  return (
    <Dialog title="Remarcar consulta" onClose={onClose}>
      <div className={desk.dialogPerson}>
        <strong>{appointment.patient}</strong>
        <span>{appointment.doctor}{appointment.specialty ? ` · ${appointment.specialty}` : ""}</span>
      </div>

      {!reviewing ? <>
        <div className={desk.currentSlot}>
          <span>Horário atual</span>
          <strong>{appointment.dateLabel} às {appointment.time}</strong>
        </div>
        <label className={desk.field}>
          <span>Nova data</span>
          <input type="date" value={day} min={today} max={maxDay} required
            onChange={(event) => { setTime(""); setDay(event.target.value); }} />
        </label>
        <p className={desk.slotsLabel}>Horários livres de {appointment.doctor}</p>
        {!validDay ? <p className={desk.noTimes}><strong>Escolha uma data válida</strong><span>Entre hoje e os próximos 12 meses.</span></p>
          : !ready ? <p className={desk.slotHint} role="status">Consultando horários...</p>
          : result.error ? <div className={desk.noTimes} role="alert">
            <strong>Não foi possível consultar os horários</strong>
            <button type="button" className="ui-button ui-button-secondary" onClick={() => setRevision(revision + 1)}>
              <Icon name="refresh" size={16} /> Tentar novamente
            </button>
          </div>
          : slots.length ? <div className={desk.timeGrid}>
            {slots.map((slot) => (
              <button type="button" key={slot} aria-pressed={time === slot}
                className={time === slot ? desk.timeSelected : undefined} onClick={() => setTime(slot)}>{slot}</button>
            ))}
          </div>
          : <p className={desk.noTimes}><strong>Não há vagas nesta data</strong><span>Troque a data para consultar outros horários.</span></p>}
        <div className="ui-dialog-actions">
          <button type="button" className="ui-button ui-button-secondary" onClick={onClose}>Voltar</button>
          <button type="button" className="ui-button ui-button-primary" disabled={!time || !slots.includes(time)}
            onClick={() => setReviewing(true)}>Revisar alteração</button>
        </div>
      </> : <form action={rescheduleAppointment}>
        <input type="hidden" name="appointmentId" value={appointment.id} />
        <input type="hidden" name="day" value={day} />
        <input type="hidden" name="time" value={time} />
        <div className={desk.changeSummary}>
          <div><span>De</span><strong>{appointment.dateLabel} às {appointment.time}</strong></div>
          <Icon name="arrow" />
          <div><span>Para</span><strong>{shortDate(day)} às {time}</strong></div>
        </div>
        <p className="ui-dialog-text">Confirme a mudança de data e horário desta consulta. O sistema confere de novo se o horário está livre.</p>
        <div className="ui-dialog-actions">
          <button type="button" className="ui-button ui-button-secondary" onClick={() => setReviewing(false)}>Voltar</button>
          <Submit className="ui-button ui-button-primary" pendingText="Remarcando...">Confirmar remarcação</Submit>
        </div>
      </form>}
    </Dialog>
  );
}

export default function AppointmentControls({ appointment, today, maxDay }) {
  const [dialog, setDialog] = useState(null);
  return (
    <div className={desk.cardActions}>
      <button type="button" className="ui-button ui-button-secondary" onClick={() => setDialog("reschedule")}
        aria-label={`Remarcar: ${appointment.patient}, ${appointment.time}`}>
        <Icon name="edit" size={16} /> Remarcar
      </button>
      <button type="button" className={desk.dangerLink} onClick={() => setDialog("cancel")}
        aria-label={`Cancelar consulta: ${appointment.patient}, ${appointment.time}`}>
        Cancelar consulta
      </button>

      {dialog === "reschedule" && (
        <RescheduleDialog appointment={appointment} today={today} maxDay={maxDay} onClose={() => setDialog(null)} />
      )}

      {dialog === "cancel" && (
        <Dialog title="Cancelar esta consulta?" onClose={() => setDialog(null)}>
          <p className="ui-dialog-text">A consulta continua agendada até você confirmar. O histórico é preservado.</p>
          <div className={desk.cancelInfo}>
            <span>Paciente<strong>{appointment.patient}</strong></span>
            <span>Data e hora<strong>{appointment.dateLabel} às {appointment.time}</strong></span>
          </div>
          <form action={cancelAppointment}>
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <input type="hidden" name="day" value={appointment.date} />
            <div className="ui-dialog-actions">
              <button type="button" className="ui-button ui-button-secondary" onClick={() => setDialog(null)} data-autofocus>
                Manter consulta
              </button>
              <Submit className="ui-button ui-button-danger" pendingText="Cancelando...">Sim, cancelar consulta</Submit>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
