import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import PageLayout from "../components/PageLayout";
import ConfirmarEliminar from "../components/ConfirmarEliminar";
import Aviso from "../components/Aviso";
import { ICONOS_DISPONIBLES, COLORES_DISPONIBLES, obtenerIcono, obtenerColor } from "../utils/categoriaEstilos";
import {
  listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria,
  listarUnidades, crearUnidad, actualizarUnidad, eliminarUnidad,
} from "../api/client";

// Convierte un error del servidor en el aviso rojo (nombre repetido, etc.)
function avisoDeError(err, accion) {
  const detalle = err.response?.data?.detail;
  const texto = typeof detalle === "string" ? detalle : `No se pudo ${accion}. Intenta de nuevo.`;
  const repetido = typeof detalle === "string" && detalle.startsWith("Ya tienes");
  return {
    tipo: "error",
    titulo: repetido ? "Ya existe, no se puede duplicar" : "No se pudo guardar",
    texto,
  };
}

export default function Cuenta() {
  const [tab, setTab] = useState("categorias");

  return (
    <PageLayout
      titulo="Usuarios y configuración"
      subtitulo="Administra las categorías, unidades de medida y stock mínimo"
    >
      <div className="mb-6 inline-flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <button
          onClick={() => setTab("categorias")}
          className={`rounded-md px-4 py-2 transition ${
            tab === "categorias" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
          }`}
        >
          Categorías
        </button>
        <button
          onClick={() => setTab("unidades")}
          className={`rounded-md px-4 py-2 transition ${
            tab === "unidades" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
          }`}
        >
          Unidades de medida
        </button>
      </div>

      {tab === "categorias" ? <PanelCategorias /> : <PanelUnidades />}
    </PageLayout>
  );
}

