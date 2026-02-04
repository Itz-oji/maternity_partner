import { pages } from "./pages.js";
import { getState } from "./store.js";
import { canGoBack, canGoNext, getCurrentPage, getPageCount, getPageIndex, go } from "./router.js";
import * as V from "./validators.js";
import { updateField, getField } from "./store.js";

const pageHost = document.getElementById("pageHost");
const btnBack = document.getElementById("btnBack");
const btnNext = document.getElementById("btnNext");
const errorBox = document.getElementById("errorBox");
const progressBar = document.getElementById("progressBar");

function render() {
  errorBox.textContent = "";

  const page = getCurrentPage();
  pageHost.innerHTML = "";
  page.render(pageHost);

  // Si estamos en “Resumen”, construimos preview real desde el store
  if (getPageIndex() === pages.length - 1) {
    const preview = pageHost.querySelector("#preview");
    if (preview) {
      const { data } = getState();
      preview.textContent = JSON.stringify(data, null, 2);
    }

    const btnSubmit = pageHost.querySelector("#btnSubmit");
    if (btnSubmit) {
      btnSubmit.addEventListener("click", () => {
        // Demo: aquí luego haces fetch a tu backend / Apps Script
        alert("Enviado (demo). Revisa consola para ver data.");
        console.log("DATA SUBMIT:", getState().data);
      });
    }

    btnNext.textContent = "Finalizado";
    btnNext.disabled = true;
  } else {
    btnNext.textContent = "Siguiente";
    btnNext.disabled = false;
  }

  btnBack.disabled = !canGoBack();
  btnNext.disabled = !canGoNext() && getPageIndex() !== pages.length - 1;

  const progress = ((getPageIndex()) / (getPageCount() - 1)) * 100;
  progressBar.style.width = `${progress}%`;
}

function tryNext() {
  const page = getCurrentPage();
  const ok = page.validate?.(V) ?? true;
  if (!ok) {
    errorBox.textContent = page.errorMessage || "Revisa los campos.";
    return;
  }
  go(+1);
  render();
}

function tryBack() {
  go(-1);
  render();
}

btnBack.addEventListener("click", tryBack);
btnNext.addEventListener("click", tryNext);

// Render inicial
render();
