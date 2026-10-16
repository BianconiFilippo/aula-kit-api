require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const apiRouter = require("./src/routes");
const { globalLimiter } = require("./src/middlewares/rateLimiter.middleware");

const app = express();

// Trust proxy if running behind reverse proxy (e.g. Render, Vercel, Railway, Nginx)
app.set("trust proxy", 1);

// 1. Escudo de Cabeceras HTTP con Helmet
app.use(helmet());

// 2. CORS Estricto con control de orígenes permitidos
const allowedOrigins = [
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "https://aulakit.com",          // Producción principal (placeholder / dominio productivo)
  "https://app.aulakit.com",      // Subdominio de la app en producción
  process.env.FRONTEND_URL        // URL dinámica configurable en variables de entorno
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (ej: curl, Postman, llamadas internas de servidor a servidor)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Acceso bloqueado por política de CORS para el origen: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));

// 3. Middlewares de parsing y Rate Limiting Global
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api", globalLimiter);

// 4. Main Router API
app.use("/api", apiRouter);

// Manejador de errores global (incluyendo CORS)
app.use((err, _req, res, _next) => {
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({ error: err.message });
  }
  console.error("Error no controlado:", err);
  return res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});