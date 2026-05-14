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
const requireRole    = require("./middleware/requireRole");
const adminOnly      = requireRole('admin')
const notReadonly    = requireRole('admin', 'staff')

// Bloquea POST/PUT/PATCH/DELETE para usuarios readonly (GET sigue permitido)
const blockWrites = (req, res, next) => {
  if (req.user?.role === 'readonly' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method))
    return res.status(403).json({ error: 'Sin permiso para realizar esta acción' })
  next()
}
const userRoutes = require("./routes/users");
const checklistRoutes  = require('./routes/checklist')
const eventFileRoutes  = require('./routes/eventFiles')
const menusRoutes      = require('./routes/menus')
const dishRoutes       = require('./routes/dishes')
const cateringRoutes   = require('./routes/catering')
const eventMenuRoutes  = require('./routes/eventMenu')
const aiRoutes         = require('./routes/ai')
const aiPublicRoutes   = require('./routes/ai-public')
const activityRoutes   = require('./routes/activity-route')
const contactRoutes    = require('./routes/contacts')
const whatsappRoutes   = require('./routes/whatsapp')
const { publicRouter: portalPublic, protectedRouter: portalProtected } = require('./routes/portal')
const { publicRouter: guestPublic, protectedRouter: guestProtected } = require('./routes/guests')
const { publicRouter: portalQueriesPublic, protectedRouter: portalQueriesProtected } = require('./routes/portalQueries')
const { publicRouter: guestPortalPublic, protectedRouter: guestPortalProtected } = require('./routes/guestPortal')
const scheduleRoutes       = require('./routes/schedule')
const landingRoutes    = require('./routes/landing')
const cron             = require('./services/cron')

const app = express();

// Confiar en el proxy de Railway (necesario para express-rate-limit)
app.set('trust proxy', 1)

// Seguridad — headers HTTP
app.use(helmet())

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(',').map(o => o.trim())

app.use(
  cors({
    origin: (origin, cb) => {
      // permitir requests sin origin (curl, Postman, SSR) y orígenes en la lista
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
      cb(new Error('Not allowed by CORS'))
    },
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
app.use('/api/public', landingRoutes);  // rutas públicas para la landing
app.use("/api", portalPublic);   // GET /api/portal/:token — sin auth
app.use('/api', guestPublic);         // GET /api/checkin/:token + PATCH .../ingreso — sin auth
app.use('/api', guestPortalPublic);   // GET /api/guest-portal/:token + POST .../rsvp — sin auth

// Rutas protegidas
app.use("/api/clients",           authMiddleware, blockWrites, clientRoutes);
app.use("/api/events",            authMiddleware, blockWrites, eventRoutes);
app.use("/api/quotes",            authMiddleware, blockWrites, quoteRoutes);
app.use("/api/suppliers",         authMiddleware, blockWrites, supplierRoutes);
app.use("/api/payments",          authMiddleware, notReadonly,  paymentRoutes);
app.use("/api/supplier-payments", authMiddleware, notReadonly,  supplierPaymentRoutes);
app.use("/api/users",             authMiddleware, adminOnly,    userRoutes);
app.use('/api/checklist',         authMiddleware, blockWrites,  checklistRoutes)
app.use('/api/event-files',       authMiddleware, blockWrites,  eventFileRoutes)
app.use('/api/menus',             authMiddleware, blockWrites,  menusRoutes)
app.use('/api/dishes',            authMiddleware, blockWrites,  dishRoutes)
app.use('/api/catering',          authMiddleware, blockWrites,  cateringRoutes)
app.use('/api/event-menu',        authMiddleware, blockWrites,  eventMenuRoutes)
app.use('/api/ai',                portalLimiter,  aiPublicRoutes)  // rutas públicas (portal cliente)
app.use('/api/ai',                aiLimiter, authMiddleware, blockWrites, aiRoutes)
app.use('/api/portal-queries',    portalLimiter,  portalQueriesPublic)
app.use('/api/portal-queries',    authMiddleware, portalQueriesProtected)
app.use('/api/schedule',          authMiddleware, blockWrites,  scheduleRoutes)
app.use('/api/activity',          authMiddleware, activityRoutes)
app.use('/api/contacts',          authMiddleware, blockWrites,  contactRoutes)
app.use('/api/whatsapp',          authMiddleware, blockWrites,  whatsappRoutes)
app.use('/api',                   authMiddleware, blockWrites,  portalProtected)
app.use('/api',                   authMiddleware, blockWrites,  guestProtected)
app.use('/api',                   authMiddleware, blockWrites,  guestPortalProtected)

async function start() {
  // Correr migraciones antes de levantar el servidor
  try {
    const { execSync } = require('child_process')
    console.log('[Migrations] Aplicando migraciones...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit', timeout: 30000 })
    console.log('[Migrations] OK')
  } catch (e) {
    console.error('[Migrations] Error:', e.message)
  }

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
}

start()