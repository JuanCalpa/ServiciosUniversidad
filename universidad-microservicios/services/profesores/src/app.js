const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

function buildApp(pool) {
  const app = express();
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ ok: true, service: "profesores" }));

  // GET /api/profesores
  app.get("/api/profesores", async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM teachers ORDER BY id DESC");
    res.json(rows);
  });

  // GET /api/profesores/:id
  app.get("/api/profesores/:id", async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await pool.query("SELECT * FROM teachers WHERE id=?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  });

  // POST /api/profesores
  app.post("/api/profesores", async (req, res) => {
    const { document, full_name, email, department, status } = req.body;

    if (!document || !full_name || !email) {
      return res.status(400).json({ message: "document, full_name y email son obligatorios" });
    }

    try {
      const [result] = await pool.query(
        "INSERT INTO teachers (document, full_name, email, department, status) VALUES (?,?,?,?,?)",
        [document, full_name, email, department || null, status || "ACTIVE"]
      );
      const [rows] = await pool.query("SELECT * FROM teachers WHERE id=?", [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "document o email ya existe" });
      }
      console.error(err);
      res.status(500).json({ message: "Error interno" });
    }
  });

  // PUT /api/profesores/:id
  app.put("/api/profesores/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { full_name, email, department, status } = req.body;

    const [existing] = await pool.query("SELECT * FROM teachers WHERE id=?", [id]);
    if (existing.length === 0) return res.status(404).json({ message: "No encontrado" });

    try {
      await pool.query(
        "UPDATE teachers SET full_name=?, email=?, department=?, status=? WHERE id=?",
        [
          full_name ?? existing[0].full_name,
          email ?? existing[0].email,
          department ?? existing[0].department,
          status ?? existing[0].status,
          id,
        ]
      );
      const [rows] = await pool.query("SELECT * FROM teachers WHERE id=?", [id]);
      res.json(rows[0]);
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "email ya existe" });
      console.error(err);
      res.status(500).json({ message: "Error interno" });
    }
  });

  // DELETE /api/profesores/:id
  app.delete("/api/profesores/:id", async (req, res) => {
    const id = Number(req.params.id);
    const [result] = await pool.query("DELETE FROM teachers WHERE id=?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "No encontrado" });
    res.status(204).send();
  });

  return app;
}

module.exports = { buildApp };