// ============================================================
// Selector de ícono + color (compartido entre edición y creación)
// ============================================================
function SelectorIconoColor({ iconoSeleccionado, colorSeleccionado, onCambiarIcono, onCambiarColor }) {
  const color = obtenerColor(colorSeleccionado);

  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs text-slate-500">Ícono</label>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {ICONOS_DISPONIBLES.map(({ clave, Icono }) => (
          <button
            key={clave}
            type="button"
            onClick={() => onCambiarIcono(clave)}
            className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
              iconoSeleccionado === clave
                ? `${color.bg} ${color.fg} border-transparent ring-2 ring-alacena-accent`
                : "border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}
          >
            <Icono size={16} />
          </button>
        ))}
      </div>

      <label className="mb-1.5 block text-xs text-slate-500">Color</label>
      <div className="flex flex-wrap gap-1.5">
        {COLORES_DISPONIBLES.map((c) => (
          <button
            key={c.clave}
            type="button"
            onClick={() => onCambiarColor(c.clave)}
            aria-label={c.clave}
            className={`h-6 w-6 rounded-full ${c.muestra} transition ${
              colorSeleccionado === c.clave ? "ring-2 ring-offset-2 ring-alacena-accent" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Categorías
// ============================================================
function PanelCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [creando, setCreando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null); // id de la categoría a eliminar
  const [errorEliminar, setErrorEliminar] = useState("");
  const [eliminando, setEliminando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const data = await listarCategorias();
      setCategorias(data);
    } catch {
      setError("No se pudieron cargar las categorías.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function manejarGuardar(id, nombre, stockMinimo, icono, color) {
    try {
      await actualizarCategoria(id, { nombre, stock_minimo: Number(stockMinimo), icono, color });
      setEditandoId(null);
      cargar();
    } catch (err) {
      setAviso(avisoDeError(err, "guardar la categoría"));
    }
  }

  function manejarEliminar(id) {
    setErrorEliminar("");
    setPorEliminar(id);
  }

  async function confirmarEliminar() {
    setEliminando(true);
    setErrorEliminar("");
    try {
      await eliminarCategoria(porEliminar);
      setPorEliminar(null);
      cargar();
    } catch (err) {
      const detalle = err.response?.data?.detail;
      setErrorEliminar(typeof detalle === "string" ? detalle : "No se pudo eliminar la categoría.");
    } finally {
      setEliminando(false);
    }
  }

  async function manejarCrear(nombre, stockMinimo, icono, color) {
    try {
      await crearCategoria({ nombre, stock_minimo: Number(stockMinimo), icono, color });
      setCreando(false);
      cargar();
    } catch (err) {
      setAviso(avisoDeError(err, "crear la categoría"));
    }
  }

  if (cargando) return <p className="text-sm text-slate-500">Cargando categorías...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categorias.map((c) => (
          <TarjetaCategoria
            key={c.id}
            categoria={c}
            editando={editandoId === c.id}
            onEditar={() => setEditandoId(c.id)}
            onCancelar={() => setEditandoId(null)}
            onGuardar={(nombre, stock, icono, color) => manejarGuardar(c.id, nombre, stock, icono, color)}
            onEliminar={() => manejarEliminar(c.id)}
          />
        ))}

        {creando ? (
          <TarjetaCategoriaNueva onCancelar={() => setCreando(false)} onCrear={manejarCrear} />
        ) : (
          <button
            onClick={() => setCreando(true)}
            className="flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-alacena-accent hover:text-alacena-accent transition"
          >
            <Plus size={22} />
            <span className="text-sm font-medium">Nueva categoría</span>
          </button>
        )}
      </div>

      {porEliminar !== null && (
        <ConfirmarEliminar
          titulo="¿Eliminar esta categoría?"
          mensaje="Esta acción no se puede deshacer."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={confirmarEliminar}
          onCancelar={() => setPorEliminar(null)}
        />
      )}

      {aviso && (
        <Aviso tipo={aviso.tipo} titulo={aviso.titulo} onCerrar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}
    </div>
  );
}

function TarjetaCategoria({ categoria, editando, onEditar, onCancelar, onGuardar, onEliminar }) {
  const [nombre, setNombre] = useState(categoria.nombre);
  const [stock, setStock] = useState(categoria.stock_minimo);
  const [icono, setIcono] = useState(categoria.icono);
  const [color, setColor] = useState(categoria.color);

  const IconoVista = obtenerIcono(categoria.icono);
  const colorVista = obtenerColor(categoria.color);

  if (editando) {
    const IconoEdicion = obtenerIcono(icono);
    const colorEdicion = obtenerColor(color);

    return (
      <div className="rounded-xl border border-alacena-accent bg-white p-4 shadow-sm">
        <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${colorEdicion.bg}`}>
          <IconoEdicion className={colorEdicion.fg} size={24} />
        </div>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1 text-sm font-medium"
        />
        <label className="mb-1 block text-xs text-slate-500">Stock mínimo</label>
        <input
          type="number"
          step="0.1"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="mb-3 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />

        <SelectorIconoColor
          iconoSeleccionado={icono}
          colorSeleccionado={color}
          onCambiarIcono={setIcono}
          onCambiarColor={setColor}
        />

        <div className="flex gap-2">
          <button
            onClick={() => onGuardar(nombre, stock, icono, color)}
            className="flex items-center gap-1 rounded-md bg-alacena-dark px-2.5 py-1.5 text-xs font-semibold text-white"
          >
            <Check size={14} /> Guardar
          </button>
          <button
            onClick={onCancelar}
            className="flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
        <button
          onClick={onEditar}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onEliminar}
          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${colorVista.bg}`}>
        <IconoVista className={colorVista.fg} size={24} />
      </div>
      <p className="font-semibold text-slate-800">{categoria.nombre}</p>
      <p className="text-xs text-slate-500">
        Stock mínimo: <span className="font-medium text-slate-700">{categoria.stock_minimo}</span>
      </p>
    </div>
  );
}

function TarjetaCategoriaNueva({ onCancelar, onCrear }) {
  const [nombre, setNombre] = useState("");
  const [stock, setStock] = useState(0);
  const [icono, setIcono] = useState("package");
  const [color, setColor] = useState("slate");

  const IconoPreview = obtenerIcono(icono);
  const colorPreview = obtenerColor(color);

  return (
    <div className="rounded-xl border border-alacena-accent bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${colorPreview.bg}`}>
        <IconoPreview className={colorPreview.fg} size={24} />
      </div>

      <label className="mb-1 block text-xs text-slate-500">Nombre</label>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej. Snacks"
        className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
      <label className="mb-1 block text-xs text-slate-500">Stock mínimo</label>
      <input
        type="number"
        step="0.1"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        className="mb-3 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
      />

      <SelectorIconoColor
        iconoSeleccionado={icono}
        colorSeleccionado={color}
        onCambiarIcono={setIcono}
        onCambiarColor={setColor}
      />

      <div className="flex gap-2">
        <button
          disabled={!nombre.trim()}
          onClick={() => onCrear(nombre.trim(), stock, icono, color)}
          className="flex items-center gap-1 rounded-md bg-alacena-dark px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Check size={14} /> Crear
        </button>
        <button
          onClick={onCancelar}
          className="flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
        >
          <X size={14} /> Cancelar
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Unidades de medida
// ============================================================
function PanelUnidades() {
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [creando, setCreando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null); // id de la unidad a eliminar
  const [errorEliminar, setErrorEliminar] = useState("");
  const [eliminando, setEliminando] = useState(false);

  async function cargar() {
    setCargando(true);
    const data = await listarUnidades();
    setUnidades(data);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function manejarGuardar(id, nombre, abreviatura) {
    try {
      await actualizarUnidad(id, { nombre, abreviatura });
      setEditandoId(null);
      cargar();
    } catch (err) {
      setAviso(avisoDeError(err, "guardar la unidad de medida"));
    }
  }

  function manejarEliminar(id) {
    setErrorEliminar("");
    setPorEliminar(id);
  }

  async function confirmarEliminar() {
    setEliminando(true);
    setErrorEliminar("");
    try {
      await eliminarUnidad(porEliminar);
      setPorEliminar(null);
      cargar();
    } catch (err) {
      const detalle = err.response?.data?.detail;
      setErrorEliminar(typeof detalle === "string" ? detalle : "No se pudo eliminar la unidad de medida.");
    } finally {
      setEliminando(false);
    }
  }

  async function manejarCrear(nombre, abreviatura) {
    try {
      await crearUnidad({ nombre, abreviatura });
      setCreando(false);
      cargar();
    } catch (err) {
      setAviso(avisoDeError(err, "crear la unidad de medida"));
    }
  }

  if (cargando) return <p className="text-sm text-slate-500">Cargando unidades...</p>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-semibold text-slate-700">Unidades de medida</p>
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-1 rounded-lg bg-alacena-dark px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Plus size={14} /> Nueva unidad
        </button>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-slate-400">
            <th className="px-5 py-3">Nombre</th>
            <th className="px-5 py-3">Abreviatura</th>
            <th className="px-5 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {unidades.map((u) => (
            <FilaUnidad
              key={u.id}
              unidad={u}
              editando={editandoId === u.id}
              onEditar={() => setEditandoId(u.id)}
              onCancelar={() => setEditandoId(null)}
              onGuardar={(nombre, abrev) => manejarGuardar(u.id, nombre, abrev)}
              onEliminar={() => manejarEliminar(u.id)}
            />
          ))}

          {creando && <FilaUnidadNueva onCancelar={() => setCreando(false)} onCrear={manejarCrear} />}
        </tbody>
      </table>

      {porEliminar !== null && (
        <ConfirmarEliminar
          titulo="¿Eliminar esta unidad de medida?"
          mensaje="Esta acción no se puede deshacer."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={confirmarEliminar}
          onCancelar={() => setPorEliminar(null)}
        />
      )}

      {aviso && (
        <Aviso tipo={aviso.tipo} titulo={aviso.titulo} onCerrar={() => setAviso(null)}>
          {aviso.texto}
        </Aviso>
      )}
    </div>
  );
}

