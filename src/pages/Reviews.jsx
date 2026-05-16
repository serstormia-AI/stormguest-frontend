import { useState, useEffect, useMemo } from 'react';
import { Star, Plus, Trash2, X, ChevronDown } from 'lucide-react';
import { getReviews, createReview, deleteReview, getGuests } from '../services/api';

const MOCK_REVIEWS = [
  {
    id: '1',
    guest_id: 'g1',
    rating: 5,
    comment: 'Excelente servicio, habitaciones impecables. Volveré sin dudarlo.',
    created_at: '2024-05-10T14:23:00Z',
    responded: true,
    guests: { name: 'María González', email: 'maria@example.com' },
  },
  {
    id: '2',
    guest_id: 'g2',
    rating: 4,
    comment: 'Muy buena estadía, el desayuno fue espectacular.',
    created_at: '2024-05-08T09:10:00Z',
    responded: false,
    guests: { name: 'Carlos Ruiz', email: 'carlos@example.com' },
  },
  {
    id: '3',
    guest_id: 'g3',
    rating: 3,
    comment: 'Regular, la habitación estaba bien pero el Wi-Fi fallaba.',
    created_at: '2024-05-05T18:45:00Z',
    responded: false,
    guests: { name: 'Ana Torres', email: 'ana@example.com' },
  },
  {
    id: '4',
    guest_id: 'g4',
    rating: 5,
    comment: 'Increíble experiencia. El personal fue muy atento.',
    created_at: '2024-05-01T11:30:00Z',
    responded: true,
    guests: { name: 'Luis Martínez', email: 'luis@example.com' },
  },
  {
    id: '5',
    guest_id: 'g5',
    rating: 2,
    comment: 'Esperaba más. El ruido nocturno fue un problema.',
    created_at: '2024-04-28T20:00:00Z',
    responded: false,
    guests: { name: 'Sofía Ramírez', email: 'sofia@example.com' },
  },
];

const MOCK_GUESTS = [
  { id: 'g1', name: 'María González' },
  { id: 'g2', name: 'Carlos Ruiz' },
  { id: 'g3', name: 'Ana Torres' },
  { id: 'g4', name: 'Luis Martínez' },
  { id: 'g5', name: 'Sofía Ramírez' },
];

function StarRating({ rating, max = 5, size = 'md' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starVal = i + 1;
        const filled = starVal <= (hovered || value);
        return (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHovered(starVal)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(starVal)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 ${filled ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`}
            />
          </button>
        );
      })}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-zinc-800 rounded" />
          <div className="h-3 w-24 bg-zinc-800 rounded" />
        </div>
        <div className="h-4 w-20 bg-zinc-800 rounded" />
      </div>
      <div className="h-3 w-full bg-zinc-800 rounded mb-2" />
      <div className="h-3 w-3/4 bg-zinc-800 rounded" />
    </div>
  );
}

function StatBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-zinc-400 w-4 text-right">{star}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-zinc-500 w-6 text-right">{count}</span>
    </div>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ guest_id: '', rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [rRes, gRes] = await Promise.all([getReviews(), getGuests()]);
      setReviews(rRes.data.length > 0 ? rRes.data : MOCK_REVIEWS);
      setGuests(gRes.data.length > 0 ? gRes.data : MOCK_GUESTS);
    } catch {
      setReviews(MOCK_REVIEWS);
      setGuests(MOCK_GUESTS);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filterRating !== 'all' && r.rating !== Number(filterRating)) return false;
      if (filterStatus === 'responded' && !r.responded) return false;
      if (filterStatus === 'pending' && r.responded) return false;
      return true;
    });
  }, [reviews, filterRating, filterStatus]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '—';
    const dist = [5, 4, 3, 2, 1].map((s) => ({
      star: s,
      count: reviews.filter((r) => r.rating === s).length,
    }));
    return { total, avg, dist };
  }, [reviews]);

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta reseña?')) return;
    setDeleting(id);
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.guest_id || form.rating === 0) return;
    setSubmitting(true);
    try {
      const res = await createReview(form);
      const guest = guests.find((g) => g.id === form.guest_id);
      const newReview = {
        ...res.data,
        guests: guest ? { name: guest.name, email: guest.email || '' } : { name: 'Desconocido', email: '' },
        responded: false,
      };
      setReviews((prev) => [newReview, ...prev]);
    } catch {
      const guest = guests.find((g) => g.id === form.guest_id);
      const mockNew = {
        id: Date.now().toString(),
        ...form,
        created_at: new Date().toISOString(),
        responded: false,
        guests: guest ? { name: guest.name } : { name: 'Desconocido' },
      };
      setReviews((prev) => [mockNew, ...prev]);
    } finally {
      setSubmitting(false);
      setShowModal(false);
      setForm({ guest_id: '', rating: 0, comment: '' });
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reseñas de Huéspedes</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {loading ? '—' : `${stats.total} reseña${stats.total !== 1 ? 's' : ''} en total`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Reseña
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-wider">Promedio</p>
            <p className="text-3xl font-bold text-white">{loading ? '—' : stats.avg}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <span className="text-emerald-400 font-bold text-lg">#</span>
          </div>
          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-wider">Total Reseñas</p>
            <p className="text-3xl font-bold text-white">{loading ? '—' : stats.total}</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Distribución</p>
          {loading ? (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((s) => (
                <div key={s} className="h-3 bg-zinc-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {stats.dist.map(({ star, count }) => (
                <StatBar key={star} star={star} count={count} total={stats.total} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-xl px-4 py-2.5 pr-8 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Todas las estrellas</option>
            {[5, 4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>{s} estrella{s !== 1 ? 's' : ''}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-xl px-4 py-2.5 pr-8 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Todas</option>
            <option value="responded">Respondidas</option>
            <option value="pending">Sin responder</option>
          </select>
          <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-zinc-700" />
          </div>
          <p className="text-zinc-400 font-medium">No hay reseñas</p>
          <p className="text-zinc-600 text-sm mt-1">
            {filterRating !== 'all' || filterStatus !== 'all'
              ? 'Prueba cambiando los filtros'
              : 'Agrega la primera reseña con el botón superior'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((review) => (
            <div
              key={review.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-sm font-bold text-black shrink-0">
                    {(review.guests?.name || 'H')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">
                        {review.guests?.name || 'Huésped desconocido'}
                      </span>
                      {review.responded ? (
                        <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Respondida
                        </span>
                      ) : (
                        <span className="text-xs bg-zinc-800 text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">
                          Sin responder
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-zinc-500 text-xs">{formatDate(review.created_at)}</span>
                    </div>
                    {review.comment && (
                      <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deleting === review.id}
                  className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40 p-1"
                  title="Eliminar reseña"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Nueva Reseña</h2>
              <button
                onClick={() => { setShowModal(false); setForm({ guest_id: '', rating: 0, comment: '' }); }}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Huésped</label>
                <select
                  value={form.guest_id}
                  onChange={(e) => setForm((f) => ({ ...f, guest_id: e.target.value }))}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500"
                >
                  <option value="">Seleccionar huésped…</option>
                  {guests.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">Calificación</label>
                <StarPicker value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
                {form.rating === 0 && (
                  <p className="text-zinc-600 text-xs mt-1">Haz clic en una estrella para calificar</p>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">Comentario</label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  rows={4}
                  placeholder="Escribe el comentario del huésped…"
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 resize-none placeholder:text-zinc-600"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm({ guest_id: '', rating: 0, comment: '' }); }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || form.rating === 0 || !form.guest_id}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  {submitting ? 'Guardando…' : 'Guardar Reseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
