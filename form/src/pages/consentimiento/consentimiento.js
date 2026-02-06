import { loadHtml } from "../../utils/loadHtml.js";
import { getField, updateField } from "../../store.js";
import { go } from "../../router.js"; // si usas go(-1)/go(1)

export const consentimientoPage = {
  id: "consentimiento",

  async render(container) {
    container.innerHTML = await loadHtml("./src/pages/consentimiento/consentimiento.html");

    const chk = container.querySelector("#consentimiento");
    const err = container.querySelector("#consentError");

    const btnAtras = container.querySelector("#btnAtras");
    const btnEnviar = container.querySelector("#btnEnviar");
    const btnBorrar = container.querySelector("#btnBorrar");

    // cargar estado previo
    if (chk) chk.checked = Boolean(getField("consentimiento"));

    chk?.addEventListener("change", () => {
      updateField("consentimiento", chk.checked);
      if (err) err.style.display = "none";
    });

    btnAtras?.addEventListener("click", () => {
      go(-1);
      // tu app probablemente re-renderiza al cambiar página
    });

    btnEnviar?.addEventListener("click", () => {
      const ok = Boolean(getField("consentimiento"));
      if (!ok) {
        if (err) err.style.display = "block";
        return;
      }

      // aquí disparas el envío real
      // ejemplo: submitForm()
      console.log("ENVIAR: ok, consentimiento aceptado");
      go(1);
    });

    btnBorrar?.addEventListener("click", () => {
      // si ya tienes resetStore() en store.js, úsalo.
      // si no, al menos limpia este campo:
      updateField("consentimiento", false);
      if (chk) chk.checked = false;
      if (err) err.style.display = "none";
    });
  },

  validate({ required }) {
    // requerido: checkbox true
    return required(getField("consentimiento"));
  },

  errorMessage: "Debes aceptar los términos y condiciones para continuar.",
};
