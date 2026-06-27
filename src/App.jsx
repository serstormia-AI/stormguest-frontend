import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Ticket, ShoppingBag, Bell, LogOut, Search, Star, CreditCard, Mail, Cog, Shield, Plug, ChevronDown } from 'lucide-react';
import { supabaseAdmin } from './lib/supabase';

import StormGuestAuth from './pages/StormGuestAuth';
import Catalog from './pages/Catalog';
import CheckIns from './pages/CheckIns';
import Chat from './pages/Chat';
import Requests from './pages/Requests';
import Dashboard from './pages/Dashboard';
import Reviews from './pages/Reviews';
import Orders from './pages/Orders';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import SuperAdmin from './pages/SuperAdmin';
import Integrations from './pages/Integrations';

// ── RBAC ──────────────────────────────────────────────────────
// Qué rutas puede ver cada rol
const ROLE_ROUTES = {
  reception:     ['/checkins', '/chat', '/requests', '/orders'],
  hotel_manager: ['/checkins', '/chat', '/requests', '/catalog', '/reviews', '/orders', '/notifications', '/settings', '/integrations', '/'],
  super_admin:   ['/checkins', '/chat', '/requests', '/catalog', '/reviews', '/orders', '/notifications', '/settings', '/integrations', '/admin', '/'],
};

function canAccess(role, path) {
  const allowed = ROLE_ROUTES[role] || [];
  return allowed.includes(path);
}

// ── Auth helpers ──────────────────────────────────────────────
function getAuth() {
  return {
    token: localStorage.getItem('token'),
    role:  localStorage.getItem('role'),
    name:  localStorage.getItem('name'),
  };
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
  localStorage.removeItem('hotel_id');
}

// ── Ruta protegida (auth) ─────────────────────────────────────
function PrivateRoute({ children }) {
  const { token } = getAuth();
  return token ? children : <Navigate to="/login" replace />;
}

// ── Ruta protegida (rol) ──────────────────────────────────────
function RoleRoute({ path, children }) {
  const { role } = getAuth();
  if (canAccess(role, path)) return children;
  // reception no tiene dashboard — redirigir a su primera pantalla
  const fallback = role === 'reception' ? '/checkins' : '/';
  return <Navigate to={fallback} replace />;
}

