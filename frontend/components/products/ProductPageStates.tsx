import { FormPageSkeleton } from "@/components/ui/page-skeletons";

export function ProductLoadingState({ label = "Loading products..." }: { label?: string }) {
  return <FormPageSkeleton key={label} />;
}

export function ProductErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}
