"use client";

import { useSyncExternalStore } from "react";
import { createAppointmentsStore, EMPTY_APPOINTMENTS_STATE } from "../appointments-store.js";
import { subscribeAppointmentRefresh } from "../subscribe-refresh.js";
import { getAppointments } from "../services/appointments.js";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/client.js";

const store = createAppointmentsStore(getAppointments, (refresh, invalidate) => {
  let active = true;
  const unsubscribeRefresh = subscribeAppointmentRefresh(window, refresh);
  const subscription = isSupabaseConfigured() ? createClient().auth.onAuthStateChange(() => {
    // Invalida respostas antigas antes de consultar a nova sessão.
    invalidate();
    queueMicrotask(() => { if (active) refresh(); });
  }).data.subscription : null;
  return () => {
    active = false;
    subscription?.unsubscribe();
    unsubscribeRefresh();
  };
});
const getServerSnapshot = () => EMPTY_APPOINTMENTS_STATE;

export function useAppointments() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, getServerSnapshot);
}
