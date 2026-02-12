export default function AppLoading() {
  return (
    <div className="animate-pulse p-4">
      {/* App header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-muted rounded-lg" />
        <div className="h-6 w-36 bg-muted rounded" />
      </div>

      {/* Content area skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 bg-card border border-border rounded-lg p-6">
          <div className="h-5 w-32 bg-muted rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="h-5 w-24 bg-muted rounded mb-4" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
