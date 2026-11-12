"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [remember, setRemember] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [messageType, setMessageType] =
    useState("");

  useEffect(() => {
    const parameters = new URLSearchParams(
      window.location.search
    );

    if (
      parameters.get("cadastro") === "sucesso"
    ) {
      setMessage(
        "Cadastro realizado! Agora entre com seus dados."
      );
      setMessageType("success");
    }
    if (parameters.get("erro") === "confirmacao") {
      setMessage("O link não pôde ser confirmado. Solicite um novo e-mail e tente novamente.");
      setMessageType("error");
    }
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    if (!email || !password) {
      setMessage(
        "Preencha o e-mail e a senha."
      );
      setMessageType("error");
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password,
      });
      if (error || !data.user) {
        setMessage("Não foi possível entrar. Confira seus dados e confirme seu e-mail, se necessário.");
        setMessageType("error");
        return;
      }
      // A sessão real usa cookies. Nunca persista a senha ou um token próprio.
      localStorage.removeItem("registeredUser");
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");
      const { data: savedProfile } = await supabase.from("profiles")
        .select("full_name, phone")
        .eq("id", data.user.id)
        .maybeSingle();
      localStorage.setItem("profile", JSON.stringify({
        name: savedProfile?.full_name || data.user.user_metadata?.name || "Paciente",
        email: data.user.email,
        phone: savedProfile?.phone || "",
      }));
      const parameters = new URLSearchParams(window.location.search);
      const redirect = parameters.get("redirect");
      const safe = redirect?.startsWith("/") && !redirect.startsWith("//");
      router.replace(safe ? redirect : "/dashboard");
      router.refresh();
      return;
    }

    const savedUser = JSON.parse(
      localStorage.getItem("registeredUser") ||
        "null"
    );

    if (!savedUser) {
      setMessage(
        "Nenhum usuário cadastrado. Crie uma conta primeiro."
      );
      setMessageType("error");
      return;
    }

    if (
      savedUser.email.toLowerCase() !==
        email.trim().toLowerCase() ||
      savedUser.password !== password
    ) {
      setMessage(
        "E-mail ou senha incorretos."
      );
      setMessageType("error");
      return;
    }

    const token = `agenda-saude-${Date.now()}`;

    if (remember) {
      localStorage.setItem(
        "authToken",
        token
      );
    } else {
      sessionStorage.setItem(
        "authToken",
        token
      );
    }

    localStorage.setItem(
      "loggedUser",
      JSON.stringify({
        name: savedUser.name,
        email: savedUser.email,
      })
    );

    const parameters = new URLSearchParams(
      window.location.search
    );

        const redirect =
      parameters.get("redirect");

    const isSafeRedirect =
      redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//");

    if (isSafeRedirect) {
      router.push(redirect);
      return;
    }

    const specialty =
      parameters.get("especialidade");

    const doctor =
      parameters.get("profissional");

    if (specialty) {
      const bookingParameters =
        new URLSearchParams();

      bookingParameters.set(
        "especialidade",
        specialty
      );

      if (doctor) {
        bookingParameters.set(
          "profissional",
          doctor
        );
      }

      router.push(
        `/agendar?${bookingParameters.toString()}`
      );

      return;
    }

    router.push("/dashboard");
  }

  async function resetPassword() {
    setMessage("");
    setMessageType("");

    if (!email) {
      setMessage(
        "Digite seu e-mail antes de redefinir a senha."
      );
      setMessageType("error");
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha` }
      );
      setMessage(error
        ? "Não foi possível enviar o e-mail. Tente novamente mais tarde."
        : "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.");
      setMessageType(error ? "error" : "success");
      return;
    }

    const savedUser = JSON.parse(
      localStorage.getItem("registeredUser") ||
        "null"
    );

    if (
      !savedUser ||
      savedUser.email.toLowerCase() !==
        email.trim().toLowerCase()
    ) {
      setMessage(
        "Não encontramos uma conta com esse e-mail."
      );
      setMessageType("error");
      return;
    }

    const newPassword = window.prompt(
      "Digite uma nova senha com pelo menos 6 caracteres:"
    );

    if (!newPassword) {
      return;
    }

    if (newPassword.length < 6) {
      setMessage(
        "A nova senha deve possuir pelo menos 6 caracteres."
      );
      setMessageType("error");
      return;
    }

    const updatedUser = {
      ...savedUser,
      password: newPassword,
    };

    localStorage.setItem(
      "registeredUser",
      JSON.stringify(updatedUser)
    );

    setPassword(newPassword);
    setMessage(
      "Senha alterada com sucesso!"
    );
    setMessageType("success");
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
            Cuidado ao seu alcance
          </span>

          <h1>
            Agendamentos simples e rápidos para cuidar
            melhor de você
          </h1>

          <p>
            Agende consultas com especialistas de forma
            fácil, sem filas e sem complicações.
          </p>

          <ul>
            <li>
              <span>✓</span>
              Disponível 24 horas por dia
            </li>

            <li>
              <span>✓</span>
              Mais de 50 unidades conveniadas
            </li>

            <li>
              <span>✓</span>
              Mais de 300 especialistas cadastrados
            </li>
          </ul>
        </div>

        <p className="auth-copyright">
          © 2026 AgendaSaúde — Todos os direitos reservados
        </p>
      </section>

      <section className="auth-form-section">
        <div className="auth-box">
          <Link
            href="/"
            className="auth-mobile-logo"
          >
            <span>+</span>
            <strong>AgendaSaúde</strong>
          </Link>

          <div className="auth-heading">
            <h2>Bem-vindo de volta</h2>

            <p>
              Acesse sua conta para gerenciar suas
              consultas.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleLogin}
          >
            <div className="auth-field">
              <label htmlFor="email">
                E-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Digite seu e-mail"
                autoComplete="email"
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
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
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
                  aria-label={
                    showPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div className="auth-options">
              {!isSupabaseConfigured() && <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(
                      event.target.checked
                    )
                  }
                />

                <span>Lembrar de mim</span>
              </label>}

              <button
                type="button"
                className="auth-forgot-password"
                onClick={resetPassword}
              >
                Esqueci minha senha
              </button>
            </div>

            {message && (
              <p
                className={`auth-message ${messageType}`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit-button"
            >
              Entrar
            </button>
          </form>

          <p className="auth-switch">
            Ainda não tem uma conta?{" "}
            <Link href="/cadastro">
              Criar uma conta
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

