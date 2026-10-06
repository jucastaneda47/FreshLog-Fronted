import { createContext, useContext, useState, useEffect } from "react";
import { login as loginRequest, obtenerUsuarioActual, renovarSesion } from "../api/client";

// Cierre de sesión por inactividad
const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000; // 10 minutos sin interacción
const RENOVAR_CADA_MS = 4 * 60 * 1000; // con actividad, el token se renueva cada 4 min
const EVENTOS_ACTIVIDAD = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("alacena_token");
    if (!token) {
      setCargando(false);
      return;
    }
    obtenerUsuarioActual()
      .then(setUsuario)
      .catch(() => localStorage.removeItem("alacena_token"))
      .finally(() => setCargando(false));
  }, []);

  // Mientras haya sesión: a los 10 min sin interacción se cierra; con actividad
  // se renueva el token para que no caduque a los 10 min estando en uso.
  useEffect(() => {
    if (!usuario) return;

    let temporizador;
    let ultimaRenovacion = 0; // 0: la primera interacción renueva de inmediato

    function expirar() {
      localStorage.removeItem("alacena_token");
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
    setUsuario(perfil);
    return perfil;
  }

  // Actualiza en memoria un campo del usuario (p. ej. el avatar) sin recargar
  function actualizarUsuario(cambios) {
    setUsuario((u) => (u ? { ...u, ...cambios } : u));
  }

  function cerrarSesion() {
    localStorage.removeItem("alacena_token");
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
