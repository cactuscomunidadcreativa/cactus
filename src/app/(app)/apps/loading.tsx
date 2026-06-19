// Skeleton compartido para todos los workspaces de agente: feedback instantáneo
// mientras carga la página servidor (perfil, créditos, imágenes).
export default function AppsLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar fantasma */}
      <div className="hidden w-60 shrink-0 border-r border-border bg-card lg:block">
        <div className="flex items-center gap-2.5 border-b border-border p-4">
          <div className="h-[38px] w-[38px] animate-pulse rounded-xl bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-2 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>

      {/* Main fantasma */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-8 w-32 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="space-y-5 p-4 md:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
