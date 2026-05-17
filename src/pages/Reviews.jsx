import { useState, useEffect, useMemo } from 'react';
import { Star, Plus, Trash2, X, ChevronDown, MessageSquare, CheckCircle } from 'lucide-react';
import { getReviews, createReview, deleteReview, getGuests } from '../services/api';
import { updateReview } from '../services/api';

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRating({ rating, max = 5, size = 'md' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const color =
    rating <= 2 ? 'text-red-400 fill-red-400' :
    rating === 3 ? 'text-yellow-400 fill-yellow-400' :
    'text-emerald-400 fill-emerald-400';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} ${i < rating ? color : 'text-zinc-700'}`}
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
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-zinc-800 rounded" />
            <div className="h-3 w-24 bg-zinc-800 rounded" />
          </div>
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

// Inline reply form embedded inside a review card
function ReplyForm({ review, onSave, onCancel }) {
  const [text, setText] = useState(review.response_text || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const updated = await updateReview(review.id, { responded: true, response_text: text.trim() });
      onSave(updated);
    } catch {
      // Optimistic fallback
      onSave({ ...review, responded: true, response_text: text.trim() });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Tu respuesta</p>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Escribe una respuesta al huésped…"
        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 resize-none placeholder:text-zinc-600 transition-colors"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {saving ? 'Guardando…' : 'Confirmar respuesta'}
        </button>
        <button
          onClick={onCancel}
          className="text-zinc-500 hover:text-zinc-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'low', label: 'Solo 1–2 ★' },
  { value: 'high', label: 'Solo 5 ★' },
  { value: 'pending', label: 'Sin responder' },
];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [replyingId, setReplyingId] = useState(null);
  const [form, setForm] = useState({ guest_id: '', rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [rRes, gRes] = await Promise.all([getReviews(), getGuests()]);
      setReviews(rRes.data ?? []);
      setGuests(gRes.data ?? []);
    } catch {
      setReviews([]);
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '—';
    const dist = [5, 4, 3, 2, 1].map((s) => ({
      star: s,
      count: reviews.filter((r) => r.rating === s).length,
    }));
    return { total, avg, dist };
  }, [reviews]);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filter === 'low') return r.rating <= 2;
      if (filter === 'high') return r.rating === 5;
      if (filter === 'pending') return !r.responded;
      return true;
    });
  }, [reviews, filter]);

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta reseña?')) return;
    setDeleting(id);
    try {
      await deleteReview(id);
    } catch {
      // best-effort
    } finally {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setDeleting(null);
    }
  }

  function handleReplySave(updated) {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    setReplyingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.guest_id || form.rating === 0) return;
    setSubmitting(true);
    try {
      const res = await createReview(form);
      const guest = guests.find((g) => g.id === form.guest_id);
      setReviews((prev) => [
        {
          ...res.data,
          guests: guest ? { name: guest.name, email: guest.email || '' } : null,
          responded: false,
        },
        ...prev,
      ]);
    } catch {
      // silently ignore — user can refresh
    } finally {
      setSubmitting(false);
      setShowModal(false);
      setForm({ guest_id: '', rating: 0, comment: '' });
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* ── Header ── */}
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

      {/* ── Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
            <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-wider">Promedio</p>
            <p className="text-4xl font-bold text-white leading-none mt-1">{loading ? '—' : stats.avg}</p>
            {!loading && stats.total > 0 && (
              <div className="mt-1.5">
                <StarRating rating={Math.round(Number(stats.avg))} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <MessageSquare className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-xs uppercase tracking-wider">Total Reseñas</p>
            <p className="text-4xl font-bold text-white leading-none mt-1">{loading ? '—' : stats.total}</p>
            {!loading && (
              <p className="text-zinc-500 text-xs mt-1.5">
                {reviews.filter((r) => !r.responded).length} sin responder
              </p>
            )}
          </div>
        </div>

        {/* Distribution */}
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

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`text-sm px-4 py-2 rounded-xl border transition-colors ${
              filter === opt.value
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Review list ── */}
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : reviews.length === 0 ? (
        /* Empty state — no reviews at all */
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-zinc-700" />
          </div>
          <p className="text-zinc-300 font-medium">Aún no hay reseñas</p>
          <p className="text-zinc-600 text-sm mt-1 max-w-xs">
            Las reseñas de tus huéspedes aparecerán aquí. Podés agregar la primera con el botón superior.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state — filter has no results */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <ChevronDown className="w-7 h-7 text-zinc-700" />
          </div>
          <p className="text-zinc-400 font-medium">Sin resultados</p>
          <p className="text-zinc-600 text-sm mt-1">Probá cambiando el filtro activo</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((review) => {
            const guestName = review.guests?.name || 'Huésped desconocido';
            const initial = guestName[0].toUpperCase();
            const isReplying = replyingId === review.id;

            return (
              <div
                key={review.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-sm font-bold text-black shrink-0 mt-0.5">
                    {initial}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      {/* Name + badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">{guestName}</span>
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

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!isReplying && (
                          <button
                            onClick={() => setReplyingId(review.id)}
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-400 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-500/10"
                            title="Responder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Responder</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={deleting === review.id}
                          className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40 p-1 rounded-lg"
                          title="Eliminar reseña"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stars + date */}
                    <div className="flex items-center gap-3 mt-1">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-zinc-500 text-xs">{formatDate(review.created_at)}</span>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{review.comment}</p>
                    )}

                    {/* Existing response text (if responded and not currently editing) */}
                    {review.responded && review.response_text && !isReplying && (
                      <div className="mt-3 pt-3 border-t border-zinc-800">
                        <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">
                          Respuesta del hotel
                        </p>
                        <p className="text-zinc-400 text-sm leading-relaxed">{review.response_text}</p>
                      </div>
                    )}

                    {/* Inline reply form */}
                    {isReplying && (
                      <ReplyForm
                        review={review}
                        onSave={handleReplySave}
                        onCancel={() => setReplyingId(null)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── New review modal ── */}
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
                  <p className="text-zinc-600 text-xs mt-1">Hacé clic en una estrella para calificar</p>
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
