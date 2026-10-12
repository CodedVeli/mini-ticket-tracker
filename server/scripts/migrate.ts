import { pool } from "../src/db";
import { migrate } from "../src/migrate";

await migrate();
await pool.end();
