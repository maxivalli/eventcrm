# Haus CRM — EventCRM

CRM para gestión integral de eventos de producción. Permite administrar clientes, eventos, cotizaciones, proveedores, pagos, catering, recetario y documentos, todo en una sola aplicación.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js · Express 5 · Prisma 5 · PostgreSQL |
| Frontend | React 19 · Vite 7 · React Router 7 · Axios |
| Auth | JWT + bcryptjs |
| Archivos | Multer + Cloudinary v1 |
| IA | Anthropic Claude Haiku (sugerencia de ingredientes) |
| Deploy | Railway |

---

## Funcionalidades

- **Clientes** — CRUD con estado activo/inactivo y fecha de cumpleaños.
- **Eventos** — CRUD vinculado a clientes. Estados: Propuesta → Confirmado → En producción → Finalizado.
- **Cotizaciones** — Por evento. Tipos: General, Catering, Audiovisual, Decoración. Incluye ítems de línea y platos del recetario.
- **Proveedores** — CRUD con categoría, rating (1–5) y alias corto.
- **Pagos al cliente** — Registro de cobros por evento.
- **Pagos a proveedores** — Seguimiento de pagos con método y estado.
- **Presupuesto** — Vista consolidada del balance financiero por evento.
- **Catering** — Gestión de insumos por evento con cantidad, unidad y proveedor.
- **Recetario** — Platos con ingredientes (cantidad por persona). Sugerencia automática de ingredientes con IA.
- **Menú por evento** — Armado de menú con secciones y platos del recetario.
- **Checklist** — Tareas pendientes por evento con orden arrastrable.
- **Archivos** — Subida y descarga de documentos por evento (almacenados en Cloudinary).
- **Usuarios** — Gestión de acceso al sistema.
- **Log de actividad** — Feed de todas las acciones recientes del equipo.
- **Tema dark / light** — Switcher global persistente.

---

## Requisitos previos

- Node.js ≥ 18
- PostgreSQL (local o en la nube)
- Cuenta en [Cloudinary](https://cloudinary.com) (uploads de archivos)
- API Key de [Anthropic](https://console.anthropic.com) (opcional — solo para sugerencia de ingredientes con IA)

---

## Instalación y desarrollo local

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd eventcrm-main
```

### 2. Configurar el backend

```bash
cd backend
cp .env.example .env   # o crear .env manualmente (ver sección Variables de entorno)
npm install
npx prisma generate
npx prisma migrate dev
node src/seed.js       # crea el usuario admin por defecto
npm run dev            # servidor en http://localhost:3001
```

### 3. Configurar el frontend

```bash
cd frontend
# Crear frontend/.env con:
# VITE_API_URL=http://localhost:3001
npm install
npm run dev            # servidor en http://localhost:5173
```

---

## Variables de entorno

### `backend/.env`

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=tu_secreto_jwt
CORS_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ANTHROPIC_API_KEY=...        # opcional
PORT=3001
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:3001
```

---

## Comandos útiles

```bash
# Backend
npm run dev                      # desarrollo con nodemon
npx prisma studio                # GUI para explorar la base de datos
npx prisma migrate dev           # crear y aplicar nueva migración
npx prisma migrate deploy        # aplicar migraciones en producción
node src/seed.js                 # (re)crear usuario admin

# Frontend
npm run dev                      # desarrollo con Vite
npm run build                    # build de producción
npm run lint                     # ESLint
```

---

## Usuario por defecto

Ejecutar `node src/seed.js` para crear el usuario administrador inicial:

```
Email:    admin@eventcrm.com
Password: admin123
```

> Cambiar la contraseña después del primer login.

---

## Despliegue en Railway

El proyecto está preparado para Railway con dos servicios independientes:

**Backend**
- El script `start` en `package.json` ejecuta: `prisma generate && prisma migrate deploy && node src/seed.js && node src/index.js`
- Variables de entorno configuradas en el panel de Railway.

**Frontend**
- Configuración en `frontend/railway.toml`.
- Variable `VITE_API_URL` apuntando a la URL del backend en producción.

---

## Estructura del proyecto

```
eventcrm-main/
├── CLAUDE.md          # Guía técnica para desarrollo con IA
├── README.md
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── index.js              # Entry point
│       ├── controllers/          # Lógica de negocio
│       ├── routes/               # Definición de rutas
│       ├── middleware/auth.js    # JWT middleware
│       ├── utils/activity.js    # Log de actividad
│       ├── cloudinary.js
│       ├── upload.js             # Multer + Cloudinary
│       ├── prisma.js             # Singleton PrismaClient
│       └── seed.js
└── frontend/
    └── src/
        ├── App.jsx               # Router principal
        ├── api/axios.js          # Instancia HTTP con interceptors
        ├── components/           # Layout, Checklist, EventFiles, Toast, ConfirmDialog
        ├── contexts/             # ThemeContext (dark/light)
        └── pages/                # Una página por módulo
```

---

## Licencia

Uso interno. Todos los derechos reservados.
