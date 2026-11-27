import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CLINIC_TIME_ZONE, clinicDateTime } from "@/features/appointments/appointment-format.js";
import { createClient } from "@/lib/supabase/server";
import StaffShell from "@/components/layout/StaffShell.js";
import Icon from "@/components/ui/Icon.js";
import ClinicalForm from "./ClinicalForm";
import { ExamPanel, VisitHistory } from "./ExamPanel";
import { validAppointmentId } from "./fields";
import styles from "./clinical.module.css";

export const metadata = { title: "Registro do atendimento | AgendaSaúde", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const shortDate = new Intl.DateTimeFormat("pt-BR", { timeZone: CLINIC_TIME_ZONE, dateStyle: "short" });
const shortTime = new Intl.DateTimeFormat("pt-BR", { timeZone: CLINIC_TIME_ZONE, timeStyle: "short" });
const longDay = new Intl.DateTimeFormat("pt-BR", { timeZone: CLINIC_TIME_ZONE, weekday: "long", day: "numeric", month: "long" });

function Shell({ children }) {
  return (
    <StaffShell
      role="Médico"
      navigationLabel="Navegação do médico"
      breadcrumb="Registro do atendimento"
      navigation={[{ href: "/medico", label: "Minha agenda", icon: "calendar", current: true }]}
    >
      <main className={styles.page}>{children}</main>
    </StaffShell>
  );
}

function Unavailable({ denied }) {
  return <Shell>
    <Link href="/medico" className={styles.back}><Icon name="back" size={18} /> Voltar à agenda</Link>
    <section className={styles.unavailable}>
      <span className={styles.sectionIcon}><Icon name="alert" /></span>
      <h1>Registro indisponível</h1>
      <p>{denied ? "Este registro é restrito ao médico responsável pelo atendimento."
        : "Não foi possível abrir o registro clínico. Tente novamente mais tarde."}</p>
    </section>
  </Shell>;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

export default async function ClinicalNotePage({ params, searchParams }) {
  const { id } = await params;
  if (!validAppointmentId(id)) notFound();
  if (process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return <Unavailable />;

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) redirect(`/login?${new URLSearchParams({ redirect: `/medico/atendimento/${id}` })}`);

  const { data: note, error } = await supabase.rpc("doctor_get_clinical_note", { p_id: id });
  if (error || !note) return <Unavailable denied={error?.code === "42501" || error?.code === "P0002"} />;

  const { salvo } = await searchParams;
  const [exams, history] = await Promise.all([
    supabase.from("doctor_exam_files").select("id,label,slot").eq("appointment_id", id).order("slot"),
    supabase.rpc("doctor_visit_history", { p_id: id, p_offset: 0 }),
  ]);
  const scheduledAt = new Date(note.scheduled_at);
  const day = clinicDateTime(note.scheduled_at).date;
  const dayText = longDay.format(scheduledAt);
  const patient = note.patient_name?.trim() || "Paciente sem nome";
  const savedAt = note.recorded_at ? new Date(note.recorded_at) : null;
  const saved = salvo === "1" && note.revision > 0 && savedAt
    ? `Versão ${note.revision} • Atualizado em ${shortDate.format(savedAt)} às ${shortTime.format(savedAt)}.${note.revision > 1 ? " A versão anterior foi preservada." : ""}`
    : null;

  return <Shell>
    <Link className={styles.back} href={`/medico?dia=${day}`}>
      <Icon name="back" size={18} /> Voltar à agenda <span>• {dayText[0].toUpperCase() + dayText.slice(1)}</span>
    </Link>

    <section className={styles.patientBanner}>
      <div className={styles.patientIdentity}>
        <span className={styles.largeAvatar} aria-hidden="true">{initials(patient)}</span>
        <div>
          <span className={styles.bannerEyebrow}>REGISTRO DO ATENDIMENTO</span>
          <h1>{patient}</h1>
          {note.specialty && <p>{note.specialty}</p>}
        </div>
      </div>
      <div className={styles.visitDetails}>
        <span><Icon name="calendar" size={17} /><small>Data</small><strong>{shortDate.format(scheduledAt)}</strong></span>
        <span><Icon name="clock" size={17} /><small>Horário</small><strong><time dateTime={note.scheduled_at}>{shortTime.format(scheduledAt)}</time></strong></span>
        <span className={styles.statusDone}><span aria-hidden="true">✓</span>Atendida</span>
      </div>
    </section>

    <nav className={styles.sectionTabs} aria-label="Seções do atendimento">
      <a href="#anotacoes"><Icon name="note" size={17} /> Anotações</a>
      <a href="#exames"><Icon name="paperclip" size={17} /> Exames</a>
      <a href="#historico"><Icon name="clock" size={17} /> Anteriores</a>
    </nav>

    <div className={styles.recordLayout}>
      <ClinicalForm key={note.revision} id={id} revision={note.revision} saved={saved}
        initial={{ evolution: note.evolution ?? "", diagnosis: note.diagnosis ?? "", plan: note.plan ?? "" }} />
      <div className={styles.supportingColumn}>
        <ExamPanel id={id} initial={exams.data} />
        <VisitHistory key={id} id={id} initial={history.data} />
      </div>
    </div>
  </Shell>;
}
