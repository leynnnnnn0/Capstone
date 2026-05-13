import { Package } from "lucide-react";

export function ProductLoadingState({ label = "Loading products..." }: { label?: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      <Package className="mb-2 h-8 w-8 opacity-40" />
      {label}
    </div>
  );
}

export function ProductErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}
