import { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import GraficoLineas from "../components/GraficoLineas";
import GraficoBarrasEmparejadas from "../components/GraficoBarrasEmparejadas";
import GraficoTorta from "../components/GraficoTorta";
import Aviso from "../components/Aviso";
import ConfirmarEliminar from "../components/ConfirmarEliminar";
import { obtenerIcono, obtenerColorHex } from "../utils/categoriaEstilos";
import {
  listarAlertas, atenderAlerta,
  consultarAlertasPorPeriodo, consultarAlertasAtencion,
  consultarAlertasPorCategoria, eliminarHistorialAlertas,
} from "../api/client";

const ETIQUETA_TIPO = {
  proximo_a_vencer: "Próximo a vencer",
  vencido: "Vencido",
  stock_minimo: "Stock mínimo",
};

const COLOR_TIPO = {
  proximo_a_vencer: "bg-amber-100 text-amber-600",
  vencido: "bg-red-100 text-red-600",
  stock_minimo: "bg-blue-100 text-blue-600",
};

const TIPOS_TORTA = [
  { clave: "vencido", etiqueta: "Vencidas", color: "#dc2626" },
  { clave: "proximo_a_vencer", etiqueta: "Próximas a vencer", color: "#f59e0b" },
  { clave: "stock_minimo", etiqueta: "Stock mínimo", color: "#7c3aed" },
];

// Filtros del historial de seguimiento (meses; null = todo el historial)
const FILTROS_HISTORIAL = [
  { meses: null, etiqueta: "Todo" },
  { meses: 1, etiqueta: "1 mes" },
  { meses: 3, etiqueta: "3 meses" },
  { meses: 6, etiqueta: "6 meses" },
  { meses: 12, etiqueta: "1 año" },
];

// Resta meses calendario ajustando el día si el mes destino es más corto
// (misma regla que usa el backend al eliminar).
function restarMeses(fecha, meses) {
  const indice = fecha.getFullYear() * 12 + fecha.getMonth() - meses;
  const anio = Math.floor(indice / 12);
  const mes = indice % 12;
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  return new Date(
    anio, mes, Math.min(fecha.getDate(), ultimoDia),
    fecha.getHours(), fecha.getMinutes(), fecha.getSeconds()
  );
}

// El backend guarda las fechas en UTC sin zona; se interpretan como UTC.
function fechaGenerada(fechaIso) {
  return new Date(/Z|[+-]\d\d:?\d\d$/.test(fechaIso) ? fechaIso : `${fechaIso}Z`);
}

function formatearFecha(fechaIso) {
  const fecha = fechaGenerada(fechaIso);
  return fecha.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Alertas() {
  const [activas, setActivas] = useState([]);
  const [atendidas, setAtendidas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [periodo, setPeriodo] = useState("semana");
  const [alertasPeriodo, setAlertasPeriodo] = useState([]);
  const [cargandoAlertasPeriodo, setCargandoAlertasPeriodo] = useState(true);
  const [atencionPorTipo, setAtencionPorTipo] = useState([]);
  const [cargandoAtencion, setCargandoAtencion] = useState(true);

  const [porCategoria, setPorCategoria] = useState(null);
  const [cargandoCategoria, setCargandoCategoria] = useState(true);
  const [tipoTorta, setTipoTorta] = useState("vencido");

  const [filtroMeses, setFiltroMeses] = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");
  const [aviso, setAviso] = useState(null);

  function cargarGraficosSeguimiento() {
    setCargandoAtencion(true);
    consultarAlertasAtencion()
      .then(setAtencionPorTipo)
      .finally(() => setCargandoAtencion(false));

    setCargandoCategoria(true);
    consultarAlertasPorCategoria()
      .then(setPorCategoria)
      .finally(() => setCargandoCategoria(false));
  }

  async function cargar() {
    setCargando(true);
    try {
      const [act, aten] = await Promise.all([
        listarAlertas({ atendida: false }),
        listarAlertas({ atendida: true }),
      ]);
      setActivas(act);
      setAtendidas(aten);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    cargarGraficosSeguimiento();
  }, []);

  useEffect(() => {
    setCargandoAlertasPeriodo(true);
    consultarAlertasPorPeriodo({ periodo, cantidadPeriodos: 6 })
      .then(setAlertasPeriodo)
      .finally(() => setCargandoAlertasPeriodo(false));
  }, [periodo]);

  async function manejarAtender(id) {
    await atenderAlerta(id);
    cargar();
    cargarGraficosSeguimiento();
  }

  // Historial filtrado: solo lo generado dentro del período elegido.
  const ahora = new Date();
  const limiteFiltro = filtroMeses ? restarMeses(ahora, filtroMeses) : null;
  const atendidasVisibles = limiteFiltro
    ? atendidas.filter((a) => fechaGenerada(a.fecha_generada) >= limiteFiltro)
    : atendidas;
  // Registros más antiguos que el filtro: son los que elimina el botón.
  const cantidadAntiguas = limiteFiltro
    ? atendidas.filter((a) => fechaGenerada(a.fecha_generada) < limiteFiltro).length
    : 0;
  const etiquetaFiltro = FILTROS_HISTORIAL.find((f) => f.meses === filtroMeses)?.etiqueta;

  async function confirmarEliminarHistorial() {
    setEliminando(true);
    setErrorEliminar("");
    try {
      const { eliminadas } = await eliminarHistorialAlertas(filtroMeses);
      setConfirmandoEliminar(false);
      setAviso({
        tipo: "exito",
        titulo: "Historial actualizado",
        texto:
          eliminadas === 1
            ? `Se eliminó 1 registro con más de ${etiquetaFiltro} de antigüedad.`
            : `Se eliminaron ${eliminadas} registros con más de ${etiquetaFiltro} de antigüedad.`,
      });
      cargar();
      cargarGraficosSeguimiento();
      consultarAlertasPorPeriodo({ periodo, cantidadPeriodos: 6 }).then(setAlertasPeriodo);
    } catch (err) {
      const detalle = err.response?.data?.detail;
      setErrorEliminar(typeof detalle === "string" ? detalle : "No se pudo eliminar el historial.");
    } finally {
      setEliminando(false);
    }
  }

  const tortaActual = TIPOS_TORTA.find((t) => t.clave === tipoTorta);
  const gruposTorta = porCategoria?.[tipoTorta] ?? [];

  return (
    <PageLayout
      titulo="Alertas y seguimiento"
      subtitulo="Avisos sobre vencimientos y stock mínimo"
    >
      {aviso && (
        <Aviso tipo={aviso.tipo} titulo={aviso.titulo} onCerrar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}
      {confirmandoEliminar && (
        <ConfirmarEliminar
          titulo={`¿Eliminar registros de hace más de ${etiquetaFiltro}?`}
          mensaje={`Se eliminarán ${cantidadAntiguas} ${
            cantidadAntiguas === 1 ? "registro atendido" : "registros atendidos"
          } del historial de seguimiento con más de ${etiquetaFiltro} de antigüedad. Esta acción no se puede deshacer.`}
          error={errorEliminar}
          cargando={eliminando}
          textoConfirmar="Sí, eliminar"
          onConfirmar={confirmarEliminarHistorial}
          onCancelar={() => {
            setConfirmandoEliminar(false);
            setErrorEliminar("");
          }}
        />
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Alertas por período</p>
              <p className="text-xs text-slate-400">
                Últimas 6 {periodo === "semana" ? "semanas" : "meses"}, por tipo
              </p>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
              <button
                onClick={() => setPeriodo("semana")}
                className={`rounded-md px-3 py-1 ${
                  periodo === "semana" ? "bg-white shadow-sm" : "text-slate-500"
                }`}
              >
                Semanas
              </button>
              <button
                onClick={() => setPeriodo("mes")}
                className={`rounded-md px-3 py-1 ${
                  periodo === "mes" ? "bg-white shadow-sm" : "text-slate-500"
                }`}
              >
                Meses
              </button>
            </div>
          </div>

          {cargandoAlertasPeriodo ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : (
            <GraficoLineas
              etiquetas={alertasPeriodo.map((a) => a.periodo)}
              tituloEjeY="Número de alertas"
              series={[
                {
                  label: "Próximo a vencer",
                  color: "#f59e0b",
                  valores: alertasPeriodo.map((a) => a.proximo_a_vencer),
                },
                {
                  label: "Vencido",
                  color: "#dc2626",
                  valores: alertasPeriodo.map((a) => a.vencido),
                },
                {
                  label: "Stock mínimo",
                  color: "#7c3aed",
                  valores: alertasPeriodo.map((a) => a.stock_minimo),
                },
              ]}
            />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Atendidas vs. pendientes</p>
          <p className="mb-4 text-xs text-slate-400">Clasificado por tipo de alerta</p>
          {cargandoAtencion ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : atencionPorTipo.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no se han generado alertas.</p>
          ) : (
            <GraficoBarrasEmparejadas
              filas={atencionPorTipo.map((a) => ({
                id: a.tipo,
                etiqueta: a.tipo_nombre,
                valores: { atendidas: a.atendidas, pendientes: a.pendientes },
                detalle: {
                  atendidas: a.detalle_atendidas ?? [],
                  pendientes: a.detalle_pendientes ?? [],
                },
              }))}
              series={[
                { clave: "atendidas", etiqueta: "Atendida", color: "#16a34a" },
                { clave: "pendientes", etiqueta: "Pendiente", color: "#dc2626" },
              ]}
            />
          )}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Alertas por categoría</p>
            <p className="text-xs text-slate-400">
              Pendientes y atendidas — pasa el mouse para ver los productos
            </p>
          </div>
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            {TIPOS_TORTA.map((t) => (
              <button
                key={t.clave}
                onClick={() => setTipoTorta(t.clave)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 ${
                  tipoTorta === t.clave ? "bg-white shadow-sm" : "text-slate-500"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                {t.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {cargandoCategoria ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : gruposTorta.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay alertas de tipo "{tortaActual.etiqueta.toLowerCase()}" todavía.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <GraficoTorta
              datos={gruposTorta.map((g) => ({
                label: g.categoria_nombre,
                valor: g.cantidad,
                color: obtenerColorHex(g.color),
                icono: g.icono,
                detalle: g.productos,
              }))}
              unidad="alerta"
              size={200}
            />
            <ul className="space-y-2">
              {gruposTorta.map((g) => (
                <li key={g.categoria_id} className="flex items-center gap-2 text-sm text-slate-600">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: obtenerColorHex(g.color) }}
                  />
                  {g.categoria_nombre} · {g.cantidad}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold text-slate-700">Alertas activas</p>
            <p className="text-xs text-slate-400">
              {cargando ? "Cargando..." : `${activas.length} pendientes por atender`}
            </p>
          </div>

          {!cargando && activas.length === 0 ? (
            <p className="px-5 py-5 text-sm text-slate-500">No tienes alertas activas.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {activas.map((a) => {
                const colorCategoria = obtenerColorHex(a.categoria_color);
                const IconoCategoria = obtenerIcono(a.categoria_icono);
                return (
                  <div key={a.id} className="flex items-start gap-3 px-5 py-4">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${colorCategoria}22`, color: colorCategoria }}
                    >
                      <IconoCategoria size={14} strokeWidth={2.25} />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${COLOR_TIPO[a.tipo]}`} />
                        <p className="text-sm font-medium text-slate-800">
                          {a.producto_nombre} — {ETIQUETA_TIPO[a.tipo]}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">{formatearFecha(a.fecha_generada)}</p>
                    </div>
                    <button
                      onClick={() => manejarAtender(a.id)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Marcar atendida
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Seguimiento</p>
          <p className="mb-3 text-xs text-slate-400">Historial de atención</p>

          <div className="mb-4 flex flex-wrap gap-1.5">
            {FILTROS_HISTORIAL.map((f) => (
              <button
                key={f.etiqueta}
                onClick={() => setFiltroMeses(f.meses)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filtroMeses === f.meses
                    ? "bg-alacena-dark text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.etiqueta}
              </button>
            ))}
          </div>

          {filtroMeses && (
            <button
              onClick={() => setConfirmandoEliminar(true)}
              disabled={cantidadAntiguas === 0}
              className="mb-4 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cantidadAntiguas === 0
                ? `No hay registros de hace más de ${etiquetaFiltro}`
                : `Eliminar registros de hace más de ${etiquetaFiltro} (${cantidadAntiguas})`}
            </button>
          )}

          {atendidas.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no has atendido ninguna alerta.</p>
          ) : atendidasVisibles.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay alertas atendidas en los últimos {etiquetaFiltro}.
            </p>
          ) : (
            <ul className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {atendidasVisibles.map((a) => {
                const colorCategoria = obtenerColorHex(a.categoria_color);
                const IconoCategoria = obtenerIcono(a.categoria_icono);
                return (
                  <li key={a.id} className="flex items-center gap-2.5 text-sm">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${colorCategoria}22`, color: colorCategoria }}
                    >
                      <IconoCategoria size={13} strokeWidth={2.25} />
                    </span>
                    <div>
                      <p className="font-medium text-slate-800">
                        {a.producto_nombre} — atendida
                      </p>
                      <p className="text-xs text-slate-500">
                        {ETIQUETA_TIPO[a.tipo]} · {formatearFecha(a.fecha_generada)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
