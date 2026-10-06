import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarUsuario } from "../api/client";

export default function Register() {
  const [form, setForm] = useState({ name: "", correo: "", username: "", contraseña: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const navigate = useNavigate();

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setError("");
    if (!aceptaTerminos) {
      setError("Debes aceptar los términos y condiciones para crear tu cuenta.");
      return;
    }
    setCargando(true);
    try {
      await registrarUsuario(form);
      // Tras registrarse, el backend envía el PIN por correo.
      // Mandamos al usuario a la pantalla de verificación.
      navigate("/verificar-pin", { state: { correo: form.correo } });
    } catch (err) {
      const detalle = err.response?.data?.detail;
      setError(
        typeof detalle === "string"
          ? detalle
          : "No se pudo crear la cuenta. Revisa los datos."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen">
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
          <p className="text-slate-300">
            Registra tus compras, controla el inventario y recibe alertas antes
            de que un producto caduque.
          </p>
        </div>
        <p className="relative z-10 text-xs text-slate-400">
          Proyecto de grado · Universidad Antonio Nariño · 2026
        </p>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm">
          <div className="flex mb-8 rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <Link
              to="/login"
              className="flex-1 rounded-md py-2 text-center text-slate-500"
            >
              Iniciar sesión
            </Link>
            <span className="flex-1 rounded-md bg-white py-2 text-center shadow-sm">
              Crear cuenta
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Crea tu cuenta</h2>
          <p className="text-slate-500 text-sm mb-6">Configura tu cuenta en un minuto.</p>

          <form onSubmit={manejarSubmit} className="space-y-4">
            <Campo
              label="Nombre completo"
              value={form.name}
              onChange={(v) => actualizar("name", v)}
              placeholder="Andrés Guzmán"
            />
            <Campo
              label="Correo electrónico"
              type="email"
              value={form.correo}
              onChange={(v) => actualizar("correo", v)}
              placeholder="nombre@correo.com"
            />
            <Campo
              label="Usuario"
              value={form.username}
              onChange={(v) => actualizar("username", v)}
              placeholder="andres_g"
            />
            <Campo
              label="Contraseña"
              type="password"
              value={form.contraseña}
              onChange={(v) => actualizar("contraseña", v)}
              placeholder="Mínimo 8 caracteres"
            />

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => {
                  setAceptaTerminos(e.target.checked);
                  if (e.target.checked) setError("");
                }}
                className="h-4 w-4 rounded border-slate-300 accent-alacena-accent"
              />
              <a
                href="/terminos-y-condiciones.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-alacena-accent hover:underline"
              >
                Términos y condiciones
              </a>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-alacena-dark py-2.5 text-sm font-semibold text-white hover:bg-alacena-darker transition disabled:opacity-60"
            >
              {cargando ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-medium text-alacena-accent">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alacena-accent"
      />
    </div>
  );
}
