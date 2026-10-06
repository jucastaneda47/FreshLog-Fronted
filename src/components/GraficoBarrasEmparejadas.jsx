import { useEffect, useState } from "react";

/**
 * Barras horizontales emparejadas: una fila por elemento (categoría, tipo
 * de alerta, etc.), y dentro de cada fila una mini-barra por cada serie
 * (ej. "Comprado" / "Consumido", o "Atendida" / "Pendiente"). Todas las
 * barras comparten la misma escala para que se puedan comparar entre sí.
 *
 * filas: [{ id, etiqueta, Icono?, colorIcono?, valores: { claveSerie: numero },
 *           detalle?: { claveSerie: string[] } }]
 * series: [{ clave, etiqueta, color }]
 *
 * `detalle` es opcional: cuando una fila lo trae, al pasar el mouse sobre
 * la mini-barra de esa serie aparece un cuadro con el detalle (una línea
 * por elemento) de lo que compone ese número.
 */
export default function GraficoBarrasEmparejadas({ filas, series }) {
  const [animado, setAnimado] = useState(false);

  useEffect(() => {
    setAnimado(false);
    const id = requestAnimationFrame(() => setAnimado(true));
    return () => cancelAnimationFrame(id);
  }, [filas]);

  if (!filas || filas.length === 0) {
    return <p className="text-sm text-slate-500">No hay datos todavía.</p>;
  }

  const max = Math.max(
    1,
    ...filas.flatMap((f) => series.map((s) => f.valores[s.clave] ?? 0))
  );

  return (
    <div className="space-y-5">
      {filas.map((f) => (
        <div key={f.id}>
          <div className="mb-2 flex items-center gap-2">
            {f.Icono && (
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${f.colorIcono ?? "#64748b"}22`, color: f.colorIcono ?? "#64748b" }}
              >
                <f.Icono size={13} strokeWidth={2.25} />
              </span>
            )}
            <p className="text-sm font-medium text-slate-700">{f.etiqueta}</p>
          </div>

          <div className="space-y-1.5 pl-9">
            {series.map((s) => {
              const valor = f.valores[s.clave] ?? 0;
              const pct = animado ? (valor / max) * 100 : 0;
              const detalle = f.detalle?.[s.clave];
              return (
                <div key={s.clave} className="group relative flex items-center gap-2">
                  <span className="w-20 shrink-0 text-[11px] text-slate-500">{s.etiqueta}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: s.color,
                        transition: "width 700ms cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[11px] font-semibold text-slate-600">
                    {valor}
                  </span>

                  {detalle && detalle.length > 0 && (
                    <div className="pointer-events-none absolute bottom-full left-9 z-10 mb-1.5 hidden min-w-[170px] max-w-[260px] rounded-lg bg-slate-900/95 px-3 py-2 text-left shadow-lg group-hover:block">
                      <p className="mb-1 text-[11px] font-bold text-white">
                        {f.etiqueta} · {s.etiqueta}
                      </p>
                      {detalle.map((linea, idx) => (
                        <p key={idx} className="text-[10.5px] leading-snug text-slate-300">
                          {linea}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
