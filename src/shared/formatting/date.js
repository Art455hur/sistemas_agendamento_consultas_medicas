// Formata a data civil sem convertê-la para o fuso do aparelho.
export function formatDate(date) {
  if (!date || !date.includes("-")) return date;
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
