// Estado de la conexión con el servidor. No basta con navigator.onLine (puede decir "en línea"
// con el WiFi sin salida a Internet), así que también se marca "sin red" cuando una petición
// falla por red y se marca "en línea" cuando una petición llega al servidor.

let enLinea = typeof navigator === "undefined" ? true : navigator.onLine !== false;
const oyentes = new Set();

function avisar() {
  oyentes.forEach((f) => f(enLinea));
}

export function estaEnLinea() {
  return enLinea;
}

export function fijarEnLinea(valor) {
  if (valor === enLinea) return;
  enLinea = valor;
  avisar();
}

export function suscribirConexion(funcion) {
  oyentes.add(funcion);
  return () => oyentes.delete(funcion);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => fijarEnLinea(true));
  window.addEventListener("offline", () => fijarEnLinea(false));
}
