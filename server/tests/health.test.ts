import request from "supertest";
import { expect, it } from "vitest";
import { app } from "../src/app";

it("GET /health returns ok", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
});

it("unknown routes return 404 in the error shape", async () => {
  const res = await request(app).get("/nope");
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: { message: "Not found" } });
});
