// ===============================
// LÓGICA DE NEGOCIO: CÁLCULO HORAS
// ===============================

// Mapa días (ISO: 1=lunes ... 7=domingo)
const weekdayMap = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
  domingo: 7,
};

// ---------- helpers internos ----------

function timeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function diffHours(inicio, termino) {
  const a = timeToMinutes(inicio);
  const b = timeToMinutes(termino);
  if (a == null || b == null) return null;

  // ✅ Soporta nocturnos: si termina "antes" o igual, es al día siguiente
  let diffMin = b - a;
  if (diffMin <= 0) diffMin += 24 * 60;

  const hours = diffMin / 60;

  // ✅ Mínimo 4 horas por turno
  if (hours < 4) return null;

  return hours;
}

function normalizeWeekdayValue(val) {
  if (!val) return null;

  const key = String(val).toLowerCase().trim();
  if (weekdayMap[key]) return weekdayMap[key];

  const num = Number(val);
  if (num >= 1 && num <= 7) return num;

  return null;
}

function countWeekdayInMonthFromDay(year, monthIndex0, weekdayISO, startDay = 1) {
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
  const from = Math.max(1, Math.min(daysInMonth, Number(startDay) || 1));

  let count = 0;

  for (let d = from; d <= daysInMonth; d++) {
    const jsDay = new Date(year, monthIndex0, d).getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    if (isoDay === weekdayISO) count++;
  }

  return count;
}

// ===============================
// FUNCIÓN PRINCIPAL (PÚBLICA)
// ===============================

/**
 * Calcula horas mensuales
 * @param {string} fechaInicio "YYYY-MM-DD"
 * @param {Array} diasHorarios [{ dia, inicio, termino }]
 * @returns {number} horas mensuales
 */
export function calcularHorasMensuales(fechaInicio, diasHorarios) {
  if (!fechaInicio || !Array.isArray(diasHorarios) || !diasHorarios.length) {
    return 0;
  }

  const base = new Date(fechaInicio + "T00:00:00");
  const year = base.getFullYear();
  const month0 = base.getMonth();
  const startDay = base.getDate();

  let total = 0;

  for (const r of diasHorarios) {
    const weekday = normalizeWeekdayValue(r.dia);
    const horasDia = diffHours(r.inicio, r.termino);

    if (!weekday || horasDia == null) continue;

    const ocurrencias = countWeekdayInMonthFromDay(
      year,
      month0,
      weekday,
      startDay
    );

    total += horasDia * ocurrencias;
  }

  return Math.round(total * 100) / 100;
}

export function calcularHorasMensualesOcasional(turnos) {
  let sum = 0;
  for (const t of turnos || []) {
    const h = diffHours(t?.inicio, t?.termino);
    if (h != null) sum += h;
  }
  return Math.round(sum * 100) / 100;
}
