"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createConfirmationResender } from "./confirmation-resend.js";
import styles from "./confirmation-resend.module.css";

export default function ConfirmationResend({ email }) {
  const sender = useRef(null);
  if (!sender.current) {
    sender.current = createConfirmationResender({ resend: (options) => createClient().auth.resend(options) });
  }
  const [retryAt, setRetryAt] = useState(sender.current.retryAt);
  const [seconds, setSeconds] = useState(60);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const update = () => setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);

  async function handleResend() {
    setSending(true);
    setFeedback(null);
    const result = await sender.current.send(email, `${window.location.origin}/auth/callback`);
    setRetryAt(result.retryAt);
    if (!result.blocked) setFeedback(result);
    setSending(false);
  }

  return (
    <section className={styles.panel} aria-label="Confirmação de e-mail">
      <p>Não recebeu a confirmação em <strong>{email}</strong>?</p>
      <p className={styles.hint}>A entrega pode levar alguns minutos. Confira também o spam antes de reenviar.</p>
      <button type="button" className={styles.button} disabled={sending || seconds > 0} aria-busy={sending} onClick={handleResend}>
        {sending ? "Solicitando reenvio..." : seconds > 0 ? `Reenviar confirmação em ${seconds}s` : "Reenviar confirmação"}
      </button>
      {feedback && <p className={`auth-message ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>{feedback.message}</p>}
    </section>
  );
}
