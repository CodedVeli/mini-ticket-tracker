import { z } from "zod";

export const STATUSES = ["open", "in_progress", "closed"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const createTicketSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(STATUSES).default("open"),
  priority: z.enum(PRIORITIES).default("medium"),
});

export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const updateTicketSchema = z
  .strictObject({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
  })
  .refine((body) => body.status || body.priority, { message: "Provide status or priority" });

export const ticketIdSchema = z.uuid();

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
