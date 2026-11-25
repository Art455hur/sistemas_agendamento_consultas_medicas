"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createAdminAppointment } from "@/app/administracao/actions";
import { createAppointment as createReceptionistAppointment } from "@/app/secretaria/actions";
import styles from "@/app/administracao/page.module.css";
import desk from "@/app/secretaria/secretaria.module.css";

export default function AdminCreateAppointmentForm({ patients, doctors, initialDay, minDay, maxDay, receptionist = false }) {
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [day, setDay] = useState(initialDay >= minDay && initialDay <= maxDay ? initialDay : minDay);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [reload, setReload] = useState(0);
  const [bookingState, receptionistAction, pending] = useActionState(createReceptionistAppointment, null);

  useEffect(() => {
    setSlots([]);
    setTime("");
    setError("");
    if (!patientId || !doctorId || !day) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    createClient().rpc(receptionist ? "receptionist_booking_slots" : "admin_booking_slots", {
      p_patient_id: patientId,
      p_doctor_id: doctorId,
      p_day: day,
    }).then(({ data, error: requestError }) => {
      if (cancelled) return;
      setSlots(requestError ? [] : (data || []).map((entry) => entry.slot.slice(0, 5)));
      setError(requestError ? "Não foi possível consultar os horários. Confira os vínculos, a migração e tente novamente." : "");
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setSlots([]);
      setError("Não foi possível consultar os horários. Tente novamente.");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [patientId, doctorId, day, receptionist, reload]);

  const bookingReady = Boolean(patientId && doctorId && day && slots.includes(time) && !loading && !error);

  function submitReceptionistBooking(event) {
    event.preventDefault();
    if (!bookingReady || pending) return;

    // Capture the selected values before the framework can reset form controls.
    const payload = new FormData();
    for (const [field, value] of Object.entries({ patientId, doctorId, day, time, reason })) {
      payload.set(field, value);
    }
    startTransition(() => receptionistAction(payload));
  }

  return (
    <form action={receptionist ? undefined : createAdminAppointment} method={receptionist ? "post" : undefined} onSubmit={receptionist ? submitReceptionistBooking : undefined} className={styles.createAppointmentForm} aria-busy={receptionist && pending}>
      <div>
        <label htmlFor="new-appointment-patient">Paciente ativo</label>
        <select id="new-appointment-patient" name="patientId" required value={patientId} onChange={(event) => { setTime(""); setPatientId(event.target.value); }}>
          <option value="">Selecione um paciente</option>
          {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name || patient.email || "Paciente sem nome"}{patient.email ? ` · ${patient.email}` : ` · ${patient.id.slice(0, 8)}`}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="new-appointment-doctor">Médico ativo</label>
        <select id="new-appointment-doctor" name="doctorId" required value={doctorId} onChange={(event) => { setTime(""); setDoctorId(event.target.value); }}>
          <option value="">Selecione um médico</option>
          {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name || doctor.email || "Médico sem nome"}{doctor.email ? ` · ${doctor.email}` : ""}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="new-appointment-day">Dia da consulta (São Paulo)</label>
        <input id="new-appointment-day" name="day" type="date" min={minDay} max={maxDay} required value={day} onChange={(event) => { setTime(""); setDay(event.target.value); }} />
      </div>
      {receptionist ? <fieldset className={desk.slots}>
        <legend>Horário da consulta (obrigatório)</legend>
        <p role="status">{!patientId || !doctorId || !day ? "Selecione o paciente, o profissional e a data."
          : loading ? "Consultando horários…" : !error && slots.length > 0
            ? time ? `Horário selecionado: ${time}.` : "Escolha um dos horários livres abaixo para habilitar o agendamento."
            : ""}</p>
        {!loading && !error && patientId && doctorId && day && <div>
          {slots.map((slot) => <label key={slot}>
            <input type="radio" name="time" value={slot} checked={time === slot} onChange={() => setTime(slot)} required />
            {slot}
          </label>)}
        </div>}
      </fieldset> : <div>
        <label htmlFor="new-appointment-time">Horário livre</label>
        <select id="new-appointment-time" name="time" required disabled={!patientId || !doctorId || loading || slots.length === 0} value={time} onChange={(event) => setTime(event.target.value)}>
          <option value="">{loading ? "Consultando..." : "Selecione um horário"}</option>
          {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
        </select>
      </div>}
      <div className={styles.createAppointmentReason}>
        <label htmlFor="new-appointment-reason">Motivo (opcional)</label>
        <textarea id="new-appointment-reason" name="reason" maxLength={2000} rows={2} placeholder="Descreva brevemente o motivo da consulta" {...(receptionist ? { value: reason, onChange: (event) => setReason(event.target.value) } : {})} />
      </div>
      {error && <p role="alert" className={styles.createAppointmentHint}>{error}</p>}
      {!loading && patientId && doctorId && !error && slots.length === 0 &&
        <p className={styles.createAppointmentHint}>Sem horários livres para esta combinação de médico, paciente e dia. Confira a grade do médico e possíveis consultas já marcadas.</p>}
      {!receptionist && doctorId && day && <Link className={styles.availabilityShortcut} href={`/administracao/horarios?medico=${encodeURIComponent(doctorId)}&dia=${encodeURIComponent(day)}`}>
        Conferir horários deste médico neste dia →
      </Link>}
      {receptionist && bookingState?.message && !pending && <p role="alert" className={styles.createAppointmentHint}>{bookingState.message}</p>}
      {receptionist && patientId && doctorId && day && (error || bookingState?.message || (!loading && slots.length === 0)) &&
        <button type="button" disabled={loading || pending} onClick={() => { setTime(""); setReload((value) => value + 1); }}>Atualizar horários</button>}
      <button type="submit" disabled={receptionist ? !bookingReady || pending : !time || loading || Boolean(error)}>
        {receptionist && pending ? "Salvando…" : "Agendar para paciente"}
      </button>
      <p className={styles.createAppointmentHint}>O banco confere novamente as permissões, a disponibilidade e os conflitos antes de salvar.</p>
    </form>
  );
}
