import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Loader2, ImageIcon } from 'lucide-react';

const EMPTY_FORM = { title: '', description: '', price: '', image_url: '' };

export default function Catalog() {
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hotelId, setHotelId] = useState('');

    // Edit
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Create modal
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);

    useEffect(() => { init(); }, []);

    const init = async () => {
        setLoading(true);
        const hotelSlug = localStorage.getItem('hotel_id') || 'demo';
        const { data: hotel } = await supabaseAdmin
            .from('hotels').select('id').eq('slug', hotelSlug).single();
        if (hotel) {
            setHotelId(hotel.id);
            await fetchExperiences(hotel.id);
        }
        setLoading(false);
    };

    const fetchExperiences = async (hId) => {
        const { data } = await supabaseAdmin
            .from('experiences')
            .select('id, title, description, price, image_url, created_at')
            .eq('hotel_id', hId)
            .order('created_at', { ascending: false });
        setExperiences(data || []);
    };

    // ── Create ──────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!createForm.title || !createForm.price) return;
        setCreating(true);
        const { data, error } = await supabaseAdmin
            .from('experiences')
            .insert({
                hotel_id: hotelId,
                title: createForm.title,
                description: createForm.description || null,
                price: Number(createForm.price),
                image_url: createForm.image_url || null,
            })
            .select()
            .single();
        setCreating(false);
        if (error) { alert('Error al crear: ' + error.message); return; }
        setExperiences([data, ...experiences]);
        setShowCreate(false);
        setCreateForm(EMPTY_FORM);
    };

    // ── Edit ────────────────────────────────────────────────────
    const startEditing = (exp) => { setEditingId(exp.id); setEditForm({ ...exp }); };

    const saveEdit = async () => {
        setSaving(true);
        const { error } = await supabaseAdmin
            .from('experiences')
            .update({
                title: editForm.title,
                description: editForm.description,
                price: Number(editForm.price),
                image_url: editForm.image_url || null,
            })
            .eq('id', editingId);
        setSaving(false);
        if (error) { alert('Error al guardar: ' + error.message); return; }
        setExperiences(experiences.map(e => e.id === editingId ? { ...e, ...editForm } : e));
        setEditingId(null);
    };

    // ── Delete ──────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta experiencia?')) return;
        const { error } = await supabaseAdmin.from('experiences').delete().eq('id', id);
        if (error) { alert('Error al eliminar: ' + error.message); return; }
        setExperiences(experiences.filter(e => e.id !== id));
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Catálogo de Experiencias</h1>
                    <p className="text-zinc-400 mt-1">Servicios y upsells que ven los huéspedes en la app.</p>
                </div>
                <button
                    onClick={() => { setShowCreate(true); setCreateForm(EMPTY_FORM); }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Experiencia</span>
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
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={editForm.image_url || ''}
                                                    onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                                                    placeholder="URL de imagen"
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1 w-40 text-xs outline-none focus:border-emerald-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={editForm.title}
                                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1 w-full text-sm outline-none focus:border-emerald-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={editForm.description || ''}
                                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1 w-full text-sm outline-none focus:border-emerald-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={editForm.price}
                                                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1 w-24 text-sm outline-none focus:border-emerald-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={saveEdit} disabled={saving} className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded transition-colors disabled:opacity-50">
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4">
                                                <div className="w-16 h-12 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center">
                                                    {exp.image_url ? (
                                                        <img src={exp.image_url} alt={exp.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-zinc-600" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-zinc-200">{exp.title}</td>
                                            <td className="px-6 py-4 text-zinc-400 text-sm max-w-xs truncate">{exp.description}</td>
                                            <td className="px-6 py-4 font-bold text-emerald-400">${exp.price}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => startEditing(exp)} className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(exp.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {experiences.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                                        Sin experiencias. Creá la primera con el botón de arriba.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Modal: Nueva Experiencia ── */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold">Nueva Experiencia</h2>
                            <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">Título *</label>
                                <input
                                    type="text"
                                    value={createForm.title}
                                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                                    placeholder="Ej: Desayuno en habitación"
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors text-white placeholder:text-zinc-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">Descripción</label>
                                <textarea
                                    value={createForm.description}
                                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                    placeholder="Descripción breve del servicio..."
                                    rows={3}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors text-white placeholder:text-zinc-600 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">Precio (ARS) *</label>
                                <input
                                    type="number"
                                    value={createForm.price}
                                    onChange={e => setCreateForm({ ...createForm, price: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-1.5">URL de imagen</label>
                                <input
                                    type="text"
                                    value={createForm.image_url}
                                    onChange={e => setCreateForm({ ...createForm, image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors text-white placeholder:text-zinc-600"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating || !createForm.title || !createForm.price}
                                className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
