// Getallen uit persberichten: "1.234,56", "1,234.56", "20,56", "0.10".

export function parseNumber(raw: string): number {
  let value = raw.replace(/\s/g, "");
  if (/[.,]\d{3}[.,]\d{1,4}$/.test(value) || /^\d{1,3}([.,]\d{3})+$/.test(value) && !/[.,]\d{3}$/.test(value)) {
    value = value.replace(/[.,](?=\d{3}(?:[.,]|$))/g, "");
  }
  return Number(value.replace(",", "."));
}
