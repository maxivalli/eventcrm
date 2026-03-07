import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
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
