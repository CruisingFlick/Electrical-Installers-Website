export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 10 && digits.startsWith("04")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  if (digits.length === 10 && digits.startsWith("03")) {
    return `(03) ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith("61")) {
    const local = digits.slice(2);
    return `+61 ${local.slice(0, 1)} ${local.slice(1, 5)} ${local.slice(5)}`;
  }

  return raw;
}
