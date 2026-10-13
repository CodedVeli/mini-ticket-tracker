import { pool } from "../db";
import {
  STATUSES,
  type CreateTicketInput,
  type ListQuery,
  type Priority,
  type Status,
  type UpdateTicketInput,
} from "./validation";

export type Ticket = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  created_at: Date;
};

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const { rows } = await pool.query<Ticket>(
    `INSERT INTO tickets (title, description, status, priority)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.title, input.description || null, input.status, input.priority],
  );
  return rows[0];
}

export async function listTickets({ status, page, limit }: ListQuery) {
  const filter = "WHERE $1::ticket_status IS NULL OR status = $1";
  const [list, count] = await Promise.all([
    pool.query<Ticket>(
      `SELECT * FROM tickets ${filter}
       ORDER BY created_at DESC, id DESC
       LIMIT $2 OFFSET $3`,
      [status ?? null, limit, (page - 1) * limit],
    ),
    pool.query<{ count: string }>(`SELECT count(*) FROM tickets ${filter}`, [status ?? null]),
  ]);
  return { data: list.rows, total: Number(count.rows[0].count) };
}

export async function updateTicket(id: string, changes: UpdateTicketInput): Promise<Ticket | undefined> {
  const { rows } = await pool.query<Ticket>(
    `UPDATE tickets
     SET status = COALESCE($2::ticket_status, status),
         priority = COALESCE($3::ticket_priority, priority)
     WHERE id = $1
     RETURNING *`,
    [id, changes.status ?? null, changes.priority ?? null],
  );
  return rows[0];
}

export async function getStats(): Promise<Record<Status, number>> {
  const { rows } = await pool.query<{ status: Status; count: number }>(
    "SELECT status, count(*)::int AS count FROM tickets GROUP BY status",
  );
  const stats = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const row of rows) stats[row.status] = row.count;
  return stats;
}
