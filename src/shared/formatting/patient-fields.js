export function formatPhone(value) {
  const numbers = value
    .replace(/\D/g, "")
    .slice(0, 11);

  if (numbers.length <= 2) {
    return numbers
      ? `(${numbers}`
      : "";
  }

  if (numbers.length <= 6) {
    return `(${numbers.slice(
      0,
      2
    )}) ${numbers.slice(2)}`;
  }

  if (numbers.length <= 10) {
    return `(${numbers.slice(
      0,
      2
    )}) ${numbers.slice(
      2,
      6
    )}-${numbers.slice(6)}`;
  }

  return `(${numbers.slice(
    0,
    2
  )}) ${numbers.slice(
    2,
    7
  )}-${numbers.slice(7)}`;
}

export function formatCpf(value) {
  const numbers = value
    .replace(/\D/g, "")
    .slice(0, 11);

  return numbers
    .replace(
      /^(\d{3})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1-$2"
    );
}
