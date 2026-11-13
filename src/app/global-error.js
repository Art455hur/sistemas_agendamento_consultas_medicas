"use client";

import ErrorNotice from "../components/feedback/ErrorNotice.js";

export default function GlobalError({ reset }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "sans-serif", margin: "32px", color: "#17324d" }}>
        <h1>Não foi possível carregar o AgendaSaúde</h1>
        <ErrorNotice message="Tente novamente. Se o problema continuar, volte mais tarde." onRetry={reset} />
        <p><a href="/">Voltar à página inicial</a></p>
      </body>
    </html>
  );
}
