import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("gestão administrativa integrada ao catálogo e consultas", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
    $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
  `);
  for (const name of (await readdir(new URL("../supabase/migrations/", import.meta.url))).sort()) {
    if (name.endsWith(".sql")) await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"));
  }
  const ids = {
    admin: "00000000-0000-4000-8000-000000000011", patient: "00000000-0000-4000-8000-000000000012",
    doctor: "00000000-0000-4000-8000-000000000013", candidate: "00000000-0000-4000-8000-000000000014",
    secretary: "00000000-0000-4000-8000-000000000015",
  };
  for (const [name, id] of Object.entries(ids)) await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${name}@example.test`]);
  await db.query("update public.profiles set role='admin',full_name='Administrador Teste' where id=$1", [ids.admin]);
  await db.query("insert into public.hospital_staff(profile_id) values($1)", [ids.admin]);
  async function actor(name) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids[name] || ""]);
    await db.exec(`set role ${name ? "authenticated" : "anon"}`);
  }
  const save = (name, role, fullName, specialty) => db.query("select public.admin_save_staff($1,$2,$3,$4)", [`${name}@example.test`, role, fullName, specialty]);
  const fails = (operation, code) => assert.rejects(operation, (error) => error.code === code);

  await t.test("anônimo e paciente não gerenciam funcionários", async () => {
    for (const name of ["", "patient"]) {
      await actor(name);
      await fails(save("doctor", "doctor", "Doutora Teste", "Cardiologia"), "42501");
      await fails(db.query("select * from public.admin_list_staff()"), "42501");
      await fails(db.query("select public.admin_reactivate_staff($1)", [ids.doctor]), "42501");
    }
  });
  await actor("admin");
  await t.test("valida nome e especialidade no banco, inclusive pelo endpoint antigo", async () => {
    await fails(save("candidate", "doctor", "Doutora Teste", " "), "22023");
    await fails(save("candidate", "doctor", "", "Cardiologia"), "22023");
    await fails(db.query("select public.admin_assign_staff($1,'doctor')", ["candidate@example.test"]), "22023");
    assert.equal((await db.query("select * from public.admin_list_staff()")).rows.length, 1);
  });
  await t.test("médico salvo pelo admin aparece no catálogo do paciente", async () => {
    await save("doctor", "doctor", "Doutora Teste", "Cardiologia");
    await actor("patient");
    const doctors = (await db.query("select * from public.booking_doctors()")).rows;
    assert.equal(doctors.length, 1);
    assert.deepEqual(doctors[0], { id: ids.doctor, full_name: "Doutora Teste", specialty: "Cardiologia" });
    await fails(db.query("update public.profiles set specialty='Outra' where id=$1", [ids.patient]), "42501");
  });
  let appointmentId;
  await t.test("consulta usa o nome e a especialidade cadastrados pelo administrador", async () => {
    const tomorrow = (await db.query("select ((now() at time zone 'America/Sao_Paulo')::date+1)::text as day")).rows[0].day;
    const slots = (await db.query("select * from public.booking_slots($1,$2,null)", [ids.doctor, tomorrow])).rows;
    assert.equal(slots.length, 5);
    const appointment = (await db.query("select * from public.create_patient_appointment($1,$2,'Teste integrado')", [ids.doctor, slots[0].scheduled_at])).rows[0];
    appointmentId = appointment.id;
    assert.equal(appointment.specialty, "Cardiologia");
    assert.equal(appointment.doctor_name, "Doutora Teste");
    assert.equal(new Date(appointment.scheduled_at).getUTCHours(), 11);
  });
  await t.test("desativação bloqueia catálogo e leitura do médico, preservando o paciente", async () => {
    await actor("doctor");
    assert.equal((await db.query("select * from public.appointments")).rows.length, 1);
    await actor("admin");
    await db.query("select public.admin_deactivate_staff($1)", [ids.doctor]);
    await actor("doctor");
    assert.equal((await db.query("select * from public.appointments")).rows.length, 0);
    await actor("patient");
    assert.equal((await db.query("select * from public.booking_doctors()")).rows.length, 0);
    assert.equal((await db.query("select id from public.appointments")).rows[0].id, appointmentId);
  });
  await t.test("reativar recupera o vínculo e catálogo sem modificar dados ou consultas", async () => {
    await actor("admin");
    await db.query("select public.admin_reactivate_staff($1)", [ids.doctor]);
    // Repetir a ação é seguro: não cria outro vínculo nem altera dados.
    await db.query("select public.admin_reactivate_staff($1)", [ids.doctor]);
    const members = (await db.query("select * from public.admin_list_staff()")).rows;
    assert.equal(members.filter((member) => member.profile_id === ids.doctor).length, 1);
    assert.equal(members.find((member) => member.profile_id === ids.doctor).active, true);
    await actor("patient");
    assert.deepEqual((await db.query("select * from public.booking_doctors()")).rows[0], {
      id: ids.doctor, full_name: "Doutora Teste", specialty: "Cardiologia",
    });
    assert.equal((await db.query("select id from public.appointments")).rows[0].id, appointmentId);
    await actor("doctor");
    assert.equal((await db.query("select * from public.appointments")).rows.length, 1);
  });
  await t.test("salvar atualiza médico sem alterar consultas antigas", async () => {
    await actor("admin");
    await save("doctor", "doctor", "Doutora Atualizada", "Dermatologia");
    await actor("patient");
    assert.equal((await db.query("select * from public.booking_doctors()")).rows[0].specialty, "Dermatologia");
    assert.equal((await db.query("select doctor_name from public.appointments")).rows[0].doctor_name, "Doutora Teste");
  });
  await t.test("secretaria não exige especialidade e papel com consultas não é trocado", async () => {
    await actor("admin");
    await save("secretary", "receptionist", "Secretaria Teste", null);
    await fails(save("doctor", "receptionist", "Doutora Teste", null), "23514");
    await fails(save("candidate", "admin", "Novo Admin", null), "22023");
    await fails(save("admin", "doctor", "Administrador Teste", "Clínica Geral"), "42501");
    await fails(db.query("select public.admin_deactivate_staff($1)", [ids.admin]), "42501");
    await fails(db.query("select public.admin_reactivate_staff($1)", [ids.admin]), "42501");
    await fails(db.query("select public.admin_reactivate_staff($1)", [ids.patient]), "42501");
    await fails(db.query("select public.admin_reactivate_staff($1)", ["00000000-0000-4000-8000-000000009999"]), "P0002");
    await db.query("select public.admin_deactivate_staff($1)", [ids.secretary]);
    await db.query("select public.admin_reactivate_staff($1)", [ids.secretary]);
    assert.equal((await db.query("select * from public.admin_list_staff()")).rows.find((member) => member.profile_id === ids.secretary).active, true);
  });
  await t.test("médico incompleto continua inativo e vínculo ausente não é criado", async () => {
    await db.exec("reset role");
    await db.query("update public.profiles set role='doctor',full_name='Médico incompleto',specialty=null where id=$1", [ids.candidate]);
    await db.query("insert into public.hospital_staff(profile_id,active) values($1,false)", [ids.candidate]);
    await actor("admin");
    await fails(db.query("select public.admin_reactivate_staff($1)", [ids.candidate]), "22023");
    assert.equal((await db.query("select * from public.admin_list_staff()")).rows.find((member) => member.profile_id === ids.candidate).active, false);
    await db.exec("reset role");
    await db.query("update public.profiles set specialty='Clínica Geral' where id=$1", [ids.candidate]);
    await db.query("delete from public.hospital_staff where profile_id=$1", [ids.candidate]);
    await actor("admin");
    await fails(db.query("select public.admin_reactivate_staff($1)", [ids.candidate]), "P0002");
  });
  await t.test("admin sem vínculo ativo perde o acesso às operações", async () => {
    await db.exec("reset role");
    await db.query("update public.hospital_staff set active=false where profile_id=$1", [ids.admin]);
    await actor("admin");
    await fails(save("candidate", "doctor", "Doutora Teste", "Cardiologia"), "42501");
    await fails(db.query("select public.admin_reactivate_staff($1)", [ids.doctor]), "42501");
  });
});
