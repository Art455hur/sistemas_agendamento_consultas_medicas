"use client";

import { formatPhone, formatCpf } from "@/shared/formatting/patient-fields.js";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { registrationFeedback, registrationConnectionFeedback } from "@/features/auth/registration-feedback.js";
import ConfirmationResend from "@/features/auth/ConfirmationResend";
import { canResendConfirmation } from "@/features/auth/confirmation-resend.js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isValidCpf } from "@/shared/validation/cpf.js";

export default function Cadastro() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    cpf: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] = useState("error");
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const requestState = useRef("idle");

  const today = new Date();

  const maximumBirthDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(
      2,
      "0"
    ),
    String(today.getDate()).padStart(
      2,
      "0"
    ),
  ].join("-");

  function updateField(event) {
    const { name, value } = event.target;
    if (name === "email") setConfirmationEmail("");

    let formattedValue = value;

    if (name === "phone") {
      formattedValue = formatPhone(value);
    }

    if (name === "cpf") {
      formattedValue = formatCpf(value);
    }

    setForm((currentForm) => ({
      ...currentForm,
      [name]: formattedValue,
    }));
  }

  async function handleRegister(event) {
    event.preventDefault();
    if (requestState.current !== "idle") return;
    setMessageType("error");
    setMessage("");
    setConfirmationEmail("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone ||
      !form.birthDate ||
      !form.cpf ||
      !form.password ||
      !form.confirmPassword
    ) {
      setMessage(
        "Preencha todos os campos."
      );
      return;
    }

    if (form.name.trim().length < 3) {
      setMessage(
        "Digite seu nome completo."
      );
      return;
    }

    const phoneNumbers =
      form.phone.replace(/\D/g, "");

    if (
      phoneNumbers.length < 10 ||
      phoneNumbers.length > 11
    ) {
      setMessage(
        "Digite um telefone válido."
      );
      return;
    }

    if (!isValidCpf(form.cpf)) {
      setMessage(
        "Digite um CPF válido."
      );
      return;
    }

    const birthDate = new Date(
      `${form.birthDate}T00:00:00`
    );

    if (birthDate > new Date()) {
      setMessage(
        "A data de nascimento não pode estar no futuro."
      );
      return;
    }

    if (form.password.length < 6) {
      setMessage(
        "A senha deve possuir pelo menos 6 caracteres."
      );
      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setMessage(
        "As senhas não coincidem."
      );
      return;
    }

    if (isSupabaseConfigured()) {
      requestState.current = "submitting";
      setSubmitting(true);
      try {
        const result = await createClient().auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: {
            data: { name: form.name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        const feedback = registrationFeedback(result);
        if (canResendConfirmation(result)) setConfirmationEmail(form.email.trim().toLowerCase());
        setMessage(feedback.message);
        setMessageType(feedback.type);
        if (feedback.complete) {
          requestState.current = "complete";
          setComplete(true);
          setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
        }
      } catch {
        const feedback = registrationConnectionFeedback();
        setMessage(feedback.message);
        setMessageType(feedback.type);
      } finally {
        if (requestState.current !== "complete") requestState.current = "idle";
        setSubmitting(false);
      }
      return;
    }

    const registeredUser = {
      name: form.name.trim(),
      email: form.email
        .trim()
        .toLowerCase(),
      phone: form.phone,
      birthDate: form.birthDate,
      cpf: form.cpf,
      password: form.password,
    };

    localStorage.setItem(
      "registeredUser",
      JSON.stringify(registeredUser)
    );

    localStorage.setItem(
      "profile",
      JSON.stringify({
        name: registeredUser.name,
        email: registeredUser.email,
        phone: registeredUser.phone,
        birthDate:
          registeredUser.birthDate,
        cpf: registeredUser.cpf,
      })
    );

    router.push(
      "/login?cadastro=sucesso"
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-presentation">
        <Link
          href="/"
          className="auth-logo"
        >
          <span>+</span>
          <strong>AgendaSaúde</strong>
        </Link>

        <div className="auth-presentation-content">
          <span className="auth-label">
            Comece agora
          </span>

          <h1>
            Sua saúde organizada em um só lugar
          </h1>

          <p>
            Crie sua conta para encontrar especialistas,
            escolher horários e acompanhar suas consultas.
          </p>

          <ul>
            <li>
              <span>✓</span>
              Cadastro simples e rápido
            </li>

            <li>
              <span>✓</span>
              Consultas organizadas
            </li>

            <li>
              <span>✓</span>
              Informações disponíveis a qualquer momento
            </li>
          </ul>
        </div>

        <p className="auth-copyright">
          © 2026 AgendaSaúde — Todos os direitos reservados
        </p>
      </section>

      <section className="auth-form-section">
        <div className="auth-box auth-register-box">
          <Link
            href="/"
            className="auth-mobile-logo"
          >
            <span>+</span>
            <strong>AgendaSaúde</strong>
          </Link>

          <div className="auth-heading">
            <h2>Crie sua conta</h2>

            <p>
              Preencha seus dados para começar.
            </p>
          </div>

          <form
            className="auth-form auth-register-form"
            onSubmit={handleRegister}
          >
            <div className="auth-field auth-field-full">
              <label htmlFor="name">
                Nome completo
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                disabled={submitting || complete}
                onChange={updateField}
                placeholder="Digite seu nome completo"
                autoComplete="name"
                required
              />
            </div>

            <div className="auth-field auth-field-full">
              <label htmlFor="email">
                E-mail
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                disabled={submitting || complete}
                onChange={updateField}
                placeholder="Digite seu e-mail"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="phone">
                Telefone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                disabled={submitting || complete}
                onChange={updateField}
                placeholder="(11) 99999-9999"
                autoComplete="tel"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="birthDate">
                Data de nascimento
              </label>

              <input
                id="birthDate"
                name="birthDate"
                type="date"
                max={maximumBirthDate}
                value={form.birthDate}
                disabled={submitting || complete}
                onChange={updateField}
                autoComplete="bday"
                required
              />
            </div>

            <div className="auth-field auth-field-full">
              <label htmlFor="cpf">
                CPF
              </label>

              <input
                id="cpf"
                name="cpf"
                type="text"
                inputMode="numeric"
                value={form.cpf}
                disabled={submitting || complete}
                onChange={updateField}
                placeholder="000.000.000-00"
                maxLength="14"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">
                Senha
              </label>

              <div className="auth-password-field">
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={form.password}
                  disabled={submitting || complete}
                  onChange={updateField}
                  placeholder="Crie uma senha"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="auth-show-password"
                  onClick={() =>
                    setShowPassword(
                      (currentValue) =>
                        !currentValue
                    )
                  }
                >
                  {showPassword
                    ? "Ocultar"
                    : "Mostrar"}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">
                Confirmar senha
              </label>

              <div className="auth-password-field">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    form.confirmPassword
                  }
                  disabled={submitting || complete}
                  onChange={updateField}
                  placeholder="Digite novamente"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="auth-show-password"
                  onClick={() =>
                    setShowConfirmPassword(
                      (currentValue) =>
                        !currentValue
                    )
                  }
                >
                  {showConfirmPassword
                    ? "Ocultar"
                    : "Mostrar"}
                </button>
              </div>
            </div>

            {message && (
              <p className={`auth-message ${messageType}`} role={messageType === "error" ? "alert" : "status"}>
                {message}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={submitting || complete}
              aria-busy={submitting}
            >
              {submitting ? "Enviando cadastro..." : complete ? "Cadastro enviado" : "Criar cadastro"}
            </button>
          </form>

          {confirmationEmail && <ConfirmationResend key={confirmationEmail} email={confirmationEmail} />}

          <p className="auth-switch">
            Já possui uma conta?{" "}
            <Link href="/login">
              Fazer login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
