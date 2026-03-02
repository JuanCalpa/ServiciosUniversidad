async function fetchJson(url, { timeoutMs = 3000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();

    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

async function validateStudent(studentId) {
  const base = process.env.STUDENTS_SERVICE_URL;
  const url = `${base}/api/estudiantes/${studentId}`;
  const r = await fetchJson(url);
  if (r.status === 404) return { exists: false };
  if (!r.ok) return { exists: null, error: `Error consultando estudiantes (${r.status})` };
  return { exists: true, student: r.data };
}

async function validateTeacher(teacherId) {
  const base = process.env.TEACHERS_SERVICE_URL;
  const url = `${base}/api/profesores/${teacherId}`;
  const r = await fetchJson(url);
  if (r.status === 404) return { exists: false };
  if (!r.ok) return { exists: null, error: `Error consultando profesores (${r.status})` };
  return { exists: true, teacher: r.data };
}

module.exports = { validateStudent, validateTeacher };