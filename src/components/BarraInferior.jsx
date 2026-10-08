import { NavLink } from "react-router-dom";

const opciones = [
  { to: "/tablero", label: "Tablero", icon: "📊" },
  { to: "/compras", label: "Compras", icon: "🛒" },
  { to: "/consumo", label: "Consumo", icon: "⏱️" },
  { to: "/alertas", label: "Alertas", icon: "🔔" },
  { to: "/cuenta", label: "Cuenta", icon: "⚙️" },
];

// Navegación principal en celular: barra fija abajo (en pantallas grandes se usa el menú lateral).
export default function BarraInferior() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-alacena-dark text-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex">
        {opciones.map((o) => (
          <li key={o.to} className="flex-1">
            <NavLink
              to={o.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] leading-tight transition ${
                  isActive ? "bg-white/10 font-semibold text-white" : "text-slate-300"
                }`
              }
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {o.icon}
              </span>
              {o.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
