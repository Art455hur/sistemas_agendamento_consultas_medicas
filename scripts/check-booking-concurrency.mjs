import EmbeddedPostgres from 'embedded-postgres';
import assert from 'node:assert/strict';
import {readFile,readdir,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
// Banco temporário local: este script não lê credenciais nem acessa o Supabase.
const root=fileURLToPath(new URL('../',import.meta.url));
const dir=await mkdtemp(join(tmpdir(),'booking-race-'));
const server=new EmbeddedPostgres({databaseDir:dir,user:'postgres',password:'local-test-only',port:55439,persistent:false,autoRehydrateSymlinks:true,postgresFlags:['-c','listen_addresses=127.0.0.1','-c','unix_socket_directories='],onLog:()=>{},onError:console.error});
const connections=[];let started=false;
try {
 await server.initialise(); await server.start();started=true;
 async function connect(){const c=server.getPgClient("postgres","127.0.0.1");await c.connect();connections.push(c);await c.query('set statement_timeout=10000');return c;}
 const admin=await connect();
 await admin.query(`create role anon nologin;create role authenticated nologin;create schema auth;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 for(const f of (await readdir(join(root,'supabase/migrations'))).sort())if(f.endsWith('.sql'))await admin.query(await readFile(join(root,'supabase/migrations',f),'utf8'));
 const ids=[1,2,3,4].map(n=>`00000000-0000-4000-8000-00000000000${n}`);
 for(const id of ids)await admin.query('insert into auth.users(id) values($1)',[id]);
 for(const id of ids.slice(2)){await admin.query("update public.profiles set role='doctor',full_name='Teste',specialty='Clínica Geral' where id=$1",[id]);await admin.query('insert into public.hospital_staff(profile_id,active) values($1,true)',[id]);}
 const day=(await admin.query("select ((now() at time zone 'America/Sao_Paulo')::date+1)::text as day")).rows[0].day;
 const at=t=>`${day}T${t}:00-03:00`;
 const a=await connect(),b=await connect();
 async function as(c,id){await c.query('reset role');await c.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await c.query('set role authenticated');}
 async function race(label,first,second){
   await a.query('begin');
   await first();
   const pid=(await b.query('select pg_backend_pid() as pid')).rows[0].pid;
   let settled=false;
   const result=second().then(()=>{settled=true;return null;},e=>{settled=true;return e;});
   let waiting=false;
   for(let i=0;i<100;i++){
     const row=(await admin.query('select wait_event_type from pg_stat_activity where pid=$1',[pid])).rows[0];
     if(row?.wait_event_type==='Lock'){waiting=true;break;}
     if(settled)break;
     await new Promise(r=>setTimeout(r,10));
   }
   assert.equal(waiting,true,'segunda conexão deve aguardar o bloqueio da primeira');
   await a.query('commit');
   assert.equal((await result)?.code,'23505');
   console.log('PASS:',label,'— segunda conexão aguardou o lock e foi rejeitada com 23505');
 }
 const create=(c,d,t)=>c.query('select * from public.create_patient_appointment($1,$2,$3)',[d,at(t),'Teste isolado']);
 await as(a,ids[0]);await as(b,ids[1]);
 await race('dois pacientes, mesmo médico/horário',()=>create(a,ids[2],'08:00'),()=>create(b,ids[2],'08:00'));
 assert.equal((await admin.query("select count(*)::int as n from appointments where status='scheduled'")).rows[0].n,1);
 await as(b,ids[0]);
 await race('mesmo paciente, médicos diferentes/mesmo horário',()=>create(a,ids[2],'09:00'),()=>create(b,ids[3],'09:00'));
 assert.equal((await admin.query("select count(*)::int as n from appointments where status='scheduled'")).rows[0].n,2);
 const original=(await a.query('select id from appointments where scheduled_at=$1',[at('08:00')])).rows[0].id;
 await as(b,ids[1]);
 await race('remarcação disputando horário com nova reserva',()=>a.query('select * from public.reschedule_patient_appointment($1,$2)',[original,at('10:30')]),()=>create(b,ids[2],'10:30'));
 assert.equal((await admin.query("select count(*)::int as n from appointments where status='scheduled' and scheduled_at=$1",[at('10:30')])).rows[0].n,1);
 console.log('3 disputas concorrentes verificadas em PostgreSQL isolado. Nenhuma alteração em produção.');
}finally{for(const c of connections)await c.end().catch(()=>{});if(started)await server.stop();}
