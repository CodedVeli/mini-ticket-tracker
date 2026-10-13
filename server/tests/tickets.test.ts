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
