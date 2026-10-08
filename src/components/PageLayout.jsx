import Sidebar from "./Sidebar";
import BarraInferior from "./BarraInferior";
import BarraSuperiorMovil from "./BarraSuperiorMovil";
import BannerConexion from "./BannerConexion";

export default function PageLayout({ titulo, subtitulo, children }) {
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperiorMovil />
        {/* pb-24: deja espacio para que la barra inferior no tape el final de la página */}
        <main className="min-w-0 flex-1 px-4 pb-24 pt-5 md:p-8 md:pb-8">
          <header className="mb-5 md:mb-6">
            <h1 className="text-lg font-bold text-slate-900 md:text-xl">{titulo}</h1>
            {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
          </header>
          {children}
        </main>
      </div>
      <BannerConexion />
      <BarraInferior />
    </div>
  );
}
