"use client";

import { useEffect, useState } from "react";
import { loadPatientProfile } from "../services/patient-profile.js";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/client.js";

export function useSavedProfile() {
  const [profile, setProfile] =
    useState({
      name: "Usuário",
      email: "",
      phone: "",
    });

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const savedProfile = isSupabaseConfigured()
          ? await loadPatientProfile(createClient())
          : JSON.parse(localStorage.getItem("profile") || "null");
        if (active) setProfile(savedProfile || { name: "Usuário", email: "", phone: "" });
      } catch {
        if (active) setProfile({ name: "Usuário", email: "", phone: "" });
      }
    }

    loadProfile();

    window.addEventListener(
      "profileUpdated",
      loadProfile
    );

    window.addEventListener(
      "storage",
      loadProfile
    );

    return () => {
      active = false;
      window.removeEventListener(
        "profileUpdated",
        loadProfile
      );

      window.removeEventListener(
        "storage",
        loadProfile
      );
    };
  }, []);

  return profile;
}

