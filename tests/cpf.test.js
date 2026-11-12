import test from "node:test";
import assert from "node:assert/strict";
import { isValidCpf } from "../src/lib/cpf.js";

// Vetores numéricos de teste, sem associação a pessoas ou consulta cadastral.
test("aceita dígitos verificadores corretos, máscara e zero à esquerda", () => {
  for (const value of ["12345678909", "123.456.789-09", " 12345678909 ", "01234567890"]) {
    assert.equal(isValidCpf(value), true, value);
  }
});

test("rejeita todas as sequências de um único número repetido", () => {
  for (let digit = 0; digit <= 9; digit += 1) {
    assert.equal(isValidCpf(String(digit).repeat(11)), false);
  }
});

test("rejeita erro no primeiro ou no segundo dígito verificador", () => {
  for (const value of ["12345678919", "12345678900", "123.456.789-01"]) {
    assert.equal(isValidCpf(value), false, value);
  }
});

test("rejeita campos vazios, tipos inesperados, tamanhos e caracteres inválidos", () => {
  for (const value of [null, undefined, 12345678909, {}, "", "   ", "123", "1234567890", "123456789090", "abc12345678909", "123/456/789/09"]) {
    assert.equal(isValidCpf(value), false);
  }
});
