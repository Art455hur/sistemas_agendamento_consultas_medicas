import assert from "node:assert/strict";
import test from "node:test";
import { appointmentNotifications } from "../src/features/notifications/appointment-notifications.js";
import { subscribeAppointmentRefresh } from "../src/features/appointments/subscribe-refresh.js";

const now = new Date("2030-01-02T09:00:00-03:00");
const appointment = (patch = {}) => ({
  id: "consulta-1", date: "2030-01-03", time: "10:30",
  scheduledAt: "2030-01-03T10:30:00-03:00", status: "Agendada",
  doctor: "Dra. Teste", specialty: "Clínica Geral", ...patch,
});

test("criação, remarcação e cancelamento atualizam o mesmo aviso sem duplicar", () => {
  const initial = appointmentNotifications([appointment()], now);
  assert.equal(initial.length, 1);
  assert.equal(initial[0].title, "Próxima consulta");
  assert.equal(initial[0].doctor, "Dra. Teste");
  assert.equal(initial[0].href, "/agendamentos?aba=scheduled#consulta-consulta-1");
  const rescheduled = appointmentNotifications([appointment({
    date: "2030-01-04", time: "14:00", scheduledAt: "2030-01-04T14:00:00-03:00",
  })], now);
  assert.equal(rescheduled.length, 1);
  assert.equal(rescheduled[0].id, initial[0].id);
  assert.equal(rescheduled[0].date, "2030-01-04");
  assert.equal(rescheduled[0].time, "14:00");
  const cancelled = appointmentNotifications([appointment({ status: "Cancelada" })], now);
  assert.equal(cancelled.length, 1);
  assert.equal(cancelled[0].title, "Consulta cancelada");
  assert.equal(cancelled[0].kind, "cancelled");
  assert.equal(cancelled[0].href, "/agendamentos?aba=cancelled#consulta-consulta-1");
});

test("a contagem inclui cancelamentos mesmo sem consultas futuras", () => {
  const result = appointmentNotifications([
    appointment({ id: 1, status: "Cancelada" }),
    appointment({ id: 2, status: "Cancelada", scheduledAt: "2029-01-01T10:00:00-03:00" }),
  ], now);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map((item) => item.id), ["1", "2"]);
});

test("consulta passada deixa os avisos mesmo se o status ainda não foi atualizado", () => {
  const item = appointment();
  assert.equal(appointmentNotifications([item], new Date("2030-01-03T13:29:00Z")).length, 1);
  assert.equal(appointmentNotifications([item], new Date("2030-01-03T13:31:00Z")).length, 0);
  assert.equal(appointmentNotifications([appointment({ status: "Concluída" })], now).length, 0);
});

test("ordena futuras pelo instante e preserva entrada e dados de exibição", () => {
  const items = [appointment({ id: "late" }), appointment({ id: "early", scheduledAt: "2030-01-03T12:00:00Z", time: "09:00" })];
  const before = structuredClone(items);
  const result = appointmentNotifications(items, now);
  assert.deepEqual(result.map((item) => item.id), ["early", "late"]);
  assert.equal(result[0].time, "09:00");
  assert.equal(result[1].title, "Consulta agendada");
  assert.deepEqual(items, before);
});

test("aceita dados locais legados e ignora entradas sem identidade ou horário válido", () => {
  const result = appointmentNotifications([
    appointment({ scheduledAt: undefined, status: undefined }),
    appointment({ id: null }), appointment({ id: "invalid", scheduledAt: "inválido" }),
    appointment({ id: "unknown", status: "Desconhecido" }),
  ], now);
  assert.equal(result.length, 1);
  assert.equal(appointmentNotifications([], now).length, 0);
  assert.equal(appointmentNotifications([appointment({ id: "a & b" })], now)[0].href,
    "/agendamentos?aba=scheduled#consulta-a%20%26%20b");
});

function fakeBrowser() {
  const browser = new EventTarget();
  browser.document = new EventTarget();
  browser.document.visibilityState = "visible";
  browser.setInterval = (callback, ms) => { browser.tick = callback; browser.intervalMs = ms; return 123; };
  browser.clearInterval = (id) => { assert.equal(id, 123); browser.tick = null; };
  browser.storage = (key) => {
    const event = new Event("storage");
    event.key = key;
    browser.dispatchEvent(event);
  };
  return browser;
}

test("atualiza em alteração, foco, retorno, armazenamento e intervalo visível", () => {
  const browser = fakeBrowser();
  let calls = 0;
  const dispose = subscribeAppointmentRefresh(browser, () => calls++);
  assert.equal(browser.intervalMs, 60_000);
  browser.dispatchEvent(new Event("appointmentsUpdated"));
  browser.dispatchEvent(new Event("focus"));
  browser.document.dispatchEvent(new Event("visibilitychange"));
  browser.storage("appointments");
  browser.storage("authToken");
  browser.storage(null);
  browser.tick();
  assert.equal(calls, 7);
  browser.storage("unrelated");
  assert.equal(calls, 7);
  dispose();
});

test("pausa atualização periódica na aba oculta e remove listeners ao desmontar", () => {
  const browser = fakeBrowser();
  let calls = 0;
  const dispose = subscribeAppointmentRefresh(browser, () => calls++);
  browser.document.visibilityState = "hidden";
  browser.tick();
  browser.storage("appointments");
  browser.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls, 0);
  browser.document.visibilityState = "visible";
  browser.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls, 1);
  dispose();
  browser.dispatchEvent(new Event("appointmentsUpdated"));
  browser.dispatchEvent(new Event("focus"));
  browser.storage("appointments");
  browser.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls, 1);
  assert.equal(browser.tick, null);
});
