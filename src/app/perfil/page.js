"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import UserMenu, {
  SidebarUser,
} from "../../components/UserMenu";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

function formatPhone(value) {
  const numbers = value
    .replace(/\D/g, "")
    .slice(0, 11);

  if (numbers.length <= 2) {
    return numbers
      ? `(${numbers}`
      : "";
  }

  if (numbers.length <= 6) {
    return `(${numbers.slice(
      0,
      2
    )}) ${numbers.slice(2)}`;
  }

  if (numbers.length <= 10) {
    return `(${numbers.slice(
      0,
      2
    )}) ${numbers.slice(
      2,
      6
    )}-${numbers.slice(6)}`;
  }

  return `(${numbers.slice(
    0,
    2
  )}) ${numbers.slice(
    2,
    7
  )}-${numbers.slice(7)}`;
}

function formatCpf(value) {
  const numbers = value
    .replace(/\D/g, "")
    .slice(0, 11);

  return numbers
    .replace(
      /^(\d{3})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1-$2"
    );
}

export default function Perfil() {
  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  const [profile, setProfile] =
    useState({
      name: "",
      email: "",
      phone: "",
      birthDate: "",
      cpf: "",
    });

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(async ({ data }) => {
        if (!data.user) return;
        const { data: saved, error } = await supabase.from("profiles")
          .select("full_name, phone, birth_date, cpf")
          .eq("id", data.user.id)
          .maybeSingle();
        if (!error && saved) {
          setProfile({
            name: saved.full_name || "",
            email: data.user.email || "",
            phone: saved.phone ? formatPhone(saved.phone) : "",
            birthDate: saved.birth_date || "",
            cpf: saved.cpf ? formatCpf(saved.cpf) : "",
          });
        }
      });
      return;
    }
    const savedProfile =
      localStorage.getItem("profile");

    if (savedProfile) {
      setProfile(
        JSON.parse(savedProfile)
      );
    }
  }, []);

  const today = new Date();

  const maximumBirthDate = [
    today.getFullYear(),
    String(
      today.getMonth() + 1
    ).padStart(2, "0"),
    String(today.getDate()).padStart(
      2,
      "0"
    ),
  ].join("-");

  function updateField(event) {
    const { name, value } = event.target;

    let formattedValue = value;

    if (name === "phone") {
      formattedValue =
        formatPhone(value);
    }

    if (name === "cpf") {
      formattedValue =
        formatCpf(value);
    }

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: formattedValue,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const phoneNumbers =
      profile.phone.replace(/\D/g, "");

    const cpfNumbers =
      profile.cpf.replace(/\D/g, "");

    if (
      phoneNumbers.length < 10 ||
      phoneNumbers.length > 11
    ) {
      setMessage(
        "Digite um telefone válido."
      );
      setMessageType("error");
      return;
    }

    if (cpfNumbers.length !== 11) {
      setMessage(
        "Digite um CPF com 11 números."
      );
      setMessageType("error");
      return;
    }

    const updatedProfile = {
      ...profile,
      name: profile.name.trim(),
      email: profile.email
        .trim()
        .toLowerCase(),
    };

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setMessage("Entre novamente para atualizar seu perfil.");
        setMessageType("error");
        return;
      }
      const { error } = await supabase.from("profiles").update({
        full_name: updatedProfile.name,
        phone: phoneNumbers,
        birth_date: updatedProfile.birthDate,
        cpf: cpfNumbers,
      }).eq("id", authData.user.id);
      if (error) {
        setMessage(error.code === "23505" ? "Este CPF já está cadastrado em outra conta." : "Não foi possível salvar. Confira os dados e tente novamente.");
        setMessageType("error");
        return;
      }
      const profileForDisplay = { ...updatedProfile, email: authData.user.email || "" };
      setProfile(profileForDisplay);
      localStorage.setItem("profile", JSON.stringify({
        name: profileForDisplay.name,
        email: profileForDisplay.email,
        phone: profileForDisplay.phone,
      }));
      window.dispatchEvent(new Event("profileUpdated"));
      setMessage("Perfil atualizado com sucesso!");
      setMessageType("success");
      return;
    }

    setProfile(updatedProfile);

    localStorage.setItem(
      "profile",
      JSON.stringify(updatedProfile)
    );

    const registeredUser = JSON.parse(
      localStorage.getItem(
        "registeredUser"
      ) || "null"
    );

    if (registeredUser) {
      const updatedRegisteredUser = {
        ...registeredUser,
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        birthDate:
          updatedProfile.birthDate,
        cpf: updatedProfile.cpf,
      };

      localStorage.setItem(
        "registeredUser",
        JSON.stringify(
          updatedRegisteredUser
        )
      );
    }

    localStorage.setItem(
      "loggedUser",
      JSON.stringify({
        name: updatedProfile.name,
        email: updatedProfile.email,
      })
    );

    window.dispatchEvent(
      new Event("profileUpdated")
    );

    setMessage(
      "Perfil atualizado com sucesso!"
    );

    setMessageType("success");

    setTimeout(() => {
      setMessage("");
      setMessageType("");
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
          <Link href="/dashboard">
            🏠 Início
          </Link>

          <Link href="/agendar">
            🗓️ Agendar consulta
          </Link>

          <Link href="/agendamentos">
            📋 Meus agendamentos
          </Link>

          <Link
            href="/perfil"
            className="active"
          >
            👤 Perfil
          </Link>
        </nav>

        <SidebarUser />
      </aside>

      <main className="dashboard-content">
        <header className="topbar">
          <div className="topbar-title">
            Perfil
          </div>

          <UserMenu />
        </header>

        <div className="profile-content">
          <div className="profile-heading">
            <h1>Meu perfil</h1>

            <p>
              Consulte e atualize suas informações
              pessoais.
            </p>
          </div>

          <div className="profile-layout">
            <aside className="profile-summary">
              <div className="profile-avatar-large">
                {initials}
              </div>

              <h2>{profile.name}</h2>
              <p>Paciente</p>

              <div className="profile-summary-line">
                <span>✉️</span>
                <small>
                  {profile.email}
                </small>
              </div>

              <div className="profile-summary-line">
                <span>📱</span>
                <small>
                  {profile.phone}
                </small>
              </div>
            </aside>

            <section className="profile-card">
              <h2>
                Informações pessoais
              </h2>

              <form
                className="profile-form"
                onSubmit={saveProfile}
              >
                <div className="profile-field profile-field-full">
                  <label htmlFor="name">
                    Nome completo
                  </label>

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
                  <label htmlFor="email">
                    E-mail
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={updateField}
                    readOnly={isSupabaseConfigured()}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="phone">
                    Telefone
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={updateField}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="birthDate">
                    Data de nascimento
                  </label>

                  <input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    max={maximumBirthDate}
                    value={
                      profile.birthDate
                    }
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="cpf">
                    CPF
                  </label>

                  <input
                    id="cpf"
                    name="cpf"
                    type="text"
                    inputMode="numeric"
                    maxLength="14"
                    value={profile.cpf}
                    onChange={updateField}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                {message && (
                  <p
                    className={`profile-message ${messageType}`}
                  >
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  className="profile-button"
                >
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

