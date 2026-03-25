export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-6 space-y-4">
        <div className="h-8 bg-border/40 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-border/30 rounded w-1/2 mx-auto" />
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-10">
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-border/30 rounded-lg" />
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="space-y-3">
          <div className="h-5 bg-border/30 rounded w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-5 bg-border/20 rounded" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="h-5 bg-border/30 rounded w-32" />
          <div className="h-24 bg-border/20 rounded" />
        </div>
      </div>
    </div>
  );
}
