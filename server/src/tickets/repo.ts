import { pool } from "../db";
import type { CreateTicketInput, ListQuery, Priority, Status } from "./validation";

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
