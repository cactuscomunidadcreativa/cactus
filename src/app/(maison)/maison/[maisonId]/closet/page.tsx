import { authenticateMaisonUser } from '@/modules/cereus/lib/maison-auth';
import { MaisonShell } from '@/modules/cereus/components/maison-shell';
import { Shirt } from 'lucide-react';
import Link from 'next/link';

export default async function MaisonClosetRoute({
  params,
}: {
  params: Promise<{ maisonId: string }>;
}) {
  const { maisonId } = await params;
  const { maisonName, config } = await authenticateMaisonUser(maisonId);

  return (
    <MaisonShell maisonId={maisonId} maisonName={maisonName} config={config}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold">Digital Closet</h1>
            <p className="text-sm text-muted-foreground">Client wardrobe management</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Shirt className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Digital Wardrobe</h3>
          <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
            The digital closet tracks each client&apos;s wardrobe — delivered pieces, favorite combinations,
            style evolution, and outfit planning.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
            <div className="p-4 bg-muted/50 rounded-xl text-center">
              <p className="text-2xl font-display font-bold">0</p>
              <p className="text-xs text-muted-foreground">Pieces</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl text-center">
              <p className="text-2xl font-display font-bold">0</p>
              <p className="text-xs text-muted-foreground">Outfits</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl text-center">
              <p className="text-2xl font-display font-bold">0</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
          </div>
        </div>
      </div>
    </MaisonShell>
  );
}
