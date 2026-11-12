"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";
import { loadPatientProfile } from "../../features/profile/services/patient-profile.js";
import { useAppointments } from "../../features/appointments/hooks/useAppointments.js";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

function useSavedProfile() {
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

function formatDate(date) {
  if (!date || !date.includes("-")) {
    return date;
  }

  const [year, month, day] =
    date.split("-");

  return `${day}/${month}/${year}`;
}

export default function UserMenu() {
  const router = useRouter();
  const profile = useSavedProfile();

  const { appointments, loading, error } = useAppointments();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const now = new Date();

  const scheduledAppointments =
    appointments
      .filter((appointment) => {
        const appointmentDate =
          new Date(
            appointment.scheduledAt || `${appointment.date}T${appointment.time}`
          );

        return (
          (appointment.status ===
            "Agendada" ||
            !appointment.status) &&
          appointmentDate >= now
        );
      })
      .sort((first, second) => {
        const firstDate =
          `${first.date}T${first.time}`;

        const secondDate =
          `${second.date}T${second.time}`;

        return firstDate.localeCompare(
          secondDate
        );
      });

  const cancelledAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        "Cancelada"
    );

  const nextAppointment =
    scheduledAppointments[0];

  const hasNotifications =
    scheduledAppointments.length > 0 ||
    cancelledAppointments.length > 0;

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
      <div className="notification-wrapper">
        <button
          type="button"
          className="notification-button"
          aria-label="Abrir notificações"
          aria-expanded={
            notificationsOpen
          }
          onClick={() =>
            setNotificationsOpen(
              (currentValue) =>
                !currentValue
            )
          }
        >
          🔔

          {scheduledAppointments.length >
            0 && (
            <span className="notification-badge">
              {
                scheduledAppointments.length
              }
            </span>
          )}
        </button>

        {notificationsOpen && (
          <div className="notification-panel">
            <div className="notification-panel-header">
              <strong>
                Notificações
              </strong>

              <button
                type="button"
                aria-label="Fechar notificações"
                onClick={() =>
                  setNotificationsOpen(
                    false
                  )
                }
              >
                ✕
              </button>
            </div>

            {loading ? <p role="status">Carregando notificações...</p> : error ? <p role="alert">{error}</p> : hasNotifications ? (
              <div className="notification-list">
                {nextAppointment && (
                  <div className="notification-item">
                    <span className="notification-item-icon">
                      🗓️
                    </span>

                    <div>
                      <strong>
                        Próxima consulta
                      </strong>

                      <p>
                        {
                          nextAppointment.specialty
                        }{" "}
                        com{" "}
                        {
                          nextAppointment.doctor
                        }
                      </p>

                      <small>
                        {formatDate(
                          nextAppointment.date
                        )}{" "}
                        às{" "}
                        {
                          nextAppointment.time
                        }
                      </small>
                    </div>
                  </div>
                )}

                {scheduledAppointments.length >
                  1 && (
                  <div className="notification-item">
                    <span className="notification-item-icon">
                      📋
                    </span>

                    <div>
                      <strong>
                        Consultas agendadas
                      </strong>

                      <p>
                        Você possui{" "}
                        {
                          scheduledAppointments.length
                        }{" "}
                        consultas futuras.
                      </p>
                    </div>
                  </div>
                )}

                {cancelledAppointments.length >
                  0 && (
                  <div className="notification-item">
                    <span className="notification-item-icon">
                      ✕
                    </span>

                    <div>
                      <strong>
                        Consultas canceladas
                      </strong>

                      <p>
                        Você possui{" "}
                        {
                          cancelledAppointments.length
                        }{" "}
                        {cancelledAppointments.length ===
                        1
                          ? " consulta cancelada."
                          : " consultas canceladas."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="notification-empty">
                <span>🔔</span>

                <p>
                  Nenhuma notificação no
                  momento.
                </p>
              </div>
            )}

            <Link
              href="/agendamentos"
              className="notification-link"
              onClick={() =>
                setNotificationsOpen(
                  false
                )
              }
            >
              Ver meus agendamentos
            </Link>
          </div>
        )}
      </div>

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
