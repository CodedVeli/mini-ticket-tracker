import { STATUSES, STATUS_LABELS, type Priority, type Status, type TicketPage } from "@/lib/api";

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-700",
};

type Props = {
  tickets: TicketPage | null;
  filter: Status | "";
  onFilterChange: (filter: Status | "") => void;
  onPageChange: (page: number) => void;
  onStatusChange: (id: string, status: Status) => void;
};

export default function TicketList({ tickets, filter, onFilterChange, onPageChange, onStatusChange }: Props) {
  const totalPages = tickets ? Math.max(1, Math.ceil(tickets.total / tickets.limit)) : 1;

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="font-semibold">Tickets</h2>
        <label className="flex items-center gap-2 text-sm">
          Status
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as Status | "")}
            className="rounded border border-slate-300 px-2 py-1"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!tickets ? (
        <p className="p-6 text-center text-sm text-slate-500">Loading…</p>
      ) : tickets.data.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">No tickets found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.data.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.title}</div>
                    {t.description && <div className="mt-0.5 text-slate-500">{t.description}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[t.priority]}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Status of ${t.title}`}
                      value={t.status}
                      onChange={(e) => onStatusChange(t.id, e.target.value as Status)}
                      className="rounded border border-slate-300 px-2 py-1"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm">
        <button
          onClick={() => tickets && onPageChange(tickets.page - 1)}
          disabled={!tickets || tickets.page <= 1}
          className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-slate-500">
          Page {tickets?.page ?? 1} of {totalPages}
        </span>
        <button
          onClick={() => tickets && onPageChange(tickets.page + 1)}
          disabled={!tickets || tickets.page >= totalPages}
          className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
