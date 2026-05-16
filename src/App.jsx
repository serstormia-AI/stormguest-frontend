import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Ticket, ShoppingBag, Bell, LogOut, Search, Star, CreditCard, Mail } from 'lucide-react';

import StormGuestAuth from './pages/StormGuestAuth';
import Catalog from './pages/Catalog';
import CheckIns from './pages/CheckIns';
import Chat from './pages/Chat';
import Requests from './pages/Requests';
import Dashboard from './pages/Dashboard';
import Reviews from './pages/Reviews';
import Orders from './pages/Orders';
import Notifications from './pages/Notifications';

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

// ── Ruta protegida ────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { token } = getAuth();
  return token ? children : <Navigate to="/login" replace />;
}

// ── Layout principal ──────────────────────────────────────────
function Layout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();

  const menu = [
    { name: 'Dashboard',              icon: LayoutDashboard, path: '/' },
    { name: 'Recepción (Check-ins)',  icon: Users,           path: '/checkins' },
    { name: 'Chat de Huéspedes',      icon: MessageSquare,   path: '/chat' },
    { name: 'Pedidos (Room Service)', icon: ShoppingBag,     path: '/requests' },
    { name: 'Catálogo (Upsells)',     icon: Ticket,          path: '/catalog' },
    { name: 'Reseñas',               icon: Star,            path: '/reviews' },
    { name: 'Órdenes',              icon: CreditCard,      path: '/orders' },
    { name: 'Notificaciones',       icon: Mail,            path: '/notifications' },
  ];

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
            <div className="flex items-center space-x-3 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
              <span className="text-sm text-zinc-400">Hotel Activo:</span>
              <select className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer">
                <option value="demo">Hotel Demo</option>
              </select>
            </div>

            <button className="relative text-zinc-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border border-zinc-700 flex items-center justify-center text-xs font-bold">
                {(localStorage.getItem('name') || 'A')[0].toUpperCase()}
              </div>
              <span className="text-sm text-zinc-300">{localStorage.getItem('name') || ''}</span>
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

        {/* Rutas protegidas */}
        <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/checkins" element={<PrivateRoute><Layout><CheckIns /></Layout></PrivateRoute>} />
        <Route path="/chat"     element={<PrivateRoute><Layout><Chat /></Layout></PrivateRoute>} />
        <Route path="/requests" element={<PrivateRoute><Layout><Requests /></Layout></PrivateRoute>} />
        <Route path="/catalog"  element={<PrivateRoute><Layout><Catalog /></Layout></PrivateRoute>} />
        <Route path="/reviews"  element={<PrivateRoute><Layout><Reviews /></Layout></PrivateRoute>} />
        <Route path="/orders"         element={<PrivateRoute><Layout><Orders /></Layout></PrivateRoute>} />
        <Route path="/notifications"  element={<PrivateRoute><Layout><Notifications /></Layout></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
