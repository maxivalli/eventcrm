# CLAUDE.md — Haus-CRM

## Descripción del proyecto

CRM para gestión integral de eventos de producción (empresa "Haus"). Aplicación fullstack con autenticación JWT, separada en dos servicios independientes: `backend/` y `frontend/`. Incluye integración con WhatsApp vía Evolution API para mensajes automáticos y manuales a clientes.

---

## Arquitectura

```
eventcrm-main/
├── backend/          # Node.js + Express 5 + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── data/
│   │   └── templates.json        # Plantillas de WhatsApp persistidas en disco
│   └── src/
│       ├── index.js              # Entry point, registra rutas, middlewares y cron
│       ├── prisma.js             # Singleton PrismaClient
│       ├── seed.js               # Crea usuario admin por defecto
│       ├── cloudinary.js         # Config Cloudinary para uploads
│       ├── upload.js             # Multer + Cloudinary storage
│       ├── controllers/          # Lógica de negocio (un archivo por entidad)
│       ├── routes/               # Definición de rutas (un archivo por entidad)
│       ├── services/
│       │   ├── evolution.js      # Cliente HTTP para Evolution API (WhatsApp)
│       │   ├── templates.js      # CRUD de plantillas de mensajes (JSON en disco)
│       │   └── cron.js           # Cron job diario 09:00 — mensajes automáticos
│       └── middleware/
│           └── auth.js           # JWT verify middleware
└── frontend/         # React 19 + Vite 7 + React Router 7
    └── src/
        ├── App.jsx               # Router principal con rutas protegidas
        ├── main.jsx
        ├── index.css             # Variables CSS globales (temas dark/light)
        ├── api/
        │   └── axios.js          # Instancia axios con interceptors JWT
        ├── components/
        │   ├── Layout.jsx        # Sidebar + Outlet
        │   ├── Checklist.jsx     # Checklist por evento
        │   ├── EventFiles.jsx    # Gestión de archivos por evento
        │   ├── ConfirmDialog.jsx # Modal de confirmación reutilizable
        │   └── Toast.jsx         # Sistema de notificaciones (hook useToast)
        ├── contexts/
        │   └── ThemeContext.jsx  # Contexto dark/light mode
        └── pages/
            ├── Dashboard.jsx
            ├── Login.jsx
            ├── Clients.jsx
            ├── Events.jsx
            ├── Quotes.jsx
            ├── Suppliers.jsx
            ├── Payments.jsx
            ├── SupplierPayments.jsx
            ├── Budget.jsx
            ├── Catering.jsx
            ├── Recetario.jsx
            ├── Contacts.jsx      # Agenda de contactos independiente
            ├── Users.jsx
            └── WhatsApp.jsx      # Configuración y envío de mensajes WhatsApp
```

---

## Stack tecnológico

### Backend
- **Runtime**: Node.js (CommonJS `require`)
- **Framework**: Express 5
- **ORM**: Prisma 5 con PostgreSQL (`pg`)
- **Auth**: JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **Uploads**: Multer + Cloudinary v1
- **WhatsApp**: Evolution API v1.8.7 (via HTTP)
- **Dev**: Nodemon

### Frontend
- **Framework**: React 19 (ESM `import`)
- **Build**: Vite 7
- **Router**: React Router 7
- **HTTP**: Axios con interceptors
- **UI**: Inline styles + variables CSS (sin framework de UI externo)
- **Iconos**: Lucide React
- **Charts**: Recharts

---

## Modelos de base de datos (Prisma)

| Modelo | Relaciones clave |
|---|---|
| `User` | Independiente (gestión de acceso) |
| `Client` | tiene muchos `Event`; campos: `birthdate` (para cron de cumpleaños) |
| `Event` | pertenece a `Client`; tiene `Quote[]`, `Payment[]`, `SupplierPayment[]`, `ChecklistItem[]`, `EventFile[]`, `CateringItem[]`, `EventMenuSection[]` |
| `Quote` | pertenece a `Event`; tiene `QuoteItem[]`, `QuoteDish[]` |
| `QuoteItem` | pertenece a `Quote` |
| `QuoteDish` | pertenece a `Quote` y a `Dish` |
| `Payment` | pertenece a `Event` (cobros al cliente) |
| `Supplier` | tiene `SupplierPayment[]`, `CateringItem[]` |
| `SupplierPayment` | pertenece a `Supplier` y a `Event` |
| `ChecklistItem` | pertenece a `Event` |
| `EventFile` | pertenece a `Event` |
| `CateringItem` | pertenece a `Event` y opcionalmente a `Supplier` |
| `Dish` | tiene `DishIngredient[]`, `EventMenuItem[]`, `QuoteDish[]` |
| `DishIngredient` | pertenece a `Dish`; campos: `cantidad` (por persona), `unidad`, `categoria` |
| `EventMenuSection` | pertenece a `Event`; tiene `EventMenuItem[]` |
| `EventMenuItem` | pertenece a `EventMenuSection` y a `Dish` |
| `Contact` | Independiente — agenda de contactos separada de clientes |
| `ActivityLog` | Independiente; campos: `action`, `entity`, `entityId`, `label`, `detail`, `meta` |

