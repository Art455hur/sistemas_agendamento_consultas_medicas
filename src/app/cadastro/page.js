
"use client";

import Link from "next/link";
import { useState } from "react";

export default function Cadastro() {
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cadastrar(event) {
    event.preventDefault();
    setMensagem("");
    setEnviando(true);

    const formulario = event.currentTarget;
    const dados = Object.fromEntries(new FormData(formulario));

    try {
      const resposta = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        setMensagem(resultado.erro || "Não foi possível cadastrar.");
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
      <h1>Cadastro</h1>

      <form onSubmit={cadastrar}>
        <div>
          <label htmlFor="nome">Nome completo</label>
          <br />
          <input
            type="text"
            id="nome"
            name="nome"
            placeholder="Digite seu nome"
            maxLength={150}
            autoComplete="name"
            required
          />
        </div>

        <br />

        <div>
          <label htmlFor="email">E-mail</label>
          <br />
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Digite seu e-mail"
            maxLength={254}
            autoComplete="email"
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
            placeholder="Crie uma senha"
            autoComplete="new-password"
            required
          />
        </div>

        <br />

        <div>
          <label htmlFor="confirmarSenha">Confirmar senha</label>
          <br />
          <input
            type="password"
            id="confirmarSenha"
            name="confirmarSenha"
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
            required
          />
        </div>

        <br />

        <div>
          <label htmlFor="funcao">Função</label>
          <br />
          <select id="funcao" name="funcao" defaultValue="" required>
            <option value="" disabled>
              Selecione sua função
            </option>
            <option value="Paciente">Paciente</option>
            <option value="Médico">Médico</option>
          </select>
        </div>

        <br />

        <button type="submit" disabled={enviando}>
          {enviando ? "Cadastrando..." : "Criar cadastro"}
        </button>

        <p role="status">{mensagem}</p>
      </form>

      <p>Já possui uma conta?</p>
      <Link href="/login">Fazer login</Link>
    </main>
  );
}