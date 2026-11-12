"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBookingDoctors } from "@/features/appointments/services/appointments.js";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import PatientShell from "@/components/layout/PatientShell.js";
import DashboardData from "@/features/appointments/components/DashboardData.js";

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

  return (
    <PatientShell title="Início" activePath="/dashboard">

        <header className="dashboard-header">
          <div>
            <h1>
              Olá, seja bem-vindo! 👋
            </h1>

            <p>
              Encontre especialistas e agende sua próxima
              consulta.
            </p>
          </div>

          <Link
            href="/agendar"
            className="dashboard-schedule-button"
          >
            + Agendar consulta
          </Link>
        </header>

        <DashboardData />
        {catalogLoading && <p role="status">Carregando profissionais...</p>}
        {catalogError && <p role="alert">{catalogError}</p>}
        {realBooking && !catalogLoading && !catalogError && catalog.length === 0 && <p>Nenhum profissional disponível no momento. Entre em contato com a clínica.</p>}

        <section className="dashboard-section">
          <div className="section-title">
            <h2>Especialidades</h2>

            <button
              type="button"
              className="view-all-link"
              onClick={() =>
                setShowAllSpecialties(
                  (currentValue) =>
                    !currentValue
                )
              }
            >
              {showAllSpecialties
                ? "Ver menos"
                : "Ver todas"}
            </button>
          </div>

          <div className="specialties">
            {visibleSpecialties.map(
              (specialty) => (
                <Link
                  key={specialty.name}
                  href={`/agendar?especialidade=${encodeURIComponent(
                    specialty.name
                  )}`}
                  className="specialty-card"
                >
                  <span>
                    {specialty.icon}
                  </span>

                  <strong>
                    {specialty.name}
                  </strong>

                  <small>
                    {specialty.total} especialistas
                  </small>
                </Link>
              )
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-title">
            <h2>
              Especialistas disponíveis
            </h2>

            <button
              type="button"
              className="view-all-link"
              onClick={() =>
                setShowAllDoctors(
                  (currentValue) =>
                    !currentValue
                )
              }
            >
              {showAllDoctors
                ? "Ver menos"
                : "Ver todos"}
            </button>
          </div>

          <div className="doctors">
            {visibleDoctors.map((doctor) => {
              const bookingParameters =
                new URLSearchParams({
                  especialidade:
                    doctor.specialty,
                  profissional: doctor.id || doctor.name,
                });

              return (
                <div
                  className="doctor-card"
                  key={doctor.id || doctor.name}
                >
                  <div className="doctor-avatar">
                    {doctor.initials}
                  </div>

                  <div className="doctor-info">
                    <strong>
                      {doctor.name}
                    </strong>

                    <p>
                      {doctor.specialty}
                    </p>

                    {doctor.rating && <span className="doctor-rating">⭐ {doctor.rating}</span>}

                    <small className="doctor-availability">
                      {doctor.availability}
                    </small>
                  </div>

                  <Link
                    href={`/agendar?${bookingParameters.toString()}`}
                    className="doctor-schedule"
                  >
                    Agendar
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
    </PatientShell>
  );
}