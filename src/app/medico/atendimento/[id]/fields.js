export const validAppointmentId = (value) =>
  typeof value === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);

export const clinicalFields = [
  {
    name: "evolution", label: "Anotações do atendimento", maxLength: 6000, rows: 6, required: true,
    hint: "Na primeira consulta, registre a avaliação inicial. Nos retornos, descreva o que mudou desde o último atendimento.",
  },
  { name: "diagnosis", label: "Hipótese diagnóstica ou diagnóstico", maxLength: 2000, rows: 3 },
  { name: "plan", label: "Conduta e orientações", maxLength: 4000, rows: 4 },
];

export function parseClinicalFields(formData) {
  const fields = {};
  for (const { name, maxLength, required } of clinicalFields) {
    const incoming = formData.get(name);
    if (typeof incoming !== "string" && incoming !== null) return null;
    const value = incoming?.trim().replace(/\r\n/g, "\n") || null;
    if ((!value && required) || (value && value.length > maxLength)) return null;
    fields[name] = value;
  }
  return fields;
}
