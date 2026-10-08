// Fondo de las pantallas de acceso (login, registro, recuperar contraseña) en celular.
// En pantallas grandes la imagen va en el panel izquierdo de cada página, por eso aquí se oculta.
export default function FondoAuthMovil() {
  return (
    <div className="fixed inset-0 md:hidden" aria-hidden="true">
      <img src="/fondo-auth.jpg" alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-alacena-darker/90 to-alacena-dark/80" />
    </div>
  );
}

// Logo y nombre que se muestran sobre la tarjeta del formulario en celular.
export function LogoAuthMovil() {
  return (
    <div className="flex items-center gap-3 text-xl font-semibold text-white md:hidden">
      <img src="/logo-alacena.png" alt="Alacena" className="h-14 w-14 object-contain" />
      FRESHLOG
    </div>
  );
}
