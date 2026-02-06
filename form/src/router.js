import { pages } from "./pages.js";
import { getState, setPage } from "./store.js";

export function canGoBack() {
  return getState().currentPage > 0;
}

export function canGoNext() {
  const { currentPage } = getState();
  return currentPage < pages.length - 1;
}

export function go(delta) {
  const { currentPage } = getState();
  const next = currentPage + delta;
  if (next < 0 || next >= pages.length) return;
  setPage(next);
}

export function goToPage(index) {
  const idx = Number(index);
  if (!Number.isFinite(idx)) return;
  if (idx < 0 || idx >= pages.length) return;
  setPage(idx);
}

export function getCurrentPage() {
  return pages[getState().currentPage];
}

export function getPageCount() {
  return pages.length;
}

export function getPageIndex() {
  return getState().currentPage;
}

/**
 * ✅ NUEVO: sincroniza el render con el currentPage guardado en store.
 * Úsalo 1 vez al iniciar tu app (especialmente útil en reload).
 *
 * @param {(page) => void|Promise<void>} renderFn  función que renderiza una page (pages[i])
 */
export async function syncPageFromStore(renderFn) {
  const page = getCurrentPage();
  if (typeof renderFn === "function") {
    await renderFn(page);
  }
}