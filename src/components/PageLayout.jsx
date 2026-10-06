import Sidebar from "./Sidebar";

export default function PageLayout({ titulo, subtitulo, children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
          {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
        </header>
        {children}
      </main>
    </div>
  );
}
