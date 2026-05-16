import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Loader2, ImageIcon, ShoppingCart } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { createCheckout } from '../services/api';

export default function Catalog() {
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [buyingExp, setBuyingExp] = useState(null);
    const [buyForm, setBuyForm] = useState({ guest_name: '', guest_email: '' });
    const [buyLoading, setBuyLoading] = useState(false);

    useEffect(() => {
        fetchExperiences();
    }, []);

    const fetchExperiences = async () => {
        setLoading(true);
        // We simulate the admin is logged in as the 'demo' hotel
        const { data: hotelData } = await supabase
            .from('hotels')
            .select('id')
            .eq('slug', 'demo')
            .single();

        if (hotelData) {
            const { data } = await supabase
                .from('experiences')
                .select('*')
                .eq('hotel_id', hotelData.id)
                .order('created_at', { ascending: false });
            
            if (data) setExperiences(data);
        }
        setLoading(false);
    };

    const startEditing = (exp) => {
        setEditingId(exp.id);
        setEditForm(exp);
    };

    const openBuyModal = (exp) => {
        setBuyingExp(exp);
        setBuyForm({ guest_name: '', guest_email: '' });
    };

    const handleBuy = async () => {
        if (!buyForm.guest_name || !buyForm.guest_email) return;
        setBuyLoading(true);
        try {
            const { data: hotelData } = await supabase
                .from('hotels')
                .select('id')
                .eq('slug', 'demo')
                .single();

            const { url } = await createCheckout({
                service_id: buyingExp.id,
                guest_name: buyForm.guest_name,
                guest_email: buyForm.guest_email,
                hotel_id: hotelData.id,
            });
            window.location.href = url;
        } catch (err) {
            alert('Error al procesar el pago: ' + (err.response?.data?.error || err.message));
            setBuyLoading(false);
        }
    };

    const saveEdit = async () => {
        const { error } = await supabase
            .from('experiences')
            .update({
                title: editForm.title,
                price: editForm.price,
                description: editForm.description,
                image_url: editForm.image_url ?? null
            })
            .eq('id', editingId);

        if (!error) {
            setExperiences(experiences.map(e => e.id === editingId ? editForm : e));
            setEditingId(null);
        } else {
            alert("Error al guardar: " + error.message);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Catálogo</h1>
                    <p className="text-zinc-400 mt-1">Administra las experiencias y upsells que ven los huéspedes.</p>
                </div>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Upsell</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Imagen</th>
                                <th className="px-6 py-4">Título</th>
                                <th className="px-6 py-4">Descripción</th>
                                <th className="px-6 py-4">Precio</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {experiences.map((exp) => (
                                <tr key={exp.id} className="hover:bg-zinc-800/50 transition-colors">
                                    {editingId === exp.id ? (
                                        <>
                                            {/* Image upload cell in edit mode */}
                                            <td className="px-6 py-4">
                                                <ImageUpload
                                                    currentUrl={editForm.image_url}
                                                    folder="experiences"
                                                    onUpload={(url) => setEditForm({ ...editForm, image_url: url })}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1 w-full text-sm outline-none focus:border-emerald-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="text" 
                                                    value={editForm.description}
                                                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1 w-full text-sm outline-none focus:border-emerald-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="number" 
                                                    value={editForm.price}
                                                    onChange={e => setEditForm({...editForm, price: e.target.value})}
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1 w-24 text-sm outline-none focus:border-emerald-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                                <button onClick={saveEdit} className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded transition-colors">
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-2 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white rounded transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            {/* Thumbnail cell in view mode */}
                                            <td className="px-6 py-4">
                                                <div className="w-16 h-12 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center">
                                                    {exp.image_url ? (
                                                        <img
                                                            src={exp.image_url}
                                                            alt={exp.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-zinc-600" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-zinc-200">{exp.title}</td>
                                            <td className="px-6 py-4 text-zinc-400 text-sm max-w-xs truncate">{exp.description}</td>
                                            <td className="px-6 py-4 font-bold text-emerald-400">${exp.price} {exp.currency}</td>
                                            <td className="px-6 py-4 text-right flex justify-end items-center gap-1">
                                                <button onClick={() => openBuyModal(exp)} className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors" title="Comprar">
                                                    <ShoppingCart className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => startEditing(exp)} className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {experiences.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-zinc-500">
                                        No hay experiencias configuradas. Haz clic en "Nuevo Upsell".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {buyingExp && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-bold">Comprar servicio</h2>
                                <p className="text-zinc-400 text-sm mt-1">{buyingExp.title} — <span className="text-emerald-400 font-bold">${buyingExp.price} {buyingExp.currency}</span></p>
                            </div>
                            <button onClick={() => setBuyingExp(null)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Nombre del huésped</label>
                                <input
                                    type="text"
                                    value={buyForm.guest_name}
                                    onChange={e => setBuyForm({ ...buyForm, guest_name: e.target.value })}
                                    placeholder="Juan García"
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Email del huésped</label>
                                <input
                                    type="email"
                                    value={buyForm.guest_email}
                                    onChange={e => setBuyForm({ ...buyForm, guest_email: e.target.value })}
                                    placeholder="juan@example.com"
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setBuyingExp(null)}
                                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBuy}
                                disabled={buyLoading || !buyForm.guest_name || !buyForm.guest_email}
                                className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                {buyLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-4 h-4" />
                                        Ir a pagar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
