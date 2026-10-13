import { Router } from "express";
import { createTicket, listTickets } from "./repo";
import { createTicketSchema, listQuerySchema } from "./validation";

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