// ── Hotel selector (solo super_admin) ────────────────────────
function HotelSelector() {
  const [hotels, setHotels] = useState([]);
  const [current, setCurrent] = useState(localStorage.getItem('hotel_id') || '');

  useEffect(() => {
    supabaseAdmin.from('hotels').select('id, name, slug').order('name').then(({ data }) => {
      setHotels(data || []);
      if (!current && data?.length > 0) {
        localStorage.setItem('hotel_id', data[0].slug);
        setCurrent(data[0].slug);
      }
    });
  }, []);

  const handleChange = (e) => {
    localStorage.setItem('hotel_id', e.target.value);
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
      <span className="text-sm text-zinc-400">Hotel:</span>
      <div className="relative flex items-center">
        <select
          value={current}
          onChange={handleChange}
          className="appearance-none bg-transparent text-sm font-bold text-white uppercase tracking-wide pr-5 focus:outline-none cursor-pointer"
        >
          {hotels.map(h => (
            <option key={h.id} value={h.slug} className="bg-zinc-900 normal-case font-normal">
              {h.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-0 pointer-events-none" />
      </div>
    </div>
  );
}

// ── Layout principal ──────────────────────────────────────────
function Layout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { role }  = getAuth();

  const allMenu = [
    { name: 'Dashboard',              icon: LayoutDashboard, path: '/' },
    { name: 'Recepción (Check-ins)',  icon: Users,           path: '/checkins' },
    { name: 'Chat de Huéspedes',      icon: MessageSquare,   path: '/chat' },
    { name: 'Pedidos (Room Service)', icon: ShoppingBag,     path: '/requests' },
    { name: 'Catálogo (Upsells)',     icon: Ticket,          path: '/catalog' },
    { name: 'Reseñas',               icon: Star,            path: '/reviews' },
    { name: 'Órdenes',               icon: CreditCard,      path: '/orders' },
    { name: 'Notificaciones',        icon: Mail,            path: '/notifications' },
    { name: 'Configuración',         icon: Cog,             path: '/settings' },
    { name: 'Integraciones PMS',     icon: Plug,            path: '/integrations' },
    { name: 'Super Admin',           icon: Shield,          path: '/admin' },
  ];
  const menu = allMenu.filter(item => canAccess(role, item.path));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-zinc-900 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-900">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">S</div>
            <span className="font-bold text-lg tracking-wide">StormGuest</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-zinc-900 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button onClick={handleLogout}
            className="flex items-center space-x-3 text-zinc-400 hover:text-white px-4 py-3 w-full transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 w-96">
            <Search className="w-4 h-4 text-zinc-500" />
            <input type="text" placeholder="Buscar reserva, huésped..."
              className="bg-transparent border-none outline-none text-sm ml-3 w-full text-zinc-300 placeholder:text-zinc-600" />
          </div>

          <div className="flex items-center space-x-6">
            {role === 'super_admin'
              ? <HotelSelector />
              : (
                <div className="flex items-center space-x-3 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <span className="text-sm text-zinc-400">Hotel:</span>
                  <span className="text-sm font-bold text-white uppercase tracking-wide">
                    {localStorage.getItem('hotel_id') || 'demo'}
                  </span>
                </div>
              )
            }

            <button className="relative text-zinc-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border border-zinc-700 flex items-center justify-center text-xs font-bold">
                {(localStorage.getItem('name') || 'A')[0].toUpperCase()}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm text-zinc-300">{localStorage.getItem('name') || ''}</span>
                <span className={`text-xs font-medium ${
                  role === 'super_admin'   ? 'text-purple-400' :
                  role === 'hotel_manager' ? 'text-emerald-400' :
                                             'text-zinc-500'
                }`}>
                  {role === 'super_admin' ? 'Super Admin' : role === 'hotel_manager' ? 'Manager' : 'Recepción'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<StormGuestAuth />} />

        {/* Rutas protegidas — todos los roles autenticados */}
        <Route path="/" element={<PrivateRoute><RoleRoute path="/"><Layout><Dashboard /></Layout></RoleRoute></PrivateRoute>} />
        <Route path="/checkins" element={<PrivateRoute><RoleRoute path="/checkins"><Layout><CheckIns /></Layout></RoleRoute></PrivateRoute>} />
        <Route path="/chat"     element={<PrivateRoute><RoleRoute path="/chat"><Layout><Chat /></Layout></RoleRoute></PrivateRoute>} />
        <Route path="/requests" element={<PrivateRoute><RoleRoute path="/requests"><Layout><Requests /></Layout></RoleRoute></PrivateRoute>} />
        <Route path="/orders"   element={<PrivateRoute><RoleRoute path="/orders"><Layout><Orders /></Layout></RoleRoute></PrivateRoute>} />

        {/* Solo hotel_manager y super_admin */}
        <Route path="/catalog"  element={<PrivateRoute><RoleRoute path="/catalog"><Layout><Catalog /></Layout></RoleRoute></PrivateRoute>} />
        <Route path="/reviews"  element={<PrivateRoute><RoleRoute path="/reviews"><Layout><Reviews /></Layout></RoleRoute></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><RoleRoute path="/notifications"><Layout><Notifications /></Layout></RoleRoute></PrivateRoute>} />
        <Route path="/settings"      element={<PrivateRoute><RoleRoute path="/settings"><Layout><Settings /></Layout></RoleRoute></PrivateRoute>} />

        <Route path="/integrations" element={<PrivateRoute><RoleRoute path="/integrations"><Layout><Integrations /></Layout></RoleRoute></PrivateRoute>} />

        {/* Solo super_admin */}
        <Route path="/admin" element={<PrivateRoute><RoleRoute path="/admin"><Layout><SuperAdmin /></Layout></RoleRoute></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
