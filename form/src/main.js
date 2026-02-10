import { pages } from "./pages.js";
import { getState } from "./store.js";
import { canGoBack, canGoNext, getCurrentPage, getPageCount, getPageIndex, go } from "./router.js";
import * as V from "./validators.js";

/* =========================
   CONFIG: Apps Script
========================= */
const SECRET = "mp_2026_form_key";

const pageHost = document.getElementById("pageHost");
const btnBack = document.getElementById("btnBack");
const btnNext = document.getElementById("btnNext");
const errorBox = document.getElementById("errorBox");
const progressBar = document.getElementById("progressBar");

const sendingView = document.getElementById("sendingView");
const thanksView = document.getElementById("thanksView");
const footer = document.getElementById("footer");
const actions = document.getElementById("actions");

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

function showFormView() {
  pageHost.hidden = false;
  sendingView.hidden = true;
  thanksView.hidden = true;
  footer.hidden = false;
}

function showSendingView() {
  pageHost.hidden = true;
  sendingView.hidden = false;
  thanksView.hidden = true;

  // deshabilita acciones para que no haya doble click
  btnBack.disabled = true;
  btnNext.disabled = true;
  btnNext.textContent = "Enviando...";
  errorBox.textContent = "";
}

function showThanksView() {
  pageHost.hidden = true;
  sendingView.hidden = true;
  thanksView.hidden = false;

  // oculta botones
  footer.hidden = true;
  progressBar.style.width = "100%";
  errorBox.textContent = "";
}

async function render() {
  document.querySelector(".card").dataset.page = getCurrentPage().id;
  errorBox.textContent = "";

  showFormView();

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
  if (alreadySubmitted) return;

  const page = getCurrentPage();
  const ok = page.validate?.(V) ?? true;

  if (!ok) {
    errorBox.textContent = page.errorMessage || "Revisa los campos.";
    return;
  }

  const isLast = getPageIndex() === pages.length - 1;

  if (!isLast) {
    go(+1);
    render();
    return;
  }

  try {
    alreadySubmitted = true;

    // ✅ Señal visual inmediata
    showSendingView();

    const data = getState().data;
    await enviarAGoogleDrive(data);

    // ✅ Éxito
    showThanksView();
  } catch (err) {
    console.error(err);

    alreadySubmitted = false;

    // volver al formulario
    showFormView();

    // restaurar botón
    btnNext.disabled = false;
    btnNext.textContent = "Finalizar";
    btnBack.disabled = !canGoBack();

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

render();
