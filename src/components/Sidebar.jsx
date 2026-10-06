import { NavLink } from "react-router-dom";
import PerfilUsuario from "./PerfilUsuario";

const modulos = [
  { to: "/tablero", label: "Tablero y reportes", icon: "📊" },
  { to: "/compras", label: "Compras e inventario", icon: "🛒" },
  { to: "/consumo", label: "Consumo y vencimientos", icon: "⏱️" },
  { to: "/alertas", label: "Alertas y seguimiento", icon: "🔔" },
];

export default function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col justify-between bg-alacena-dark text-white">
      <div>
        <div className="flex items-center gap-2 px-5 py-5 text-lg font-semibold">
          <img src="/logo-alacena.png" alt="Alacena" className="h-9 w-9 object-contain" />
          FRESHLOG
        </div>

        <p className="px-5 pb-2 text-[11px] uppercase tracking-wide text-slate-400">
          Módulos
        </p>
        <nav className="flex flex-col gap-1 px-2">
          {modulos.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-white/10 font-medium"
                    : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              <span>{m.icon}</span>
              {m.label}
            </NavLink>
          ))}
        </nav>

        <p className="px-5 pb-2 pt-6 text-[11px] uppercase tracking-wide text-slate-400">
          Cuenta
        </p>
        <nav className="flex flex-col gap-1 px-2">
          <NavLink
            to="/cuenta"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                isActive ? "bg-white/10 font-medium" : "text-slate-300 hover:bg-white/5"
              }`
            }
          >
            ⚙️ Usuarios y configuración
          </NavLink>
        </nav>
      </div>

      <PerfilUsuario />
    </aside>
  );
}
