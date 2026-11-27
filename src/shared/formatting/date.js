// Formata a data civil sem convertê-la para o fuso do aparelho.
export function formatDate(date) {
  if (!date || !date.includes("-")) return date;
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

const longDateFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
});

// Data civil por extenso ("sexta-feira", "27 de novembro", "2026"), sem depender do fuso do aparelho.
export function formatLongDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return null;
  const parts = Object.fromEntries(
    longDateFormat.formatToParts(new Date(`${date}T12:00:00Z`)).map(({ type, value }) => [type, value]),
  );
  return { weekday: parts.weekday, dayMonth: `${parts.day} de ${parts.month}`, year: parts.year };
}
