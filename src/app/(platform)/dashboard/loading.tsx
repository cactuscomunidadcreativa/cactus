export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Welcome skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted rounded-md mb-2" />
        <div className="h-4 w-72 bg-muted rounded-md" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <div className="h-4 w-12 bg-muted rounded mb-2" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Active apps skeleton */}
      <div className="mb-8">
        <div className="h-6 w-32 bg-muted rounded-md mb-4" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="h-5 w-28 bg-muted rounded" />
              </div>
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-4 w-2/3 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed skeleton */}
      <div>
        <div className="h-6 w-40 bg-muted rounded-md mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-muted rounded mb-1" />
                <div className="h-3 w-1/3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
