const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(cors());
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true, service: "gateway" }));

// Estudiantes -> 8081
app.use(
  "/api/estudiantes",
  createProxyMiddleware({
    target: "http://localhost:8081",
    changeOrigin: true,
    // path llega como "/" o "/123", lo convertimos a "/api/estudiantes/" o "/api/estudiantes/123"
    pathRewrite: (path) => `/api/estudiantes${path}`,
  })
);

// Profesores -> 8082
app.use(
  "/api/profesores",
  createProxyMiddleware({
    target: "http://localhost:8082",
    changeOrigin: true,
    pathRewrite: (path) => `/api/profesores${path}`,
  })
);

// Matrículas -> 8083
app.use(
  "/api/matriculas",
  createProxyMiddleware({
    target: "http://localhost:8083",
    changeOrigin: true,
    pathRewrite: (path) => `/api/matriculas${path}`,
  })
);

app.listen(8080, () => console.log("Gateway listo en http://localhost:8080"));