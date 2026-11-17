// Aceita somente caminhos internos. Rejeita normalizações ambíguas do navegador.
export function safeRedirect(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\u0000-\u0020\u007f]/.test(value)) return null;
  const path = value.split(/[?#]/, 1)[0];
  // Escapes em caminhos de retorno não são necessários nas rotas atuais.
  if (path.includes("%")) return null;
  try {
    const url = new URL(value, "https://internal.invalid");
    if (url.origin !== "https://internal.invalid") return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}
