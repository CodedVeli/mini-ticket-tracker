export const STATUSES = ["open", "in_progress", "closed"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  in_progress: "In progress",
  closed: "Closed",
};

export type Ticket = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  created_at: string;
};

export type TicketPage = { data: Ticket[]; page: number; limit: number; total: number };
export type Stats = Record<Status, number>;
export type NewTicket = { title: string; description?: string; priority: Priority };

type ApiError = { error: { message: string; details?: { path: string; message: string }[] } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json();
  if (!res.ok) {
    const { message, details } = (body as ApiError).error;
    throw new Error(details?.length ? details.map((d) => `${d.path}: ${d.message}`).join(", ") : message);
  }
  return body as T;
}

export const api = {
  listTickets(params: { status?: Status; page: number; limit: number }) {
    const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
    if (params.status) query.set("status", params.status);
    return request<TicketPage>(`/tickets?${query}`);
  },
  getStats() {
    return request<Stats>("/tickets/stats");
  },
  createTicket(input: NewTicket) {
    return request<Ticket>("/tickets", { method: "POST", body: JSON.stringify(input) });
  },
  updateTicket(id: string, changes: { status?: Status; priority?: Priority }) {
    return request<Ticket>(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
  },
};
