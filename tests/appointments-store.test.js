import test from "node:test";
import assert from "node:assert/strict";
import { createAppointmentsStore, EMPTY_APPOINTMENTS_STATE } from "../src/features/appointments/appointments-store.js";
const flush = () => new Promise((resolve) => setImmediate(resolve));

test("dois consumidores compartilham consulta, atualização e limpeza", async () => {
  let calls = 0, connections = 0, cleanups = 0, refresh;
  const store = createAppointmentsStore(async () => { calls++; return [{ id: calls }]; }, (load) => {
    connections++; refresh = load; return () => cleanups++;
  });
  const first = store.subscribe(() => {});
  const second = store.subscribe(() => {});
  await flush();
  assert.equal(calls, 1);
  assert.equal(connections, 1);
  await refresh();
  assert.equal(calls, 2);
  assert.deepEqual(store.getSnapshot().appointments, [{ id: 2 }]);
  first(); assert.equal(cleanups, 0);
  second(); assert.equal(cleanups, 1);
  assert.equal(store.getSnapshot(), EMPTY_APPOINTMENTS_STATE);
});

test("troca de conta limpa dados e descarta resposta anterior", async () => {
  const pending = []; let refresh, invalidate;
  const store = createAppointmentsStore(() => new Promise(resolve => pending.push(resolve)), (load, clear) => {
    refresh = load; invalidate = clear; return () => {};
  });
  const stop = store.subscribe(() => {});
  invalidate(); const loaded = refresh();
  pending[1]([{ id: "conta-nova" }]); await loaded;
  pending[0]([{ id: "conta-antiga" }]); await flush();
  assert.deepEqual(store.getSnapshot().appointments, [{ id: "conta-nova" }]);
  invalidate(); assert.equal(store.getSnapshot(), EMPTY_APPOINTMENTS_STATE);
  stop();
});

test("resposta após desmontagem não reaparece na próxima montagem", async () => {
  const pending = [];
  const store = createAppointmentsStore(() => new Promise(resolve => pending.push(resolve)), () => () => {});
  const stop = store.subscribe(() => {}); stop();
  const stopAgain = store.subscribe(() => {});
  pending[0]([{ id: "antiga" }]); await flush();
  assert.equal(store.getSnapshot().loading, true);
  assert.deepEqual(store.getSnapshot().appointments, []);
  pending[1]([{ id: "nova" }]); await flush();
  assert.deepEqual(store.getSnapshot().appointments, [{ id: "nova" }]);
  stopAgain();
});

test("erro limpa dados e atualização seguinte recupera o estado", async () => {
  let fail = true, refresh;
  const store = createAppointmentsStore(async () => { if (fail) throw new Error("Sem conexão"); return [{id: 1}]; }, load => {refresh = load; return () => {};});
  const stop = store.subscribe(() => {}); await flush();
  assert.equal(store.getSnapshot().error, "Sem conexão");
  assert.equal(store.getSnapshot().loading, false);
  assert.deepEqual(store.getSnapshot().appointments, []);
  fail = false; await refresh();
  assert.equal(store.getSnapshot().error, "");
  assert.equal(store.getSnapshot().appointments.length, 1);
  stop();
});
