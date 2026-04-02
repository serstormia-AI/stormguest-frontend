import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getHotels, createHotel } from "../services/api";

// ============================================================
// DESIGN SYSTEM - Luxury SaaS, dark mode, sharp accents
// Inspired by: Vercel + Linear + Stripe dashboard aesthetics
// Font: Syne (display) + DM Mono (data)
// ============================================================

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --bg: #03050a;
    --surface: #080d18;
    --surface2: #0d1526;
    --border: #111d35;
    --border2: #1a2d50;
    --text: #e8edf5;
    --text2: #7a8ba8;
    --text3: #3d4f6b;
    --accent: #2563eb;
    --accent2: #3b82f6;
    --accent-glow: rgba(37,99,235,0.15);
    --green: #10b981;
    --amber: #f59e0b;
    --red: #ef4444;
    --purple: #8b5cf6;
    --cyan: #06b6d4;
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

  .syne { font-family: 'Syne', sans-serif; }
  .mono { font-family: 'DM Mono', monospace; }

  input, textarea, select {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    color: var(--text);
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    width: 100%;
    transition: border-color 0.15s;
  }
  input:focus, textarea:focus, select:focus { border-color: var(--accent2); }
  input::placeholder { color: var(--text3); }

  button { cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }

  .btn-primary {
    background: var(--accent);
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    color: #fff;
    font-weight: 600;
    font-size: 13px;
  }
  .btn-primary:hover { background: var(--accent2); transform: translateY(-1px); }

  .btn-ghost {
    background: transparent;
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 9px 18px;
    color: var(--text2);
    font-size: 13px;
  }
  .btn-ghost:hover { border-color: var(--accent2); color: var(--accent2); }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 22px;
  }

  .badge {
    display: inline-flex; align-items: center;
    border-radius: 20px; padding: 3px 10px;
    font-size: 11px; font-weight: 600;
    gap: 5px;
  }
  .badge-green { background: rgba(16,185,129,0.12); color: var(--green); border: 1px solid rgba(16,185,129,0.2); }
  .badge-amber { background: rgba(245,158,11,0.12); color: var(--amber); border: 1px solid rgba(245,158,11,0.2); }
  .badge-red { background: rgba(239,68,68,0.12); color: var(--red); border: 1px solid rgba(239,68,68,0.2); }
  .badge-blue { background: rgba(37,99,235,0.12); color: var(--accent2); border: 1px solid rgba(37,99,235,0.2); }
  .badge-purple { background: rgba(139,92,246,0.12); color: var(--purple); border: 1px solid rgba(139,92,246,0.2); }

  .row { display: flex; align-items: center; }
  .col { display: flex; flex-direction: column; }
  .gap4 { gap: 4px; }
  .gap8 { gap: 8px; }
  .gap12 { gap: 12px; }
  .gap16 { gap: 16px; }
  .gap20 { gap: 20px; }
  .gap24 { gap: 24px; }
  .between { justify-content: space-between; }
  .center { align-items: center; }

  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
