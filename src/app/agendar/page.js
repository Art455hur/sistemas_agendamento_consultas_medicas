"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserMenu, {
  SidebarUser,
} from "../../components/UserMenu";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";
import { listPatientAppointments, scheduledAtFromLocal } from "../../lib/appointments";

const doctorsBySpecialty = {
  Cardiologia: ["Dra. Mariana Silva"],
  Ortopedia: ["Dr. Lucas Ferreira"],
  Dermatologia: ["Dra. Camila Rodrigues"],
  Pediatria: ["Dra. Juliana Costa"],
  Ginecologia: ["Dra. Fernanda Lima"],
  "Clínica Geral": ["Dr. Rafael Almeida"],
  Neurologia: ["Dr. Paulo Mendes"],
  Oftalmologia: ["Dra. Beatriz Alves"],
};

const availableTimes = [
  "08:00",
  "09:00",
  "10:30",
  "14:00",
  "15:30",
];

export default function AgendarConsulta() {
  const router = useRouter();

  const [form, setForm] = useState({
    specialty: "",
    doctor: "",
    date: "",
    time: "",
    reason: "",
  });

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingReady, setBookingReady] = useState(false);
  const [reschedulingId, setReschedulingId] =
    useState(null);

  useEffect(() => {
    let active = true;
    async function loadBookingData() {
      if (!isSupabaseConfigured()) {
        const savedAppointments = JSON.parse(localStorage.getItem("appointments") || "[]");
        if (active) {
          setAppointments(savedAppointments);
          setBookingReady(true);
        }
        return;
      }

      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/login?redirect=/agendar");
        return;
      }
      const [{ data: doctorRows, error: doctorError }, patientAppointments] = await Promise.all([
        supabase.rpc("booking_doctors"),
        listPatientAppointments(supabase),
      ]);
      if (doctorError) {
        alert("Não foi possível carregar os profissionais. Tente novamente.");
        return;
      }
      if (active) {
        setDoctors(doctorRows || []);
        setAppointments(patientAppointments);
        setBookingReady(true);
      }
    }
    loadBookingData().catch(() => alert("Não foi possível carregar os dados do agendamento."));

    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (!bookingReady) return;
    const savedAppointments = JSON.parse(localStorage.getItem("appointments") || "[]");
    const parameters = new URLSearchParams(
      window.location.search
    );

    const appointmentId =
      parameters.get("remarcar");

    const selectedSpecialty =
      parameters.get("especialidade");

    const selectedDoctor =
      parameters.get("profissional");

    if (!appointmentId) {
      if (
        selectedSpecialty &&
        (isSupabaseConfigured()
          ? doctors.some((doctor) => doctor.specialty === selectedSpecialty)
          : Boolean(doctorsBySpecialty[selectedSpecialty]))
      ) {
        const matchingDoctor = doctors.find((doctor) => doctor.full_name === selectedDoctor);
        const validDoctor = matchingDoctor || (!isSupabaseConfigured() && (doctorsBySpecialty[selectedSpecialty] || []).includes(selectedDoctor));

        setForm((currentForm) => ({
          ...currentForm,
          specialty: selectedSpecialty,
          doctor: matchingDoctor ? matchingDoctor.id : validDoctor ? selectedDoctor : "",
        }));
      }

      return;
    }

    const currentAppointments = isSupabaseConfigured() ? appointments : savedAppointments;
    const appointmentToReschedule =
      currentAppointments.find(
        (appointment) =>
          String(appointment.id) ===
          String(appointmentId)
      );

    if (!appointmentToReschedule) {
      alert(
        "A consulta selecionada não foi encontrada."
      );

      router.push("/agendamentos");
      return;
    }

    if (
      appointmentToReschedule.status === "Cancelada" ||
      appointmentToReschedule.status === "Concluída"
    ) {
      alert(
        "Somente consultas agendadas podem ser remarcadas."
      );

      router.push("/agendamentos");
      return;
    }

    setReschedulingId(appointmentId);

    setForm({
      specialty:
        appointmentToReschedule.specialty || "",
      doctor:
        appointmentToReschedule.doctorId || appointmentToReschedule.doctor || "",
      date:
        appointmentToReschedule.date || "",
      time:
        appointmentToReschedule.time || "",
      reason:
        appointmentToReschedule.reason || "",
    });
  }, [bookingReady, doctors, appointments, router]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !form.doctor || !form.date) {
      setAvailableSlots([]);
      return;
    }
    let active = true;
    setLoadingSlots(true);
    const supabase = createClient();
    supabase.rpc("booking_slots", {
      p_doctor_id: form.doctor,
      p_date: form.date,
      p_appointment_id: reschedulingId || null,
    }).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAvailableSlots([]);
        alert("Não foi possível carregar os horários disponíveis.");
      } else {
        const slots = (data || []).map((row) => {
          const date = new Date(row.scheduled_at);
          const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
          }).format(date);
          return { time: parts, scheduledAt: row.scheduled_at };
        });
        setAvailableSlots(slots);
        if (form.time && !slots.some((slot) => slot.time === form.time)) {
          setForm((current) => ({ ...current, time: "" }));
        }
      }
      setLoadingSlots(false);
    });
    return () => { active = false; };
  }, [form.doctor, form.date, reschedulingId]);

  const today = new Date();

  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const unavailableTimes = appointments
    .filter(
      (appointment) =>
        appointment.date === form.date &&
        (appointment.status === "Agendada" ||
          !appointment.status) &&
        String(appointment.id) !==
          String(reschedulingId)
    )
    .map((appointment) => appointment.time);

  const isRescheduling = Boolean(reschedulingId);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,

      ...(name === "specialty" && {
        doctor: "",
      }),

      ...(name === "date" && {
        time: "",
      }),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.specialty ||
      !form.doctor ||
      !form.date ||
      !form.time
    ) {
      alert(
        "Preencha a especialidade, o profissional, a data e o horário."
      );

      return;
    }

    const appointmentDate = new Date(
      `${form.date}T${form.time}`
    );

    if (appointmentDate <= new Date()) {
      alert(
        "Escolha uma data e um horário futuros."
      );

      return;
    }

    const savedAppointments = JSON.parse(
      localStorage.getItem("appointments") || "[]"
    );

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const doctorId = doctors.find((doctor) => doctor.id === form.doctor)?.id || form.doctor;
      const scheduledAt = availableSlots.find((slot) => slot.time === form.time)?.scheduledAt || scheduledAtFromLocal(form.date, form.time);
      const rpc = reschedulingId ? "reschedule_patient_appointment" : "create_patient_appointment";
      const args = reschedulingId
        ? { p_appointment_id: reschedulingId, p_scheduled_at: scheduledAt }
        : { p_doctor_id: doctorId, p_scheduled_at: scheduledAt, p_reason: form.reason.trim() || null };
      const { data, error } = await supabase.rpc(rpc, args);
      if (error || !data?.length) {
        alert("Não foi possível salvar. O horário pode ter sido ocupado; atualize a página e escolha outro.");
        return;
      }
      if (reschedulingId) {
        router.push("/agendamentos");
      } else {
        router.push(`/confirmacao?id=${data[0].id}`);
      }
      return;
    }

    const duplicatedAppointment =
      savedAppointments.some(
        (appointment) =>
          appointment.date === form.date &&
          appointment.time === form.time &&
          (appointment.status === "Agendada" ||
            !appointment.status) &&
          String(appointment.id) !==
            String(reschedulingId)
      );

    if (duplicatedAppointment) {
      alert(
        "Você já possui uma consulta agendada nessa data e horário."
      );

      return;
    }

    if (reschedulingId) {
      const updatedAppointments =
        savedAppointments.map((appointment) => {
          if (
            String(appointment.id) ===
            String(reschedulingId)
          ) {
            return {
              ...appointment,
              ...form,
              status: "Agendada",
            };
          }

          return appointment;
        });

      localStorage.setItem(
        "appointments",
        JSON.stringify(updatedAppointments)
      );

      alert("Consulta remarcada com sucesso!");
      router.push("/agendamentos");
      return;
    }

    const newAppointment = {
      id: Date.now(),
      ...form,
      status: "Agendada",
    };

    localStorage.setItem(
      "appointments",
      JSON.stringify([
        ...savedAppointments,
        newAppointment,
      ])
    );

    router.push(
      `/confirmacao?id=${newAppointment.id}`
    );
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
                    disabled={isRescheduling}
                  >
                    <option value="">
                      Selecione uma especialidade
                    </option>

                    {(isSupabaseConfigured()
                      ? [...new Set(doctors.map((doctor) => doctor.specialty))]
                      : Object.keys(doctorsBySpecialty)
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
                    name="doctor"
                    value={form.doctor}
                    onChange={updateField}
                    disabled={
                      !form.specialty ||
                      isRescheduling
                    }
                  >
                    <option value="">
                      {form.specialty
                        ? "Selecione um profissional"
                        : "Escolha primeiro a especialidade"}
                    </option>

                    {(isSupabaseConfigured()
                      ? doctors.filter((doctor) => doctor.specialty === form.specialty).map((doctor) => ({ id: doctor.id, name: doctor.full_name }))
                      : (doctorsBySpecialty[form.specialty] || []).map((name) => ({ id: name, name }))
                    ).map((doctor) => (
                      <option
                        key={doctor.id}
                        value={doctor.id}
                      >
                        {doctor.name}
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
                    disabled={!form.date}
                  >
                    <option value="">
                      {form.date
                        ? "Selecione um horário"
                        : "Escolha primeiro a data"}
                    </option>

                    {(isSupabaseConfigured()
                      ? availableSlots.map((slot) => slot.time)
                      : availableTimes
                    ).map((time) => {
                      const unavailable =
                        !isSupabaseConfigured() && unavailableTimes.includes(
                          time
                        );

                      return (
                        <option
                          key={time}
                          value={time}
                          disabled={unavailable}
                        >
                          {time}
                          {unavailable
                            ? " — Indisponível"
                            : ""}
                        </option>
                      );
                    })}
                    {loadingSlots && <option disabled>Carregando horários...</option>}
                  </select>
                </div>

                <div className="booking-field booking-field-full">
                  <label htmlFor="reason">
                    Motivo da consulta
                  </label>

                  <textarea
                    id="reason"
                    name="reason"
                    rows="4"
                    value={form.reason}
                    onChange={updateField}
                    disabled={isRescheduling}
                    placeholder="Descreva brevemente o motivo da consulta"
                  />
                </div>

                <button
                  type="submit"
                  className="booking-button"
                >
                  {isRescheduling
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

