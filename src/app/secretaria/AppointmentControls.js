"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { cancelAppointment, rescheduleAppointment } from "./actions";
import styles from "@/app/administracao/page.module.css";
import desk from "./secretaria.module.css";

function Submit({ children, disabled, className }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending || disabled}>{pending ? "Aguarde…" : children}</button>;
}

export default function AppointmentControls({ appointmentId, currentDay, currentTime, today, maxDay }) {
  const dialog = useRef(null);
  const titleId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(currentDay);
  const [time, setTime] = useState("");
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const ready = result?.day === day && result.revision === revision;

  useEffect(() => {
    if (!open || !day || day < today || day > maxDay) return;
    let current = true;
    async function load() {
      try {
        const { data, error } = await createClient().rpc("receptionist_reschedule_slots", { p_id: appointmentId, p_day: day });
        if (current) setResult({ day, revision, slots: (data ?? []).map(({ slot }) => slot.slice(0, 5)), error: !!error });
      } catch {
        if (current) setResult({ day, revision, slots: [], error: true });
      }
    }
    load();
    return () => { current = false; };
  }, [appointmentId, day, maxDay, open, revision, today]);

  const validDay = day && day >= today && day <= maxDay;
  const slots = ready && !result.error ? result.slots : [];
  return <div className={styles.appointmentActions}>
    <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => { setTime(""); setResult(null); setOpen(!open); }}>Remarcar</button>
    <button type="button" className={styles.deactivate} onClick={() => dialog.current.showModal()}>Cancelar consulta</button>
    <dialog ref={dialog} className={desk.confirmDialog} aria-labelledby={titleId}>
      <h2 id={titleId}>Cancelar esta consulta?</h2>
      <p>A consulta de {currentDay.split("-").reverse().join("/")} às {currentTime} será registrada como cancelada no histórico.</p>
      <form action={cancelAppointment}>
        <input type="hidden" name="appointmentId" value={appointmentId} />
        <input type="hidden" name="day" value={currentDay} />
        <button type="button" autoFocus onClick={() => dialog.current.close()}>Manter consulta</button>
        <Submit className={styles.deactivate}>Confirmar cancelamento</Submit>
      </form>
    </dialog>
    <div id={panelId} hidden={!open} className={desk.reschedulePanel}>
      {open && <form action={rescheduleAppointment}>
        <input type="hidden" name="appointmentId" value={appointmentId} />
        <label>Nova data<input type="date" name="day" value={day} min={today} max={maxDay} required onChange={(e) => { setTime(""); setResult(null); setDay(e.target.value); }} /></label>
        <label>Horário disponível<select name="time" value={time} required disabled={!slots.length} onChange={(e) => setTime(e.target.value)}>
          <option value="">Selecione</option>
          {slots.map((slot) => <option key={slot}>{slot}</option>)}
        </select></label>
        <Submit disabled={!slots.includes(time)}>Confirmar remarcação</Submit>
        {ready && result.error && <button type="button" onClick={() => setRevision(revision + 1)}>Tentar novamente</button>}
        <p role={ready && result.error ? "alert" : "status"} className={desk.slotMessage}>
          {!validDay ? "Escolha uma data válida." : !ready ? "Consultando horários…" : result.error ? "Não foi possível consultar os horários." : !slots.length ? "Não há outro horário disponível nesta data." : ""}
        </p>
      </form>}
    </div>
  </div>;
}
