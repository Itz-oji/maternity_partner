export async function onRequestPost({ request }) {
  try {
    // 1. Leer datos enviados desde tu formulario
    const data = await request.json();

    // 2. URL de tu Google Apps Script (la que ya tienes)
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzE-5IjvSyaHLbQH9yIHbqNXS6eEs8tRdfut9pvQ3iTV-TYEEB_0un9WeCTki9DnL6rYA/exec";
    

    // 3. Enviar datos a Google (esto ocurre en el servidor, sin CORS)
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Apps Script a veces responde como texto
    const text = await res.text();

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message || "Error en proxy",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
