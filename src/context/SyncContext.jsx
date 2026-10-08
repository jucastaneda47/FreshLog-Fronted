import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  sincronizarCompra, esErrorDeRed, probarConexion,
  listarCategorias, listarUnidades, listarProductos, listarCompras,
  consultarInventario, listarAlertas, consultarMovimientos, consultarDistribucionCategorias,
  consultarCompradoVsConsumidoCategoria, consultarDesperdicio, consultarConfiguracionDesperdicio,
  consultarHistorial, consultarRankingProductos, consultarRiesgoCategoria, consultarAprovechamiento,
  consultarAlertasPorPeriodo, consultarAlertasAtencion, consultarAlertasPorCategoria,
} from "../api/client";
import { estaEnLinea, suscribirConexion } from "../offline/conexion";
import { guardarEnCola, quitarDeCola, listarCola } from "../offline/almacen";

// Cada cuánto se reintenta (mientras haya compras pendientes o no haya conexión)
const REINTENTO_MS = 20 * 1000;
// Cada cuánto, como máximo, se refrescan en segundo plano los datos guardados
const PRECARGA_MIN_MS = 3 * 60 * 1000;

const SyncContext = createContext(null);

// Quita del envío los datos que solo sirven para mostrar la compra en pantalla
function cargaParaServidor(item) {
  return { cliente_id: item.cliente_id, fecha_compra: item.fecha_compra, lineas: item.lineas };
}

function detalleDeError(error) {
  const d = error?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return "Los datos de la compra no son válidos.";
  return "El servidor no aceptó la compra.";
}

