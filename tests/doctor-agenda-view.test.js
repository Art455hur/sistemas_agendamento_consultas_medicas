import test from "node:test";
import assert from "node:assert/strict";
import { filterAgenda, summarizeAgenda } from "../src/app/medico/agenda-view.js";

const now = Date.parse("2026-11-25T15:00:00Z");
const appointment = (id, time, status = "scheduled", name = "  João Silva  ") => ({
  id, status, patient_name: name, specialty: "Clínica Geral", scheduled_at: `2026-11-25T${time}Z`,
});

test("destaque usa o próximo horário real e o resumo separa os resultados", () => {
  const result = summarizeAgenda([
    appointment(1, "17:00:00"), appointment(2, "15:00:00"), appointment(3, "16:30:00"),
    appointment(4, "14:00:00", "no_show"), appointment(5, "14:30:00", "completed"),
    appointment(6, "15:30:00", "cancelled"),
  ], now);
  assert.deepEqual(result.counts, { scheduled: 2, pending: 1, completed: 1, no_show: 1, cancelled: 1 });
  assert.equal(result.upcoming.id, 3);
  assert.equal(result.upcoming.patient, "João Silva");
  assert.equal(result.upcoming.time, "13:30");
});

test("dia sem consultas tem resumo vazio e não mostra próximo atendimento", () => {
  const { rows, counts, upcoming } = summarizeAgenda([], now);
  assert.deepEqual(rows, []);
  assert.ok(Object.values(counts).every((value) => value === 0));
  assert.equal(upcoming, null);
});

test("busca ignora acentos e combina horário, especialidade e situação", () => {
  const { rows } = summarizeAgenda([
    appointment(1, "16:30:00"),
    appointment(2, "16:30:00", "cancelled", "Maria"),
    appointment(3, "14:00:00", "scheduled", "Maria"),
  ], now);
  assert.deepEqual(filterAgenda(rows, "  JOAO clinica 13:30 ", "").map(({ id }) => id), [1]);
  assert.deepEqual(filterAgenda(rows, "maria", "pending").map(({ id }) => id), [3]);
  assert.deepEqual(filterAgenda(rows, "maria", "scheduled"), []);
  assert.deepEqual(filterAgenda(rows, "", ""), rows);
});
