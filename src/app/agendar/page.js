"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAppointment, getBookingDoctors, getBookingSlots, saveAppointment } from "../../lib/appointments";
import { clinicDateTime } from "../../lib/appointment-format";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import UserMenu, {
  SidebarUser,
} from "../../components/UserMenu";

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
  const [refreshSlots, setRefreshSlots] = useState(0);
  const isRescheduling = Boolean(reschedulingId);
  const minimumDate = isSupabaseConfigured() ? clinicDateTime(new Date()).date
    : new Date().toLocaleDateString("en-CA");
  const doctorsBySpecialty = Object.groupBy(doctors, (doctor) => doctor.specialty);

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
      .then((items) => { if (active) setSlots(items); })
      .catch((failure) => { if (active) setSlotError(failure.message); })
      .finally(() => { if (active) setSlotsLoading(false); });
    return () => { active = false; };
  }, [form.doctorId, form.date, reschedulingId, refreshSlots]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value,
      ...(name === "specialty" && { doctor: "", doctorId: "", time: "" }),
      ...(name === "doctorId" && { doctor: doctors.find((item) => item.id === value)?.full_name || "", time: "" }),
      ...(name === "date" && { time: "" }),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving || loading || slotsLoading || loadError) return;
    const slot = slots.find((item) => item.time === form.time);
    if (!slot) { setError("Escolha um profissional, uma data e um horário disponível."); return; }
    setSaving(true);
    setError("");
    try {
      const appointment = await saveAppointment({ ...form, scheduledAt: slot.scheduledAt }, reschedulingId);
      router.push(reschedulingId ? "/agendamentos" : `/confirmacao?id=${appointment.id}`);
    } catch (failure) {
      setError(failure.message);
      setForm((current) => ({ ...current, time: "" }));
      setRefreshSlots((current) => current + 1);
    } finally { setSaving(false); }
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>+</span>
          <strong>AgendaSaúde</strong>
        </div>

        <nav className="sidebar-menu">
          <Link href="/dashboard">
          🏠 Início
          </Link>

          <Link
            href="/agendar"
            className="active"
          >
            🗓️ Agendar consulta
          </Link>

          <Link href="/agendamentos">
            📋 Meus agendamentos
          </Link>

          <Link href="/perfil">
            👤 Perfil
          </Link>
        </nav>

        <SidebarUser />
      </aside>

      <main className="dashboard-content">
        <header className="topbar">
          <div className="topbar-title">
            {isRescheduling
              ? "Remarcar consulta"
              : "Agendar consulta"}
          </div>

          <UserMenu />
        </header>

        <div className="booking-content">
          <div className="booking-heading">
            <h1>
              {isRescheduling
                ? "Remarcar consulta"
                : "Agendar consulta"}
            </h1>

            <p>
              {isRescheduling
                ? "Altere a data e o horário da consulta."
                : "Escolha a especialidade, o médico, a data e o horário."}
            </p>
          </div>

          {loading && <p role="status">Carregando profissionais...</p>}
          {error && <p role="alert">{error}</p>}
          {!loading && !error && doctors.length === 0 && <p role="status">Nenhum profissional disponível para agendamento no momento. Entre em contato com a clínica.</p>}
          {isSupabaseConfigured() && <p>Horários da clínica: Brasília (UTC−3).</p>}
          <div className="booking-layout">
            <section className="booking-card">
              <h2>Dados da consulta</h2>

              <form
                className="booking-form"
                onSubmit={handleSubmit}
              >
                <div className="booking-field">
                  <label htmlFor="specialty">
                    Especialidade
                  </label>

                  <select
                    id="specialty"
                    name="specialty"
                    value={form.specialty}
                    onChange={updateField}
                    disabled={isRescheduling || loading || saving}
                  >
                    <option value="">
                      Selecione uma especialidade
                    </option>

                    {Object.keys(
                      doctorsBySpecialty
                    ).map((specialty) => (
                      <option
                        key={specialty}
                        value={specialty}
                      >
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="booking-field">
                  <label htmlFor="doctor">
                    Profissional
                  </label>

                  <select
                    id="doctor"
                    name="doctorId"
                    value={form.doctorId}
                    onChange={updateField}
                    disabled={
                      !form.specialty ||
                      isRescheduling || loading || saving
                    }
                  >
                    <option value="">
                      {form.specialty
                        ? "Selecione um profissional"
                        : "Escolha primeiro a especialidade"}
                    </option>

                    {(
                      doctorsBySpecialty[
                        form.specialty
                      ] || []
                    ).map((doctor) => (
                      <option
                        key={doctor.id}
                        value={doctor.id}
                      >
                        {doctor.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="booking-field">
                  <label htmlFor="date">
                    Data da consulta
                  </label>

                  <input
                    id="date"
                    name="date"
                    type="date"
                    min={minimumDate}
                    value={form.date}
                    onChange={updateField}
                  />
                </div>

                <div className="booking-field">
                  <label htmlFor="time">
                    Horário
                  </label>

                  <select
                    id="time"
                    name="time"
                    value={form.time}
                    onChange={updateField}
                    disabled={!form.date || !form.doctorId || slotsLoading || saving}
                  >
                    <option value="">
                      {form.date
                        ? "Selecione um horário"
                        : "Escolha primeiro a data"}
                    </option>

                    {slots.map((slot) => (
                      <option key={slot.scheduledAt} value={slot.time}>{slot.time}</option>
                    ))}
                  </select>
                </div>

                {slotsLoading && <p role="status">Consultando horários...</p>}
                {slotError && <p role="alert">{slotError}</p>}
                {!slotsLoading && form.doctorId && form.date && slots.length === 0 && !slotError && <p role="status">Nenhum horário disponível nesta data. Escolha outra data.</p>}
                <div className="booking-field booking-field-full">
                  <label htmlFor="reason">
                    Motivo da consulta
                  </label>

                  <textarea
                    id="reason"
                    name="reason"
                    rows="4"
                    maxLength={2000}
                    value={form.reason}
                    onChange={updateField}
                    disabled={isRescheduling || loading || saving}
                    placeholder="Descreva brevemente o motivo da consulta"
                  />
                </div>

                <button
                  type="submit"
                  className="booking-button"
                  disabled={saving || loading || loadError || slotsLoading || !slots.some((slot) => slot.time === form.time)}
                >
                  {saving ? "Salvando..." : isRescheduling
                    ? "Confirmar remarcação"
                    : "Confirmar agendamento"}
                </button>
              </form>
            </section>

            <aside className="booking-summary">
              <div className="booking-summary-icon">
                🩺
              </div>

              <h2>
                {isRescheduling
                  ? "Remarcar consulta"
                  : "Nova consulta"}
              </h2>

              <p>
                {isRescheduling
                  ? "Atualize a data e o horário da consulta."
                  : "Preencha os dados ao lado para marcar sua consulta."}
              </p>

              <ul>
                <li>
                  ✓ Escolha uma especialidade
                </li>

                <li>
                  ✓ Selecione o profissional
                </li>

                <li>
                  ✓ Defina a data e o horário
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}