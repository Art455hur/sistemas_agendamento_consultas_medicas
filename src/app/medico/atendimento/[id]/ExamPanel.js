"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./exams.module.css";

function Files({ visit, items }) {
  return <ul>{items.map(file => <li key={file.id}><a download
    href={`/medico/atendimento/${visit}/exames/${file.id}`}>{file.label} · Baixar exame</a></li>)}</ul>;
}

export function ExamPanel({ id, initial }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function upload(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    const label = String(data.get("label") || "").trim();
    if (!label || !file?.size || file.size > 2097152 ||
      !["application/pdf","image/jpeg","image/png"].includes(file.type)) {
      setMessage("Informe um nome e escolha um PDF, JPEG ou PNG de até 2 MB."); return;
    }
    setBusy(true);
    try {
      const hex = Array.from({length:256}, (_, i) => i.toString(16).padStart(2, "0"));
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parts = [];
      for (let i=0; i<bytes.length; i+=8192) parts.push(Array.from(bytes.subarray(i,i+8192), b => hex[b]).join(""));
      const slot = [1,2,3,4,5].find(n => !initial.some(e => e.slot === n));
      const { error } = await createClient().from("doctor_exam_files").insert({
        appointment_id:id, label, slot, mime:file.type, content:"\\x" + parts.join(""),
      });
      if (error) throw error;
      form.reset(); setMessage("Exame anexado."); router.refresh();
    } catch (e) {
      setMessage(e?.code === "23505" ? "A lista mudou. Confira os anexos e tente novamente."
        : "Não foi possível anexar. Confira o formato e tente novamente."); router.refresh();
    } finally { setBusy(false); }
  }
  return <section className={styles.card}><h2>Exames desta consulta</h2>
    {initial === null ? <p>Não foi possível carregar os exames.</p> : <>
      {initial.length ? <Files visit={id} items={initial} /> : <p>Nenhum exame anexado.</p>}
      {initial.length < 5 ? <form onSubmit={upload}>
        <label>Nome do exame<input name="label" maxLength={80} placeholder="Ex.: Hemograma" required /></label>
        <label>Arquivo<input type="file" name="file" accept="application/pdf,image/jpeg,image/png" required /></label>
        <small>Opcional · PDF, JPEG ou PNG · até 2 MB por arquivo · até 5 por consulta</small>
        <button disabled={busy}>{busy ? "Anexando…" : "Anexar exame"}</button>
      </form> : <p>Limite de 5 exames atingido.</p>}
    </>}<p role="status">{message}</p></section>;
}

const date = new Intl.DateTimeFormat("pt-BR", {timeZone:"America/Sao_Paulo", dateStyle:"short", timeStyle:"short"});
export function VisitHistory({ id, initial }) {
  const [more, setMore] = useState([]);
  const [end, setEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const visits = [...(initial || []), ...more];
  async function load() {
    setBusy(true); setError(false);
    try {
      const result = await createClient().rpc("doctor_visit_history", { p_id:id, p_offset:visits.length });
      if (result.error) throw result.error;
      setMore(old => [...old, ...result.data]); setEnd(result.data.length < 5);
    } catch { setError(true); } finally { setBusy(false); }
  }
  return <section className={styles.card}><h2>Atendimentos anteriores</h2>
    {initial === null ? <p>Não foi possível carregar o histórico.</p> : !visits.length
      ? <p>Primeiro atendimento deste paciente com você.</p> : visits.map(({ id:visit, note, exams }) =>
        <details key={visit}><summary>{date.format(new Date(note.scheduled_at))} · {note.specialty}</summary>
          <p><b>Anotações:</b> {note.evolution || "Nenhuma anotação salva."}</p>
          {note.diagnosis && <p><b>Diagnóstico:</b> {note.diagnosis}</p>}
          {note.plan && <p><b>Conduta:</b> {note.plan}</p>}
          {exams.length ? <Files visit={visit} items={exams} /> : <p>Sem exames anexados.</p>}
        </details>)}
    {initial?.length === 5 && !end && <button disabled={busy} onClick={load}>Ver mais atendimentos</button>}
    {error && <p role="alert">Não foi possível carregar. Tente novamente.</p>}
  </section>;
}
