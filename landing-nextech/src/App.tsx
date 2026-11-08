import { useState, useEffect, useCallback } from 'react'
import logoUrl from './assets/nextech-logo.svg?url'

const GITHUB_URL = 'https://github.com/Art455hur/sistemas_agendamento_consultas_medicas'
const FIGMA_URL = 'https://www.figma.com/make/g3WjcN1nALBsvfIhpLZsVb/Sistema-de-Agendamento-M%C3%A9dico-v2?t=xFoMyMTe26hyE9HX-20&fullscreen=1'
const EMAIL = 'prgweb.sh@gmail.com'
const GMAIL_URL = 'https://mail.google.com/mail/?view=cm&fs=1&to=prgweb.sh@gmail.com&su=Contato%20-%20NexTech%20Solu%C3%A7%C3%B5es'

const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Sobre', href: '#sobre' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Projeto', href: '#projeto' },
  { label: 'Equipe', href: '#equipe' },
  { label: 'Contato', href: '#contato' },
]

const SERVICES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M7 8l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 14h4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Desenvolvimento Web',
    desc: 'Criação de aplicações modernas, responsivas e fáceis de utilizar.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <circle cx="12" cy="10" r="3" />
        <path d="M6 10h3M15 10h3" strokeLinecap="round" />
      </svg>
    ),
    title: 'UI/UX e Prototipação',
    desc: 'Planejamento e construção de interfaces navegáveis no Figma.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <path d="M12 3L3 8v8l9 5 9-5V8z" strokeLinejoin="round" />
        <path d="M12 3v13M3 8l9 5 9-5" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Sistemas Personalizados',
    desc: 'Desenvolvimento de soluções digitais adaptadas às necessidades do projeto.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
        <path d="M15 9l-4 4-2-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Testes e Qualidade',
    desc: 'Revisão de código, testes de integração, navegação e usabilidade.',
  },
]

const FEATURES = [
  'Cadastro e login do paciente',
  'Pesquisa de especialidades',
  'Visualização dos profissionais',
  'Agendamento de consultas',
  'Cancelamento e remarcação',
  'Notificações',
  'Perfil do paciente',
  'Dashboard com resumo dos agendamentos',
]

