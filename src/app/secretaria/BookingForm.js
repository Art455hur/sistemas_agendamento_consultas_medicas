"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import Icon from "@/components/ui/Icon.js";
import { createClient } from "@/lib/supabase/client";
import { createAppointment } from "./actions";
import styles from "@/app/administracao/page.module.css";
import desk from "./secretaria.module.css";

const REASON_LIMIT = 500;
const normalize = (text) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
const longFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const longDate = (day) => longFormat.format(new Date(`${day}T12:00:00Z`));
const shortDate = (day) => day.split("-").reverse().join("/");

export function BookingHeading({ title = "Novo agendamento", text = "Preencha os dados na ordem abaixo." }) {
  return (
    <div className={desk.titleRow}>
      <div>
        <span className={styles.eyebrow}>AGENDAMENTO</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}

// Busca com lista de opções (paciente ou médico). A escolha aparece num cartão com "Trocar".
function Picker({ id, label, hint, placeholder, options, selected, onSelect, icon }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const matches = options.filter((option) => terms.every((term) => normalize(option.name).includes(term)));

  if (selected) {
    return (
      <div className={desk.selectedItem}>
        {icon ? <span className={desk.iconCircle}><Icon name={icon} size={17} /></span>
          : <span className={desk.miniAvatar}>{initials(selected.name)}</span>}
        <span><strong>{selected.name}</strong><small>{hint}</small></span>
        <button type="button" className={desk.changeButton} onClick={() => { onSelect(null); setQuery(""); }}>Trocar</button>
      </div>
    );
  }
  return <div className={desk.picker}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); } }}>
    <label className={desk.searchInput} htmlFor={id}>
      <Icon name="search" size={18} />
      <span className={desk.srOnly}>{label}</span>
      <input id={id} value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder={placeholder}
        autoComplete="off" maxLength={100} aria-expanded={open} aria-controls={`${id}-options`}
        onFocus={() => setOpen(true)} onClick={() => setOpen(true)} />
    </label>
    {open && (matches.length ? (
      <ul id={`${id}-options`} className={desk.optionList} aria-label={label}>
        {matches.map((option) => (
          <li key={option.id}>
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(option)}>
              {icon ? <span className={desk.iconCircle}><Icon name={icon} size={17} /></span>
                : <span className={desk.miniAvatar}>{initials(option.name)}</span>}
              <span><strong>{option.name}</strong><small>Clique para selecionar</small></span>
              <Icon name="chevron" size={16} />
            </button>
          </li>
        ))}
      </ul>
    ) : <p className={desk.slotHint} role="status">Nenhum cadastro ativo encontrado com esse nome.</p>)}
    {open && terms.length > 0 && matches.length > 0 && (
      <p className={desk.slotHint} role="status">{matches.length === 1 ? "1 cadastro encontrado" : `${matches.length} cadastros encontrados`}</p>
    )}
  </div>;
}

