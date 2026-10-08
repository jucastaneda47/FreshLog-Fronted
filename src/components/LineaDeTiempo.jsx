import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Utensils, Trash2, AlertTriangle } from "lucide-react";

const CARRILES = [
  { clave: "compra", etiqueta: "Compras", color: "#2563eb", Icono: ShoppingCart },
  { clave: "salida", etiqueta: "Consumos y retiros", color: "#0d9488", Icono: Utensils },
  { clave: "vencimiento", etiqueta: "Vencimientos", color: "#dc2626", Icono: AlertTriangle },
];

const CHIPS = [
  { clave: "compra", etiqueta: "Compras", color: "#2563eb" },
  { clave: "salida", etiqueta: "Consumos y retiros", color: "#0d9488" },
  { clave: "vencimiento", etiqueta: "Vencimientos", color: "#dc2626" },
];

const TAMANO_PAGINA = 15;

function carrilDe(tipo) {
  if (tipo === "compra") return 0;
  if (tipo === "vencimiento") return 2;
  return 1; // consumo o retiro
}

function formatearEje(t) {
  return new Date(t).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function formatearCompleta(fechaIso) {
  return new Date(fechaIso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function GraficoTimeline({ eventos, alto = 230 }) {
  const [hoverId, setHoverId] = useState(null);

  const ancho = 600;
  const paddingIzq = 118;
  const paddingDer = 16;
  const paddingSup = 14;
  const paddingInf = 26;

  const anchoUtil = ancho - paddingIzq - paddingDer;
  const altoUtil = alto - paddingSup - paddingInf;
  const alturaCarril = altoUtil / 3;
  const centrosCarril = [0, 1, 2].map((i) => paddingSup + alturaCarril * (i + 0.5));

  const marcasTiempo = eventos.map((e) => new Date(e.fecha).getTime());
  const minFecha = Math.min(...marcasTiempo);
  const maxFecha = Math.max(...marcasTiempo);
  const rango = Math.max(maxFecha - minFecha, 1000 * 60 * 60 * 24);
  const margen = rango * 0.06;
  const dominioMin = minFecha - margen;
  const dominioMax = maxFecha + margen;

  function coordX(fechaMs) {
    return paddingIzq + ((fechaMs - dominioMin) / (dominioMax - dominioMin)) * anchoUtil;
  }

  // Reparte verticalmente los eventos del mismo día y carril para que no queden encimados
  const claveGrupo = (ev) => `${carrilDe(ev.tipo)}-${new Date(ev.fecha).toDateString()}`;
  const grupos = {};
  eventos.forEach((ev) => {
    const clave = claveGrupo(ev);
    (grupos[clave] = grupos[clave] || []).push(ev);
  });

  const puntos = eventos.map((ev) => {
    const carril = carrilDe(ev.tipo);
    const grupo = grupos[claveGrupo(ev)];
    const posicion = grupo.indexOf(ev);
    const limite = alturaCarril / 2 - 11;
    const jitter = Math.max(-limite, Math.min(limite, (posicion - (grupo.length - 1) / 2) * 11));
    return { ev, carril, x: coordX(new Date(ev.fecha).getTime()), y: centrosCarril[carril] + jitter };
  });

  const cantidadMarcas = 5;
  const marcasEje = Array.from({ length: cantidadMarcas }, (_, i) =>
    Math.round(dominioMin + ((dominioMax - dominioMin) * i) / (cantidadMarcas - 1))
  );

  const puntoActivo = puntos.find((p) => p.ev.id === hoverId);

  return (
    <div>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full overflow-visible" preserveAspectRatio="none">
        {/* Fondo alterno por carril */}
        {[0, 1, 2].map((i) => (
          <rect
            key={`fondo-${i}`}
            x={paddingIzq}
            y={paddingSup + alturaCarril * i}
            width={anchoUtil}
            height={alturaCarril}
            fill={i % 2 === 0 ? "#f8fafc" : "#ffffff"}
          />
        ))}

        {/* Etiquetas de carril */}
        {CARRILES.map((carril, i) => (
          <text
            key={carril.clave}
            x={paddingIzq - 10}
            y={centrosCarril[i] + 3}
            textAnchor="end"
            fontSize="10"
            fontWeight="600"
            fill={carril.color}
          >
            {carril.etiqueta}
          </text>
        ))}

        {/* Línea base de cada carril */}
        {[0, 1, 2].map((i) => (
          <line
            key={`base-${i}`}
            x1={paddingIzq}
            x2={ancho - paddingDer}
            y1={centrosCarril[i]}
            y2={centrosCarril[i]}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        ))}

        {/* Marcas verticales sutiles del eje X */}
        {marcasEje.map((t, i) => (
          <line
            key={`marca-${i}`}
            x1={coordX(t)}
            x2={coordX(t)}
            y1={paddingSup}
            y2={paddingSup + altoUtil}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}

        {/* Puntos de evento */}
        {puntos.map(({ ev, x, y }) => {
          const estilo = CARRILES[carrilDe(ev.tipo)];
          const activo = hoverId === ev.id;
          const atenuado = hoverId !== null && !activo;
          const Icono = estilo.Icono;
          return (
            <g
              key={ev.id}
              transform={`translate(${x} ${y})`}
              style={{ transition: "opacity 150ms ease", opacity: atenuado ? 0.25 : 1, cursor: "pointer" }}
              onMouseEnter={() => setHoverId(ev.id)}
              onMouseLeave={() => setHoverId(null)}
            >
              <circle
                r={activo ? 11 : 8}
                fill={estilo.color}
                stroke="#fff"
                strokeWidth="2"
                style={{
                  transition: "r 120ms ease",
                  filter: activo ? "drop-shadow(0 3px 5px rgba(15,23,42,.3))" : "none",
                }}
              />
              <g style={{ pointerEvents: "none" }}>
                <Icono x={-6} y={-6} size={12} color="#fff" strokeWidth={2.5} />
              </g>
            </g>
          );
        })}

        {/* Tooltip */}
        {puntoActivo &&
          (() => {
            const lineas = [
              formatearCompleta(puntoActivo.ev.fecha),
              puntoActivo.ev.titulo,
              puntoActivo.ev.detalle,
            ];
            const anchoTexto = Math.max(...lineas.map((t) => t.length)) * 5.3;
            const anchoCaja = Math.min(230, Math.max(120, Math.round(anchoTexto) + 16));
            const xCaja = Math.min(
              Math.max(puntoActivo.x - anchoCaja / 2, paddingIzq),
              ancho - anchoCaja - 2
            );
            const haySitioArriba = puntoActivo.y - paddingSup > 46;
            const yCaja = haySitioArriba ? puntoActivo.y - 60 : puntoActivo.y + 16;
            return (
              <g transform={`translate(${xCaja} ${yCaja})`} style={{ pointerEvents: "none" }}>
                <rect width={anchoCaja} height={48} rx="6" fill="#0f172a" opacity="0.94" />
                <text x={8} y={14} fontSize="9" fill="#94a3b8" fontWeight="600">
                  {formatearCompleta(puntoActivo.ev.fecha)}
                </text>
                <text x={8} y={27} fontSize="9.5" fill="#fff" fontWeight="600">
                  {puntoActivo.ev.titulo}
                </text>
                <text x={8} y={40} fontSize="9" fill="#cbd5e1">
                  {puntoActivo.ev.detalle}
                </text>
              </g>
            );
          })()}
      </svg>

      <div
        className="mt-1 flex justify-between text-[10px] text-slate-400"
        style={{
          paddingLeft: `${(paddingIzq / ancho) * 100}%`,
          paddingRight: `${(paddingDer / ancho) * 100}%`,
        }}
      >
        {marcasEje.map((t, i) => (
          <span key={i}>{formatearEje(t)}</span>
        ))}
      </div>
    </div>
  );
}

export default function LineaDeTiempo({
  eventos, // TODOS los eventos que cumplen los chips + fechas (ya vienen así del backend)
  total,
  cargando,
  chipsActivos,
  onToggleChip,
  desde,
  hasta,
  onCambiarDesde,
  onCambiarHasta,
}) {
  const hayFiltroFecha = Boolean(desde) || Boolean(hasta);
  const [pasosCargados, setPasosCargados] = useState(1);

  // Cada vez que llega un set de eventos nuevo (cambió un chip o una fecha),
  // se vuelve a empezar desde la primera página.
  useEffect(() => {
    setPasosCargados(1);
  }, [eventos]);

  const gruposPorCarril = useMemo(() => {
    const grupos = { 0: [], 1: [], 2: [] };
    eventos.forEach((ev) => grupos[carrilDe(ev.tipo)].push(ev));
    return grupos;
  }, [eventos]);

  const eventosVisibles = useMemo(() => {
    if (hayFiltroFecha) return eventos;
    const limite = pasosCargados * TAMANO_PAGINA;
    // Se toman los N más recientes DE CADA CARRIL por separado, para que
    // compras, consumos/retiros y vencimientos aparezcan siempre juntos
    // desde la primera página, sin que un tipo con menos eventos quede
    // opacado por otro más frecuente.
    return [0, 1, 2].flatMap((carril) => gruposPorCarril[carril].slice(0, limite));
  }, [eventos, gruposPorCarril, pasosCargados, hayFiltroFecha]);

  const hayMas =
    !hayFiltroFecha &&
    [0, 1, 2].some((carril) => gruposPorCarril[carril].length > pasosCargados * TAMANO_PAGINA);
  const sePuedeVerMenos = !hayFiltroFecha && pasosCargados > 1;

  return (
    <div>
      {/* Filtros: chips por tipo + rango de fechas */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {CHIPS.map((chip) => {
          const activo = chipsActivos.has(chip.clave);
          return (
            <button
              key={chip.clave}
              onClick={() => onToggleChip(chip.clave)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition"
              style={
                activo
                  ? { backgroundColor: `${chip.color}1a`, color: chip.color, boxShadow: `inset 0 0 0 1px ${chip.color}55` }
                  : { backgroundColor: "#f8fafc", color: "#94a3b8", boxShadow: "inset 0 0 0 1px #e2e8f0" }
              }
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activo ? chip.color : "#cbd5e1" }} />
              {chip.etiqueta}
            </button>
          );
        })}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 md:ml-auto">
          <label className="flex items-center gap-1.5">
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => onCambiarDesde(e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
            />
          </label>
          <label className="flex items-center gap-1.5">
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => onCambiarHasta(e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
            />
          </label>
          {hayFiltroFecha && (
            <button
              onClick={() => {
                onCambiarDesde("");
                onCambiarHasta("");
              }}
              className="text-slate-400 underline decoration-dotted hover:text-alacena-accent"
            >
              Quitar
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : eventosVisibles.length === 0 ? (
        <p className="text-sm text-slate-500">No hay movimientos con estos filtros.</p>
      ) : (
        <GraficoTimeline eventos={eventosVisibles} />
      )}

      {!cargando && eventosVisibles.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400">
            {hayFiltroFecha
              ? `Mostrando los ${total} movimientos entre esas fechas`
              : `Mostrando ${eventosVisibles.length} de ${total}`}
          </p>
          <div className="flex gap-2">
            {sePuedeVerMenos && (
              <button
                onClick={() => setPasosCargados(1)}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Ver menos
              </button>
            )}
            {hayMas && (
              <button
                onClick={() => setPasosCargados((p) => p + 1)}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cargar más
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
