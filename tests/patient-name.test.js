import test from "node:test";
import assert from "node:assert/strict";
import { patientNameError } from "../src/shared/validation/patient-name.js";

test("nome aceita os limites de 3 e 120 caracteres após remover espaços externos", () => {
  for (const value of ["Ana", "  Ana  ", "A".repeat(120), `  ${"A".repeat(120)}  `]) {
    assert.equal(patientNameError(value), "");
  }
});

test("nome rejeita vazio, apenas espaços, menos de 3 e mais de 120 caracteres", () => {
  for (const value of ["", "   ", "A", "  Al  ", "A".repeat(121)]) {
    assert.equal(patientNameError(value), "Informe um nome entre 3 e 120 caracteres.");
  }
});

test("nome preserva suporte a acentos, apóstrofos e hífens", () => {
  for (const value of ["João", "D'Ávila", "Ana-Clara", "José da Silva"]) {
    assert.equal(patientNameError(value), "");
  }
});

test("nome retorna erro de validação para tipos inesperados", () => {
  for (const value of [undefined, null, 123, {}, []]) {
    assert.equal(patientNameError(value), "Informe um nome entre 3 e 120 caracteres.");
  }
});
