# EventCRM — Frontend (Haus-CRM)

Interfaz web del CRM de gestión de eventos para "Haus". Construida con React 19 + Vite 7, sin framework de UI externo.

## Tecnologías

- **React 19** + React Router 7
- **Vite 7** (bundler + dev server)
- **Axios** con interceptors JWT
- **Recharts** para gráficos
- **Lucide React** para iconos
- Estilos con inline styles + variables CSS (temas dark/light)

## Requisitos

- Node.js 18+
- Backend corriendo en `http://localhost:3001` (configurable via `.env`)

## Setup

```bash
npm install
cp .env.example .env   # o crear manualmente
npm run dev
```

### Variables de entorno (`frontend/.env`)

```
VITE_API_URL=http://localhost:3001
```

## Estructura

```
src/
├── App.jsx               # Router principal; rutas protegidas + /portal/:token pública
├── main.jsx
├── index.css             # Variables CSS globales (temas dark/light)
├── api/
│   └── axios.js          # Instancia axios con interceptors JWT automáticos
├── components/
│   ├── Layout.jsx        # Sidebar + Outlet (todas las páginas autenticadas)
│   ├── Checklist.jsx     # Checklist interactivo por evento
│   ├── EventFiles.jsx    # Gestión de archivos adjuntos por evento
│   ├── ConfirmDialog.jsx # Modal de confirmación reutilizable
│   └── Toast.jsx         # Sistema de notificaciones (hook useToast)
├── contexts/
│   └── ThemeContext.jsx  # Contexto dark/light mode
└── pages/
    ├── Dashboard.jsx       # Tabs: Resumen (operativo) + Finanzas (analítica)
    ├── Login.jsx
    ├── Clients.jsx
    ├── Events.jsx
    ├── Quotes.jsx          # Cotizaciones General y Catering
    ├── Suppliers.jsx
    ├── Payments.jsx        # Cobros al cliente
    ├── SupplierPayments.jsx
    ├── Budget.jsx
    ├── Catering.jsx        # Insumos de catering por evento
    ├── Recetario.jsx       # CRUD de platos con ingredientes + sugerencias IA
    ├── Contacts.jsx        # Agenda de contactos (importación VCF con progreso)
    ├── WhatsApp.jsx        # Automatizaciones WhatsApp con Evolution API
    ├── ClientPortal.jsx    # Portal público para clientes (sin autenticación)
    └── Users.jsx
```

## Autenticación

- Login en `/login` → recibe JWT → guardado en `localStorage`
- Todas las rutas bajo `PrivateRoute` requieren token válido
- `api/axios.js` inyecta el token en cada request automáticamente
- La ruta `/portal/:token` es pública (no requiere login)

## Portal del cliente

Cada evento puede tener un portal público accesible por UUID. El cliente ve:

- Cuenta regresiva en tiempo real
- Datos del evento (fecha, hora, venue, invitados)
- Servicios contratados con desglose de precios
- Menú por secciones
- Estado de cuenta con historial de pagos

Acceso: `/portal/:uuid`

## Dashboard

Organizado en dos tabs:

- **Resumen**: KPIs operativos, próximos eventos, cotizaciones pendientes, alertas (cumpleaños próximos, consultas del portal), eventos sin cotización, deuda con proveedores, log de actividad reciente
- **Finanzas**: KPIs de ingresos/egresos, flujo de caja mensual, saldos pendientes por cliente, distribución de cotizaciones por estado, eventos por mes

## Comandos

```bash
npm run dev      # Dev server en http://localhost:5173
npm run build    # Build de producción
npm run preview  # Preview del build
```
