"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSavedProfile } from "../../features/profile/hooks/useSavedProfile.js";
import Notifications from "./Notifications.js";
import Dialog from "../ui/Dialog.js";
import Icon from "../ui/Icon.js";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

function getInitials(name) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "US"
  );
}

export default function UserMenu() {
  const router = useRouter();
  const profile = useSavedProfile();
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");

  function closeDialog() {
    setConfirming(false);
    setError("");
  }

  async function logout() {
    setLeaving(true);
    setError("");

    if (isSupabaseConfigured()) {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) {
        setError("Não foi possível sair. Tente novamente.");
        setLeaving(false);
        return;
      }
      router.replace("/");
      router.refresh();
      return;
    }

    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedUser");
    sessionStorage.removeItem("authToken");
    router.replace("/");
  }

  return (
    <div className="topbar-user">
      <Notifications />

      <div className="user-avatar" aria-hidden="true">
        {getInitials(profile.name)}
      </div>

      <strong>{profile.name}</strong>

      <button
        type="button"
        className="logout-button"
        onClick={() => setConfirming(true)}
      >
        <Icon name="logout" size={16} />
        Sair
      </button>

      {confirming && (
        <Dialog title="Sair da conta?" onClose={closeDialog} busy={leaving}>
          <p className="ui-dialog-text">
            Você precisará entrar novamente com seu e-mail e senha para acessar seus agendamentos.
          </p>
          {error && <p className="ui-dialog-error" role="alert">{error}</p>}
          <div className="ui-dialog-actions">
            <button
              type="button"
              className="ui-button ui-button-secondary"
              onClick={closeDialog}
              disabled={leaving}
              data-autofocus
            >
              Continuar conectado
            </button>
            <button
              type="button"
              className="ui-button ui-button-primary"
              onClick={logout}
              disabled={leaving}
            >
              {leaving ? "Saindo..." : "Sair"}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export function SidebarUser() {
  const profile = useSavedProfile();

  return (
    <div className="sidebar-user">
      <span className="sidebar-user-avatar" aria-hidden="true">
        {getInitials(profile.name)}
      </span>
      <div>
        <strong>Olá, {profile.name}!</strong>
        <span>Paciente</span>
      </div>
    </div>
  );
}
