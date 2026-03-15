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
        ├── App.jsx               # Router principal con rutas protegidas + ruta pública /portal/:token
        ├── main.jsx
        ├── index.css             # Variables CSS globales (temas dark/light)
        ├── api/
        │   └── axios.js          # Instancia axios con interceptors JWT
        ├── utils/
        │   └── eventUtils.jsx    # Constantes, formatters y componentes compartidos de eventos
        │                         # (statusColors, typeColors, DIETARY_OPTIONS, WEATHER_CODES, fmt, Badge, BalanceBar...)
        ├── components/
        │   ├── Layout.jsx        # Sidebar + Outlet
        │   ├── Checklist.jsx     # Checklist por evento
        │   ├── Cronograma.jsx    # Timeline del evento
        │   ├── EventFiles.jsx    # Gestión de archivos por evento
        │   ├── DatePicker.jsx    # Calendario selector de fecha reutilizable
        │   ├── EventForm.jsx     # Formulario crear/editar evento
        │   ├── ConfirmDialog.jsx # Modal de confirmación reutilizable
        │   ├── Toast.jsx         # Sistema de notificaciones (hook useToast)
        │   ├── dashboard/        # Componentes del Dashboard
        │   │   ├── dashboardUtils.jsx  # Constantes, formatters y componentes UI del dashboard
        │   │   ├── ResumenTab.jsx      # Tab operativo diario
        │   │   ├── FinanzasTab.jsx     # Tab analítica financiera (Recharts)
        │   │   └── CalendarioTab.jsx   # Tab calendario anual con mini-meses
        │   └── events/           # Componentes del modal de eventos
        │       ├── EventDetail.jsx     # Modal completo del evento (tabs: Info, Servicios, Finanzas, Invitados)
        │       └── QuoteDetailCard.jsx # Tarjeta de detalle de cotización
        ├── contexts/
        │   └── ThemeContext.jsx  # Contexto dark/light mode
        └── pages/
            ├── Dashboard.jsx         # Shell del dashboard (fetch + tab switcher)
            ├── Login.jsx
            ├── Clients.jsx
            ├── Events.jsx            # Lista de eventos + filtros/ordenamiento
            ├── Quotes.jsx
            ├── Suppliers.jsx
            ├── Payments.jsx
            ├── SupplierPayments.jsx
            ├── Budget.jsx
            ├── Catering.jsx          # Gestión de insumos de catering por evento
            ├── Recetario.jsx         # CRUD de platos con ingredientes
            ├── Contacts.jsx          # Agenda de contactos independiente
            ├── WhatsApp.jsx          # Automatizaciones de WhatsApp con Evolution API
            ├── ClientPortal.jsx      # Portal público para clientes (sin auth)
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
- **Iconos**: Lucide React (nunca emojis como íconos de UI)
- **Charts**: Recharts

---

## Modelos de base de datos (Prisma)

