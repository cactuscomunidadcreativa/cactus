import { Loader2 } from 'lucide-react';

export default function SaguaroLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Cargando SAGUARO...</p>
      </div>
    </div>
  );
}
