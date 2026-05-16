import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  BedDouble,
  MessageSquare,
  MessagesSquare,
  RefreshCw,
  TrendingUp,
  Calendar,
  Phone,
  Clock,
} from 'lucide-react';
import { getAnalytics, getReservations, getGuests } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

// ── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    in_house:    { label: 'In House',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    checked_in:  { label: 'In House',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    pending:     { label: 'Pendiente',    cls: 'bg-yellow-500/10  text-yellow-400  border-yellow-500/30'  },
    checked_out: { label: 'Check-out',    cls: 'bg-zinc-700/40    text-zinc-400    border-zinc-600/40'    },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-zinc-700/40 text-zinc-400 border-zinc-600/40' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

// ── Skeleton card ─────────────────────────────────────────────
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
    <div className="flex items-center space-x-4 py-3 animate-pulse">
      <div className="w-8 h-8 bg-zinc-800 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="w-32 h-3 bg-zinc-800 rounded" />
        <div className="w-20 h-3 bg-zinc-800 rounded" />
      </div>
      <div className="w-16 h-5 bg-zinc-800 rounded-full" />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
          <Icon className={`w-5 h-5 ${accent ?? 'text-emerald-500'}`} />
        </div>
        <span className="text-3xl font-bold text-white tabular-nums">
          {value ?? '—'}
        </span>
      </div>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function Dashboard() {
  const hotel_id = localStorage.getItem('hotel_id');
  const name     = localStorage.getItem('name') || 'Admin';

  const [analytics, setAnalytics]       = useState(null);
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests]             = useState([]);

  const [loadingKpi,  setLoadingKpi]  = useState(true);
  const [loadingRes,  setLoadingRes]  = useState(true);
  const [loadingGuests, setLoadingGuests] = useState(true);

  const [errorKpi,  setErrorKpi]  = useState(null);
  const [errorRes,  setErrorRes]  = useState(null);
  const [errorGuests, setErrorGuests] = useState(null);

  // ── Fetch functions ───────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setLoadingKpi(true);
    setErrorKpi(null);
    try {
      const { data } = await getAnalytics(hotel_id);
      setAnalytics(data);
    } catch (err) {
      setErrorKpi(err?.response?.data?.error || 'Error al cargar métricas');
    } finally {
      setLoadingKpi(false);
    }
  }, [hotel_id]);

  const fetchReservations = useCallback(async () => {
    setLoadingRes(true);
    setErrorRes(null);
    try {
      const { data } = await getReservations(hotel_id);
      // Accept array or { reservations: [] }
      const list = Array.isArray(data) ? data : (data?.reservations ?? []);
      setReservations(list.slice(0, 5));
    } catch (err) {
      setErrorRes(err?.response?.data?.error || 'Error al cargar reservas');
    } finally {
      setLoadingRes(false);
    }
  }, [hotel_id]);

  const fetchGuests = useCallback(async () => {
    setLoadingGuests(true);
    setErrorGuests(null);
    try {
      const { data } = await getGuests(hotel_id);
      const list = Array.isArray(data) ? data : (data?.guests ?? []);
      setGuests(list.slice(0, 6));
    } catch (err) {
      setErrorGuests(err?.response?.data?.error || 'Error al cargar huéspedes');
    } finally {
      setLoadingGuests(false);
    }
  }, [hotel_id]);

  useEffect(() => {
    fetchAnalytics();
    fetchReservations();
    fetchGuests();
  }, [fetchAnalytics, fetchReservations, fetchGuests]);

  // ── KPI definitions ───────────────────────────────────────
  const kpis = [
    { icon: Users,          label: 'Total huéspedes',       value: analytics?.total_guests },
    { icon: BedDouble,      label: 'Reservas activas',      value: analytics?.active_reservations },
    { icon: MessageSquare,  label: 'Mensajes hoy',          value: analytics?.messages_today },
    { icon: MessagesSquare, label: 'Total conversaciones',  value: analytics?.total_conversations },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bienvenido, {name}</h1>
        <p className="text-zinc-400 mt-1">Aquí está el resumen de actividad de tu hotel.</p>
      </div>

      {/* ── KPI Row ─────────────────────────────────────── */}
      {loadingKpi ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : errorKpi ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-center justify-between">
          <p className="text-red-400 text-sm">{errorKpi}</p>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reintentar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      )}

      {/* ── Bottom sections ──────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Estado de reservas */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h2 className="font-semibold text-white text-sm">Estado de reservas</h2>
            </div>
            {!loadingRes && (
              <button onClick={fetchReservations} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="divide-y divide-zinc-800">
            {loadingRes ? (
              <div className="px-6 py-2">
                {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : errorRes ? (
              <div className="px-6 py-8 flex flex-col items-center gap-3">
                <p className="text-red-400 text-sm text-center">{errorRes}</p>
                <button
                  onClick={fetchReservations}
                  className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Reintentar
                </button>
              </div>
            ) : reservations.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <BedDouble className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">Aún no hay reservas para mostrar.</p>
              </div>
            ) : (
              reservations.map((res) => {
                const guestName = res.guest_name
                  ?? (res.guests ? `${res.guests.first_name ?? ''} ${res.guests.last_name ?? ''}`.trim() : null)
                  ?? res.first_name
                  ?? 'Huésped';
                const room      = res.room_number ?? res.room ?? '—';
                const checkIn   = res.check_in   ?? res.checkin_date;
                const checkOut  = res.check_out  ?? res.checkout_date;
                const status    = res.status ?? 'pending';

                return (
                  <div key={res.id} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-800/40 transition-colors">
                    <div className="w-8 h-8 bg-zinc-800 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-zinc-400">
                      {guestName[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{guestName}</p>
                      <p className="text-xs text-zinc-500">
                        Hab. {room} &nbsp;·&nbsp; {formatDate(checkIn)} → {formatDate(checkOut)}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                );
              })
            )}
          </div>

          {/* Resumen rápido de reservas por estado (barras CSS) */}
          {!loadingRes && !errorRes && reservations.length > 0 && (
            <div className="px-6 py-4 border-t border-zinc-800 flex gap-4">
              {[
                { key: ['in_house', 'checked_in'], label: 'In house',   color: 'bg-emerald-500' },
                { key: ['pending'],                 label: 'Pendientes', color: 'bg-yellow-500'  },
                { key: ['checked_out'],             label: 'Check-out',  color: 'bg-zinc-600'    },
              ].map(({ key, label, color }) => {
                const count = reservations.filter(r => key.includes(r.status)).length;
                const pct   = reservations.length ? Math.round((count / reservations.length) * 100) : 0;
                return (
                  <div key={label} className="flex-1">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>{label}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Huéspedes recientes */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h2 className="font-semibold text-white text-sm">Actividad reciente</h2>
            </div>
            {!loadingGuests && (
              <button onClick={fetchGuests} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="divide-y divide-zinc-800">
            {loadingGuests ? (
              <div className="px-6 py-2">
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : errorGuests ? (
              <div className="px-6 py-8 flex flex-col items-center gap-3">
                <p className="text-red-400 text-sm text-center">{errorGuests}</p>
                <button
                  onClick={fetchGuests}
                  className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Reintentar
                </button>
              </div>
            ) : guests.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Users className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">Aún no hay huéspedes para mostrar.</p>
              </div>
            ) : (
              guests.map((guest) => {
                const fullName = guest.name
                  ?? `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim()
                  || 'Huésped';
                const phone    = guest.phone ?? guest.phone_number ?? '—';
                const lastSeen = guest.updated_at ?? guest.created_at ?? null;

                return (
                  <div key={guest.id} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-800/40 transition-colors">
                    <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-emerald-400">
                      {fullName[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{fullName}</p>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {phone}
                        </span>
                        {lastSeen && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(lastSeen)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Stat secundaria: reservas del mes (viene de analytics) */}
          {!loadingKpi && !errorKpi && analytics?.reservations_month != null && (
            <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Reservas este mes</span>
              <span className="text-sm font-bold text-emerald-400">{analytics.reservations_month}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
