"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Dialog from "@/components/ui/Dialog.js";
import Icon from "@/components/ui/Icon.js";

// Botão Sair dos painéis da equipe: pede confirmação num card, encerra a sessão no
// Supabase (cookies inclusive) e recarrega em /login, descartando o cache do roteador.
export default function LogoutButton({ className, label = "Sair", iconOnly = false }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setConfirming(false);
    setError("");
  }

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
      <button
        type="button"
        className={className}
        onClick={() => setConfirming(true)}
        aria-label={iconOnly ? label : undefined}
      >
        <Icon name="logout" size={18} />
        {!iconOnly && <span>{label}</span>}
      </button>
      {confirming && (
        <Dialog title="Sair da conta?" onClose={close} busy={pending}>
          <p className="ui-dialog-text">
            Você precisará entrar novamente com seu e-mail e senha para acessar o painel.
          </p>
          {error && <p className="ui-dialog-error" role="alert">{error}</p>}
          <div className="ui-dialog-actions">
            <button type="button" className="ui-button ui-button-secondary" onClick={close} disabled={pending} data-autofocus>
              Continuar conectado
            </button>
            <button type="button" className="ui-button ui-button-primary" onClick={logout} disabled={pending}>
              {pending ? "Saindo..." : "Sair"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
