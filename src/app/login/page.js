
"use client";

import Link from "next/link";
import { useState } from "react";

export default function Login() {
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(event) {
    event.preventDefault();
    setMensagem("");
    setEnviando(true);

    const formulario = event.currentTarget;
    const dados = Object.fromEntries(new FormData(formulario));

    try {
      const resposta = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setMensagem(resultado.erro || "Não foi possível entrar.");
        return;
      }

      setMensagem(resultado.mensagem);
      formulario.reset();
    } catch {
      setMensagem("Não foi possível conectar ao servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main>
      <h1>Login</h1>

      <form onSubmit={entrar}>
        <div>
          <label htmlFor="email">E-mail</label>
          <br />
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Digite seu e-mail"
            maxLength={254}
            autoComplete="username"
            required
          />
        </div>

        <br />

        <div>
          <label htmlFor="senha">Senha</label>
          <br />
          <input
            type="password"
            id="senha"
            name="senha"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            required
          />
        </div>

        <br />

        <button type="submit" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>

        <p role="status">{mensagem}</p>
      </form>

      <p>Ainda não possui uma conta?</p>
      <Link href="/cadastro">Criar cadastro</Link>
    </main>
  );
}