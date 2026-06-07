import React, { useEffect, useState, useCallback } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import {
  Users, BedDouble, MessageSquare, ShoppingBag,
  RefreshCw, Calendar, Clock, TrendingUp, CheckCircle2,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function StatusBadge({ status }) {
  const map = {
    checked_in:  { label: 'In House',   cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    pending:     { label: 'Pendiente',  cls: 'bg-yellow-500/10  text-yellow-400  border-yellow-500/30'  },
    checked_out: { label: 'Check-out',  cls: 'bg-zinc-700/40    text-zinc-400    border-zinc-600/40'    },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-zinc-700/40 text-zinc-400 border-zinc-600/40' };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}

function KpiCard({ icon: Icon, label, value, color = 'text-emerald-500', bg = 'bg-emerald-500/10' }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <span className="text-3xl font-bold text-white tabular-nums">{value ?? '—'}</span>
      </div>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-zinc-800 rounded-lg" />
        <div className="w-16 h-8 bg-zinc-800 rounded-lg" />
      </div>
      <div className="w-24 h-4 bg-zinc-800 rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center space-x-4 py-3 animate-pulse px-6">
      <div className="w-8 h-8 bg-zinc-800 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="w-32 h-3 bg-zinc-800 rounded" />
        <div className="w-20 h-3 bg-zinc-800 rounded" />
      </div>
      <div className="w-16 h-5 bg-zinc-800 rounded-full" />
    </div>
  );
}

export default function Dashboard() {
  const name = localStorage.getItem('name') || 'Admin';

  const [kpis, setKpis]               = useState(null);
  const [reservations, setReservations] = useState([]);
  const [pendingReqs, setPendingReqs]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hotelSlug = localStorage.getItem('hotel_id') || 'demo';
      const { data: hotel, error: hotelErr } = await supabaseAdmin
        .from('hotels').select('id').eq('slug', hotelSlug).single();
      if (hotelErr || !hotel) throw new Error('Hotel no encontrado');
      const hId = hotel.id;

      // ── Parallel fetches ─────────────────────────────────────
      const [resRes, reqRes, convRes] = await Promise.all([
        supabaseAdmin
          .from('reservations')
          .select('id, room_number, check_in, check_out, status, guest_id')
          .eq('hotel_id', hId)
          .order('check_in', { ascending: false })
          .limit(20),
        supabaseAdmin
          .from('requests')
          .select('id, status, total_price, created_at, guest_id, experience_id')
          .eq('hotel_id', hId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabaseAdmin
          .from('conversations')
          .select('id, guest_id, status')
          .eq('hotel_id', hId),
      ]);

      const allReservations = resRes.data  || [];
      const allRequests     = reqRes.data  || [];
      const allConversations = convRes.data || [];

      // ── Two-step: guest names ────────────────────────────────
      const guestIds = [...new Set([
        ...allReservations.map(r => r.guest_id),
        ...allRequests.map(r => r.guest_id),
      ].filter(Boolean))];

      let guestsMap = {};
      if (guestIds.length > 0) {
        const { data: guestsData } = await supabaseAdmin
          .from('guests').select('id, name, email').in('id', guestIds);
        if (guestsData) guestsMap = Object.fromEntries(guestsData.map(g => [g.id, g]));
      }

      // ── Two-step: experience titles for pending requests ─────
      const pendingRequests = allRequests.filter(r => r.status === 'pending');
      const expIds = [...new Set(pendingRequests.map(r => r.experience_id).filter(Boolean))];
      let expMap = {};
      if (expIds.length > 0) {
        const { data: exps } = await supabaseAdmin
          .from('experiences').select('id, title').in('id', expIds);
        if (exps) expMap = Object.fromEntries(exps.map(e => [e.id, e.title]));
      }

      // ── KPIs ────────────────────────────────────────────────
      setKpis({
        in_house:     allReservations.filter(r => r.status === 'checked_in').length,
        pending_arr:  allReservations.filter(r => r.status === 'pending').length,
        pending_reqs: pendingRequests.length,
        conversations: allConversations.length,
      });

      // ── Reservations list (top 5) ───────────────────────────
      setReservations(
        allReservations.slice(0, 5).map(r => ({
          ...r,
          guestName: guestsMap[r.guest_id]?.name || 'Huésped',
        }))
      );

      // ── Pending requests (top 5) ────────────────────────────
      setPendingReqs(
        pendingRequests.slice(0, 5).map(r => ({
          ...r,
          guestName: guestsMap[r.guest_id]?.name || 'Huésped',
          expTitle:  expMap[r.experience_id] || 'Servicio',
        }))
      );

    } catch (err) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const kpiDefs = kpis ? [
    { icon: BedDouble,     label: 'Huéspedes in house',    value: kpis.in_house,     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { icon: Calendar,      label: 'Llegadas pendientes',   value: kpis.pending_arr,  color: 'text-yellow-400',  bg: 'bg-yellow-500/10'  },
    { icon: ShoppingBag,   label: 'Pedidos pendientes',    value: kpis.pending_reqs, color: 'text-orange-400',  bg: 'bg-orange-500/10'  },
    { icon: MessageSquare, label: 'Conversaciones totales', value: kpis.conversations, color: 'text-blue-400',  bg: 'bg-blue-500/10'    },
  ] : [];

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bienvenido, {name}</h1>
          <p className="text-zinc-400 mt-1">Resumen de actividad en tiempo real.</p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg px-3 py-2 transition-colors disabled:opacity-40">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={fetchAll} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-3 py-1.5 transition-colors">
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : kpiDefs.map(k => <KpiCard key={k.label} {...k} />)
        }
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Reservas recientes */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h2 className="font-semibold text-white text-sm">Reservas recientes</h2>
            </div>
          </div>
          <div className="divide-y divide-zinc-800">
            {loading ? (
              [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
            ) : reservations.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <BedDouble className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">Sin reservas.</p>
              </div>
            ) : (
              reservations.map(res => (
                <div key={res.id} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-800/40 transition-colors">
                  <div className="w-8 h-8 bg-zinc-800 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-zinc-400">
                    {res.guestName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{res.guestName}</p>
                    <p className="text-xs text-zinc-500">
                      Hab. {res.room_number || '—'} · {formatDate(res.check_in)} → {formatDate(res.check_out)}
                    </p>
                  </div>
                  <StatusBadge status={res.status} />
                </div>
              ))
            )}
          </div>

          {/* Mini bar chart by status */}
          {!loading && reservations.length > 0 && (
            <div className="px-6 py-4 border-t border-zinc-800 flex gap-4">
              {[
                { key: 'checked_in', label: 'In house',   color: 'bg-emerald-500' },
                { key: 'pending',    label: 'Llegando',   color: 'bg-yellow-500'  },
                { key: 'checked_out',label: 'Check-out',  color: 'bg-zinc-600'    },
              ].map(({ key, label, color }) => {
                const count = reservations.filter(r => r.status === key).length;
                const pct = Math.round((count / reservations.length) * 100);
                return (
                  <div key={key} className="flex-1">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>{label}</span><span>{count}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pedidos pendientes */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange-400" />
              <h2 className="font-semibold text-white text-sm">Pedidos pendientes</h2>
            </div>
            {!loading && pendingReqs.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                {pendingReqs.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-zinc-800">
            {loading ? (
              [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
            ) : pendingReqs.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">Sin pedidos pendientes.</p>
              </div>
            ) : (
              pendingReqs.map(req => (
                <div key={req.id} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-800/40 transition-colors">
                  <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-orange-400">
                    {req.guestName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{req.expTitle}</p>
                    <p className="text-xs text-zinc-500">
                      {req.guestName} · <span className="flex items-center gap-1 inline-flex"><Clock className="w-3 h-3" /> {timeAgo(req.created_at)}</span>
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 flex-shrink-0">${req.total_price}</span>
                </div>
              ))
            )}
          </div>
          {!loading && pendingReqs.length > 0 && (
            <div className="px-6 py-3 border-t border-zinc-800">
              <a href="/requests" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                Ver todos los pedidos →
              </a>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
