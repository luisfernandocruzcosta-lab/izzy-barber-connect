// Helpers para abrir WhatsApp com mensagem pré-formatada
export const onlyDigits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

export const buildWhatsAppUrl = (phone: string | null | undefined, message: string) => {
  const digits = onlyDigits(phone);
  // Garante DDI 55 (Brasil) se faltar
  const withCountry = digits.length > 0 && !digits.startsWith("55") ? `55${digits}` : digits;
  const text = encodeURIComponent(message);
  return withCountry
    ? `https://wa.me/${withCountry}?text=${text}`
    : `https://wa.me/?text=${text}`;
};

export const openWhatsApp = (phone: string | null | undefined, message: string) => {
  window.open(buildWhatsAppUrl(phone, message), "_blank", "noopener,noreferrer");
};
