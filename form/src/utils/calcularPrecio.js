// utils/calculoPrecio.js

export const PRECIO_HORA = 8500;
export const RECARGO_FERIADO_POR_DIA = 15000;

export function formatCLP(value) {
  const n = Number(value) || 0;
  return "$" + Math.round(n).toLocaleString("es-CL");
}

/**
 * Precio base: horasMensuales * 8500
 * @param {number} horasMensuales
 * @param {number} precioHora (opcional)
 */
export function calcularPrecioBase(horasMensuales, precioHora = PRECIO_HORA) {
  const h = Number(horasMensuales) || 0;
  return Math.round(h * precioHora);
}

/**
 * Total con recargo feriados (opcional)
 * @param {number} horasMensuales
 * @param {number} feriadosCount cantidad de días feriados en el mes (desde fechaInicio)
 * @param {number} precioHora
 * @param {number} recargoPorDia
 */
export function calcularTotalServicio(horasMensuales, feriadosCount = 0) {
  const base = calcularPrecioBase(horasMensuales);
  return base + (Number(feriadosCount) || 0) * 15000;
}