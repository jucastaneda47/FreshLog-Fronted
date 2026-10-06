import axios from "axios";

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

// Si el servidor responde 401 (sesión vencida) con una sesión abierta, se cierra
// la sesión y se vuelve al login con aviso. El login fallido no cuenta.
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.includes("/login") && localStorage.getItem("alacena_token")) {
      localStorage.removeItem("alacena_token");
      try {
        sessionStorage.setItem("alacena_sesion_expirada", "1");
      } catch {
        /* sin almacenamiento: se cierra igual, solo sin aviso */
      }
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

export async function obtenerUsuarioActual() {
  const { data } = await api.get("/autorizado");
  return data;
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

export async function consultarInventario({ categoria_id, estado } = {}) {
  const params = {};
  if (categoria_id) params.categoria_id = categoria_id;
  if (estado) params.estado = estado;
  const { data } = await api.get("/inventario", { params });
  return data;

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