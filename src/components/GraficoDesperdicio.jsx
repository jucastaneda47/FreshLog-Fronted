import { useEffect, useId, useState } from "react";
import { obtenerIcono, obtenerColorHex } from "../utils/categoriaEstilos";

export default function GraficoDesperdicio({
  datos,
  alto = 200,
  promedio = 10,
  meta = 2,
  onCambiarPromedio,
  onCambiarMeta,
}) {
  const ancho = 600;
  const paddingIzq = 34;
  const paddingDer = 30;
  const paddingSup = 16;
  const paddingInf = 22;

  const idBase = useId();
  const [indiceActivo, setIndiceActivo] = useState(null);

  if (!datos || datos.length === 0) {
    return <p className="text-sm text-slate-500">No hay datos todavía.</p>;
  }

  const valoresValidos = datos
    .map((d) => d.porcentaje_desperdicio)
    .filter((v) => v !== null && v !== undefined);

  const valorMaximo = Math.max(promedio, meta, ...valoresValidos, 5);
  const topeEje = Math.min(100, Math.ceil((valorMaximo * 1.15) / 10) * 10);

  const anchoUtil = ancho - paddingIzq - paddingDer;
  const altoUtil = alto - paddingSup - paddingInf;
  const pasoX = datos.length > 1 ? anchoUtil / (datos.length - 1) : 0;

  function coordX(i) {
    return paddingIzq + i * pasoX;
  }
  function coordY(v) {
    return paddingSup + altoUtil - (v / topeEje) * altoUtil;
  }

  // Agrupa los índices con dato válido en tramos consecutivos, para no
  // trazar una línea recta sobre un mes sin lotes por vencer (hueco real).
  const tramos = [];
  let tramoActual = [];
  datos.forEach((d, i) => {
    if (d.porcentaje_desperdicio !== null && d.porcentaje_desperdicio !== undefined) {
      tramoActual.push({ x: coordX(i), y: coordY(d.porcentaje_desperdicio) });
    } else if (tramoActual.length > 0) {
      tramos.push(tramoActual);
      tramoActual = [];
    }
  });
  if (tramoActual.length > 0) tramos.push(tramoActual);

  function pathSuave(puntos) {
    if (puntos.length === 0) return "";
    if (puntos.length === 1) return `M ${puntos[0].x} ${puntos[0].y}`;
    let d = `M ${puntos[0].x} ${puntos[0].y}`;
    for (let i = 0; i < puntos.length - 1; i++) {
      const p0 = puntos[i];
      const p1 = puntos[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }

  function pathArea(puntos) {
    const base = coordY(0);
    const primero = puntos[0];
    const ultimo = puntos[puntos.length - 1];
    return `${pathSuave(puntos)} L ${ultimo.x} ${base} L ${primero.x} ${base} Z`;
  }

  const nivelesEje = [0, 0.25, 0.5, 0.75, 1];
  const colorLinea = "#ef4444";

  return (
    <div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${idBase}-grad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorLinea} stopOpacity="0.25" />
            <stop offset="100%" stopColor={colorLinea} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Cuadrícula + eje Y en % */}
        {nivelesEje.map((f) => {
          const y = paddingSup + altoUtil - f * altoUtil;
          return (
            <g key={f}>
              <line
                x1={paddingIzq}
                x2={ancho - paddingDer}
                y1={y}
                y2={y}
                stroke={f === 0 ? "#cbd5e1" : "#eef2f7"}
                strokeWidth="1"
              />
              <text x={paddingIzq - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                {Math.round(f * topeEje)}%
              </text>
            </g>
          );
        })}

        {/* Líneas de referencia: promedio y meta */}
        <ReferenciaHorizontal
          y={coordY(Math.min(promedio, topeEje))}
          x1={paddingIzq}
          x2={ancho - paddingDer}
          color="#94a3b8"
          etiqueta={`${promedio}%`}
        />
        <ReferenciaHorizontal
          y={coordY(Math.min(meta, topeEje))}
          x1={paddingIzq}
          x2={ancho - paddingDer}
          color="#16a34a"
          etiqueta={`${meta}%`}
        />

        {/* Área + línea por cada tramo continuo de datos */}
        {tramos.map((tramo, idx) => (
          <path key={`area-${idx}`} d={pathArea(tramo)} fill={`url(#${idBase}-grad)`} stroke="none" />
        ))}
        {tramos.map((tramo, idx) => (
          <path
            key={`linea-${idx}`}
            d={pathSuave(tramo)}
            fill="none"
            stroke={colorLinea}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Guía vertical al pasar el mouse */}
        {indiceActivo !== null && (
          <line
            x1={coordX(indiceActivo)}
            x2={coordX(indiceActivo)}
            y1={paddingSup}
            y2={paddingSup + altoUtil}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {/* Puntos (solo donde hay dato real) */}
        {datos.map((d, i) =>
          d.porcentaje_desperdicio === null || d.porcentaje_desperdicio === undefined ? null : (
            <circle
              key={i}
              cx={coordX(i)}
              cy={coordY(d.porcentaje_desperdicio)}
              r={indiceActivo === i ? 5 : 3}
              fill={colorLinea}
              stroke="#fff"
              strokeWidth={indiceActivo === i ? 2 : 1.5}
              style={{ transition: "r 120ms ease" }}
            />
          )
        )}

        {/* Zonas invisibles para detectar el hover por mes */}
        {datos.map((_, i) => {
          const centro = coordX(i);
          const inicio = i === 0 ? 0 : centro - pasoX / 2;
          const fin = i === datos.length - 1 ? ancho : centro + pasoX / 2;
          return (
            <rect
              key={`zona-${i}`}
              x={inicio}
              y={0}
              width={fin - inicio}
              height={alto}
              fill="transparent"
              onMouseEnter={() => setIndiceActivo(i)}
              onMouseLeave={() => setIndiceActivo(null)}
            />
          );
        })}

        {/* Tooltip */}
        {indiceActivo !== null &&
          (() => {
            const d = datos[indiceActivo];
            const sinDatos = d.porcentaje_desperdicio === null || d.porcentaje_desperdicio === undefined;
            const lineas = sinDatos
              ? [d.periodo, "Sin lotes por vencer"]
              : [
                  d.periodo,
                  `Desperdicio: ${d.porcentaje_desperdicio}%`,
                  `${d.lotes_desperdiciados} de ${d.total_lotes} lotes`,
                ];
            const anchoTexto = Math.max(...lineas.map((t) => t.length)) * 5.3;
            const anchoCaja = Math.min(230, Math.max(96, Math.round(anchoTexto) + 16));
            const xCaja = Math.min(
              Math.max(coordX(indiceActivo) - anchoCaja / 2, 2),
              ancho - anchoCaja - 2
            );
            const altoCaja = sinDatos ? 34 : 47;
            return (
              <g transform={`translate(${xCaja} 2)`} style={{ pointerEvents: "none" }}>
                <rect width={anchoCaja} height={altoCaja} rx="6" fill="#0f172a" opacity="0.92" />
                <text x={8} y={14} fontSize="9" fill="#cbd5e1" fontWeight="600">
                  {d.periodo}
                </text>
                {sinDatos ? (
                  <text x={8} y={27} fontSize="9" fill="#fff">
                    Sin lotes por vencer
                  </text>
                ) : (
                  <>
                    <text x={8} y={27} fontSize="9" fill="#fff">
                      Desperdicio: {d.porcentaje_desperdicio}%
                    </text>
                    <text x={8} y={40} fontSize="9" fill="#cbd5e1">
                      {d.lotes_desperdiciados} de {d.total_lotes} lotes
                    </text>
                  </>
                )}
              </g>
            );
          })()}
      </svg>

      <div
        className="mt-2 flex justify-between text-[10px] text-slate-400"
        style={{
          paddingLeft: `${(paddingIzq / ancho) * 100}%`,
          paddingRight: `${(paddingDer / ancho) * 100}%`,
        }}
      >
        {datos.map((d) => (
          <span key={d.periodo}>{d.periodo}</span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorLinea }} />
          % de desperdicio
        </span>
        <PastillaEditable
          etiqueta="Promedio"
          valor={promedio}
          color="#94a3b8"
          onGuardar={onCambiarPromedio}
        />
        <PastillaEditable
          etiqueta="Meta"
          valor={meta}
          color="#16a34a"
          onGuardar={onCambiarMeta}
        />
      </div>

      <DetalleProductosDelMes datos={datos} indiceActivo={indiceActivo} />
    </div>
  );
}

function PastillaEditable({ etiqueta, valor, color, onGuardar }) {
  const [editando, setEditando] = useState(false);
  const [valorTemp, setValorTemp] = useState(String(valor));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setValorTemp(String(valor));
  }, [valor]);

  async function confirmar() {
    const numero = Number(valorTemp);
    if (Number.isNaN(numero) || numero < 0 || numero > 100 || numero === valor || !onGuardar) {
      setValorTemp(String(valor));
      setEditando(false);
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(numero);
    } finally {
      setGuardando(false);
      setEditando(false);
    }
  }

  if (editando) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-300">
        <span className="h-2 w-2 shrink-0 rounded-full border-2 border-dashed" style={{ borderColor: color }} />
        {etiqueta}
        <input
          autoFocus
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={valorTemp}
          onChange={(e) => setValorTemp(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmar();
            if (e.key === "Escape") {
              setValorTemp(String(valor));
              setEditando(false);
            }
          }}
          disabled={guardando}
          className="w-12 rounded border border-slate-300 px-1 py-0.5 text-xs disabled:opacity-60"
        />
        %
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onGuardar && setEditando(true)}
      title={onGuardar ? "Clic para editar" : undefined}
      className={`flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100 ${
        onGuardar ? "hover:ring-slate-300" : ""
      }`}
    >
      <span className="h-2 w-2 rounded-full border-2 border-dashed" style={{ borderColor: color }} />
      {etiqueta} {valor}%
    </button>
  );
}

function DetalleProductosDelMes({ datos, indiceActivo }) {
  const mesPorDefecto = [...datos].reverse().find((d) => d.total_lotes > 0) || null;
  const mesActivo = indiceActivo !== null ? datos[indiceActivo] : mesPorDefecto;

  return (
    <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs ring-1 ring-slate-100">
      {!mesActivo ? (
        <span className="text-slate-400">
          Pasá el mouse sobre un punto del gráfico para ver qué productos pesaron más ese mes.
        </span>
      ) : mesActivo.total_lotes === 0 ? (
        <span className="text-slate-400">{mesActivo.periodo} no tuvo lotes por vencer.</span>
      ) : !mesActivo.productos_desperdiciados || mesActivo.productos_desperdiciados.length === 0 ? (
        <span className="text-green-600">{mesActivo.periodo}: ningún lote se desperdició.</span>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-slate-500">Lo que más se venció en {mesActivo.periodo}:</span>
          {mesActivo.productos_desperdiciados.map((p) => {
            const Icono = obtenerIcono(p.icono);
            const color = obtenerColorHex(p.color);
            return (
              <span key={p.producto_id} className="inline-flex items-center gap-1.5 text-slate-600">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  <Icono size={11} strokeWidth={2.25} />
                </span>
                {p.producto_nombre} <span className="font-semibold text-slate-700">×{p.cantidad}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReferenciaHorizontal({ y, x1, x2, color, etiqueta }) {
  return (
    <g>
      <line x1={x1} x2={x2} y1={y} y2={y} stroke={color} strokeWidth="1.25" strokeDasharray="4 3" opacity="0.85" />
      <text x={x2 + 4} y={y + 3} fontSize="8" fill={color} fontWeight="700">
        {etiqueta}
      </text>
    </g>
  );
}
