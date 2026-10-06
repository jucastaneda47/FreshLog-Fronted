import { useEffect, useState } from "react";
import { obtenerIcono, obtenerColorHex } from "../utils/categoriaEstilos";

const ESTILO_PUESTO = [
  { bg: "#fef3c7", fg: "#b45309", anillo: "#fbbf24" }, // oro
  { bg: "#f1f5f9", fg: "#475569", anillo: "#cbd5e1" }, // plata
  { bg: "#fed7aa", fg: "#9a3412", anillo: "#fb923c" }, // bronce
  { bg: "#f8fafc", fg: "#94a3b8", anillo: "#e2e8f0" },
  { bg: "#f8fafc", fg: "#94a3b8", anillo: "#e2e8f0" },
];

export default function GraficoRanking({ datos }) {
  const [animado, setAnimado] = useState(false);

  // Arranca las barras en 0% y las anima hasta su valor real, y se
  // reinicia cada vez que cambian los datos (ej. al alternar el período).
  useEffect(() => {
    setAnimado(false);
    const id = requestAnimationFrame(() => setAnimado(true));
    return () => cancelAnimationFrame(id);
  }, [datos]);

  if (!datos || datos.length === 0) {
    return <p className="text-sm text-slate-500">No hay compras registradas todavía.</p>;
  }

  const max = Math.max(...datos.map((d) => d.veces_comprado), 1);

  return (
    <div className="space-y-4">
      {datos.map((d, i) => {
        const estilo = ESTILO_PUESTO[i] ?? ESTILO_PUESTO[4];
        const pct = animado ? (d.veces_comprado / max) * 100 : 0;
        const color = obtenerColorHex(d.color);
        const Icono = obtenerIcono(d.icono);
        return (
          <div key={d.producto_id} className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2"
              style={{ backgroundColor: estilo.bg, color: estilo.fg, borderColor: estilo.anillo, boxShadow: `inset 0 0 0 1.5px ${estilo.anillo}` }}
            >
              {i + 1}
            </span>

            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}22`, color }}
            >
              <Icono size={14} strokeWidth={2.25} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-700">{d.producto_nombre}</p>
                <p className="shrink-0 text-xs font-semibold text-slate-500">
                  {d.veces_comprado} {d.veces_comprado === 1 ? "compra" : "compras"}
                </p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color, transition: "width 700ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
