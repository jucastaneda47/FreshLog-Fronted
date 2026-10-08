import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import PageLayout from "../components/PageLayout";
import { useSync } from "../context/SyncContext";
import Aviso from "../components/Aviso";
import GraficoTorta from "../components/GraficoTorta";
import { obtenerColorHex, obtenerIcono } from "../utils/categoriaEstilos";
import {
  consultarInventario, registrarConsumo,
  consultarRiesgoCategoria, consultarAprovechamiento,
} from "../api/client";

const ESTILO_ESTADO = {
  vigente: { etiqueta: "Vigente", clase: "bg-green-100 text-green-700" },
  proximo_a_vencer: { etiqueta: "Próximo", clase: "bg-amber-100 text-amber-700" },
  vencido: { etiqueta: "Vencido", clase: "bg-red-100 text-red-700" },
};

export default function Consumo() {
  const [inventario, setInventario] = useState([]);
  const { enLinea } = useSync();
  const [cargando, setCargando] = useState(true);
  const [loteSeleccionado, setLoteSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [aviso, setAviso] = useState(null); // { tipo, titulo, texto }
  const [enviando, setEnviando] = useState(false);

  const [riesgo, setRiesgo] = useState([]);
  const [cargandoRiesgo, setCargandoRiesgo] = useState(true);
  const [aprovechamiento, setAprovechamiento] = useState(null);
  const [cargandoAprovechamiento, setCargandoAprovechamiento] = useState(true);

  async function cargar() {
    setCargando(true);
    try {
      const data = await consultarInventario();
      setInventario(data);
      if (data.length > 0 && !data.some((i) => String(i.lote_id) === loteSeleccionado)) {
        setLoteSeleccionado(String(data[0].lote_id));
      }
    } catch {
      /* sin conexión y sin copia guardada */
    } finally {
      setCargando(false);
    }
  }

  // Al terminar una sincronización de compras, se actualiza la lista
  useEffect(() => {
    window.addEventListener("freshlog:sincronizado", cargar);
    return () => window.removeEventListener("freshlog:sincronizado", cargar);
  }, []);

  useEffect(() => {
    cargar();

    setCargandoRiesgo(true);
    consultarRiesgoCategoria()
      .then(setRiesgo)
      .catch(() => {})
      .finally(() => setCargandoRiesgo(false));

    setCargandoAprovechamiento(true);
    consultarAprovechamiento()
      .then(setAprovechamiento)
      .catch(() => {})
      .finally(() => setCargandoAprovechamiento(false));
  }, []);

  async function manejarConfirmarConsumo() {
    setAviso(null);
    if (!loteSeleccionado || !cantidad) {
      setAviso({
        tipo: "error",
        titulo: "Faltan datos",
        texto: "Selecciona un producto e ingresa la cantidad.",
      });
      return;
    }
    if (Number(cantidad) <= 0) {
      setAviso({
        tipo: "error",
        titulo: "Cantidad no válida",
        texto: "La cantidad debe ser mayor a 0.",
      });
      return;
    }
    const item = inventario.find((i) => String(i.lote_id) === String(loteSeleccionado));
    if (item?.estado === "vencido") {
      setAviso({
        tipo: "error",
        titulo: "Producto vencido",
        texto: "Producto vencido, retírelo de la alacena.",
      });
      return;
    }
    setEnviando(true);
    try {
      await registrarConsumo({
        lote_id: Number(loteSeleccionado),
        cantidad: Number(cantidad),
        tipo: "consumo",
      });
      setCantidad("");
      setAviso({
        tipo: "exito",
        titulo: "¡Consumo registrado!",
        texto: item
          ? `Se descontaron ${cantidad} ${item.unidad_abreviatura} de ${item.producto_nombre}.`
          : "El inventario se actualizó correctamente.",
      });
      cargar();
    } catch (err) {
      const detalle = err.response?.data?.detail;
      if (typeof detalle === "string" && detalle.toLowerCase().includes("vencido")) {
        setAviso({ tipo: "error", titulo: "Producto vencido", texto: detalle });
      } else {
        setAviso({
          tipo: "error",
          titulo: "No se pudo registrar el consumo",
          texto: detalle || "Intenta de nuevo.",
        });
      }
    } finally {
      setEnviando(false);
    }
  }

  async function manejarRetirar(item) {
    setAviso(null);
    try {
      await registrarConsumo({
        lote_id: item.lote_id,
        cantidad: item.cantidad_actual,
        tipo: "retiro",
      });
      cargar();
    } catch (err) {
      setAviso({
        tipo: "error",
        titulo: "No se pudo retirar el producto",
        texto: err.response?.data?.detail || "Intenta de nuevo.",
      });
    }
  }

  return (
    <PageLayout
      titulo="Consumo y vencimientos"
      subtitulo="Prioriza el uso de productos según su fecha de vencimiento"
    >
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Riesgo por categoría</p>
          <p className="mb-4 text-xs text-slate-400">
            Lotes con stock que están próximos a vencer ahora mismo — pasa el mouse para ver cuáles
          </p>
          {cargandoRiesgo ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : riesgo.length === 0 ? (
            <p className="text-sm text-slate-500">Ninguna categoría tiene lotes próximos a vencer ahora.</p>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
              <GraficoTorta
                datos={riesgo.map((r) => ({
                  label: r.categoria_nombre,
                  valor: r.cantidad_lotes,
                  color: obtenerColorHex(r.color),
                  icono: r.icono,
                  detalle: r.productos.map(
                    (p) => `${p.producto_nombre} · ${p.dias_restantes} ${p.dias_restantes === 1 ? "día" : "días"}`
                  ),
                }))}
                unidad="lote"
                size={170}
              />
              <ul className="space-y-2">
                {riesgo.map((r) => (
                  <li key={r.categoria_id} className="flex items-center gap-2 text-sm text-slate-600">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: obtenerColorHex(r.color) }}
                    />
                    {r.categoria_nombre} · {r.cantidad_lotes}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Aprovechamiento</p>
          <p className="mb-4 text-xs text-slate-400">
            Cuántos lotes se consumieron a tiempo y cuántos vencieron sin consumir — pasa el mouse para ver cuáles
          </p>
          {cargandoAprovechamiento ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : !aprovechamiento || aprovechamiento.aprovechados + aprovechamiento.desperdiciados === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay lotes resueltos para evaluar.</p>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
              <GraficoTorta
                datos={[
                  {
                    label: "Consumido a tiempo",
                    valor: aprovechamiento.aprovechados,
                    color: "#16a34a",
                    Icono: CheckCircle2,
                    detalle: aprovechamiento.productos_aprovechados.map(
                      (p) => `${p.producto_nombre} ×${p.cantidad}`
                    ),
                  },
                  {
                    label: "Vencido sin consumir",
                    valor: aprovechamiento.desperdiciados,
                    color: "#dc2626",
                    Icono: AlertTriangle,
                    detalle: aprovechamiento.productos_desperdiciados.map(
                      (p) => `${p.producto_nombre} ×${p.cantidad}`
                    ),
                  },
                ]}
                unidad="lote"
                size={170}
              />
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-600" />
                  Consumido a tiempo · {aprovechamiento.aprovechados}
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" />
                  Vencido sin consumir · {aprovechamiento.desperdiciados}
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold text-slate-700">Prioridad de consumo</p>
            <p className="text-xs text-slate-400">Ordenado por días restantes para vencer</p>
          </div>

          {cargando ? (
            <p className="px-5 py-5 text-sm text-slate-500">Cargando...</p>
          ) : inventario.length === 0 ? (
            <p className="px-5 py-5 text-sm text-slate-500">
              No hay productos en inventario todavía.
            </p>
          ) : (
            <table className="hidden w-full text-left text-sm lg:table">
              <thead>
                <tr className="text-xs uppercase text-slate-400">
                  <th className="px-5 py-3">Producto</th>
                  <th className="px-5 py-3">Días restantes</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {inventario.map((item) => {
                  const estado = ESTILO_ESTADO[item.estado] ?? ESTILO_ESTADO.vigente;
                  const colorCategoria = obtenerColorHex(item.categoria_color);
                  const IconoCategoria = obtenerIcono(item.categoria_icono);
                  return (
                    <tr key={item.lote_id} className="border-t border-slate-100">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${colorCategoria}22`, color: colorCategoria }}
                          >
                            <IconoCategoria size={14} strokeWidth={2.25} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800">{item.producto_nombre}</p>
                            <p className="text-xs text-slate-400">
                              {item.cantidad_actual} de {item.cantidad_inicial} {item.unidad_abreviatura}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {item.estado === "vencido" ? "Vencido" : `${item.dias_restantes} días`}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estado.clase}`}>
                          {estado.etiqueta}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {item.estado === "vencido" ? (
                          <button
                            onClick={() => manejarRetirar(item)}
                            disabled={!enLinea}
                            title={enLinea ? undefined : "Necesita conexión a internet"}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Retirar
                          </button>
                        ) : (
                          <button
                            onClick={() => setLoteSeleccionado(String(item.lote_id))}
                            className="rounded-lg bg-alacena-dark px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Registrar consumo
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Celular: una tarjeta por lote en lugar de tabla */}
          {!cargando && inventario.length > 0 && (
            <ul className="divide-y divide-slate-100 lg:hidden">
              {inventario.map((item) => {
                const estado = ESTILO_ESTADO[item.estado] ?? ESTILO_ESTADO.vigente;
                const colorCategoria = obtenerColorHex(item.categoria_color);
                const IconoCategoria = obtenerIcono(item.categoria_icono);
                return (
                  <li key={item.lote_id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${colorCategoria}22`, color: colorCategoria }}
                        >
                          <IconoCategoria size={15} strokeWidth={2.25} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{item.producto_nombre}</p>
                          <p className="text-xs text-slate-400">
                            {item.cantidad_actual} de {item.cantidad_inicial} {item.unidad_abreviatura} ·{" "}
                            {item.estado === "vencido" ? "Vencido" : `${item.dias_restantes} días`}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${estado.clase}`}>
                        {estado.etiqueta}
                      </span>
                    </div>
                    <div className="mt-2 pl-[46px]">
                      {item.estado === "vencido" ? (
                        <button
                          onClick={() => manejarRetirar(item)}
                          disabled={!enLinea}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Retirar
                        </button>
                      ) : (
                        <button
                          onClick={() => setLoteSeleccionado(String(item.lote_id))}
                          className="rounded-lg bg-alacena-dark px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Registrar consumo
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Registrar consumo</p>
          <p className="mb-4 text-xs text-slate-400">Descuenta unidades del inventario</p>

          <label className="mb-1 block text-xs font-medium text-slate-600">Producto</label>
          <select
            value={loteSeleccionado}
            onChange={(e) => setLoteSeleccionado(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {inventario.map((item) => (
              <option key={item.lote_id} value={item.lote_id}>
                {item.producto_nombre} — {item.cantidad_actual} {item.unidad_abreviatura} disp.
                {item.estado === "vencido" ? " (vencido)" : ""}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-xs font-medium text-slate-600">Cantidad consumida</label>
          <input
            type="number"
            step="0.1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Ej. 1"
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />


          <button
            onClick={manejarConfirmarConsumo}
            disabled={enviando || !enLinea}
            className="w-full rounded-lg bg-alacena-dark py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {enviando ? "Guardando..." : "Confirmar consumo"}
          </button>
          {!enLinea && (
            <p className="mt-2 text-xs text-amber-600">
              Registrar consumos necesita conexión a internet. Puedes consultar el inventario guardado.
            </p>
          )}

          <div className="mt-5 text-xs text-slate-500">
            <p className="mb-1.5 font-medium text-slate-600">Clasificación automática de estado</p>
            <p className="mb-1">
              <span className="text-green-600">●</span> Vigente · más de 5 días
            </p>
            <p className="mb-1">
              <span className="text-amber-600">●</span> Próximo a vencer · 5 días o menos
            </p>
            <p>
              <span className="text-red-600">●</span> Vencido · 0 días
            </p>
          </div>
        </div>
      </div>
      {aviso && (
        <Aviso tipo={aviso.tipo} titulo={aviso.titulo} onCerrar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}
    </PageLayout>
  );
}
