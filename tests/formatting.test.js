import assert from "node:assert/strict";
import test from "node:test";
import { formatPhone, formatCpf } from "../src/shared/formatting/patient-fields.js";
import { formatDate } from "../src/shared/formatting/date.js";

test("telefone mantém digitação parcial, telefone fixo e celular", () => {
  for (const [input, expected] of [
    ["", ""], ["6", "(6"], ["65", "(65"], ["653", "(65) 3"],
    ["653333", "(65) 3333"], ["6533334444", "(65) 3333-4444"],
    ["65999998888", "(65) 99999-8888"],
  ]) assert.equal(formatPhone(input), expected);
  assert.equal(formatPhone("(65) 99999-8888"), "(65) 99999-8888");
  assert.equal(formatPhone("65999998888777"), "(65) 99999-8888");
});

test("máscara de CPF mantém zeros, entrada parcial e limite de onze dígitos", () => {
  for (const [input, expected] of [
    ["", ""], ["012", "012"], ["0123", "012.3"],
    ["0123456", "012.345.6"], ["01234567890", "012.345.678-90"],
    ["012.345.678-90", "012.345.678-90"], ["01234567890111", "012.345.678-90"],
  ]) assert.equal(formatCpf(input), expected);
});

test("data civil mantém o mesmo dia sem conversão de fuso", () => {
  assert.equal(formatDate("2026-11-12"), "12/11/2026");
  assert.equal(formatDate("2028-02-29"), "29/02/2028");
  assert.equal(formatDate(""), "");
  assert.equal(formatDate(undefined), undefined);
  assert.equal(formatDate("A definir"), "A definir");
});
