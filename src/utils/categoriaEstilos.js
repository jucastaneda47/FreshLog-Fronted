import {
  Wheat, Milk, Drumstick, Sandwich, Apple, Carrot, Droplet, SprayCan,
  CupSoda, Croissant, Snowflake, Fish, Egg, Cookie, Coffee, Package,
} from "lucide-react";

export const ICONOS_DISPONIBLES = [
  { clave: "wheat", Icono: Wheat },
  { clave: "milk", Icono: Milk },
  { clave: "drumstick", Icono: Drumstick },
  { clave: "sandwich", Icono: Sandwich },
  { clave: "apple", Icono: Apple },
  { clave: "carrot", Icono: Carrot },
  { clave: "droplet", Icono: Droplet },
  { clave: "spray-can", Icono: SprayCan },
  { clave: "cup-soda", Icono: CupSoda },
  { clave: "croissant", Icono: Croissant },
  { clave: "snowflake", Icono: Snowflake },
  { clave: "fish", Icono: Fish },
  { clave: "egg", Icono: Egg },
  { clave: "cookie", Icono: Cookie },
  { clave: "coffee", Icono: Coffee },
  { clave: "package", Icono: Package },
];

export const COLORES_DISPONIBLES = [
  { clave: "amber", bg: "bg-amber-100", fg: "text-amber-700", muestra: "bg-amber-400", hex: "#fbbf24" },
  { clave: "sky", bg: "bg-sky-100", fg: "text-sky-700", muestra: "bg-sky-400", hex: "#38bdf8" },
  { clave: "rose", bg: "bg-rose-100", fg: "text-rose-700", muestra: "bg-rose-400", hex: "#fb7185" },
  { clave: "orange", bg: "bg-orange-100", fg: "text-orange-700", muestra: "bg-orange-400", hex: "#fb923c" },
  { clave: "pink", bg: "bg-pink-100", fg: "text-pink-700", muestra: "bg-pink-400", hex: "#f472b6" },
  { clave: "green", bg: "bg-green-100", fg: "text-green-700", muestra: "bg-green-400", hex: "#4ade80" },
  { clave: "yellow", bg: "bg-yellow-100", fg: "text-yellow-700", muestra: "bg-yellow-400", hex: "#facc15" },
  { clave: "cyan", bg: "bg-cyan-100", fg: "text-cyan-700", muestra: "bg-cyan-400", hex: "#22d3ee" },
  { clave: "purple", bg: "bg-purple-100", fg: "text-purple-700", muestra: "bg-purple-400", hex: "#c084fc" },
  { clave: "stone", bg: "bg-stone-100", fg: "text-stone-700", muestra: "bg-stone-400", hex: "#a8a29e" },
  { clave: "blue", bg: "bg-blue-100", fg: "text-blue-700", muestra: "bg-blue-400", hex: "#60a5fa" },
  { clave: "emerald", bg: "bg-emerald-100", fg: "text-emerald-700", muestra: "bg-emerald-400", hex: "#34d399" },
  { clave: "indigo", bg: "bg-indigo-100", fg: "text-indigo-700", muestra: "bg-indigo-400", hex: "#818cf8" },
  { clave: "fuchsia", bg: "bg-fuchsia-100", fg: "text-fuchsia-700", muestra: "bg-fuchsia-400", hex: "#e879f9" },
  { clave: "lime", bg: "bg-lime-100", fg: "text-lime-700", muestra: "bg-lime-400", hex: "#a3e635" },
  { clave: "teal", bg: "bg-teal-100", fg: "text-teal-700", muestra: "bg-teal-400", hex: "#2dd4bf" },
  { clave: "slate", bg: "bg-slate-100", fg: "text-slate-700", muestra: "bg-slate-400", hex: "#94a3b8" },
];

const ICONOS_POR_CLAVE = Object.fromEntries(ICONOS_DISPONIBLES.map((i) => [i.clave, i.Icono]));
const COLORES_POR_CLAVE = Object.fromEntries(COLORES_DISPONIBLES.map((c) => [c.clave, c]));

export function obtenerIcono(clave) {
  return ICONOS_POR_CLAVE[clave] || Package;
}

export function obtenerColor(clave) {
  return COLORES_POR_CLAVE[clave] || COLORES_DISPONIBLES[COLORES_DISPONIBLES.length - 1];
}

export function obtenerColorHex(clave) {
  return obtenerColor(clave).hex;
}
