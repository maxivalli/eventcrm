import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
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

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
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
      {/* Logo */}
      <div style={{
        width: 64, height: 64, borderRadius: 18, marginBottom: 28,
        background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 900, color: '#09090f',
      }}>H</div>

      {/* Ícono monitor */}
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

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) return <MobileBlock />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="users" element={<Users />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="events" element={<Events />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="budget" element={<Budget />} />
          <Route path="payments" element={<Payments />} />
          <Route path="supplier-payments" element={<SupplierPayments />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}