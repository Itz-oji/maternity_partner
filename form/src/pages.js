import { getField, updateField } from "./store.js";

export const pages = [
  {
    title: "Sobre ti",
    render(container) {
      container.innerHTML = `
        <h2>Sobre ti</h2>

        <div class="field">
          <label for="nombre">Nombre *</label>
          <input id="nombre" type="text" placeholder="Ej: Benjamín" />
        </div>

        <div class="field">
          <label for="email">Correo *</label>
          <input id="email" type="email" placeholder="ejemplo@correo.com" />
        </div>
      `;

      const nombre = container.querySelector("#nombre");
      const mail = container.querySelector("#email");

      nombre.value = getField("nombre") ?? "";
      mail.value = getField("email") ?? "";

      nombre.addEventListener("input", (e) => updateField("nombre", e.target.value));
      mail.addEventListener("input", (e) => updateField("email", e.target.value));
    },
    validate({ required, email }) {
      return (
        required(getField("nombre")) &&
        email(getField("email"))
      );
    },
    errorMessage: "Completa tu nombre y un correo válido."
  },

  {
    title: "Ubicación",
    render(container) {
      container.innerHTML = `
        <h2>Ubicación</h2>

        <div class="field">
          <label for="comuna">Comuna *</label>
          <select id="comuna">
            <option value="">Elegir</option>
            <option>Santiago</option>
            <option>Providencia</option>
            <option>Ñuñoa</option>
            <option>Las Condes</option>
          </select>
          <small>Ejemplo base. Puedes cargar lista real después.</small>
        </div>
      `;

      const comuna = container.querySelector("#comuna");
      comuna.value = getField("comuna") ?? "";
      comuna.addEventListener("change", (e) => updateField("comuna", e.target.value));
    },
    validate({ required }) {
      return required(getField("comuna"));
    },
    errorMessage: "Selecciona una comuna."
  },

  {
    title: "Resumen",
    async render(container) {
      const { data } = (await import("./store.js")).getState?.() ?? {}; // fallback
      // Mejor: lo hacemos simple sin import dinámico
      container.innerHTML = `
        <h2>Resumen</h2>
        <p>Listo. Esta página es para revisar y luego enviar.</p>
        <pre id="preview" style="white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:12px;"></pre>
        <button id="btnSubmit" class="primary" type="button">Enviar (demo)</button>
      `;

      // Preview desde store sin import dinámico (lo armamos leyendo inputs previos)
      // Nota: para mantenerlo simple, lo reconstruiremos usando el DOM actual del store:
      // (Se actualizará desde main.js, que sí conoce el store)
    },
    validate() {
      return true;
    },
    errorMessage: ""
  }
];
