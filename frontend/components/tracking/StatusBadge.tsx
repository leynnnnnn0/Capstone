import { getStatus } from "@/features/tracking/tracking-utils";

export default function StatusBadge({ status }: { status: string }) {
  const config = getStatus(status);

  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold leading-none"
      style={{ background: config.bg, color: config.color }}
    >
      <span className="size-1.5 rounded-full opacity-85" style={{ background: config.dot }} />
      {config.label}
    </span>
  );
}
