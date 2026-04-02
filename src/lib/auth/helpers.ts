export function phoneToFakeEmail(phone: string): string {
  // Remove tudo que não é dígito, depois remove prefixo 55 do Brasil
  const normalized = phone.replace(/\D/g, "").replace(/^55/, "");
  return `${normalized}@botconversa.games`;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^55/, "");
}
