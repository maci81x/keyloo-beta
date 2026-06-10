import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Home, User, ShieldCheck, LogOut, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useRole } from '../../hooks/useRole'
import { signOut } from '../../lib/auth'
import BadgeVerifica from '../ui/BadgeVerifica'

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header desktop */}
      <header className="bg-[#1a3a5c] text-white hidden md:flex items-center justify-between px-6 py-3 shadow">
        <Link to="/dashboard" className="text-xl font-bold tracking-tight">
          Keyloo
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`hover:text-white/80 transition-colors ${location.pathname === to ? 'font-semibold underline underline-offset-4' : 'text-white/70'}`}
            >
              {label}
            </Link>
          ))}
          {admin && (
            <Link to="/admin" className="text-yellow-300 font-semibold hover:text-yellow-200">
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleRole}
            className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeftRight size={12} />
            {role === 'inquilino' ? 'Inquilino' : 'Proprietario'}
          </button>
          {profile && <BadgeVerifica level={profile.verification_level} />}
          <button onClick={handleSignOut} className="text-white/60 hover:text-white">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Contenuto */}
      <main className="flex-1 p-4 md:p-6 max-w-4xl w-full mx-auto pb-24 md:pb-6">
        {children}
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex items-center justify-around py-2 z-40">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to} className="flex flex-col items-center gap-0.5">
              <Icon size={20} className={active ? 'text-[#1a3a5c]' : 'text-gray-400'} />
              <span className={`text-[10px] ${active ? 'text-[#1a3a5c] font-semibold' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
        <button onClick={toggleRole} className="flex flex-col items-center gap-0.5">
          <ArrowLeftRight size={20} className="text-gray-400" />
          <span className="text-[10px] text-gray-400 capitalize">{role}</span>
        </button>
      </nav>
    </div>
  )
}
