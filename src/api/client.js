import axios from "axios";
import { guardarCache, leerCache, limpiarCache } from "../offline/almacen";
import { fijarEnLinea } from "../offline/conexion";

// En producción la URL del backend viene de VITE_API_URL (se configura en Vercel).
// Si no existe, se usa el backend local.
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const api = axios.create({
  baseURL: BASE_URL,
});

// Adjunta el token JWT a cada request si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("alacena_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Trabajo sin conexión
// ---------------------------------------------------------------------------
// - Cada consulta (GET) que responde bien se guarda en el dispositivo, separada por usuario.
// - Si luego no hay red (o el servidor no responde), la consulta devuelve la última copia guardada.
// - Las acciones que modifican datos no se guardan: sin red fallan con un mensaje claro.
//   (Las compras tienen su propio camino con cola: ver SyncContext.)
const MENSAJE_SIN_CONEXION = "Sin conexión a internet. Esta acción necesita conexión.";

let usuarioCache = null;
try {
  usuarioCache = localStorage.getItem("alacena_uid");
} catch {
  /* sin almacenamiento: no hay caché por usuario */
}

// Indica de quién son los datos guardados (se llama al iniciar sesión / cargar el perfil)
export function fijarUsuarioCache(id) {
  usuarioCache = id == null ? null : String(id);
  try {
    if (usuarioCache) localStorage.setItem("alacena_uid", usuarioCache);
    else localStorage.removeItem("alacena_uid");
  } catch {
    /* sin almacenamiento */
  }
}

export function usuarioDeLaCache() {
  return usuarioCache;
}

function claveCache(url, params) {
  const hayParams = params && Object.keys(params).length > 0;
  return `${usuarioCache}|${url}|${hayParams ? JSON.stringify(params) : ""}`;
}

const SIN_CACHE = ["/autorizado", "/renovar-sesion"];

function esConsultaCacheable(config) {
  const url = config?.url || "";
  return (
    usuarioCache &&
    (config?.method || "get").toLowerCase() === "get" &&
    !SIN_CACHE.some((u) => url.startsWith(u))
  );
}

// Error por falta de red: la petición no llegó al servidor
export function esErrorDeRed(error) {
  return Boolean(error && (error.sinConexion || (!error.response && !axios.isCancel(error))));
}

// Cierra la sesión local conservando la cola de compras pendientes
// (así no se pierde lo registrado sin conexión; se enviará al volver a iniciar sesión).
export async function limpiarSesionLocal() {
  localStorage.removeItem("alacena_token");
  localStorage.removeItem("alacena_perfil");
  fijarUsuarioCache(null);
  await limpiarCache();
}

