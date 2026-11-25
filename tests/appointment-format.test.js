import test from "node:test";
import assert from "node:assert/strict";
import { clinicDateTime, fromAppointmentRow, appointmentError, isPastAppointmentStatus } from "../src/features/appointments/appointment-format.js";
import { adjacentDay, selectedDay } from "../src/app/medico/day.js";

test("a data da clínica não muda com o fuso do aparelho", () => {
  assert.deepEqual(clinicDateTime("2026-11-12T02:30:00Z"), { date: "2026-11-11", time: "23:30" });
});

test("cancelamento tem precedência sobre data passada no histórico", () => {
  const row = { id: "1", doctor_id: "2", doctor_name: "Dra. Teste", scheduled_at: "2026-11-12T12:00:00Z", status: "cancelled" };
  const item = fromAppointmentRow(row, new Date("2027-01-01"));
  assert.equal(item.status, "Cancelada");
  assert.equal(item.doctor, "Dra. Teste");
  assert.equal(item.time, "09:00");
  assert.equal(fromAppointmentRow({ ...row, status: "scheduled" }, new Date("2027-01-01")).status, "Aguardando registro");
  assert.equal(row.status, "cancelled");
});

test("histórico distingue atendimento, falta e consulta ainda sem registro", () => {
  const row = { scheduled_at: "2026-11-25T12:00:00Z" };
  const before = new Date("2026-11-25T11:59:59Z");
  assert.equal(fromAppointmentRow({ ...row, status: "scheduled" }, before).status, "Agendada");
  for (const [status, label] of Object.entries({
    scheduled: "Aguardando registro", completed: "Atendida", no_show: "Paciente faltou",
  })) {
    const item = fromAppointmentRow({ ...row, status }, new Date(row.scheduled_at));
    assert.equal(item.status, label);
    assert.equal(isPastAppointmentStatus(item.status), true);
  }
  assert.equal(isPastAppointmentStatus("Cancelada"), false);
});

test("navegação médica cruza meses sem alterar o dia por fuso", () => {
  assert.equal(adjacentDay("2028-03-01", -1), "2028-02-29");
  assert.equal(adjacentDay("2026-12-31", 1), "2027-01-01");
  assert.equal(adjacentDay("9999-12-31", 1), null);
  assert.equal(adjacentDay("0001-01-01", -1), null);
  assert.equal(selectedDay("2026-02-29"), null);
});

test("conflito concorrente e falta de permissão têm mensagens acionáveis", () => {
  assert.match(appointmentError({ code: "23505" }), /outro horário/);
  assert.match(appointmentError({ code: "42501" }), /paciente/);
});
