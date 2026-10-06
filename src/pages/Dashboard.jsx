import { useEffect, useState } from "react";
import { X } from "lucide-react";
import PageLayout from "../components/PageLayout";
import GraficoLineas from "../components/GraficoLineas";
import GraficoTorta from "../components/GraficoTorta";
import GraficoDesperdicio from "../components/GraficoDesperdicio";
import LineaDeTiempo from "../components/LineaDeTiempo";
import GraficoRanking from "../components/GraficoRanking";
import { obtenerColorHex } from "../utils/categoriaEstilos";
import {
  listarAlertas, consultarInventario, consultarMovimientos,
  consultarDistribucionCategorias, consultarProductosDeCategoria,
  consultarDesperdicio, consultarHistorial, consultarRankingProductos,
  consultarConfiguracionDesperdicio, actualizarConfiguracionDesperdicio,
} from "../api/client";

const OPCIONES_PERIODO_RANKING = [
  { valor: "1m", etiqueta: "1 mes" },
  { valor: "3m", etiqueta: "3 meses" },
  { valor: "6m", etiqueta: "6 meses" },
  { valor: "total", etiqueta: "Total" },
];

function tiposParaConsulta(chips) {
  const tipos = [];
  if (chips.has("compra")) tipos.push("compra");
  if (chips.has("salida")) tipos.push("consumo", "retiro");
  if (chips.has("vencimiento")) tipos.push("vencimiento");
  return tipos.join(",");
}