api.interceptors.response.use(
  (resp) => {
    fijarEnLinea(true);
    if (esConsultaCacheable(resp.config)) {
      guardarCache(claveCache(resp.config.url, resp.config.params), resp.data);
    }
    return resp;
  },
  async (error) => {
    const config = error.config || {};
    const url = config.url || "";
    const estado = error.response?.status;

    // 1) El servidor no respondió (sin internet, servidor caído o dormido)
    const sinRespuesta = !error.response && !axios.isCancel(error);
    const servidorNoDisponible = estado === 502 || estado === 503 || estado === 504;
    if (sinRespuesta) fijarEnLinea(false);
    else if (!servidorNoDisponible) fijarEnLinea(true);

    if (sinRespuesta || servidorNoDisponible) {
      if (esConsultaCacheable(config)) {
        const copia = await leerCache(claveCache(url, config.params));
        if (copia) {
          return { data: copia.datos, status: 200, statusText: "OK (guardado)", headers: {}, config, fromCache: true };
        }
      }
      if (sinRespuesta) {
        error.sinConexion = true;
        error.response = { status: 0, data: { detail: MENSAJE_SIN_CONEXION } };
      }
    }

    // 2) Sesión vencida con servidor disponible: se vuelve al login (la cola de compras se conserva)
    if (estado === 401 && !url.includes("/login") && localStorage.getItem("alacena_token")) {
      try {
        sessionStorage.setItem("alacena_sesion_expirada", "1");
      } catch {
        /* sin almacenamiento: se cierra igual, solo sin aviso */
      }
      await limpiarSesionLocal();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export async function renovarSesion() {
  const { data } = await api.post("/renovar-sesion");
  return data;
}

export async function registrarUsuario({ name, correo, username, contraseña }) {
  const { data } = await api.post("/usuario", { name, correo, username, contraseña });
  return data;
}

export async function verificarPin({ correo, pin }) {
  const { data } = await api.post("/verificar-pin", { correo, pin });
  return data;
}

export async function reenviarPin(correo) {
  const { data } = await api.post("/reenviar-pin", null, { params: { correo } });
  return data;
}

export async function login({ username, password }) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const { data } = await api.post("/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function obtenerUsuarioActual({ timeout } = {}) {
  const { data } = await api.get("/autorizado", timeout ? { timeout } : undefined);
  return data;
}

// Comprueba si el servidor responde (se usa para detectar que volvió la conexión).
export async function probarConexion() {
  try {
    await api.get("/autorizado", { timeout: 8000 });
    return true;
  } catch (error) {
    return !esErrorDeRed(error) && !(error.response && [502, 503, 504].includes(error.response.status));
  }
}

// --- Categorías ---
export async function listarCategorias() {
  const { data } = await api.get("/categorias");
  return data;
}

export async function crearCategoria({ nombre, stock_minimo, icono, color }) {
  const { data } = await api.post("/categorias", { nombre, stock_minimo, icono, color });
  return data;
}

export async function actualizarCategoria(id, cambios) {
  const { data } = await api.put(`/categorias/${id}`, cambios);
  return data;
}

export async function eliminarCategoria(id) {
  const { data } = await api.delete(`/categorias/${id}`);
  return data;
}

// --- Unidades de medida ---
export async function listarUnidades() {
  const { data } = await api.get("/unidades-medida");
  return data;
}

export async function crearUnidad({ nombre, abreviatura }) {
  const { data } = await api.post("/unidades-medida", { nombre, abreviatura });
  return data;
}

export async function actualizarUnidad(id, cambios) {
  const { data } = await api.put(`/unidades-medida/${id}`, cambios);
  return data;
}

export async function eliminarUnidad(id) {
  const { data } = await api.delete(`/unidades-medida/${id}`);
  return data;
}
// --- Productos ---
export async function listarProductos() {
  const { data } = await api.get("/productos");
  return data;
}

export async function crearProducto({ nombre, categoria_id, unidad_de_medida_id, stock_minimo }) {
  const { data } = await api.post("/productos", {
    nombre,
    categoria_id,
    unidad_de_medida_id,
    stock_minimo,
  });
  return data;
}

// --- Compras ---
export async function listarCompras() {
  const { data } = await api.get("/compras");
  return data;
}

export async function crearCompra(fecha_compra) {
  const { data } = await api.post("/compras", { fecha_compra });
  return data;
}

// Envía una compra completa (con sus lotes y productos nuevos) en una sola operación.
// Es idempotente: repetir el envío con el mismo cliente_id no crea nada nuevo.
export async function sincronizarCompra(compra) {
  const { data } = await api.post("/compras/sincronizar", compra);
  return data;
}

// --- Lotes ---
export async function crearLote({ producto_id, compra_id, fecha_vencimiento, cantidad_inicial }) {
  const { data } = await api.post("/lotes", {
    producto_id,
    compra_id,
    fecha_vencimiento,
    cantidad_inicial,
  });
  return data;
}

export async function actualizarLote(id, cambios) {
  const { data } = await api.put(`/lotes/${id}`, cambios);
  return data;
}

export async function eliminarLote(id) {
  const { data } = await api.delete(`/lotes/${id}`);
  return data;
}

// Sin conexión, los días restantes y el estado se recalculan con la fecha de hoy
// (el lote pudo vencer mientras no había internet).
function actualizarEstadoLocal(item) {
  const [y, m, d] = String(item.fecha_vencimiento).split("-").map(Number);
  const hoy = new Date();
  const hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.round((new Date(y, m - 1, d) - hoy0) / 86400000);
  const estado = dias <= 0 ? "vencido" : dias <= 5 ? "proximo_a_vencer" : "vigente";
  return { ...item, dias_restantes: dias, estado };
}

export async function consultarInventario({ categoria_id, estado } = {}) {
  const params = {};
  if (categoria_id) params.categoria_id = categoria_id;
  if (estado) params.estado = estado;
  let resp;
  try {
    resp = await api.get("/inventario", { params });
  } catch (error) {
    // Filtro que nunca se consultó con red: se filtra la copia completa guardada
    if (esErrorDeRed(error) && (categoria_id || estado)) {
      const completa = await leerCache(claveCache("/inventario", {}));
      if (completa) {
        return completa.datos
          .map(actualizarEstadoLocal)
          .filter((i) => (!categoria_id || i.categoria_id === categoria_id) && (!estado || i.estado === estado));
      }
    }
    throw error;
  }
  return resp.fromCache ? resp.data.map(actualizarEstadoLocal).filter((i) => !estado || i.estado === estado) : resp.data;
}

export async function registrarConsumo({ lote_id, cantidad, tipo = "consumo" }) {
  const { data } = await api.post("/consumo", { lote_id, cantidad, tipo });
  return data;
}

export async function listarAlertas({ atendida } = {}) {
  const params = {};
  if (atendida !== undefined) params.atendida = atendida;
  const { data } = await api.get("/alertas", { params });
  return data;
}
 
export async function atenderAlerta(id) {
  const { data } = await api.put(`/alertas/${id}/atender`);
  return data;
}

export async function eliminarHistorialAlertas(meses) {
  const { data } = await api.delete("/alertas/historial", { params: { meses } });
  return data;
}

export async function consultarAlertasPorCategoria() {
  const { data } = await api.get("/estadisticas/alertas-por-categoria");
  return data;
}

export async function consultarMovimientos({ periodo = "semana", cantidad_periodos = 6 } = {}) {
  const { data } = await api.get("/estadisticas/movimientos", {
    params: { periodo, cantidad_periodos },
  });
  return data;
}
export async function consultarDistribucionCategorias() {
  const { data } = await api.get("/estadisticas/distribucion-categorias");
  return data;
}
 
export async function consultarProductosDeCategoria(categoriaId) {
  const { data } = await api.get(
    `/estadisticas/distribucion-categorias/${categoriaId}/productos`
  );
  return data;
}

export async function consultarDesperdicio({ cantidad_meses = 6 } = {}) {
  const { data } = await api.get("/estadisticas/desperdicio", {
    params: { cantidad_meses },
  });
  return data;
}

export async function consultarHistorial({ tipos, desde, hasta } = {}) {
  const { data } = await api.get("/estadisticas/historial", {
    params: { tipos, desde: desde || undefined, hasta: hasta || undefined },
  });
  return data;
}

export async function consultarRankingProductos({ periodo = "1m" } = {}) {
  const { data } = await api.get("/estadisticas/ranking-productos", {
    params: { periodo },
  });
  return data;
}

export async function consultarCompradoVsConsumidoCategoria() {
  const { data } = await api.get("/estadisticas/comprado-vs-consumido-categoria");
  return data;
}

export async function consultarRiesgoCategoria() {
  const { data } = await api.get("/estadisticas/riesgo-categoria");
  return data;
}

export async function consultarAprovechamiento() {
  const { data } = await api.get("/estadisticas/aprovechamiento");
  return data;
}

export async function consultarAlertasPorPeriodo({ periodo = "semana", cantidadPeriodos = 6 } = {}) {
  const { data } = await api.get("/estadisticas/alertas-por-periodo", {
    params: { periodo, cantidad_periodos: cantidadPeriodos },
  });
  return data;
}

export async function consultarAlertasAtencion() {
  const { data } = await api.get("/estadisticas/alertas-atencion");
  return data;
}

export async function consultarConfiguracionDesperdicio() {
  const { data } = await api.get("/estadisticas/desperdicio/configuracion");
  return data;
}
 
export async function actualizarConfiguracionDesperdicio({ promedio, meta } = {}) {
  const body = {};
  if (promedio !== undefined) body.promedio = promedio;
  if (meta !== undefined) body.meta = meta;
  const { data } = await api.patch("/estadisticas/desperdicio/configuracion", body);
  return data;
}

export async function guardarAvatar(avatar) {
  const { data } = await api.put("/avatar", { avatar });
  return data;
}

export async function solicitarRecuperacion({ correo }) {
  const { data } = await api.post("/recuperar-contrasena", { correo });
  return data;
}

export async function restablecerContrasena({ token, nueva_contraseña }) {
  const { data } = await api.post("/restablecer-contrasena", {
    token,
    nueva_contraseña,
  });
  return data;
}

export default api;