| Modelo | Relaciones clave |
|---|---|
| `User` | Independiente (gestión de acceso) |
| `Client` | tiene muchos `Event`; status default `'Inactivo'`, se activa automáticamente al crear evento |
| `Event` | pertenece a `Client`; tiene `Quote[]`, `Payment[]`, `SupplierPayment[]`, `ChecklistItem[]`, `EventFile[]`, `CateringItem[]`, `EventMenuSection[]`; campo `portalToken` UUID único para portal público |
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
| `QuoteMenu` | join entre `Quote` y `Menu` (cotizaciones tipo Catering) |
| `Menu` | tiene `MenuSection[]`; campos: `name` |
| `MenuSection` | pertenece a `Menu`; tiene `MenuItem[]`; campos: `nombre`, `orden` |
| `MenuItem` | pertenece a `MenuSection` y a `Dish`; campos: `nota` |
| `ScheduleItem` | pertenece a `Event`; campos: `time`, `description`, `duration`, `order` |
| `PortalQuery` | pertenece a `Event`; campos: `question`, `status` (`pending`/`resolved`), `createdAt` |
| `ActivityLog` | Independiente; campos: `action`, `entity`, `entityId`, `label`, `detail`, `meta` (JSON string) |
| `Contact` | Independiente; campos: `name`, `phone`, `email` |

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
ANTHROPIC_API_KEY=...
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE=...
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
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Base de datos
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
node src/seed.js
npx prisma studio
```

---

## Rutas de la API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | ❌ | Login, retorna JWT |
| GET | `/api/portal/:token` | ❌ | Portal público del cliente |
| POST | `/api/events/:id/portal-token` | ✅ | Generar/regenerar token del portal |
| GET/POST | `/api/clients` | ✅ | Listar / crear clientes |
| GET/PUT/DELETE | `/api/clients/:id` | ✅ | Obtener / editar / eliminar |
| GET/POST | `/api/events` | ✅ | Listar / crear eventos |
| GET/PUT/DELETE | `/api/events/:id` | ✅ | Obtener / editar / eliminar |
| GET/POST | `/api/quotes` | ✅ | Cotizaciones |
| GET/POST | `/api/suppliers` | ✅ | Proveedores |
| GET/POST | `/api/payments` | ✅ | Cobros al cliente |
| GET/POST | `/api/supplier-payments` | ✅ | Pagos a proveedores |
| GET/POST | `/api/checklist` | ✅ | Items de checklist |
| GET/POST | `/api/event-files` | ✅ | Archivos por evento |
| GET/POST | `/api/users` | ✅ | Usuarios del sistema |
| GET/POST/PUT/DELETE | `/api/catering` | ✅ | Insumos de catering |
| GET/POST/PUT/DELETE | `/api/dishes` | ✅ | Platos del recetario |
| GET/POST/PUT/DELETE | `/api/event-menu` | ✅ | Menú por evento |
| GET/POST | `/api/schedule/event/:eventId` | ✅ | Cronograma por evento |
| GET | `/api/activity` | ✅ | Log de actividad |
| GET/POST/DELETE | `/api/contacts` | ✅ | Agenda de contactos |
| GET/POST/PUT/DELETE | `/api/menus` | ✅ | Menús reutilizables (para cotizaciones Catering) |
| GET | `/api/portal-queries` | ✅ | Listar consultas pendientes (protegido) |
| POST | `/api/portal-queries` | ❌ | Crear consulta desde el portal (público) |
| PATCH | `/api/portal-queries/:id/resolve` | ✅ | Marcar consulta como resuelta |
| GET | `/api/whatsapp/status` | ✅ | Estado de conexión Evolution API |
| GET | `/api/whatsapp/qr` | ✅ | QR code para vincular instancia |
| POST | `/api/whatsapp/instance` | ✅ | Crear instancia WhatsApp |
| GET/PUT | `/api/whatsapp/templates` | ✅ | Plantillas de mensajes automáticos |
| POST | `/api/whatsapp/send/event/:eventId` | ✅ | Enviar mensaje a cliente de un evento |
| POST | `/api/whatsapp/send/client/:clientId` | ✅ | Enviar mensaje a un cliente |
| POST | `/api/whatsapp/jobs/:jobId/run` | ✅ | Disparar cron job manualmente |
| POST | `/api/ai/suggest-ingredients` | ✅ | Sugerir ingredientes con IA |
| POST | `/api/ai/suggest-dish-info` | ✅ | Generar descripción de plato con IA |

**Health check**: `GET /health` → `{ status: "ok" }`

---

## Portal del cliente

Cada evento puede tener un portal público accesible sin login.

**Flujo:**
1. Detalle del evento → "🔗 Portal cliente" genera UUID único (`portalToken`)
2. Botón cambia a "Enviar por WA" (abre WhatsApp con el cliente prellenado) + "🔗" (copiar link)
3. El cliente accede a `/portal/:token` sin login

**Contenido:**
- Cuenta regresiva en tiempo real (días, horas, minutos, segundos)
- Datos del evento (fecha, hora, venue, tipo, invitados)
- Servicios contratados con desglose de precios (cotizaciones aprobadas)
  - Catering: precio base por cubierto + extras con precios individuales
  - General/otros: ítems con precios unitarios
- Menú del evento por secciones
- Estado de cuenta: barra de progreso + historial de pagos + saldo pendiente
- Datos de contacto de Haus

**Seguridad:** UUID v4 (128 bits). Regenerar para invalidar el link anterior.

**Archivos clave:**
- `backend/src/routes/portal.js` — `publicRouter` (GET sin auth) y `protectedRouter` (POST con auth)
- `frontend/src/pages/ClientPortal.jsx` — página sin Layout ni auth
- `frontend/src/App.jsx` — ruta `/portal/:token` fuera del bloque PrivateRoute

---

## WhatsApp (Evolution API v1.8.7)

```
EVOLUTION_API_URL  = https://evolution-api-production-xxxx.up.railway.app
EVOLUTION_API_KEY  = eventcrm_clave_secreta_2026
EVOLUTION_INSTANCE = eventcrm
```

**Quirks importantes:**
- Estado de conexión: `data.instance.state` (no `data.state`)
- Enviar mensaje: `{ number, textMessage: { text } }` (no `{ number, text }`)
- QR code: `data.base64`
- Requiere `CHECK_IS_CONTACT=false` en Evolution API o los envíos fallan

Cron en `backend/src/services/cron.js` — corre a las 09:00 todos los días.

---

## Integración con IA (Anthropic Claude Haiku)

| Endpoint | Input | Output |
|---|---|---|
| `POST /api/ai/suggest-ingredients` | `{ name, seccion }` | `{ ingredients: DishIngredient[] }` |
| `POST /api/ai/suggest-dish-info` | `{ name, ingredients, seccion }` | `{ descripcion }` |

**Contexto de prompts**: usar productos industrializados donde sea posible (tapas de empanada compradas, pasta fresca comprada, masa de tarta comprada). Solo from-scratch para rellenos, salsas y aderezos.

---

## Estados de las entidades

```js
// Event.status — "En producción" eliminado
["Propuesta", "Confirmado", "Finalizado"]

