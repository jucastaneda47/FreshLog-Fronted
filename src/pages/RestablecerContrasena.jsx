import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { restablecerContrasena } from "../api/client";
import FondoAuthMovil, { LogoAuthMovil } from "../components/FondoAuthMovil";

const REGLAS_CONTRASENA = [
  { etiqueta: "Mínimo 8 caracteres", prueba: (v) => v.length >= 8 },
  { etiqueta: "Una letra mayúscula", prueba: (v) => /[A-Z]/.test(v) },
  { etiqueta: "Una letra minúscula", prueba: (v) => /[a-z]/.test(v) },
  { etiqueta: "Un número", prueba: (v) => /\d/.test(v) },
  {
    etiqueta: "Un carácter especial",
    prueba: (v) => /[!@#$%^&*(),.?":{}|<>_\-+=\/\\[\]]/.test(v),
  },
];

export default function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const reglasCumplidas = REGLAS_CONTRASENA.every((r) => r.prueba(nueva));
  const coinciden = nueva.length > 0 && nueva === confirmar;

  async function manejarSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("El enlace no es válido. Solicita uno nuevo.");
      return;
    }
    if (!reglasCumplidas) {
      setError("La contraseña no cumple con todas las condiciones.");
      return;
    }
    if (!coinciden) {
      setError("Las dos contraseñas deben ser iguales.");
      return;
    }

    setEnviando(true);
    try {
      await restablecerContrasena({ token, nueva_contraseña: nueva });
      setExito(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const detalle = err.response?.data?.detail;
      setError(detalle || "No se pudo restablecer la contraseña. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  // Título de la pestaña del navegador
  useEffect(() => {
    document.title = "FreshLog · Restablecer contraseña";
  }, []);

  return (
    <div className="flex min-h-screen">
      <FondoAuthMovil />
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
            Crea tu nueva contraseña.
          </h1>
          <p className="text-slate-300 mb-6">
            Elige una contraseña segura y confírmala para volver a entrar a
            tu alacena digital.
          </p>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          Proyecto de grado · Universidad Antonio Nariño · 2026
        </p>
      </div>

      {/* Panel derecho: formulario */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center gap-6 p-5 md:w-1/2 md:bg-slate-50 md:p-8">
        <LogoAuthMovil />
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
          <h2 className="text-2xl font-bold text-slate-900">Restablecer contraseña</h2>

          {!token && (
            <p className="mt-2 text-sm text-red-600">
              Este enlace no es válido. Solicita uno nuevo desde{" "}
              <Link to="/recuperar-contrasena" className="font-medium text-alacena-accent">
                aquí
              </Link>
              .
            </p>
          )}

          {exito ? (
            <p className="text-slate-500 text-sm mt-2 mb-6">
              Tu contraseña se actualizó correctamente. Ya puedes{" "}
              <Link to="/login" className="font-medium text-alacena-accent">
                iniciar sesión
              </Link>{" "}
              con tu nueva contraseña. Te vamos a redirigir en un momento...
            </p>
          ) : (
            <>
              <p className="text-slate-500 text-sm mt-2 mb-6">
                Ingresa tu nueva contraseña y confírmala.
              </p>

              <form onSubmit={manejarSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={nueva}
                    onChange={(e) => setNueva(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alacena-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alacena-accent"
                  />
                  {confirmar.length > 0 && !coinciden && (
                    <p className="mt-1 text-xs text-red-600">
                      Las contraseñas no coinciden.
                    </p>
                  )}
                </div>

                <ul className="space-y-1 rounded-lg bg-slate-100 p-3 text-xs text-slate-500">
                  {REGLAS_CONTRASENA.map((r) => {
                    const cumple = r.prueba(nueva);
                    return (
                      <li
                        key={r.etiqueta}
                        className={`flex items-center gap-1.5 ${
                          cumple ? "text-green-600" : "text-slate-500"
                        }`}
                      >
                        <span>{cumple ? "✓" : "•"}</span>
                        {r.etiqueta}
                      </li>
                    );
                  })}
                </ul>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={enviando || !token}
                  className="w-full rounded-lg bg-alacena-dark py-2.5 text-sm font-semibold text-white hover:bg-alacena-darker transition disabled:opacity-60"
                >
                  {enviando ? "Guardando..." : "Aceptar y guardar"}
                </button>
              </form>
            </>
          )}

          <p className="mt-4 text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-alacena-accent">
              ← Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