`;

// ============================================================
// MOCK DATA
// ============================================================
const MOCK_HOTELS = [
  { id: "h1", name: "Hotel Interamericano", location: "Bariloche, Argentina", plan: "Pro", status: "active", guests: 1247, revenue_month: 4820, conversations_today: 34, whatsapp: "+5492944123456", created: "2024-01-15", bot_active: true, modules: ["reservas", "huespedes", "automatizacion", "marketing"] },
  { id: "h2", name: "Llao Llao Resort", location: "Bariloche, Argentina", plan: "Pro", status: "active", guests: 3841, revenue_month: 12340, conversations_today: 89, whatsapp: "+5492944987654", created: "2024-02-01", bot_active: true, modules: ["reservas", "huespedes", "automatizacion", "marketing"] },
  { id: "h3", name: "Hotel Peuma Hue", location: "Patagonia, Argentina", plan: "Starter", status: "trial", guests: 234, revenue_month: 890, conversations_today: 8, whatsapp: "+5492944555444", created: "2024-02-20", bot_active: true, modules: ["reservas", "huespedes"] },
  { id: "h4", name: "Hostería El Retorno", location: "Villa La Angostura", plan: "Starter", status: "active", guests: 567, revenue_month: 1240, conversations_today: 12, whatsapp: "+5492972888777", created: "2024-01-28", bot_active: false, modules: ["reservas"] },
  { id: "h5", name: "Apart Las Vertientes", location: "San Martín de los Andes", plan: "Trial", status: "trial", guests: 45, revenue_month: 0, conversations_today: 3, whatsapp: "+5492972111222", created: "2024-02-25", bot_active: true, modules: [] },
];

const MOCK_METRICS = {
  total_hotels: 5,
  active_hotels: 4,
  total_mrr: 1745,
  total_conversations: 146,
  total_revenue_generated: 19290,
  avg_roi: "11.2x",
  new_hotels_month: 2,
  churn_rate: 0,
};

const PLANS = [
  { id: "starter", name: "Starter", price: 170, color: "#10b981", modules: ["Reservas ($90)", "Huéspedes ($80)"], tokens_included: "3.000 conv/mes" },
  { id: "pro", name: "Pro", price: 350, color: "#3b82f6", modules: ["Reservas", "Huéspedes", "Automatización", "Marketing"], tokens_included: "10.000 conv/mes", popular: true },
  { id: "enterprise", name: "Enterprise", price: null, color: "#8b5cf6", modules: ["Todo incluido", "Onboarding dedicado", "SLA 99.9%", "Multi-branch"], tokens_included: "Ilimitado" },
];

const ONBOARDING_STEPS = [
  { id: 1, label: "Datos del hotel", icon: "🏨" },
  { id: 2, label: "Servicios & precios", icon: "💰" },
  { id: 3, label: "Configurar bot", icon: "🤖" },
  { id: 4, label: "Conectar WhatsApp", icon: "📱" },
  { id: 5, label: "Listo!", icon: "🚀" },
];

// ============================================================
// UTILS
// ============================================================
const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n;
const fmtMoney = (n) => `$${n?.toLocaleString() || 0}`;
const planColor = { Pro: "#3b82f6", Starter: "#10b981", Trial: "#f59e0b", Enterprise: "#8b5cf6" };
const statusBadge = { active: "badge-green", trial: "badge-amber", inactive: "badge-red" };
const statusLabel = { active: "Activo", trial: "Trial", inactive: "Inactivo" };

// ============================================================
// MINI COMPONENTS
// ============================================================

function Dot({ color, pulse }) {
  return <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} className={pulse ? "pulse" : ""} />;
}

function KpiCard({ icon, label, value, sub, color = "var(--accent2)", trend }) {
  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div className="syne" style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 5, fontWeight: 600 }}>{sub}</div>}
      {trend && <div style={{ fontSize: 11, color: trend > 0 ? "var(--green)" : "var(--red)", marginTop: 5 }}>
        {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% vs mes anterior
      </div>}
    </div>
  );
}

function HotelRow({ hotel, onSelect }) {
  return (
    <div onClick={() => onSelect(hotel)}
      style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 1fr 80px", padding: "14px 20px", borderBottom: "1px solid var(--border)", alignItems: "center", cursor: "pointer", transition: "background 0.1s" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div className="col gap4">
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{hotel.name}</div>
        <div style={{ fontSize: 11, color: "var(--text3)" }}>{hotel.location}</div>
      </div>
      <div className="row gap8">
        <span className={`badge badge-${hotel.status === 'active' ? 'green' : hotel.status === 'trial' ? 'amber' : 'red'}`}>
          <Dot color={hotel.status === 'active' ? 'var(--green)' : hotel.status === 'trial' ? 'var(--amber)' : 'var(--red)'} pulse={hotel.status === 'active'} />
          {statusLabel[hotel.status]}
        </span>
      </div>
      <div><span className="badge" style={{ background: planColor[hotel.plan] + "20", color: planColor[hotel.plan], border: `1px solid ${planColor[hotel.plan]}30` }}>{hotel.plan}</span></div>
      <div className="mono" style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>{fmtMoney(hotel.revenue_month)}</div>
      <div className="mono" style={{ fontSize: 13, color: "var(--text2)" }}>{fmt(hotel.guests)}</div>
      <div className="row gap6 center">
        <Dot color={hotel.bot_active ? "var(--green)" : "var(--text3)"} pulse={hotel.bot_active} />
        <span style={{ fontSize: 12, color: hotel.bot_active ? "var(--green)" : "var(--text3)" }}>{hotel.bot_active ? "ON" : "OFF"}</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 11 }}>Gestionar →</button>
      </div>
    </div>
  );
}

// ============================================================
// VIEWS
// ============================================================

function DashboardView({ hotels, setView }) {
  const m = MOCK_METRICS;
  return (
    <div className="fade-in col gap24">
      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KpiCard icon="🏨" label="Hoteles activos" value={m.active_hotels} sub={`+${m.new_hotels_month} este mes`} color="var(--accent2)" trend={25} />
        <KpiCard icon="💰" label="MRR" value={fmtMoney(m.total_mrr)} sub="ingresos recurrentes/mes" color="var(--green)" trend={18} />
        <KpiCard icon="📈" label="Revenue generado" value={fmtMoney(m.total_revenue_generated)} sub="para hoteles clientes" color="var(--purple)" trend={31} />
        <KpiCard icon="🤖" label="ROI promedio" value={m.avg_roi} sub="retorno por hotel" color="var(--amber)" />
      </div>

      {/* Hoteles + actividad */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Tabla hoteles */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="row between center" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
            <span className="syne" style={{ fontWeight: 700, fontSize: 14 }}>Hoteles</span>
            <span className="badge badge-blue">{m.active_hotels} activos</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 1fr 80px", padding: "10px 20px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid var(--border)" }}>
            <span>Hotel</span><span>Estado</span><span>Plan</span><span>Revenue/mes</span><span>Huéspedes</span><span>Bot</span><span></span>
          </div>
          {hotels.map(h => <HotelRow key={h.id} hotel={h} onSelect={() => setView('hotels')} />)}
        </div>

        {/* Actividad en tiempo real */}
        <div className="card col gap16">
          <div className="syne" style={{ fontWeight: 700, fontSize: 14 }}>Actividad en vivo</div>
          {[
            { hotel: "Llao Llao", msg: "Nueva reserva confirmada", time: "hace 2min", color: "var(--green)", icon: "✅" },
            { hotel: "Interamericano", msg: "Upselling aceptado: Spa $80", time: "hace 5min", color: "var(--green)", icon: "💰" },
            { hotel: "Peuma Hue", msg: "Queja escalada: calefacción", time: "hace 12min", color: "var(--red)", icon: "🚨" },
            { hotel: "Llao Llao", msg: "Pre check-in enviado ×12", time: "hace 18min", color: "var(--accent2)", icon: "📤" },
            { hotel: "Interamericano", msg: "Reseña Google solicitada", time: "hace 24min", color: "var(--amber)", icon: "⭐" },
            { hotel: "El Retorno", msg: "Campaña enviada: 89 msgs", time: "hace 1h", color: "var(--purple)", icon: "📣" },
            { hotel: "Llao Llao", msg: "31 check-outs procesados", time: "hace 2h", color: "var(--text2)", icon: "🏁" },
          ].map((a, i) => (
            <div key={i} className="row gap12 center" style={{ paddingBottom: 12, borderBottom: i < 6 ? "1px solid var(--border)" : "none" }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
              <div className="col gap2" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.msg}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{a.hotel} · {a.time}</div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Revenue por plan */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {PLANS.map(plan => {
          const hotelsOnPlan = hotels.filter(h => h.plan === plan.name);
          const planRevenue = hotelsOnPlan.length * (plan.price || 0);
          return (
            <div key={plan.id} className="card" style={{ borderColor: plan.popular ? plan.color + "40" : "var(--border)", position: "relative" }}>
              {plan.popular && <div style={{ position: "absolute", top: -1, right: 16, background: plan.color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: "0 0 8px 8px" }}>POPULAR</div>}
              <div className="row between center" style={{ marginBottom: 14 }}>
                <div className="syne" style={{ fontWeight: 800, fontSize: 16, color: plan.color }}>{plan.name}</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{plan.price ? `$${plan.price}` : "Custom"}<span style={{ fontSize: 11, color: "var(--text3)" }}>/mes</span></div>
              </div>
              <div className="row gap8 center" style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", fontFamily: "DM Mono" }}>{hotelsOnPlan.length}</span>
                <span style={{ fontSize: 13, color: "var(--text2)" }}>hoteles · {fmtMoney(planRevenue)}/mes</span>
              </div>
              {plan.modules.map(m => <div key={m} style={{ fontSize: 12, color: "var(--text2)", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>✓ {m}</div>)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HotelsView({ hotels, onOnboard }) {
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = hotels.filter(h => {
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === "all" || h.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  if (selected) return <HotelDetail hotel={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="fade-in col gap20">
      <div className="row between center">
        <div className="col gap4">
          <h2 className="syne" style={{ fontSize: 22, fontWeight: 800 }}>Hoteles</h2>
          <p style={{ fontSize: 13, color: "var(--text2)" }}>{hotels.length} hoteles en la plataforma</p>
        </div>
        <button className="btn-primary" onClick={onOnboard} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          + Nuevo hotel
        </button>
      </div>

      <div className="row gap12">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar hotel..." style={{ maxWidth: 280 }} />
        <div className="row gap8">
          {["all", "Pro", "Starter", "Trial"].map(p => (
            <button key={p} onClick={() => setFilterPlan(p)}
              style={{ background: filterPlan === p ? "var(--accent)" : "var(--surface2)", border: "1px solid " + (filterPlan === p ? "var(--accent)" : "var(--border)"), borderRadius: 8, padding: "8px 14px", color: filterPlan === p ? "#fff" : "var(--text2)", fontSize: 12, fontWeight: 600 }}>
              {p === "all" ? "Todos" : p}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ fontSize: 11, color: "var(--text3)", display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 1fr 80px", padding: "12px 20px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
          <span>Hotel</span><span>Estado</span><span>Plan</span><span>Revenue/mes</span><span>Huéspedes</span><span>Bot IA</span><span></span>
        </div>
        {filtered.map(h => <HotelRow key={h.id} hotel={h} onSelect={setSelected} />)}
      </div>
    </div>
  );
}

function HotelDetail({ hotel, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = ["overview", "configuración", "servicios", "métricas", "bot"];

  return (
    <div className="fade-in col gap20">
      {/* Header */}
      <div className="row gap16 center">
        <button onClick={onBack} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", color: "var(--text2)", fontSize: 13 }}>← Volver</button>
        <div className="col gap4" style={{ flex: 1 }}>
          <div className="row gap12 center">
            <h2 className="syne" style={{ fontSize: 20, fontWeight: 800 }}>{hotel.name}</h2>
            <span className={`badge ${statusBadge[hotel.status]}`}><Dot color={hotel.status === 'active' ? 'var(--green)' : 'var(--amber)'} />{statusLabel[hotel.status]}</span>
            <span className="badge" style={{ background: planColor[hotel.plan] + "20", color: planColor[hotel.plan] }}>{hotel.plan}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text3)" }}>{hotel.location} · {hotel.whatsapp}</p>
        </div>
        <div className="row gap10">
          <button className="btn-ghost">Editar config</button>
          <button className="btn-primary">Ver CRM →</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="row gap4" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ background: "transparent", border: "none", borderBottom: activeTab === t ? "2px solid var(--accent2)" : "2px solid transparent", padding: "10px 16px", color: activeTab === t ? "var(--accent2)" : "var(--text3)", fontSize: 13, fontWeight: activeTab === t ? 700 : 400, textTransform: "capitalize", marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <KpiCard icon="👥" label="Huéspedes totales" value={fmt(hotel.guests)} color="var(--accent2)" />
          <KpiCard icon="💬" label="Conversaciones hoy" value={hotel.conversations_today} color="var(--cyan)" />
          <KpiCard icon="💰" label="Revenue este mes" value={fmtMoney(hotel.revenue_month)} color="var(--green)" />
          <KpiCard icon="📦" label="Módulos activos" value={hotel.modules.length} sub={hotel.modules.join(", ")} color="var(--purple)" />
        </div>
      )}

      {activeTab === "configuración" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card col gap16">
            <div className="syne" style={{ fontWeight: 700, fontSize: 14 }}>Datos del hotel</div>
            {[["Nombre", hotel.name], ["Ubicación", hotel.location], ["WhatsApp", hotel.whatsapp], ["Timezone", "America/Buenos_Aires"]].map(([k, v]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{k}</label>
                <input defaultValue={v} />
              </div>
            ))}
            <button className="btn-primary">Guardar cambios</button>
          </div>
          <div className="card col gap16">
            <div className="syne" style={{ fontWeight: 700, fontSize: 14 }}>Precios de servicios</div>
            {[["Traslado al hotel", "15"], ["Early check-in", "20"], ["Late check-out", "20"], ["Sesión spa", "80"], ["Descuento cumpleaños", "15%"]].map(([k, v]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{k}</label>
                <input defaultValue={v} />
              </div>
            ))}
            <button className="btn-primary">Guardar precios</button>
          </div>
        </div>
      )}

      {activeTab === "bot" && (
        <div className="col gap16">
          <div className="card" style={{ borderColor: hotel.bot_active ? "rgba(16,185,129,0.3)" : "var(--border)" }}>
            <div className="row between center" style={{ marginBottom: 16 }}>
              <div className="col gap4">
                <div className="syne" style={{ fontWeight: 700, fontSize: 15 }}>Bot Julia</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>Asistente IA conversacional · Claude claude-sonnet-4-6</div>
              </div>
              <div className="row gap12 center">
                <span className={`badge ${hotel.bot_active ? "badge-green" : "badge-red"}`}><Dot color={hotel.bot_active ? "var(--green)" : "var(--red)"} pulse={hotel.bot_active} />{hotel.bot_active ? "Activo" : "Inactivo"}</span>
                <button className={hotel.bot_active ? "btn-ghost" : "btn-primary"}>{hotel.bot_active ? "Pausar bot" : "Activar bot"}</button>
              </div>
            </div>
            <div className="col gap12">
              <label style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>System Prompt personalizado</label>
              <textarea defaultValue={`Sos Julia, la asistente virtual del ${hotel.name}. Sos empática, profesional y eficiente...`} rows={8} />
              <div className="row gap10">
                <button className="btn-primary">Guardar prompt</button>
                <button className="btn-ghost">✨ Regenerar con IA</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "métricas" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <KpiCard icon="💬" label="Conversaciones (30d)" value="847" sub="+12% vs mes anterior" color="var(--accent2)" trend={12} />
          <KpiCard icon="✅" label="Tasa de resolución" value="94%" color="var(--green)" />
          <KpiCard icon="⭐" label="Reseñas Google" value="23" sub="este mes" color="var(--amber)" />
          <KpiCard icon="🛒" label="Upsells aceptados" value="38%" sub="conversion rate" color="var(--purple)" />
          <KpiCard icon="📤" label="Mensajes enviados" value="2,341" sub="automatizaciones" color="var(--cyan)" />
          <KpiCard icon="🚨" label="Quejas escaladas" value="3" sub="resueltas todas" color="var(--red)" />
        </div>
      )}
    </div>
  );
}

function OnboardingView({ onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", location: "", whatsapp: "", plan: "pro", provider: "mock", evolution_url: "https://evolution.serstormia.cloud", evolution_apikey: import.meta.env.VITE_EVOLUTION_API_KEY || "", services: [], check_in: "15:00", check_out: "11:00" });
  const [submitting, setSubmitting] = useState(false);
  const [qrCode, setQrCode] = useState(null);

  const update = (k, v) => setData(prev => ({ ...prev, [k]: v }));

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await createHotel({
        ...data,
        upsell_prices: {
          transfer: data.transfer_price,
          early_checkin: data.early_checkin_price,
          restaurant: data.restaurant_price,
          spa: data.spa_price,
          massage: data.massage_price,
          yoga: data.yoga_price,
          late_checkout: data.late_checkout_price
        }
      });
      if (res.data.qr_code) {
        setQrCode(res.data.qr_code);
      } else {
        onComplete();
      }
    } catch (error) {
      console.error(error);
      alert("Error al guardar el hotel. Revise la consola.");
    } finally {
      setSubmitting(false);
    }
  };


  const stepContent = {
    1: (
      <div className="col gap16">
        <div className="col gap4">
          <div className="syne" style={{ fontSize: 22, fontWeight: 800 }}>Datos del hotel</div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Información básica para configurar el sistema</p>
        </div>
        {[["Nombre del hotel *", "name", "Hotel Las Cumbres"], ["Ciudad, País *", "location", "Bariloche, Argentina"], ["Número WhatsApp Business *", "whatsapp", "+5492944123456 (con código de país)"], ["Email de contacto", "email", "hotel@email.com"]].map(([label, key, ph]) => (
          <div key={key}>
            <label style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{label}</label>
            <input value={data[key] || ""} onChange={e => update(key, e.target.value)} placeholder={ph} />
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["Check-in", "check_in", "15:00"], ["Check-out", "check_out", "11:00"]].map(([label, key, ph]) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{label}</label>
              <input value={data[key]} onChange={e => update(key, e.target.value)} placeholder={ph} />
            </div>
          ))}
        </div>
      </div>
    ),
    2: (
      <div className="col gap20">
        <div className="col gap4">
          <div className="syne" style={{ fontSize: 22, fontWeight: 800 }}>Servicios & Precios</div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>La IA usará estos precios para hacer upselling automático</p>
        </div>
        {[
          { label: "PRE CHECK-IN", items: [["Traslado al hotel (USD)", "transfer_price", "15"], ["Early check-in (USD)", "early_checkin_price", "20"], ["Reserva restaurante (USD)", "restaurant_price", "60"]] },
          { label: "DURANTE LA ESTADÍA", items: [["Sesión spa (USD)", "spa_price", "80"], ["Masaje 60min (USD)", "massage_price", "40"], ["Clase yoga (USD)", "yoga_price", "50"]] },
          { label: "CHECKOUT", items: [["Late check-out (USD)", "late_checkout_price", "20"]] },
        ].map(section => (
          <div key={section.label} className="card col gap12">
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>{section.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {section.items.map(([label, key, ph]) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 5 }}>{label}</label>
                  <input value={data[key] || ""} onChange={e => update(key, e.target.value)} placeholder={ph} type="number" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div>
          <label style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Google Maps URL (para pedir reseñas)</label>
          <input value={data.google_url || ""} onChange={e => update("google_url", e.target.value)} placeholder="https://g.page/tu-hotel" />
        </div>
      </div>
    ),
    3: (
      <div className="col gap20">
        <div className="col gap4">
          <div className="syne" style={{ fontSize: 22, fontWeight: 800 }}>Elegí tu plan</div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Podés cambiar en cualquier momento</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {PLANS.map(plan => (
            <div key={plan.id} onClick={() => update("plan", plan.id)}
              className="card"
              style={{ cursor: "pointer", borderColor: data.plan === plan.id ? plan.color : "var(--border)", background: data.plan === plan.id ? plan.color + "10" : "var(--surface)", position: "relative", transition: "all 0.2s" }}>
              {plan.popular && <div style={{ position: "absolute", top: -1, right: 14, background: plan.color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: "0 0 8px 8px" }}>POPULAR</div>}
              <div className="syne" style={{ fontSize: 18, fontWeight: 800, color: plan.color, marginBottom: 8 }}>{plan.name}</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 700, marginBottom: 14 }}>{plan.price ? `$${plan.price}` : "Custom"}<span style={{ fontSize: 12, color: "var(--text3)" }}>/mes</span></div>
              {plan.modules.map(m => <div key={m} style={{ fontSize: 12, color: "var(--text2)", padding: "5px 0", borderTop: "1px solid var(--border)" }}>✓ {m}</div>)}
              <div style={{ marginTop: 10, fontSize: 11, color: plan.color }}>🎯 {plan.tokens_included}</div>
              {data.plan === plan.id && <div style={{ marginTop: 12, textAlign: "center", color: plan.color, fontWeight: 700, fontSize: 12 }}>✓ Seleccionado</div>}
            </div>
          ))}
        </div>
      </div>
    ),
    4: (
      <div className="col gap20">
        <div className="col gap4">
          <div className="syne" style={{ fontSize: 22, fontWeight: 800 }}>Conectar WhatsApp</div>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Conectate usando tu propia infraestructura de Evolution API o usa el modo simulado de IA.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div onClick={() => update("provider", "evolution")}
            className="card col gap12"
            style={{ cursor: "pointer", borderColor: data.provider === "evolution" ? "#10b981" : "var(--border)", transition: "all 0.2s" }}>
            <div className="row between center">
              <div className="syne" style={{ fontWeight: 700, fontSize: 15, color: "#10b981" }}>Evolution API</div>
              {data.provider === "evolution" && <span className="badge badge-green">Seleccionado ✓</span>}
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)" }}>Sincronización vía Baileys mediante código QR.</p>
            
            {data.provider === "evolution" && (
              <div className="col gap10 fade-in" style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase" }}>URL de tu servidor Evolution</label>
                  <input style={{ padding: "6px 10px", marginTop: 4 }} value={data.evolution_url} onChange={e => update("evolution_url", e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase" }}>Global API Key</label>
                  <input style={{ padding: "6px 10px", marginTop: 4 }} type="password" value={data.evolution_apikey} onChange={e => update("evolution_apikey", e.target.value)} placeholder="Ej: 6CA641D0289A..." />
                </div>
              </div>
            )}
          </div>

          <div onClick={() => update("provider", "mock")}
            className="card col gap12"
            style={{ cursor: "pointer", borderColor: data.provider === "mock" ? "var(--purple)" : "var(--border)", transition: "all 0.2s" }}>
            <div className="row between center">
              <div className="syne" style={{ fontWeight: 700, fontSize: 15, color: "var(--purple)" }}>Modo Simulación</div>
              {data.provider === "mock" && <span className="badge badge-purple">Seleccionado ✓</span>}
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)" }}>Probá el bot sin conectar un teléfono real. Los mensajes se simulan vía API (CURL o ThunderClient).</p>
          </div>
        </div>
      </div>
    ),
    5: (
      <div className="col gap20" style={{ alignItems: "center", textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 64 }}>🚀</div>
        <div className="syne" style={{ fontSize: 28, fontWeight: 800 }}>¡{data.name || "Tu hotel"} está listo!</div>
        <p style={{ color: "var(--text2)", fontSize: 15, maxWidth: 420 }}>La IA Julia está configurada y lista para empezar a generar ingresos automáticamente.</p>
        <div className="card" style={{ textAlign: "left", width: "100%", maxWidth: 480 }}>
          <div className="syne" style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Resumen de configuración</div>
          {[
            ["Hotel", data.name || "—"],
            ["WhatsApp", data.whatsapp || "—"],
            ["Conexión", (data.provider || "mock").toUpperCase()],
          ].map(([k, v]) => (
            <div key={k} className="row between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <span style={{ color: "var(--text3)" }}>{k}</span>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {qrCode ? (
          <div className="col gap12 center fade-in" style={{ marginTop: 20 }}>
            <div className="syne" style={{ fontSize: 18, color: "var(--green)", fontWeight: 700 }}>Hotel Guardado. ¡Escanea el QR!</div>
            <p style={{ fontSize: 13, color: "var(--text2)" }}>Abre WhatsApp en el celular del hotel, ve a Dispositivos Vinculados y escanea este código mágico.</p>
            <div style={{ background: "#fff", padding: 16, borderRadius: 12 }}>
              <img src={qrCode} alt="WhatsApp QR" style={{ width: 240, height: 240 }} />
            </div>
            <button className="btn-primary" onClick={onComplete} style={{ marginTop: 10 }}>Finalizar y Ver CRM →</button>
          </div>
        ) : (
          <div className="row gap12" style={{ marginTop: 20 }}>
            <button className="btn-primary" onClick={handleFinalSubmit} disabled={submitting} style={{ padding: "12px 28px", fontSize: 15 }}>
              {submitting ? "Guardando hotel..." : "Conectar y Finalizar →"}
            </button>
          </div>
        )}
        <div className="card col gap10" style={{ width: "100%", maxWidth: 480, background: "rgba(37,99,235,0.08)", borderColor: "rgba(37,99,235,0.2)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent2)" }}>Próximo paso: probar el bot</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--text3)", wordBreak: "break-all" }}>
            {`curl -X POST http://localhost:3001/webhook -H "Content-Type: application/json" -d '{"from":"5491155...","msg":"Hola!"}'`}
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Steps indicator */}
      <div className="row gap0 center" style={{ marginBottom: 36 }}>
        {ONBOARDING_STEPS.map((s, i) => (
          <div key={s.id} className="row center" style={{ flex: i < ONBOARDING_STEPS.length - 1 ? 1 : "none" }}>
            <div onClick={() => s.id < step && setStep(s.id)}
              style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: step > s.id ? 14 : 18, background: step === s.id ? "var(--accent)" : step > s.id ? "var(--green)" : "var(--surface2)", border: `2px solid ${step === s.id ? "var(--accent)" : step > s.id ? "var(--green)" : "var(--border)"}`, cursor: s.id < step ? "pointer" : "default", flexShrink: 0, transition: "all 0.2s" }}>
              {step > s.id ? "✓" : s.icon}
            </div>
            {i < ONBOARDING_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: step > s.id ? "var(--green)" : "var(--border)", margin: "0 4px", transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step label */}
      <div style={{ textAlign: "center", marginBottom: 28, color: "var(--text3)", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>
        Paso {step} de {ONBOARDING_STEPS.length} · {ONBOARDING_STEPS[step - 1]?.label}
      </div>

      {stepContent[step]}

      {/* Navigation */}
      <div className="row between" style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        <button className="btn-ghost" onClick={() => step > 1 && setStep(s => s - 1)} style={{ opacity: step === 1 ? 0.3 : 1 }}>← Anterior</button>
        {step < ONBOARDING_STEPS.length ? (
          <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Siguiente →</button>
        ) : null}
      </div>
    </div>
  );
}

function BillingView({ hotels }) {
  return (
    <div className="fade-in col gap24">
      <div className="col gap4">
        <h2 className="syne" style={{ fontSize: 22, fontWeight: 800 }}>Facturación</h2>
        <p style={{ fontSize: 13, color: "var(--text2)" }}>Gestión de planes y pagos</p>
      </div>

      {/* MRR Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KpiCard icon="💵" label="MRR total" value="$1,745" sub="+18% vs mes anterior" color="var(--green)" trend={18} />
        <KpiCard icon="📅" label="ARR proyectado" value="$20,940" color="var(--accent2)" />
        <KpiCard icon="📉" label="Churn rate" value="0%" sub="0 cancelaciones" color="var(--green)" />
        <KpiCard icon="🎯" label="LTV promedio" value="$4,200" color="var(--purple)" />
      </div>

      {/* Hoteles y sus planes */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="row between center" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <span className="syne" style={{ fontWeight: 700, fontSize: 14 }}>Subscripciones activas</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text3)", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 20px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
          <span>Hotel</span><span>Plan</span><span>Precio/mes</span><span>Próximo pago</span><span>Estado</span>
        </div>
        {hotels.map(h => (
          <div key={h.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
            <div className="col gap2">
              <span style={{ fontWeight: 600, fontSize: 14 }}>{h.name}</span>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{h.location}</span>
            </div>
            <span className="badge" style={{ background: planColor[h.plan] + "20", color: planColor[h.plan], width: "fit-content" }}>{h.plan}</span>
            <span className="mono" style={{ fontSize: 13 }}>{h.plan === "Pro" ? "$350" : h.plan === "Starter" ? "$170" : "$0"}</span>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>01/04/2024</span>
            <span className={`badge ${h.status === "active" ? "badge-green" : "badge-amber"}`}>
              {h.status === "active" ? "Al día" : "Trial"}
            </span>
          </div>
        ))}
      </div>

      {/* Tokens */}
      <div className="card col gap16">
        <div className="syne" style={{ fontWeight: 700, fontSize: 14 }}>Consumo de conversaciones IA (mes actual)</div>
        {hotels.filter(h => h.status === "active").map(h => {
          const used = Math.floor(Math.random() * 4000) + 1000;
          const limit = h.plan === "Pro" ? 10000 : 3000;
          const pct = Math.min(100, (used / limit * 100)).toFixed(0);
          return (
            <div key={h.id}>
              <div className="row between center" style={{ marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: "var(--text)" }}>{h.name}</span>
                <span className="mono" style={{ fontSize: 12, color: "var(--text2)" }}>{used.toLocaleString()} / {limit.toLocaleString()} conversaciones</span>
              </div>
              <div style={{ background: "var(--surface2)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, width: pct + "%", background: pct > 80 ? "var(--amber)" : "var(--accent2)", transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function SmartGuestAdmin() {
  const [view, setView] = useState("dashboard");
  const [onboarding, setOnboarding] = useState(false);
  const [hotels, setHotels] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    getHotels().then(res => {
      setHotels(res.data);
    }).catch(console.error);

    return () => {
      if (document.head.contains(style)) document.head.removeChild(style);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const nav = [
    { id: "dashboard", icon: "▦", label: "Dashboard" },
    { id: "hotels", icon: "🏨", label: "Hoteles" },
    { id: "billing", icon: "💳", label: "Facturación" },
  ];

  if (onboarding) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className="row gap12 center" style={{ marginBottom: 40 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #2563eb, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚡</div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 18 }}>SmartGuest <span style={{ color: "var(--accent2)" }}>AI</span></div>
            <span style={{ marginLeft: "auto" }}>
              <button className="btn-ghost" onClick={() => setOnboarding(false)}>✕ Cancelar</button>
            </span>
          </div>
          <OnboardingView onComplete={() => { setOnboarding(false); setView("hotels"); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>

      {/* SIDEBAR */}
      <div style={{ width: 220, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Logo */}
        <div className="row gap10 center" style={{ padding: "22px 18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #2563eb, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>⚡</div>
          <div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 14, letterSpacing: -0.5 }}>SmartGuest</div>
            <div style={{ fontSize: 9, color: "var(--accent2)", fontWeight: 700, letterSpacing: 2 }}>ADMIN PANEL</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)", letterSpacing: 2, padding: "6px 10px 10px", textTransform: "uppercase" }}>Gestión</div>
          {nav.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", marginBottom: 2, background: view === item.id ? "rgba(37,99,235,0.12)" : "transparent", border: "none", borderRadius: 8, color: view === item.id ? "var(--accent2)" : "var(--text3)", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: view === item.id ? 700 : 400, borderLeft: view === item.id ? "2px solid var(--accent2)" : "2px solid transparent" }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* New hotel CTA */}
        <div style={{ padding: 12 }}>
          <button className="btn-primary" onClick={() => setOnboarding(true)}
            style={{ width: "100%", padding: "11px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg, #2563eb, #6366f1)" }}>
            + Nuevo hotel
          </button>
        </div>

        {/* User */}
        <div className="row gap10 center" style={{ padding: "14px 16px", borderTop: "1px solid var(--border)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
          <div className="col gap2" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis" }}>{localStorage.getItem('name') || "Admin"}</div>
            <button onClick={handleLogout} style={{ fontSize: 10, color: "var(--red)", border: "none", background: "transparent", textAlign: "left", padding: 0, marginTop: 2 }}>Cerrar sesión</button>
          </div>
          <Dot color="var(--green)" pulse />
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div className="row between center" style={{ padding: "14px 28px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          <div>
            <h1 className="syne" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              {nav.find(n => n.id === view)?.label}
            </h1>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>SmartGuest AI · Panel de administración</div>
          </div>
          <div className="row gap12 center">
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "var(--green)" }} className="row gap6 center">
              <Dot color="var(--green)" pulse />
              {hotels.filter(h => h.bot_active).length} bots activos
            </div>
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px", fontSize: 12 }} className="mono">
              MRR: <span style={{ color: "var(--green)", fontWeight: 700 }}>$1,745</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 28 }}>
          {view === "dashboard" && <DashboardView hotels={hotels} setView={setView} />}
          {view === "hotels" && <HotelsView hotels={hotels} onOnboard={() => setOnboarding(true)} />}
          {view === "billing" && <BillingView hotels={hotels} />}
        </div>
      </div>
    </div>
  );
}