export function SyncProvider({ children }) {
  const { usuario } = useAuth();
  const uid = usuario?.id ?? null;

  const [enLinea, setEnLinea] = useState(estaEnLinea());
  const [cola, setCola] = useState([]); // compras pendientes de ESTE usuario
  const [sincronizando, setSincronizando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }

  const enCurso = useRef(false);
  const ultimaPrecarga = useRef(0);
  const uidRef = useRef(uid);
  uidRef.current = uid;

  const recargarCola = useCallback(async () => {
    const todas = await listarCola();
    setCola(uidRef.current == null ? [] : todas.filter((c) => c.uid === uidRef.current));
  }, []);

  // Guarda en el dispositivo una copia fresca de las consultas principales para poder verlas sin internet
  const precargar = useCallback(async (forzar = false) => {
    if (!uidRef.current || !estaEnLinea()) return;
    if (!forzar && Date.now() - ultimaPrecarga.current < PRECARGA_MIN_MS) return;
    ultimaPrecarga.current = Date.now();
    await Promise.allSettled([
      listarCategorias(), listarUnidades(), listarProductos(), listarCompras(),
      consultarInventario(), listarAlertas({ atendida: false }), listarAlertas({ atendida: true }),
      consultarMovimientos({ periodo: "semana", cantidad_periodos: 6 }),
      consultarDistribucionCategorias(), consultarCompradoVsConsumidoCategoria(),
      consultarDesperdicio({ cantidad_meses: 6 }), consultarConfiguracionDesperdicio(),
      consultarHistorial({ tipos: "compra,consumo,retiro,vencimiento", desde: "", hasta: "" }),
      consultarRankingProductos({ periodo: "1m" }),
      consultarRiesgoCategoria(), consultarAprovechamiento(),
      consultarAlertasPorPeriodo({ periodo: "semana", cantidadPeriodos: 6 }),
      consultarAlertasAtencion(), consultarAlertasPorCategoria(),
    ]);
  }, []);

  // Envía al servidor las compras guardadas, de la más antigua a la más nueva.
  // Es seguro repetirlo: el servidor reconoce cada compra por su cliente_id y no la duplica.
  const sincronizar = useCallback(async () => {
    if (enCurso.current || !uidRef.current) return { enviadas: 0 };
    enCurso.current = true;
    setSincronizando(true);
    let enviadas = 0;
    let conError = 0;
    try {
      const todas = (await listarCola()).filter((c) => c.uid === uidRef.current && c.estado !== "error");
      for (const item of todas) {
        try {
          await sincronizarCompra(cargaParaServidor(item));
          await quitarDeCola(item.cliente_id);
          enviadas += 1;
        } catch (error) {
          if (esErrorDeRed(error)) break; // sin conexión: se reintenta luego
          const estado = error.response?.status;
          if (estado === 401 || estado >= 500) break; // sesión vencida o servidor con problemas: se conserva todo
          // El servidor rechazó esta compra (datos no válidos): se marca para que el usuario decida
          await guardarEnCola({ ...item, estado: "error", error: detalleDeError(error) });
          conError += 1;
        }
      }
    } finally {
      enCurso.current = false;
      setSincronizando(false);
    }
    await recargarCola();
    if (enviadas > 0) {
      setAviso({
        tipo: "ok",
        texto: enviadas === 1 ? "Se sincronizó 1 compra." : `Se sincronizaron ${enviadas} compras.`,
      });
      window.dispatchEvent(new CustomEvent("freshlog:sincronizado"));
      precargar(true);
    }
    if (conError > 0) {
      setAviso({ tipo: "error", texto: "Hay compras que el servidor no pudo aceptar. Revísalas en Compras." });
    }
    return { enviadas };
  }, [precargar, recargarCola]);

  // Registra una compra: primero queda guardada en el dispositivo (no se pierde aunque se cierre la app)
  // y después se intenta enviar. Devuelve "enviada" o "pendiente"; si el servidor la rechaza, lanza el error.
  const registrarCompra = useCallback(
    async ({ cliente_id, fecha_compra, lineas, resumen }) => {
      const item = {
        cliente_id, uid: uidRef.current, fecha_compra, lineas, resumen,
        creada: Date.now(), estado: "pendiente",
      };
      await guardarEnCola(item);
      try {
        await sincronizarCompra(cargaParaServidor(item));
        await quitarDeCola(cliente_id);
        await recargarCola();
        precargar(true);
        return "enviada";
      } catch (error) {
        const estado = error.response?.status;
        if (esErrorDeRed(error) || estado === 401 || estado >= 500) {
          await recargarCola();
          return "pendiente";
        }
        await quitarDeCola(cliente_id); // rechazada: el usuario puede corregirla en el formulario
        await recargarCola();
        throw error;
      }
    },
    [precargar, recargarCola]
  );

  const descartar = useCallback(
    async (clienteId) => {
      await quitarDeCola(clienteId);
      await recargarCola();
    },
    [recargarCola]
  );

  const reintentar = useCallback(
    async (clienteId) => {
      const item = (await listarCola()).find((c) => c.cliente_id === clienteId);
      if (item) await guardarEnCola({ ...item, estado: "pendiente", error: undefined });
      await recargarCola();
      sincronizar();
    },
    [recargarCola, sincronizar]
  );

  // Estado de la conexión
  useEffect(() => suscribirConexion(setEnLinea), []);

  // Al iniciar sesión / abrir la app: cargar la cola, enviar lo pendiente y refrescar los datos guardados
  useEffect(() => {
    if (!uid) {
      setCola([]);
      return;
    }
    recargarCola();
    if (estaEnLinea()) sincronizar().then(() => precargar());
  }, [uid, recargarCola, sincronizar, precargar]);

  // Al volver la conexión
  useEffect(() => {
    if (enLinea && uid) sincronizar().then(() => precargar());
  }, [enLinea, uid, sincronizar, precargar]);

  // Reintentos periódicos y al volver a la app: si el aviso de "sin conexión" no cambia solo
  // (p. ej. el WiFi no tiene salida o el servidor estaba dormido), se comprueba cada tanto.
  const hayPendientes = cola.some((c) => c.estado !== "error");
  useEffect(() => {
    if (!uid) return;
    async function intentar() {
      if (document.visibilityState === "hidden") return;
      if (!estaEnLinea()) {
        if (navigator.onLine !== false) await probarConexion(); // si responde, marca "en línea" y se dispara el envío
      } else if (hayPendientes) {
        sincronizar();
      }
    }
    const t = setInterval(intentar, REINTENTO_MS);
    document.addEventListener("visibilitychange", intentar);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", intentar);
    };
  }, [uid, hayPendientes, sincronizar]);

  // El aviso verde/rojo se oculta solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), aviso.tipo === "ok" ? 5000 : 12000);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <SyncContext.Provider
      value={{ enLinea, cola, sincronizando, aviso, registrarCompra, descartar, reintentar, sincronizar }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
