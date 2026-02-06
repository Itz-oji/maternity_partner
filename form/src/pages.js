import { getField, updateField } from "./store.js";

import { introPage } from "./pages/intro/intro.js";
import { cliente } from "./pages/cliente/cliente.js";
import { grupoFamiliarPage } from "./pages/grupo-familiar/grupoFamiliar.js";
import { cotizacionPage } from "./pages/cotizacion/cotizacion.js";
import { consentimientoPage } from "./pages/consentimiento/consentimiento.js";
// ...

export const pages = [
  introPage,
  cliente,
  grupoFamiliarPage,
  cotizacionPage,
  consentimientoPage,
  // ...
];