function FilaUnidad({ unidad, editando, onEditar, onCancelar, onGuardar, onEliminar }) {
  const [nombre, setNombre] = useState(unidad.nombre);
  const [abreviatura, setAbreviatura] = useState(unidad.abreviatura);

  if (editando) {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-5 py-2">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-5 py-2">
          <input
            value={abreviatura}
            onChange={(e) => setAbreviatura(e.target.value)}
            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-5 py-2">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onGuardar(nombre, abreviatura)}
              className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
            >
              <Check size={16} />
            </button>
            <button onClick={onCancelar} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group border-t border-slate-100">
      <td className="px-5 py-3 text-slate-800">{unidad.nombre}</td>
      <td className="px-5 py-3 text-slate-500">{unidad.abreviatura}</td>
      <td className="px-5 py-3">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
          <button onClick={onEditar} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Pencil size={14} />
          </button>
          <button onClick={onEliminar} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function FilaUnidadNueva({ onCancelar, onCrear }) {
  const [nombre, setNombre] = useState("");
  const [abreviatura, setAbreviatura] = useState("");

  return (
    <tr className="border-t border-slate-100 bg-slate-50">
      <td className="px-5 py-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Onza"
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-5 py-2">
        <input
          value={abreviatura}
          onChange={(e) => setAbreviatura(e.target.value)}
          placeholder="oz"
          className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-5 py-2">
        <div className="flex justify-end gap-2">
          <button
            disabled={!nombre.trim() || !abreviatura.trim()}
            onClick={() => onCrear(nombre.trim(), abreviatura.trim())}
            className="rounded-md p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-40"
          >
            <Check size={16} />
          </button>
          <button onClick={onCancelar} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
