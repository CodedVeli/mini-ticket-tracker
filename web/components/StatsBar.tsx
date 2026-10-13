import { STATUSES, STATUS_LABELS, type Stats } from "@/lib/api";

export default function StatsBar({ stats }: { stats: Stats | null }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {STATUSES.map((status) => (
        <div key={status} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">{STATUS_LABELS[status]}</div>
          <div className="text-2xl font-semibold">{stats ? stats[status] : "–"}</div>
        </div>
      ))}
    </div>
  );
}
