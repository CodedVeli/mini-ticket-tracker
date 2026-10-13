import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { pool } from "../src/db";

beforeEach(async () => {
  await pool.query("TRUNCATE tickets");
});

afterAll(async () => {
  await pool.end();
});

const createTicket = (body: object) => request(app).post("/tickets").send(body);

describe("POST /tickets", () => {
  it("creates a ticket with defaults", async () => {
    const res = await createTicket({ title: "  Printer on fire  " });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Printer on fire",
      description: null,
      status: "open",
      priority: "medium",
    });
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Number.isNaN(Date.parse(res.body.created_at))).toBe(false);
  });

  it("rejects a blank title", async () => {
    const res = await createTicket({ title: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe("title");
  });
});

describe("GET /tickets", () => {
  it("filters by status and paginates newest first", async () => {
    for (const title of ["open 1", "open 2", "open 3"]) await createTicket({ title });
    await createTicket({ title: "done", status: "closed" });

    const first = await request(app).get("/tickets?status=open&limit=2");
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ page: 1, limit: 2, total: 3 });
    expect(first.body.data.map((t: { title: string }) => t.title)).toEqual(["open 3", "open 2"]);

    const second = await request(app).get("/tickets?status=open&limit=2&page=2");
    expect(second.body.data.map((t: { title: string }) => t.title)).toEqual(["open 1"]);
  });

  it("rejects an unknown status", async () => {
    const res = await request(app).get("/tickets?status=pending");
    expect(res.status).toBe(400);
  });
});

describe("GET /tickets/stats", () => {
  it("counts tickets per status, including empty ones", async () => {
    await createTicket({ title: "a" });
    await createTicket({ title: "b" });
    await createTicket({ title: "c", status: "closed" });

    const res = await request(app).get("/tickets/stats");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ open: 2, in_progress: 0, closed: 1 });
  });
});

describe("PATCH /tickets/:id", () => {
  it("updates status and leaves priority alone", async () => {
    const { body: ticket } = await createTicket({ title: "a", priority: "high" });

    const res = await request(app).patch(`/tickets/${ticket.id}`).send({ status: "in_progress" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: ticket.id, status: "in_progress", priority: "high" });
  });

  it("requires status or priority", async () => {
    const { body: ticket } = await createTicket({ title: "a" });
    const res = await request(app).patch(`/tickets/${ticket.id}`).send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown id and 400 for a malformed one", async () => {
    const unknown = await request(app)
      .patch("/tickets/00000000-0000-4000-8000-000000000000")
      .send({ status: "closed" });
    expect(unknown.status).toBe(404);

    const malformed = await request(app).patch("/tickets/not-a-uuid").send({ status: "closed" });
    expect(malformed.status).toBe(400);
  });
});
