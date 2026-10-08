// Fechas que manda el servidor y cómo interpretarlas.
//
// - Fecha sola ("2026-10-10", p. ej. el vencimiento): es un día del calendario, sin hora.
//   new Date("2026-10-10") la toma como medianoche UTC y en Colombia (UTC-5) se vería como el
//   día 9. Por eso se construye con año, mes y día locales.
// - Fecha con hora que guarda el servidor en UTC pero sin zona ("2026-10-10T21:43:00"):
//   hay que decirle que es UTC (sufijo Z) para que se convierta a la hora local.

const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const CON_ZONA = /Z|[+-]\d\d:?\d\d$/;

export function fechaDeCalendario(texto) {
  const m = SOLO_FECHA.exec(texto);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(texto);
}

export function fechaUtc(texto) {
  if (SOLO_FECHA.test(texto) || CON_ZONA.test(texto)) return fechaDeCalendario(texto);
  return new Date(`${texto}Z`);
}
