const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

function buildApp(pool) {
  const app = express();
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ ok: true, service: "estudiantes" }));

  app.get("/api/estudiantes", async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM students ORDER BY id DESC");
    res.json(rows);
  });

  app.get("/api/estudiantes/:id", async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await pool.query("SELECT * FROM students WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  });

  app.post("/api/estudiantes", async (req, res) => {
    const { document, full_name, email, status } = req.body;
    if (!document || !full_name || !email) {
      return res.status(400).json({ message: "document, full_name y email son obligatorios" });
    }
    try {
      const [result] = await pool.query(
        "INSERT INTO students (document, full_name, email, status) VALUES (?,?,?,?)",
        [document, full_name, email, status || "ACTIVE"]
      );
      const [rows] = await pool.query("SELECT * FROM students WHERE id=?", [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "document o email ya existe" });
      console.error(err);
      res.status(500).json({ message: "Error interno" });
    }
  });

  app.put("/api/estudiantes/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { full_name, email, status } = req.body;

    const [existing] = await pool.query("SELECT * FROM students WHERE id=?", [id]);
    if (existing.length === 0) return res.status(404).json({ message: "No encontrado" });

    try {
      await pool.query(
        "UPDATE students SET full_name=?, email=?, status=? WHERE id=?",
        [
          full_name ?? existing[0].full_name,
          email ?? existing[0].email,
          status ?? existing[0].status,
          id,
        ]
      );

      const [rows] = await pool.query("SELECT * FROM students WHERE id=?", [id]);
      res.json(rows[0]);
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "email ya existe" });
      }
      console.error(err);
      res.status(500).json({ message: "Error interno" });
    }
  });

  return app;
}

module.exports = { buildApp };