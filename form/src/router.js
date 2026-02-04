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

export function getCurrentPage() {
  return pages[getState().currentPage];
}

export function getPageCount() {
  return pages.length;
}

export function getPageIndex() {
  return getState().currentPage;
}
