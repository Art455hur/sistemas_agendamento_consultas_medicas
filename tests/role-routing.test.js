import assert from "node:assert/strict";
import test from "node:test";

import { ROLES } from "../src/features/auth/access-control.js";
import {
  canAccessPath,
  destinationFor,
  effectiveRole,
  isProtectedPath,
  loadAccess,
  requestedFromLoginParams,
} from "../src/features/auth/role-routing.js";

const patient = { role: ROLES.PATIENT, staffActive: false };
const doctor = { role: ROLES.DOCTOR, staffActive: true };
const receptionist = { role: ROLES.RECEPTIONIST, staffActive: true };
const admin = { role: ROLES.ADMIN, staffActive: true };

test("login único abre a página inicial de cada perfil", () => {
  assert.equal(destinationFor(patient, null), "/dashboard");
  assert.equal(destinationFor(doctor, null), "/medico");
  assert.equal(destinationFor(receptionist, null), "/secretaria");
  assert.equal(destinationFor(admin, null), "/administracao");
});

test("funcionário sem vínculo ativo e perfil desconhecido não recebem destino", () => {
  for (const access of [
    { role: ROLES.DOCTOR, staffActive: false },
    { role: ROLES.RECEPTIONIST },
    { role: ROLES.ADMIN, staffActive: "true" },
    { role: "owner", staffActive: true },
    { role: null },
    null,
  ]) {
    assert.equal(effectiveRole(access), null);
    assert.equal(destinationFor(access, "/dashboard"), null);
  }
});

test("retorno a link interno é preservado só quando o perfil pode abri-lo", () => {
  assert.equal(destinationFor(doctor, "/medico?dia=2026-11-25"), "/medico?dia=2026-11-25");
  assert.equal(destinationFor(doctor, "/medico/atendimento/12"), "/medico/atendimento/12");
  assert.equal(destinationFor(admin, "/administracao/horarios?dia=2026-11-25"), "/administracao/horarios?dia=2026-11-25");
  assert.equal(destinationFor(patient, "/agendamentos?aba=cancelled#c-1"), "/agendamentos?aba=cancelled#c-1");
  assert.equal(destinationFor(patient, "/administracao"), "/dashboard");
  assert.equal(destinationFor(receptionist, "/medico"), "/secretaria");
  assert.equal(destinationFor(doctor, "/dashboard"), "/medico");
  assert.equal(destinationFor(admin, "/secretaria"), "/administracao");
  assert.equal(destinationFor(doctor, "/medicos-falsos"), "/medico");
});

test("retorno externo ou ambíguo é ignorado", () => {
  for (const value of ["https://evil.test/medico", "//evil.test", "/\\evil.test", "/%2fevil"]) {
    assert.equal(destinationFor(doctor, value), "/medico");
  }
});

test("cada área pertence a um único perfil", () => {
  assert.equal(canAccessPath(ROLES.PATIENT, "/agendar"), true);
  assert.equal(canAccessPath(ROLES.DOCTOR, "/agendar"), false);
  assert.equal(canAccessPath(ROLES.ADMIN, "/medico"), false);
  assert.equal(isProtectedPath("/medico/atendimento/1"), true);
  assert.equal(isProtectedPath("/login"), false);
  assert.equal(isProtectedPath("/medicos"), false);
});

test("parâmetros do login viram o destino pedido", () => {
  assert.equal(requestedFromLoginParams(new URLSearchParams("redirect=%2Fsecretaria%3Fdia%3D2026-11-25")), "/secretaria?dia=2026-11-25");
  assert.equal(
    requestedFromLoginParams(new URLSearchParams("especialidade=Cardiologia&profissional=Dra.+Ana")),
    "/agendar?especialidade=Cardiologia&profissional=Dra.+Ana",
  );
  assert.equal(requestedFromLoginParams(new URLSearchParams("redirect=https%3A%2F%2Fevil.test")), null);
  assert.equal(requestedFromLoginParams(new URLSearchParams("")), null);
});

function fakeSupabase(tables) {
  const calls = [];
  return {
    calls,
    from(table) {
      const filters = {};
      const query = {
        select() { return query; },
        eq(column, value) { filters[column] = value; return query; },
        async maybeSingle() {
          calls.push({ table, filters: { ...filters } });
          return tables[table](filters);
        },
      };
      return query;
    },
  };
}

test("papel e vínculo são lidos no banco pelo ID da sessão", async () => {
  const supabase = fakeSupabase({
    profiles: ({ id }) => ({ data: { role: id === "u-medico" ? ROLES.DOCTOR : ROLES.PATIENT }, error: null }),
    hospital_staff: () => ({ data: { active: true }, error: null }),
  });
  assert.deepEqual(await loadAccess(supabase, "u-medico"), { role: ROLES.DOCTOR, staffActive: true });
  assert.deepEqual(supabase.calls, [
    { table: "profiles", filters: { id: "u-medico" } },
    { table: "hospital_staff", filters: { profile_id: "u-medico", hospital_id: 1 } },
  ]);

  assert.deepEqual(await loadAccess(supabase, "u-paciente"), { role: ROLES.PATIENT, staffActive: false });
  assert.equal(supabase.calls.length, 3, "paciente não consulta vínculo de funcionário");
});

test("vínculo ausente ou inativo não libera painel; erro de leitura é informado", async () => {
  const missing = fakeSupabase({
    profiles: () => ({ data: { role: ROLES.RECEPTIONIST }, error: null }),
    hospital_staff: () => ({ data: null, error: null }),
  });
  assert.equal(effectiveRole(await loadAccess(missing, "u")), null);

  const failing = fakeSupabase({
    profiles: () => ({ data: null, error: { message: "falha" } }),
  });
  assert.ok((await loadAccess(failing, "u")).error);
  assert.deepEqual(await loadAccess(failing, null), { role: null, staffActive: false });
});
