export const RESEND_INTERVAL_MS = 60_000;

export function canResendConfirmation({ data, error } = {}) {
  if (error) return ["user_already_exists", "email_exists"].includes(error.code);
  return Boolean(data?.user && !data.session);
}

export function resendFeedback(error) {
  if (!error) return {
    type: "success",
    message: "Reenvio solicitado. Confira seu e-mail e o spam; a mensagem pode demorar alguns minutos. Use o link mais recente.",
  };
  if (error.code === "over_email_send_rate_limit" || /email rate limit exceeded/i.test(error.message || "")) return {
    type: "info",
    message: "O serviço atingiu o limite de envio de e-mails. Tente mais tarde. Se uma mensagem já chegou, use o link mais recente. Não é necessário apagar sua conta.",
  };
  if (error.status === 429 || error.code === "over_request_rate_limit") return {
    type: "info",
    message: "Muitas tentativas em pouco tempo. Aguarde antes de solicitar outra confirmação.",
  };
  return {
    type: "error",
    message: "Não foi possível confirmar o reenvio. Confira sua conexão e tente novamente mais tarde.",
  };
}

// O bloqueio é imediato, antes da próxima renderização do React.
export function createConfirmationResender({ resend, now = Date.now, initialDelay = RESEND_INTERVAL_MS }) {
  let retryAt = now() + initialDelay;
  let pending = false;
  return {
    get retryAt() { return retryAt; },
    async send(email, emailRedirectTo) {
      if (pending || now() < retryAt) return { blocked: true, retryAt };
      pending = true;
      retryAt = now() + RESEND_INTERVAL_MS;
      try {
        const { error } = await resend({ type: "signup", email, options: { emailRedirectTo } });
        return { ...resendFeedback(error), retryAt };
      } catch {
        return { ...resendFeedback({}), retryAt };
      } finally {
        pending = false;
      }
    },
  };
}
