import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyPin from "./pages/VerifyPin";
import RecuperarContrasena from "./pages/RecuperarContrasena";
import RestablecerContrasena from "./pages/RestablecerContrasena";
import Dashboard from "./pages/Dashboard";
import Compras from "./pages/Compras";
import Consumo from "./pages/Consumo";
import Alertas from "./pages/Alertas";
import Cuenta from "./pages/Cuenta";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/verificar-pin" element={<VerifyPin />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
          <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />

          <Route
            path="/tablero"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compras"
            element={
              <ProtectedRoute>
                <Compras />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consumo"
            element={
              <ProtectedRoute>
                <Consumo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alertas"
            element={
              <ProtectedRoute>
                <Alertas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cuenta"
            element={
              <ProtectedRoute>
                <Cuenta />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
