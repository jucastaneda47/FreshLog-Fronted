import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { guardarAvatar } from "../api/client";
import AvatarSvg, { AVATARES, buscarAvatar } from "./AvatarSvg";

// Círculo del usuario: muestra el avatar si existe, si no las iniciales.
export function CirculoUsuario({ usuario, avatar, size = "h-8 w-8", texto = "text-xs" }) {
  const datos = avatar ? buscarAvatar(avatar.id) : null;
  if (datos) {
    return (
      <div className={`${size} shrink-0 overflow-hidden rounded-full`}>
        <AvatarSvg avatar={datos} />
      </div>
    );
  }
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-white/20 font-semibold ${texto}`}
    >
      {usuario?.name?.slice(0, 2).toUpperCase() || "??"}
    </div>
  );
}

export default function PerfilUsuario() {
  const { usuario, cerrarSesion, actualizarUsuario } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [errorAvatar, setErrorAvatar] = useState("");
  const [guardando, setGuardando] = useState(false);
  // El avatar viene del backend (campo `avatar` del usuario)
  const avatar = usuario?.avatar && buscarAvatar(usuario.avatar) ? { id: usuario.avatar } : null;
  const [borrador, setBorrador] = useState(AVATARES[0].id);
  const contenedor = useRef(null);

  // Cierra el cuadro al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;
    function fuera(e) {
      if (contenedor.current && !contenedor.current.contains(e.target)) {
        setAbierto(false);
        setEditando(false);
      }
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierto]);

  async function guardar(nuevo) {
    setErrorAvatar("");
    setGuardando(true);
    try {
      const { avatar: guardado } = await guardarAvatar(nuevo ? nuevo.id : null);
      actualizarUsuario({ avatar: guardado });
      setEditando(false);
    } catch {
      setErrorAvatar("No se pudo guardar el avatar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function abrirEditor() {
    setBorrador(avatar?.id || AVATARES[0].id);
    setErrorAvatar("");
    setEditando(true);
  }

  return (
    <div ref={contenedor} className="relative border-t border-white/10 px-4 py-4">
      {abierto && (
        <div className="absolute bottom-full left-3 z-50 mb-2 w-72 rounded-xl bg-white p-4 text-slate-800 shadow-xl">
          {!editando ? (
            <>
              <div className="flex items-center gap-3">
                <CirculoUsuario
                  usuario={usuario}
                  avatar={avatar}
                  size="h-12 w-12"
                  texto="text-base text-white"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{usuario?.name}</p>
                  <p className="truncate text-xs text-slate-500">@{usuario?.username}</p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Correo</p>
                <p className="truncate text-sm">{usuario?.correo}</p>
              </div>

              <a
                href="/terminos-y-condiciones.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-sm font-medium text-blue-600 hover:underline"
              >
                Términos y condiciones aceptados
              </a>

              <button
                onClick={abrirEditor}
                className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium hover:bg-slate-50"
              >
                {avatar ? "Cambiar avatar" : "Crear avatar"}
              </button>
              {avatar && (
                <button
                  onClick={() => guardar(null)}
                  className="mt-1 w-full py-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  Quitar avatar
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <CirculoUsuario
                  usuario={usuario}
                  avatar={{ id: borrador }}
                  size="h-16 w-16"
                />
              </div>

              <p className="mb-2 mt-3 text-xs font-medium text-slate-500">Elige tu avatar</p>
              <div className="grid grid-cols-4 gap-2">
                {AVATARES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setBorrador(a.id)}
                    className={`overflow-hidden rounded-full ${
                      borrador === a.id ? "ring-2 ring-offset-2 ring-alacena-dark" : "hover:opacity-80"
                    }`}
                    aria-label={`Avatar ${a.id}`}
                  >
                    <AvatarSvg avatar={a} />
                  </button>
                ))}
              </div>

              {errorAvatar && <p className="mt-2 text-xs text-red-600">{errorAvatar}</p>}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setEditando(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => guardar({ id: borrador })}
                  disabled={guardando}
                  className="flex-1 rounded-lg bg-alacena-dark py-2 text-sm font-semibold text-white hover:bg-alacena-darker disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setAbierto((v) => !v)}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Ver perfil"
        >
          <CirculoUsuario usuario={usuario} avatar={avatar} />
        </button>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium">{usuario?.name || "Usuario"}</p>
          <button
            onClick={cerrarSesion}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
