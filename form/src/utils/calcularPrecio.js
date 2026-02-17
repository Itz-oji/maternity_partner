export const TARIFA_HORA_POR_NINOS = {
  1: 10000,
  2: 15000,
  3: 20000,
};

export const DESCUENTOS_POR_HORAS = [
  { min: 400, descuento: 0.30 },
  { min: 300, descuento: 0.25 },
  { min: 200, descuento: 0.20 },
  { min: 150, descuento: 0.18 },
  { min: 96,  descuento: 0.15 },
  { min: 80,  descuento: 0.14 },
  { min: 64,  descuento: 0.13 },
  { min: 48,  descuento: 0.12 },
  { min: 32,  descuento: 0.10 },
];

export function obtenerDescuentoPorHoras(horasMensuales = 0) {
  const h = Number(horasMensuales) || 0;

  for (const tramo of DESCUENTOS_POR_HORAS) {
    if (h >= tramo.min) {
      return tramo.descuento; // ej: 0.10 = 10%
    }
  }

  return 0;
}

export const RECARGO_FERIADO_POR_DIA = 15000;

export function formatCLP(value) {
  const n = Number(value) || 0;
  return "$" + Math.round(n).toLocaleString("es-CL");
}

/**
 * Devuelve la tarifa por hora según cantidad de niños.
 * Regla:
 * 1 niño  = 10.000
 * 2 niños = 15.000
 * 3 niños = 20.000
 * Si viene algo fuera de 1..3, se "clampa" al rango.
 */
export function obtenerTarifaHora(cantidadNinos = 1) {
  const n = Number(cantidadNinos) || 1;
  const clamped = Math.min(3, Math.max(1, Math.round(n)));
  return TARIFA_HORA_POR_NINOS[clamped];
}

/**
 * Precio base: horasMensuales * tarifaHora(según niños)
 * @param {number} horasMensuales
 * @param {number} cantidadNinos (1..3)
 */
export function calcularPrecioBase(horasMensuales, cantidadNinos = 1) {
  const h = Number(horasMensuales) || 0;
  const tarifa = obtenerTarifaHora(cantidadNinos);
  return Math.round(h * tarifa);
}

/**
 * Total con recargo feriados:
 * total = base + feriadosCount * 15.000
 * @param {number} horasMensuales
 * @param {number} cantidadNinos (1..3)
 * @param {number} feriadosCount cantidad de días feriados
 */
export function calcularTotalServicio(horasMensuales, cantidadNinos = 1, feriadosCount = 0) {
  const baseSinDescuento = calcularPrecioBase(horasMensuales, cantidadNinos);
  const descuento = obtenerDescuentoPorHoras(horasMensuales);
  const montoDescuento = baseSinDescuento * descuento;
  const baseConDescuento = baseSinDescuento - montoDescuento;
  const feriados = Number(feriadosCount) || 0;
  const total = baseConDescuento + feriados * RECARGO_FERIADO_POR_DIA;
  return Math.round(total);
}

export function calcularResumenServicio(
  horasMensuales,
  cantidadNinos = 1,
  feriadosCount = 0
) {
  const base = calcularPrecioBase(horasMensuales, cantidadNinos);
  const descuentoPct = obtenerDescuentoPorHoras(horasMensuales);
  const descuentoMonto = base * descuentoPct;

  const subtotal = base - descuentoMonto;
  const feriados = (Number(feriadosCount) || 0) * RECARGO_FERIADO_POR_DIA;

  const total = subtotal + feriados;

  return {
    base,
    descuentoPct,
    descuentoMonto,
    subtotal,
    feriados,
    total: Math.round(total),
  };
}
