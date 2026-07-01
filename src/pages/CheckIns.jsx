import React, { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { Loader2, User, Key, Calendar, ArrowRight, Plus, X } from 'lucide-react';

function NewReservationModal({ onClose, onSaved }) {
    const [form, setForm] = useState({ name: '', email: '', room: '', checkIn: '', checkOut: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name || !form.email || !form.checkIn || !form.checkOut) {
            setError('Nombre, email y fechas son requeridos');
            return;
        }
        setLoading(true);
        try {
            const hotelSlug = localStorage.getItem('hotel_id') || 'demo';
            const { data: hotel } = await supabaseAdmin.from('hotels').select('id').eq('slug', hotelSlug).single();
            if (!hotel) throw new Error('Hotel no encontrado');

            // Upsert guest by email
            let { data: guest } = await supabaseAdmin.from('guests').select('id').eq('email', form.email.trim().toLowerCase()).eq('hotel_id', hotel.id).maybeSingle();
            if (!guest) {
                const { data: newGuest, error: gErr } = await supabaseAdmin.from('guests').insert({ name: form.name.trim(), email: form.email.trim().toLowerCase(), hotel_id: hotel.id }).select('id').single();
                if (gErr) throw new Error(gErr.message);
                guest = newGuest;
            }

            const { error: rErr } = await supabaseAdmin.from('reservations').insert({
                guest_id: guest.id,
                hotel_id: hotel.id,
                room_number: form.room.trim() || null,
                check_in: form.checkIn,
                check_out: form.checkOut,
                status: 'pending',
            });
            if (rErr) throw new Error(rErr.message);

            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h2 className="font-bold text-lg">Nueva Reserva</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide">Nombre del huésped</label>
                        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Juan Pérez"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide">Email</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@email.com"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide">Habitación</label>
                        <input value={form.room} onChange={e => set('room', e.target.value)} placeholder="101"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide">Check-in</label>
                            <input type="date" value={form.checkIn} onChange={e => set('checkIn', e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide">Check-out</label>
                            <input type="date" value={form.checkOut} onChange={e => set('checkOut', e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white text-sm transition-colors">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Crear reserva
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CheckIns() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        setLoading(true);
        // Simular que somos el administrador del hotel "demo"
        const hotelSlug = localStorage.getItem('hotel_id') || 'demo';
        const { data: hotelData } = await supabaseAdmin
            .from('hotels')
            .select('id')
            .eq('slug', hotelSlug)
            .single();

        if (hotelData) {
            const { data: reservations, error } = await supabaseAdmin
                .from('reservations')
                .select('id, room_number, check_in, check_out, status, guest_id')
                .eq('hotel_id', hotelData.id)
                .order('check_in', { ascending: true });

            if (error) console.error(error);

            if (reservations) {
                const guestIds = [...new Set(reservations.map(r => r.guest_id).filter(Boolean))];
                let guestsMap = {};
                if (guestIds.length > 0) {
                    const { data: guests } = await supabaseAdmin
                        .from('guests')
                        .select('id, name, email')
                        .in('id', guestIds);
                    if (guests) {
                        guestsMap = Object.fromEntries(guests.map(g => [g.id, g]));
                    }
                }
                const merged = reservations.map(res => ({ ...res, guest: guestsMap[res.guest_id] ?? null }));
                setReservations(merged);
            }
        }
        setLoading(false);
    };

    const updateStatus = async (id, newStatus) => {
        const { error } = await supabaseAdmin
            .from('reservations')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            // Update local state instantly
            setReservations(reservations.map(res => 
                res.id === id ? { ...res, status: newStatus } : res
            ));
        } else {
            alert("Error al actualizar: " + error.message);
        }
    };

    // Agrupar reservas por estado
    const columns = [
        { id: 'pending', title: 'Pendiente (Llegadas)', color: 'border-yellow-500', bg: 'bg-yellow-500/10' },
        { id: 'checked_in', title: 'In House', color: 'border-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'checked_out', title: 'Check-out', color: 'border-zinc-500', bg: 'bg-zinc-500/10' }
    ];

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
    }

    return (
        {showModal && <NewReservationModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchReservations(); }} />}
        <div className="p-8 h-full flex flex-col">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Control de Recepción</h1>
                    <p className="text-zinc-400 mt-1">Gestiona el flujo de huéspedes en tiempo real.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors">
                    <Plus className="w-4 h-4" /> Nueva Reserva
                </button>
            </div>

            {/* Status Board */}
            <div className="flex-1 flex space-x-6 overflow-x-auto pb-4">
                {columns.map(column => {
                    const columnReservations = reservations.filter(res => res.status === column.id);

                    return (
                        <div key={column.id} className="w-96 flex-shrink-0 flex flex-col bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
                            {/* Column Header */}
                            <div className={`p-4 border-b-2 ${column.color} ${column.bg} flex justify-between items-center`}>
                                <h2 className="font-bold text-white">{column.title}</h2>
                                <span className="bg-black/50 px-2 py-1 rounded text-xs font-bold">{columnReservations.length}</span>
                            </div>

                            {/* Column Body */}
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto hide-scrollbar">
                                {columnReservations.map(res => (
                                    <div key={res.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl shadow-lg hover:border-zinc-700 transition-colors group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-zinc-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm">{res.guest?.name}</h3>
                                                    <p className="text-xs text-zinc-500">ID: {res.pms_id}</p>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-900 px-2 py-1 rounded text-xs font-mono text-zinc-400 border border-zinc-800 flex items-center space-x-1">
                                                <Key className="w-3 h-3" />
                                                <span>{res.room_number || 'S/A'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4 text-xs text-zinc-400 mb-4 bg-zinc-900/50 p-2 rounded-lg">
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(res.check_in).toLocaleDateString()}</span>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-zinc-600" />
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(res.check_out).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end border-t border-zinc-800 pt-3">
                                            {column.id === 'pending' && (
                                                <button 
                                                    onClick={() => updateStatus(res.id, 'checked_in')}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors w-full"
                                                >
                                                    Dar Ingreso (In House)
                                                </button>
                                            )}
                                            {column.id === 'checked_in' && (
                                                <button 
                                                    onClick={() => updateStatus(res.id, 'checked_out')}
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors w-full border border-zinc-700"
                                                >
                                                    Realizar Check-out
                                                </button>
                                            )}
                                            {column.id === 'checked_out' && (
                                                <span className="text-xs text-zinc-500 italic text-center w-full block">Estadía finalizada</span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {columnReservations.length === 0 && (
                                    <div className="text-center p-6 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                                        No hay reservas aquí
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
