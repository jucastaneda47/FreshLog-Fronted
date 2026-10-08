import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listarCola } from "../offline/almacen";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  // Aviso cuando la sesión se cerró por inactividad (se muestra una sola vez)
  const [sesionExpirada] = useState(() => {
    try {
      const marca = sessionStorage.getItem("alacena_sesion_expirada") === "1";
      sessionStorage.removeItem("alacena_sesion_expirada");
      return marca;
    } catch {
      return false;
    }
  });
  // Compras registradas sin conexión que siguen guardadas en este dispositivo
  const [comprasGuardadas, setComprasGuardadas] = useState(0);
  useEffect(() => {
    listarCola().then((c) => setComprasGuardadas(c.length));
  }, []);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  async function manejarSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await iniciarSesion({ username, password });
      navigate("/tablero");
    } catch (err) {
      const detalle = err.response?.data?.detail;
      setError(detalle || "No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between text-white p-12 relative overflow-hidden">
        <img
          src="/fondo-auth.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-alacena-darker/90 to-alacena-dark/80" />

        <div className="relative z-10 flex items-center gap-3 text-xl font-semibold">
          <img src="/logo-alacena.png" alt="Alacena" className="h-16 w-16 object-contain" />
          FRESHLOG
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Sabes qué hay en casa antes de que se venza.
          </h1>
          <p className="text-slate-300 mb-6">
            Registra tus compras, controla el inventario y recibe alertas antes
            de que un producto caduque.
          </p>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          Proyecto de grado · Universidad Antonio Nariño · 2026
        </p>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm">
          <div className="flex mb-8 rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <span className="flex-1 rounded-md bg-white py-2 text-center shadow-sm">
              Iniciar sesión
            </span>
            <Link
              to="/registro"
              className="flex-1 rounded-md py-2 text-center text-slate-500"
            >
              Crear cuenta
            </Link>
          </div>

          {sesionExpirada && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Tu sesión se cerró por inactividad. Inicia sesión de nuevo para continuar.
            </div>
          )}

          {comprasGuardadas > 0 && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Tienes {comprasGuardadas} {comprasGuardadas === 1 ? "compra guardada" : "compras guardadas"} en este
              dispositivo. Se enviarán cuando inicies sesión con internet.
            </div>
          )}

          <h2 className="text-2xl font-bold text-slate-900">Bienvenido de nuevo</h2>
          <p className="text-slate-500 text-sm mb-6">Ingresa a tu alacena digital.</p>

          <form onSubmit={manejarSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usuario
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tu_usuario"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alacena-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alacena-accent"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-alacena-dark py-2.5 text-sm font-semibold text-white hover:bg-alacena-darker transition disabled:opacity-60"
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>

            <p className="text-center text-sm">
              <Link to="/recuperar-contrasena" className="font-medium text-alacena-accent">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            ¿Sin cuenta?{" "}
            <Link to="/registro" className="font-medium text-alacena-accent">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
