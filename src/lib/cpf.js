// Validação matemática: não consulta situação cadastral nem titularidade.
export function isValidCpf(value) {
  if (typeof value !== "string") return false;
  const input = value.trim();
  if (!/^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(input)) return false;

  const digits = input.replace(/\D/g, "");
  if (/^(\d)\1{10}$/.test(digits)) return false;

  for (const length of [9, 10]) {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(digits[index]) * (length + 1 - index);
    }
    const remainder = sum % 11;
    const expected = remainder < 2 ? 0 : 11 - remainder;
    if (Number(digits[length]) !== expected) return false;
  }
  return true;
}
