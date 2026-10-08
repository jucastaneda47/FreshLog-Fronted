import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { solicitarRecuperacion } from "../api/client";
import FondoAuthMovil, { LogoAuthMovil } from "../components/FondoAuthMovil";

export default function RecuperarContrasena() {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await solicitarRecuperacion({ correo });
      setEnviado(true);
    } catch (err) {
      const detalle = err.response?.data?.detail;
      setError(detalle || "No se pudo procesar la solicitud. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  // Título de la pestaña del navegador
  useEffect(() => {
    document.title = "FreshLog · Recuperar contraseña";
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
            Te ayudamos a volver a entrar.
          </h1>
          <p className="text-slate-300 mb-6">
            Ingresa el correo con el que te registraste y te mandamos un
            enlace para crear una nueva contraseña.
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
          <h2 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h2>

          {enviado ? (
            <>
              <p className="text-slate-500 text-sm mt-2 mb-6">
                Si el correo <strong>{correo}</strong> está registrado, te
                enviamos un enlace para restablecer tu contraseña. Revisa tu
                bandeja de entrada (y la carpeta de spam).
              </p>
              <Link
                to="/login"
                className="block w-full rounded-lg bg-alacena-dark py-2.5 text-center text-sm font-semibold text-white hover:bg-alacena-darker transition"
              >
                Volver a iniciar sesión
              </Link>
            </>
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-6">
                Te enviaremos un enlace a tu correo para crear una nueva contraseña.
              </p>

              <form onSubmit={manejarSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="tu_correo@ejemplo.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alacena-accent"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full rounded-lg bg-alacena-dark py-2.5 text-sm font-semibold text-white hover:bg-alacena-darker transition disabled:opacity-60"
                >
                  {enviando ? "Enviando..." : "Enviar enlace"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-slate-500">
                <Link to="/login" className="font-medium text-alacena-accent">
                  ← Volver a iniciar sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
