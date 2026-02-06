export function formatRut(value) {
  if (!value) return "";

  // Limpia todo menos números y K
  let clean = value.replace(/[^0-9kK]/g, "").toUpperCase();

  // Máx: 8 dígitos + DV
  if (clean.length > 9) {
    clean = clean.slice(0, 9);
  }

  // Separa cuerpo y DV
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  // Formatea cuerpo con puntos
  let formattedBody = "";
  let reversed = body.split("").reverse();

  for (let i = 0; i < reversed.length; i++) {
    formattedBody = reversed[i] + formattedBody;
    if ((i + 1) % 3 === 0 && i + 1 !== reversed.length) {
      formattedBody = "." + formattedBody;
    }
  }

  return body.length ? `${formattedBody}-${dv}` : clean;
}
