import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Ticket, Settings, Bell, LogOut, Search, ShoppingBag } from 'lucide-react';

// Paginas simuladas
const Dashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Dashboard</h1></div>;

import Catalog from './pages/Catalog';
import CheckIns from './pages/CheckIns';
import Chat from './pages/Chat';
import Requests from './pages/Requests';

function Layout({ children }) {
    const location = useLocation();

    const menu = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Recepción (Check-ins)', icon: Users, path: '/checkins' },
        { name: 'Chat de Huéspedes', icon: MessageSquare, path: '/chat' },
        { name: 'Pedidos (Room Service)', icon: ShoppingBag, path: '/requests' },
        { name: 'Catálogo (Upsells)', icon: Ticket, path: '/catalog' },
        { name: 'Configuración', icon: Settings, path: '/settings' },
    ];

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
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive 
                                        ? 'bg-zinc-900 text-white font-medium' 
                                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : ''}`} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-900">
                    <button className="flex items-center space-x-3 text-zinc-400 hover:text-white px-4 py-3 w-full transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative">
                {/* Header Top Bar */}
                <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 w-96">
                        <Search className="w-4 h-4 text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="Buscar reserva, huésped..." 
                            className="bg-transparent border-none outline-none text-sm ml-3 w-full text-zinc-300 placeholder:text-zinc-600"
                        />
                    </div>

                    <div className="flex items-center space-x-6">
                        {/* Selector de Hotel (Multi-Tenant Context) */}
                        <div className="flex items-center space-x-3 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                            <span className="text-sm text-zinc-400">Hotel Activo:</span>
                            <select className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer">
                                <option value="demo">Hotel Interamericano</option>
                                <option value="llaollao">Llao Llao Resort</option>
                            </select>
                        </div>

                        <button className="relative text-zinc-400 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></span>
                        </button>
                        
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border border-zinc-700 cursor-pointer"></div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/checkins" element={<CheckIns />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/catalog" element={<Catalog />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}
