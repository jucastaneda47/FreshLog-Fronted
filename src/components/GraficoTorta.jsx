import { useState } from "react";
import { obtenerIcono } from "../utils/categoriaEstilos";

function desplazamiento(anguloGrados, distancia) {
  const rad = (anguloGrados * Math.PI) / 180;
  return [Math.cos(rad) * distancia, Math.sin(rad) * distancia];
}

export default function GraficoTorta({ datos, size = 180, grosorAnillo = 34, unidad = "producto", unidadPlural }) {
  const plural = unidadPlural || `${unidad}s`;
  const [indiceActivo, setIndiceActivo] = useState(null);
  const total = datos.reduce((acc, d) => acc + d.valor, 0);
  const radio = size / 2 - 6;
  const radioInterno = radio - grosorAnillo;
  const centro = size / 2;

  if (total === 0) {
    return <p className="text-sm text-slate-500">No hay datos todavía.</p>;
  }

  function coordenadas(angulo, r) {
    const rad = (angulo * Math.PI) / 180;
    return [centro + r * Math.cos(rad), centro + r * Math.sin(rad)];
  }

  function crearPath(anguloInicio, anguloFin) {
    // Un solo segmento = círculo completo: un arco de 360° no se puede dibujar
    // (inicio y fin coinciden), así que se dibuja el anillo con dos medias
    // circunferencias por cada borde (se usa con fillRule="evenodd").
    if (anguloFin - anguloInicio >= 359.99) {
      const anillo = (r) =>
        `M ${centro - r} ${centro} A ${r} ${r} 0 1 1 ${centro + r} ${centro} A ${r} ${r} 0 1 1 ${centro - r} ${centro} Z`;
      return `${anillo(radio)} ${anillo(radioInterno)}`;
    }
    const grandeArco = anguloFin - anguloInicio > 180 ? 1 : 0;
    const [x1, y1] = coordenadas(anguloInicio, radio);
    const [x2, y2] = coordenadas(anguloFin, radio);
    const [x3, y3] = coordenadas(anguloFin, radioInterno);
    const [x4, y4] = coordenadas(anguloInicio, radioInterno);
    return `M ${x1} ${y1} A ${radio} ${radio} 0 ${grandeArco} 1 ${x2} ${y2} L ${x3} ${y3} A ${radioInterno} ${radioInterno} 0 ${grandeArco} 0 ${x4} ${y4} Z`;
  }

  let anguloAcumulado = -90;
  const segmentos = datos.map((d) => {
    const anguloInicio = anguloAcumulado;
    const porcentaje = d.valor / total;
    anguloAcumulado += porcentaje * 360;
    return { ...d, anguloInicio, anguloFin: anguloAcumulado, porcentaje };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: size }} className="mx-auto overflow-visible">
      {segmentos.map((s, i) => {
        const activo = indiceActivo === i;
        const anguloMedio = (s.anguloInicio + s.anguloFin) / 2;
        const [dx, dy] = activo ? desplazamiento(anguloMedio, 6) : [0, 0];
        const anguloAbierto = s.anguloFin - s.anguloInicio;
        const Icono = s.Icono || obtenerIcono(s.icono);
        const [ix, iy] = coordenadas(anguloMedio, (radio + radioInterno) / 2);

        return (
          <g
            key={s.label}
            transform={`translate(${dx} ${dy})`}
            style={{
              transition: "transform 150ms ease, opacity 150ms ease",
              opacity: indiceActivo === null || activo ? 1 : 0.55,
              cursor: s.onClick ? "pointer" : "default",
            }}
            onMouseEnter={() => setIndiceActivo(i)}
            onMouseLeave={() => setIndiceActivo(null)}
            onClick={s.onClick}
          >
            <path
              d={crearPath(s.anguloInicio, s.anguloFin)}
              fill={s.color}
              fillRule="evenodd"
              stroke="#fff"
              strokeWidth="2"
              style={{ filter: activo ? "drop-shadow(0 3px 5px rgba(15,23,42,.28))" : "none" }}
            >
              <title>{`${s.label}: ${Math.round(s.porcentaje * 100)}%`}</title>
            </path>

            {anguloAbierto > 20 && (
              <g
                transform={`translate(${ix} ${iy})`}
                style={{ pointerEvents: "none", filter: "drop-shadow(0 1px 1px rgba(0,0,0,.35))" }}
              >
                <Icono x={-8} y={-8} size={16} color="#fff" strokeWidth={2.25} />
              </g>
            )}
          </g>
        );
      })}

      <text x={centro} y={centro - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">
        {total}
      </text>
      <text x={centro} y={centro + 14} textAnchor="middle" fontSize="9" fill="#94a3b8">
        {total === 1 ? unidad : plural}
      </text>

      {indiceActivo !== null &&
        (() => {
          const s = segmentos[indiceActivo];
          if (!s.detalle || s.detalle.length === 0) return null;

          const anguloMedio = (s.anguloInicio + s.anguloFin) / 2;
          const [px, py] = coordenadas(anguloMedio, radio + 10);

          const lineas = [s.label, ...s.detalle];
          const anchoTexto = Math.max(...lineas.map((t) => t.length)) * 6.3;
          const anchoCaja = Math.min(230, Math.max(110, Math.round(anchoTexto) + 24));
          const altoCaja = 24 + lineas.length * 17;

          const xCaja = Math.min(Math.max(px - anchoCaja / 2, 2), size - anchoCaja - 2);
          const yCaja = Math.min(Math.max(py - altoCaja / 2, 2), size - altoCaja - 2);

          return (
            <g transform={`translate(${xCaja} ${yCaja})`} style={{ pointerEvents: "none" }}>
              <rect width={anchoCaja} height={altoCaja} rx="8" fill="#0f172a" opacity="0.94" />
              <text x={12} y={18} fontSize="11.5" fill="#fff" fontWeight="700">
                {s.label}
              </text>
              {s.detalle.map((linea, idx) => (
                <text key={idx} x={12} y={18 + (idx + 1) * 17} fontSize="10.5" fill="#cbd5e1">
                  {linea}
                </text>
              ))}
            </g>
          );
        })()}
    </svg>
  );
}
