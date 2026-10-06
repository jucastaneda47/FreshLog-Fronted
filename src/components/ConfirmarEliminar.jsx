import { AlertTriangle } from "lucide-react";

// Ventana de confirmación llamativa para acciones destructivas.
export default function ConfirmarEliminar({
  titulo,
  mensaje,
  error,
  cargando,
  textoConfirmar = "Sí, eliminar",
  onConfirmar,
  onCancelar,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onCancelar}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white text-center shadow-2xl"
        style={{ animation: "confirmar-entrada 200ms ease-out" }}
      >
        <style>{`@keyframes confirmar-entrada{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}`}</style>
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
        <div className="px-6 pb-2 pt-6">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle size={34} strokeWidth={2.2} />
          </span>
          <h3 className="text-lg font-bold text-slate-900">{titulo}</h3>
          <p className="mt-1 text-sm text-slate-500">{mensaje}</p>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-4">
          <button
            onClick={onCancelar}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/30 hover:bg-red-700 disabled:opacity-60"
          >
            {cargando ? "Eliminando..." : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
