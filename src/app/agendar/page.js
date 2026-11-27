"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAppointment, getBookingDoctors, getBookingSlots, saveAppointment } from "@/features/appointments/services/appointments.js";
import { clinicDateTime } from "@/features/appointments/appointment-format.js";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import PatientShell from "@/components/layout/PatientShell.js";
import Icon from "@/components/ui/Icon.js";
import { formatDate, formatLongDate } from "@/shared/formatting/date.js";

const UNAVAILABLE_HINT = "Escolha outro horário abaixo. Suas outras informações foram mantidas.";

function Step({ number, children }) {
  return (
    <div className="ph-step">
      <span aria-hidden="true">{number}</span>
      <div>{children}</div>
    </div>
  );
}

function Detail({ icon, title, text }) {
  return (
    <div className="ph-detail">
      <span aria-hidden="true"><Icon name={icon} size={19} /></span>
      <p><strong>{title}</strong><small>{text}</small></p>
    </div>
  );
}

export default function AgendarConsulta() {
  const router = useRouter();
  const [form, setForm] = useState({ specialty: "", doctor: "", doctorId: "", date: "", time: "", reason: "" });
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [reschedulingId, setReschedulingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [conflict, setConflict] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [refreshSlots, setRefreshSlots] = useState(0);
  const isRescheduling = Boolean(reschedulingId);
  const minimumDate = isSupabaseConfigured() ? clinicDateTime(new Date()).date
    : new Date().toLocaleDateString("en-CA");
  const doctorsBySpecialty = Object.groupBy(doctors, (doctor) => doctor.specialty);
  const selectedSlot = slots.find((slot) => slot.time === form.time);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const availableDoctors = await getBookingDoctors();
        const parameters = new URLSearchParams(window.location.search);
        const id = parameters.get("remarcar");
        const appointment = id ? await getAppointment(id) : null;
        if (!active) return;
        setDoctors(availableDoctors);
        if (id) {
          if (!appointment || appointment.status !== "Agendada") {
            setError("Consulta não encontrada ou indisponível para remarcação.");
            setLoadError(true);
            return;
          }
          setReschedulingId(id);
          setForm(appointment);
        } else {
          const specialty = parameters.get("especialidade");
          const doctor = availableDoctors.find((item) => item.specialty === specialty &&
            (item.id === parameters.get("profissional") || item.full_name === parameters.get("profissional")));
          setForm((current) => ({ ...current,
            specialty: availableDoctors.some((item) => item.specialty === specialty) ? specialty : "",
            doctorId: doctor?.id || "", doctor: doctor?.full_name || "",
          }));
        }
      } catch (failure) { if (active) { setError(failure.message); setLoadError(true); } }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setSlots([]);
    setSlotError("");
    if (!form.doctorId || !form.date) { setSlotsLoading(false); return; }
    setSlotsLoading(true);
    getBookingSlots(form.doctorId, form.date, reschedulingId)
      .then((items) => {
        if (!active) return;
        setSlots(items);
        setForm((current) => items.some((slot) => slot.time === current.time)
          ? current : { ...current, time: "" });
      })
      .catch((failure) => { if (active) setSlotError(failure.message); })
      .finally(() => { if (active) setSlotsLoading(false); });
    return () => { active = false; };
  }, [form.doctorId, form.date, reschedulingId, refreshSlots]);

  useEffect(() => {
    function refreshAvailability() {
      if (document.visibilityState === "visible") setRefreshSlots((current) => current + 1);
    }
    window.addEventListener("focus", refreshAvailability);
    document.addEventListener("visibilitychange", refreshAvailability);
    return () => {
      window.removeEventListener("focus", refreshAvailability);
      document.removeEventListener("visibilitychange", refreshAvailability);
    };
  }, []);

  // Se a lista atualizada não tiver mais o horário revisado, volta ao formulário com aviso.
  useEffect(() => {
    if (reviewing && !saving && !slotsLoading && !selectedSlot) {
      setReviewing(false);
      setConflict("Esse horário acabou de ficar indisponível.");
    }
  }, [reviewing, saving, slotsLoading, selectedSlot]);

  function updateField(event) {
    const { name, value } = event.target;
    setConflict("");
    setForm((current) => ({ ...current, [name]: value,
      ...(name === "specialty" && { doctor: "", doctorId: "", time: "" }),
      ...(name === "doctorId" && { doctor: doctors.find((item) => item.id === value)?.full_name || "", time: "" }),
      ...(name === "date" && { time: "" }),
    }));
  }

  function chooseTime(time) {
    setConflict("");
    setForm((current) => ({ ...current, time }));
  }

  function review(event) {
    event.preventDefault();
    if (saving || loading || slotsLoading || loadError) return;
    if (!selectedSlot) { setError("Escolha um profissional, uma data e um horário disponível."); return; }
    setError("");
    setReviewing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirm() {
    if (saving || !selectedSlot) return;
    setSaving(true);
    setError("");
    try {
      const appointment = await saveAppointment({ ...form, scheduledAt: selectedSlot.scheduledAt }, reschedulingId);
      router.push(reschedulingId ? "/agendamentos" : `/confirmacao?id=${appointment.id}`);
    } catch (failure) {
      setReviewing(false);
      setConflict(failure.message || "Esse horário acabou de ficar indisponível.");
      setForm((current) => ({ ...current, time: "" }));
      setRefreshSlots((current) => current + 1);
    } finally { setSaving(false); }
  }

  const longDate = formatLongDate(form.date);
  const reviewDate = longDate ? `${longDate.dayMonth} de ${longDate.year}` : formatDate(form.date);

  if (reviewing && selectedSlot) {
    return (
      <PatientShell title={isRescheduling ? "Remarcar consulta" : "Agendar consulta"} activePath="/agendar">
        <div className="ph-page ph-booking ph-review-page">
          <header className="ph-heading">
            <div>
              <p className="ph-eyebrow">Última etapa</p>
              <h1>{isRescheduling ? "Confira a remarcação" : "Confira sua consulta"}</h1>
              <p>Revise os dados antes de confirmar.</p>
            </div>
          </header>
          <section className="ph-card ph-review">
            <div className="ph-review-highlight">
              <span className="ph-soft-icon" aria-hidden="true"><Icon name="calendar" size={24} /></span>
              <div>
                <small>Data e horário</small>
                <strong>{reviewDate}</strong>
                <span>{longDate ? `${longDate.weekday} · ` : ""}{form.time} · horário de Brasília</span>
              </div>
            </div>
            <div className="ph-review-details">
              <Detail icon="user" title={form.doctor} text={form.specialty} />
              <Detail icon="pin" title="Hospital Sapiens" text="Unidade principal" />
              {form.reason && <Detail icon="edit" title="Motivo da consulta" text={form.reason} />}
            </div>
            <p className="ph-timezone-note">
              <Icon name="clock" size={16} />
              A disponibilidade é conferida novamente ao confirmar.
            </p>
            <div className="ph-review-actions">
              <button type="button" className="ui-button ui-button-secondary" onClick={() => setReviewing(false)} disabled={saving}>
                Voltar e editar
              </button>
              <button type="button" className="ui-button ui-button-primary" onClick={confirm} disabled={saving}>
                {saving ? "Salvando..." : isRescheduling ? "Confirmar remarcação" : "Confirmar agendamento"}
                {!saving && <Icon name="arrow" size={18} />}
              </button>
            </div>
          </section>
        </div>
      </PatientShell>
    );
  }

  return (
    <PatientShell title={isRescheduling ? "Remarcar consulta" : "Agendar consulta"} activePath="/agendar">
      <div className="ph-page ph-booking">
        <header className="ph-heading">
          <div>
            <p className="ph-eyebrow">{isRescheduling ? "Remarcação" : "Novo agendamento"}</p>
            <h1>{isRescheduling ? "Remarcar consulta" : "Agendar consulta"}</h1>
            <p>
              {isRescheduling
                ? "Escolha a nova data e o novo horário da consulta."
                : "Escolha o atendimento e encontre o melhor horário para você."}
            </p>
          </div>
        </header>

        {loading && <p className="ph-status" role="status">Carregando profissionais...</p>}
        {error && <p className="ph-alert ph-alert-error" role="alert"><Icon name="warning" size={18} />{error}</p>}
        {!loading && !loadError && doctors.length === 0 && (
          <p className="ph-status" role="status">Nenhum profissional disponível para agendamento no momento. Entre em contato com a clínica.</p>
        )}

        <form className="ph-card ph-form-card" onSubmit={review}>
          <Step number={1}>
            <label className="ph-field">
              <span>Especialidade</span>
              <select
                id="specialty"
                name="specialty"
                value={form.specialty}
                onChange={updateField}
                disabled={isRescheduling || loading || saving}
              >
                <option value="">Selecione uma especialidade</option>
                {Object.keys(doctorsBySpecialty).map((specialty) => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </label>
          </Step>

          <Step number={2}>
            <label className="ph-field">
              <span>Profissional</span>
              <select
                id="doctor"
                name="doctorId"
                value={form.doctorId}
                onChange={updateField}
                disabled={!form.specialty || isRescheduling || loading || saving}
              >
                <option value="">{form.specialty ? "Selecione um profissional" : "Escolha primeiro a especialidade"}</option>
                {(doctorsBySpecialty[form.specialty] || []).map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
                ))}
              </select>
            </label>
          </Step>

          <Step number={3}>
            <label className="ph-field">
              <span>Data da consulta</span>
              <input
                id="date"
                name="date"
                type="date"
                disabled={!form.doctorId || loading || saving}
                min={minimumDate}
                value={form.date}
                onChange={updateField}
              />
            </label>
          </Step>

          <Step number={4}>
            <fieldset className="ph-time-field" disabled={!form.doctorId || !form.date || saving}>
              <legend>Horário disponível</legend>
              <small>Horários da clínica: Brasília (UTC−3)</small>
              {conflict && (
                <div className="ph-alert ph-alert-warning" role="alert">
                  <Icon name="warning" size={18} />
                  <p><strong>{conflict}</strong><span>{UNAVAILABLE_HINT}</span></p>
                </div>
              )}
              {slotError && <p className="ph-alert ph-alert-error" role="alert"><Icon name="warning" size={18} />{slotError}</p>}
              <div className="ph-time-options" aria-busy={slotsLoading}>
                {slotsLoading ? (
                  <p role="status">Consultando horários...</p>
                ) : slots.length ? (
                  slots.map((slot) => (
                    <button
                      type="button"
                      key={slot.scheduledAt}
                      className={form.time === slot.time ? "selected" : undefined}
                      aria-pressed={form.time === slot.time}
                      onClick={() => chooseTime(slot.time)}
                    >
                      {slot.time}
                    </button>
                  ))
                ) : (
                  <p role="status">
                    {form.doctorId && form.date
                      ? "Nenhum horário disponível nesta data. Escolha outra data."
                      : "Escolha o profissional e a data para ver os horários livres."}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="ui-button ui-button-quiet ph-refresh"
                disabled={!form.doctorId || !form.date || loading || saving || slotsLoading}
                onClick={() => { setConflict(""); setRefreshSlots((current) => current + 1); }}
              >
                Atualizar horários <Icon name="refresh" size={16} />
              </button>
            </fieldset>
          </Step>

          <Step number={5}>
            <label className="ph-field">
              <span>Motivo da consulta</span>
              <textarea
                id="reason"
                name="reason"
                rows="4"
                maxLength={2000}
                value={form.reason}
                onChange={updateField}
                disabled={isRescheduling || loading || saving}
                placeholder="Conte brevemente como podemos ajudar"
              />
              <small>Opcional</small>
            </label>
          </Step>

          <button
            type="submit"
            className="ui-button ui-button-primary ph-submit"
            disabled={saving || loading || loadError || slotsLoading || !selectedSlot}
          >
            {isRescheduling ? "Conferir remarcação" : "Conferir agendamento"}
          </button>
        </form>
      </div>
    </PatientShell>
  );
}
