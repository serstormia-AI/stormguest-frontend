import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, User, Key, Calendar, ArrowRight } from 'lucide-react';

export default function CheckIns() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        setLoading(true);
        // Simular que somos el administrador del hotel "demo"
        const { data: hotelData } = await supabase
            .from('hotels')
            .select('id')
            .eq('slug', 'demo')
            .single();

        if (hotelData) {
            // Join con la tabla guests para obtener el nombre
            const { data, error } = await supabase
                .from('reservations')
                .select(`
                    *,
                    guests (
                        first_name,
                        last_name,
                        email
                    )
                `)
                .eq('hotel_id', hotelData.id)
                .order('checkin_date', { ascending: true });
            
            if (data) setReservations(data);
            if (error) console.error(error);
        }
        setLoading(false);
    };

    const updateStatus = async (id, newStatus) => {
        const { error } = await supabase
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
        <div className="p-8 h-full flex flex-col">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Control de Recepción</h1>
                <p className="text-zinc-400 mt-1">Gestiona el flujo de huéspedes en tiempo real.</p>
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
                                                    <h3 className="font-bold text-sm">{res.guests?.first_name} {res.guests?.last_name}</h3>
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
                                                <span>{new Date(res.checkin_date).toLocaleDateString()}</span>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-zinc-600" />
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(res.checkout_date).toLocaleDateString()}</span>
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
