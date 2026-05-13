import type { TrackingType } from "@/features/tracking/types";
import { getStatus, trackingPipeline } from "@/features/tracking/tracking-utils";

export default function TrackingProgress({ status, type }: { status: string; type: TrackingType }) {
  const pipeline = trackingPipeline(type);
  const current = Math.max(0, pipeline.indexOf(status?.toLowerCase()));

  return (
    <div className="border-b border-slate-100 px-6 py-5">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Progress
      </p>
      <div className="relative">
        <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-slate-200" />
        <div
          className="absolute left-0 top-3.5 h-0.5 bg-primary transition-all"
          style={{ width: `${(current / Math.max(1, pipeline.length - 1)) * 100}%` }}
        />
        <div className="relative flex justify-between">
          {pipeline.map((step, index) => {
            const done = index <= current;
            const active = index === current;
            const config = getStatus(step);

            return (
              <div key={step} className="flex flex-col items-center gap-2">
                <div
                  className={`z-10 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                    done ? "bg-primary text-white" : "border-2 border-slate-200 bg-white text-slate-400"
                  } ${active ? "ring-4 ring-primary/15" : ""}`}
                >
                  {done && !active ? "✓" : index + 1}
                </div>
                <span className={`max-w-[58px] text-center text-[9px] font-semibold leading-tight ${done ? "text-primary" : "text-slate-400"}`}>
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
