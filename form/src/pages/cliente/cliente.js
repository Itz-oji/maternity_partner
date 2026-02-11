import { loadHtml } from "../../utils/loadHtml.js";
import { getField, updateField } from "../../store.js";
import { formatRut } from "../../utils/rutFormat.js";

export const cliente = {
  id: "cliente",

  async render(container) {
    container.innerHTML = await loadHtml("./src/pages/cliente/cliente.html");

    const nombre = container.querySelector("#nombre");
    const apellido = container.querySelector("#apellido");
    const rut = container.querySelector("#rut");
    const emailEl = container.querySelector("#email");

    const telefonoMovil = container.querySelector("#telefonoMovil");
    const telefonoFijo = container.querySelector("#telefonoFijo");

    nombre.value = getField("nombre") ?? "";
    apellido.value = getField("apellido") ?? "";
    rut.value = formatRut(getField("rut") ?? "");
    emailEl.value = (getField("email") ?? "").trim();

    // Cargar teléfonos guardados (guardamos siempre con +56)
    const movGuardado = (getField("telefonoMovil") ?? "").trim();
    const fijoGuardado = (getField("telefonoFijo") ?? "").trim();

    if (telefonoMovil) telefonoMovil.value = movGuardado.replace(/^\+56/, "").replace(/\D/g, "");
    if (telefonoFijo) telefonoFijo.value = fijoGuardado.replace(/^\+56/, "").replace(/\D/g, "");

    // Listeners
    nombre.addEventListener("input", (e) => updateField("nombre", e.target.value.trim()));
    apellido.addEventListener("input", (e) => updateField("apellido", e.target.value.trim()));

    rut.addEventListener("input", (e) => {
      const formatted = formatRut(e.target.value);
      e.target.value = formatted;
      updateField("rut", formatted);
    });

    // Email: normalización suave
    emailEl.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\s+/g, "").toLowerCase();
      v = v.replace(/[^a-z0-9@._+-]/g, "");
      const parts = v.split("@");
      if (parts.length > 2) v = parts[0] + "@" + parts.slice(1).join("");
      v = v.replace(/\.\.+/g, ".");
      e.target.value = v;
      updateField("email", v);
    });

    if (telefonoMovil) {
      telefonoMovil.addEventListener("input", (e) => {
        let local = e.target.value.replace(/\D/g, "");

        // Limitar a 9 dígitos
        local = local.slice(0, 9);

        e.target.value = local;
        updateField("telefonoMovil", local ? `+56${local}` : "");
      });
    }

    if (telefonoFijo) {
      telefonoFijo.addEventListener("input", (e) => {
        let local = e.target.value.replace(/\D/g, "");

        // Limitar a 9 dígitos
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

    // Al menos uno válido
    const algunTelefonoValido = movOk || fijoOk;

    return (
      required(getField("nombre")) &&
      required(getField("apellido")) &&
      rut(getField("rut")) &&
      email(getField("email")) &&
      algunTelefonoValido
    );
  },

  errorMessage: "Revisa los campos: nombre, apellido, RUT, correo y al menos un teléfono válido (móvil o fijo)."
};
