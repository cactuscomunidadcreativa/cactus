export default function MarketplaceLoading() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-40 bg-muted rounded-md mb-2" />
        <div className="h-4 w-64 bg-muted rounded-md" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-10 w-full bg-muted rounded-lg mb-4" />

      {/* Category pills skeleton */}
      <div className="flex gap-2 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-muted rounded-full" />
        ))}
      </div>

      {/* App cards skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-muted rounded-xl" />
              <div>
                <div className="h-5 w-32 bg-muted rounded mb-1" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
            <div className="h-4 w-full bg-muted rounded mb-2" />
            <div className="h-4 w-4/5 bg-muted rounded mb-4" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-muted rounded-full" />
              <div className="h-6 w-16 bg-muted rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
