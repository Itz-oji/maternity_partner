const KEY = "mp_form_state_v1";

function getNavType() {
  // Moderno
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  if (nav?.type) return nav.type; // "reload" | "navigate" | "back_forward" | "prerender"

  // Fallback antiguo
  const legacy = performance.navigation?.type; // 1=reload, 0=navigate, 2=back_forward
  if (legacy === 1) return "reload";
  if (legacy === 2) return "back_forward";
  return "navigate";
}

function defaultState() {
  return {
    currentPage: 0,
    data: {
      nombre: "",
      email: "",
      comuna: "",
    },
  };
}

function loadState() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // validación mínima para evitar crasheos por datos corruptos
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.currentPage !== "number") parsed.currentPage = 0;
    if (!parsed.data || typeof parsed.data !== "object") parsed.data = {};

    return parsed;
  } catch {
    return null;
  }
}

function persistState() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // si falla el storage, seguimos sin persistencia
  }
}

// ✅ Solo conservar estado si fue RELOAD (Ctrl+R / F5)
const navType = getNavType();
if (navType !== "reload") {
  sessionStorage.removeItem(KEY);
}

const restored = navType === "reload" ? loadState() : null;

// Estado en memoria (tu store)
const state = restored ?? defaultState();

export function getState() {
  return structuredClone(state);
}

export function setPage(index) {
  state.currentPage = Number(index) || 0;
  persistState();
}

export function updateField(key, value) {
  state.data[key] = value;
  persistState();
}

export function getField(key) {
  return state.data[key];
}

// (Opcional) por si quieres botón “reiniciar formulario”
export function resetStore() {
  const fresh = defaultState();
  state.currentPage = fresh.currentPage;
  state.data = fresh.data;
  sessionStorage.removeItem(KEY);
}