const TEAM = [
  { name: 'Sandro Alexandre Abati', initials: 'SA', color: '#087B99' },
  { name: 'Railson dos Santos Rufino', initials: 'RS', color: '#002E40' },
  { name: 'Luiz Fernando Testzlaff', initials: 'LF', color: '#0aafdb' },
  { name: 'Brício Rocha Borges de Almeida', initials: 'BR', color: '#087B99' },
  { name: 'Arthur Araujo dos Santos Coelho', initials: 'AA', color: '#002E40' },
  { name: 'Ian Hebert Freitas Moreira', initials: 'IH', color: '#0aafdb' },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      setShowTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeModal = useCallback(() => setShowModal(false), [])

  useEffect(() => {
    if (!showModal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showModal, closeModal])

  function handleNav(href: string) {
    setMenuOpen(false)
    const id = href.replace('#', '')
    setTimeout(() => scrollTo(id), menuOpen ? 300 : 0)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (!form.email.trim()) e.email = 'E-mail é obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido'
    if (!form.subject.trim()) e.subject = 'Assunto é obrigatório'
    if (!form.message.trim()) e.message = 'Mensagem é obrigatória'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
  e.preventDefault()

  const errs = validate()
  setErrors(errs)

  if (Object.keys(errs).length > 0) return

  const subject = encodeURIComponent(form.subject.trim())
  const body = encodeURIComponent(
    `Nome: ${form.name.trim()}\n` +
    `E-mail: ${form.email.trim()}\n\n` +
    form.message.trim()
  )

  window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`
  setSubmitted(true)
}

  return (
    <div className="min-h-screen font-sans bg-white text-[#1a2533]">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md py-3' : 'bg-white/95 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button onClick={() => handleNav('#inicio')} className="flex-shrink-0">
            <img src={logoUrl} alt="NexTech Soluções" className="h-10 w-auto" />
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => handleNav(l.href)}
                className="text-sm font-medium text-[#374151] hover:text-[#087B99] transition-colors"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => handleNav('#contato')}
              className="ml-2 px-5 py-2 rounded-lg bg-[#087B99] text-white text-sm font-semibold hover:bg-[#065e75] transition-colors"
            >
              Fale conosco
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#087B99]"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              {menuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => handleNav(l.href)}
                className="text-left text-sm font-medium text-[#374151] hover:text-[#087B99] py-2 transition-colors"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => handleNav('#contato')}
              className="mt-2 px-5 py-2.5 rounded-lg bg-[#087B99] text-white text-sm font-semibold hover:bg-[#065e75] transition-colors"
            >
              Fale conosco
            </button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        id="inicio"
        className="pt-28 pb-20 md:pt-36 md:pb-28 bg-white"
      >
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#e0f4f9] text-[#087B99] text-xs font-semibold tracking-wide uppercase mb-5">
              Software House
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[#002E40] mb-5">
              Transformamos ideias em{' '}
              <span className="text-[#087B99]">soluções digitais</span>
            </h1>
            <p className="text-lg text-[#4b5563] leading-relaxed mb-8">
              A NexTech Soluções desenvolve experiências digitais modernas, acessíveis e eficientes para solucionar problemas reais.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleNav('#projeto')}
                className="px-6 py-3 rounded-lg bg-[#087B99] text-white font-semibold hover:bg-[#065e75] transition-colors shadow-sm"
              >
                Conheça nosso projeto
              </button>
              <button
                onClick={() => handleNav('#contato')}
                className="px-6 py-3 rounded-lg border-2 border-[#087B99] text-[#087B99] font-semibold hover:bg-[#e0f4f9] transition-colors"
              >
                Fale com a equipe
              </button>
            </div>
          </div>

          {/* Tech illustration */}
          <div className="flex justify-center">
            <TechIllustration />
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-20 bg-[#f8fbfd]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold text-[#002E40] mb-4">Sobre a NexTech</h2>
            <p className="text-[#4b5563] leading-relaxed text-lg">
              Somos uma software house formada por estudantes de Programação Web, unidos para planejar, prototipar e desenvolver soluções digitais. Nosso trabalho combina tecnologia, colaboração e foco na experiência do usuário.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Soluções centradas no usuário',
                desc: 'Projetamos pensando em quem vai usar, priorizando clareza e facilidade.',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M9 12h6M9 16h4" strokeLinecap="round" />
                  </svg>
                ),
                title: 'Interfaces modernas e responsivas',
                desc: 'Design cuidado que funciona perfeitamente em qualquer dispositivo.',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" strokeLinejoin="round" />
                    <path d="M15 5l4 4" />
                  </svg>
                ),
                title: 'Desenvolvimento colaborativo',
                desc: 'Time integrado onde cada membro contribui para o resultado final.',
              },
            ].map((c) => (
              <div
                key={c.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#087B99]/30 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[#e0f4f9] text-[#087B99] flex items-center justify-center mb-4">
                  {c.icon}
                </div>
                <h3 className="font-semibold text-[#002E40] mb-2">{c.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-[#002E40] mb-3">Nossos Serviços</h2>
            <p className="text-[#6b7280] text-lg">O que desenvolvemos para criar soluções completas.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-gray-100 p-6 hover:border-[#087B99]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#e0f4f9] text-[#087B99] flex items-center justify-center mb-5 group-hover:bg-[#087B99] group-hover:text-white transition-colors">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-[#002E40] mb-2">{s.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJETO */}
      <section id="projeto" className="py-20 bg-[#002E40]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#087B99]/20 text-[#4dd8f5] text-xs font-semibold tracking-wide uppercase mb-5">
              Projeto em Destaque
            </span>
            <h2 className="text-4xl font-bold text-white mb-5">AgendaSaúde</h2>
            <p className="text-[#a8c4ce] leading-relaxed mb-8">
              O AgendaSaúde é uma aplicação web desenvolvida para facilitar o agendamento e o gerenciamento de consultas médicas. O paciente pode pesquisar especialidades e profissionais, escolher data e horário e acompanhar seus agendamentos.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[#cbd5e0]">
                  <span className="w-5 h-5 rounded-full bg-[#087B99]/25 text-[#4dd8f5] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-3 rounded-lg bg-[#087B99] text-white font-semibold hover:bg-[#0aafdb] transition-colors"
              >
                Conhecer o AgendaSaúde
              </button>
              <a
                href={FIGMA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-lg border-2 border-[#087B99]/50 text-[#4dd8f5] font-semibold hover:border-[#087B99] transition-colors"
              >
                Ver protótipo
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-lg border-2 border-white/20 text-[#a8c4ce] font-semibold hover:border-white/50 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Ver no GitHub
              </a>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="flex justify-center">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* EQUIPE */}
      <section id="equipe" className="py-20 bg-[#f8fbfd]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-[#002E40] mb-3">Conheça nossa equipe</h2>
            <p className="text-[#6b7280] text-lg">As pessoas por trás das soluções.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map((m) => (
              <div
                key={m.name}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#087B99]/30 hover:shadow-md transition-all flex items-center gap-4"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </div>
                <div>
                  <p className="font-semibold text-[#002E40] leading-snug">{m.name}</p>
                  <p className="text-sm text-[#087B99] mt-0.5">Desenvolvimento e colaboração</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#002E40] mb-3">Vamos desenvolver uma solução juntos?</h2>
            <p className="text-[#6b7280] text-lg mb-3">Entre em contato e conte-nos sobre seu projeto.</p>
            <a
              href={GMAIL_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Enviar e-mail para NexTech Soluções"
              className="inline-flex items-center gap-2 text-[#087B99] font-medium hover:underline text-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7l10 7 10-7" strokeLinecap="round" />
              </svg>
              {EMAIL}
            </a>
          </div>

          {submitted ? (
            <div className="bg-[#e0f4f9] border border-[#087B99]/30 rounded-2xl p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-[#087B99] text-white flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-8 h-8">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#002E40] mb-2">Seu e-mail está preparado!</h3>
              <p className="text-[#4b5563]">Conclua o envio no seu aplicativo de e-mail. Se ele não abriu, envie sua mensagem para prgweb.sh@gmail.com. Este site não envia mensagens automaticamente.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                className="mt-6 px-6 py-2.5 rounded-lg bg-[#087B99] text-white text-sm font-semibold hover:bg-[#065e75] transition-colors"
              >
                Preparar outra mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[#f8fbfd] rounded-2xl border border-gray-100 p-8 grid gap-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">Nome *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Seu nome"
                    className={`w-full px-4 py-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#087B99]/40 transition-all ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">E-mail *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="seu@email.com"
                    className={`w-full px-4 py-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#087B99]/40 transition-all ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Assunto *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Como podemos ajudar?"
                  className={`w-full px-4 py-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#087B99]/40 transition-all ${errors.subject ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Mensagem *</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Descreva seu projeto ou dúvida..."
                  className={`w-full px-4 py-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#087B99]/40 transition-all resize-none ${errors.message ? 'border-red-400' : 'border-gray-200'}`}
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              </div>
              <button
                type="submit"
                className="px-8 py-3 rounded-lg bg-[#087B99] text-white font-semibold hover:bg-[#065e75] transition-colors self-start"
              >
                Preparar e-mail para envio
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#002E40] text-white pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="inline-flex items-center justify-center bg-white rounded-lg p-[10px] mb-4" style={{ width: 140, height: 60 }}>
                <img src={logoUrl} alt="NexTech Soluções" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <p className="text-[#a8c4ce] text-sm leading-relaxed">Tecnologia, colaboração e inovação.</p>
            </div>
            <div>
              <p className="font-semibold text-sm uppercase tracking-wide text-[#4dd8f5] mb-4">Links rápidos</p>
              <ul className="space-y-2">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <button
                      onClick={() => handleNav(l.href)}
                      className="text-sm text-[#a8c4ce] hover:text-white transition-colors"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm uppercase tracking-wide text-[#4dd8f5] mb-4">Redes</p>
              <div className="flex gap-4">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Repositório no GitHub da NexTech Soluções"
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-[#087B99] transition-colors flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <button
                  type="button"
                  aria-label="LinkedIn – em breve"
                  title="LinkedIn – em breve"
                  className="w-10 h-10 rounded-lg bg-white/10 opacity-60 cursor-default flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </button>
                <a
                  href={GMAIL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Enviar e-mail para NexTech Soluções"
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-[#087B99] transition-colors flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 7l10 7 10-7" strokeLinecap="round" />
                  </svg>
                </a>
              </div>
              <p className="text-[#a8c4ce] text-xs mt-3">{EMAIL}</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-[#6b8fa0]">© 2026 NexTech Soluções. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-[#087B99] text-white shadow-lg hover:bg-[#065e75] transition-colors flex items-center justify-center"
          aria-label="Voltar ao topo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
            <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              aria-label="Fechar modal do AgendaSaúde"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#087B99]/50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#e0f4f9] text-[#087B99] flex items-center justify-center" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                  <path d="M8 14h4M8 18h8" strokeLinecap="round" />
                </svg>
              </div>
              <h3 id="modal-title" className="text-xl font-bold text-[#002E40]">AgendaSaúde</h3>
            </div>
            <p className="text-[#4b5563] text-sm leading-relaxed mb-5">
              O AgendaSaúde é uma aplicação web desenvolvida para facilitar o agendamento e o gerenciamento de consultas médicas. O paciente pode pesquisar especialidades e profissionais, escolher data e horário e acompanhar seus agendamentos em tempo real.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-[#374151]">
                  <span className="w-4 h-4 rounded-full bg-[#e0f4f9] text-[#087B99] flex items-center justify-center flex-shrink-0" aria-hidden="true">
                    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5">
                      <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {f}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mb-5">
              <a
                href={FIGMA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg bg-[#087B99] text-white text-sm font-semibold hover:bg-[#065e75] transition-colors focus:outline-none focus:ring-2 focus:ring-[#087B99]/50"
              >
                Abrir protótipo
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg border border-[#087B99] text-[#087B99] text-sm font-semibold hover:bg-[#e0f4f9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#087B99]/50 flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Ver repositório
              </a>
            </div>
            <p className="text-xs text-[#9ca3af] text-center">Projeto acadêmico desenvolvido pela equipe NexTech Soluções.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function TechIllustration() {
  return (
    <svg viewBox="0 0 480 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md">
      {/* Background monitor */}
      <rect x="60" y="30" width="360" height="240" rx="16" fill="#f0f8fb" stroke="#c8e9f2" strokeWidth="2" />
      <rect x="60" y="30" width="360" height="44" rx="16" fill="#087B99" />
      <rect x="60" y="58" width="360" height="16" fill="#087B99" />
      <circle cx="88" cy="52" r="5" fill="white" fillOpacity=".5" />
      <circle cx="106" cy="52" r="5" fill="white" fillOpacity=".5" />
      <circle cx="124" cy="52" r="5" fill="white" fillOpacity=".5" />
      {/* Code lines */}
      <rect x="88" y="102" width="100" height="8" rx="4" fill="#c8e9f2" />
      <rect x="88" y="118" width="140" height="8" rx="4" fill="#e0f4f9" />
      <rect x="88" y="134" width="80" height="8" rx="4" fill="#c8e9f2" />
      <rect x="100" y="150" width="120" height="8" rx="4" fill="#e0f4f9" />
      <rect x="100" y="166" width="90" height="8" rx="4" fill="#c8e9f2" />
      <rect x="88" y="182" width="110" height="8" rx="4" fill="#e0f4f9" />
      {/* Sidebar panel */}
      <rect x="260" y="90" width="130" height="160" rx="12" fill="white" stroke="#c8e9f2" strokeWidth="1.5" />
      <rect x="272" y="104" width="50" height="6" rx="3" fill="#087B99" />
      <rect x="272" y="118" width="106" height="6" rx="3" fill="#e0f4f9" />
      <rect x="272" y="132" width="86" height="6" rx="3" fill="#e0f4f9" />
      <rect x="272" y="150" width="50" height="6" rx="3" fill="#087B99" />
      <rect x="272" y="164" width="106" height="6" rx="3" fill="#e0f4f9" />
      <rect x="272" y="178" width="70" height="6" rx="3" fill="#e0f4f9" />
      <rect x="272" y="200" width="96" height="22" rx="6" fill="#087B99" />
      <rect x="291" y="207" width="58" height="8" rx="3" fill="white" fillOpacity=".8" />
      {/* Stand */}
      <rect x="215" y="270" width="50" height="10" rx="4" fill="#c8e9f2" />
      <rect x="195" y="278" width="90" height="8" rx="4" fill="#c8e9f2" />
      {/* Floating elements */}
      <circle cx="50" cy="140" r="24" fill="#002E40" fillOpacity=".08" />
      <circle cx="50" cy="140" r="14" fill="#002E40" fillOpacity=".12" />
      <path d="M44 140l4 4 8-8" stroke="#087B99" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="440" cy="200" r="20" fill="#087B99" fillOpacity=".12" />
      <path d="M432 200h16M440 192v16" stroke="#087B99" strokeWidth="2" strokeLinecap="round" />
      {/* Connection dots */}
      <circle cx="150" cy="315" r="5" fill="#087B99" fillOpacity=".5" />
      <circle cx="200" cy="330" r="3" fill="#002E40" fillOpacity=".3" />
      <circle cx="310" cy="320" r="4" fill="#087B99" fillOpacity=".4" />
      <circle cx="360" cy="340" r="6" fill="#002E40" fillOpacity=".2" />
      <line x1="155" y1="315" x2="197" y2="330" stroke="#087B99" strokeOpacity=".3" strokeWidth="1" />
      <line x1="203" y1="330" x2="306" y2="320" stroke="#087B99" strokeOpacity=".3" strokeWidth="1" />
      <line x1="314" y1="320" x2="354" y2="340" stroke="#087B99" strokeOpacity=".3" strokeWidth="1" />
    </svg>
  )
}

function DashboardMockup() {
  return (
    <div className="w-full max-w-lg bg-[#001e2d] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      {/* Titlebar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#001525]">
        <span className="w-3 h-3 rounded-full bg-red-400/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
        <span className="w-3 h-3 rounded-full bg-green-400/70" />
        <span className="ml-4 text-xs text-[#4dd8f5]/60 font-mono">agendaSaude.app</span>
      </div>
      {/* Dashboard content */}
      <div className="p-5">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[#4dd8f5] text-xs font-semibold uppercase tracking-wider">AgendaSaúde</p>
            <p className="text-white font-bold text-sm">Dashboard</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#087B99] text-white flex items-center justify-center text-xs font-bold">JP</div>
        </div>
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Consultas', val: '12', sub: 'este mês', color: '#087B99' },
            { label: 'Próxima', val: '3', sub: 'dias', color: '#0aafdb' },
            { label: 'Concluídas', val: '28', sub: 'total', color: '#002E40' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-xl p-3">
              <p className="text-[#a8c4ce] text-xs mb-1">{s.label}</p>
              <p className="text-white font-bold text-xl leading-none">{s.val}</p>
              <p className="text-[#4dd8f5] text-xs mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
        {/* Appointment list */}
        <p className="text-[#4dd8f5] text-xs font-semibold uppercase tracking-wider mb-3">Próximos agendamentos</p>
        <div className="space-y-2">
          {[
            { spec: 'Cardiologia', dr: 'Dr. Lima', date: '20 set', time: '09:30', status: 'Confirmado' },
            { spec: 'Dermatologia', dr: 'Dra. Silva', date: '25 set', time: '14:00', status: 'Pendente' },
            { spec: 'Ortopedia', dr: 'Dr. Costa', date: '02 out', time: '11:15', status: 'Confirmado' },
          ].map((a) => (
            <div key={a.spec} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2.5">
              <div>
                <p className="text-white text-xs font-medium">{a.spec}</p>
                <p className="text-[#a8c4ce] text-xs">{a.dr}</p>
              </div>
              <div className="text-right">
                <p className="text-[#4dd8f5] text-xs">{a.date} · {a.time}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'Confirmado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {a.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
