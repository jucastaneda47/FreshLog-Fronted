import PerfilUsuario from "./PerfilUsuario";

// Encabezado en celular: logo y perfil (en pantallas grandes lo muestra el menú lateral).
export default function BarraSuperiorMovil() {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between bg-alacena-dark px-4 py-2 text-white md:hidden"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <div className="flex items-center gap-2 text-base font-semibold">
        <img src="/logo-alacena.png" alt="" className="h-8 w-8 object-contain" />
        FRESHLOG
      </div>
      <PerfilUsuario variante="barra" />
    </header>
  );
}
