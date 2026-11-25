import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CLINIC_TIME_ZONE, clinicDateTime } from "@/features/appointments/appointment-format.js";
import { createClient } from "@/lib/supabase/server";
import ClinicalForm from "./ClinicalForm";
import { ExamPanel, VisitHistory } from "./ExamPanel";
import { validAppointmentId } from "./fields";
import styles from "./clinical.module.css";

export const metadata = { title: "Registro do atendimento | AgendaSaúde", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const clinicDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: CLINIC_TIME_ZONE, dateStyle: "short", timeStyle: "short",
});

function Unavailable({ denied }) {
  return <main className={styles.shell}><section className={styles.content}>
    <Link href="/medico" className={styles.back}>← Voltar à agenda</Link>
    <h1>Registro indisponível</h1>
    <p>{denied ? "Este registro é restrito ao médico responsável pelo atendimento."
      : "Não foi possível abrir o registro clínico. Tente novamente mais tarde."}</p>
  </section></main>;
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
  const day = clinicDateTime(note.scheduled_at).date;
  return <main className={styles.shell}>
    <section className={styles.content}>
      <Link className={styles.back} href={`/medico?dia=${day}`}>← Voltar à agenda</Link>
      <p className={styles.eyebrow}>AGENDASAÚDE · EQUIPE MÉDICA</p>
      <h1>Registro do atendimento</h1>
      <div className={styles.context}>
        <div>
          <strong>{note.patient_name?.trim() || "Paciente sem nome"}</strong>
          <p>{note.specialty} · <time dateTime={note.scheduled_at}>{clinicDate.format(new Date(note.scheduled_at))}</time></p>
        </div>
        <span>Atendida</span>
      </div>
      {salvo === "1" && note.revision > 0 && <p className={styles.success} role="status">Registro salvo com sucesso.</p>}
      <p className={styles.version}>{note.recorded_at
        ? <>Versão {note.revision} · atualizada em <time dateTime={note.recorded_at}>{clinicDate.format(new Date(note.recorded_at))}</time></>
        : "Nenhuma anotação salva para esta consulta."}</p>
      <ClinicalForm key={note.revision} id={id} revision={note.revision}
        initial={{ evolution: note.evolution ?? "", diagnosis: note.diagnosis ?? "", plan: note.plan ?? "" }} />
      <ExamPanel id={id} initial={exams.data} />
      <VisitHistory key={id} id={id} initial={history.data} />
    </section>
  </main>;
}
