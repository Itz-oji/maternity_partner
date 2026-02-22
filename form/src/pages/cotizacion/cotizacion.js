import { loadHtml } from "../../utils/loadHtml.js";
import { getField, updateField } from "../../store.js";
import { calcularHorasMensuales } from "../../utils/calculoHoras.js";
import { calcularPrecioBase, formatCLP } from "../../utils/calcularPrecio.js";
import { yearGridPlugin } from "../../utils/flatpickrYearGrid.js";

export const cotizacionPage = {
  id: "cotizacion",

  async render(container) {
    container.innerHTML = await loadHtml("./src/pages/cotizacion/cotizacion.html");

    // --- Ubicación ---
    const comuna = container.querySelector("#comuna");
    const direccion = container.querySelector("#direccion");

    // --- Transporte (radios) ---
    const radios = [...container.querySelectorAll('input[name="transporte"]')];

    // --- Tipo de servicio ---
    const tipoRadios = [...container.querySelectorAll('input[name="tipoServicio"]')];
    const diasWrap = container.querySelector("#diasWrap");
    const diasSemana = container.querySelector("#diasSemana");

    // --- Ocasional UI ---
    const ocasionalWrap = container.querySelector("#ocasionalWrap");
    const fechasOcasionalesInput = container.querySelector("#fechasOcasionalesInput");
    const ocasionalTurnosList = container.querySelector("#ocasionalTurnosList");
    const ocasionalTurnoTemplate = container.querySelector("#ocasionalTurnoTemplate");

    // --- Turno adaptativo ---
    const adaptRadios = [...container.querySelectorAll('input[name="turnoAdaptativo"]')];
    const fechaAdaptativaWrap = container.querySelector("#fechaAdaptativaWrap");

    // --- Horario adaptativo ---
    const horaAdaptativaWrap = container.querySelector("#horaAdaptativaWrap");
    const horaAdaptativaInicio = container.querySelector("#horaAdaptativaInicio");
    const horaAdaptativaTermino = container.querySelector("#horaAdaptativaTermino");
    const adaptativoHoraError = container.querySelector("#adaptativoHoraError");

    // --- Periódico (días + horarios) ---
    const diasHorariosWrap = container.querySelector("#diasHorariosWrap");
    const diaRowTemplate = container.querySelector("#diaRowTemplate");

    // Warning 
    const nocturnoWarning = container.querySelector("#nocturnoWarning");
    const adaptativoWarning = container.querySelector("#adaptativoWarning");

    // UI horas
    const horasMensualesTxt = container.querySelector("#horasMensualesTxt");

    // Modal feriados
    const feriadosModal = container.querySelector("#feriadosModal");
    const feriadosModalList = container.querySelector("#feriadosModalList");

    // Inputs fecha (Flatpickr)
    const fechaInicioInput = container.querySelector("#fechaInicioInput");
    const fechaInicioWrap = container.querySelector("#fechaInicioWrap");
    const fechaAdaptativaInput = container.querySelector("#fechaAdaptativaInput");

    // Config
    const MAX_FECHAS_OCASIONAL = 10;

    // let showErrors = false;

    // function setShowErrors(v) {
    //   showErrors = !!v;
    //   if (!showErrors) clearInvalidUI();
    // }

    // function clearInvalidUI() {
    //   container.querySelectorAll(".is-invalid").forEach((n) => n.classList.remove("is-invalid"));
    // }

    // function markRadioGroupInvalid(name, bad) {
    //   const inputs = [...container.querySelectorAll(`input[name="${name}"]`)];
    //   const first = inputs[0];
    //   if (!first) return;

    //   const invalid = !!bad;

    //   // marca cada radio
    //   inputs.forEach(r => r.classList.toggle("is-invalid", invalid));

    //   // marca los labels bonitos si tienes .radio-item
    //   inputs.forEach(r => r.closest(".radio-item")?.classList.toggle("is-invalid", invalid));

    //   // marca el fieldset si existe
    //   first.closest("fieldset")?.classList.toggle("is-invalid", invalid);
    // }

    // function markInvalid(el, bad) {
    //   if (!el) return;

    //   const invalid = !!bad;

    //   // 1) Flatpickr: el usuario ve el altInput, no el input original
    //   const fp = el._flatpickr;
    //   if (fp?.altInput) {
    //     fp.altInput.classList.toggle("is-invalid", invalid);
    //   }

    //   // 2) Siempre marca el input real también (por si acaso)
    //   el.classList.toggle("is-invalid", invalid);

    //   // 3) Si existe un wrapper (recomendado), márcalo también
    //   const wrap = el.closest?.(".field") || el.closest?.(".form-line") || el.parentElement;
    //   wrap?.classList?.toggle("is-invalid", invalid);
    // }

    // function validateAndPaint(force = false) {
    //   if (!showErrors && !force) return;

    //   const tipo = String(getField("tipoServicio") ?? "").trim().toLowerCase();
    //   const turno = String(getField("turnoAdaptativo") ?? "").trim().toLowerCase();

    //   // base
    //   markInvalid(comuna, !String(getField("comuna") ?? "").trim());
    //   markInvalid(direccion, !String(getField("direccion") ?? "").trim());

    //   // radios (grupos)
    //   markRadioGroupInvalid("transporte", !String(getField("transporte") ?? "").trim());
    //   markRadioGroupInvalid("tipoServicio", !String(getField("tipoServicio") ?? "").trim());
    //   markRadioGroupInvalid("turnoAdaptativo", !String(getField("turnoAdaptativo") ?? "").trim());

    //   // fechas (flatpickr)
    //   markInvalid(fechaInicioInput, !String(getField("fechaInicio") ?? "").trim());
    //   markInvalid(fechaAdaptativaInput, turno === "si" && !String(getField("fechaAdaptativa") ?? "").trim());

    //   // periódico: select días y filas
    //     if (tipo === "periodico") {
    //       markInvalid(diasSemana, !String(getField("diasSemana") ?? "").trim());

    //       // validar filas dinámicas visibles
    //       const rows = [...container.querySelectorAll("#diasHorariosWrap .dia-row, #diasHorariosWrap [data-row]")];
    //       // si no tienes clases, igual podemos ir por inputs:
    //       const selDias = [...container.querySelectorAll("#diasHorariosWrap .js-dia")];
    //       const inicios = [...container.querySelectorAll("#diasHorariosWrap .js-inicio")];
    //       const terminos = [...container.querySelectorAll("#diasHorariosWrap .js-termino")];

    //       selDias.forEach((sel, i) => {
    //         const ini = inicios[i];
    //         const ter = terminos[i];

    //         const diaOk = !!String(sel?.value ?? "").trim();
    //         const iniOk = !!String(ini?.value ?? "").trim();
    //         const terOk = !!String(ter?.value ?? "").trim();

    //         // si hay valores, valida regla >=4h
    //         const horasOk = (iniOk && terOk) ? diffHours(ini.value, ter.value) != null : false;

    //         markInvalid(sel, !diaOk);
    //         markInvalid(ini, !iniOk || (iniOk && terOk && !horasOk));
    //         markInvalid(ter, !terOk || (iniOk && terOk && !horasOk));
    //       });
    //     } else {
    //       markInvalid(diasSemana, false);
    //     }

    //     // ocasional: multi-fechas + turnos por fecha
    //     if (tipo === "ocasional") {
    //       const turnos = getTurnosOcasionales();
    //       markInvalid(fechasOcasionalesInput, !turnos.length);

    //       // pinta inputs de horas por fecha
    //       const inicioEls = [...container.querySelectorAll(".js-ocasional-inicio")];
    //       const terminoEls = [...container.querySelectorAll(".js-ocasional-termino")];

    //       inicioEls.forEach((ini, i) => {
    //         const ter = terminoEls[i];
    //         const iniOk = !!String(ini?.value ?? "").trim();
    //         const terOk = !!String(ter?.value ?? "").trim();
    //         const horasOk = (iniOk && terOk) ? diffHours(ini.value, ter.value) != null : false;

    //         markInvalid(ini, !iniOk || (iniOk && terOk && !horasOk));
    //         markInvalid(ter, !terOk || (iniOk && terOk && !horasOk));
    //       });
    //     } else {
    //       markInvalid(fechasOcasionalesInput, false);
    //     }
    //   }


    /* =========================
       Helpers UI
    ========================= */


    function setVisible(el, show) {
      if (!el) return;
      el.style.display = show ? "block" : "none";
    }

    function clearFechaInicio() {
      updateField("fechaInicio", "");
      if (fechaInicioInput) fechaInicioInput.value = "";

      // si existe flatpickr, limpia también el altInput y estado interno
      const fp = fechaInicioInput?._flatpickr;
      if (fp) fp.clear();
    }

    function openFeriadosModal(items) {
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

      if (typeof feriadosModal.showModal === "function") feriadosModal.showModal();
      else feriadosModal.setAttribute("open", "true");
    }

    function renderHorasMensualesUI() {
      const v = getField("horasMensuales") ?? 0;
      if (horasMensualesTxt) horasMensualesTxt.textContent = String(v);
    }

    /* =========================
       Store helpers
    ========================= */

    function getDiasHorarios() {
      const raw = getField("diasHorarios");
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try { return JSON.parse(raw); } catch { return []; }
    }

    function setDiasHorarios(arr) {
      updateField("diasHorarios", arr);
    }

    function getTurnosOcasionales() {
      const raw = getField("turnosOcasionales");
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try { return JSON.parse(raw); } catch { return []; }
    }

    function setTurnosOcasionales(arr) {
      updateField("turnosOcasionales", arr);
    }

    /* =========================
       Time helpers + reglas
    ========================= */

    function todayLocal() {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }

    function timeToMinutes(hhmm) {
      if (!hhmm || typeof hhmm !== "string") return null;
      const [h, m] = hhmm.split(":").map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
      return h * 60 + m;
    }

    // ✅ Regla: sobrecargo si el TURNO TERMINA entre 23:00 y 06:00 (incluye 06:00)
    function endsInNocturnoWindow(termino) {
      const b = timeToMinutes(termino);
      if (b == null) return false;

      const from23 = 23 * 60;
      const to2359 = 24 * 60 - 1;
      const to06 = 6 * 60;

      return (b >= from23 && b <= to2359) || (b >= 0 && b <= to06);
    }

    // diffHours soporta cruce medianoche + mínimo 4 horas
    function diffHours(inicio, termino) {
      const a = timeToMinutes(inicio);
      const b = timeToMinutes(termino);
      if (a == null || b == null) return null;

      let diffMin = b - a;
      if (diffMin <= 0) diffMin += 24 * 60;

      const hours = diffMin / 60;
      if (hours < 4) return null;
      return hours;
    }

    function updateNocturnoWarning() {
      const tipo = getField("tipoServicio") ?? "";
      let hasNocturno = false;

      if (tipo === "periodico") {
        const rows = getDiasHorarios();
        hasNocturno = rows.some((r) => r.termino && endsInNocturnoWindow(r.termino));
      }

      if (tipo === "ocasional") {
        const turnos = getTurnosOcasionales();
        hasNocturno = turnos.some((t) => t.termino && endsInNocturnoWindow(t.termino));
      }

      if (nocturnoWarning) nocturnoWarning.hidden = !hasNocturno;
      updateField("turnoNocturno", hasNocturno ? "si" : "");
    }

    function turnosCompletosParaFeriados() {
      const tipo = getField("tipoServicio") ?? "";

      if (tipo === "periodico") {
        const fecha = getField("fechaInicio");
        const rows = getDiasHorarios();
        if (!fecha) return false;
        if (!rows.length) return false;

        // todas las filas deben tener dia + inicio + termino + >=4h
        return rows.every((r) =>
          !!String(r?.dia ?? "").trim() &&
          diffHours(r?.inicio, r?.termino) != null
        );
      }

      if (tipo === "ocasional") {
        const turnos = getTurnosOcasionales();
        if (!turnos.length) return false;

        // todos los turnos deben tener date + inicio + termino + >=4h
        return turnos.every((t) =>
          !!String(t?.date ?? "").trim() &&
          diffHours(t?.inicio, t?.termino) != null
        );
      }

      return false;
    }


    /* =========================
       Flatpickr base (1 fecha)
    ========================= */

    function wireFlatpickr(inputEl, storeKey, onISOChange = null, options = {}) {
      if (!inputEl) return null;

      const fpLib = window.flatpickr;
      if (!fpLib) {
        console.warn("flatpickr no está disponible. Revisa el import en tu entry.");
        return null;
      }

      const savedISO = (getField(storeKey) ?? "").trim(); // "YYYY-MM-DD"

      // evitamos que options pueda pisar onChange
      const { onChange: _ignoredOnChange, ...safeOptions } = options || {};

      const fp = fpLib(inputEl, {
        locale: fpLib?.l10ns?.es ?? undefined,
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        disableMobile: true,
        allowInput: false,
        defaultDate: savedISO || null,
        plugins: [
          yearGridPlugin({
            yearsPerPage: 12,
            columns: 3,
            minYear: 1900,
            maxYear: new Date().getFullYear(),
          }),
        ],
        onChange: (selectedDates) => {
          const d = selectedDates?.[0];
          if (!d) return;
          const iso = fp.formatDate(d, "Y-m-d");
          updateField(storeKey, iso);
          if (typeof onISOChange === "function") onISOChange(iso);
        },
        ...safeOptions,
      });

      inputEl.addEventListener("focus", () => fp.open());
      inputEl.addEventListener("click", () => fp.open());

      return fp;
    }

    /* =========================
       Ocasional: multi fechas + turnos por fecha
    ========================= */

    function isoToPretty(iso) {
      if (!iso) return "";

      const date = new Date(iso + "T00:00:00");

      const formatted = new Intl.DateTimeFormat("es-CL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(date);

      // Capitalizar la primera letra (Intl devuelve "lunes")
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    function renderTurnosOcasionales() {
      if (!ocasionalTurnosList || !ocasionalTurnoTemplate) return;

      const turnos = getTurnosOcasionales()
        .slice()
        .sort((a, b) => String(a.date).localeCompare(String(b.date)));

      ocasionalTurnosList.innerHTML = "";

      turnos.forEach((t) => {
        const frag = ocasionalTurnoTemplate.content.cloneNode(true);

        const dateEl = frag.querySelector(".js-ocasional-date");
        const btnRemove = frag.querySelector(".js-ocasional-remove");
        const inpInicio = frag.querySelector(".js-ocasional-inicio");
        const inpTermino = frag.querySelector(".js-ocasional-termino");
        const errEl = frag.querySelector(".js-ocasional-error");

        if (dateEl) dateEl.textContent = isoToPretty(t.date);
        if (inpInicio) inpInicio.value = t.inicio || "";
        if (inpTermino) inpTermino.value = t.termino || "";

        const validateRow = () => {
          const inicio = inpInicio?.value ?? "";
          const termino = inpTermino?.value ?? "";
          if (!inicio || !termino) {
            if (errEl) errEl.textContent = "";
            return;
          }
          const horas = diffHours(inicio, termino);
          if (errEl) errEl.textContent = horas == null ? "El turno debe durar al menos 4 horas." : "";
        };

        const saveRow = () => {
          const inicio = inpInicio?.value ?? "";
          const termino = inpTermino?.value ?? "";

          const current = getTurnosOcasionales();
          const idx = current.findIndex((x) => x.date === t.date);
          if (idx >= 0) current[idx] = { ...current[idx], inicio, termino };

          setTurnosOcasionales(current);

          validateRow();
          updateNocturnoWarning();
          calculateHorasMensuales();
          // validateAndPaint();
        };

        inpInicio?.addEventListener("change", saveRow);
        inpTermino?.addEventListener("change", saveRow);

        btnRemove?.addEventListener("click", () => {
          const next = getTurnosOcasionales().filter((x) => x.date !== t.date);
          setTurnosOcasionales(next);

          const fp = fechasOcasionalesInput?._flatpickr;
          if (fp) fp.setDate(next.map((x) => x.date), true, "Y-m-d");

          renderTurnosOcasionales();
          updateNocturnoWarning();
          calculateHorasMensuales();
          // validateAndPaint();
        });

        validateRow();
        ocasionalTurnosList.appendChild(frag);
      });
    }

    function wireFlatpickrMultiple(inputEl) {
      if (!inputEl) return null;

      const fpLib = window.flatpickr;
      if (!fpLib) {
        console.warn("flatpickr no está disponible. Revisa el import en tu entry.");
        return null;
      }

      const savedTurnos = getTurnosOcasionales();
      const savedDates = savedTurnos.map((x) => x.date);

      const fp = fpLib(inputEl, {
        locale: fpLib?.l10ns?.es ?? undefined,
        mode: "multiple",
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        disableMobile: true,
        allowInput: false,
        defaultDate: savedDates.length ? savedDates : null,
        minDate: todayLocal(),
        plugins: [
          yearGridPlugin({
            yearsPerPage: 12,
            columns: 3,
            minYear: 1900,
            maxYear: new Date().getFullYear(),
          }),
        ],
        onChange: (selectedDates) => {
          let picked = (selectedDates || []).map((d) => fp.formatDate(d, "Y-m-d")).sort();

          // límite de fechas
          if (picked.length > MAX_FECHAS_OCASIONAL) {
            picked = picked.slice(0, MAX_FECHAS_OCASIONAL);
            fp.setDate(picked, true, "Y-m-d");
          }

          // preservar horas previas por fecha
          const current = getTurnosOcasionales();
          const map = new Map(current.map((x) => [x.date, x]));

          const next = picked.map((date) => {
            const prev = map.get(date);
            const forma = isoToPretty(date);
            const weekday = forma.split(',')[0];
            return {
              date,
              weekday,
              inicio: prev?.inicio ?? "",
              termino: prev?.termino ?? "",
            };
          });

          setTurnosOcasionales(next);

          renderTurnosOcasionales();
          updateNocturnoWarning();
          calculateHorasMensuales();
          // validateAndPaint();
        },
      });

      inputEl.addEventListener("focus", () => fp.open());
      inputEl.addEventListener("click", () => fp.open());

      return fp;
    }

    /* =========================
       Periódico: render filas
    ========================= */

    function renderDiasRows(count) {
      if (!diasHorariosWrap || !diaRowTemplate) return;

      const n = Number(count || 0);
      diasHorariosWrap.innerHTML = "";

      if (!n) {
        diasHorariosWrap.style.display = "none";
        setDiasHorarios([]);
        updateNocturnoWarning();
        calculateHorasMensuales();
        return;
      }

      diasHorariosWrap.style.display = "grid";

      const current = getDiasHorarios();
      const normalized = Array.from({ length: n }, (_, i) => ({
        dia: current[i]?.dia ?? "",
        inicio: current[i]?.inicio ?? "",
        termino: current[i]?.termino ?? "",
      }));

      setDiasHorarios(normalized);

      normalized.forEach((row, i) => {
        const fragment = diaRowTemplate.content.cloneNode(true);

        const labelDia = fragment.querySelector(".js-dia-label");
        const selDia = fragment.querySelector(".js-dia");
        const inpInicio = fragment.querySelector(".js-inicio");
        const inpTermino = fragment.querySelector(".js-termino");
        const errorEl = fragment.querySelector(".turno-error");

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

          const horas = diffHours(inpInicio?.value, inpTermino?.value);
          if (inpInicio?.value && inpTermino?.value) {
            if (errorEl) errorEl.textContent = horas == null ? "El turno debe durar al menos 4 horas." : "";
          } else {
            if (errorEl) errorEl.textContent = "";
          }

          updateNocturnoWarning();
          calculateHorasMensuales();
        };

        selDia?.addEventListener("change", onChange);
        inpInicio?.addEventListener("change", onChange);
        inpTermino?.addEventListener("change", onChange);

        diasHorariosWrap.appendChild(fragment);
      });

      updateNocturnoWarning();
      calculateHorasMensuales();
    }

    /* =========================
       Feriados (Chile)
    ========================= */

    const feriadosCache = new Map(); // year -> { set, nameByDate }

    async function fetchFeriadosCL(year) {
      if (feriadosCache.has(year)) return feriadosCache.get(year);

      const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/CL`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`No pude obtener feriados (HTTP ${res.status})`);
      const data = await res.json();

      const set = new Set();
      const nameByDate = new Map();
      for (const h of data) {
        set.add(h.date);
        nameByDate.set(h.date, h.localName || h.name || "Feriado");
      }

      const packed = { set, nameByDate };
      feriadosCache.set(year, packed);
      return packed;
    }

    let lastFeriadoAlertKey = "";

    // util: fechas de ocurrencias desde fechaInicio (para periódico)
    function getFechasTurnoEnMesDesdeInicio(baseDate, rows) {
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

      const year = baseDate.getFullYear();
      const month0 = baseDate.getMonth();
      const startDay = baseDate.getDate();
      const daysInMonth = new Date(year, month0 + 1, 0).getDate();

      const selectedWeekdays = new Set(
        rows.map((r) => normalizeWeekdayValue(r.dia)).filter((x) => x != null)
      );

      const fechas = [];
      for (let d = startDay; d <= daysInMonth; d++) {
        const jsDay = new Date(year, month0, d).getDay();
        const isoDay = jsDay === 0 ? 7 : jsDay;
        if (!selectedWeekdays.has(isoDay)) continue;

        const mm = String(month0 + 1).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        fechas.push(`${year}-${mm}-${dd}`);
      }
      return fechas;
    }

    async function checkFeriados() {
      const tipo = getField("tipoServicio") ?? "";

      if (tipo === "periodico") {
        const fecha = getField("fechaInicio");
        const rows = getDiasHorarios();

        const tieneAlgoValido = rows.some((r) => r.dia && diffHours(r.inicio, r.termino) != null);
        if (!fecha || !rows?.length || !tieneAlgoValido) {
          lastFeriadoAlertKey = "";
          updateField("feriadosCount", 0);
          return;
        }

        const base = new Date(fecha + "T00:00:00");
        const year = base.getFullYear();
        const month0 = base.getMonth();

        const fechasTurno = getFechasTurnoEnMesDesdeInicio(base, rows);

        const key = `P|${year}-${month0}|${fecha}|${JSON.stringify(rows.map((r) => r.dia).sort())}`;
        if (key === lastFeriadoAlertKey) return;

        try {
          const { set, nameByDate } = await fetchFeriadosCL(year);
          const feriadosEnTurno = fechasTurno.filter((d) => set.has(d));

          updateField("feriadosCount", feriadosEnTurno.length);

          if (feriadosEnTurno.length > 0) {
            lastFeriadoAlertKey = key;
            openFeriadosModal(
              feriadosEnTurno.map((d) => ({ date: d, name: nameByDate.get(d) || "Feriado" }))
            );
          }
        } catch (err) {
          console.warn("No pude validar feriados:", err);
        }

        return;
      }

      if (tipo === "ocasional") {
        const turnos = getTurnosOcasionales();
        const fechas = turnos.map((t) => t.date).filter(Boolean);

        if (!fechas.length) {
          lastFeriadoAlertKey = "";
          updateField("feriadosCount", 0);
          return;
        }

        const key = `O|${JSON.stringify(fechas.slice().sort())}`;
        if (key === lastFeriadoAlertKey) return;

        try {
          const years = [...new Set(fechas.map((d) => Number(String(d).slice(0, 4))).filter(Boolean))];

          let feriadosCount = 0;
          const feriadosItems = [];

          for (const y of years) {
            const { set, nameByDate } = await fetchFeriadosCL(y);
            fechas
              .filter((d) => d.startsWith(String(y)))
              .forEach((d) => {
                if (set.has(d)) {
                  feriadosCount++;
                  feriadosItems.push({ date: d, name: nameByDate.get(d) || "Feriado" });
                }
              });
          }

          updateField("feriadosCount", feriadosCount);

          if (feriadosCount > 0) {
            lastFeriadoAlertKey = key;
            openFeriadosModal(feriadosItems);
          }
        } catch (err) {
          console.warn("No pude validar feriados:", err);
        }

        return;
      }

      lastFeriadoAlertKey = "";
      updateField("feriadosCount", 0);
    }

    /* =========================
       Cálculo total horas + precio
    ========================= */

    function calculateHorasMensuales() {
      const tipo = getField("tipoServicio") ?? "";
      let totalHoras = 0;

      if (tipo === "periodico") {
        const fecha = getField("fechaInicio");
        const rows = getDiasHorarios();
        totalHoras = calcularHorasMensuales(fecha, rows);
      }

      if (tipo === "ocasional") {
        const turnos = getTurnosOcasionales();
        let sum = 0;
        for (const t of turnos) {
          const h = diffHours(t.inicio, t.termino);
          if (h != null) sum += h;
        }
        totalHoras = Math.round(sum * 100) / 100;
      }

      updateField("horasMensuales", totalHoras);
      renderHorasMensualesUI();

      const precioBase = calcularPrecioBase(totalHoras);
      updateField("precioBase", precioBase);
      updateField("total", formatCLP(precioBase));

      if (turnosCompletosParaFeriados()) {
        void checkFeriados();
      } else {
        // opcional: mientras no esté completo, no molestes y deja contador en 0
        lastFeriadoAlertKey = "";
        updateField("feriadosCount", 0);
      }
      return totalHoras;
    }

    /* =========================
       Toggles
    ========================= */

    function toggleFechaAdaptativa() {
      const valor = String(getField("turnoAdaptativo") ?? "").toLowerCase();
      const show = valor === "si";

      // fecha
      if (fechaAdaptativaWrap) fechaAdaptativaWrap.style.display = show ? "block" : "none";

      // ✅ horas
      if (horaAdaptativaWrap) horaAdaptativaWrap.style.display = show ? "block" : "none";

      // ✅ warning adaptativo
      if (adaptativoWarning) adaptativoWarning.hidden = !show;

      if (!show) {
        // limpiar fecha adaptativa
        updateField("fechaAdaptativa", "");
        if (fechaAdaptativaInput) fechaAdaptativaInput.value = "";
        const fp = fechaAdaptativaInput?._flatpickr;
        if (fp) fp.clear();

        // limpiar horas adaptativas
        updateField("horaAdaptativaInicio", "");
        updateField("horaAdaptativaTermino", "");
        if (horaAdaptativaInicio) horaAdaptativaInicio.value = "";
        if (horaAdaptativaTermino) horaAdaptativaTermino.value = "";

        if (adaptativoHoraError) adaptativoHoraError.textContent = "";
      } else {
        // si está visible, revalida el rango (opcional)
        const ini = horaAdaptativaInicio?.value ?? "";
        const ter = horaAdaptativaTermino?.value ?? "";
        if (ini && ter) {
          const h = diffHours(ini, ter);
          if (adaptativoHoraError) {
            adaptativoHoraError.textContent = h == null ? "El turno debe durar al menos 4 horas." : "";
          }
        }
      }
    }

    function toggleTipoServicioUI() {
      const tipo = getField("tipoServicio") ?? "";

      // reset warning siempre que cambie tipo
      if (nocturnoWarning) nocturnoWarning.hidden = true;
      updateField("turnoNocturno", "");

      const isPeriodico = tipo === "periodico";
      const isOcasional = tipo === "ocasional";

      // ✅ Fecha inicio SOLO en periódico
      setVisible(fechaInicioWrap, isPeriodico);

      if (isPeriodico) {
        if (diasWrap) diasWrap.style.display = "block";
        if (ocasionalWrap) ocasionalWrap.style.display = "none";

        // limpiar ocasional
        setTurnosOcasionales([]);
        const fpO = fechasOcasionalesInput?._flatpickr;
        if (fpO) fpO.clear();
        if (ocasionalTurnosList) ocasionalTurnosList.innerHTML = "";

        // ✅ si vienes de ocasional, no necesitas fechaInicio antigua “fantasma”
        // (pero en periódico sí la usarás, así que NO la limpies acá)

        renderDiasRows(diasSemana?.value);
        calculateHorasMensuales();
        return;
      }

      if (isOcasional) {
        // ✅ en ocasional NO existe fechaInicio
        clearFechaInicio();

        if (diasWrap) diasWrap.style.display = "none";
        if (diasHorariosWrap) {
          diasHorariosWrap.innerHTML = "";
          diasHorariosWrap.style.display = "none";
        }
        setDiasHorarios([]);
        updateField("diasSemana", "");
        if (diasSemana) diasSemana.value = "";

        if (ocasionalWrap) ocasionalWrap.style.display = "block";

        renderTurnosOcasionales();
        calculateHorasMensuales();
        updateNocturnoWarning();
        return;
      }

      // ninguno seleccionado
      if (diasWrap) diasWrap.style.display = "none";
      if (ocasionalWrap) ocasionalWrap.style.display = "none";
      setVisible(fechaInicioWrap, false);
    }


    function refreshSelectedUI() {
      container.querySelectorAll(".radio-item").forEach((label) => label.classList.remove("selected"));
      const checked = container.querySelector('input[name="transporte"]:checked');
      if (checked) checked.closest(".radio-item")?.classList.add("selected");
    }

    /* =========================
       Cargar estado inicial
    ========================= */

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

    const turnoAdaptativo = getField("turnoAdaptativo") ?? "";
    const checkedAdapt = adaptRadios.find((r) => r.value === turnoAdaptativo);
    if (checkedAdapt) checkedAdapt.checked = true;
    if (horaAdaptativaInicio) horaAdaptativaInicio.value = getField("horaAdaptativaInicio") ?? "";
    if (horaAdaptativaTermino) horaAdaptativaTermino.value = getField("horaAdaptativaTermino") ?? "";

    // Flatpickr (1 fecha)
    wireFlatpickr(fechaInicioInput, "fechaInicio", () => {
      calculateHorasMensuales();
    }, {
      minDate: todayLocal(), // ✅ no permite ayer
    });

    wireFlatpickr(fechaAdaptativaInput, "fechaAdaptativa", () => {
      // validateAndPaint(false);
     }, {
      minDate: todayLocal(), // ✅ no permite ayer
    });


    // Flatpickr (ocasional multi)
    wireFlatpickrMultiple(fechasOcasionalesInput);
    renderTurnosOcasionales();

    // aplicar toggles y cálculos
    toggleTipoServicioUI();
    toggleFechaAdaptativa();
    calculateHorasMensuales();
    renderHorasMensualesUI();
    updateNocturnoWarning();
    // validateAndPaint(false);

    /* =========================
       Listeners
    ========================= */

    if (comuna) comuna.addEventListener("change", (e) => {
      updateField("comuna", e.target.value);
      // validateAndPaint();
    });
    if (direccion) direccion.addEventListener("input", (e) => {
      updateField("direccion", e.target.value.trim());
      // validateAndPaint();
    });

    radios.forEach((r) => {
      r.addEventListener("change", () => {
        updateField("transporte", r.value);
        refreshSelectedUI();
        // validateAndPaint();
      });
    });

    tipoRadios.forEach((r) => {
      r.addEventListener("change", () => {
        updateField("tipoServicio", r.value);
        toggleTipoServicioUI();
        updateNocturnoWarning();
        calculateHorasMensuales();
        // validateAndPaint();
      });
    });

    if (diasSemana) {
      diasSemana.addEventListener("change", (e) => {
        updateField("diasSemana", e.target.value);
        renderDiasRows(e.target.value);
        calculateHorasMensuales();
        // validateAndPaint();
      });
    }

    adaptRadios.forEach((r) => {
      r.addEventListener("change", () => {
        updateField("turnoAdaptativo", r.value);
        toggleFechaAdaptativa();
        validateAdaptativoHorasUI();
        // validateAndPaint();
      });
    });

    function validateAdaptativoHorasUI() {
      const turno = String(getField("turnoAdaptativo") ?? "").toLowerCase();
      if (turno !== "si") {
        if (adaptativoHoraError) adaptativoHoraError.textContent = "";
        return;
      }

      const ini = horaAdaptativaInicio?.value ?? "";
      const ter = horaAdaptativaTermino?.value ?? "";

      if (!ini || !ter) {
        if (adaptativoHoraError) adaptativoHoraError.textContent = "";
        return;
      }

      const h = diffHours(ini, ter);
      let msg = "";
      if (h == null) msg = "El turno debe durar al menos 4 horas.";
      else if (h > 12) msg = "El turno no puede durar más de 12 horas.";

      if (adaptativoHoraError) adaptativoHoraError.textContent = msg;
    }

    horaAdaptativaInicio?.addEventListener("change", (e) => {
      updateField("horaAdaptativaInicio", e.target.value);
      validateAdaptativoHorasUI();
      // si quieres que afecte totales o warning nocturno, podrías llamar acá:
      // updateNocturnoWarning();
    });

    horaAdaptativaTermino?.addEventListener("change", (e) => {
      updateField("horaAdaptativaTermino", e.target.value);
      validateAdaptativoHorasUI();
      // updateNocturnoWarning();
    });
  },

  validate({ required }) {
    const tipoRaw = getField("tipoServicio");
    const tipo = String(tipoRaw ?? "").trim().toLowerCase();
    const turno = String(getField("turnoAdaptativo") ?? "").trim().toLowerCase();

    const comunaOk = required(getField("comuna"));
    const dirOk = required(getField("direccion"));
    const transpOk = required(getField("transporte"));
    const tipoOk = required(tipo);
    const turnoOk = required(turno);
    const fechaAdaptOk = (turno !== "si") || required(getField("fechaAdaptativa"));

    const horaAdaptIniOk = (turno !== "si") || required(getField("horaAdaptativaInicio"));
    const horaAdaptTerOk = (turno !== "si") || required(getField("horaAdaptativaTermino"));

    // ✅ Fecha inicio SOLO si es periódico
    const fechaInicioOk = (tipo !== "periodico") || required(getField("fechaInicio"));

    const timeToMinutesA = (hhmm) => {
      if (!hhmm || typeof hhmm !== "string") return null;
      const [h, m] = hhmm.split(":").map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
      return h * 60 + m;
    };

    const diffHoursMinMaxA = (inicio, termino) => {
      const a = timeToMinutesA(inicio);
      const b = timeToMinutesA(termino);
      if (a == null || b == null) return null;
      let diffMin = b - a;
      if (diffMin <= 0) diffMin += 24 * 60;
      const hours = diffMin / 60;
      if (hours < 4) return null;
      if (hours > 12) return null;
      return hours;
    };

    const diffAdaptOk = (turno !== "si") || (diffHoursMinMaxA(String(getField("horaAdaptativaInicio") || ""), String(getField("horaAdaptativaTermino") || "")) != null);
    const baseOk = comunaOk && dirOk && transpOk && tipoOk && fechaInicioOk && turnoOk && fechaAdaptOk && horaAdaptIniOk && horaAdaptTerOk && diffAdaptOk;
    if (!baseOk) return false;

    if (tipo === "periodico") {
      // además del select días, acá podrías exigir que las filas tengan valores si quieres
      return required(getField("diasSemana"));
    }

    if (tipo === "ocasional") {
      const raw = getField("turnosOcasionales");
      let turnos = [];
      if (Array.isArray(raw)) turnos = raw;
      else if (raw) {
        try { turnos = JSON.parse(raw); } catch { turnos = []; }
      }

      if (!Array.isArray(turnos) || turnos.length === 0) return false;

      const timeToMinutes = (hhmm) => {
        if (!hhmm || typeof hhmm !== "string") return null;
        const [h, m] = hhmm.split(":").map(Number);
        if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
        return h * 60 + m;
      };

      const diffHours = (inicio, termino) => {
        const a = timeToMinutes(inicio);
        const b = timeToMinutes(termino);
        if (a == null || b == null) return null;
        let diffMin = b - a;
        if (diffMin <= 0) diffMin += 24 * 60;
        const hours = diffMin / 60;
        return hours >= 4 ? hours : null;
      };

      // ✅ cada turno debe tener fecha + inicio + termino + >= 4h
      return turnos.every((t) =>
        required(t?.date) && diffHours(t?.inicio, t?.termino) != null
      );
    }

    return false;
  },

  errorMessage:
  "Completa comuna, dirección, transporte, tipo de servicio, turno adaptativo (y fecha si aplica). Si es periódico: fecha de inicio + días/horarios. Si es ocasional: fechas + horas (mínimo 4h).",
};
