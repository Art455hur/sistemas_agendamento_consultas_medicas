"use client";

import { useEffect, useState } from "react";
import { getAppointments } from "../services/appointments.js";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/client.js";

export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let request = 0;
    async function load() {
      const current = ++request;
      setLoading(true);
      try {
        const items = await getAppointments();
        if (active && current === request) { setAppointments(items); setError(""); }
      } catch (failure) {
        if (active && current === request) { setAppointments([]); setError(failure.message); }
      } finally {
        if (active && current === request) setLoading(false);
      }
    }
    load();
    window.addEventListener("appointmentsUpdated", load);
    window.addEventListener("focus", load);
    const subscription = isSupabaseConfigured() ? createClient().auth.onAuthStateChange(() => {
      // Sem consultas dentro do callback síncrono de Auth; limpa o usuário anterior.
      ++request;
      setAppointments([]);
      queueMicrotask(() => { if (active) load(); });
    }).data.subscription : null;
    return () => {
      active = false;
      subscription?.unsubscribe();
      window.removeEventListener("appointmentsUpdated", load);
      window.removeEventListener("focus", load);
    };
  }, []);

  return { appointments, loading, error };
}
