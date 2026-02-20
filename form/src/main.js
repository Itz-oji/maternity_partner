import { pages } from "./pages.js";
import { getState } from "./store.js";
import { canGoBack, canGoNext, getCurrentPage, getPageCount, getPageIndex, go } from "./router.js";
import * as V from "./validators.js";
import { calcularHorasMensuales, calcularHorasMensualesOcasional } from "./utils/calculoHoras.js";
import { calcularResumenServicio, calcularTotalServicio, formatCLP, obtenerTarifaHora } from "./utils/calcularPrecio.js";
import flatpickr from "https://esm.sh/flatpickr@4.6.13";
import { Spanish } from "https://esm.sh/flatpickr@4.6.13/dist/l10n/es.js";

/* =========================
   CONFIG: Apps Script
========================= */
const SECRET = "mp_2026_form_key";

const pageHost = document.getElementById("pageHost");
const btnBack = document.getElementById("btnBack");
const btnNext = document.getElementById("btnNext");
const errorBox = document.getElementById("errorBox");
const progressBar = document.getElementById("progressBar");

const sendingView = document.getElementById("sendingView");
const thanksView = document.getElementById("thanksView");
const footer = document.getElementById("footer");
const actions = document.getElementById("actions");

// opcional: dejarlo global para usarlo en páginas
window.flatpickr = flatpickr;
window.flatpickrSpanish = Spanish;


let alreadySubmitted = false;

async function enviarAGoogleDrive(data) {
  const res = await fetch("/api/guardar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, secret: SECRET }),
  });

  const json = await res.json().catch(() => null);
  if (!json || !json.ok) throw new Error(json?.error || "Error generando PDF");
  return json;
}

function prepararDatosParaEnvio(state) {
  const data = { ...state.data };
  const tipo = String(data.tipoServicio ?? "").trim().toLowerCase();

  let horasMensuales = 0;

  if (tipo === "ocasional") {
    let turnos = data.turnosOcasionales;
    if (!Array.isArray(turnos)) {
      try { turnos = JSON.parse(turnos || "[]"); } catch { turnos = []; }
    }
    horasMensuales = calcularHorasMensualesOcasional(turnos);
  } else {
    const diasHorarios = Array.isArray(data.diasHorarios) ? data.diasHorarios : [];
    horasMensuales = calcularHorasMensuales(data.fechaInicio, diasHorarios);
  }

  const adaptativoMismoDia = adaptativoCaeEnTurnoNormal(data);
  const resumen = calcularResumenServicio(horasMensuales, data.kidsCount, data.feriadosCount, data.turnoAdaptativo, adaptativoMismoDia);
  const totalRaw = resumen.total;
  const total = formatCLP(totalRaw);

  const detalleCobro = buildDetalleCobro(
    { horasMensuales, kidsCount: data.kidsCount, feriadosCount: data.feriadosCount },
    resumen
  );

  return {
    ...data,
    horasMensuales,
    totalRaw,
    total,
    detalleCobro,      // 👈 envíalo al Apps Script
    resumenServicio: resumen, // 👈 opcional (por si quieres tabla)
  };
}


function showFormView() {
  pageHost.hidden = false;
  sendingView.hidden = true;
  thanksView.hidden = true;
  footer.hidden = false;
}

function showSendingView() {
  pageHost.hidden = true;
  sendingView.hidden = false;
  thanksView.hidden = true;

  // deshabilita acciones para que no haya doble click
  btnBack.disabled = true;
  btnNext.disabled = true;
  btnNext.textContent = "Enviando...";
  errorBox.textContent = "";
}

function showThanksView() {
  pageHost.hidden = true;
  sendingView.hidden = true;
  thanksView.hidden = false;

  // oculta botones
  footer.hidden = true;
  progressBar.style.width = "100%";
  errorBox.textContent = "";
}

async function render() {
  document.querySelector(".card").dataset.page = getCurrentPage().id;
  errorBox.textContent = "";

  showFormView();

  const page = getCurrentPage();
  pageHost.innerHTML = "";
  await page.render(pageHost);

  const isLast = getPageIndex() === pages.length - 1;
  btnNext.textContent = isLast ? "Finalizar" : "Siguiente";

  btnBack.disabled = !canGoBack();
  btnNext.disabled = !canGoNext() && !isLast;

  const progress = (getPageIndex() / (getPageCount() - 1)) * 100;
  progressBar.style.width = `${progress}%`;
}

