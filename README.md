# Haus-CRM

CRM para gestión integral de eventos de producción. Permite administrar clientes, eventos, cotizaciones, proveedores, pagos, catering, recetario, agenda de contactos y comunicación vía WhatsApp, todo en una sola aplicación.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js · Express 5 · Prisma 5 · PostgreSQL |
| Frontend | React 19 · Vite 7 · React Router 7 · Axios |
| Auth | JWT + bcryptjs |
| Archivos | Multer + Cloudinary v1 |
| WhatsApp | Evolution API v1.8.7 |
| IA | Anthropic Claude Haiku |
| Deploy | Railway |

---

## Funcionalidades

### Gestión de eventos
- **Clientes** — CRUD con estado activo/inactivo y fecha de cumpleaños.
- **Eventos** — CRUD vinculado a clientes. Estados: Propuesta → Confirmado → En producción → Finalizado.
- **Cotizaciones** — Por evento. Tipos: General, Catering, Audiovisual, Decoración. Ítems de línea y platos del recetario.
- **Checklist** — Tareas pendientes por evento con orden arrastrable.
- **Archivos** — Subida y descarga de documentos por evento (Cloudinary).

### Finanzas
- **Cobros** — Registro de pagos recibidos por evento.
- **Pagos a proveedores** — Seguimiento con método y estado.
- **Presupuesto** — Vista consolidada del balance financiero por evento.

### Catering
- **Menú por evento** — Armado de menú con secciones y platos del recetario.
- **Insumos** — Gestión de insumos de catering por evento con cantidades y proveedores.
- **Recetario** — Platos con ingredientes por persona. Sugerencia automática con IA.

### Contactos y comunicación
- **Agenda de contactos** — Independiente de clientes. Importación masiva desde VCF.
- **Detección de duplicados** — Por email, teléfono y nombre al importar.
- **Selección múltiple** — Checkboxes + barra flotante para eliminar en lote.
- **WhatsApp** — Mensajes manuales y automáticos vía Evolution API:
  - Recordatorio el día anterior a eventos confirmados
  - Agradecimiento el día después del evento
  - Propuesta de cumpleaños 30 días antes
  - Plantillas editables desde la UI, persistidas en disco

### Sistema
- **Dashboard** — KPIs, eventos próximos y feed de actividad reciente.
- **Proveedores** — CRUD con categoría, rating y alias.
- **Usuarios** — Gestión de acceso al sistema.
- **Log de actividad** — Registro de todas las acciones del equipo.
- **Tema dark / light** — Switcher global persistente.

---

## Requisitos previos

- Node.js ≥ 18
- PostgreSQL
- Cuenta en [Cloudinary](https://cloudinary.com)
- API Key de [Anthropic](https://console.anthropic.com) (opcional)
- Instancia de [Evolution API](https://github.com/EvolutionAPI/evolution-api) v1.8.7 (opcional)

---

## Instalación local

```bash
# 1. Clonar
git clone <repo-url>
cd eventcrm-main

# 2. Backend
cd backend
cp .env.example .env   # completar variables
npm install
npx prisma generate
npx prisma migrate dev
node src/seed.js       # crea usuario admin
npm run dev            # http://localhost:3001

# 3. Frontend
cd ../frontend
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
EVOLUTION_API_URL=https://...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE=haus-crm
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
npm run dev                   # desarrollo con nodemon
npx prisma studio             # GUI para la base de datos
npx prisma migrate dev        # nueva migración
node src/seed.js              # (re)crear usuario admin

# Frontend
npm run dev                   # desarrollo
npm run build                 # producción
npm run lint
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

El proyecto usa tres servicios:

| Servicio | Tipo | Configuración |
|---|---|---|
| Backend | Node.js | `prisma generate && prisma migrate deploy && node src/seed.js; node src/index.js` |
| Frontend | Static (Vite) | `railway.toml` + variable `VITE_API_URL` |
| Evolution API | Docker `atendai/evolution-api:v1.8.7` | Variables: `SERVER_URL`, `AUTHENTICATION_API_KEY`, `DATABASE_PROVIDER=sqlite` |

---

## Estructura del proyecto

```
eventcrm-main/
├── CLAUDE.md                  # Guía técnica para desarrollo con IA
├── README.md
├── backend/
│   ├── prisma/schema.prisma
│   ├── data/templates.json    # Plantillas WhatsApp (auto-generado)
│   └── src/
│       ├── index.js
│       ├── controllers/
│       ├── routes/
│       ├── services/          # evolution.js · templates.js · cron.js
│       ├── middleware/auth.js
│       ├── utils/activity.js
│       └── seed.js
└── frontend/
    └── src/
        ├── App.jsx
        ├── api/axios.js
        ├── components/
        ├── contexts/
        └── pages/
```

---

## Licencia

Uso interno. Todos los derechos reservados — Haus, Organización y producción de eventos.
