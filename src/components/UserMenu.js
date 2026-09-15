"use client";

import { useEffect, useState } from "react";

function useSavedProfile() {
  const [profile, setProfile] = useState({
    name: "João Silva",
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem("profile");

    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  return profile;
}

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
  const profile = useSavedProfile();

  return (
    <div className="topbar-user">
      <span className="notification">🔔</span>
      <div className="user-avatar">{getInitials(profile.name)}</div>
      <strong>{profile.name}</strong>
    </div>
  );
}

export function SidebarUser() {
  const profile = useSavedProfile();

  return (
    <div className="sidebar-user">
      <strong>Olá, {profile.name}!</strong>
      <span>Paciente</span>
    </div>
  );
}