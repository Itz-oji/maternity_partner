import { loadHtml } from "../../utils/loadHtml.js";
import { getField, updateField } from "../../store.js";
import { formatRut } from "../../utils/rutFormat.js";
import { yearGridPlugin } from "../../utils/flatpickrYearGrid.js";

export const cliente = {
  id: "cliente",

  async render(container) {
    container.innerHTML = await loadHtml("./src/pages/cliente/cliente.html");

    const nombre = container.querySelector("#nombre");
    const apellido = container.querySelector("#apellido");
    const apoEdad = container.querySelector("#apo-edad");
    const edadTexto = container.querySelector("#edadTexto");
    const rut = container.querySelector("#rut");
    const emailEl = container.querySelector("#email");

    const telefonoMovil = container.querySelector("#telefonoMovil");
    const telefonoFijo = container.querySelector("#telefonoFijo");

    // --- Cargar datos guardados ---
    nombre.value = getField("nombre") ?? "";
    apellido.value = getField("apellido") ?? "";
    rut.value = formatRut(getField("rut") ?? "");
    emailEl.value = (getField("email") ?? "").trim();

    // Fecha guardada (formato recomendado: YYYY-MM-DD)
    const fechaGuardada = (getField("apo-edad") ?? "").trim();
    if (apoEdad) apoEdad.value = fechaGuardada;

    // Teléfonos guardados (guardamos con +56)
    const movGuardado = (getField("telefonoMovil") ?? "").trim();
    const fijoGuardado = (getField("telefonoFijo") ?? "").trim();

    if (telefonoMovil) telefonoMovil.value = movGuardado.replace(/^\+56/, "").replace(/\D/g, "");
    if (telefonoFijo) telefonoFijo.value = fijoGuardado.replace(/^\+56/, "").replace(/\D/g, "");

    // --- Listeners texto ---
    nombre.addEventListener("input", (e) => updateField("nombre", e.target.value.trim()));
    apellido.addEventListener("input", (e) => updateField("apellido", e.target.value.trim()));

    // --- Flatpickr: Fecha de nacimiento ---
    const setEdadTexto = (iso) => {
      if (!edadTexto) return;
      if (!iso) {
        edadTexto.textContent = "";
        return;
      }
      // iso: YYYY-MM-DD
      const [y, m, d] = iso.split("-").map(Number);
      if (!y || !m || !d) {
        edadTexto.textContent = "";
        return;
      }
      const nacimiento = new Date(y, m - 1, d);
      const hoy = new Date();

      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mm = hoy.getMonth() - nacimiento.getMonth();
      if (mm < 0 || (mm === 0 && hoy.getDate() < nacimiento.getDate())) edad--;

      edadTexto.textContent = Number.isFinite(edad) && edad >= 0 ? `Edad: ${edad} años` : "";
    };

    setEdadTexto(fechaGuardada);

    // Bloquea escritura manual (el input es readonly igual)
    if (apoEdad) {
      apoEdad.addEventListener("keydown", (e) => e.preventDefault());
      apoEdad.addEventListener("paste", (e) => e.preventDefault());
    }

    if (apoEdad && window.flatpickr) {
      const fp = window.flatpickr(apoEdad, {
        locale: window.flatpickr.l10ns.es,
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        maxDate: "today",
        disableMobile: true,
        allowInput: false,
        plugins: [
          yearGridPlugin({
            yearsPerPage: 12,
            columns: 3,
            minYear: 1900,
            maxYear: new Date().getFullYear(),
          }),
        ],

        defaultDate: fechaGuardada || null,

        onChange: (selectedDates, dateStr /* YYYY-MM-DD */) => {
          updateField("apo-edad", dateStr);
          setEdadTexto(dateStr);
        },
      });

      // Abre en focus/click (por si el readonly te lo bloquea en algún navegador)
      apoEdad.addEventListener("focus", () => fp.open());
      apoEdad.addEventListener("click", () => fp.open());
    } else {
      // Fallback si no cargó flatpickr: igual guarda lo que haya
      apoEdad?.addEventListener("change", (e) => {
        updateField("apo-edad", e.target.value);
        setEdadTexto(e.target.value);
      });
    }

    // --- RUT ---
    rut.addEventListener("input", (e) => {
      const formatted = formatRut(e.target.value);
      e.target.value = formatted;
      updateField("rut", formatted);
    });

    // --- Email ---
    emailEl.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\s+/g, "").toLowerCase();
      v = v.replace(/[^a-z0-9@._+-]/g, "");
      const parts = v.split("@");
      if (parts.length > 2) v = parts[0] + "@" + parts.slice(1).join("");
      v = v.replace(/\.\.+/g, ".");
      e.target.value = v;
      updateField("email", v);
    });

    // --- Teléfonos ---
    if (telefonoMovil) {
      telefonoMovil.addEventListener("input", (e) => {
        let local = e.target.value.replace(/\D/g, "");
        local = local.slice(0, 9);
        e.target.value = local;
        updateField("telefonoMovil", local ? `+56${local}` : "");
      });
    }

    if (telefonoFijo) {
      telefonoFijo.addEventListener("input", (e) => {
        let local = e.target.value.replace(/\D/g, "");
        local = local.slice(0, 9);
        e.target.value = local;
        updateField("telefonoFijo", local ? `+56${local}` : "");
      });
    }
  },

  validate({ required, email, rut }) {
    const mov = (getField("telefonoMovil") ?? "").trim();
    const fijo = (getField("telefonoFijo") ?? "").trim();

    const movOk = mov === "" ? false : /^\+569\d{8}$/.test(mov);
    const fijoOk = fijo === "" ? false : /^\+56[2-9]\d{8}$/.test(fijo);

    const algunTelefonoValido = movOk || fijoOk;

    return (
      required(getField("nombre")) &&
      required(getField("apellido")) &&
      required(getField("apo-edad")) &&   // 👈 agrega esto si la fecha es obligatoria
      rut(getField("rut")) &&
      email(getField("email")) &&
      algunTelefonoValido
    );
  },

  errorMessage:
    "Revisa los campos: nombre, apellido, fecha de nacimiento, RUT, correo y al menos un teléfono válido (móvil o fijo).",
};
