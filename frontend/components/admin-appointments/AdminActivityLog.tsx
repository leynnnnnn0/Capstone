import type { CustomerRemark } from "@/features/customer/types";

export default function AdminActivityLog({ remarks }: { remarks: CustomerRemark[] }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-primary">Activity Log</h2>
      <div className="mt-4 space-y-3">
        {remarks.map((remark) => (
          <div key={remark.id} className="rounded-md border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold capitalize">{remark.action.replaceAll("_", " ")}</p>
              <p className="text-xs text-muted-foreground">{new Date(remark.created_at).toLocaleString("en-PH")}</p>
            </div>
            {remark.message && <p className="mt-1 text-sm text-muted-foreground">{remark.message}</p>}
            {remark.user?.full_name && <p className="mt-2 text-xs font-semibold text-primary">By {remark.user.full_name}</p>}
          </div>
        ))}
        {remarks.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
      </div>
    </div>
  );
}
