"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Perfil() {
  const [message, setMessage] = useState("");

  const [profile, setProfile] = useState({
    name: "João Silva",
    email: "joao@email.com",
    phone: "(11) 99999-9999",
    birthDate: "1995-05-20",
    cpf: "123.456.789-00",
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem("profile");

    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  }

  function saveProfile(event) {
    event.preventDefault();

    localStorage.setItem("profile", JSON.stringify(profile));
    setMessage("Perfil atualizado com sucesso!");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }
const initials =
  profile.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "US";
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>+</span>
          <strong>AgendaSaúde</strong>
        </div>

        <nav className="sidebar-menu">
          <Link href="/">🏠 Início</Link>
          <Link href="/agendar">🗓️ Agendar consulta</Link>
          <Link href="/agendamentos">📋 Meus agendamentos</Link>

          <Link href="/perfil" className="active">
            👤 Perfil
          </Link>
        </nav>

        <div className="sidebar-user">
          <strong>Olá, Usuário!</strong>
          <span>Paciente</span>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="topbar">
          <div className="topbar-title">Perfil</div>

          <div className="topbar-user">
            <span className="notification">🔔</span>
            <div className="user-avatar">{initials}</div>
<strong>{profile.name}
</strong>
          </div>
        </header>

        <div className="profile-content">
          <div className="profile-heading">
            <h1>Meu perfil</h1>
            <p>Consulte e atualize suas informações pessoais.</p>
          </div>

          <div className="profile-layout">
            <aside className="profile-summary">
              <div className="profile-avatar-large">{initials}
              </div>
              <h2>{profile.name}</h2>
              <p>Paciente</p>
              <div className="profile-summary-line">
                <span>✉️</span>
                <small>{profile.email}</small>
              </div>

              <div className="profile-summary-line">
                <span>📱</span>
                <small>{profile.phone}</small>
              </div>
            </aside>

            <section className="profile-card">
              <h2>Informações pessoais</h2>

              <form className="profile-form" onSubmit={saveProfile}>
                <div className="profile-field profile-field-full">
                  <label htmlFor="name">Nome completo</label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={profile.name}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="email">E-mail</label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="phone">Telefone</label>

                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    value={profile.phone}
                    onChange={updateField}
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="birthDate">Data de nascimento</label>

                  <input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={profile.birthDate}
                    onChange={updateField}
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="cpf">CPF</label>

                  <input
                    id="cpf"
                    name="cpf"
                    type="text"
                    value={profile.cpf}
                    onChange={updateField}
                  />
                </div>

                {message && (
                  <p className="profile-message">{message}</p>
                )}

                <button type="submit" className="profile-button">
                  Salvar alterações
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