// Client.status — "Prospecto" eliminado, default "Inactivo"
["Activo", "Inactivo"]

// Secciones de menú/recetario — "Entrada fría" renombrado a "Entrada"
["Entrada", "Plato principal", "Guarnición", "Bebidas", "Postre", "Trasnoche", "Otros"]

// Quote.kind
["General", "Catering", "Audiovisual", "Decoración", "Otros"]

// Quote.status
["Pendiente", "Aprobado", "Rechazado", "Revisión"]

// SupplierPayment.method
["Efectivo", "Transferencia", "Cheque", "Tarjeta"]

// SupplierPayment.status
["Pendiente", "Pagado", "Cancelado"]
```

---

## Patrones de código

### Backend — Rutas con dos routers (patrón portal)
```js
const { Router } = require('express')
const publicRouter = Router()
const protectedRouter = Router()
module.exports = { publicRouter, protectedRouter }
```
En `index.js`:
```js
const { publicRouter: miPublic, protectedRouter: miProtected } = require('./routes/miRuta')
app.use('/api', miPublic)                    // sin auth — registrar ANTES del bloque protegido
app.use('/api', authMiddleware, miProtected) // con auth
```

### Frontend — Iconos
Siempre Lucide React. En `<option>` tags solo texto (no componentes React).

### Frontend — Páginas públicas
```jsx
// App.jsx — FUERA del PrivateRoute
<Route path="/portal/:token" element={<ClientPortal />} />
```
Usar `axios` directo (no `api/axios.js` que requiere token).

---

## Convenciones importantes

1. **Idioma**: Todo en **español** (código, UI, errores).
2. **Módulos**: Backend CommonJS, Frontend ESM.
3. **Cascada**: `onDelete: Cascade` en todas las relaciones de Event. No hacer deletes manuales de hijos antes de `event.delete()`.
4. **IDs**: Siempre `Number(req.params.id)`.
5. **Toast**: `useToast()`, nunca `alert()`.
6. **ConfirmDialog**: Para todas las eliminaciones.
7. **ActivityLog**: Fire-and-forget con `log()`, nunca `await`.
8. **Client.status**: Default `'Inactivo'`; se activa automáticamente al crear evento.
9. **Event.portalToken**: Generado on-demand, nunca incluir en listados públicos, nunca loguear en consola.
10. **Fechas**: Normalizar con `new Date(\`${date.slice(0,10)}T12:00:00\`)`.
11. **Admin**: No hay campo `role` en `User`. El administrador principal se identifica por `req.user.id === 1`. Solo el admin puede eliminar usuarios.
12. **Precios**: Validar que `unitPrice >= 0` y `quantity > 0` en QuoteItems. `pricePerCover > 0` y `covers > 0` en cotizaciones Catering.
13. **Dashboard**: Tiene tres tabs — `Resumen` (operativo diario), `Finanzas` (analítica e ingresos/egresos) y `Calendario` (vista anual con mini-meses).
14. **Importación VCF**: Muestra spinner + barra de progreso en tiempo real mientras importa contactos (puede tardar varios minutos).
15. **Transacciones**: Cuando se hacen múltiples `deleteMany`/`create` relacionados en una misma operación, usar `prisma.$transaction([...])` para garantizar atomicidad (ej: reemplazo de items/dishes/menus en `quotes.update`).
16. **Rutas públicas vs. protegidas**: El GET de `portal-queries` es protegido (solo admin/staff). El POST es público (lo llaman los clientes desde el portal sin auth). Siempre revisar `publicRouter` vs `protectedRouter` al agregar rutas nuevas.

---

## Patrones de diseño (frontend)

### Header de página
```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
  <div>
    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, ... }}>Título</h1>
    <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Subtítulo</p>
  </div>
  <button ...>Acción principal</button>
</div>
```

### Tabs de navegación
```jsx
// Contenedor
{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }
// Tab activo
{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#000', borderRadius: 7, padding: '8px 18px', fontWeight: 600 }
// Tab inactivo
{ background: 'transparent', color: 'var(--text-secondary)', borderRadius: 7, padding: '8px 18px' }
```
