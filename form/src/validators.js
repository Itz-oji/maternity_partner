export function required(value) {
  return value != null && String(value).trim().length > 0;
}

export function email(value) {
  if (!required(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}
