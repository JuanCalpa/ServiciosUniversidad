require("dotenv").config();
const { createPool } = require("./src/db");
const { ensureSchema } = require("./src/schema");
const { buildApp } = require("./src/app");

async function main() {
  const pool = createPool();
  await ensureSchema(pool);

  const app = buildApp(pool);
  const port = Number(process.env.PORT || 8083);

  app.listen(port, () => console.log(`Matrículas en http://localhost:${port}`));
}

main().catch((e) => {
  console.error("Fallo al iniciar matrículas:", e);
  process.exit(1);
});