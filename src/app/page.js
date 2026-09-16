"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const specialties = [
  {
    name: "Cardiologia",
    icon: "♡",
    description:
      "Especialidade responsável pela prevenção, diagnóstico e acompanhamento da saúde do coração e do sistema cardiovascular.",
    services: [
      "Avaliação cardiológica",
      "Acompanhamento da pressão arterial",
      "Prevenção de doenças cardiovasculares",
    ],
  },
  {
    name: "Ortopedia",
    icon: "⚕",
    description:
      "Especialidade dedicada ao diagnóstico e tratamento de problemas nos ossos, músculos, articulações e ligamentos.",
    services: [
      "Avaliação ortopédica",
      "Tratamento de dores articulares",
      "Acompanhamento de lesões",
    ],
  },
  {
    name: "Dermatologia",
    icon: "◎",
    description:
      "Especialidade responsável pelos cuidados com a pele, cabelos e unhas, incluindo prevenção e tratamento de doenças.",
    services: [
      "Avaliação da pele",
      "Tratamento de acne e dermatites",
      "Prevenção do câncer de pele",
    ],
  },
  {
    name: "Pediatria",
    icon: "♙",
    description:
      "Especialidade voltada ao acompanhamento da saúde, crescimento e desenvolvimento de crianças e adolescentes.",
    services: [
      "Consulta pediátrica",
      "Acompanhamento do crescimento",
      "Orientação preventiva",
    ],
  },
  {
    name: "Ginecologia",
    icon: "♀",
    description:
      "Especialidade dedicada à prevenção, diagnóstico e cuidado com a saúde do sistema reprodutor feminino.",
    services: [
      "Consulta ginecológica",
      "Exames preventivos",
      "Acompanhamento da saúde feminina",
    ],
  },
  {
    name: "Clínica Geral",
    icon: "+",
    description:
      "Especialidade responsável pela avaliação inicial da saúde e pelo acompanhamento de diferentes condições clínicas.",
    services: [
      "Avaliação geral da saúde",
      "Diagnóstico inicial",
      "Orientação e encaminhamento",
    ],
  },
];

const steps = [
  {
    number: "01",
    title: "Escolha a especialidade",
    description:
      "Encontre o profissional adequado para cuidar da sua saúde.",
  },
  {
    number: "02",
    title: "Selecione o horário",
    description:
      "Escolha uma data e um horário disponíveis para sua consulta.",
  },
  {
    number: "03",
    title: "Confirme o agendamento",
    description:
      "Revise os dados e confirme sua consulta de forma rápida.",
  },
];

export default function Home() {
  const [selectedSpecialty, setSelectedSpecialty] =
    useState(null);

  useEffect(() => {
    if (!selectedSpecialty) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function closeWithEscape(event) {
      if (event.key === "Escape") {
        setSelectedSpecialty(null);
      }
    }

    window.addEventListener(
      "keydown",
      closeWithEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, [selectedSpecialty]);

  function closeSpecialtyModal() {
    setSelectedSpecialty(null);
  }

  return (
    <div className="public-home">
      <header className="public-header">
        <div className="public-navigation">
          <Link href="/" className="public-logo">
            <span>+</span>
            <strong>AgendaSaúde</strong>
          </Link>

          <nav className="public-menu">
            <a href="#inicio">Início</a>
            <a href="#especialidades">
              Especialidades
            </a>
            <a href="#como-funciona">
              Como funciona
            </a>
            <a href="#sobre">Sobre</a>
          </nav>

          <div className="public-header-actions">
            <Link
              href="/login"
              className="public-login-button"
            >
              Entrar
            </Link>

            <Link
              href="/cadastro"
              className="public-register-button"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className="public-main">
        <section
          id="inicio"
          className="public-hero"
        >
          <div className="public-hero-content">
            <span className="public-hero-badge">
              ● Plataforma de agendamento médico
            </span>

            <h1>
              Sua saúde,
              <br />
              no seu tempo
            </h1>

            <p>
              Encontre profissionais, consulte horários e
              agende sua consulta de forma simples e segura.
            </p>

            <div className="public-hero-actions">
              <Link
                href="/login"
                className="public-primary-button"
              >
                Agendar consulta
              </Link>

              <a
                href="#especialidades"
                className="public-secondary-button"
              >
                Conhecer especialidades
              </a>
            </div>
          </div>

          <div className="public-hero-visual">
            <div className="public-hero-image-background">
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85"
                alt="Profissional da saúde durante atendimento médico"
              />
            </div>

            <div className="public-online-card">
              <span>+</span>

              <div>
                <strong>
                  Agendamento online
                </strong>
                <small>Disponível 24h</small>
              </div>
            </div>
          </div>
        </section>

        <section
          id="especialidades"
          className="public-specialties-section"
        >
          <div className="public-section-heading">
            <h2>Especialidades disponíveis</h2>

            <p>
              Atendimento com profissionais especializados
              nas principais áreas da medicina
            </p>
          </div>

          <div className="public-specialties-grid">
            {specialties.map((specialty) => (
              <button
                key={specialty.name}
                type="button"
                className="public-specialty-card"
                onClick={() =>
                  setSelectedSpecialty(specialty)
                }
              >
                <span>{specialty.icon}</span>
                <strong>{specialty.name}</strong>
                <small>Clique para conhecer</small>
              </button>
            ))}
          </div>
        </section>

        <section
          id="como-funciona"
          className="public-how-section"
        >
          <div className="public-section-heading">
            <h2>Como funciona</h2>

            <p>
              Três passos simples para garantir o seu
              atendimento
            </p>
          </div>

          <div className="public-steps-grid">
            {steps.map((step) => (
              <article
                key={step.number}
                className="public-step-card"
              >
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="sobre"
          className="public-about-section"
        >
          <div>
            <span className="public-about-label">
              Sobre a plataforma
            </span>

            <h2>
              Cuidar da sua saúde ficou mais simples
            </h2>

            <p>
              A AgendaSaúde conecta pacientes e
              profissionais em uma plataforma prática,
              segura e disponível a qualquer momento.
            </p>
          </div>

          <Link
            href="/cadastro"
            className="public-primary-button"
          >
            Criar minha conta
          </Link>
        </section>
      </main>

      <footer className="public-footer">
        <div className="public-footer-content">
          <Link href="/" className="public-logo">
            <span>+</span>
            <strong>AgendaSaúde</strong>
          </Link>

          <p>
            © 2026 AgendaSaúde. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>

      {selectedSpecialty && (
        <div
          className="specialty-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSpecialtyModal();
            }
          }}
        >
          <div
            className="specialty-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="specialty-modal-title"
          >
            <button
              type="button"
              className="specialty-modal-close"
              aria-label="Fechar detalhes"
              onClick={closeSpecialtyModal}
            >
              ✕
            </button>

            <div className="specialty-modal-icon">
              {selectedSpecialty.icon}
            </div>

            <h2 id="specialty-modal-title">
              {selectedSpecialty.name}
            </h2>

            <p className="specialty-modal-description">
              {selectedSpecialty.description}
            </p>

            <div className="specialty-modal-services">
              <strong>PRINCIPAIS SERVIÇOS</strong>

              <ul>
                {selectedSpecialty.services.map(
                  (service) => (
                    <li key={service}>
                      <span>✓</span>
                      {service}
                    </li>
                  )
                )}
              </ul>
            </div>

            <Link
              href={`/login?especialidade=${encodeURIComponent(
                selectedSpecialty.name
              )}`}
              className="specialty-modal-schedule"
              onClick={closeSpecialtyModal}
            >
              Agendar consulta
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}