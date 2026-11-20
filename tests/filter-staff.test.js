import test from "node:test";
import assert from "node:assert/strict";
import { filterStaff } from "../src/features/staff/filter-staff.js";

const staff = Object.freeze([
  Object.freeze({ profile_id: "a", full_name: "João Ávila", email: "joao@example.test", staff_role: "doctor", active: true }),
  Object.freeze({ profile_id: "b", full_name: "Ana Souza", email: "ana@example.test", staff_role: "doctor", active: false }),
  Object.freeze({ profile_id: "c", full_name: "Ana Lima", email: "recepcao@example.test", staff_role: "receptionist", active: true }),
  Object.freeze({ profile_id: "d", full_name: null, email: "admin@example.test", staff_role: "admin", active: true }),
]);
const ids = (options) => filterStaff(staff, options).map((member) => member.profile_id);

test("a lista inicial mantém todos os vínculos e a ordem recebida, sem alterar os registros", () => {
  const result = filterStaff(staff);
  assert.deepEqual(result, staff);
  assert.notEqual(result, staff);
  assert.equal(result[0], staff[0]);
});
test("busca ignora acentos, caixa e espaços extras e combina palavras", () => {
  assert.deepEqual(ids({ query: "  AVILA   joÃO " }), ["a"]);
  assert.deepEqual(ids({ query: "ana" }), ["b", "c"]);
  assert.deepEqual(ids({ query: "ana inexistente" }), []);
});
test("encontra e-mail parcial, inclusive de um vínculo sem nome", () => {
  assert.deepEqual(ids({ query: "ADMIN@EXAMPLE" }), ["d"]);
  assert.deepEqual(ids({ query: "recepcao" }), ["c"]);
});
test("combina busca, função e situação sem incluir registros de outro grupo", () => {
  assert.deepEqual(ids({ query: "ana", role: "doctor", status: "inactive" }), ["b"]);
  assert.deepEqual(ids({ query: "ana", role: "doctor", status: "active" }), []);
  assert.deepEqual(ids({ role: "receptionist", status: "active" }), ["c"]);
  assert.deepEqual(ids({ role: "admin" }), ["d"]);
});
test("limpar filtros restaura também inativos e trata lista vazia", () => {
  assert.deepEqual(ids({ status: "inactive" }), ["b"]);
  assert.deepEqual(ids({ query: "   ", role: "all", status: "all" }), ["a", "b", "c", "d"]);
  assert.deepEqual(filterStaff([], { query: "ana" }), []);
});
