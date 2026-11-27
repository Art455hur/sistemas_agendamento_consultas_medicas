"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBookingDoctors } from "@/features/appointments/services/appointments.js";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import PatientShell from "@/components/layout/PatientShell.js";
import DashboardData from "@/features/appointments/components/DashboardData.js";
import Icon from "@/components/ui/Icon.js";
import { useSavedProfile } from "@/features/profile/hooks/useSavedProfile.js";

const demoSpecialties = [
  {
    name: "Clínica Geral",
    icon: "🩺",
    total: 12,
  },
  {
    name: "Cardiologia",
    icon: "❤️",
    total: 8,
  },
  {
    name: "Dermatologia",
    icon: "🧴",
    total: 10,
  },
  {
    name: "Ortopedia",
    icon: "🦴",
    total: 7,
  },
  {
    name: "Pediatria",
    icon: "🧒",
    total: 6,
  },
  {
    name: "Ginecologia",
    icon: "🌸",
    total: 5,
  },
  {
    name: "Neurologia",
    icon: "🧠",
    total: 4,
  },
  {
    name: "Oftalmologia",
    icon: "👁️",
    total: 7,
  },
];

const demoDoctors = [
  {
    name: "Dr. Rafael Almeida",
    initials: "RA",
    specialty: "Clínica Geral",
    rating: "4.9",
    availability: "Disponível hoje",
  },
  {
    name: "Dra. Mariana Silva",
    initials: "MS",
    specialty: "Cardiologia",
    rating: "4.8",
    availability: "Disponível amanhã",
  },
  {
    name: "Dra. Camila Rodrigues",
    initials: "CR",
    specialty: "Dermatologia",
    rating: "4.9",
    availability: "Disponível hoje",
  },
  {
    name: "Dr. Lucas Ferreira",
    initials: "LF",
    specialty: "Ortopedia",
    rating: "4.8",
    availability: "Disponível amanhã",
  },
  {
    name: "Dra. Juliana Costa",
    initials: "JC",
    specialty: "Pediatria",
    rating: "4.9",
    availability: "Disponível hoje",
  },
  {
    name: "Dra. Fernanda Lima",
    initials: "FL",
    specialty: "Ginecologia",
    rating: "4.8",
    availability: "Disponível amanhã",
  },
  {
    name: "Dr. Paulo Mendes",
    initials: "PM",
    specialty: "Neurologia",
    rating: "4.9",
    availability: "Disponível hoje",
  },
  {
    name: "Dra. Beatriz Alves",
    initials: "BA",
    specialty: "Oftalmologia",
    rating: "4.7",
    availability: "Disponível amanhã",
  },
];

export default function Dashboard() {
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(isSupabaseConfigured());
  const [catalogError, setCatalogError] = useState("");
  const realBooking = isSupabaseConfigured();
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    getBookingDoctors().then((items) => { if (active) setCatalog(items); })
      .catch((failure) => { if (active) setCatalogError(failure.message); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, []);
  const doctors = realBooking ? catalog.map((item) => ({
    id: item.id, name: item.full_name, specialty: item.specialty,
    initials: item.full_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join(""),
    availability: "Consultar horários",
  })) : demoDoctors;
  const specialties = realBooking ? [...new Set(catalog.map((item) => item.specialty))].map((name) => ({
    name, icon: "🩺", total: catalog.filter((item) => item.specialty === name).length,
  })) : demoSpecialties;
  const [showAllSpecialties, setShowAllSpecialties] =
    useState(false);

  const [showAllDoctors, setShowAllDoctors] =
    useState(false);

  const visibleSpecialties =
    showAllSpecialties
      ? specialties
      : specialties.slice(0, 4);

  const visibleDoctors =
    showAllDoctors
      ? doctors
      : doctors.slice(0, 3);

  const profile = useSavedProfile();
  const firstName = profile.name && profile.name !== "Usuário" ? profile.name.trim().split(/\s+/)[0] : "";

  return (
    <PatientShell title="Início" activePath="/dashboard">
      <div className="ph-page ph-home">
        <header className="ph-heading">
          <div>
            <p className="ph-eyebrow">Área do paciente</p>
            <h1>{firstName ? `Olá, ${firstName}` : "Olá!"}</h1>
            <p>Cuide da sua saúde com tranquilidade.</p>
          </div>
          <Link href="/agendar" className="ui-button ui-button-primary ph-heading-action">
            Agendar consulta <Icon name="arrow" size={18} />
          </Link>
        </header>

        <DashboardData />

        <section className="ph-section" aria-labelledby="especialidades">
          <div className="ph-section-heading">
            <div>
              <p className="ph-eyebrow">Atendimento</p>
              <h2 id="especialidades">Especialidades</h2>
            </div>
            {specialties.length > 4 && (
              <button type="button" className="ph-link-button" onClick={() => setShowAllSpecialties((value) => !value)}>
                {showAllSpecialties ? "Ver menos" : "Ver todas"}
              </button>
            )}
          </div>
          {catalogLoading && <p className="ph-status" role="status">Carregando profissionais...</p>}
          {catalogError && <p className="ph-status ph-status-error" role="alert">{catalogError}</p>}
          {realBooking && !catalogLoading && !catalogError && catalog.length === 0 && (
            <p className="ph-status">Nenhum profissional disponível no momento. Entre em contato com a clínica.</p>
          )}
          <div className="ph-specialties">
            {visibleSpecialties.map((specialty) => (
              <Link
                key={specialty.name}
                href={`/agendar?especialidade=${encodeURIComponent(specialty.name)}`}
                className="ph-card ph-specialty"
              >
                <span className="ph-soft-icon" aria-hidden="true">{specialty.name.trim()[0]}</span>
                <strong>{specialty.name}</strong>
                <small>{specialty.total} {specialty.total === 1 ? "especialista" : "especialistas"}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="ph-section" aria-labelledby="especialistas">
          <div className="ph-section-heading">
            <div>
              <p className="ph-eyebrow">Equipe</p>
              <h2 id="especialistas">Especialistas disponíveis</h2>
            </div>
            {doctors.length > 3 && (
              <button type="button" className="ph-link-button" onClick={() => setShowAllDoctors((value) => !value)}>
                {showAllDoctors ? "Ver menos" : "Ver todos"}
              </button>
            )}
          </div>
          <div className="ph-doctors">
            {visibleDoctors.map((doctor) => {
              const bookingParameters = new URLSearchParams({
                especialidade: doctor.specialty,
                profissional: doctor.id || doctor.name,
              });
              return (
                <div className="ph-card ph-doctor" key={doctor.id || doctor.name}>
                  <span className="ph-avatar" aria-hidden="true">{doctor.initials}</span>
                  <div>
                    <strong>{doctor.name}</strong>
                    <small>{doctor.specialty}</small>
                  </div>
                  <Link href={`/agendar?${bookingParameters.toString()}`} className="ui-button ui-button-secondary">
                    Agendar
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PatientShell>
  );
}
