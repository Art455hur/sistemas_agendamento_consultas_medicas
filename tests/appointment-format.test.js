import test from "node:test";
import assert from "node:assert/strict";
import { clinicDateTime, fromAppointmentRow, appointmentError } from "../src/features/appointments/appointment-format.js";

test("a data da clínica não muda com o fuso do aparelho", () => {
  assert.deepEqual(clinicDateTime("2026-11-12T02:30:00Z"), { date: "2026-11-11", time: "23:30" });
});

test("cancelamento tem precedência sobre data passada no histórico", () => {
  const row = { id: "1", doctor_id: "2", doctor_name: "Dra. Teste", scheduled_at: "2026-11-12T12:00:00Z", status: "cancelled" };
  const item = fromAppointmentRow(row, new Date("2027-01-01"));
  assert.equal(item.status, "Cancelada");
  assert.equal(item.doctor, "Dra. Teste");
  assert.equal(item.time, "09:00");
  assert.equal(fromAppointmentRow({ ...row, status: "scheduled" }, new Date("2027-01-01")).status, "Concluída");
  assert.equal(row.status, "cancelled");
});

test("conflito concorrente e falta de permissão têm mensagens acionáveis", () => {
  assert.match(appointmentError({ code: "23505" }), /outro horário/);
  assert.match(appointmentError({ code: "42501" }), /paciente/);
});
