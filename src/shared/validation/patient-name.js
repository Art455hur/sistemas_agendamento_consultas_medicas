export const PATIENT_NAME_MIN_LENGTH = 3;
export const PATIENT_NAME_MAX_LENGTH = 120;

// Usa a mesma regra no cadastro, perfil local e serviço de atualização.
export function patientNameError(value) {
  if (typeof value !== "string") return "Informe um nome entre 3 e 120 caracteres.";
  const length = value.trim().length;
  return length < PATIENT_NAME_MIN_LENGTH || length > PATIENT_NAME_MAX_LENGTH
    ? "Informe um nome entre 3 e 120 caracteres."
    : "";
}
