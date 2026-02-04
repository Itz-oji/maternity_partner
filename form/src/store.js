const state = {
  currentPage: 0,
  data: {
    nombre: "",
    email: "",
    comuna: ""
  }
};

export function getState() {
  return structuredClone(state);
}

export function setPage(index) {
  state.currentPage = index;
}

export function updateField(key, value) {
  state.data[key] = value;
}

export function getField(key) {
  return state.data[key];
}