async function handleNextClick() {
  if (alreadySubmitted) return;

  const page = getCurrentPage();
  const ok = page.validate?.(V) ?? true;

  if (!ok) {
    errorBox.textContent = page.errorMessage || "Revisa los campos.";
    return;
  }

  const isLast = getPageIndex() === pages.length - 1;

  if (!isLast) {
    go(+1);
    render();
    return;
  }

  try {
    alreadySubmitted = true;

    // ✅ Señal visual inmediata
    showSendingView();

    // ✅ NUEVO: recalcular total antes de enviar
    const state = getState();
    const data = prepararDatosParaEnvio(state);

    await enviarAGoogleDrive(data);

    // ✅ Éxito
    showThanksView();
  } catch (err) {
    console.error(err);

    alreadySubmitted = false;

    // volver al formulario
    showFormView();

    // restaurar botón
    btnNext.disabled = false;
    btnNext.textContent = "Finalizar";
    btnBack.disabled = !canGoBack();

    errorBox.textContent = "No se pudo enviar. Intenta nuevamente.";
    alert("❌ Error: " + (err?.message || err));
  }
}

function handleBackClick() {
  if (alreadySubmitted) return;
  go(-1);
  render();
}

function formatPct(p) {
  const n = Number(p) || 0;
  return `${Math.round(n * 100)}%`;
}

function buildDetalleCobro({ horasMensuales, kidsCount, feriadosCount }, resumen) {
  const tarifa = obtenerTarifaHora(kidsCount);

  return [
    "Detalle de cobro",
    `• Horas totales: ${Number(horasMensuales) || 0} h`,
    `• Valor hora (${kidsCount} niño${Number(kidsCount) > 1 ? "s" : ""}): ${formatCLP(tarifa)}`,
    `• Base: ${formatCLP(resumen.base)} (${Number(horasMensuales) || 0} h × ${formatCLP(tarifa)})`,
    `• Descuento por horas (${formatPct(resumen.descuentoPct)}): -${formatCLP(resumen.descuentoMonto)}`,
    `• Subtotal: ${formatCLP(resumen.subtotal)}`,
    `• Recargo feriados (${Number(feriadosCount) || 0} × ${formatCLP(15000)}): +${formatCLP(resumen.feriados)}`,
    "—————————————",
    `TOTAL: ${formatCLP(resumen.total)}`,
  ].join("\n");
}

function adaptativoCaeEnTurnoNormal(data) {
  const turnoAdaptativo = String(data.turnoAdaptativo ?? "").trim().toLowerCase();
  if (turnoAdaptativo !== "si") return false;

  const fechaAdapt = String(data.fechaAdaptativa ?? "").trim(); // "YYYY-MM-DD"
  if (!fechaAdapt) return false;

  const tipo = String(data.tipoServicio ?? "").trim().toLowerCase();

  // --- Ocasional: comparar contra turnosOcasionales.date ---
  if (tipo === "ocasional") {
    let turnos = data.turnosOcasionales;
    if (!Array.isArray(turnos)) {
      try { turnos = JSON.parse(turnos || "[]"); } catch { turnos = []; }
    }
    return turnos.some(t => String(t?.date ?? "").trim() === fechaAdapt);
  }

  // --- Periódico: generar ocurrencias del mes desde fechaInicio + diasHorarios ---
  if (tipo === "periodico") {
    const fechaInicio = String(data.fechaInicio ?? "").trim();
    if (!fechaInicio) return false;

    const rows = Array.isArray(data.diasHorarios) ? data.diasHorarios : [];
    if (!rows.length) return false;

    // weekdayMap: 1=lun ... 7=dom
    const weekdayMap = {
      lunes: 1, martes: 2, miercoles: 3, miércoles: 3, jueves: 4, viernes: 5, sabado: 6, sábado: 6, domingo: 7,
    };
    const normalizeWeekdayValue = (val) => {
      if (!val) return null;
      const key = String(val).toLowerCase().trim();
      if (weekdayMap[key]) return weekdayMap[key];
      const num = Number(val);
      if (num >= 1 && num <= 7) return num;
      return null;
    };

    const base = new Date(fechaInicio + "T00:00:00");
    const year = base.getFullYear();
    const month0 = base.getMonth();
    const startDay = base.getDate();
    const daysInMonth = new Date(year, month0 + 1, 0).getDate();

    const selectedWeekdays = new Set(
      rows.map(r => normalizeWeekdayValue(r?.dia)).filter(x => x != null)
    );

    // solo ocurrencias desde fechaInicio hasta fin de mes (igual que feriados)
    for (let d = startDay; d <= daysInMonth; d++) {
      const jsDay = new Date(year, month0, d).getDay(); // 0 dom ... 6 sáb
      const isoDay = jsDay === 0 ? 7 : jsDay;

      if (!selectedWeekdays.has(isoDay)) continue;

      const mm = String(month0 + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const iso = `${year}-${mm}-${dd}`;

      if (iso === fechaAdapt) return true;
    }

    return false;
  }

  return false;
}

btnBack.addEventListener("click", handleBackClick);
btnNext.addEventListener("click", handleNextClick);

render();
