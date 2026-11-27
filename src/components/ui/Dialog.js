"use client";

import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon.js";

// Janela de confirmação da área do paciente. No celular, abre como gaveta inferior.
// Fecha com Esc, com o botão × ou clicando fora (quando não estiver ocupada).
// Renderizada em document.body para não ficar presa a barras com backdrop-filter.
export default function Dialog({ title, onClose, busy = false, children }) {
  const titleId = useId();
  const dialogRef = useRef(null);

  const latest = useRef({ onClose, busy });
  useLayoutEffect(() => {
    latest.current = { onClose, busy };
  });

  // Executa só ao abrir e ao fechar: foca a ação indicada e devolve o foco depois.
  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector("[data-autofocus]")?.focus();
    function closeOnEscape(event) {
      if (event.key === "Escape" && !latest.current.busy) latest.current.onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return createPortal(
    <div
      className="ui-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="ui-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="ui-dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button type="button" aria-label="Fechar" onClick={onClose} disabled={busy}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}
