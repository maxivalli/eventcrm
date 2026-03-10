require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const clientRoutes = require("./routes/clients");
const eventRoutes = require("./routes/events");
const quoteRoutes = require("./routes/quotes");
const supplierRoutes = require("./routes/suppliers");
const paymentRoutes = require("./routes/payments");
const supplierPaymentRoutes = require("./routes/supplierPayments");
const authMiddleware = require("./middleware/auth");
const userRoutes = require("./routes/users");
const checklistRoutes  = require('./routes/checklist')
const eventFileRoutes  = require('./routes/eventFiles')
const cateringRoutes   = require('./routes/catering')
const dishRoutes       = require('./routes/dishes')
const eventMenuRoutes  = require('./routes/eventMenu')
const aiRoutes         = require('./routes/ai')
const aiPublicRoutes   = require('./routes/ai-public')
const activityRoutes   = require('./routes/activity-route')
const contactRoutes    = require('./routes/contacts')
const whatsappRoutes   = require('./routes/whatsapp')
const { publicRouter: portalPublic, protectedRouter: portalProtected } = require('./routes/portal')
const portalQueriesRoutes  = require('./routes/portalQueries')
const scheduleRoutes       = require('./routes/schedule')
const cron             = require('./services/cron')

const app = express();

// Seguridad — headers HTTP
app.use(helmet())

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: { error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  message: { error: 'Demasiadas solicitudes a la IA. Esperá un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
})
const portalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  message: { error: 'Demasiadas solicitudes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Rutas públicas
app.use("/api/auth/login", loginLimiter)
app.use("/api/auth", authRoutes);
app.use("/api/portal", portalLimiter)
app.use("/api", portalPublic);   // GET /api/portal/:token — sin auth

// Rutas protegidas
app.use("/api/clients", authMiddleware, clientRoutes);
app.use("/api/events", authMiddleware, eventRoutes);
app.use("/api/quotes", authMiddleware, quoteRoutes);
app.use("/api/suppliers", authMiddleware, supplierRoutes);
app.use("/api/payments", authMiddleware, paymentRoutes);
app.use("/api/supplier-payments", authMiddleware, supplierPaymentRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use('/api/checklist',    authMiddleware, checklistRoutes)
app.use('/api/event-files', authMiddleware, eventFileRoutes)
app.use('/api/catering',    authMiddleware, cateringRoutes)
app.use('/api/dishes',      authMiddleware, dishRoutes)
app.use('/api/menu',        authMiddleware, eventMenuRoutes)
app.use('/api/ai',          portalLimiter, aiPublicRoutes)  // rutas públicas (portal cliente)
app.use('/api/ai',          aiLimiter, authMiddleware, aiRoutes)
app.use('/api/portal-queries', portalLimiter, portalQueriesRoutes)
app.use('/api/schedule',       authMiddleware, scheduleRoutes)
app.use('/api/activity',    authMiddleware, activityRoutes)
app.use('/api/contacts',   authMiddleware, contactRoutes)
app.use('/api/whatsapp',   authMiddleware, whatsappRoutes)
app.use('/api',            authMiddleware, portalProtected)  // POST /api/events/:id/portal-token

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`)
  if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
    cron.start()
  } else {
    console.log('[WhatsApp Cron] Desactivado — configurá EVOLUTION_API_URL y EVOLUTION_API_KEY')
  }
  // Auto-seed: crea el usuario admin si no existe
  try {
    const { main: seed } = require('./seed')
    await seed()
    console.log('[Seed] Usuario admin verificado')
  } catch (e) {
    console.error('[Seed] Error:', e.message)
  }
})