function formatearFechaCorta(fechaIso) {
  return new Date(fechaIso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [inventario, setInventario] = useState([]);
  const [alertasActivas, setAlertasActivas] = useState([]);
  const [cargandoResumen, setCargandoResumen] = useState(true);

  const [alertasRecordatorio, setAlertasRecordatorio] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);

  const [periodo, setPeriodo] = useState("semana");
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(true);

  const [distribucion, setDistribucion] = useState([]);
  const [cargandoDistribucion, setCargandoDistribucion] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  const [desperdicio, setDesperdicio] = useState([]);
  const [cargandoDesperdicio, setCargandoDesperdicio] = useState(true);
  const [configDesperdicio, setConfigDesperdicio] = useState({ promedio: 10, meta: 2 });

  const [chipsHistorial, setChipsHistorial] = useState(
    () => new Set(["compra", "salida", "vencimiento"])
  );
  const [desdeHistorial, setDesdeHistorial] = useState("");
  const [hastaHistorial, setHastaHistorial] = useState("");
  const [eventosHistorial, setEventosHistorial] = useState([]);
  const [totalHistorial, setTotalHistorial] = useState(0);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);

  const [periodoRanking, setPeriodoRanking] = useState("1m");
  const [ranking, setRanking] = useState([]);
  const [cargandoRanking, setCargandoRanking] = useState(true);

  useEffect(() => {
    async function cargarResumenYAlertas() {
      setCargandoResumen(true);
      try {
        const [inv, alertas] = await Promise.all([
          consultarInventario(),
          listarAlertas({ atendida: false }),
        ]);
        setInventario(inv);
        setAlertasActivas(alertas);

        const relevantes = alertas.filter(
          (a) => a.tipo === "proximo_a_vencer" || a.tipo === "vencido"
        );
        if (relevantes.length > 0) setAlertasRecordatorio(relevantes);
      } finally {
        setCargandoResumen(false);
      }
    }
    cargarResumenYAlertas();
  }, []);

  useEffect(() => {
    setCargandoMovimientos(true);
    consultarMovimientos({ periodo, cantidad_periodos: 6 })
      .then(setMovimientos)
      .finally(() => setCargandoMovimientos(false));
  }, [periodo]);

  useEffect(() => {
    setCargandoDistribucion(true);
    consultarDistribucionCategorias()
      .then(setDistribucion)
      .finally(() => setCargandoDistribucion(false));
  }, []);

  useEffect(() => {
    setCargandoDesperdicio(true);
    consultarDesperdicio({ cantidad_meses: 6 })
      .then(setDesperdicio)
      .finally(() => setCargandoDesperdicio(false));

    consultarConfiguracionDesperdicio().then(setConfigDesperdicio);
  }, []);

  async function manejarCambiarPromedioDesperdicio(promedio) {
    const actualizado = await actualizarConfiguracionDesperdicio({ promedio });
    setConfigDesperdicio(actualizado);
  }

  async function manejarCambiarMetaDesperdicio(meta) {
    const actualizado = await actualizarConfiguracionDesperdicio({ meta });
    setConfigDesperdicio(actualizado);
  }

  useEffect(() => {
    setCargandoHistorial(true);
    consultarHistorial({
      tipos: tiposParaConsulta(chipsHistorial),
      desde: desdeHistorial,
      hasta: hastaHistorial,
    })
      .then((data) => {
        setEventosHistorial(data.eventos);
        setTotalHistorial(data.total);
      })
      .finally(() => setCargandoHistorial(false));
  }, [chipsHistorial, desdeHistorial, hastaHistorial]);

  useEffect(() => {
    setCargandoRanking(true);
    consultarRankingProductos({ periodo: periodoRanking })
      .then(setRanking)
      .finally(() => setCargandoRanking(false));
  }, [periodoRanking]);

  function alternarChipHistorial(clave) {
    setChipsHistorial((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(clave)) nuevo.delete(clave);
      else nuevo.add(clave);
      return nuevo;
    });
  }

  const vigentes = inventario.filter((i) => i.estado === "vigente");
  const proximos = inventario.filter((i) => i.estado === "proximo_a_vencer");
  const vencidos = inventario.filter((i) => i.estado === "vencido");
  const bajoStock = alertasActivas.filter((a) => a.tipo === "stock_minimo");

  const DETALLES = {
    vigente: { titulo: "Productos vigentes", items: vigentes, formato: "inventario" },
    proximo_a_vencer: { titulo: "Próximos a vencer", items: proximos, formato: "inventario" },
    vencido: { titulo: "Vencidos sin retirar", items: vencidos, formato: "inventario" },
    stock_minimo: { titulo: "Bajo stock mínimo", items: bajoStock, formato: "stock" },
  };

  function abrirDetalle(tipo) {
    setModalDetalle(DETALLES[tipo]);
  }

  async function abrirCategoria(categoria) {
    const productos = await consultarProductosDeCategoria(categoria.categoria_id);
    setCategoriaSeleccionada({ ...categoria, productos });
  }

  const resumen = [
    { label: "Productos vigentes", valor: vigentes.length, color: "text-green-600", tipo: "vigente" },
    { label: "Próximos a vencer", valor: proximos.length, color: "text-amber-600", tipo: "proximo_a_vencer" },
    { label: "Vencidos sin retirar", valor: vencidos.length, color: "text-red-600", tipo: "vencido" },
    { label: "Bajo stock mínimo", valor: bajoStock.length, color: "text-purple-600", tipo: "stock_minimo" },
  ];

  return (
    <PageLayout titulo="Tablero y reportes" subtitulo="Estado general de tu alacena hoy">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {resumen.map((item) => (
          <button
            key={item.label}
            onClick={() => abrirDetalle(item.tipo)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-alacena-accent hover:shadow-md"
          >
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>
              {cargandoResumen ? "…" : item.valor}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">Movimientos</p>
              <p className="text-xs text-slate-400">
                Compras vs. consumo — últimos 6 {periodo === "semana" ? "semanas" : "meses"}
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

          {cargandoMovimientos ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : (
            <GraficoLineas
              etiquetas={movimientos.map((m) => m.periodo)}
              series={[
                {
                  label: "Compras registradas",
                  color: "#0f2744",
                  valores: movimientos.map((m) => m.compras),
                },
                {
                  label: "Productos consumidos",
                  color: "#60a5fa",
                  valores: movimientos.map((m) => m.consumos),
                },
              ]}
            />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Semáforo de inventario</p>
          <p className="mb-4 text-xs text-slate-400">Distribución actual por estado</p>
          <BarraEstado
            label="Vigente"
            valor={vigentes.length}
            color="bg-green-500"
            onClick={() => abrirDetalle("vigente")}
          />
          <BarraEstado
            label="Próximo a vencer"
            valor={proximos.length}
            color="bg-amber-500"
            onClick={() => abrirDetalle("proximo_a_vencer")}
          />
          <BarraEstado
            label="Vencido"
            valor={vencidos.length}
            color="bg-red-500"
            onClick={() => abrirDetalle("vencido")}
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">Distribución del inventario por categoría</p>
        <p className="mb-4 text-xs text-slate-400">
          Cuántos productos distintos manejas en cada categoría — tocá una porción para ver el detalle
        </p>

        {cargandoDistribucion ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : distribucion.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay productos registrados.</p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
            <GraficoTorta
              datos={distribucion.map((c) => ({
                label: c.categoria_nombre,
                valor: c.cantidad_productos,
                color: obtenerColorHex(c.color),
                icono: c.icono,
                onClick: () => abrirCategoria(c),
              }))}
              size={200}
            />
            <ul className="space-y-2">
              {distribucion.map((c) => (
                <li key={c.categoria_id}>
                  <button
                    onClick={() => abrirCategoria(c)}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-alacena-accent"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: obtenerColorHex(c.color) }}
                    />
                    {c.categoria_nombre}
                    <span className="text-xs text-slate-400">({c.cantidad_productos})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">Evolución del desperdicio</p>
        <p className="mb-4 text-xs text-slate-400">
          Lotes que llegaron a su fecha de vencimiento con cantidad sin consumir — por mes ya cerrado
        </p>

        {cargandoDesperdicio ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <GraficoDesperdicio
            datos={desperdicio}
            promedio={configDesperdicio.promedio}
            meta={configDesperdicio.meta}
            onCambiarPromedio={manejarCambiarPromedioDesperdicio}
            onCambiarMeta={manejarCambiarMetaDesperdicio}
          />
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">Historial de movimientos</p>
        <p className="mb-4 text-xs text-slate-400">
          Compras, consumos, retiros y vencimientos 
        </p>

        <LineaDeTiempo
          eventos={eventosHistorial}
          total={totalHistorial}
          cargando={cargandoHistorial}
          chipsActivos={chipsHistorial}
          onToggleChip={alternarChipHistorial}
          desde={desdeHistorial}
          hasta={hastaHistorial}
          onCambiarDesde={setDesdeHistorial}
          onCambiarHasta={setHastaHistorial}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Ranking de productos más comprados</p>
            <p className="text-xs text-slate-400">Top 5 por número de compras registradas</p>
          </div>
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            {OPCIONES_PERIODO_RANKING.map((op) => (
              <button
                key={op.valor}
                onClick={() => setPeriodoRanking(op.valor)}
                className={`rounded-md px-2.5 py-1 ${
                  periodoRanking === op.valor ? "bg-white shadow-sm" : "text-slate-500"
                }`}
              >
                {op.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {cargandoRanking ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <GraficoRanking datos={ranking} />
        )}
      </div>

      {alertasRecordatorio && (
        <ModalRecordatorio
          alertas={alertasRecordatorio}
          onCerrar={() => setAlertasRecordatorio(null)}
        />
      )}

      {modalDetalle && (
        <ModalDetalle detalle={modalDetalle} onCerrar={() => setModalDetalle(null)} />
      )}

      {categoriaSeleccionada && (
        <ModalCategoria
          categoria={categoriaSeleccionada}
          onCerrar={() => setCategoriaSeleccionada(null)}
        />
      )}
    </PageLayout>
  );
}

function BarraEstado({ label, valor, color, onClick }) {
  return (
    <div className="mb-3 flex items-center gap-3 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <button
        onClick={onClick}
        className="w-40 text-left text-slate-600 underline decoration-dotted underline-offset-2 hover:text-alacena-accent"
      >
        {label}
      </button>
      <span className="font-semibold text-slate-800">{valor}</span>
    </div>
  );
}

function ModalDetalle({ detalle, onCerrar }) {
  const { titulo, items, formato } = detalle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
          <button onClick={onCerrar} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No hay productos en esta categoría.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {items.map((item) => (
              <li
                key={item.lote_id ?? item.id}
                className="rounded-lg border border-slate-100 px-3 py-2"
              >
                <p className="text-sm font-medium text-slate-800">{item.producto_nombre}</p>
                {formato === "inventario" ? (
                  <p className="text-xs text-slate-500">
                    {item.cantidad_actual} {item.unidad_abreviatura} · vence{" "}
                    {formatearFechaCorta(item.fecha_vencimiento)}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    {item.cantidad_actual} {item.unidad_abreviatura} disponibles · mínimo{" "}
                    {item.stock_minimo} {item.unidad_abreviatura}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={onCerrar}
          className="mt-5 w-full rounded-lg bg-alacena-dark py-2.5 text-sm font-semibold text-white hover:bg-alacena-darker"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function ModalCategoria({ categoria, onCerrar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{categoria.categoria_nombre}</h2>
            <p className="text-xs text-slate-400">
              {categoria.cantidad_productos} producto{categoria.cantidad_productos > 1 ? "s" : ""} en esta categoría
            </p>
          </div>
          <button onClick={onCerrar} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {categoria.productos.length === 0 ? (
          <p className="text-sm text-slate-500">No hay productos todavía.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {categoria.productos.map((p) => (
              <li
                key={p.producto_id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
              >
                <p className="text-sm font-medium text-slate-800">{p.producto_nombre}</p>
                <p className="text-xs text-slate-500">
                  {p.veces_comprado} {p.veces_comprado === 1 ? "vez" : "veces"} comprado
                </p>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={onCerrar}
          className="mt-5 w-full rounded-lg bg-alacena-dark py-2.5 text-sm font-semibold text-white hover:bg-alacena-darker"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function ModalRecordatorio({ alertas, onCerrar }) {
  const vencidos = alertas.filter((a) => a.tipo === "vencido");
  const proximos = alertas.filter((a) => a.tipo === "proximo_a_vencer");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">
          Tenés {alertas.length} producto{alertas.length > 1 ? "s" : ""} que revisar
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Esto es lo que encontramos en tu alacena hoy.
        </p>

        <div className="max-h-64 space-y-3 overflow-y-auto">
          {vencidos.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-red-600">Vencidos</p>
              <ul className="space-y-1">
                {vencidos.map((a) => (
                  <li key={a.id} className="text-sm text-slate-700">
                    • {a.producto_nombre}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {proximos.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-amber-600">
                Próximos a vencer
              </p>
              <ul className="space-y-1">
                {proximos.map((a) => (
                  <li key={a.id} className="text-sm text-slate-700">
                    • {a.producto_nombre}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={onCerrar}
          className="mt-5 w-full rounded-lg bg-alacena-dark py-2.5 text-sm font-semibold text-white hover:bg-alacena-darker"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
