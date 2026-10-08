import { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginRequest, obtenerUsuarioActual, renovarSesion,
  fijarUsuarioCache, limpiarSesionLocal, esErrorDeRed,
} from "../api/client";
import { estaEnLinea } from "../offline/conexion";

// Cierre de sesión por inactividad
const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000; // 10 minutos sin interacción
const RENOVAR_CADA_MS = 4 * 60 * 1000; // con actividad, el token se renueva cada 4 min
const EVENTOS_ACTIVIDAD = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

const AuthContext = createContext(null);

// Copia del perfil para poder abrir la app sin conexión
function guardarPerfil(perfil) {
  try {
    localStorage.setItem("alacena_perfil", JSON.stringify(perfil));
  } catch {
    /* sin almacenamiento */
  }
}

function leerPerfilGuardado() {
  try {
    return JSON.parse(localStorage.getItem("alacena_perfil") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("alacena_token");
    if (!token) {
      setCargando(false);
      return;
    }
    // Con red se valida la sesión. Sin red (o con el servidor sin responder) NO se cierra la sesión:
    // se abre con el último perfil guardado y se muestran los datos guardados.
    obtenerUsuarioActual({ timeout: 8000 })
      .then((perfil) => {
        guardarPerfil(perfil);
        fijarUsuarioCache(perfil.id);
        setUsuario(perfil);
      })
      .catch((err) => {
        const sinServidor = esErrorDeRed(err) || [502, 503, 504].includes(err.response?.status);
        const guardado = leerPerfilGuardado();
        if (sinServidor && guardado) {
          fijarUsuarioCache(guardado.id);
          setUsuario(guardado);
        } else if (!sinServidor) {
          // El servidor respondió y no aceptó la sesión (p. ej. token vencido)
          limpiarSesionLocal();
        }
      })
      .finally(() => setCargando(false));
  }, []);

  // Mientras haya sesión: a los 10 min sin interacción se cierra; con actividad
  // se renueva el token para que no caduque a los 10 min estando en uso.
  useEffect(() => {
    if (!usuario) return;

    let temporizador;
    let ultimaRenovacion = 0; // 0: la primera interacción renueva de inmediato

    function expirar() {
      // Sin conexión no se cierra la sesión: el tiempo sin internet no cuenta como inactividad.
      if (!estaEnLinea()) {
        reiniciar();
        return;
      }
      limpiarSesionLocal();
      try {
        sessionStorage.setItem("alacena_sesion_expirada", "1");
      } catch {
        /* sin almacenamiento: se cierra igual, solo sin aviso */
      }
      setUsuario(null); // ProtectedRoute lleva al login
    }

    function reiniciar() {
      clearTimeout(temporizador);
      temporizador = setTimeout(expirar, TIEMPO_INACTIVIDAD_MS);
    }

    function alHaberActividad() {
      reiniciar();
      if (Date.now() - ultimaRenovacion > RENOVAR_CADA_MS) {
        ultimaRenovacion = Date.now();
        renovarSesion()
          .then((d) => localStorage.setItem("alacena_token", d.access_token))
          .catch(() => {});
      }
    }

    reiniciar();
    EVENTOS_ACTIVIDAD.forEach((e) => window.addEventListener(e, alHaberActividad, { passive: true }));
    return () => {
      clearTimeout(temporizador);
      EVENTOS_ACTIVIDAD.forEach((e) => window.removeEventListener(e, alHaberActividad));
    };
  }, [usuario]);

  async function iniciarSesion({ username, password }) {
    const data = await loginRequest({ username, password });
    localStorage.setItem("alacena_token", data.access_token);
    const perfil = await obtenerUsuarioActual();
    guardarPerfil(perfil);
    fijarUsuarioCache(perfil.id);
    setUsuario(perfil);
    return perfil;
  }

  // Actualiza en memoria un campo del usuario (p. ej. el avatar) sin recargar
  function actualizarUsuario(cambios) {
    setUsuario((u) => {
      if (!u) return u;
      const nuevo = { ...u, ...cambios };
      guardarPerfil(nuevo);
      return nuevo;
    });
  }

  // Cierre manual: se borran el token, el perfil y los datos guardados de este dispositivo.
  // Las compras pendientes de enviar se conservan y se envían al volver a iniciar sesión.
  function cerrarSesion() {
    limpiarSesionLocal();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
