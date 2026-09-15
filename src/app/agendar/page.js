"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserMenu, {
  SidebarUser,
} from "../../components/UserMenu";

const doctorsBySpecialty = {
  Cardiologia: ["Dra. Mariana Silva"],
  Ortopedia: ["Dr. Lucas Ferreira"],
  Dermatologia: ["Dra. Camila Rodrigues"],
  Pediatria: ["Dra. Juliana Costa"],
  Ginecologia: ["Dra. Fernanda Lima"],
  "ClÃ­nica Geral": ["Dr. Rafael Almeida"],
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
  const [reschedulingId, setReschedulingId] =
    useState(null);

  useEffect(() => {
    const savedAppointments = JSON.parse(
      localStorage.getItem("appointments") || "[]"
    );

    setAppointments(savedAppointments);

    const parameters = new URLSearchParams(
      window.location.search
    );

    const appointmentId =
      parameters.get("remarcar");

    if (!appointmentId) {
      return;
    }

    const appointmentToReschedule =
      savedAppointments.find(
        (appointment) =>
          String(appointment.id) ===
          String(appointmentId)
      );

    if (!appointmentToReschedule) {
      alert("A consulta selecionada nÃ£o foi encontrada.");
      router.push("/agendamentos");
      return;
    }

    if (
      appointmentToReschedule.status === "Cancelada" ||
      appointmentToReschedule.status === "ConcluÃ­da"
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
        appointmentToReschedule.doctor || "",
      date:
        appointmentToReschedule.date || "",
      time:
        appointmentToReschedule.time || "",
      reason:
        appointmentToReschedule.reason || "",
    });
  }, [router]);

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

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.specialty ||
      !form.doctor ||
      !form.date ||
      !form.time
    ) {
      alert(
        "Preencha a especialidade, o profissional, a data e o horÃ¡rio."
      );
      return;
    }

    const appointmentDate = new Date(
      `${form.date}T${form.time}`
    );

    if (appointmentDate <= new Date()) {
      alert("Escolha uma data e um horÃ¡rio futuros.");
      return;
    }

    const savedAppointments = JSON.parse(
      localStorage.getItem("appointments") || "[]"
    );

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
        "VocÃª jÃ¡ possui uma consulta agendada nessa data e horÃ¡rio."
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

    alert("Consulta agendada com sucesso!");
    router.push("/agendamentos");
  }

  const isRescheduling = Boolean(reschedulingId);

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>+</span>
          <strong>AgendaSaÃºde</strong>
        </div>

        <nav className="sidebar-menu">
          <Link href="/">ðŸ  InÃ­cio</Link>

          <Link href="/agendar" className="active">
            ðŸ—“ï¸ Agendar consulta
          </Link>

          <Link href="/agendamentos">
            ðŸ“‹ Meus agendamentos
          </Link>

          <Link href="/perfil">ðŸ‘¤ Perfil</Link>
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
                ? "Altere os dados da consulta e confirme a remarcaÃ§Ã£o."
                : "Escolha a especialidade, o mÃ©dico, a data e o horÃ¡rio."}
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

                    <option value="Cardiologia">
                      Cardiologia
                    </option>

                    <option value="Ortopedia">
                      Ortopedia
                    </option>

                    <option value="Dermatologia">
                      Dermatologia
                    </option>

                    <option value="Pediatria">
                      Pediatria
                    </option>

                    <option value="Ginecologia">
                      Ginecologia
                    </option>

                    <option value="ClÃ­nica Geral">
                      ClÃ­nica Geral
                    </option>

                    <option value="Neurologia">
                      Neurologia
                    </option>

                    <option value="Oftalmologia">
                      Oftalmologia
                    </option>
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
                      !form.specialty || isRescheduling
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
                        key={doctor}
                        value={doctor}
                      >
                        {doctor}
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
                    HorÃ¡rio
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
                        ? "Selecione um horÃ¡rio"
                        : "Escolha primeiro a data"}
                    </option>

                    {availableTimes.map((time) => {
                      const unavailable =
                        unavailableTimes.includes(time);

                      return (
                        <option
                          key={time}
                          value={time}
                          disabled={unavailable}
                        >
                          {time}
                          {unavailable
                            ? " â€” IndisponÃ­vel"
                            : ""}
                        </option>
                      );
                    })}
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
                    ? "Confirmar remarcaÃ§Ã£o"
                    : "Confirmar agendamento"}
                </button>
              </form>
            </section>

            <aside className="booking-summary">
              <div className="booking-summary-icon">
                ðŸ©º
              </div>

              <h2>
                {isRescheduling
                  ? "Remarcar consulta"
                  : "Nova consulta"}
              </h2>

              <p>
                {isRescheduling
                  ? "Atualize a data, o horÃ¡rio ou os demais dados da consulta."
                  : "Preencha os dados ao lado para marcar sua consulta."}
              </p>

              <ul>
                <li>âœ“ Escolha uma especialidade</li>
                <li>âœ“ Selecione o profissional</li>
                <li>âœ“ Defina a data e o horÃ¡rio</li>
              </ul>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}