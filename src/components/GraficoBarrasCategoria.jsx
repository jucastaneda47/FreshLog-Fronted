import { useEffect, useState } from "react";
import { obtenerIcono, obtenerColorHex } from "../utils/categoriaEstilos";

export default function GraficoBarrasCategoria({ datos, etiquetaValor = "en inventario", onClickCategoria }) {
  const [animado, setAnimado] = useState(false);

  useEffect(() => {
    setAnimado(false);
    const id = requestAnimationFrame(() => setAnimado(true));
    return () => cancelAnimationFrame(id);
  }, [datos]);

  if (!datos || datos.length === 0) {
    return <p className="text-sm text-slate-500">No hay datos todavía.</p>;
  }

  const max = Math.max(...datos.map((d) => d.cantidad_productos ?? d.valor ?? 0), 1);

  return (
    <div className="space-y-3">
      {datos.map((d) => {
        const valor = d.cantidad_productos ?? d.valor ?? 0;
        const color = obtenerColorHex(d.color);
        const Icono = obtenerIcono(d.icono);
        const pct = animado ? (valor / max) * 100 : 0;
        const Contenedor = onClickCategoria ? "button" : "div";

        return (
          <Contenedor
            key={d.categoria_id}
            onClick={onClickCategoria ? () => onClickCategoria(d) : undefined}
            className={`flex w-full items-center gap-3 text-left ${onClickCategoria ? "cursor-pointer" : ""}`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}22`, color }}
            >
              <Icono size={15} strokeWidth={2.25} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-700">{d.categoria_nombre}</p>
                <p className="shrink-0 text-xs font-semibold text-slate-500">
                  {valor} {etiquetaValor}
                </p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                    transition: "width 700ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
            </div>
          </Contenedor>
        );
      })}
    </div>
  );
}
