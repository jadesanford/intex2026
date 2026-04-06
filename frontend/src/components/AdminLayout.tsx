import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Heart, LayoutDashboard, Users, DollarSign, Building2,
  Handshake, AlertTriangle, BarChart2, Share2, LogOut,
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/residents', label: 'Caseload', icon: Users },
  { path: '/admin/donors', label: 'Donors', icon: Heart },
  { path: '/admin/donations', label: 'Donations', icon: DollarSign },
  { path: '/admin/safehouses', label: 'Safehouses', icon: Building2 },
  { path: '/admin/partners', label: 'Partners', icon: Handshake },
  { path: '/admin/incidents', label: 'Incidents', icon: AlertTriangle },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/admin/social-media', label: 'Social Media', icon: Share2 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname.startsWith(path)

  const sidebarContent = (
    <div style={{
      width: collapsed ? 64 : 240, background: 'var(--navy)', height: '100vh',
      display: 'flex', flexDirection: 'column', transition: 'width 0.2s', flexShrink: 0
    }}>
      <div style={{
        padding: collapsed ? '20px 16px' : '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, background: 'var(--terracotta)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Heart size={16} color="white" fill="white" />
            </div>
            <span style={{ color: 'white', fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700 }}>Open Arms</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
          width: 28, height: 28, borderRadius: 6, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {navItems.map(({ path, label, icon: Icon, exact }) => {
          const active = isActive(path, exact)
          return (
            <Link key={path} to={path} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: collapsed ? '10px 16px' : '10px 14px',
              borderRadius: 8, marginBottom: 2, transition: 'all 0.15s',
              background: active ? 'rgba(193,105,79,0.25)' : 'transparent',
              color: active ? '#f4a58a' : 'rgba(255,255,255,0.65)',
              textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 400,
              borderLeft: active ? '3px solid var(--terracotta)' : '3px solid transparent',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {!collapsed && (
          <div style={{ padding: '8px 14px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{user?.displayName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        )}
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: collapsed ? '10px 16px' : '10px 14px', width: '100%',
          borderRadius: 8, background: 'transparent', color: 'rgba(255,255,255,0.5)',
          border: 'none', cursor: 'pointer', fontSize: 14, transition: 'all 0.15s',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ display: 'none' }} className="md-sidebar">{sidebarContent}</div>
      <div style={{ display: 'flex', flexShrink: 0 }}>{sidebarContent}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          background: 'white', borderBottom: '1px solid var(--border)',
          padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: 0
        }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Staff Portal — <span style={{ color: 'var(--terracotta)', fontWeight: 600 }}>{user?.displayName}</span>
          </div>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Public Site</Link>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f9fafb' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
