"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon.js";
import { createClient } from "@/lib/supabase/client";
import styles from "./clinical.module.css";

const MAX_BYTES = 2097152;
const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];

function Files({ visit, items }) {
  return (
    <ul className={styles.examList}>
      {items.map((file) => (
        <li key={file.id} className={styles.examItem}>
          <span className={styles.fileIcon}><Icon name="file" /></span>
          <strong>{file.label}</strong>
          <a className={styles.downloadLink} download href={`/medico/atendimento/${visit}/exames/${file.id}`}
            aria-label={`Baixar exame: ${file.label}`}>
            <Icon name="download" size={17} /> Baixar exame
          </a>
        </li>
      ))}
    </ul>
  );
}

function fileProblem(file) {
  if (!file) return "";
  if (!ALLOWED.includes(file.type)) return "Formato não permitido. Escolha um arquivo PDF, JPEG ou PNG.";
  if (file.size > MAX_BYTES) return "Arquivo maior que 2 MB. Escolha um arquivo menor.";
  if (!file.size) return "O arquivo está vazio.";
  return "";
}

export function ExamPanel({ id, initial }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState(null);
  const router = useRouter();
  const problem = fileProblem(file);
  const count = initial?.length ?? 0;

  async function upload(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const name = label.trim();
    if (!name || !file || problem) {
      setMessage("Informe um nome e escolha um PDF, JPEG ou PNG de até 2 MB."); return;
    }
    setBusy(true);
    setMessage("");
    try {
      const hex = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parts = [];
      for (let i = 0; i < bytes.length; i += 8192) parts.push(Array.from(bytes.subarray(i, i + 8192), (b) => hex[b]).join(""));
      const slot = [1, 2, 3, 4, 5].find((n) => !initial.some((e) => e.slot === n));
      const { error } = await createClient().from("doctor_exam_files").insert({
        appointment_id: id, label: name, slot, mime: file.type, content: "\\x" + parts.join(""),
      });
      if (error) throw error;
      form.reset(); setLabel(""); setFile(null); setOpen(false);
      setMessage("Exame anexado."); router.refresh();
    } catch (e) {
      setMessage(e?.code === "23505" ? "A lista mudou. Confira os anexos e tente novamente."
        : "Não foi possível anexar. Confira o formato e tente novamente."); router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <section id="exames" className={`${styles.recordCard} ${styles.sideCard}`} aria-labelledby="exams-heading">
      <div className={styles.cardHeading}>
        <div>
          <span className={styles.sectionIcon}><Icon name="paperclip" /></span>
          <div>
            <h2 id="exams-heading">Exames desta consulta</h2>
            {initial !== null && <p>{count} de 5 arquivos anexados</p>}
          </div>
        </div>
        {initial !== null && count < 5 && (
          <button type="button" className="ui-button ui-button-secondary" onClick={() => { setOpen(!open); setLabel(""); setFile(null); }}
            aria-expanded={open} aria-controls="exam-upload">
            {open ? <><Icon name="close" size={16} /> Fechar</> : <><Icon name="upload" size={16} /> Anexar exame</>}
          </button>
        )}
      </div>

      {initial === null ? <p className={styles.muted}>Não foi possível carregar os exames.</p> : <>
        {open && count < 5 && (
          <form id="exam-upload" className={styles.uploadForm} onSubmit={upload}>
            <div className={styles.uploadInfo}>
              <Icon name="alert" size={18} />
              <span><strong>Antes de selecionar:</strong> PDF, JPEG ou PNG; até 2 MB por arquivo e até 5 arquivos por consulta.</span>
            </div>
            <div className={styles.field}>
              <label htmlFor="exam-label">Nome do exame</label>
              <input id="exam-label" name="label" maxLength={80} placeholder="Ex.: Hemograma completo" required
                value={label} onChange={(event) => setLabel(event.target.value)} disabled={busy} />
            </div>
            <div className={styles.field}>
              <label htmlFor="exam-file">Arquivo</label>
              <input id="exam-file" className={styles.fileInput} type="file" name="file" required disabled={busy}
                accept="application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </div>
            {file && (
              <div className={problem ? `${styles.selectedFile} ${styles.fileError}` : styles.selectedFile}>
                <Icon name={problem ? "alert" : "file"} size={19} />
                <span><strong>{file.name}</strong><small>{problem || "Arquivo pronto para anexar"}</small></span>
              </div>
            )}
            <div className={styles.formActions}>
              <button type="submit" className="ui-button ui-button-primary" disabled={busy || !label.trim() || !file || Boolean(problem)}>
                <Icon name="upload" size={17} /> {busy ? "Anexando..." : "Anexar exame"}
              </button>
              <span>Esta ação não salva as anotações.</span>
            </div>
          </form>
        )}
        {count ? <Files visit={id} items={initial} /> : <p className={styles.muted}>Nenhum exame anexado.</p>}
        {count >= 5 && <p className={styles.muted}>Limite de 5 exames atingido.</p>}
      </>}
      <p className={styles.statusMessage} role="status">{message}</p>
    </section>
  );
}

const longDate = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "long", year: "numeric" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short" });
const shortTime = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", timeStyle: "short" });

export function VisitHistory({ id, initial }) {
  const [more, setMore] = useState([]);
  const [end, setEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const visits = [...(initial || []), ...more];
  async function load() {
    setBusy(true); setError(false);
    try {
      const result = await createClient().rpc("doctor_visit_history", { p_id: id, p_offset: visits.length });
      if (result.error) throw result.error;
      setMore((old) => [...old, ...result.data]); setEnd(result.data.length < 5);
    } catch { setError(true); } finally { setBusy(false); }
  }
  return (
    <section id="historico" className={`${styles.recordCard} ${styles.sideCard}`} aria-labelledby="history-heading">
      <div className={styles.cardHeading}>
        <div>
          <span className={styles.sectionIcon}><Icon name="clock" /></span>
          <div>
            <h2 id="history-heading">Atendimentos anteriores</h2>
            <p>Com você, do mais recente ao mais antigo</p>
          </div>
        </div>
      </div>
      {initial === null ? <p className={styles.muted}>Não foi possível carregar o histórico.</p>
        : !visits.length ? <p className={styles.muted}>Primeiro atendimento deste paciente com você.</p>
        : visits.map(({ id: visit, note, exams }) => {
          const at = new Date(note.scheduled_at);
          const recorded = note.recorded_at ? new Date(note.recorded_at) : null;
          return (
            <article key={visit} className={styles.historyItem}>
              <div>
                <strong>{longDate.format(at)}</strong>
                <span className={styles.statusDoneSmall}><span aria-hidden="true">✓</span>Atendida</span>
              </div>
              <p>{shortTime.format(at)} • {note.specialty} • Hospital Sapiens</p>
              <details>
                <summary>Consultar registro anterior <Icon name="chevron" size={16} /></summary>
                <div className={styles.previousNote}>
                  <strong>Anotações do atendimento</strong>
                  <p>{note.evolution || "Nenhuma anotação salva."}</p>
                  {note.diagnosis && <><strong>Hipótese diagnóstica ou diagnóstico</strong><p>{note.diagnosis}</p></>}
                  {note.plan && <><strong>Conduta e orientações</strong><p>{note.plan}</p></>}
                  {recorded && <small>Versão {note.revision} • Salvo em {shortDate.format(recorded)} às {shortTime.format(recorded)}</small>}
                  {exams.length ? <Files visit={visit} items={exams} /> : <small className={styles.noExams}>Sem exames anexados.</small>}
                </div>
              </details>
            </article>
          );
        })}
      {initial?.length === 5 && !end && (
        <button type="button" className={`ui-button ui-button-secondary ${styles.moreButton}`} disabled={busy} onClick={load}>
          {busy ? "Carregando..." : "Ver mais atendimentos"}
        </button>
      )}
      {error && <p className={styles.formError} role="alert"><Icon name="alert" size={18} /> Não foi possível carregar. Tente novamente.</p>}
    </section>
  );
}
