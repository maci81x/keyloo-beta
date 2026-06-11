import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Home, User, ShieldCheck, LogOut, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { signOut } from '../../lib/auth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/locazioni', label: 'Locazioni', icon: Home },
  { to: '/profilo', label: 'Profilo', icon: User },
]

export default function AppLayout({ children }) {
  const { profile, admin } = useAuth()
  const { role, toggleRole } = useRole()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const initials = `${profile?.nome?.[0] || ''}${profile?.cognome?.[0] || ''}`.toUpperCase()

  return (
    <div className="min-h-screen bg-[#f3f4f8] flex flex-col">
      {/* Header desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 shadow-lg sticky top-0 z-30"
        style={{ background: 'linear-gradient(90deg, #0f2744 0%, #1a3a5c 100%)' }}>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#10b981] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">Keyloo</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 leading-none ml-0.5">
            BETA
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <Link key={to} to={to}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${active ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                {label}
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#10b981]" />}
              </Link>
            )
          })}
          {admin && (
            <Link to="/admin"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-yellow-300 hover:bg-yellow-300/10 transition-all">
              Admin
            </Link>
          )}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <button onClick={toggleRole}
            className="flex items-center gap-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all text-white/80">
            <ArrowLeftRight size={11} />
            <span>{role === 'inquilino' ? 'Inquilino' : 'Proprietario'}</span>
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white text-xs font-bold shadow-sm select-none">
            {initials || '?'}
          </div>

          <button onClick={handleSignOut} className="text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Contenuto */}
      <main className="flex-1 p-4 md:p-6 w-full mx-auto pb-24 md:pb-6">
        {children}
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex items-center justify-around py-2 z-40 shadow-lg">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to} className="flex flex-col items-center gap-0.5 px-3 py-1">
              <Icon size={20} className={active ? 'text-[#1a3a5c]' : 'text-gray-400'} />
              <span className={`text-[10px] ${active ? 'text-[#1a3a5c] font-bold' : 'text-gray-400'}`}>{label}</span>
            </Link>
          )
        })}
        <button onClick={toggleRole} className="flex flex-col items-center gap-0.5 px-3 py-1">
          <ArrowLeftRight size={20} className="text-gray-400" />
          <span className="text-[10px] text-gray-400 capitalize">{role}</span>
        </button>
      </nav>
    </div>
  )
}
