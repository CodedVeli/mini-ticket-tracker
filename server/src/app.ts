import express from "express";
import { errorHandler, HttpError } from "./errors";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(() => {
  throw new HttpError(404, "Not found");
});

app.use(errorHandler);
