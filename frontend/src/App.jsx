import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Events from './pages/Events'
import Quotes from './pages/Quotes'
import Suppliers from './pages/Suppliers'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="clients"    element={<Clients />} />
          <Route path="events"     element={<Events />} />
          <Route path="quotes"     element={<Quotes />} />
          <Route path="suppliers"  element={<Suppliers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}