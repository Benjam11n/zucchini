export function InsightsLoadingState() {
  return (
    <div className="grid gap-4">
      <div className="h-28 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-md bg-muted" />
        <div className="h-72 animate-pulse rounded-md bg-muted lg:col-span-2" />
      </div>
    </div>
  );
}
