require('dotenv').config()
const express = require('express')
const cors = require('cors')

const clientRoutes   = require('./routes/clients')
const eventRoutes    = require('./routes/events')
const quoteRoutes    = require('./routes/quotes')
const supplierRoutes = require('./routes/suppliers')

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/clients',   clientRoutes)
app.use('/api/events',    eventRoutes)
app.use('/api/quotes',    quoteRoutes)
app.use('/api/suppliers', supplierRoutes)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`))