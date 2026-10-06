// Avatares humanos y formales (busto: rostro + cuello + hombros), dibujados en SVG.
// Cada avatar es solo una combinación de parámetros; el dibujo es el mismo para todos.

export const AVATARES = [
  { id: "a1",  piel: "#f1c7a0", pelo: "#3b2a20", peinado: "corto",  ropa: "#1e3a5f", prenda: "saco",   gafas: false, barba: false, fondo: "#dbeafe" },
  { id: "a2",  piel: "#8d5a3b", pelo: "#15110e", peinado: "corto",  ropa: "#374151", prenda: "camisa", gafas: true,  barba: false, fondo: "#fde68a" },
  { id: "a3",  piel: "#f6d5b8", pelo: "#7a4a25", peinado: "largo",  ropa: "#7f1d4e", prenda: "blusa",  gafas: false, barba: false, fondo: "#fbcfe8" },
  { id: "a4",  piel: "#c68a5c", pelo: "#1c1410", peinado: "largo",  ropa: "#0f766e", prenda: "saco",   gafas: true,  barba: false, fondo: "#ccfbf1" },
  { id: "a5",  piel: "#e8b48a", pelo: "#2b2b2b", peinado: "corto",  ropa: "#4b5563", prenda: "saco",   gafas: false, barba: true,  fondo: "#e5e7eb" },
  { id: "a6",  piel: "#5e3a24", pelo: "#0d0b0a", peinado: "rizado", ropa: "#b45309", prenda: "blusa",  gafas: false, barba: false, fondo: "#fed7aa" },
  { id: "a7",  piel: "#f1c7a0", pelo: "#b9722f", peinado: "mono",   ropa: "#1d4ed8", prenda: "camisa", gafas: true,  barba: false, fondo: "#e0e7ff" },
  { id: "a8",  piel: "#a8703f", pelo: "#3a2a1c", peinado: "calvo",  ropa: "#166534", prenda: "saco",   gafas: false, barba: true,  fondo: "#dcfce7" },
  { id: "a9",  piel: "#f6d5b8", pelo: "#d8b56a", peinado: "largo",  ropa: "#334155", prenda: "camisa", gafas: false, barba: false, fondo: "#f1f5f9" },
  { id: "a10", piel: "#7a4a2e", pelo: "#0d0b0a", peinado: "corto",  ropa: "#7c2d12", prenda: "camisa", gafas: true,  barba: true,  fondo: "#ffedd5" },
  { id: "a11", piel: "#e8b48a", pelo: "#5b2a1a", peinado: "rizado", ropa: "#581c87", prenda: "blusa",  gafas: true,  barba: false, fondo: "#f3e8ff" },
  { id: "a12", piel: "#c68a5c", pelo: "#8a8a8a", peinado: "corto",  ropa: "#111827", prenda: "saco",   gafas: true,  barba: true,  fondo: "#e2e8f0" },
];

export function buscarAvatar(id) {
  return AVATARES.find((a) => a.id === id) || null;
}

function Peinado({ tipo, color, parte }) {
  // parte "atras": detrás de la cabeza; parte "frente": encima.
  if (parte === "atras") {
    if (tipo === "largo")
      return <path d="M29 46 C27 20 40 14 50 14 C60 14 73 20 71 46 L74 76 L26 76 Z" fill={color} />;
    if (tipo === "mono") return <circle cx="50" cy="13" r="7" fill={color} />;
    return null;
  }
  if (tipo === "calvo") return null;
  if (tipo === "rizado")
    return (
      <g fill={color}>
        <circle cx="36" cy="29" r="8" />
        <circle cx="50" cy="23" r="9" />
        <circle cx="64" cy="29" r="8" />
        <circle cx="32" cy="38" r="6" />
        <circle cx="68" cy="38" r="6" />
      </g>
    );
  // corto, largo, mono comparten el flequillo
  return (
    <path
      d="M32 42 C30 24 40 18 50 18 C60 18 70 24 68 42 C65 33 59 29 52 28 C46 31 38 32 32 42 Z"
      fill={color}
    />
  );
}

function Prenda({ tipo, ropa, piel }) {
  return (
    <g>
      <path d="M10 100 C10 77 29 69 50 69 C71 69 90 77 90 100 Z" fill={ropa} />
      {tipo === "saco" && (
        <g>
          <path d="M40 69 L50 88 L60 69 Z" fill="#ffffff" />
          <path d="M40 69 L50 90 L34 100 L26 100 L30 76 Z" fill="#000" opacity="0.18" />
          <path d="M60 69 L50 90 L66 100 L74 100 L70 76 Z" fill="#000" opacity="0.18" />
          <path d="M50 76 L47 82 L50 96 L53 82 Z" fill="#b91c1c" />
        </g>
      )}
      {tipo === "camisa" && (
        <g>
          <path d="M40 69 L50 82 L60 69 Z" fill="#ffffff" />
          <path d="M50 82 L50 100" stroke="#000" strokeOpacity="0.2" strokeWidth="1" />
        </g>
      )}
      {tipo === "blusa" && (
        <path d="M40 69 C42 78 58 78 60 69 Z" fill={piel} />
      )}
    </g>
  );
}

export default function AvatarSvg({ avatar, className = "h-full w-full" }) {
  if (!avatar) return null;
  const { piel, pelo, peinado, ropa, prenda, gafas, barba, fondo } = avatar;
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Avatar">
      <rect width="100" height="100" fill={fondo} />
      <Peinado tipo={peinado} color={pelo} parte="atras" />
      {/* cuello */}
      <rect x="42" y="56" width="16" height="16" fill={piel} />
      <rect x="42" y="56" width="16" height="6" fill="#000" opacity="0.1" />
      <Prenda tipo={prenda} ropa={ropa} piel={piel} />
      {/* orejas y cabeza */}
      <circle cx="33" cy="44" r="3.5" fill={piel} />
      <circle cx="67" cy="44" r="3.5" fill={piel} />
      <ellipse cx="50" cy="42" rx="17" ry="20" fill={piel} />
      {barba && (
        <path d="M33 46 C33 68 67 68 67 46 C63 57 37 57 33 46 Z" fill={pelo} />
      )}
      <Peinado tipo={peinado} color={pelo} parte="frente" />
      {/* rostro */}
      <g fill="#1f2937">
        <circle cx="43" cy="43" r="1.8" />
        <circle cx="57" cy="43" r="1.8" />
      </g>
      <g stroke={pelo === "#8a8a8a" ? "#6b7280" : pelo} strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M39 38.5 Q43 36.5 47 38.5" />
        <path d="M53 38.5 Q57 36.5 61 38.5" />
      </g>
      <path d="M50 44 L49 49 L51.5 49" stroke="#000" strokeOpacity="0.25" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M44.5 53 Q50 57 55.5 53" stroke={barba ? "#ffffff" : "#7f1d1d"} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {gafas && (
        <g stroke="#111827" strokeWidth="1.3" fill="none">
          <circle cx="43" cy="43" r="5.5" />
          <circle cx="57" cy="43" r="5.5" />
          <path d="M48.5 43 L51.5 43" />
        </g>
      )}
    </svg>
  );
}
