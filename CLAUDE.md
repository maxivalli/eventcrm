# CLAUDE.md — EventCRM (Haus-CRM)

## Descripción del proyecto

CRM para gestión de eventos de producción ("Haus"). Aplicación fullstack con autenticación JWT, separada en dos servicios independientes: `backend/` y `frontend/`.

---

## Arquitectura

```
eventcrm-main/
├── backend/          # Node.js + Express 5 + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── index.js              # Entry point, registra rutas y middlewares
│       ├── prisma.js             # Singleton PrismaClient
│       ├── seed.js               # Crea usuario admin por defecto
│       ├── cloudinary.js         # Config Cloudinary para uploads
│       ├── upload.js             # Multer + Cloudinary storage
│       ├── controllers/          # Lógica de negocio (un archivo por entidad)
│       ├── routes/               # Definición de rutas (un archivo por entidad)
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
            ├── Catering.jsx     # Gestión de insumos de catering por evento
            ├── Recetario.jsx    # CRUD de platos con ingredientes
            └── Users.jsx
```

---

## Stack tecnológico

### Backend
- **Runtime**: Node.js (CommonJS `require`)
- **Framework**: Express 5
- **ORM**: Prisma 5 con PostgreSQL (`pg`)
- **Auth**: JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **Uploads**: Multer + Cloudinary v1
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
| `Client` | tiene muchos `Event` |
| `Event` | pertenece a `Client`; tiene `Quote[]`, `Payment[]`, `SupplierPayment[]`, `ChecklistItem[]`, `EventFile[]`, `CateringItem[]`, `EventMenuSection[]` |
| `Quote` | pertenece a `Event`; tiene `QuoteItem[]`, `QuoteDish[]`; campos: `kind`, `status`, `menu`, `covers`, `pricePerCover` |
| `QuoteItem` | pertenece a `Quote`; campos: `description`, `quantity`, `unitPrice` |
| `QuoteDish` | pertenece a `Quote` y a `Dish`; campos: `nota` |
| `Payment` | pertenece a `Event` (cobros al cliente) |
| `Supplier` | tiene `SupplierPayment[]`, `CateringItem[]`; campos: `category`, `rating`, `status`, `alias` |
| `SupplierPayment` | pertenece a `Supplier` y a `Event`; campos: `method`, `status` |
| `ChecklistItem` | pertenece a `Event`; campos: `title`, `done`, `order` |
| `EventFile` | pertenece a `Event`; campos: `name`, `url`, `publicId`, `resourceType` |
| `CateringItem` | pertenece a `Event` y opcionalmente a `Supplier`; campos: `categoria`, `descripcion`, `cantidad`, `unidad`, `precioUnitario`, `proveedorLibre`, `nota` |
| `Dish` | tiene `DishIngredient[]`, `EventMenuItem[]`, `QuoteDish[]`; campos: `name`, `seccion`, `descripcion` |
| `DishIngredient` | pertenece a `Dish`; campos: `nombre`, `cantidad` (por persona), `unidad`, `categoria` |
| `EventMenuSection` | pertenece a `Event`; tiene `EventMenuItem[]`; campos: `nombre`, `orden` |
| `EventMenuItem` | pertenece a `EventMenuSection` y a `Dish`; campos: `nota` |
| `ActivityLog` | Independiente; campos: `action`, `entity`, `entityId`, `label`, `detail`, `meta` (JSON string) |

---

## Variables de entorno

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=tu_secreto_jwt
CORS_ORIGIN=http://localhost:5173          # o URL del frontend en prod
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ANTHROPIC_API_KEY=...                      # Para sugerencia de ingredientes con IA
PORT=3001                                  # opcional, default 3001
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:3001         # o URL del backend en prod
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
npm run build        # build para producción
npm run lint         # eslint

