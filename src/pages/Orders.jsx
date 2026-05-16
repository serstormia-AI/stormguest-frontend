import React, { useEffect, useState } from 'react';
import { getOrders } from '../services/api';
import { CreditCard } from 'lucide-react';

const STATUS_BADGE = {
    paid: 'bg-emerald-500/20 text-emerald-400',
    pending: 'bg-zinc-700/50 text-zinc-400',
    failed: 'bg-red-500/20 text-red-400',
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
        getOrders()
            .then(setOrders)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-emerald-500" />
                    Órdenes de Pago
                </h1>
                <p className="text-zinc-400 mt-1">Historial de compras realizadas por los huéspedes.</p>
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
                                    <td className="px-6 py-4 font-medium text-zinc-200">{order.service_name}</td>
                                    <td className="px-6 py-4 text-zinc-300">{order.guest_name}</td>
                                    <td className="px-6 py-4 text-zinc-400 text-sm">{order.guest_email}</td>
                                    <td className="px-6 py-4 font-bold text-emerald-400">
                                        ${Number(order.amount).toFixed(2)} {order.currency?.toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] || STATUS_BADGE.pending}`}>
                                            {order.status}
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
