// Eventos do mesmo navegador e atualização periódica apenas com a aba visível.
export function subscribeAppointmentRefresh(browser, refresh, intervalMs = 60_000) {
  const visible = () => browser.document.visibilityState === "visible";
  const onVisible = () => { if (visible()) refresh(); };
  const onStorage = (event) => {
    if (event.key === "appointments" || event.key === "authToken" || event.key === null) onVisible();
  };
  browser.addEventListener("appointmentsUpdated", refresh);
  browser.addEventListener("focus", onVisible);
  browser.addEventListener("storage", onStorage);
  browser.document.addEventListener("visibilitychange", onVisible);
  const timer = browser.setInterval(onVisible, intervalMs);
  return () => {
    browser.removeEventListener("appointmentsUpdated", refresh);
    browser.removeEventListener("focus", onVisible);
    browser.removeEventListener("storage", onStorage);
    browser.document.removeEventListener("visibilitychange", onVisible);
    browser.clearInterval(timer);
  };
}
