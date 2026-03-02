async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      teacher_id INT NOT NULL,
      period VARCHAR(20) NOT NULL,
      status ENUM('CREATED','CANCELLED') NOT NULL DEFAULT 'CREATED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

module.exports = { ensureSchema };