import Link from "next/link";
import { redirect } from "next/navigation";
import { clinicDateTime } from "@/features/appointments/appointment-format.js";
import { AVAILABILITY_SLOTS } from "@/features/appointments/availability.js";
import { createClient } from "@/lib/supabase/server";
import { resetAvailability, saveAvailability } from "./actions";
import styles from "./page.module.css";

export const metadata = { title: "Horários dos médicos | AgendaSaúde" };
export const dynamic = "force-dynamic";

const messages = {
  salvo: "Horários deste médico e dia atualizados.",
  restaurado: "Grade padrão restaurada para este dia.",
  ocupado: "Há consulta agendada em um dos horários removidos. Mantenha esse horário selecionado.",
  invalido: "Confira o médico, o dia e os horários escolhidos. Só é possível editar hoje ou os próximos 365 dias.",
  negado: "Seu acesso administrativo não está ativo.",
  indisponivel: "A autenticação não está ativada.",
  erro: "Não foi possível salvar. Verifique se a migração de horários já foi aplicada.",
};

function validDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export default async function DoctorHoursPage({ searchParams }) {
  if (process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return <main className={styles.state}><h1>Painel indisponível</h1><p>Ative a autenticação para gerenciar horários.</p><Link href="/">Voltar</Link></main>;
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims?.sub) redirect("/login?redirect=%2Fadministracao%2Fhorarios");
  const { data: ownProfile } = await supabase.from("profiles").select("role").eq("id", authData.claims.sub).single();
  const { data: ownLink } = await supabase.from("hospital_staff").select("active")
    .eq("profile_id", authData.claims.sub).eq("hospital_id", 1).single();
  if (ownProfile?.role !== "admin" || !ownLink?.active) {
    return <main className={styles.state}><h1>Acesso não autorizado</h1><p>Somente administradores ativos podem gerenciar horários.</p><Link href="/dashboard">Voltar</Link></main>;
  }

  const { medico, dia, resultado } = await searchParams;
  const today = clinicDateTime(new Date()).date;
  const day = validDay(dia) ? dia : today;
  const { data: staff, error: staffError } = await supabase.rpc("admin_list_staff");
  const doctors = (staff || []).filter((person) => person.staff_role === "doctor" && person.active);
  const doctor = doctors.find((person) => person.profile_id === medico) || doctors[0];
  const selection = doctor ? await supabase.rpc("admin_get_doctor_day", {
    p_doctor_id: doctor.profile_id, p_day: day,
  }) : { data: [], error: null };
  const selectedSlots = (selection.data?.[0]?.slots || []).map((slot) => slot.slice(0, 5));
  const booked = (selection.data?.[0]?.booked || []).map((slot) => slot.slice(0, 5));

  return (
    <main className={styles.layout}>
      <Link href="/administracao" className={styles.back}>← Voltar à administração</Link>
      <header><span className={styles.eyebrow}>GESTÃO DA CLÍNICA</span><h1>Horários dos médicos</h1>
        <p>Configure os horários de atendimento de cada médico para uma data. A agenda de consultas continua somente para leitura.</p>
      </header>
      {messages[resultado] && <p className={styles.notice} role="status">{messages[resultado]}</p>}
      {staffError ? <p className={styles.notice} role="alert">Não foi possível carregar os médicos.</p> :
        doctors.length === 0 ? <p className={styles.notice}>Cadastre e ative um médico na seção Equipe antes de configurar horários.</p> : <>
          <form className={styles.filter} method="get" action="/administracao/horarios">
            <label>Médico
              <select name="medico" defaultValue={doctor.profile_id}>
                {doctors.map((person) => <option value={person.profile_id} key={person.profile_id}>{person.full_name || person.email}</option>)}
              </select>
            </label>
            <label>Dia da clínica (São Paulo)
              <input name="dia" type="date" defaultValue={day} required />
            </label>
            <button type="submit">Consultar</button>
          </form>
          {selection.error ? <p className={styles.notice} role="alert">Não foi possível consultar horários. Confira se a migração de horários foi aplicada.</p> : <>
            <section className={styles.panel} aria-labelledby="day-heading">
              <h2 id="day-heading">Disponibilidade em {day.split("-").reverse().join("/")}</h2>
              <p>{selection.data?.[0]?.customized ? "Grade personalizada para este dia." : "Grade padrão da clínica para este dia."} Desmarque horários sem atendimento; para fechar o dia, desmarque todos.</p>
              <form action={saveAvailability}>
                <input type="hidden" name="doctorId" value={doctor.profile_id} />
                <input type="hidden" name="day" value={day} />
                <div className={styles.slots}>
                  {AVAILABILITY_SLOTS.map((time) => <label key={`${doctor.profile_id}-${day}-${time}`}>
                    <input type="checkbox" name="slots" value={time} defaultChecked={selectedSlots.includes(time)} />
                    <span>{time}</span>{booked.includes(time) && <small>Consulta agendada</small>}
                  </label>)}
                </div>
                <button type="submit">Salvar horários</button>
              </form>
              {selection.data?.[0]?.customized && <form action={resetAvailability} className={styles.reset}>
                <input type="hidden" name="doctorId" value={doctor.profile_id} />
                <input type="hidden" name="day" value={day} />
                <button type="submit">Restaurar grade padrão</button>
              </form>}
              <p className={styles.hint}>Escolha horários de 30 em 30 minutos, das 08:00 às 17:30. Consultas já agendadas não são canceladas; horários ocupados precisam permanecer selecionados.</p>
            </section>
          </>}
        </>}
    </main>
  );
}
