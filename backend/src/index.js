require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const clientRoutes = require("./routes/clients");
const eventRoutes = require("./routes/events");
const quoteRoutes = require("./routes/quotes");
const supplierRoutes = require("./routes/suppliers");
const paymentRoutes = require("./routes/payments");
const supplierPaymentRoutes = require("./routes/supplierPayments");
const authMiddleware = require("./middleware/auth");
const userRoutes = require("./routes/users");
const checklistRoutes = require('./routes/checklist')
const eventFileRoutes = require('./routes/eventFiles')

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Rutas públicas
app.use("/api/auth", authRoutes);

// Rutas protegidas
app.use("/api/clients", authMiddleware, clientRoutes);
app.use("/api/events", authMiddleware, eventRoutes);
app.use("/api/quotes", authMiddleware, quoteRoutes);
app.use("/api/suppliers", authMiddleware, supplierRoutes);
app.use("/api/payments", authMiddleware, paymentRoutes);
app.use("/api/supplier-payments", authMiddleware, supplierPaymentRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use('/api/checklist', authMiddleware, checklistRoutes)
app.use('/api/event-files', authMiddleware, eventFileRoutes)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`Backend corriendo en http://localhost:${PORT}`),
);
