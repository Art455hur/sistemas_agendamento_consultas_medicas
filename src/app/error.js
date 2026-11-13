"use client";

import ErrorNotice from "../components/feedback/ErrorNotice.js";

export default function ErrorPage({ reset }) {
  return (
    <main style={{ maxWidth: "640px", margin: "48px auto", padding: "24px" }}>
      <h1>Não foi possível abrir esta página</h1>
      <ErrorNotice message="Ocorreu uma falha ao carregar o conteúdo. Tente novamente." onRetry={reset} />
      <p><a href="/dashboard">Voltar ao início</a></p>
    </main>
  );
}
