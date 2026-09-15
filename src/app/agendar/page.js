"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import UserMenu, {
  SidebarUser,
} from "../../components/UserMenu";

export default function AgendarConsulta() {
  const router = useRouter();

  const [form, setForm] = useState({
    specialty: "",
    doctor: "",
    date: "",
    time: "",
    reason: "",
  });

  function updateField(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.specialty || !form.doctor || !form.date || !form.time) {
      alert("Preencha a especialidade, o profissional, a data e o horário.");
      return;
    }

    const savedAppointments = JSON.parse(
      localStorage.getItem("appointments") || "[]"
    );

    const newAppointment = {
      id: Date.now(),
      ...form,
      status: "Agendada",
    };

    localStorage.setItem(
      "appointments",
      JSON.stringify([...savedAppointments, newAppointment])
    );

    alert("Consulta agendada com sucesso!");
    router.push("/agendamentos");
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>+</span>
          <strong>AgendaSaúde</strong>
        </div>

        <nav className="sidebar-menu">
          <Link href="/">🏠 Início</Link>

          <Link href="/agendar" className="active">
            🗓️ Agendar consulta
          </Link>

          <Link href="/agendamentos">
            📋 Meus agendamentos
          </Link>

          <Link href="/perfil">👤 Perfil</Link>
        </nav>

        <SidebarUser />
      </aside>

      <main className="dashboard-content">
        <header className="topbar">
          <div className="topbar-title">Agendar consulta</div>

          <UserMenu />
        </header>

        <div className="booking-content">
          <div className="booking-heading">
            <h1>Agendar consulta</h1>
            <p>Escolha a especialidade, o médico, a data e o horário.</p>
          </div>

          <div className="booking-layout">
            <section className="booking-card">
              <h2>Dados da consulta</h2>

              <form className="booking-form" onSubmit={handleSubmit}>
                <div className="booking-field">
                  <label htmlFor="specialty">Especialidade</label>

                  <select
                    id="specialty"
                    name="specialty"
                    value={form.specialty}
                    onChange={updateField}
                  >
                    <option value="">Selecione uma especialidade</option>
                    <option value="Clínica Geral">Clínica Geral</option>
                    <option value="Cardiologia">Cardiologia</option>
                    <option value="Dermatologia">Dermatologia</option>
                    <option value="Ortopedia">Ortopedia</option>
                  </select>
                </div>

                <div className="booking-field">
                  <label htmlFor="doctor">Profissional</label>

                  <select
                    id="doctor"
                    name="doctor"
                    value={form.doctor}
                    onChange={updateField}
                  >
                    <option value="">Selecione um profissional</option>
                    <option value="Dr. João Silva">Dr. João Silva</option>
                    <option value="Dra. Ana Souza">Dra. Ana Souza</option>
                    <option value="Dr. Carlos Oliveira">
                      Dr. Carlos Oliveira
                    </option>
                  </select>
                </div>

                <div className="booking-field">
                  <label htmlFor="date">Data da consulta</label>

                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={updateField}
                  />
                </div>

                <div className="booking-field">
                  <label htmlFor="time">Horário</label>

                  <select
                    id="time"
                    name="time"
                    value={form.time}
                    onChange={updateField}
                  >
                    <option value="">Selecione um horário</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:30">10:30</option>
                    <option value="14:00">14:00</option>
                    <option value="15:30">15:30</option>
                  </select>
                </div>

                <div className="booking-field booking-field-full">
                  <label htmlFor="reason">Motivo da consulta</label>

                  <textarea
                    id="reason"
                    name="reason"
                    rows="4"
                    value={form.reason}
                    onChange={updateField}
                    placeholder="Descreva brevemente o motivo da consulta"
                  />
                </div>

                <button type="submit" className="booking-button">
                  Confirmar agendamento
                </button>
              </form>
            </section>

            <aside className="booking-summary">
              <div className="booking-summary-icon">🩺</div>
              <h2>Nova consulta</h2>

              <p>Preencha os dados ao lado para marcar sua consulta.</p>

              <ul>
                <li>✓ Escolha uma especialidade</li>
                <li>✓ Selecione o profissional</li>
                <li>✓ Defina a data e o horário</li>
              </ul>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}