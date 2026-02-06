export function required(value) {
  return value != null && String(value).trim().length > 0;
}

export function email(value) {
  if (!required(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function rut(value) {
  if (value == null) return false;

  const raw = String(value).trim();
  if (!raw) return false;

  // Quita puntos y guión, y deja todo en mayúscula (para K)
  const clean = raw.replace(/\./g, "").replace(/-/g, "").toUpperCase();

  // Mínimo: 7 dígitos + DV (ej: 1234567K). Máximo normal: 8 dígitos + DV
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;

  const body = clean.slice(0, -1);   // números
  const dv = clean.slice(-1);        // 0-9 o K

  // Cálculo DV (módulo 11)
  let sum = 0;
  let mul = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul;
    mul = (mul === 7) ? 2 : (mul + 1);
  }

  const mod = 11 - (sum % 11);
  const dvCalc =
    mod === 11 ? "0" :
    mod === 10 ? "K" :
    String(mod);

  return dv === dvCalc;
}