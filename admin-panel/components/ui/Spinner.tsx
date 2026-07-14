export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent ${className}`}
      role="status"
      aria-label="Загрузка"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner className="h-6 w-6" />
    </div>
  );
}
