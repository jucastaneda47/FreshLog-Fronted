import { useEffect, useRef, useState } from "react";
import { Plus, X, Trash2, CloudOff, AlertTriangle } from "lucide-react";
import Aviso from "../components/Aviso";
import { useSync } from "../context/SyncContext";
import PageLayout from "../components/PageLayout";
import GraficoBarrasCategoria from "../components/GraficoBarrasCategoria";
import GraficoBarrasEmparejadas from "../components/GraficoBarrasEmparejadas";
import { obtenerIcono, obtenerColorHex } from "../utils/categoriaEstilos";
import {
  consultarInventario, listarCategorias, listarUnidades,
  listarProductos,
  consultarDistribucionCategorias, consultarCompradoVsConsumidoCategoria,
} from "../api/client";

const ESTILO_ESTADO = {
  vigente: { etiqueta: "Vigente", clase: "bg-green-100 text-green-700" },
  proximo_a_vencer: { etiqueta: "Próximo a vencer", clase: "bg-amber-100 text-amber-700" },
  vencido: { etiqueta: "Vencido", clase: "bg-red-100 text-red-700" },
};

// Fecha de hoy (hora local) en formato YYYY-MM-DD, para el mínimo del selector de fecha
function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export default function Compras() {
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [avisoGuardado, setAvisoGuardado] = useState(null); // "enviada" | "pendiente"
  const categoriaActivaRef = useRef(null);
  categoriaActivaRef.current = categoriaActiva;

  const [distribucion, setDistribucion] = useState([]);
  const [cargandoDistribucion, setCargandoDistribucion] = useState(true);
  const [compradoConsumido, setCompradoConsumido] = useState([]);
  const [cargandoCompradoConsumido, setCargandoCompradoConsumido] = useState(true);

  async function cargarInventario(categoriaId) {
    setCargando(true);
    try {
      const data = await consultarInventario(
        categoriaId ? { categoria_id: categoriaId } : {}
      );
      setInventario(data);
    } catch {
      /* sin conexión y sin copia guardada: se deja la lista como estaba */
    } finally {
      setCargando(false);
    }
  }

  function cargarGraficos() {
    consultarDistribucionCategorias().then(setDistribucion).catch(() => {});
    consultarCompradoVsConsumidoCategoria().then(setCompradoConsumido).catch(() => {});
  }

  // Cuando termina una sincronización, se vuelve a pedir lo que muestra la pantalla
  useEffect(() => {
    function alSincronizar() {
      cargarInventario(categoriaActivaRef.current);
      cargarGraficos();
    }
    window.addEventListener("freshlog:sincronizado", alSincronizar);
    return () => window.removeEventListener("freshlog:sincronizado", alSincronizar);
  }, []);

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => {});
    cargarInventario(null);

    setCargandoDistribucion(true);
    consultarDistribucionCategorias()
      .then(setDistribucion)
      .catch(() => {})
      .finally(() => setCargandoDistribucion(false));

    setCargandoCompradoConsumido(true);
    consultarCompradoVsConsumidoCategoria()
      .then(setCompradoConsumido)
      .catch(() => {})
      .finally(() => setCargandoCompradoConsumido(false));
  }, []);

  function manejarFiltro(id) {
    setCategoriaActiva(id);
    cargarInventario(id);
  }

  return (
    <PageLayout
      titulo="Compras e inventario"
      subtitulo="Registra compras y consulta el estado de cada lote"
    >
      <PendientesDeSincronizar />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Stock actual por categoría</p>
          <p className="mb-4 text-xs text-slate-400">
            Cuántos productos distintos tienes disponibles en cada categoría
          </p>
          {cargandoDistribucion ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : (
            <GraficoBarrasCategoria datos={distribucion} etiquetaValor="productos" />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Comprado vs. consumido por categoría</p>
          <p className="mb-4 text-xs text-slate-400">
            Histórico total — lotes comprados contra veces que se consumió
          </p>
          {cargandoCompradoConsumido ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : compradoConsumido.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay actividad registrada.</p>
          ) : (
            <GraficoBarrasEmparejadas
              filas={compradoConsumido.map((c) => ({
                id: c.categoria_id,
                etiqueta: c.categoria_nombre,
                Icono: obtenerIcono(c.icono),
                colorIcono: obtenerColorHex(c.color),
                valores: { comprados: c.comprados, consumidos: c.consumidos },
              }))}
              series={[
                { clave: "comprados", etiqueta: "Comprado", color: "#2563eb" },
                { clave: "consumidos", etiqueta: "Consumido", color: "#0d9488" },
              ]}
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 md:px-5">
          <div>
            <p className="text-sm font-semibold text-slate-700">Inventario actual</p>
            <p className="text-xs text-slate-400">{inventario.length} lotes registrados</p>
          </div>
          <div className="flex flex-col items-stretch gap-2 md:items-end">
            <button
              onClick={() => setMostrarModal(true)}
              className="rounded-lg bg-alacena-dark px-4 py-2 text-xs font-semibold text-white hover:bg-alacena-darker"
            >
              + Registrar compra
            </button>
            <select
              value={categoriaActiva ?? ""}
              onChange={(e) => manejarFiltro(e.target.value === "" ? null : Number(e.target.value))}
              aria-label="Filtrar inventario por categoría"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-alacena-accent"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-3 md:px-5">
          <Chip activo={categoriaActiva === null} onClick={() => manejarFiltro(null)}>
            Todos
          </Chip>
          {categorias.map((c) => (
            <Chip
              key={c.id}
              activo={categoriaActiva === c.id}
              onClick={() => manejarFiltro(c.id)}
              color={obtenerColorHex(c.color)}
              Icono={obtenerIcono(c.icono)}
            >
              {c.nombre}
            </Chip>
          ))}
        </div>

        {cargando ? (
          <p className="px-5 pb-5 text-sm text-slate-500">Cargando...</p>
        ) : inventario.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-500">
            Todavía no hay productos en el inventario. Registra tu primera compra.
          </p>
        ) : (
          <table className="hidden w-full text-left text-sm lg:table">
            <thead>
              <tr className="text-xs uppercase text-slate-400">
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3">Cantidad</th>
                <th className="px-5 py-3">Vencimiento</th>
                <th className="px-5 py-3">Estado</th>
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
                          <p className="text-xs font-medium" style={{ color: colorCategoria }}>
                            {item.categoria_nombre}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {item.cantidad_actual} de {item.cantidad_inicial} {item.unidad_abreviatura}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{item.fecha_vencimiento}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estado.clase}`}>
                        {estado.etiqueta}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Celular: una tarjeta por lote en lugar de tabla */}
        {!cargando && inventario.length > 0 && (
          <ul className="divide-y divide-slate-100 border-t border-slate-100 lg:hidden">
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
                        <p className="text-xs font-medium" style={{ color: colorCategoria }}>
                          {item.categoria_nombre}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${estado.clase}`}>
                      {estado.etiqueta}
                    </span>
                  </div>
                  <p className="mt-2 pl-[46px] text-xs text-slate-500">
                    {item.cantidad_actual} de {item.cantidad_inicial} {item.unidad_abreviatura} · Vence {item.fecha_vencimiento}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {mostrarModal && (
        <ModalRegistrarCompra
          onCerrar={() => setMostrarModal(false)}
          onGuardado={(resultado) => {
            setMostrarModal(false);
            setAvisoGuardado(resultado);
            cargarInventario(categoriaActiva);
            cargarGraficos();
          }}
        />
      )}

      {avisoGuardado === "pendiente" && (
        <Aviso tipo="exito" titulo="Compra guardada en el dispositivo" duracion={7000} onCerrar={() => setAvisoGuardado(null)}>
          Se enviará automáticamente cuando vuelva la conexión a internet.
        </Aviso>
      )}
      {avisoGuardado === "enviada" && (
        <Aviso tipo="exito" titulo="Compra registrada" onCerrar={() => setAvisoGuardado(null)}>
          Los lotes ya están en tu inventario.
        </Aviso>
      )}
    </PageLayout>
  );
}

function Chip({ activo, onClick, children, color, Icono }) {
  if (!color) {
    return (
      <button
        onClick={onClick}
        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
          activo ? "bg-alacena-dark text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition hover:brightness-95"
      style={{
        backgroundColor: activo ? color : `${color}1f`,
        color: activo ? "#fff" : color,
      }}
    >
      {Icono && <Icono size={12} strokeWidth={2.5} />}
      {children}
    </button>
  );
}

// ============================================================
// Modal: Registrar compra (compra + N lotes)
// ============================================================
function lineaVacia() {
  return {
    id: crypto.randomUUID(),
    modo: "existente", // "existente" | "nuevo"
    producto_id: "",
    nombreNuevo: "",
    categoria_id: "",
    unidad_de_medida_id: "",
    fecha_vencimiento: "",
    cantidad_inicial: "",
  };
}

function ModalRegistrarCompra({ onCerrar, onGuardado }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [lineas, setLineas] = useState([lineaVacia()]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const { registrarCompra } = useSync();

  useEffect(() => {
    listarProductos().then(setProductos).catch(() => {});
    listarCategorias().then(setCategorias).catch(() => {});
    listarUnidades().then(setUnidades).catch(() => {});
  }, []);

  function actualizarLinea(id, cambios) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)));
  }

  function quitarLinea(id) {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  }

  async function manejarGuardar() {
    setError("");
    for (const linea of lineas) {
      if (!linea.fecha_vencimiento || !linea.cantidad_inicial) {
        setError("Completa fecha de vencimiento y cantidad en todos los productos.");
        return;
      }
      if (!(Number(linea.cantidad_inicial) > 0)) {
        setError("La cantidad comprada debe ser mayor que cero.");
        return;
      }
      if (linea.fecha_vencimiento < hoyISO()) {
        setError("La fecha de vencimiento no puede ser anterior a hoy.");
        return;
      }
      if (linea.modo === "existente" && !linea.producto_id) {
        setError("Selecciona un producto o cambia a 'Producto nuevo'.");
        return;
      }
      if (linea.modo === "nuevo" && (!linea.nombreNuevo || !linea.categoria_id || !linea.unidad_de_medida_id)) {
        setError("Completa nombre, categoría y unidad del producto nuevo.");
        return;
      }
      if (linea.modo === "nuevo") {
        const clave = linea.nombreNuevo.trim().toLowerCase();
        const repetido = productos.find((p) => p.nombre.trim().toLowerCase() === clave);
        if (repetido) {
          setError(`El producto "${repetido.nombre}" ya existe y está disponible en la pestaña "Producto existente".`);
          return;
        }
      }
    }

    // La compra se envía completa en una sola operación (compra + productos nuevos + lotes).
    // Si no hay conexión, queda guardada en el dispositivo y se envía sola al volver internet.
    const lineasEnvio = lineas.map((l) =>
      l.modo === "nuevo"
        ? {
            producto_id: null,
            nombre_nuevo: l.nombreNuevo.trim(),
            categoria_id: Number(l.categoria_id),
            unidad_de_medida_id: Number(l.unidad_de_medida_id),
            fecha_vencimiento: l.fecha_vencimiento,
            cantidad_inicial: Number(l.cantidad_inicial),
          }
        : {
            producto_id: Number(l.producto_id),
            fecha_vencimiento: l.fecha_vencimiento,
            cantidad_inicial: Number(l.cantidad_inicial),
          }
    );
    const resumen = lineas.map((l) => {
      const existente = productos.find((p) => p.id === Number(l.producto_id));
      const unidad = unidades.find(
        (u) => u.id === Number(l.modo === "nuevo" ? l.unidad_de_medida_id : existente?.unidad_de_medida_id)
      );
      return {
        nombre: l.modo === "nuevo" ? l.nombreNuevo.trim() : existente?.nombre ?? "Producto",
        nuevo: l.modo === "nuevo",
        cantidad: Number(l.cantidad_inicial),
        unidad: unidad?.abreviatura ?? "",
        vencimiento: l.fecha_vencimiento,
      };
    });

    setGuardando(true);
    try {
      const resultado = await registrarCompra({
        cliente_id: crypto.randomUUID(),
        fecha_compra: hoyISO(),
        lineas: lineasEnvio,
        resumen,
      });
      onGuardado(resultado);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo registrar la compra.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Registrar compra</h2>
          <button onClick={onCerrar} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {lineas.map((linea) => (
            <LineaProducto
              key={linea.id}
              linea={linea}
              productos={productos}
              categorias={categorias}
              unidades={unidades}
              onCambiar={(cambios) => actualizarLinea(linea.id, cambios)}
              onQuitar={() => quitarLinea(linea.id)}
              soloUna={lineas.length === 1}
            />
          ))}
        </div>

        <button
          onClick={() => setLineas((prev) => [...prev, lineaVacia()])}
          className="mt-3 flex items-center gap-1 text-sm font-medium text-alacena-accent"
        >
          <Plus size={16} /> Agregar otro producto
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCerrar}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Cancelar
          </button>
          <button
            onClick={manejarGuardar}
            disabled={guardando}
            className="rounded-lg bg-alacena-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Registrar compra"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LineaProducto({ linea, productos, categorias, unidades, onCambiar, onQuitar, soloUna }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex w-fit rounded-lg bg-slate-100 p-1 text-xs font-medium">
        <button
          onClick={() => onCambiar({ modo: "existente" })}
          className={`rounded-md px-3 py-1.5 ${linea.modo === "existente" ? "bg-white shadow-sm" : "text-slate-500"}`}
        >
          Producto existente
        </button>
        <button
          onClick={() => onCambiar({ modo: "nuevo" })}
          className={`rounded-md px-3 py-1.5 ${linea.modo === "nuevo" ? "bg-white shadow-sm" : "text-slate-500"}`}
        >
          Producto nuevo
        </button>
      </div>

      {linea.modo === "existente" ? (
        <select
          value={linea.producto_id}
          onChange={(e) => onCambiar({ producto_id: e.target.value })}
          className="mb-3 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Selecciona un producto</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      ) : (
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            placeholder="Nombre del producto"
            value={linea.nombreNuevo}
            onChange={(e) => onCambiar({ nombreNuevo: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-3"
          />
          <select
            value={linea.categoria_id}
            onChange={(e) => onCambiar({ categoria_id: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select
            value={linea.unidad_de_medida_id}
            onChange={(e) => onCambiar({ unidad_de_medida_id: e.target.value })}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Unidad</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.abreviatura})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Cantidad comprada</label>
          <input
            type="number"
            step="0.1"
            value={linea.cantidad_inicial}
            onChange={(e) => onCambiar({ cantidad_inicial: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Fecha de vencimiento</label>
          <input
            type="date"
            min={hoyISO()}
            value={linea.fecha_vencimiento}
            onChange={(e) => onCambiar({ fecha_vencimiento: e.target.value })}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {!soloUna && (
        <button onClick={onQuitar} className="mt-3 flex items-center gap-1 text-xs text-red-500">
          <Trash2 size={12} /> Quitar producto
        </button>
      )}
    </div>
  );
}


// ============================================================
// Compras registradas sin conexión que aún no llegan al servidor
// ============================================================
function PendientesDeSincronizar() {
  const { cola, enLinea, sincronizando, descartar, reintentar } = useSync();
  const [confirmando, setConfirmando] = useState(null);
  if (cola.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 shadow-sm" data-testid="pendientes">
      <div className="flex items-start gap-3 px-4 py-4 md:px-5">
        <CloudOff size={20} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-slate-800">Pendientes de sincronizar</p>
          <p className="text-xs text-slate-500">
            {enLinea
              ? sincronizando
                ? "Enviando al servidor..."
                : "Estas compras están guardadas en tu dispositivo y se enviarán en unos segundos."
              : "Estas compras están guardadas en tu dispositivo y se enviarán solas cuando vuelva internet."}
          </p>
        </div>
      </div>
      <ul className="divide-y divide-amber-100 border-t border-amber-100">
        {cola.map((c) => (
          <li key={c.cliente_id} className="px-4 py-3 md:px-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  Compra del {c.fecha_compra}
                  {c.estado === "error" ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                      <AlertTriangle size={11} /> No se pudo enviar
                    </span>
                  ) : (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">En espera</span>
                  )}
                </p>
                <ul className="mt-1 space-y-0.5 text-sm text-slate-700">
                  {(c.resumen || []).map((r, i) => (
                    <li key={i}>
                      {r.nombre}
                      {r.nuevo && <span className="text-xs text-slate-400"> (nuevo)</span>} — {r.cantidad}
                      {r.unidad ? ` ${r.unidad}` : ""} · vence {r.vencimiento}
                    </li>
                  ))}
                </ul>
                {c.estado === "error" && <p className="mt-1 text-xs text-red-600">{c.error}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {c.estado === "error" && enLinea && (
                  <button
                    onClick={() => reintentar(c.cliente_id)}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Reintentar
                  </button>
                )}
                {confirmando === c.cliente_id ? (
                  <>
                    <button
                      onClick={() => {
                        setConfirmando(null);
                        descartar(c.cliente_id);
                      }}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Sí, descartar
                    </button>
                    <button
                      onClick={() => setConfirmando(null)}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmando(c.cliente_id)}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-slate-200 hover:bg-red-50"
                  >
                    Descartar
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
