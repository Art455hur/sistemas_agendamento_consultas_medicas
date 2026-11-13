"use client";

export default function ErrorNotice({ message = "Não foi possível concluir esta operação.", onRetry }) {
  return (
    <div role="alert" style={{ padding: "16px", color: "#8b2525", background: "#fff4f4", borderRadius: "8px" }}>
      <p>{message}</p>
      {onRetry && <button type="button" onClick={onRetry}>Tentar novamente</button>}
    </div>
  );
}
