"use client";

import { formatPhone, formatCpf } from "@/shared/formatting/patient-fields.js";

import {
  useEffect,
  useState,
} from "react";
import PatientShell from "@/components/layout/PatientShell.js";
import Icon from "@/components/ui/Icon.js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadPatientProfile, savePatientProfile } from "@/features/profile/services/patient-profile.js";
import { isValidCpf } from "@/shared/validation/cpf.js";
import { patientNameError } from "@/shared/validation/patient-name.js";

export default function Perfil() {
  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [profile, setProfile] =
    useState({
      name: "", email: "", phone: "", birthDate: "", cpf: "",
    });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const saved = isSupabaseConfigured()
          ? await loadPatientProfile(createClient())
          : JSON.parse(localStorage.getItem("profile") || "null");
        if (active && saved) setProfile({ ...saved, phone: formatPhone(saved.phone || ""), cpf: formatCpf(saved.cpf || "") });
      } catch {
        if (active) {
          setLoadError(true);
          setMessage("Não foi possível carregar o perfil. Atualize a página para tentar novamente.");
          setMessageType("error");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
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
    if (loading || saving || loadError) return;

    setMessage("");
    setMessageType("");

    const nameError = patientNameError(profile.name);
    if (nameError) {
      setMessage(nameError);
      setMessageType("error");
      return;
    }

    const phoneNumbers =
      profile.phone.replace(/\D/g, "");

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

    if (!isValidCpf(profile.cpf)) {
      setMessage(
        "Digite um CPF válido."
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
      setSaving(true);
      try {
        const saved = await savePatientProfile(createClient(), updatedProfile);
        setProfile({ ...saved, phone: formatPhone(saved.phone), cpf: formatCpf(saved.cpf) });
        window.dispatchEvent(new Event("profileUpdated"));
        setMessage("Perfil atualizado com sucesso!");
        setMessageType("success");
      } catch (error) {
        setMessage(error.message);
        setMessageType("error");
      } finally {
        setSaving(false);
      }
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
    <PatientShell title="Perfil" activePath="/perfil">
      <div className="ph-page ph-profile">
        <header className="ph-heading">
          <div>
            <p className="ph-eyebrow">Seus dados</p>
            <h1>Meu perfil</h1>
            <p>Consulte e atualize suas informações pessoais.</p>
          </div>
        </header>

        {message && (
          <div
            role={messageType === "error" ? "alert" : "status"}
            className={`ph-banner ${messageType === "error" ? "ph-banner-error" : "ph-banner-success"}`}
          >
            <Icon name={messageType === "error" ? "warning" : "check"} size={18} />
            <span>{message}</span>
          </div>
        )}

        <div className="ph-profile-grid">
          <aside className="ph-card ph-profile-summary">
            <span className="ph-profile-avatar" aria-hidden="true">{initials}</span>
            <div>
              <h2>{profile.name || "Paciente"}</h2>
              <p>Paciente</p>
            </div>
            <ul>
              {profile.email && <li><Icon name="mail" size={16} /><span>{profile.email}</span></li>}
              {profile.phone && <li><Icon name="phone" size={16} /><span>{profile.phone}</span></li>}
            </ul>
            <small>Seus dados são usados para identificar você nos atendimentos.</small>
          </aside>

          <form className="ph-card ph-form-card ph-profile-form" onSubmit={saveProfile}>
            <div className="ph-form-title">
              <div>
                <h2>Informações pessoais</h2>
                <p>Mantenha seus dados de contato atualizados.</p>
              </div>
              <span><Icon name="edit" size={14} />Editável</span>
            </div>

            {loading && <p className="ph-status" role="status">Carregando perfil...</p>}

            <div className="ph-field">
              <label htmlFor="name">Nome completo</label>
              <input
                id="name"
                name="name"
                type="text"
                maxLength={120}
                value={profile.name}
                disabled={loading || saving || loadError}
                onChange={updateField}
                required
              />
            </div>

            <div className="ph-field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                readOnly={isSupabaseConfigured()}
                aria-describedby={isSupabaseConfigured() ? "email-help" : undefined}
                disabled={loading || saving || loadError}
                onChange={updateField}
                required
              />
              {isSupabaseConfigured() && (
                <small id="email-help">O e-mail de acesso não é alterado nesta tela.</small>
              )}
            </div>

            <div className="ph-form-row">
              <div className="ph-field">
                <label htmlFor="phone">Telefone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  disabled={loading || saving || loadError}
                  onChange={updateField}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div className="ph-field">
                <label htmlFor="birthDate">Data de nascimento</label>
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  max={maximumBirthDate}
                  value={profile.birthDate}
                  disabled={loading || saving || loadError}
                  onChange={updateField}
                  required
                />
              </div>
            </div>

            <div className="ph-field">
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                inputMode="numeric"
                maxLength="14"
                value={profile.cpf}
                disabled={loading || saving || loadError}
                onChange={updateField}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div className="ph-profile-actions">
              <button type="submit" className="ui-button ui-button-primary" disabled={loading || saving || loadError}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PatientShell>
  );
}
