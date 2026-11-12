"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

    setMessage("");

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

    const cpfNumbers =
      form.cpf.replace(/\D/g, "");

    if (cpfNumbers.length !== 11) {
      setMessage(
        "Digite um CPF com 11 números."
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
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            name: form.name.trim(),
            phone: phoneNumbers,
            birth_date: form.birthDate,
            cpf: cpfNumbers,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage("Não foi possível criar a conta. Verifique os dados e tente novamente.");
        return;
      }
      setMessage("Cadastro enviado! Confirme seu e-mail, se solicitado, e depois entre na sua conta.");
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
              <p className="auth-message error">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit-button"
            >
              Criar cadastro
            </button>
          </form>

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

