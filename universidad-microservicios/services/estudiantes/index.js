require("dotenv").config();
const { createPool } = require("./src/db");
const { ensureSchema } = require("./src/schema");
const { buildApp } = require("./src/app");

async function main() {
  const pool = createPool();
  await ensureSchema(pool);

  const app = buildApp(pool);
  const port = Number(process.env.PORT || 8081);
  app.listen(port, () => console.log(`Estudiantes en http://localhost:${port}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});