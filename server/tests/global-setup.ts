export default async function setup() {
  const { migrate } = await import("../src/migrate");
  const { pool } = await import("../src/db");
  await migrate();
  await pool.end();
}
