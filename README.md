# Haus CRM — EventCRM

CRM para gestión integral de eventos de producción. Permite administrar clientes, eventos, cotizaciones, proveedores, pagos, catering, recetario y documentos, con portal de seguimiento para clientes y automatizaciones de WhatsApp.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js · Express 5 · Prisma 5 · PostgreSQL |
| Frontend | React 19 · Vite 7 · React Router 7 · Axios |
| Auth | JWT + bcryptjs |
| Archivos | Multer + Cloudinary v1 |
| IA | Anthropic Claude Haiku |
| WhatsApp | Evolution API v1.8.7 |
| Deploy | Railway |

---

## Funcionalidades

- **Clientes** — CRUD con estado activo/inactivo. Se activan automáticamente al crear un evento.
- **Eventos** — CRUD vinculado a clientes. Estados: Propuesta → Confirmado → Finalizado. Ordenamiento por fecha, venue y estado. Badge "Ya pasó" para eventos sin finalizar con fecha vencida.
- **Portal del cliente** — Link público por evento con cuenta regresiva, menú, servicios contratados con desglose de precios, y estado de cuenta en tiempo real. Se comparte por WhatsApp directamente desde el sistema.
- **Cotizaciones** — Por evento. Tipos: General, Catering, Audiovisual, Decoración, Otros. Incluye ítems de línea y platos del recetario.
- **Proveedores** — CRUD con categoría, rating (1–5) y alias corto.
- **Pagos al cliente** — Registro de cobros por evento.
- **Pagos a proveedores** — Seguimiento de pagos con método y estado.
- **Presupuesto** — Vista consolidada del balance financiero por evento.
- **Catering** — Gestión de insumos por evento con cantidad, unidad y proveedor.
- **Recetario** — Platos con ingredientes por persona. Sugerencia de ingredientes con IA. Generación de descripción para el menú con IA.
- **Menú por evento** — Armado de menú con secciones y platos del recetario.
- **Cronograma** — Timeline del evento con horarios y categorías. Generación automática con IA.
- **Checklist** — Tareas pendientes por evento con orden arrastrable.
- **Archivos** — Subida y descarga de documentos por evento (Cloudinary).
- **Contactos** — Agenda de contactos independiente.
- **WhatsApp** — Automatizaciones de mensajería con triggers configurables (Evolution API). Cron diario a las 09:00.
- **Usuarios** — Gestión de acceso al sistema.
- **Log de actividad** — Feed de todas las acciones recientes del equipo.
- **Tema dark / light** — Switcher global persistente.

---

## Requisitos previos

- Node.js ≥ 18
- PostgreSQL (local o en la nube)
- Cuenta en [Cloudinary](https://cloudinary.com)
- API Key de [Anthropic](https://console.anthropic.com) (opcional — IA)
- Evolution API (opcional — WhatsApp)

---

## Instalación y desarrollo local

```bash
# Clonar
git clone <repo-url> && cd eventcrm-main

# Backend
cd backend
cp .env.example .env   # completar variables
npm install
npx prisma generate
npx prisma migrate dev
node src/seed.js       # crea usuario admin
npm run dev            # http://localhost:3001

# Frontend (nueva terminal)
cd frontend
# Crear .env con: VITE_API_URL=http://localhost:3001
npm install
npm run dev            # http://localhost:5173
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
ANTHROPIC_API_KEY=...
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE=...
PORT=3001
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:3001
```

---

## Usuario por defecto

```
Email:    admin@eventcrm.com
Password: admin123
```

> Cambiar la contraseña después del primer login.

---

## Despliegue en Railway

Dos servicios independientes:

**Backend** — script `start`: `prisma generate && prisma migrate deploy && node src/seed.js && node src/index.js`

**Frontend** — configuración en `frontend/railway.toml`. Variable `VITE_API_URL` apuntando al backend en producción.

---

## Estructura del proyecto

```
eventcrm-main/
├── CLAUDE.md          # Guía técnica para desarrollo con IA
├── README.md
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── index.js              # Entry point
│       ├── controllers/          # Lógica de negocio
│       ├── routes/               # Rutas (portal.js usa dos routers: public + protected)
│       ├── services/             # cron.js (WhatsApp), evolution.js, templates.js
│       ├── middleware/auth.js
│       ├── utils/activity.js
│       └── ...
└── frontend/
    └── src/
        ├── App.jsx               # Router: rutas protegidas + /portal/:token pública
        ├── api/axios.js
        ├── components/
        ├── contexts/
        └── pages/                # Una página por módulo + ClientPortal.jsx
```

---

## Licencia

Uso interno. Todos los derechos reservados.
