import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

// Aviso llamativo flotante (arriba a la derecha). Se cierra solo a los 5 s.
// tipo: "exito" (verde) | "error" (rojo)
export default function Aviso({ tipo = "exito", titulo, children, onCerrar, duracion = 5000 }) {
  useEffect(() => {
    if (!duracion) return;
    const t = setTimeout(onCerrar, duracion);
    return () => clearTimeout(t);
  }, [duracion, onCerrar]);

  const esExito = tipo === "exito";
  const Icono = esExito ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role="alert"
      className={`fixed right-6 top-6 z-50 flex w-[min(92vw,26rem)] items-start gap-3 rounded-2xl p-4 text-white shadow-2xl ring-1 ring-black/10 ${
        esExito
          ? "bg-gradient-to-br from-emerald-500 to-green-700"
          : "bg-gradient-to-br from-red-500 to-red-700"
      }`}
      style={{ animation: "aviso-entrada 250ms ease-out" }}
    >
      <style>{`@keyframes aviso-entrada{from{opacity:0;transform:translateY(-12px) scale(.96)}to{opacity:1;transform:none}}`}</style>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Icono size={26} strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        {titulo && <p className="text-base font-bold leading-tight">{titulo}</p>}
        <p className="text-sm text-white/90">{children}</p>
      </div>
      <button
        onClick={onCerrar}
        aria-label="Cerrar aviso"
        className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}
