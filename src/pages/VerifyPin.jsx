import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { verificarPin, reenviarPin } from "../api/client";
import FondoAuthMovil, { LogoAuthMovil } from "../components/FondoAuthMovil";

export default function VerifyPin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState(location.state?.correo || "");
  const [pin, setPin] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);
    try {
      await verificarPin({ correo, pin });
      setMensaje("¡Cuenta verificada! Ya puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "PIN incorrecto o vencido.");
    } finally {
      setCargando(false);
    }
  }

  async function manejarReenvio() {
    setError("");
    setMensaje("");
    try {
      await reenviarPin(correo);
      setMensaje("Te enviamos un nuevo PIN a tu correo.");
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo reenviar el PIN.");
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 p-5 md:bg-slate-50 md:p-8">
      <FondoAuthMovil />
      <div className="relative z-10 flex w-full flex-col items-center gap-6">
        <LogoAuthMovil />
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl md:rounded-none md:bg-transparent md:p-0 md:shadow-none">
        <h2 className="text-2xl font-bold text-slate-900">Verifica tu correo</h2>
        <p className="text-slate-500 text-sm mb-6">
          Ingresa el código de 6 dígitos que enviamos a tu correo.
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alacena-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Código PIN
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="123456"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-alacena-accent"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {mensaje && <p className="text-sm text-green-600">{mensaje}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-alacena-dark py-2.5 text-sm font-semibold text-white hover:bg-alacena-darker transition disabled:opacity-60"
          >
            {cargando ? "Verificando..." : "Verificar cuenta"}
          </button>
        </form>

        <button
          onClick={manejarReenvio}
          className="mt-4 w-full text-center text-sm font-medium text-alacena-accent"
        >
          Reenviar PIN
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-alacena-accent">
            Volver al inicio de sesión
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
