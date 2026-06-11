import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import Spinner from './components/ui/Spinner'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TenanciePage from './pages/TenanciePage'
import NuovaTenancyPage from './pages/NuovaTenancyPage'
import DettaglioTenancyPage from './pages/DettaglioTenancyPage'
import ProfiloPage from './pages/ProfiloPage'
import VerificaIdentitaPage from './pages/VerificaIdentitaPage'
import AdminPage from './pages/AdminPage'
import ProfiloPubblicoPage from './pages/ProfiloPubblicoPage'
import PagamentoPage from './pages/PagamentoPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

function AdminRoute({ children }) {
  const { user, admin, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!admin) return <Navigate to="/dashboard" replace />
  return <AppLayout>{children}</AppLayout>
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registrati" element={<RegisterPage />} />
      <Route path="/p/:token" element={<ProfiloPubblicoPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/locazioni" element={<ProtectedRoute><TenanciePage /></ProtectedRoute>} />
      <Route path="/locazioni/nuova" element={<ProtectedRoute><NuovaTenancyPage /></ProtectedRoute>} />
      <Route path="/locazioni/:id" element={<ProtectedRoute><DettaglioTenancyPage /></ProtectedRoute>} />
      <Route path="/profilo" element={<ProtectedRoute><ProfiloPage /></ProtectedRoute>} />
      <Route path="/verifica-identita" element={<ProtectedRoute><VerificaIdentitaPage /></ProtectedRoute>} />
      <Route path="/pagamento/:tipo" element={<ProtectedRoute><PagamentoPage /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
    </Routes>
  )
}
