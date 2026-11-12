"use client";

import { useRouter } from "next/navigation";
import { useSavedProfile } from "../../features/profile/hooks/useSavedProfile.js";
import Notifications from "./Notifications.js";
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

  async function logout() {
    const confirmed = window.confirm(
      "Deseja realmente sair da sua conta?"
    );

    if (!confirmed) {
      return;
    }

    if (isSupabaseConfigured()) {
      const { error } = await createClient().auth.signOut();
      if (error) {
        window.alert("Não foi possível sair. Tente novamente.");
        return;
      }
      router.replace("/");
      router.refresh();
      return;
    }

    localStorage.removeItem(
      "authToken"
    );

    localStorage.removeItem(
      "loggedUser"
    );

    sessionStorage.removeItem(
      "authToken"
    );

    router.replace("/");
  }

  return (
    <div className="topbar-user">
      <Notifications />

      <div className="user-avatar">
        {getInitials(profile.name)}
      </div>

      <strong>
        {profile.name}
      </strong>

      <button
        type="button"
        className="logout-button"
        onClick={logout}
      >
        Sair
      </button>
    </div>
  );
}

export function SidebarUser() {
  const profile = useSavedProfile();

  return (
    <div className="sidebar-user">
      <strong>
        Olá, {profile.name}!
      </strong>

      <span>Paciente</span>
    </div>
  );
}
