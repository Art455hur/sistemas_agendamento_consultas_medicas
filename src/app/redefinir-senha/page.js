"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function RedefinirSenha() {
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    createClient().auth.getUser().then(({ data }) => setReady(Boolean(data?.user)));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (password.length < 6) {
      setMessage("Use uma senha com pelo menos 6 caracteres.");
      return;
    }
    const { error } = await createClient().auth.updateUser({ password });
    setMessage(error
      ? "O link expirou ou não foi possível alterar a senha. Solicite outro link."
      : "Senha alterada. Você já pode entrar na sua conta.");
    if (!error) await createClient().auth.signOut();
  }

  return (
    <main className="auth-page">
      <section className="auth-form-section">
        <div className="auth-box">
          <h1>Redefinir senha</h1>
          {ready ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="new-password">Nova senha</label>
              <input id="new-password" type="password" autoComplete="new-password"
                value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button className="auth-submit-button" type="submit">Salvar nova senha</button>
            </form>
          ) : <p>Abra o link enviado para o seu e-mail para redefinir a senha.</p>}
          {message && <p role="status">{message}</p>}
          <p><Link href="/login">Voltar para o login</Link></p>
        </div>
      </section>
    </main>
  );
}