# Base de datos
cd backend
npx prisma generate                # generar cliente
npx prisma migrate dev             # aplicar migraciones en desarrollo
npx prisma migrate deploy          # aplicar en producción
node src/seed.js                   # crear usuario admin (admin@eventcrm.com / admin123)
npx prisma studio                  # GUI para explorar DB
```

---

## Rutas de la API

Todas las rutas (excepto auth) requieren `Authorization: Bearer <token>`.

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
| GET/POST/PUT/DELETE | `/api/catering` | Insumos de catering por evento |
| GET/POST/PUT/DELETE | `/api/dishes` | Platos del recetario |
| GET/POST/PUT/DELETE | `/api/menu` | Secciones e ítems del menú por evento |
| GET | `/api/activity` | Log de actividad (`?limit=N`, max 200) |
| POST | `/api/ai/suggest-ingredients` | Sugerir ingredientes de un plato con IA (Claude Haiku) |

**Health check**: `GET /health` → `{ status: "ok" }`

---

## Patrones de código establecidos

### Backend — Controllers
Todos los controllers siguen este patrón. Mantenerlo siempre:
```js
exports.create = async (req, res) => {
  try {
    // 1. Desestructurar body
    // 2. Validaciones con early return y mensaje en español
    // 3. Operación Prisma
    // 4. Responder con res.status(201).json(result)
  } catch (e) {
    console.error('Error [acción] [entidad]:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'No encontrado' })
    res.status(500).json({ error: e.message })
  }
}
```

Errores Prisma comunes:
- `P2025` → Registro no encontrado (404)
- `P2002` → Violación de unique constraint (400)

Fechas: siempre normalizar con `new Date(\`${date.slice(0,10)}T12:00:00\`)` para evitar problemas de timezone.

### Backend — Rutas
```js
const router = require('express').Router()
const ctrl = require('../controllers/entidad')
router.get('/', ctrl.getAll)
router.post('/', ctrl.create)
router.get('/:id', ctrl.getOne)
router.put('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)
module.exports = router
```

Registrar en `src/index.js` como:
```js
app.use('/api/nueva-entidad', authMiddleware, nuevaRuta)
```

### Frontend — Páginas
Cada página es autónoma y sigue este patrón:
```jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

export default function MiPagina() {
  const { showToast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/api/entidad')
      setData(res.data)
    } catch { showToast('Error al cargar datos', 'error') }
    finally { setLoading(false) }
  }
  // ...
}
```

### Frontend — Estilos
- **Sin Tailwind, sin CSS modules**. Usar inline styles + variables CSS.
- Variables disponibles: `var(--bg-base)`, `var(--bg-surface)`, `var(--bg-sunken)`, `var(--border)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`, `var(--text-label)`, `var(--gold)`, `var(--gold-light)`, `var(--gold-bg)`
- Siempre usar variables CSS para que el tema dark/light funcione automáticamente.
- Fuente base: `'DM Sans', sans-serif`; títulos elegantes: `'Playfair Display', serif`

### Frontend — Formateo de datos
```js
// Moneda en ARS
const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0)

// Fecha en español
const fmtDate = (str) =>
  new Date(str).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
```

---

## Estados de las entidades (valores permitidos)

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

// DishIngredient.categoria
["Carnes", "Fiambres", "Lácteos", "Verduras", "Frutas", "Almacén", "Bebidas", "Panificados", "Otros"]

// ActivityLog.action
["create", "update", "delete", "status", "payment", "file", "checklist"]

// ActivityLog.entity
["client", "event", "quote", "supplier", "payment", "supplierPayment", "file", "checklist", "dish"]
```

---

## Integración con IA (Anthropic)

El endpoint `POST /api/ai/suggest-ingredients` usa **Claude Haiku** para generar ingredientes por persona dado un plato del recetario.

- Requiere `ANTHROPIC_API_KEY` en el `.env` del backend.
- Llama directamente a `https://api.anthropic.com/v1/messages`.
- Devuelve `{ ingredients: DishIngredient[] }`.
- El frontend lo usa en `Recetario.jsx` al crear/editar un plato con el botón "Sugerir con IA".

---

## Log de actividad

El módulo `src/utils/activity.js` exporta una función `log()` que persiste acciones en `ActivityLog`. Se llama **fire-and-forget** (no bloquea la respuesta) desde los controllers.

```js
const { log } = require('../utils/activity')

log({
  action: 'create',       // tipo de acción
  entity: 'event',        // entidad afectada
  entityId: event.id,
  label: event.name,      // descripción legible
  detail: 'Propuesta',    // detalle secundario (opcional)
  meta: { clientId }      // datos extra en objeto (opcional, se serializa a JSON)
})
```

El Dashboard consulta `GET /api/activity` para mostrar el feed de actividad reciente.

---

## Autenticación

- El backend genera un JWT firmado con `JWT_SECRET` al hacer login.
- El frontend lo guarda en `localStorage` bajo la key `"token"` (y `"user"` para datos del usuario).
- `api/axios.js` inyecta el token automáticamente en cada request.
- Si el backend responde 401, el interceptor limpia localStorage y redirige a `/login`.
- El middleware `src/middleware/auth.js` valida el token en todas las rutas protegidas.

---

## Usuarios por defecto (seed)

```
Email:    admin@eventcrm.com
Password: admin123
```

Ejecutar `node src/seed.js` para crearlo. Usa `upsert` para ser idempotente.

---

## Despliegue (Railway)

- El frontend tiene `frontend/railway.toml` configurado.
- Backend: el script `start` en `package.json` corre `prisma generate && prisma migrate deploy && seed && node src/index.js`.
- Variables de entorno configuradas en Railway para cada servicio.
- CORS: el backend acepta el origen configurado en `CORS_ORIGIN`.

---

## Convenciones importantes

1. **Idioma**: Todo el código, mensajes de error y UI están en **español**.
2. **Módulos**: Backend usa CommonJS (`require`/`module.exports`). Frontend usa ESM (`import`/`export`).
3. **Cascada**: Las relaciones en Prisma usan `onDelete: Cascade`, por lo que eliminar un `Event` elimina sus `Quote`, `Payment`, `SupplierPayment`, `ChecklistItem`, `EventFile`, `CateringItem` y `EventMenuSection` automáticamente.
4. **IDs**: Siempre convertir a `Number()` al usar IDs de params (`req.params.id`).
5. **Validaciones**: Hacer en controller (backend) y en el formulario (frontend) con mensajes claros.
6. **Cloudinary**: Los archivos subidos se almacenan en Cloudinary. Al eliminar un `EventFile`, también eliminar el asset de Cloudinary usando `publicId`.
7. **Toast**: Usar `useToast()` para feedback de acciones. Nunca usar `alert()`.
8. **ConfirmDialog**: Usar para confirmar eliminaciones. Nunca eliminar directamente sin confirmación.
9. **ActivityLog**: Registrar acciones relevantes (create, update, delete, status, payment) usando `log()` de `src/utils/activity.js`. Llamar fire-and-forget, nunca `await`.
10. **Supplier.alias**: Campo opcional para nombre corto del proveedor. Mostrarlo en la UI cuando esté disponible.
