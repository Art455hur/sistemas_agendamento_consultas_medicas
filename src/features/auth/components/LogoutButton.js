"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

// Encerra a sessão no Supabase (cookies inclusive) e recarrega em /login,
// descartando o cache do roteador para que o painel não continue visível.
export default function LogoutButton({ className, errorClassName }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");
    try {
      if (isSupabaseConfigured()) {
        const { error: signOutError } = await createClient().auth.signOut();
        if (signOutError) throw signOutError;
      }
      window.location.replace("/login");
    } catch {
      setError("Não foi possível sair. Tente novamente.");
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={logout} disabled={pending}>
        {pending ? "Saindo..." : "Sair"}
      </button>
      {error && <span className={errorClassName} role="alert">{error}</span>}
    </>
  );
}
