import { diffHours} from "./calculoHoras.js";

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

export function obtenerDescuentoPorHoras(horasMensuales = 0, habilitado = true) {
  const h = Number(horasMensuales) || 0;
  if (!habilitado) return 0;

  for (const tramo of DESCUENTOS_POR_HORAS) {
    if (h >= tramo.min) return tramo.descuento;
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
export function calcularTurnoAdaptativo(cantidadNinos, horasAdaptativo){
  const tarifaAdaptativo = obtenerTarifaHora(cantidadNinos);
  return ((horasAdaptativo*tarifaAdaptativo)*0.75)
}

export function calcularResumenServicio(
  horasMensuales,
  cantidadNinos = 1,
  feriadosCount = 0,
  descuentoHabilitado = true
) {
  let base = calcularPrecioBase(horasMensuales, cantidadNinos);

  const descuentoPct = obtenerDescuentoPorHoras(horasMensuales, descuentoHabilitado);
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

export function calcularResumenOcasionalPorMes(turnos, cantidadNinos = 1, feriadosCount = 0) {
  const tarifa = obtenerTarifaHora(cantidadNinos);

  // agrupar horas por mes
  const horasPorMes = new Map(); // "YYYY-MM" -> horas

  for (const t of (Array.isArray(turnos) ? turnos : [])) {
    const d = toDateSafe(t?.date ?? t?.fecha ?? null);
    if (!d) continue;

    const h = diffHours(t?.inicio ?? "", t?.termino ?? "");
    if (h == null) continue;

    const key = monthKey(d);
    horasPorMes.set(key, (horasPorMes.get(key) || 0) + h);
  }

  const meses = [...horasPorMes.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, horasRaw]) => {
      const horas = Math.round(horasRaw * 100) / 100;

      const base = Math.round(horas * tarifa);
      const descuentoPct = obtenerDescuentoPorHoras(horas, true); // 👈 descuento por horas del mes
      const descuentoMonto = base * descuentoPct;
      const subtotal = base - descuentoMonto;

      return {
        month,
        horas,
        base,
        descuentoPct,
        descuentoMonto,
        subtotal: Math.round(subtotal),
      };
    });

  const totalSinFeriados = meses.reduce((acc, m) => acc + (Number(m.subtotal) || 0), 0);

  // feriados: si tu recargo es por día y no depende del mes, puedes sumarlo al final:
  const feriados = (Number(feriadosCount) || 0) * RECARGO_FERIADO_POR_DIA;

  return {
    meses,
    totalSinFeriados: Math.round(totalSinFeriados),
    feriados,
    total: Math.round(totalSinFeriados + feriados),
  };
}

function toDateSafe(input) {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  const s = String(input).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);

  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}



