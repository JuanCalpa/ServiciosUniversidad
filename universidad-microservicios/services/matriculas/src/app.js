const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { validateStudent, validateTeacher } = require("./clients");

function buildApp(pool) {
  const app = express();
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ ok: true, service: "matriculas" }));

  // GET /api/matriculas?student_id=1&period=2026-1
  app.get("/api/matriculas", async (req, res) => {
    const { student_id, teacher_id, period } = req.query;

    let sql = "SELECT * FROM enrollments WHERE 1=1";
    const params = [];

    if (student_id) { sql += " AND student_id=?"; params.push(Number(student_id)); }
    if (teacher_id) { sql += " AND teacher_id=?"; params.push(Number(teacher_id)); }
    if (period) { sql += " AND period=?"; params.push(String(period)); }

    sql += " ORDER BY id DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  });

  // GET /api/matriculas/:id
  app.get("/api/matriculas/:id", async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await pool.query("SELECT * FROM enrollments WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "No encontrado" });
    res.json(rows[0]);
  });

  // POST /api/matriculas
  // body: { student_id, teacher_id, period }
  app.post("/api/matriculas", async (req, res) => {
    const { student_id, teacher_id, period } = req.body;

    if (!student_id || !teacher_id || !period) {
      return res.status(400).json({ message: "student_id, teacher_id y period son obligatorios" });
    }

    const sid = Number(student_id);
    const tid = Number(teacher_id);
    const per = String(period).trim();

    if (!Number.isInteger(sid) || sid <= 0) {
      return res.status(400).json({ message: "student_id debe ser un entero positivo" });
    }
    if (!Number.isInteger(tid) || tid <= 0) {
      return res.status(400).json({ message: "teacher_id debe ser un entero positivo" });
    }
    if (per.length < 3 || per.length > 20) {
      return res.status(400).json({ message: "period inválido (ej: 2026-1)" });
    }

    // 1) Validar estudiante y profesor (integración entre microservicios)
    const [vs, vt] = await Promise.all([validateStudent(sid), validateTeacher(tid)]);

    if (vs.exists === false) return res.status(404).json({ message: `Estudiante ${sid} no existe` });
    if (vt.exists === false) return res.status(404).json({ message: `Profesor ${tid} no existe` });

    if (vs.exists === null) return res.status(503).json({ message: vs.error || "Estudiantes no disponible" });
    if (vt.exists === null) return res.status(503).json({ message: vt.error || "Profesores no disponible" });

    // 2) Evitar duplicado (misma matrícula por periodo)
    const [dup] = await pool.query(
      "SELECT id FROM enrollments WHERE student_id=? AND teacher_id=? AND period=? AND status='CREATED' LIMIT 1",
      [sid, tid, per]
    );
    if (dup.length) {
      return res.status(409).json({ message: "Ya existe una matrícula activa para ese estudiante/profesor/periodo" });
    }

    // 3) Insertar
    const [result] = await pool.query(
      "INSERT INTO enrollments (student_id, teacher_id, period, status) VALUES (?,?,?, 'CREATED')",
      [sid, tid, per]
    );

    const [rows] = await pool.query("SELECT * FROM enrollments WHERE id=?", [result.insertId]);
    res.status(201).json(rows[0]);
  });

  // PATCH /api/matriculas/:id/cancelar
  app.patch("/api/matriculas/:id/cancelar", async (req, res) => {
    const id = Number(req.params.id);

    const [existing] = await pool.query("SELECT * FROM enrollments WHERE id=?", [id]);
    if (!existing.length) return res.status(404).json({ message: "No encontrado" });

    if (existing[0].status === "CANCELLED") {
      return res.status(409).json({ message: "La matrícula ya está cancelada" });
    }

    await pool.query("UPDATE enrollments SET status='CANCELLED' WHERE id=?", [id]);
    const [rows] = await pool.query("SELECT * FROM enrollments WHERE id=?", [id]);
    res.json(rows[0]);
  });

  return app;
}

module.exports = { buildApp };