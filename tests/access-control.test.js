import assert from "node:assert/strict";
import test from "node:test";

import {
  hasPermission,
  homeForRole,
  isAllowedRole,
  PERMISSIONS,
  ROLES,
} from "../src/features/auth/access-control.js";

test("cada perfil tem um destino próprio", () => {
  assert.equal(homeForRole(ROLES.PATIENT), "/dashboard");
  assert.equal(homeForRole(ROLES.DOCTOR), "/medico");
  assert.equal(homeForRole(ROLES.RECEPTIONIST), "/secretaria");
  assert.equal(homeForRole(ROLES.ADMIN), "/administracao");
});

test("somente administrador gerencia funcionários", () => {
  for (const role of [ROLES.PATIENT, ROLES.DOCTOR, ROLES.RECEPTIONIST]) {
    assert.equal(hasPermission(role, PERMISSIONS.MANAGE_STAFF), false);
  }
  assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.MANAGE_STAFF), true);
});

test("paciente não vê agenda da clínica e médico só vê a própria", () => {
  assert.equal(hasPermission(ROLES.PATIENT, PERMISSIONS.VIEW_CLINIC_SCHEDULE), false);
  assert.equal(hasPermission(ROLES.DOCTOR, PERMISSIONS.VIEW_CLINIC_SCHEDULE), false);
  assert.equal(hasPermission(ROLES.DOCTOR, PERMISSIONS.VIEW_OWN_SCHEDULE), true);
});

test("perfil desconhecido não recebe permissões", () => {
  assert.equal(isAllowedRole("owner"), false);
  assert.equal(hasPermission("owner", PERMISSIONS.MANAGE_STAFF), false);
  assert.equal(homeForRole("owner"), null);
});
