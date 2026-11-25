import test from "node:test";
import assert from "node:assert/strict";
import { parseClinicalFields, validAppointmentId } from "../src/app/medico/atendimento/[id]/fields.js";

test("registro normaliza campos opcionais sem perder quebras de linha", () => {
  const form = new FormData();
  form.set("evolution", "  Linha 1\r\nLinha 2  ");
  form.set("plan", " ");
  assert.deepEqual(parseClinicalFields(form), { evolution: "Linha 1\nLinha 2", diagnosis: null, plan: null });
});

test("registro rejeita evolução vazia, campos grandes e arquivos nos campos de texto", () => {
  const form = new FormData();
  form.set("evolution", " \n ");
  assert.equal(parseClinicalFields(form), null);
  form.set("evolution", "Registro fictício");
  form.set("diagnosis", "a".repeat(2001));
  assert.equal(parseClinicalFields(form), null);
  form.set("diagnosis", new Blob(["teste"]));
  assert.equal(parseClinicalFields(form), null);
  assert.equal(validAppointmentId("00000000-0000-4000-8000-000000000001"), true);
  assert.equal(validAppointmentId("../secretaria"), false);
});
