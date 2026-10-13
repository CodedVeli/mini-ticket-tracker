import { Router } from "express";
import { HttpError } from "../errors";
import { createTicket, getStats, listTickets, updateTicket } from "./repo";
import { createTicketSchema, listQuerySchema, ticketIdSchema, updateTicketSchema } from "./validation";

export const ticketsRouter = Router();

ticketsRouter.post("/", async (req, res) => {
  const input = createTicketSchema.parse(req.body);
  res.status(201).json(await createTicket(input));
});

ticketsRouter.get("/", async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const { data, total } = await listTickets(query);
  res.json({ data, page: query.page, limit: query.limit, total });
});

ticketsRouter.get("/stats", async (_req, res) => {
  res.json(await getStats());
});

ticketsRouter.patch("/:id", async (req, res) => {
  const id = ticketIdSchema.parse(req.params.id);
  const changes = updateTicketSchema.parse(req.body);
  const ticket = await updateTicket(id, changes);
  if (!ticket) throw new HttpError(404, "Ticket not found");
  res.json(ticket);
});
