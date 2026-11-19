# FreshLog – Frontend (PWA)

Interfaz de FreshLog hecha con React 19, Vite y Tailwind CSS.

## Instalación y ejecución

1. Node.js 20.19 o superior (o 22.12 o superior).
2. `npm install` (instala las versiones fijadas en `package-lock.json`).
3. Copie `.env.example` como `.env.local`; `VITE_API_URL` es la dirección de la API (por defecto http://localhost:8000).
4. `npm run dev` y abra http://localhost:5173.

## Compilación y modo sin conexión

    npm run build
    npm run preview

El Service Worker solo se registra en la versión compilada. Sin conexión, la aplicación abre con los
datos consultados antes y permite **registrar compras**, que se sincronizan al recuperar internet.
Las demás acciones (consumo, alertas, configuración) requieren conexión.

## Revisión

    npx oxlint      # revisión del código
    npm audit       # dependencias (0 vulnerabilidades conocidas a la fecha de la entrega)
