import Link from "next/link";
import { redirect } from "next/navigation";
import { clinicDateTime } from "@/features/appointments/appointment-format.js";
import { AVAILABILITY_SLOTS } from "@/features/appointments/availability.js";
import { createClient } from "@/lib/supabase/server";
import { resetAvailability, saveAvailability } from "./actions";
import styles from "./page.module.css";
import StaffShell from "@/components/layout/StaffShell.js";
import Icon from "@/components/ui/Icon.js";

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

const periods = [
  { label: "Manhã", range: "08:00 às 11:30", match: (time) => time < "12:00" },
  { label: "Tarde", range: "12:00 às 17:30", match: (time) => time >= "12:00" },
];

const dayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function dayLabel(day) {
  return dayFormat.format(new Date(`${day}T12:00:00Z`)).toUpperCase();
}

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
    <StaffShell role="Administrador" navigationLabel="Navegação administrativa" breadcrumb="Horários" navigation={[
        { href: "/administracao", label: "Visão geral", icon: "home" },
        { href: "/administracao/pacientes", label: "Pacientes", icon: "user" },
        { href: "/administracao?aba=equipe", label: "Equipe", icon: "users" },
        { href: "/administracao?aba=especialidades", label: "Especialidades", icon: "tag" },
        { href: "/administracao?aba=agenda", label: "Agenda", icon: "calendar" },
        { href: "/administracao/horarios", label: "Horários", icon: "clock", current: true },
        { label: "Serviços", icon: "briefcase", disabled: true, note: "Em breve" },
      ]}>
    <main className={styles.layout}>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>OPERAÇÃO DA CLÍNICA</span>
        <h1>Horários dos médicos</h1>
        <p>Configure quando cada médico está disponível. Consultas já marcadas permanecem protegidas.</p>
      </header>
      {messages[resultado] && <p className={styles.notice} role="status">{messages[resultado]}</p>}
      {staffError ? <p className={styles.notice} role="alert">Não foi possível carregar os médicos.</p> :
        doctors.length === 0 ? <p className={styles.notice}>Cadastre e ative um médico na seção Equipe antes de configurar horários.</p> : <>
          <form className={`${styles.panel} ${styles.controls}`} method="get" action="/administracao/horarios">
            <label>Médico
              <select name="medico" defaultValue={doctor.profile_id}>
                {doctors.map((person) => <option value={person.profile_id} key={person.profile_id}>{person.full_name || person.email}</option>)}
              </select>
            </label>
            <label>Data
              <input name="dia" type="date" defaultValue={day} required />
            </label>
            <div className={styles.timezone}>
              <Icon name="clock" size={18} />
              <span><small>Horário da clínica</small><strong>São Paulo (UTC−3)</strong></span>
            </div>
            <button type="submit" className="ui-button ui-button-primary">Consultar</button>
          </form>
          {selection.error ? <p className={styles.notice} role="alert">Não foi possível consultar horários. Confira se a migração de horários foi aplicada.</p> : (
            <section className={`${styles.panel} ${styles.slotsPanel}`} aria-labelledby="day-heading">
              <div className={styles.slotsHead}>
                <div>
                  <span className={styles.eyebrow}>{dayLabel(day)}</span>
                  <h2 id="day-heading">Grade de disponibilidade</h2>
                  <p>
                    {selection.data?.[0]?.customized ? "Grade personalizada para este dia." : "Grade padrão da clínica para este dia."}
                    {" "}Marque os horários em que {doctor.full_name || "o médico"} atende; para fechar o dia, desmarque todos.
                  </p>
                </div>
                <div className={styles.legend} aria-hidden="true">
                  <span><i className={styles.dotAvailable} />Disponível</span>
                  <span><i className={styles.dotUnavailable} />Sem atendimento</span>
                  <span><i className={styles.dotOccupied} />Já agendado</span>
                </div>
              </div>
              <form action={saveAvailability}>
                <input type="hidden" name="doctorId" value={doctor.profile_id} />
                <input type="hidden" name="day" value={day} />
                {periods.map((period) => (
                  <fieldset className={styles.period} key={period.label}>
                    <legend>{period.label} <small>{period.range}</small></legend>
                    <div className={styles.slotGrid}>
                      {AVAILABILITY_SLOTS.filter(period.match).map((time) => booked.includes(time) ? (
                        <div className={`${styles.slot} ${styles.slotOccupied}`} key={`${doctor.profile_id}-${day}-${time}`}>
                          {/* Horário ocupado continua salvo na grade; não pode ser desmarcado. */}
                          <input type="hidden" name="slots" value={time} />
                          <strong>{time}</strong>
                          <span><Icon name="check" size={12} /> Já agendado</span>
                        </div>
                      ) : (
                        <label className={styles.slot} key={`${doctor.profile_id}-${day}-${time}`}>
                          <input type="checkbox" name="slots" value={time} defaultChecked={selectedSlots.includes(time)} />
                          <strong>{time}</strong>
                          <span className={styles.slotOn}>Disponível</span>
                          <span className={styles.slotOff}>Sem atendimento</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <div className={styles.slotActions}>
                  <button type="submit" className="ui-button ui-button-primary">Salvar horários</button>
                </div>
              </form>
              {selection.data?.[0]?.customized && <form action={resetAvailability} className={styles.reset}>
                <input type="hidden" name="doctorId" value={doctor.profile_id} />
                <input type="hidden" name="day" value={day} />
                <button type="submit" className="ui-button ui-button-secondary">Restaurar grade padrão</button>
              </form>}
              <p className={styles.hint}>Horários de 30 em 30 minutos, das 08:00 às 17:30. Horários com consulta agendada ficam travados e não são cancelados.</p>
            </section>
          )}
        </>}
    </main>
    </StaffShell>
  );
}