---

## Variables de entorno

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=tu_secreto_jwt
CORS_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ANTHROPIC_API_KEY=...                # Para sugerencia de ingredientes con IA
EVOLUTION_API_URL=https://...        # URL pública de Evolution API
EVOLUTION_API_KEY=...                # Global API Key de Evolution API
EVOLUTION_INSTANCE=haus-crm          # Nombre de la instancia (default: haus-crm)
PORT=3001
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:3001
```

---

## Comandos de desarrollo

```bash
# Backend
cd backend
npm install
npm run dev          # nodemon src/index.js

# Frontend
cd frontend
npm install
npm run dev          # vite dev server en :5173
npm run build
npm run lint

# Base de datos
cd backend
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
node src/seed.js     # crear usuario admin (admin@eventcrm.com / admin123)
npx prisma studio
```

---

## Rutas de la API

Todas las rutas (excepto `/api/auth`) requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login, retorna JWT |
| GET/POST | `/api/clients` | Listar / crear clientes |
| GET/PUT/DELETE | `/api/clients/:id` | Obtener / editar / eliminar |
| GET/POST | `/api/events` | Listar / crear eventos |
| GET/PUT/DELETE | `/api/events/:id` | Obtener / editar / eliminar |
| GET/POST | `/api/quotes` | Listar / crear cotizaciones |
| GET/PUT/DELETE | `/api/quotes/:id` | Obtener / editar / eliminar |
| GET/POST | `/api/suppliers` | Listar / crear proveedores |
| GET/PUT/DELETE | `/api/suppliers/:id` | Obtener / editar / eliminar |
| GET/POST | `/api/payments` | Cobros al cliente |
| GET/POST | `/api/supplier-payments` | Pagos a proveedores |
| GET/POST | `/api/checklist` | Items de checklist |
| PUT/DELETE | `/api/checklist/:id` | Editar / eliminar item |
| GET/POST | `/api/event-files` | Archivos por evento |
| DELETE | `/api/event-files/:id` | Eliminar archivo |
| GET/POST | `/api/users` | Usuarios del sistema |
| PUT/DELETE | `/api/users/:id` | Editar / eliminar usuario |
| GET/POST/PUT/DELETE | `/api/catering` | Insumos de catering |
| GET/POST/PUT/DELETE | `/api/dishes` | Platos del recetario |
| GET/POST/PUT/DELETE | `/api/menu` | Menú por evento |
| GET/POST/PUT/DELETE | `/api/contacts` | Agenda de contactos |
| DELETE | `/api/contacts/all` | Eliminar todos los contactos |
| GET | `/api/activity` | Log de actividad |
| POST | `/api/ai/suggest-ingredients` | Sugerir ingredientes con IA |
| GET | `/api/whatsapp/status` | Estado de la instancia WhatsApp |
| GET | `/api/whatsapp/qr` | Obtener QR para vincular |
| POST | `/api/whatsapp/instance` | Crear instancia Evolution API |
| GET | `/api/whatsapp/templates` | Listar plantillas de mensajes |
| PUT | `/api/whatsapp/templates/:id` | Actualizar plantilla |
| GET | `/api/whatsapp/templates/preview` | Preview renderizado de plantilla |
| POST | `/api/whatsapp/send/event/:eventId` | Enviar mensaje a cliente de un evento |
| POST | `/api/whatsapp/send/client/:clientId` | Enviar mensaje a un cliente |
| POST | `/api/whatsapp/jobs/:jobId/run` | Ejecutar cron job manualmente |

**Health check**: `GET /health` → `{ status: "ok" }`

---

## Integración WhatsApp (Evolution API)

### Servicios (`src/services/`)

**`evolution.js`** — cliente HTTP para Evolution API v1.8.7:
- `sendText(phone, text)` — envía mensaje. Normaliza teléfonos argentinos automáticamente.
- `getInstanceStatus()` — estado de conexión. Devuelve `{ instance: { state } }` en v1.8.7.
- `getQRCode()` — QR para vincular. El base64 está en `data.base64` en v1.8.7.
- `createInstance()` — crea la instancia en Evolution API.
- `normalizePhone(phone)` — convierte a formato `549XXXXXXXXXX`.

**`templates.js`** — plantillas persistidas en `data/templates.json`:
- IDs fijos: `reminder`, `thanks`, `birthday`
- Variables disponibles: `{{nombre}}`, `{{evento}}`, `{{lugar}}`, `{{fecha}}`
- El archivo JSON tiene prioridad sobre los defaults del código.
- Si se editan desde la UI, se persisten en disco automáticamente.

**`cron.js`** — cron job diario a las 09:00:
- `jobDayBefore()` — eventos confirmados mañana → plantilla `reminder`
- `jobDayAfter()` — eventos de ayer confirmados/realizados → plantilla `thanks`
- `jobBirthday()` — clientes con cumpleaños en 30 días → plantilla `birthday`
- Solo arranca si `EVOLUTION_API_URL` y `EVOLUTION_API_KEY` están configuradas.
- Se puede disparar manualmente con `POST /api/whatsapp/jobs/:jobId/run`.

### Formato de mensajes (v1.8.7)
```js
// Body correcto para v1.8.7
{ number: '549XXXXXXXXXX', textMessage: { text: 'mensaje' } }
// NO usar: { number, text }
```

### Estado de conexión (v1.8.7)
```js
// La respuesta de /instance/connectionState/:instance es:
{ instance: { instanceName: '...', state: 'open' } }
// El estado conectado es state === 'open'
```

---

## Agenda de contactos (`Contact`)

Entidad independiente, separada de `Client`. No tiene relación con eventos.

- Importación masiva desde archivos `.vcf` / `.vcard` con parser propio.
- Detección de duplicados por email, teléfono (solo dígitos) y nombre.
- Selección múltiple con checkboxes + barra flotante para eliminar seleccionados.
- El checkbox del header selecciona/deselecciona solo los contactos visibles en el filtro.
- La selección se limpia automáticamente al cambiar el término de búsqueda.

---

## Patrones de código establecidos

### Backend — Controllers
```js
exports.create = async (req, res) => {
  try {
    // 1. Desestructurar body
    // 2. Validaciones con early return en español
    // 3. Operación Prisma
    // 4. res.status(201).json(result)
  } catch (e) {
    console.error('Error [acción] [entidad]:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'No encontrado' })
    res.status(500).json({ error: e.message })
  }
}
```

Fechas: siempre normalizar con `new Date(\`${date.slice(0,10)}T12:00:00\`)`.

### Frontend — Estilos
- Sin Tailwind, sin CSS modules. Usar inline styles + variables CSS.
- Variables: `var(--bg-base)`, `var(--bg-surface)`, `var(--bg-sunken)`, `var(--border)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`, `var(--text-label)`, `var(--gold)`, `var(--gold-light)`, `var(--gold-bg)`
- Fuente base: `'DM Sans', sans-serif`; títulos: `'Playfair Display', serif`
- Iconos: siempre usar Lucide React. No usar emojis como iconos de UI.

### Frontend — Formateo
```js
const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0)

const fmtDate = (str) =>
  new Date(str).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
```

---

## Estados de las entidades

```js
// Event.status
["Propuesta", "Confirmado", "En producción", "Finalizado"]

// Event.type
["Corporativo", "Cultural", "Social"]

// Quote.status
["Pendiente", "Aprobado", "Rechazado", "Revisión"]

// Quote.kind
["General", "Catering", "Audiovisual", "Decoración", "Otros"]

// Client.status / Supplier.status
["Activo", "Inactivo"]

// SupplierPayment.method
["Efectivo", "Transferencia", "Cheque", "Tarjeta"]

// SupplierPayment.status
["Pendiente", "Pagado", "Cancelado"]

// WhatsApp template triggers
["day_before", "day_after", "birthday_30days"]
```

---

## Convenciones importantes

1. **Idioma**: Todo el código, mensajes y UI en **español**.
2. **Módulos**: Backend CommonJS (`require`). Frontend ESM (`import`).
3. **Cascada**: `onDelete: Cascade` en todas las relaciones Prisma.
4. **IDs**: Siempre `Number(req.params.id)` al usar params.
5. **Toast**: `useToast()` para feedback. Nunca `alert()`.
6. **ConfirmDialog**: Para toda eliminación. Nunca eliminar sin confirmación.
7. **ActivityLog**: Fire-and-forget con `log()`. Nunca `await log()`.
8. **Iconos**: Lucide React en toda la UI. No emojis como iconos.
9. **WhatsApp body v1.8.7**: Usar `textMessage: { text }`, no `text` directo.
10. **Teléfonos**: Normalizar a `549XXXXXXXXXX` antes de enviar a Evolution API.

---

## Despliegue (Railway)

Tres servicios en Railway:
- **Backend** — Node.js. Script `start`: `prisma generate && prisma migrate deploy && node src/seed.js; node src/index.js`
- **Frontend** — Vite build. Config en `frontend/railway.toml`. Variable `VITE_API_URL`.
- **Evolution API** — Docker image `atendai/evolution-api:v1.8.7`. Variables: `SERVER_URL`, `AUTHENTICATION_API_KEY`, `AUTHENTICATION_TYPE=apikey`, `DATABASE_ENABLED=true`, `DATABASE_PROVIDER=sqlite`.

---

## Usuario por defecto

```
Email:    admin@eventcrm.com
Password: admin123
```
