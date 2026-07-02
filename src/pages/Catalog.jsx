import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Loader2, ImageIcon } from 'lucide-react';

const CATEGORIES = [
    { value: 'room_service',  label: '🍽 Room Service' },
    { value: 'spa',           label: '💆 Spa & Bienestar' },
    { value: 'actividad',     label: '🏄 Actividades' },
    { value: 'transporte',    label: '🚗 Transporte' },
    { value: 'housekeeping',  label: '🧹 Housekeeping' },
    { value: 'otro',          label: '📦 Otro' },
];

const EMPTY_FORM = { title: '', description: '', price: '', image_url: '', category: 'room_service' };

function getCategoryLabel(value) {
    return CATEGORIES.find(c => c.value === value)?.label || value;
}

export default function Catalog() {
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hotelId, setHotelId] = useState('');
    const [filterCat, setFilterCat] = useState('all');

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);

    useEffect(() => { init(); }, []);

    const init = async () => {
        setLoading(true);
        const hotelRef = localStorage.getItem('hotel_id') || 'demo';
        let { data: hotel } = await supabaseAdmin.from('hotels').select('id').eq('slug', hotelRef).maybeSingle();
        if (!hotel) {
            const { data: byId } = await supabaseAdmin.from('hotels').select('id').eq('id', hotelRef).maybeSingle();
            hotel = byId;
        }
        if (hotel) {
            setHotelId(hotel.id);
            await fetchExperiences(hotel.id);
        }
        setLoading(false);
    };

    const fetchExperiences = async (hId) => {
        const { data } = await supabaseAdmin
            .from('experiences')
            .select('id, title, description, price, image_url, category, created_at')
            .eq('hotel_id', hId)
            .order('category')
            .order('title');
        setExperiences(data || []);
    };

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
                category: createForm.category || 'room_service',
            })
            .select().single();
        setCreating(false);
        if (error) { alert('Error al crear: ' + error.message); return; }
        setExperiences([data, ...experiences]);
        setShowCreate(false);
        setCreateForm(EMPTY_FORM);
    };

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
                category: editForm.category || 'room_service',
            })
            .eq('id', editingId);
        setSaving(false);
        if (error) { alert('Error al guardar: ' + error.message); return; }
        setExperiences(experiences.map(e => e.id === editingId ? { ...e, ...editForm } : e));
        setEditingId(null);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este ítem?')) return;
        const { error } = await supabaseAdmin.from('experiences').delete().eq('id', id);
        if (error) { alert('Error al eliminar: ' + error.message); return; }
        setExperiences(experiences.filter(e => e.id !== id));
    };

    const filtered = filterCat === 'all' ? experiences : experiences.filter(e => e.category === filterCat);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Catálogo de Servicios</h1>
                    <p className="text-zinc-400 mt-1">Room service, spa, actividades y más.</p>
                </div>
                <button
                    onClick={() => { setShowCreate(true); setCreateForm(EMPTY_FORM); }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors"
                >
                    <Plus className="w-4 h-4" /><span>Nuevo ítem</span>
                </button>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-6">
                <button onClick={() => setFilterCat('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === 'all' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                    Todos ({experiences.length})
                </button>
                {CATEGORIES.map(c => {
                    const count = experiences.filter(e => e.category === c.value).length;
                    if (count === 0) return null;
                    return (
                        <button key={c.value} onClick={() => setFilterCat(c.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === c.value ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                            {c.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                            <h2 className="font-bold text-lg">Nuevo ítem del catálogo</h2>
                            <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide">Categoría</label>
                                <select value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide">Título</label>
                                <input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                                    placeholder="Ej: Desayuno continental"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide">Descripción</label>
                                <input value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                    placeholder="Descripción breve"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide">Precio</label>
                                    <input type="number" value={createForm.price} onChange={e => setCreateForm({ ...createForm, price: e.target.value })}
                                        placeholder="0"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide">URL imagen</label>
                                    <input value={createForm.image_url} onChange={e => setCreateForm({ ...createForm, image_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm">Cancelar</button>
                                <button onClick={handleCreate} disabled={creating || !createForm.title || !createForm.price}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Crear ítem
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-950/50 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                            <tr>
                                <th className="px-4 py-4">Imagen</th>
                                <th className="px-4 py-4">Categoría</th>
                                <th className="px-4 py-4">Título</th>
                                <th className="px-4 py-4">Descripción</th>
                                <th className="px-4 py-4">Precio</th>
                                <th className="px-4 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filtered.map((exp) => (
                                <tr key={exp.id} className="hover:bg-zinc-800/50 transition-colors">
                                    {editingId === exp.id ? (
                                        <>
                                            <td className="px-4 py-3">
                                                <input type="text" value={editForm.image_url || ''} onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                                                    placeholder="URL imagen" className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 w-32 text-xs outline-none focus:border-emerald-500" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select value={editForm.category || 'room_service'} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500">
                                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 w-full text-sm outline-none focus:border-emerald-500" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input type="text" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 w-full text-sm outline-none focus:border-emerald-500" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                                    className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 w-20 text-sm outline-none focus:border-emerald-500" />
                                            </td>
                                            <td className="px-4 py-3 text-right">
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
                                            <td className="px-4 py-3">
                                                <div className="w-14 h-10 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center">
                                                    {exp.image_url ? <img src={exp.image_url} alt={exp.title} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-zinc-600" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full">{getCategoryLabel(exp.category)}</span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-zinc-200">{exp.title}</td>
                                            <td className="px-4 py-3 text-zinc-400 text-sm max-w-xs truncate">{exp.description}</td>
                                            <td className="px-4 py-3 font-bold text-emerald-400">${exp.price}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => startEditing(exp)} className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(exp.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-zinc-500">
                                    {experiences.length === 0 ? 'Sin ítems. Creá el primero con el botón de arriba.' : 'Sin ítems en esta categoría.'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
