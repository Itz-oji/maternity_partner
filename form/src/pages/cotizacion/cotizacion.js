import { loadHtml } from "../../utils/loadHtml.js";
import { getField, updateField } from "../../store.js";
import { calcularHorasMensuales } from "../../utils/calculoHoras.js";
import { calcularPrecioBase, calcularTotalServicio, formatCLP } from "../../utils/calcularPrecio.js";



export const cotizacionPage = {
  id: "cotizacion",

  async render(container) {
    container.innerHTML = await loadHtml("./src/pages/cotizacion/cotizacion.html");

    // --- Ubicación ---
    const comuna = container.querySelector("#comuna");
    const direccion = container.querySelector("#direccion");

    // --- Transporte (radios) ---
    const radios = [...container.querySelectorAll('input[name="transporte"]')];

    // --- Tipo de servicio + select condicional ---
    const tipoRadios = [...container.querySelectorAll('input[name="tipoServicio"]')];
    const diasWrap = container.querySelector("#diasWrap");
    const diasSemana = container.querySelector("#diasSemana");

    // --- Fecha inicio ---
    const fechaInicio = container.querySelector("#fechaInicio");

    // --- Turno adaptativo ---
    const adaptRadios = [...container.querySelectorAll('input[name="turnoAdaptativo"]')];
    const fechaAdaptativaWrap = container.querySelector("#fechaAdaptativaWrap");
    const fechaAdaptativa = container.querySelector("#fechaAdaptativa");

    // --- Días + horarios dinámicos ---
    const diasHorariosWrap = container.querySelector("#diasHorariosWrap");
    const diaRowTemplate = container.querySelector("#diaRowTemplate");

    // ✅ UI: texto donde se muestran las horas mensuales
    const horasMensualesTxt = container.querySelector("#horasMensualesTxt");

    // ✅ Modal feriados
    const feriadosModal = container.querySelector("#feriadosModal");
    const feriadosModalList = container.querySelector("#feriadosModalList");

    function openFeriadosModal(items) {
      // items: [{ date: "YYYY-MM-DD", name: "..." }]
      if (!feriadosModal || !feriadosModalList) return;

      feriadosModalList.innerHTML = "";

      items.forEach((it) => {
        const li = document.createElement("li");

        const badge = document.createElement("span");
        badge.className = "mp-modal__badge";
        badge.textContent = "Feriado";

        const text = document.createElement("div");
        text.className = "mp-modal__itemText";

        const date = document.createElement("div");
        date.className = "mp-modal__date";
        date.textContent = it.date;

        const name = document.createElement("div");
        name.className = "mp-modal__name";
        name.textContent = it.name || "Feriado";

        text.appendChild(date);
        text.appendChild(name);

        li.appendChild(badge);
        li.appendChild(text);

        feriadosModalList.appendChild(li);
      });

      // abrir modal
      if (typeof feriadosModal.showModal === "function") {
        feriadosModal.showModal();
      } else {
        // fallback simple por si el navegador no soporta <dialog>
        feriadosModal.setAttribute("open", "true");
      }
    }

    function renderHorasMensualesUI() {
      const v = getField("horasMensuales") ?? 0;
      if (horasMensualesTxt) horasMensualesTxt.textContent = String(v);
    }

    function getDiasHorarios() {
      const raw = getField("diasHorarios");
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }

    function setDiasHorarios(arr) {
      // Si tu store SOLO acepta strings, cambia a:
      // updateField("diasHorarios", JSON.stringify(arr));
      updateField("diasHorarios", arr);
    }

    function renderDiasRows(count) {
      if (!diasHorariosWrap || !diaRowTemplate) return;

      const n = Number(count || 0);

      // limpiar contenedor
      diasHorariosWrap.innerHTML = "";

      if (!n) {
        diasHorariosWrap.style.display = "none";
        setDiasHorarios([]);
        calculateHorasMensuales(); // ✅ recalcula al borrar
        return;
      }

      diasHorariosWrap.style.display = "grid";

      const current = getDiasHorarios();

      // normaliza para mantener lo ya ingresado
      const normalized = Array.from({ length: n }, (_, i) => ({
        dia: current[i]?.dia ?? "",
        inicio: current[i]?.inicio ?? "",
        termino: current[i]?.termino ?? "",
      }));

      // guarda estado normalizado
      setDiasHorarios(normalized);

      // crear filas clonando template
      normalized.forEach((row, i) => {
        const fragment = diaRowTemplate.content.cloneNode(true);

        const rowEl = fragment.querySelector(".dia-row");
        if (rowEl) rowEl.dataset.index = String(i);

        const labelDia = fragment.querySelector(".js-dia-label");
        const selDia = fragment.querySelector(".js-dia");
        const inpInicio = fragment.querySelector(".js-inicio");
        const inpTermino = fragment.querySelector(".js-termino");

        // setear textos/valores
        if (labelDia) labelDia.textContent = `Día ${i + 1}`;
        if (selDia) selDia.value = row.dia;
        if (inpInicio) inpInicio.value = row.inicio;
        if (inpTermino) inpTermino.value = row.termino;

        const onChange = () => {
          const arr = getDiasHorarios();
          arr[i] = {
            dia: selDia?.value ?? "",
            inicio: inpInicio?.value ?? "",
            termino: inpTermino?.value ?? "",
          };
          setDiasHorarios(arr);
          calculateHorasMensuales(); // ✅ recalcula cada vez que cambias algo
        };

        selDia?.addEventListener("change", onChange);
        inpInicio?.addEventListener("change", onChange);
        inpTermino?.addEventListener("change", onChange);

        diasHorariosWrap.appendChild(fragment);
      });

      calculateHorasMensuales(); // ✅ recalcula al terminar de dibujar filas
    }
    // ------------------- FERIADOS (Chile) -------------------
    // Cache en memoria para no pedir lo mismo mil veces
    const feriadosCache = new Map(); // year -> { set: Set('YYYY-MM-DD'), nameByDate: Map(date->name) }

    async function fetchFeriadosCL(year) {
      if (feriadosCache.has(year)) return feriadosCache.get(year);

      // Nager.Date: feriados públicos del año por país
      const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/CL`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`No pude obtener feriados (HTTP ${res.status})`);
      const data = await res.json();

      const set = new Set();
      const nameByDate = new Map();

      for (const h of data) {
        // h.date => "YYYY-MM-DD"
        set.add(h.date);
        nameByDate.set(h.date, h.localName || h.name || "Feriado");
      }

      const packed = { set, nameByDate };
      feriadosCache.set(year, packed);
      return packed;
    }

    // Devuelve lista de fechas (YYYY-MM-DD) del turno en el mes, desde fechaInicio a fin de mes
    function getFechasTurnoEnMesDesdeInicio(baseDate, rows) {
      const year = baseDate.getFullYear();
      const month0 = baseDate.getMonth();
      const startDay = baseDate.getDate();
      const daysInMonth = new Date(year, month0 + 1, 0).getDate();

      // weekdays seleccionados (ISO 1..7)
      const selectedWeekdays = new Set(
        rows
          .map((r) => normalizeWeekdayValue(r.dia))
          .filter((x) => x != null)
      );

      const fechas = [];
      for (let d = startDay; d <= daysInMonth; d++) {
        const jsDay = new Date(year, month0, d).getDay(); // 0=dom ... 6=sab
        const isoDay = jsDay === 0 ? 7 : jsDay; // 1=lun ... 7=dom
        if (!selectedWeekdays.has(isoDay)) continue;

        const mm = String(month0 + 1).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        fechas.push(`${year}-${mm}-${dd}`);
      }
      return fechas;
    }

    // Muestra alerta si el turno incluye feriados dentro del mes desde fechaInicio
    let lastFeriadoAlertKey = ""; // evita spamear alert por cada change

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

    function normalizeWeekdayValue(val) {
      if (!val) return null;
      const key = String(val).toLowerCase().trim();
      if (weekdayMap[key]) return weekdayMap[key];

      const num = Number(val);
      if (num >= 1 && num <= 7) return num;

      return null;
    }

    function timeToMinutes(hhmm) {
      if (!hhmm || typeof hhmm !== "string") return null;
      const [h, m] = hhmm.split(":").map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
      return h * 60 + m;
    }

    function diffHours(inicio, termino) {
      const a = timeToMinutes(inicio);
      const b = timeToMinutes(termino);
      if (a == null || b == null) return null;
      if (b <= a) return null;
      return (b - a) / 60;
    }

    async function checkFeriadosEnTurno() {
      const fecha = getField("fechaInicio");
      const tipo = getField("tipoServicio") ?? "";
      const rows = getDiasHorarios();

      // Solo aplica a periódico + con fecha + con filas
      if (tipo !== "periodico" || !fecha || !rows?.length) {
        lastFeriadoAlertKey = "";
        return;
      }

      // Si no hay días/horarios completos aún, no molestamos
      const tieneAlgoValido = rows.some((r) => normalizeWeekdayValue(r.dia) && diffHours(r.inicio, r.termino) != null);
      if (!tieneAlgoValido) return;

      const base = new Date(fecha + "T00:00:00");
      const year = base.getFullYear();
      const month0 = base.getMonth();

      const key = `${year}-${month0}-${fecha}-${JSON.stringify(rows.map(r => r.dia))}`;
      if (key === lastFeriadoAlertKey) return; // evita repetir el mismo popup

      try {
        const { set, nameByDate } = await fetchFeriadosCL(year);

        const fechasTurno = getFechasTurnoEnMesDesdeInicio(base, rows);
        const feriadosEnTurno = fechasTurno.filter((d) => set.has(d));
        const rowsValidas = rows.filter(r => normalizeWeekdayValue(r.dia) && diffHours(r.inicio, r.termino) != null);

        // Si no hay turnos válidos, no recargo
        if (!rowsValidas.length) {
          updateField("feriadosCount", 0);
          const horas = getField("horasMensuales") ?? 0;
          updateField("total", formatCLP(calcularPrecioBase(horas)));
          return;
        }

        // Como fechasTurno ya se arma por weekdays seleccionados, basta con contar feriadosEnTurno
        const feriadosTrabajados = feriadosEnTurno.length;

        updateField("feriadosCount", feriadosTrabajados);

        const horas = getField("horasMensuales") ?? 0;
        const precioBase = calcularPrecioBase(horas);

        // ✅ Recargo fijo por feriado trabajado
        const RECARGO_POR_FERIADO = 15000;
        const totalConRecargo = precioBase + feriadosTrabajados * RECARGO_POR_FERIADO;

        updateField("total", formatCLP(totalConRecargo));

        if (feriadosTrabajados > 0) {
          lastFeriadoAlertKey = key;
          openFeriadosModal(
            feriadosEnTurno.map((d) => ({
              date: d,
              name: nameByDate.get(d) || "Feriado",
            }))
          );
        }
      } catch (err) {
        // Si la API falla, no rompas el formulario
        console.warn("No pude validar feriados:", err);
      }
    }

    function calculateHorasMensuales() {
      const fecha = getField("fechaInicio");
      const rows = getDiasHorarios();

      const total = calcularHorasMensuales(fecha, rows);

      updateField("horasMensuales", total);
      renderHorasMensualesUI();

      // ✅ Precio base (sin feriados)
      const precioBase = calcularPrecioBase(total);
      updateField("precioBase", precioBase);
      updateField("total", formatCLP(precioBase));

      void checkFeriadosEnTurno();
      return total;
    }

    // ------------------- FECHA ADAPTATIVA -------------------

    function toggleFechaAdaptativa() {
      const valor = getField("turnoAdaptativo");
      const show = valor === "si";

      if (fechaAdaptativaWrap) fechaAdaptativaWrap.style.display = show ? "block" : "none";

      if (!show) {
        updateField("fechaAdaptativa", "");
        if (fechaAdaptativa) fechaAdaptativa.value = "";
      }
    }

    if (fechaAdaptativa) fechaAdaptativa.value = getField("fechaAdaptativa") ?? "";
    toggleFechaAdaptativa();

    adaptRadios.forEach((r) => {
      r.addEventListener("change", () => {
        updateField("turnoAdaptativo", r.value);
        toggleFechaAdaptativa();
      });
    });

    if (fechaAdaptativa) {
      fechaAdaptativa.addEventListener("change", (e) => {
        updateField("fechaAdaptativa", e.target.value);
      });
    }

    // ------------------- DÍAS (PERIÓDICO) -------------------

    function toggleDias() {
      const tipo = getField("tipoServicio") ?? "";
      const isPeriodico = tipo === "periodico";

      if (diasWrap) diasWrap.style.display = isPeriodico ? "block" : "none";

      if (!isPeriodico) {
        updateField("diasSemana", "");
        if (diasSemana) diasSemana.value = "";
        lastFeriadoAlertKey = "";

        setDiasHorarios([]);
        if (diasHorariosWrap) diasHorariosWrap.innerHTML = "";
        if (diasHorariosWrap) diasHorariosWrap.style.display = "none";

        updateField("horasMensuales", 0);
        renderHorasMensualesUI();
      } else {
        renderDiasRows(diasSemana?.value);
        calculateHorasMensuales();
      }
    }

    function refreshSelectedUI() {
      container.querySelectorAll(".radio-item").forEach((label) => label.classList.remove("selected"));

      const checked = container.querySelector('input[name="transporte"]:checked');
      if (checked) checked.closest(".radio-item")?.classList.add("selected");
    }

    // -------------------- CARGAR ESTADO --------------------

    if (comuna) comuna.value = getField("comuna") ?? "";
    if (direccion) direccion.value = getField("direccion") ?? "";

    const transporte = getField("transporte") ?? "";
    const checkedTransporte = radios.find((r) => r.value === transporte);
    if (checkedTransporte) checkedTransporte.checked = true;
    refreshSelectedUI();

    const tipoServicio = getField("tipoServicio") ?? "";
    const checkedTipo = tipoRadios.find((r) => r.value === tipoServicio);
    if (checkedTipo) checkedTipo.checked = true;

    if (diasSemana) diasSemana.value = getField("diasSemana") ?? "";

    if (fechaInicio) fechaInicio.value = getField("fechaInicio") ?? "";

    const turnoAdaptativo = getField("turnoAdaptativo") ?? "";
    const checkedAdapt = adaptRadios.find((r) => r.value === turnoAdaptativo);
    if (checkedAdapt) checkedAdapt.checked = true;

    // ✅ Ahora que todo está seteado, aplicamos toggles y calculamos
    toggleDias();
    toggleFechaAdaptativa();
    calculateHorasMensuales();
    renderHorasMensualesUI();

    // -------------------- LISTENERS --------------------

    if (comuna) comuna.addEventListener("change", (e) => updateField("comuna", e.target.value));
    if (direccion) direccion.addEventListener("input", (e) => updateField("direccion", e.target.value.trim()));

    radios.forEach((r) => {
      r.addEventListener("change", () => {
        updateField("transporte", r.value);
        refreshSelectedUI();
      });
    });

    tipoRadios.forEach((r) => {
      r.addEventListener("change", () => {
        updateField("tipoServicio", r.value);
        toggleDias();
      });
    });

    if (diasSemana) {
      diasSemana.addEventListener("change", (e) => {
        updateField("diasSemana", e.target.value);
        renderDiasRows(e.target.value);
        calculateHorasMensuales();
      });
    }

    if (fechaInicio) {
      fechaInicio.addEventListener("change", (e) => {
        updateField("fechaInicio", e.target.value);
        calculateHorasMensuales();
      });
    }

    adaptRadios.forEach((r) => {
      r.addEventListener("change", () => {
        updateField("turnoAdaptativo", r.value);
      });
    });
  },

  validate({ required }) {
    const tipo = getField("tipoServicio") ?? "";
    const turno = getField("turnoAdaptativo");

    return (
      required(getField("comuna")) &&
      required(getField("direccion")) &&
      required(getField("transporte")) &&
      required(tipo) &&
      (tipo !== "periodico" || required(getField("diasSemana"))) &&
      required(getField("fechaInicio")) &&
      required(getField("turnoAdaptativo")) &&
      required(turno) &&
      (turno !== "si" || required(getField("fechaAdaptativa")))
    );
  },

  errorMessage:
    "Completa comuna, dirección, transporte, tipo de servicio, fecha y turno adaptativo (y días si es periódico).",
};
