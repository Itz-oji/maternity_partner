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
    const email = container.querySelector("#email");
    const telefono = container.querySelector("#telefono");

    nombre.value = getField("nombre") ?? "";
    apellido.value = getField("apellido") ?? "";
    rut.value = formatRut(getField("rut") ?? "");
    email.value = getField("email") ?? "";

    const telGuardado = getField("telefono") ?? "";
    telefono.value = telGuardado.replace(/^\+56/, ""); // muestra sin +56

    nombre.addEventListener("input", (e) => updateField("nombre", e.target.value.trim()));
    apellido.addEventListener("input", (e) => updateField("apellido", e.target.value.trim()));
    rut.addEventListener("input", (e) => {
        const formatted = formatRut(e.target.value);
        e.target.value = formatted;

        // Guarda el valor formateado (el validador lo limpia internamente)
        updateField("rut", formatted);
    });
    email.addEventListener("input", (e) => updateField("email", e.target.value.trim()));
    telefono.addEventListener("input", (e) => {
        const localNumber = e.target.value.replace(/\D/g, "");
        updateField("telefono", `+56${localNumber}`);
    });
  },

  validate({ required, email, rut }) {
    const tel = getField("telefono") ?? "";
    const isValidPhone = /^\+569\d{8}$/.test(tel);
    return (
      required(getField("nombre")) &&
      required(getField("apellido")) &&
      rut(getField("rut")) &&
      email(getField("email")) &&
      isValidPhone
    );
  },

  errorMessage: "Revisa los campos: nombre, apellido, RUT y correo."
};