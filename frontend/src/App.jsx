import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Events from "./pages/Events";
import Quotes from "./pages/Quotes";
import Suppliers from "./pages/Suppliers";
import Budget from "./pages/Budget";
import Payments from "./pages/Payments";
import SupplierPayments from "./pages/SupplierPayments";
import Users from "./pages/Users";
import MenusPage from "./pages/Menus";
import Recetario from "./pages/Recetario";
import Contacts from "./pages/Contacts";
import WhatsApp from "./pages/WhatsApp";
import ClientPortal from "./pages/ClientPortal";
import CheckinPortal from "./pages/CheckinPortal";
import GuestPortal from "./pages/GuestPortal";
import PortalQueries from "./pages/PortalQueries";
import NotFound from "./pages/NotFound";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

// Solo admin puede acceder
function AdminRoute({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

// Admin y staff pueden acceder (no readonly)
function StaffRoute({ children }) {
  const { isReadonly } = useAuth()
  return !isReadonly ? children : <Navigate to="/dashboard" replace />;
}

function MobileBlock() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#09090f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px', textAlign: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <img src="/haus-logo.svg" alt="Haus" style={{ width: 72, height: 72, borderRadius: '50%', marginBottom: 28 }} />

      <div style={{ marginBottom: 24 }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </div>

      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 22, fontWeight: 700, color: '#e8e8f0', marginBottom: 14,
      }}>
        ¡Hola! Esto es para escritorio 💻
      </div>
      <div style={{
        fontSize: 14, color: '#5a5a7a', lineHeight: 1.7, maxWidth: 300,
      }}>
        Haus-CRM funciona mejor desde una computadora. Abrilo en tu laptop o PC y vas a tener todo disponible.
      </div>

      <div style={{
        marginTop: 32, padding: '10px 24px',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 99, fontSize: 12,
        color: '#c9a84c', letterSpacing: 1.5,
        textTransform: 'uppercase',
      }}>
        Haus · Producción de Eventos
      </div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isPortal      = location.pathname.startsWith('/portal/')
  const isCheckin     = location.pathname.startsWith('/checkin/')
  const isGuestPortal = location.pathname.startsWith('/evento/')
  if (isMobile && !isPortal && !isCheckin && !isGuestPortal) return <MobileBlock />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/portal/:token"  element={<ClientPortal />} />
      <Route path="/checkin/:token" element={<CheckinPortal />} />
      <Route path="/evento/:token"  element={<GuestPortal />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        {/* Solo admin */}
        <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
        {/* Admin + staff (no readonly) */}
        <Route path="payments"          element={<StaffRoute><Payments /></StaffRoute>} />
        <Route path="supplier-payments" element={<StaffRoute><SupplierPayments /></StaffRoute>} />
        <Route path="budget"            element={<StaffRoute><Budget /></StaffRoute>} />
        {/* Todos */}
        <Route path="dashboard"      element={<Dashboard />} />
        <Route path="clients"        element={<Clients />} />
        <Route path="events"         element={<Events />} />
        <Route path="quotes"         element={<Quotes />} />
        <Route path="suppliers"      element={<Suppliers />} />
        <Route path="catering"       element={<MenusPage />} />
        <Route path="recetario"      element={<Recetario />} />
        <Route path="contacts"       element={<Contacts />} />
        <Route path="whatsapp"       element={<WhatsApp />} />
        <Route path="portal-queries" element={<PortalQueries />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}