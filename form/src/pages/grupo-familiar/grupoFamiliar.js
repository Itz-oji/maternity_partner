import { loadHtml } from "../../utils/loadHtml.js";
import { getField, updateField } from "../../store.js";
import { formatRut } from "../../utils/rutFormat.js";
import { yearGridPlugin } from "../../utils/flatpickrYearGrid.js";

function ensureKidsArray(n) {
  const current = getField("ninos") ?? [];
  const kids = Array.isArray(current) ? [...current] : [];
  while (kids.length < n) kids.push({ nombre: "", rut: "", nacimiento: "" });
  return kids.slice(0, n);
}

function renderKids(container, count) {
  const kidsHost = container.querySelector("#kidsHost");
  const tpl = container.querySelector("#kidTemplate");

  const kids = ensureKidsArray(count);
  updateField("ninos", kids);

  kidsHost.innerHTML = "";

  kids.forEach((k, i) => {
    const node = tpl.content.cloneNode(true);

    const idx = node.querySelector(".kid-index");
    const nombreEl = node.querySelector(".kid-nombre");
    const rutEl = node.querySelector(".kid-rut");
    const nacEl = node.querySelector(".kid-nac");

    idx.textContent = String(i + 1);

    nombreEl.value = k.nombre ?? "";
    rutEl.value = formatRut(k.rut ?? "");
    nacEl.value = k.nacimiento ?? "";

    nombreEl.addEventListener("input", (e) => {
      const kidsNow = ensureKidsArray(count);
      kidsNow[i].nombre = e.target.value.trim();
      updateField("ninos", kidsNow);
    });

    rutEl.addEventListener("keydown", (e) => {
      const allowed =
        /[0-9kK]/.test(e.key) ||
        ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key);
      if (!allowed) e.preventDefault();
    });

    rutEl.addEventListener("input", (e) => {
      const formatted = formatRut(e.target.value);
      e.target.value = formatted;

      const kidsNow = ensureKidsArray(count);
      kidsNow[i].rut = formatted;
      updateField("ninos", kidsNow);
    });

    // --- Nacimiento: valor guardado (guardaremos ISO: YYYY-MM-DD) ---
    nacEl.value = k.nacimiento ?? "";

    // Guardar (fallback si no carga flatpickr)
    nacEl.addEventListener("change", (e) => {
      const kidsNow = ensureKidsArray(count);
      kidsNow[i].nacimiento = e.target.value;
      updateField("ninos", kidsNow);
    });

    // Bloquear escritura manual
    nacEl.addEventListener("keydown", (e) => e.preventDefault());
    nacEl.addEventListener("paste", (e) => e.preventDefault());

    // Flatpickr por cada niño/a
    if (window.flatpickr) {
      const fp = window.flatpickr(nacEl, {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        maxDate: "today",
        disableMobile: true,
        allowInput: false,
        locale: window.flatpickr?.l10ns?.es ?? undefined,
        plugins: [
          yearGridPlugin({
            yearsPerPage: 12,
            columns: 3,
            minYear: 1900,
            maxYear: new Date().getFullYear(),
          }),
        ],
        defaultDate: k.nacimiento || null,

        onChange: (selectedDates, dateStr) => {
          const kidsNow = ensureKidsArray(count);
          kidsNow[i].nacimiento = dateStr; // YYYY-MM-DD
          updateField("ninos", kidsNow);
        },
      });

      // Abre al foco/click (por si readonly en algunos navegadores)
      nacEl.addEventListener("focus", () => fp.open());
      nacEl.addEventListener("click", () => fp.open());
    }


    kidsHost.appendChild(node);
  });
}

export const grupoFamiliarPage = {
  id: "grupo-familiar",

  async render(container) {
    container.innerHTML = await loadHtml("./src/pages/grupo-familiar/grupoFamiliar.html");

    const radios = [...container.querySelectorAll('input[name="kidsCount"]')];
    function refreshSelectedUI() {
        container.querySelectorAll(".radio-item").forEach((label) => label.classList.remove("selected"));
        const checked = container.querySelector('input[name="kidsCount"]:checked');
        if (checked) checked.closest(".radio-item")?.classList.add("selected");
        }

        // al render inicial
        refreshSelectedUI();

        // cada vez que cambia
        radios.forEach((r) => {
        r.addEventListener("change", () => {
            const newCount = Number(r.value);
            updateField("kidsCount", newCount);
            renderKids(container, newCount);
            refreshSelectedUI();
        });
    });

    const savedCount = Number(getField("kidsCount") ?? 1);
    const count = [1, 2, 3].includes(savedCount) ? savedCount : 1;

    const selected = radios.find((r) => Number(r.value) === count);
    if (selected) selected.checked = true;

    renderKids(container, count);

    radios.forEach((r) => {
      r.addEventListener("change", () => {
        const newCount = Number(r.value);
        updateField("kidsCount", newCount);
        renderKids(container, newCount);
      });
    });
  },

  validate({ required, rut }) {
    const count = Number(getField("kidsCount") ?? 1);
    const kids = ensureKidsArray(count);

    for (const k of kids) {
      if (!required(k.nombre)) return false;
      if (!rut(k.rut)) return false;
      if (!required(k.nacimiento)) return false;
    }
    return true;
  },

  errorMessage: "Completa nombre, RUT válido y fecha de nacimiento para cada niño/a."
};
