import { getStatus } from "@/features/tracking/tracking-utils";

export default function StatusBadge({ status }: { status: string }) {
  const config = getStatus(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
      style={{ background: config.bg, color: config.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: config.dot }} />
      {config.label}
    </span>
  );
}
