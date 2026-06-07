import React, { useEffect, useState } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { Check, X, MessageSquare, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Requests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // The hotel ID we are currently managing (Mocking context for MVP)
    // Normally this comes from App.jsx or Context, using hardcoded for demo or fetching the first
    const [hotelId, setHotelId] = useState("");

    useEffect(() => {
        const init = async () => {
            const { data: hotel } = await supabaseAdmin.from('hotels').select('id').limit(1).single();
            if (hotel) {
                setHotelId(hotel.id);
                fetchRequests(hotel.id);
            }
        };
        init();
    }, []);

    const fetchRequests = async (hId) => {
        const { data: requests, error } = await supabaseAdmin
            .from('requests')
            .select('id, hotel_id, guest_id, experience_id, total_price, status, internal_note, created_at')
            .eq('hotel_id', hId)
            .order('created_at', { ascending: false });

        if (error) console.error(error);

        if (requests) {
            const guestIds = [...new Set(requests.map(r => r.guest_id).filter(Boolean))];
            const experienceIds = [...new Set(requests.map(r => r.experience_id).filter(Boolean))];

            let guestsMap = {};
            if (guestIds.length > 0) {
                const { data: guests } = await supabaseAdmin
                    .from('guests')
                    .select('id, name')
                    .in('id', guestIds);
                if (guests) guestsMap = Object.fromEntries(guests.map(g => [g.id, g]));
            }

            let experiencesMap = {};
            if (experienceIds.length > 0) {
                const { data: experiences } = await supabaseAdmin
                    .from('experiences')
                    .select('id, title')
                    .in('id', experienceIds);
                if (experiences) experiencesMap = Object.fromEntries(experiences.map(e => [e.id, e]));
            }

            const merged = requests.map(req => ({
                ...req,
                guest: guestsMap[req.guest_id] ?? null,
                experience: experiencesMap[req.experience_id] ?? null,
            }));
            setRequests(merged);
        }
        setLoading(false);
    };

    // Realtime Suscription
    useEffect(() => {
        if (!hotelId) return;

        const channel = supabase
            .channel('hotel-requests')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT and UPDATE
                    schema: 'public',
                    table: 'requests',
                    filter: `hotel_id=eq.${hotelId}`
                },
                () => {
                    // Refetch all to get the joined data easily
                    fetchRequests(hotelId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [hotelId]);

    const handleUpdateStatus = async (reqId, newStatus) => {
        await supabaseAdmin
            .from('requests')
            .update({ status: newStatus })
            .eq('id', reqId);
        
        // Optimistic UI
        setRequests(requests.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
    };

    const handleContactGuest = (guestId) => {
        // Redirigimos al chat (podríamos pasar un estado en React Router, pero por ahora solo vamos a la URL)
        // En una app real, el componente Chat leería un query param o estado para seleccionar al huésped automáticamente.
        navigate('/chat');
    };

    if (loading) {
        return <div className="p-8 flex items-center space-x-3 text-zinc-400"><Loader2 className="animate-spin w-5 h-5" /> <span>Cargando pedidos...</span></div>;
    }

    const pending = requests.filter(r => r.status === 'pending');
    const processed = requests.filter(r => r.status !== 'pending');

    return (
        <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-heading text-white mb-2">Pedidos y Room Service</h1>
                <p className="text-zinc-400">Gestiona las solicitudes de compras y upsells de los huéspedes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Nuevos Pedidos */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center border-b border-zinc-800 pb-4">
                        <Clock className="w-5 h-5 mr-2 text-amber-500" />
                        Pendientes ({pending.length})
                    </h2>
                    
                    {pending.length === 0 ? (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
                            No hay pedidos pendientes.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pending.map(req => (
                                <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="inline-block px-2 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold uppercase rounded-md mb-2">
                                                NUEVO
                                            </span>
                                            <h3 className="font-bold text-lg text-white">{req.experience?.title}</h3>
                                            <p className="text-zinc-400 text-sm">
                                                Huésped: <span className="text-white font-medium">{req.guest?.name}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-zinc-500 uppercase tracking-wider">Total</p>
                                            <p className="text-xl font-bold text-emerald-400">${req.total_price}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3 pt-4 border-t border-zinc-800/50">
                                        <button 
                                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl font-medium flex items-center justify-center transition-colors"
                                        >
                                            <Check className="w-4 h-4 mr-2" /> Aprobar Cargo
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                            className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-xl font-medium flex items-center justify-center transition-colors"
                                        >
                                            <X className="w-4 h-4 mr-2" /> Rechazar
                                        </button>
                                        <button 
                                            onClick={() => handleContactGuest(req.guest?.id)}
                                            className="px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-2 rounded-xl font-medium flex items-center justify-center transition-colors"
                                            title="Contactar al Huésped"
                                        >
                                            <MessageSquare className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Historial */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center border-b border-zinc-800 pb-4">
                        Historial Procesado
                    </h2>

                    {processed.length === 0 ? (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
                            Aún no se han procesado pedidos.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {processed.map(req => (
                                <div key={req.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 opacity-80">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-white">{req.experience?.title}</h3>
                                            <p className="text-zinc-500 text-xs">
                                                {req.guest?.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-white font-bold">${req.total_price}</span>
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                                                req.status === 'approved' 
                                                ? 'bg-emerald-500/10 text-emerald-400' 
                                                : 'bg-red-500/10 text-red-400'
                                            }`}>
                                                {req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
