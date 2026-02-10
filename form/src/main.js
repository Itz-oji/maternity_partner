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

function showThanksMessage() {
  // Limpia UI y muestra mensaje final
  pageHost.innerHTML = `
    <div class="thanks">
      <h2>¡Gracias! ✅</h2>
      <p>Recibirás tu cotización en tu correo en unos minutos.</p>
    </div>
  `;

  // Oculta botones
  btnBack.style.display = "none";
  btnNext.style.display = "none";
  errorBox.textContent = "";
  progressBar.style.width = "100%";
}

async function render() {
  document.querySelector(".card").dataset.page = getCurrentPage().id;
  errorBox.textContent = "";

  const page = getCurrentPage();
  pageHost.innerHTML = "";
  await page.render(pageHost);

  const isLast = getPageIndex() === pages.length - 1;

  if (isLast) {
    btnNext.textContent = "Finalizar";
  } else {
    btnNext.textContent = "Siguiente";
  }

  btnBack.disabled = !canGoBack();
  btnNext.disabled = !canGoNext() && !isLast;

  const progress = (getPageIndex() / (getPageCount() - 1)) * 100;
  progressBar.style.width = `${progress}%`;
}

async function handleNextClick() {
  // Si ya enviaste, no hagas nada
  if (alreadySubmitted) return;

  const page = getCurrentPage();
  const ok = page.validate?.(V) ?? true;

  if (!ok) {
    errorBox.textContent = page.errorMessage || "Revisa los campos.";
    return;
  }

  const isLast = getPageIndex() === pages.length - 1;

  // Si NO es la última página, avanza normal
  if (!isLast) {
    go(+1);
    render();
    return;
  }

  // ✅ Si ES la última página: "Finalizar"
  try {
    alreadySubmitted = true;
    btnNext.disabled = true;
    btnNext.textContent = "Enviando...";

    const data = getState().data;

    // Envía a Apps Script (crea PDF y lo guarda en Drive)
    await enviarAGoogleDrive(data);

    // Muestra gracias
    showThanksMessage();
  } catch (err) {
    console.error(err);
    alreadySubmitted = false;
    btnNext.disabled = false;
    btnNext.textContent = "Finalizar";
    errorBox.textContent = "No se pudo enviar. Intenta nuevamente.";
    alert("❌ Error: " + (err?.message || err));
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
