import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { useSync } from "../context/SyncContext";

// Aviso flotante del estado de la conexión y de la sincronización de compras.
// En celular queda sobre la barra inferior; en pantallas grandes, abajo a la derecha.
export default function BannerConexion() {
  const sync = useSync();
  if (!sync) return null;
  const { enLinea, cola, sincronizando, aviso, sincronizar } = sync;
  const pendientes = cola.filter((c) => c.estado !== "error").length;
  const textoPendientes =
    pendientes === 1 ? "1 compra pendiente de enviar" : `${pendientes} compras pendientes de enviar`;

  let contenido = null;

  if (!enLinea) {
    contenido = {
      Icono: WifiOff,
      clase: "bg-amber-500 text-white",
      titulo: "Sin conexión",
      texto:
        pendientes > 0
          ? `Estás viendo los datos guardados. ${textoPendientes}; se enviarán solas al volver internet.`
          : "Estás viendo los datos guardados en este dispositivo. Puedes registrar compras: se enviarán al volver internet.",
    };
  } else if (sincronizando && pendientes > 0) {
    contenido = {
      Icono: RefreshCw,
      girar: true,
      clase: "bg-blue-600 text-white",
      titulo: "Sincronizando",
      texto: `Enviando ${pendientes} ${pendientes === 1 ? "compra" : "compras"}...`,
    };
  } else if (aviso) {
    contenido =
      aviso.tipo === "ok"
        ? { Icono: CheckCircle2, clase: "bg-emerald-600 text-white", titulo: "Sincronizado", texto: aviso.texto }
        : { Icono: AlertTriangle, clase: "bg-red-600 text-white", titulo: "Revisa tus compras", texto: aviso.texto };
  } else if (pendientes > 0) {
    contenido = {
      Icono: RefreshCw,
      clase: "bg-blue-600 text-white",
      titulo: "Compras sin enviar",
      texto: `${textoPendientes[0].toUpperCase()}${textoPendientes.slice(1)}.`,
      accion: { texto: "Enviar ahora", onClick: sincronizar },
    };
  }

  if (!contenido) return null;
  const { Icono } = contenido;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-3 z-40 flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg md:inset-x-auto md:bottom-5 md:right-5 md:w-96 ${contenido.clase}`}
      style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
      data-testid="banner-conexion"
    >
      <Icono size={20} className={`mt-0.5 shrink-0 ${contenido.girar ? "animate-spin" : ""}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">{contenido.titulo}</p>
        <p className="text-xs text-white/90">{contenido.texto}</p>
      </div>
      {contenido.accion && (
        <button
          onClick={contenido.accion.onClick}
          className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30"
        >
          {contenido.accion.texto}
        </button>
      )}
    </div>
  );
}
