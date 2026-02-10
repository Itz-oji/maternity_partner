import { pages } from "./pages.js";
import { getState } from "./store.js";
import { canGoBack, canGoNext, getCurrentPage, getPageCount, getPageIndex, go } from "./router.js";
import * as V from "./validators.js";

/* =========================
   CONFIG: Apps Script
========================= */
const SECRET = "mp_2026_form_key"; // el mismo que validarás en Apps Script

const pageHost = document.getElementById("pageHost");
const btnBack = document.getElementById("btnBack");
const btnNext = document.getElementById("btnNext");
const errorBox = document.getElementById("errorBox");
const progressBar = document.getElementById("progressBar");

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

async function render() {
  document.querySelector(".card").dataset.page = getCurrentPage().id;
  errorBox.textContent = "";

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
  // Evita doble envío
  if (alreadySubmitted) return;

  const page = getCurrentPage();
  const ok = page.validate?.(V) ?? true;

  if (!ok) {
    errorBox.textContent = page.errorMessage || "Revisa los campos.";
    return;
  }

  const isLastPage = getPageIndex() === getPageCount() - 1;

  // Si NO es la última página: avanza normal
  if (!isLastPage) {
    go(+1);
    render();
    return;
  }

  // --- ESTADO DE CARGA ---
  alreadySubmitted = true;
  btnBack.disabled = true;
  btnNext.disabled = true;
  btnNext.textContent = "Enviando...";
  errorBox.textContent = "";

  try {
    const data = getState().data;

    await enviarAGoogleDrive(data);

    // Mostrar pantalla de éxito
    pageHost.innerHTML = `
      <div class="success">
        <h2>¡Gracias!</h2>
        <p>Tu cotización fue enviada correctamente.</p>
        <p>Recibirás el PDF en tu correo en unos minutos.</p>
      </div>
    `;

    // Ocultar botones (tu HTML tiene .actions .actions-right, con esto basta)
    const actions = document.querySelector(".actions");
    if (actions) actions.style.display = "none";

    progressBar.style.width = "100%";
  } catch (err) {
    console.error(err);

    alreadySubmitted = false;
    btnBack.disabled = !canGoBack();
    btnNext.disabled = false;
    btnNext.textContent = "Finalizar";
    errorBox.textContent = "Ocurrió un error. Intenta nuevamente.";
  }
}

function handleBackClick() {
  if (alreadySubmitted) return;
  go(-1);
  render();
}

btnBack.addEventListener("click", handleBackClick);
btnNext.addEventListener("click", handleNextClick);

// Render inicial
render();