export default function BookingForm({ patients, doctors, initialDay, minDay, maxDay }) {
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [day, setDay] = useState(initialDay);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState("form");
  const [reload, setReload] = useState(0);
  const [slotsResult, setSlotsResult] = useState(null);

  const [state, submit, pending] = useActionState(async (previous, formData) => {
    const result = await createAppointment(previous, formData);
    if (result?.ok) setStep("done");
    if (result?.message) {
      setStep("form");
      setTime("");
      setReload((value) => value + 1);
    }
    return result;
  }, null);

  const validDay = Boolean(day && day >= minDay && day <= maxDay);
  const query = patient && doctor && validDay ? `${patient.id}:${doctor.id}:${day}:${reload}` : null;
  const loading = Boolean(query) && slotsResult?.query !== query;
  const slots = !loading && slotsResult && !slotsResult.error ? slotsResult.slots : [];

  useEffect(() => {
    if (!query) return undefined;
    let current = true;
    createClient().rpc("receptionist_booking_slots", { p_patient_id: patient.id, p_doctor_id: doctor.id, p_day: day })
      .then(({ data, error }) => {
        if (current) setSlotsResult({ query, slots: (data || []).map((entry) => entry.slot.slice(0, 5)), error: Boolean(error) });
      })
      .catch(() => { if (current) setSlotsResult({ query, slots: [], error: true }); });
    return () => { current = false; };
  }, [query, patient, doctor, day]);

  const complete = Boolean(patient && doctor && validDay && slots.includes(time));

  function confirm() {
    if (!complete || pending) return;
    const payload = new FormData();
    for (const [field, value] of Object.entries({ patientId: patient.id, doctorId: doctor.id, day, time, reason: reason.trim() })) {
      payload.set(field, value);
    }
    startTransition(() => submit(payload));
  }

  function restart() {
    setPatient(null); setDoctor(null); setTime(""); setReason(""); setStep("form");
    setReload((value) => value + 1);
  }

  if (step === "done" && state?.ok) {
    return <>
      <BookingHeading title="Agendamento confirmado" text="A consulta foi adicionada à agenda da clínica." />
      <div className={desk.successCard} role="status">
        <span className={desk.successCheck}><Icon name="check" size={32} /></span>
        <span className={styles.eyebrow}>TUDO CERTO</span>
        <h2>Consulta agendada com sucesso</h2>
        <p>
          {patient?.name} será atendido(a) por {doctor?.name} em <strong>{shortDate(state.day)}</strong>,
          {" "}às <strong>{state.time}</strong>.
        </p>
        <div className={desk.successActions}>
          <Link className="ui-button ui-button-primary" href={`/secretaria?dia=${state.day}`}>
            Ver na agenda do dia <Icon name="arrow" size={18} />
          </Link>
          <button type="button" className="ui-button ui-button-secondary" onClick={restart}>
            <Icon name="plus" size={18} /> Novo agendamento
          </button>
        </div>
      </div>
    </>;
  }

  if (step === "review") {
    return <>
      <BookingHeading text="Confira os dados antes de confirmar." />
      <div className={desk.reviewCard}>
        <span className={desk.reviewIcon}><Icon name="calendar" size={25} /></span>
        <h2>Resumo do agendamento</h2>
        <p>Verifique se todas as informações estão corretas.</p>
        <dl>
          <div><dt>Paciente</dt><dd>{patient.name}</dd></div>
          <div><dt>Médico</dt><dd>{doctor.name}</dd></div>
          <div><dt>Data</dt><dd>{longDate(day)}</dd></div>
          <div><dt>Horário</dt><dd>{time} <small>Horário de São Paulo</small></dd></div>
          {reason.trim() && <div className={desk.fullRow}><dt>Motivo</dt><dd>{reason.trim()}</dd></div>}
        </dl>
        <div className={desk.reviewActions}>
          <button type="button" className="ui-button ui-button-secondary" onClick={() => setStep("form")} disabled={pending}>
            Voltar e editar
          </button>
          <button type="button" className="ui-button ui-button-primary" onClick={confirm} disabled={pending}>
            {pending ? "Confirmando..." : <>Confirmar agendamento <Icon name="check" size={18} /></>}
          </button>
        </div>
      </div>
    </>;
  }

  return <>
    <BookingHeading />
    <div className={desk.formCard}>
      {state?.message && (
        <div className={desk.alert} role="alert">
          <strong>Não foi possível agendar</strong>
          <span>{state.message} Os demais dados foram mantidos.</span>
        </div>
      )}

      <div className={desk.fieldBlock}>
        <span className={desk.fieldNumber} aria-hidden="true">1</span>
        <div className={desk.fieldBody}>
          <p className={desk.blockLabel} id="booking-patient-label">Paciente ativo já cadastrado</p>
          <p className={desk.blockHint}>Busque pelo nome do paciente</p>
          <Picker id="booking-patient" label="Buscar paciente" hint="Paciente ativo" placeholder="Digite o nome do paciente"
            options={patients} selected={patient} onSelect={(value) => { setPatient(value); setTime(""); }} />
        </div>
      </div>

      <div className={desk.fieldBlock}>
        <span className={desk.fieldNumber} aria-hidden="true">2</span>
        <div className={desk.fieldBody}>
          <p className={desk.blockLabel}>Médico ativo</p>
          <p className={desk.blockHint}>Busque pelo nome do profissional</p>
          <Picker id="booking-doctor" label="Buscar médico" hint="Médico ativo" placeholder="Digite o nome do médico" icon="user"
            options={doctors} selected={doctor} onSelect={(value) => { setDoctor(value); setTime(""); }} />
        </div>
      </div>

      <div className={desk.fieldBlock}>
        <span className={desk.fieldNumber} aria-hidden="true">3</span>
        <div className={desk.fieldBody}>
          <label className={desk.blockLabel} htmlFor="booking-day">Data da consulta</label>
          <p className={desk.blockHint}>Horário de São Paulo</p>
          <input id="booking-day" className={desk.standaloneInput} type="date" min={minDay} max={maxDay} required
            value={day} onChange={(event) => { setTime(""); setDay(event.target.value); }} />
        </div>
      </div>

      <div className={patient && doctor && validDay ? desk.fieldBlock : `${desk.fieldBlock} ${desk.disabledBlock}`}>
        <span className={desk.fieldNumber} aria-hidden="true">4</span>
        <div className={desk.fieldBody}>
          <p className={desk.blockLabel}>Horário livre</p>
          <p className={desk.blockHint}>
            {!patient || !doctor ? "Escolha o paciente e o médico primeiro"
              : !validDay ? "Escolha uma data entre hoje e os próximos 12 meses"
              : `Disponibilidade de ${doctor.name} em ${shortDate(day)}`}
          </p>
          {query && (loading ? <p className={desk.slotHint} role="status">Consultando horários...</p>
            : slotsResult?.error ? <div className={desk.noTimes} role="alert">
              <strong>Não foi possível consultar os horários</strong>
              <button type="button" className="ui-button ui-button-secondary" onClick={() => setReload((value) => value + 1)}>
                <Icon name="refresh" size={16} /> Tentar novamente
              </button>
            </div>
            : slots.length ? <div className={desk.timeGrid} role="group" aria-label="Horários livres">
              {slots.map((slot) => (
                <button type="button" key={slot} aria-pressed={time === slot}
                  className={time === slot ? desk.timeSelected : undefined} onClick={() => setTime(slot)}>{slot}</button>
              ))}
            </div>
            : <div className={desk.noTimes}>
              <strong>Sem horários livres nesta data</strong>
              <span>Escolha outra data. O médico ou o paciente pode já ter consulta, ou o dia pode estar fora da grade.</span>
            </div>)}
        </div>
      </div>

      <div className={desk.fieldBlock}>
        <span className={desk.fieldNumber} aria-hidden="true">5</span>
        <div className={desk.fieldBody}>
          <label className={desk.blockLabel} htmlFor="booking-reason">Motivo <small>(opcional)</small></label>
          <textarea id="booking-reason" className={desk.standaloneInput} value={reason} maxLength={REASON_LIMIT} rows={3}
            onChange={(event) => setReason(event.target.value)} placeholder="Ex.: retorno, avaliação de sintomas..." />
          <small className={desk.charCount}>{reason.length}/{REASON_LIMIT}</small>
        </div>
      </div>

      <div className={desk.formFooter}>
        <span>Os dados serão revisados antes da confirmação.</span>
        <button type="button" className="ui-button ui-button-primary" disabled={!complete} onClick={() => setStep("review")}>
          Conferir agendamento <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  </>;
}
