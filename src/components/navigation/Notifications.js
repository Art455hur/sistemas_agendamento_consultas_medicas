"use client";

import ErrorNotice from "@/components/feedback/ErrorNotice.js";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useAppointments } from "../../features/appointments/hooks/useAppointments.js";
import { appointmentNotifications } from "../../features/notifications/appointment-notifications.js";
import { formatDate } from "../../shared/formatting/date.js";

export default function Notifications() {
  const { appointments, loading, error, retry } = useAppointments();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapper = useRef(null);
  const trigger = useRef(null);
  const notifications = loading || error ? [] : appointmentNotifications(appointments);
  const count = notifications.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onOutside = (event) => {
      if (!wrapper.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [open]);

  return (
    <div className="notification-wrapper" ref={wrapper}>
      <button
        ref={trigger}
        type="button"
        className="notification-button"
        aria-label={`Notificações${count ? `: ${count} avisos` : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        🔔
        {count > 0 && <span className="notification-badge">{count}</span>}
      </button>

      {open && (
        <section id={panelId} className="notification-panel" aria-label="Notificações de agendamentos">
          <div className="notification-panel-header">
            <strong>Notificações</strong>
            <button type="button" aria-label="Fechar notificações" onClick={() => {
              setOpen(false);
              trigger.current?.focus();
            }}>✕</button>
          </div>

          {loading ? <p role="status">Carregando notificações...</p> : error ? (
            <ErrorNotice message={error} onRetry={retry} />
          ) : count > 0 ? (
            <div className="notification-list">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.href}
                  className="notification-item notification-appointment"
                  onClick={() => setOpen(false)}
                >
                  <span className="notification-item-icon" aria-hidden="true">{notification.icon}</span>
                  <div>
                    <strong>{notification.title}</strong>
                    <p>{notification.specialty} com {notification.doctor}</p>
                    <small>{formatDate(notification.date)} às {notification.time}</small>
                    <span className="notification-detail-link">Ver consulta</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="notification-empty">
              <span aria-hidden="true">🔔</span>
              <p>Nenhuma notificação no momento.</p>
            </div>
          )}

          <Link href="/agendamentos" className="notification-link" onClick={() => setOpen(false)}>
            Ver meus agendamentos
          </Link>
        </section>
      )}
    </div>
  );
}
