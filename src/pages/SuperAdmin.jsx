import React, { useEffect, useState, useCallback } from 'react';
import {
    Building2, Users, Plus, Pencil, Trash2, X, ChevronDown, Loader2, AlertCircle
} from 'lucide-react';
import {
    adminGetHotels, adminCreateHotel, adminUpdateHotel, adminDeleteHotel,
    adminGetUsers, adminCreateUser, adminUpdateUser, adminDeleteUser,
} from '../services/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(str) {
    return str
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function RoleBadge({ role }) {
    const styles = {
        super_admin:   'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        hotel_manager: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        reception:     'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
    };
    const labels = {
        super_admin:   'Super Admin',
        hotel_manager: 'Hotel Manager',
        reception:     'Recepción',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[role] || styles.reception}`}>
            {labels[role] || role}
        </span>
    );
}

function StatusBadge({ active }) {
    return active
        ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">Activo</span>
        : <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-600/20 text-zinc-400 border border-zinc-600/30 font-medium">Inactivo</span>;
}

function ErrorMsg({ message }) {
    if (!message) return null;
    return (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {message}
        </div>
    );
}

// ─── Modal base ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <h3 className="font-semibold text-white text-lg">{title}</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm text-zinc-400 font-medium">{label}</label>
            {children}
        </div>
    );
}

const inputCls = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

// ─── Hotel Modal ─────────────────────────────────────────────────────────────

function HotelModal({ hotel, onClose, onSaved }) {
    const isEdit = !!hotel;
    const [name, setName] = useState(hotel?.name || '');
    const [slug, setSlug] = useState(hotel?.slug || '');
    const [slugManual, setSlugManual] = useState(!!hotel?.slug);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function handleNameChange(e) {
        const val = e.target.value;
        setName(val);
        if (!slugManual) setSlug(slugify(val));
    }

    function handleSlugChange(e) {
        setSlug(e.target.value);
        setSlugManual(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!name.trim() || !slug.trim()) {
            return setError('Nombre y slug son requeridos');
        }
        setLoading(true);
        try {
            const payload = { name: name.trim(), slug: slug.trim() };
            if (isEdit) {
                await adminUpdateHotel(hotel.id, payload);
            } else {
                await adminCreateHotel(payload);
            }
            onSaved();
        } catch (err) {
            setError(err?.response?.data?.error || 'Error al guardar el hotel');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal title={isEdit ? 'Editar Hotel' : 'Nuevo Hotel'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Nombre del hotel">
                    <input
                        className={inputCls}
                        placeholder="Ej: Hotel Ibiza Beach"
                        value={name}
                        onChange={handleNameChange}
                        autoFocus
                    />
                </Field>
                <Field label="Slug (URL)">
                    <input
                        className={inputCls}
                        placeholder="hotel-ibiza-beach"
                        value={slug}
                        onChange={handleSlugChange}
                    />
                    <p className="text-xs text-zinc-500 mt-1">Identificador URL único. Se genera desde el nombre.</p>
                </Field>
                <ErrorMsg message={error} />
                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEdit ? 'Guardar cambios' : 'Crear hotel'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── User Modal ───────────────────────────────────────────────────────────────

function UserModal({ user, hotels, onClose, onSaved }) {
    const isEdit = !!user;
    const [form, setForm] = useState({
        name:     user?.name     || '',
        email:    user?.email    || '',
        password: '',
        role:     user?.role === 'super_admin' ? 'hotel_manager' : (user?.role || 'reception'),
        hotel_id: user?.hotel_id || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function set(field) {
        return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!form.name.trim() || !form.email.trim()) {
            return setError('Nombre y email son requeridos');
        }
        if (!isEdit && !form.password.trim()) {
            return setError('La contraseña es requerida');
        }
        setLoading(true);
        try {
            const payload = {
                name:     form.name.trim(),
                email:    form.email.trim(),
                role:     form.role,
                hotel_id: form.hotel_id || null,
            };
            if (form.password.trim()) payload.password = form.password;

            if (isEdit) {
                await adminUpdateUser(user.id, payload);
            } else {
                await adminCreateUser(payload);
            }
            onSaved();
        } catch (err) {
            setError(err?.response?.data?.error || 'Error al guardar el usuario');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal title={isEdit ? 'Editar Usuario' : 'Nuevo Usuario'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Nombre completo">
                    <input className={inputCls} placeholder="Ana García" value={form.name} onChange={set('name')} autoFocus />
                </Field>
                <Field label="Email">
                    <input className={inputCls} type="email" placeholder="ana@hotel.com" value={form.email} onChange={set('email')} />
                </Field>
                <Field label={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}>
                    <input
                        className={inputCls}
                        type="password"
                        placeholder={isEdit ? 'Dejar en blanco para no cambiar' : 'Mínimo 8 caracteres'}
                        value={form.password}
                        onChange={set('password')}
                    />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Rol">
                        <div className="relative">
                            <select className={selectCls} value={form.role} onChange={set('role')}>
                                <option value="hotel_manager">Hotel Manager</option>
                                <option value="reception">Recepción</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </Field>
                    <Field label="Hotel asignado">
                        <div className="relative">
                            <select className={selectCls} value={form.hotel_id} onChange={set('hotel_id')}>
                                <option value="">— Sin hotel —</option>
                                {hotels.map((h) => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </Field>
                </div>
                <ErrorMsg message={error} />
                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isEdit ? 'Guardar cambios' : 'Crear usuario'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Hotels Tab ───────────────────────────────────────────────────────────────

function HotelsTab({ hotels, loading, onRefresh }) {
    const [modal, setModal] = useState(null); // null | 'create' | hotel object

    async function handleDelete(hotel) {
        if (!window.confirm(`¿Eliminar el hotel "${hotel.name}"? Esta acción no se puede deshacer.`)) return;
        try {
            await adminDeleteHotel(hotel.id);
            onRefresh();
        } catch (err) {
            alert(err?.response?.data?.error || 'Error al eliminar el hotel');
        }
    }

    function handleSaved() {
        setModal(null);
        onRefresh();
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{hotels.length} hotel{hotels.length !== 1 ? 'es' : ''} registrado{hotels.length !== 1 ? 's' : ''}</p>
                <button
                    onClick={() => setModal('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Hotel
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Cargando hoteles...
                </div>
            ) : hotels.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No hay hoteles registrados.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/60">
                                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Nombre</th>
                                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Slug</th>
                                <th className="text-center px-4 py-3 text-zinc-400 font-medium">Usuarios</th>
                                <th className="text-center px-4 py-3 text-zinc-400 font-medium">Huéspedes</th>
                                <th className="text-center px-4 py-3 text-zinc-400 font-medium">Estado</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {hotels.map((hotel, i) => (
                                <tr
                                    key={hotel.id}
                                    className={`border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/20'}`}
                                >
                                    <td className="px-4 py-3 font-medium text-white">{hotel.name}</td>
                                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{hotel.slug || '—'}</td>
                                    <td className="px-4 py-3 text-center text-zinc-300">{hotel.user_count ?? 0}</td>
                                    <td className="px-4 py-3 text-center text-zinc-300">{hotel.guest_count ?? 0}</td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge active={hotel.active !== false} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setModal(hotel)}
                                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(hotel)}
                                                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal === 'create' && (
                <HotelModal onClose={() => setModal(null)} onSaved={handleSaved} />
            )}
            {modal && modal !== 'create' && (
                <HotelModal hotel={modal} onClose={() => setModal(null)} onSaved={handleSaved} />
            )}
        </div>
    );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ users, hotels, loading, onRefresh }) {
    const [modal, setModal] = useState(null); // null | 'create' | user object

    const hotelMap = Object.fromEntries(hotels.map((h) => [h.id, h.name]));

    async function handleDelete(user) {
        if (!window.confirm(`¿Eliminar al usuario "${user.name}" (${user.email})? Esta acción no se puede deshacer.`)) return;
        try {
            await adminDeleteUser(user.id);
            onRefresh();
        } catch (err) {
            alert(err?.response?.data?.error || 'Error al eliminar el usuario');
        }
    }

    function handleSaved() {
        setModal(null);
        onRefresh();
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
                <button
                    onClick={() => setModal('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Usuario
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Cargando usuarios...
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No hay usuarios registrados.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/60">
                                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Nombre</th>
                                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Email</th>
                                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Rol</th>
                                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Hotel</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, i) => (
                                <tr
                                    key={user.id}
                                    className={`border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/20'}`}
                                >
                                    <td className="px-4 py-3 font-medium text-white">{user.name}</td>
                                    <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                                    <td className="px-4 py-3 text-zinc-400">
                                        {user.hotel_id ? (hotelMap[user.hotel_id] || <span className="font-mono text-xs">{user.hotel_id}</span>) : <span className="text-zinc-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setModal(user)}
                                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modal === 'create' && (
                <UserModal hotels={hotels} onClose={() => setModal(null)} onSaved={handleSaved} />
            )}
            {modal && modal !== 'create' && (
                <UserModal user={modal} hotels={hotels} onClose={() => setModal(null)} onSaved={handleSaved} />
            )}
        </div>
    );
}

// ─── Main SuperAdmin page ─────────────────────────────────────────────────────

const TABS = [
    { id: 'hotels', label: 'Hoteles', icon: Building2 },
    { id: 'users',  label: 'Usuarios', icon: Users },
];

export default function SuperAdmin() {
    const [activeTab, setActiveTab] = useState('hotels');
    const [hotels, setHotels]       = useState([]);
    const [users, setUsers]         = useState([]);
    const [hotelsLoading, setHotelsLoading] = useState(true);
    const [usersLoading, setUsersLoading]   = useState(true);

    const fetchHotels = useCallback(async () => {
        setHotelsLoading(true);
        try {
            const data = await adminGetHotels();
            setHotels(data);
        } catch (err) {
            console.error('Error cargando hoteles:', err);
        } finally {
            setHotelsLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const data = await adminGetUsers();
            setUsers(data);
        } catch (err) {
            console.error('Error cargando usuarios:', err);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHotels();
        fetchUsers();
    }, [fetchHotels, fetchUsers]);

    function handleRefresh() {
        fetchHotels();
        fetchUsers();
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Panel Super Admin</h1>
                <p className="text-zinc-400 text-sm mt-1">Gestiona hoteles y usuarios de toda la plataforma StormGuest</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{hotels.length}</p>
                        <p className="text-xs text-zinc-400">Hoteles activos</p>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{users.length}</p>
                        <p className="text-xs text-zinc-400">Usuarios totales</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-zinc-800">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                                    isActive
                                        ? 'text-white'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                <tab.icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : ''}`} />
                                {tab.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                <div className="p-6">
                    {activeTab === 'hotels' && (
                        <HotelsTab
                            hotels={hotels}
                            loading={hotelsLoading}
                            onRefresh={handleRefresh}
                        />
                    )}
                    {activeTab === 'users' && (
                        <UsersTab
                            users={users}
                            hotels={hotels}
                            loading={usersLoading}
                            onRefresh={handleRefresh}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
