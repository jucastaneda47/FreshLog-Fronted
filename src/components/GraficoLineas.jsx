import { useId, useState } from "react";

export default function GraficoLineas({ etiquetas, series, alto = 200, tituloEjeY }) {
  const ancho = 600;
  const paddingIzq = tituloEjeY ? 46 : 34;
  const paddingDer = 12;
  const paddingSup = 16;
  const paddingInf = 22;

  const idBase = useId();
  const [indiceActivo, setIndiceActivo] = useState(null);

  const valorMaximo = Math.max(1, ...series.flatMap((s) => s.valores));
  const topeEje =
    valorMaximo <= 4 ? Math.max(valorMaximo, 2) : Math.ceil(valorMaximo / 5) * 5;

  const anchoUtil = ancho - paddingIzq - paddingDer;
  const altoUtil = alto - paddingSup - paddingInf;
  const pasoX = etiquetas.length > 1 ? anchoUtil / (etiquetas.length - 1) : 0;

  function coordX(i) {
    return paddingIzq + i * pasoX;
  }
  function coordY(v) {
    return paddingSup + altoUtil - (v / topeEje) * altoUtil;
  }
  function coordenadas(valores) {
    return valores.map((v, i) => ({ x: coordX(i), y: coordY(v) }));
  }

  // Curva suave: usa una bezier cúbica con el punto de control en el
  // punto medio horizontal entre cada par de puntos.
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

  return (
    <div>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          {series.map((s, idx) => (
            <linearGradient key={s.label} id={`${idBase}-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Cuadrícula + etiquetas del eje Y */}
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
                {Math.round(f * topeEje)}
              </text>
            </g>
          );
        })}

        {/* Título del eje Y */}
        {tituloEjeY && (
          <text
            x={11}
            y={paddingSup + altoUtil / 2}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#94a3b8"
            transform={`rotate(-90 11 ${paddingSup + altoUtil / 2})`}
          >
            {tituloEjeY}
          </text>
        )}

        {/* Área con degradado bajo cada línea */}
        {series.map((s, idx) => (
          <path
            key={`area-${s.label}`}
            d={pathArea(coordenadas(s.valores))}
            fill={`url(#${idBase}-grad-${idx})`}
            stroke="none"
          />
        ))}

        {/* Líneas suaves */}
        {series.map((s) => (
          <path
            key={`linea-${s.label}`}
            d={pathSuave(coordenadas(s.valores))}
            fill="none"
            stroke={s.color}
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

        {/* Puntos de cada serie */}
        {series.map((s) =>
          coordenadas(s.valores).map((p, i) => (
            <circle
              key={`${s.label}-${i}`}
              cx={p.x}
              cy={p.y}
              r={indiceActivo === i ? 5 : 3}
              fill={s.color}
              stroke="#fff"
              strokeWidth={indiceActivo === i ? 2 : 1.5}
              style={{ transition: "r 120ms ease" }}
            />
          ))
        )}

        {/* Zonas invisibles para detectar el hover por período */}
        {etiquetas.map((_, i) => {
          const centro = coordX(i);
          const inicio = i === 0 ? 0 : centro - pasoX / 2;
          const fin = i === etiquetas.length - 1 ? ancho : centro + pasoX / 2;
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
            const lineas = [
              etiquetas[indiceActivo],
              ...series.map((s) => `${s.label}: ${s.valores[indiceActivo]}`),
            ];
            const anchoTexto = Math.max(...lineas.map((t) => t.length)) * 6.3;
            const anchoCaja = Math.min(260, Math.max(120, Math.round(anchoTexto) + 24));
            const xCaja = Math.min(
              Math.max(coordX(indiceActivo) - anchoCaja / 2, 2),
              ancho - anchoCaja - 2
            );
            const altoCaja = 24 + lineas.length * 17;
            return (
              <g transform={`translate(${xCaja} 4)`} style={{ pointerEvents: "none" }}>
                <rect width={anchoCaja} height={altoCaja} rx="8" fill="#0f172a" opacity="0.94" />
                <text x={12} y={18} fontSize="11.5" fill="#fff" fontWeight="700">
                  {etiquetas[indiceActivo]}
                </text>
                {series.map((s, idx) => (
                  <text key={s.label} x={12} y={18 + (idx + 1) * 17} fontSize="10.5" fill="#cbd5e1">
                    {s.label}: {s.valores[indiceActivo]}
                  </text>
                ))}
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
        {etiquetas.map((e) => (
          <span key={e}>{e}</span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        {series.map((s) => (
          <span
            key={s.label}
            className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
