import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { CreditCard } from 'lucide-react';

const STATUS_BADGE = {
    approved: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-zinc-700/50 text-zinc-400',
    rejected: 'bg-red-500/20 text-red-400',
};

const STATUS_LABEL = {
    approved: 'Aprobado',
    pending: 'Pendiente',
    rejected: 'Rechazado',
};

function SkeletonRow() {
    return (
        <tr>
            {[...Array(6)].map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className="h-4 bg-zinc-800 rounded animate-pulse w-full" />
                </td>
            ))}
        </tr>
    );
}

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrders() {
            const hotelSlug = localStorage.getItem('hotel_id') || 'demo';
            const { data: hotel } = await supabaseAdmin
                .from('hotels').select('id').eq('slug', hotelSlug).single();
            if (!hotel) { setLoading(false); return; }

            const { data: requests } = await supabaseAdmin
                .from('requests')
                .select('id, guest_id, experience_id, total_price, status, created_at')
                .eq('hotel_id', hotel.id)
                .order('created_at', { ascending: false });
            if (!requests?.length) { setLoading(false); return; }

            const guestIds = [...new Set(requests.map(r => r.guest_id).filter(Boolean))];
            const expIds = [...new Set(requests.map(r => r.experience_id).filter(Boolean))];

            const [{ data: guests }, { data: exps }] = await Promise.all([
                supabaseAdmin.from('guests').select('id, name, email').in('id', guestIds),
                supabaseAdmin.from('experiences').select('id, title').in('id', expIds),
            ]);

            const guestMap = Object.fromEntries((guests || []).map(g => [g.id, g]));
            const expMap = Object.fromEntries((exps || []).map(e => [e.id, e.title]));

            setOrders(requests.map(r => ({
                ...r,
                guestName: guestMap[r.guest_id]?.name || '—',
                guestEmail: guestMap[r.guest_id]?.email || '—',
                expTitle: expMap[r.experience_id] || 'Servicio',
            })));
            setLoading(false);
        }
        fetchOrders();
    }, []);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-emerald-500" />
                    Órdenes de Pago
                </h1>
                <p className="text-zinc-400 mt-1">Historial de pedidos realizados por los huéspedes.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Servicio</th>
                            <th className="px-6 py-4">Huésped</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Monto</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {loading ? (
                            [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center text-zinc-500">
                                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p>No hay órdenes registradas todavía.</p>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-zinc-200">{order.expTitle}</td>
                                    <td className="px-6 py-4 text-zinc-300">{order.guestName}</td>
                                    <td className="px-6 py-4 text-zinc-400 text-sm">{order.guestEmail}</td>
                                    <td className="px-6 py-4 font-bold text-emerald-400">
                                        ${Number(order.total_price).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] || STATUS_BADGE.pending}`}>
                                            {STATUS_LABEL[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 text-sm">
                                        {new Date(order.created_at).toLocaleDateString('es-AR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
