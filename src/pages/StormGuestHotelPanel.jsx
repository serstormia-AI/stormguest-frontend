import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getHotel, getAnalytics, getReservations, getServices } from "../services/api";

// ============================================================
// SER STORM AI SOLUTIONS — HOTEL MANAGER PANEL
// Branding: deep navy bg, electric blue circuits, gold lightning
// Font: Bebas Neue (display) + DM Sans (body) + DM Mono (data)
// ============================================================

const INJECT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #020810;
    --bg2:       #04101f;
    --surface:   #060f22;
    --surface2:  #091629;
    --surface3:  #0d1f38;
    --border:    #0f2040;
    --border2:   #173060;
    --text:      #ddeeff;
    --text2:     #6a8aaa;
    --text3:     #2a4060;
    --blue:      #1a8fff;
    --blue2:     #38b0ff;
    --blue-glow: rgba(26,143,255,0.15);
    --gold:      #f5a623;
    --gold2:     #ffc84a;
    --gold-glow: rgba(245,166,35,0.15);
    --green:     #0fba81;
    --red:       #ff4d6a;
    --purple:    #7c6bff;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  /* Circuit board bg pattern */
  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(26,143,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(26,143,255,0.025) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  body::after {
    content: '';
    position: fixed;
    top: -30%;
    left: 50%;
    transform: translateX(-50%);
    width: 900px;
    height: 500px;
    background: radial-gradient(ellipse, rgba(26,143,255,0.06) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }

  #root { position: relative; z-index: 1; }

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
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  input:focus, textarea:focus, select:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px var(--blue-glow);
  }
  input::placeholder, textarea::placeholder { color: var(--text3); }
  label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: var(--text3);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.18s; }

  .btn-gold {
    background: linear-gradient(135deg, var(--gold), var(--gold2));
    border: none; border-radius: 9px;
    padding: 11px 22px; color: #0a0a0a;
    font-weight: 700; font-size: 13px;
    box-shadow: 0 4px 20px var(--gold-glow);
  }
  .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(245,166,35,0.35); }

  .btn-blue {
    background: linear-gradient(135deg, var(--blue), #2563eb);
    border: none; border-radius: 9px;
    padding: 11px 22px; color: #fff;
    font-weight: 700; font-size: 13px;
    box-shadow: 0 4px 20px var(--blue-glow);
  }
  .btn-blue:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(26,143,255,0.3); }

  .btn-ghost {
    background: transparent;
    border: 1px solid var(--border2);
    border-radius: 9px; padding: 10px 20px;
    color: var(--text2); font-size: 13px;
  }
  .btn-ghost:hover { border-color: var(--blue2); color: var(--blue2); }

  .btn-danger {
    background: rgba(255,77,106,0.1);
    border: 1px solid rgba(255,77,106,0.3);
    border-radius: 9px; padding: 10px 20px;
    color: var(--red); font-size: 13px; font-weight: 600;
  }
  .btn-danger:hover { background: rgba(255,77,106,0.2); }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 22px;
  }

  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    border-radius: 20px; padding: 3px 10px;
    font-size: 11px; font-weight: 700;
  }
  .badge-green { background: rgba(15,186,129,0.12); color: var(--green); border: 1px solid rgba(15,186,129,0.25); }
  .badge-gold  { background: rgba(245,166,35,0.12);  color: var(--gold);  border: 1px solid rgba(245,166,35,0.25); }
  .badge-blue  { background: rgba(26,143,255,0.12);  color: var(--blue2); border: 1px solid rgba(26,143,255,0.25); }
  .badge-red   { background: rgba(255,77,106,0.12);  color: var(--red);   border: 1px solid rgba(255,77,106,0.25); }

  .row { display: flex; align-items: center; }
  .col { display: flex; flex-direction: column; }
  .between { justify-content: space-between; }
  .gap4  { gap: 4px; }  .gap8 { gap: 8px; }   .gap10 { gap: 10px; }
  .gap12 { gap: 12px; } .gap16 { gap: 16px; }  .gap20 { gap: 20px; }
  .gap24 { gap: 24px; }

  .fade { animation: fadeUp 0.3s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .glow-blue { box-shadow: 0 0 20px var(--blue-glow); }
  .glow-gold  { box-shadow: 0 0 20px var(--gold-glow); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  /* Divider */
  .divider { height: 1px; background: var(--border); margin: 20px 0; }
`;


// ============================================================
// STYLES & HELPERS
// ============================================================
const tagColor = { pareja: "#e879f9", familia: "#38bdf8", esquiador: "#a78bfa", negocios: "#fb923c" };
const catLabel = { pre_stay: "Pre Check-in", during_stay: "Durante estadía", checkout: "Check-out" };
const catColor = { pre_stay: "var(--blue2)", during_stay: "var(--green)", checkout: "var(--gold)" };

function timeAgo(d) {
    const diff = Date.now() - new Date(d);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "hoy";
    if (days === 1) return "ayer";
    return `hace ${days}d`;
}

// ============================================================
// COMPONENTS
// ============================================================

function Dot({ color, pulse }) {
    return <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} className={pulse ? "pulse" : ""} />;
}

function Tag({ t }) {
    return <span style={{ background: (tagColor[t] || "#94a3b8") + "22", color: tagColor[t] || "#94a3b8", border: `1px solid ${(tagColor[t] || "#94a3b8")}44`, borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{t}</span>;
}

function KpiCard({ icon, label, value, sub, color, trend }) {
    const up = trend > 0;
    return (
        <div className="card" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
            <div style={{ position: "absolute", bottom: -20, right: -10, fontSize: 64, opacity: 0.04 }}>{icon}</div>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: -1 }}>{value}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color, marginTop: 5, fontWeight: 600 }}>{sub}</div>}
            {trend !== undefined && (
                <div style={{ fontSize: 11, color: up ? "var(--green)" : "var(--red)", marginTop: 5, fontWeight: 600 }}>
                    {up ? "↑" : "↓"} {Math.abs(trend)}% vs mes anterior
                </div>
            )}
        </div>
    );
}

// ============================================================
// VIEW: DASHBOARD
// ============================================================
function DashboardView({ hotel, metrics, reservations }) {
    const pct = metrics.revenue_prev ? Math.round((metrics.revenue_month - metrics.revenue_prev) / metrics.revenue_prev * 100) : 0;
    
    // Para el dashboard, filtramos las últimas 5 conversaciones
    const BOT_CONVERSATIONS_DASH = [
        { id: 1, guest: "Laura Pérez", message: "¿A qué hora es el desayuno?", time: "hace 3min", resolved: true },
        { id: 2, guest: "Ana Martínez", message: "Necesito que limpien la habitación", time: "hace 8min", resolved: false },
    ];

    return (
        <div className="col gap24 fade">
            {/* Welcome strip */}
            <div style={{ background: "linear-gradient(135deg, rgba(26,143,255,0.08), rgba(245,166,35,0.06))", border: "1px solid var(--border2)", borderRadius: 14, padding: "20px 24px" }} className="row between">
                <div className="col gap4">
                    <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 24, letterSpacing: 1, color: "var(--text)" }}>
                        Buen día, <span style={{ color: "var(--gold)" }}>{hotel.name}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>
                        Tu bot {hotel.bot_name || 'asistente'} está activo · {metrics.conversations_today || 0} conversaciones hoy · {metrics.active_guests || 0} huéspedes en el hotel
                    </div>
                </div>
                <div className="row gap10">
                    <div className="badge badge-green"><Dot color="var(--green)" pulse />Bot activo</div>
                    <div className="badge badge-gold">Hotel Manager</div>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                <KpiCard icon="💰" label="Revenue generado este mes" value={`$${(metrics.revenue_month || 0).toLocaleString()}`} color="var(--gold)" trend={pct} />
                <KpiCard icon="💬" label="Conversaciones este mes" value={metrics.conversations_month || 0} sub={`${metrics.conversations_today || 0} hoy`} color="var(--blue2)" />
                <KpiCard icon="🛒" label="Tasa de upselling" value={`${metrics.upsell_rate || 0}%`} sub="ofertas aceptadas" color="var(--green)" />
                <KpiCard icon="⭐" label="Reseñas Google este mes" value={metrics.google_reviews || 0} sub="gracias al bot" color="var(--purple)" />
            </div>

            {/* Middle row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Últimas conversaciones */}
                <div className="card col gap0" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="row between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>Actividad reciente del bot</span>
                        <span className="badge badge-blue">{BOT_CONVERSATIONS_DASH.filter(c => !c.resolved).length} pendientes</span>
                    </div>
                    {BOT_CONVERSATIONS_DASH.map(c => (
                        <div key={c.id} className="row gap12" style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.resolved ? "var(--text3)" : "var(--gold)", marginTop: 5, flexShrink: 0 }} className={!c.resolved ? "pulse" : ""} />
                            <div className="col gap3" style={{ flex: 1, minWidth: 0 }}>
                                <div className="row between">
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.guest}</span>
                                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{c.time}</span>
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{c.message}"</div>
                            </div>
                            <span style={{ fontSize: 10, color: c.resolved ? "var(--green)" : "var(--gold)", fontWeight: 700, flexShrink: 0 }}>{c.resolved ? "✓" : "⏳"}</span>
                        </div>
                    ))}
                </div>

                {/* Reservas de hoy */}
                <div className="card col gap0" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="row between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>Reservas activas</span>
                        <span className="badge badge-gold">{reservations.filter(r => r.status === "checked_in").length} en el hotel</span>
                    </div>
                    {reservations.slice(0, 5).map(r => (
                        <div key={r.id} className="row gap12" style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: r.status === "checked_in" ? "rgba(15,186,129,0.12)" : "var(--surface2)", border: `1px solid ${r.status === "checked_in" ? "rgba(15,186,129,0.25)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                                {r.status === "checked_in" ? "🏠" : "📅"}
                            </div>
                            <div className="col gap2" style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.guest}</div>
                                <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.room} · {r.checkin} → {r.checkout}</div>
                            </div>
                            <span className={`badge ${r.status === "checked_in" ? "badge-green" : "badge-blue"}`} style={{ fontSize: 10 }}>
                                {r.status === "checked_in" ? "En el hotel" : "Confirmada"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Revenue breakdown */}
            <div className="card">
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Desglose de ingresos del mes</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                    {[
                        { label: "Pre Check-in", val: metrics.revenue_pre_stay || (metrics.revenue_month * 0.25), icon: "✈️", color: "var(--blue2)" },
                        { label: "Durante la estadía", val: metrics.revenue_during_stay || (metrics.revenue_month * 0.45), icon: "🏊", color: "var(--green)" },
                        { label: "Check-out", val: metrics.revenue_checkout || (metrics.revenue_month * 0.30), icon: "🚕", color: "var(--gold)" },
                    ].map(item => (
                        <div key={item.label} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
                            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 24, fontWeight: 700, color: item.color }}>${Math.round(item.val).toLocaleString()}</div>
                            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>{item.label}</div>
                            <div style={{ background: "var(--surface2)", borderRadius: 4, height: 5, marginTop: 10, overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: 4, background: item.color, width: `${(item.val / (metrics.revenue_month || 1) * 100).toFixed(0)}%`, transition: "width 1s ease" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// VIEW: BOT CONFIG
// ============================================================
function BotView({ hotel }) {
    const [active, setActive] = useState(hotel.bot_active);
    const [botName, setBotName] = useState(hotel.bot_name || 'Julia');
    const [prompt, setPrompt] = useState(`Sos ${botName}, la asistente virtual del ${hotel.name}. Sos empática, profesional y eficiente. Respondés en el idioma del huésped. Máximo 4 líneas por respuesta.`);
    const [testMsg, setTestMsg] = useState("");
    const [chat, setChat] = useState([
        { role: "assistant", text: `¡Hola! Soy ${botName}, la asistente virtual del ${hotel.name}. ¿En qué puedo ayudarte? 😊` }
    ]);
    const [loading, setLoading] = useState(false);
    const chatRef = useRef(null);

    const sendTest = async () => {
        if (!testMsg.trim()) return;
        const userMsg = testMsg;
        setTestMsg("");
        setChat(prev => [...prev, { role: "user", text: userMsg }]);
        setLoading(true);
        // Simulate AI response
        await new Promise(r => setTimeout(r, 1200));
        const responses = [
            `¡Claro! El desayuno es de 7:30 a 10:30hs en el restaurante del piso 2. ¿Querés que te reserve una mesa? 🍳`,
            `Perfecto, anotado. Enviamos housekeeping a tu habitación en los próximos 20 minutos. ¿Necesitás algo más? ✅`,
            `El spa está disponible de 10:00 a 21:00hs. Una sesión completa tiene un valor de $80 USD por persona. ¿Te hago la reserva? 💆`,
            `Tenemos transfer al aeropuerto disponible. El costo es de $15 USD. ¿A qué hora sería el viaje? 🚗`,
        ];
        setChat(prev => [...prev, { role: "assistant", text: responses[Math.floor(Math.random() * responses.length)] }]);
        setLoading(false);
        setTimeout(() => chatRef.current?.scrollTo(0, 99999), 50);
    };

    return (
        <div className="col gap20 fade">
            {/* Status bar */}
            <div className="card row between" style={{ padding: "16px 22px" }}>
                <div className="col gap4">
                    <div style={{ fontFamily: "Bebas Neue", fontSize: 20, letterSpacing: 1 }}>
                        Bot <span style={{ color: "var(--gold)" }}>{botName}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>Asistente IA · Claude claude-sonnet-4-6 · Powered by Ser Storm AI</div>
                </div>
                <div className="row gap14">
                    <div className={`badge ${active ? "badge-green" : "badge-red"}`}><Dot color={active ? "var(--green)" : "var(--red)"} pulse={active} />{active ? "Activo" : "Pausado"}</div>
                    <button onClick={() => setActive(!active)} className={active ? "btn-danger" : "btn-blue"} style={{ padding: "9px 18px" }}>
                        {active ? "⏸ Pausar bot" : "▶ Activar bot"}
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Config */}
                <div className="card col gap20">
                    <div style={{ fontWeight: 700, fontSize: 14 }}>⚙️ Configuración del bot</div>

                    <div>
                        <label>Nombre del asistente</label>
                        <input value={botName} onChange={e => setBotName(e.target.value)} placeholder="Julia" />
                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>El nombre con el que se presenta ante los huéspedes</div>
                    </div>

                    <div>
                        <label>Personalidad y tono</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={7} style={{ resize: "vertical" }} />
                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>Describí cómo debe comportarse tu bot. Sin tecnicismos.</div>
                    </div>

                    <div>
                        <label>Idioma principal</label>
                        <select>
                            <option>Español (detecta automáticamente)</option>
                            <option>English (auto-detect)</option>
                            <option>Português (detecta automaticamente)</option>
                        </select>
                    </div>

                    <div className="row gap10">
                        <button className="btn-gold" style={{ flex: 1 }}>💾 Guardar configuración</button>
                        <button className="btn-ghost" style={{ whiteSpace: "nowrap" }}>✨ Regenerar con IA</button>
                    </div>
                </div>

                {/* Test chat */}
                <div className="card col gap0" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>
                        📱 Probar bot en vivo
                    </div>

                    {/* Mockup WhatsApp */}
                    <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 16, background: "var(--bg2)", display: "flex", flexDirection: "column", gap: 10, minHeight: 280, maxHeight: 320 }}>
                        {chat.map((m, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                                <div style={{
                                    maxWidth: "80%",
                                    background: m.role === "user" ? "var(--blue)" : "var(--surface3)",
                                    border: `1px solid ${m.role === "user" ? "transparent" : "var(--border2)"}`,
                                    borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                    padding: "10px 14px",
                                    fontSize: 13,
                                    color: "var(--text)",
                                    lineHeight: 1.5,
                                }}>
                                    {m.role === "assistant" && <div style={{ fontSize: 10, color: "var(--gold)", fontWeight: 700, marginBottom: 4 }}>⚡ {botName}</div>}
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: "flex" }}>
                                <div style={{ background: "var(--surface3)", border: "1px solid var(--border2)", borderRadius: "14px 14px 14px 4px", padding: "10px 16px", fontSize: 13 }}>
                                    <span className="pulse">···</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="row gap10" style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
                        <input
                            value={testMsg}
                            onChange={e => setTestMsg(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && sendTest()}
                            placeholder="Escribí un mensaje como si fueras un huésped..."
                            style={{ flex: 1 }}
                        />
                        <button className="btn-blue" onClick={sendTest} style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>Enviar</button>
                    </div>
                </div>
            </div>

            {/* Automaciones */}
            <div className="card col gap16">
                <div style={{ fontWeight: 700, fontSize: 14 }}>⏰ Mensajes automáticos</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {[
                        { icon: "✈️", title: "Pre Check-in", desc: "24hs antes de la llegada · Traslado + early check-in", active: true },
                        { icon: "👋", title: "Bienvenida", desc: "Al hacer check-in · Presenta al bot", active: true },
                        { icon: "☀️", title: "Actividades del día", desc: "Cada mañana a las 9am", active: false },
                        { icon: "🧳", title: "Check-out", desc: "Día del checkout · Late checkout + traslado", active: true },
                        { icon: "⭐", title: "Solicitud de reseña", desc: "24hs post checkout · Filtra positivas a Google", active: true },
                        { icon: "🎂", title: "Cumpleaños", desc: "Saludo + descuento especial", active: false },
                    ].map(a => (
                        <div key={a.title} style={{ background: "var(--surface2)", border: `1px solid ${a.active ? "rgba(15,186,129,0.2)" : "var(--border)"}`, borderRadius: 10, padding: "14px 16px" }}>
                            <div className="row between" style={{ marginBottom: 6 }}>
                                <div className="row gap8">
                                    <span style={{ fontSize: 18 }}>{a.icon}</span>
                                    <span style={{ fontWeight: 700, fontSize: 13 }}>{a.title}</span>
                                </div>
                                <div style={{ width: 36, height: 20, borderRadius: 10, background: a.active ? "var(--green)" : "var(--surface3)", position: "relative", cursor: "pointer", flexShrink: 0, border: `1px solid ${a.active ? "var(--green)" : "var(--border2)"}` }}>
                                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, transition: "left 0.2s", left: a.active ? 18 : 2 }} />
                                </div>
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text3)" }}>{a.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// VIEW: SERVICIOS
// ============================================================
function ServicesView({ servicesData }) {
    const [services, setServices] = useState(servicesData);
    const [showAdd, setShowAdd] = useState(false);
    const [newSvc, setNewSvc] = useState({ name: "", price: "", category: "during_stay" });

    const toggle = (id) => setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

    const grouped = { pre_stay: [], during_stay: [], checkout: [] };
    services.forEach(s => grouped[s.category]?.push(s));

    return (
        <div className="col gap20 fade">
            <div className="row between">
                <div className="col gap4">
                    <div style={{ fontFamily: "Bebas Neue", fontSize: 22, letterSpacing: 1 }}>Servicios & <span style={{ color: "var(--gold)" }}>Precios</span></div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>El bot ofrece estos servicios automáticamente según el contexto</div>
                </div>
                <button className="btn-gold" onClick={() => setShowAdd(!showAdd)}>+ Agregar servicio</button>
            </div>

            {showAdd && (
                <div className="card col gap14" style={{ borderColor: "rgba(26,143,255,0.3)" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Nuevo servicio</div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                        <div>
                            <label>Nombre del servicio</label>
                            <input value={newSvc.name} onChange={e => setNewSvc(p => ({ ...p, name: e.target.value }))} placeholder="Excursión al Cerro Catedral" />
                        </div>
                        <div>
                            <label>Precio (USD)</label>
                            <input value={newSvc.price} onChange={e => setNewSvc(p => ({ ...p, price: e.target.value }))} placeholder="45" type="number" />
                        </div>
                        <div>
                            <label>Cuándo ofrecerlo</label>
                            <select value={newSvc.category} onChange={e => setNewSvc(p => ({ ...p, category: e.target.value }))}>
                                <option value="pre_stay">Pre Check-in</option>
                                <option value="during_stay">Durante la estadía</option>
                                <option value="checkout">Check-out</option>
                            </select>
                        </div>
                    </div>
                    <div className="row gap10">
                        <button className="btn-blue" onClick={() => { setServices(p => [...p, { id: Date.now(), ...newSvc, price: Number(newSvc.price), active: true }]); setShowAdd(false); setNewSvc({ name: "", price: "", category: "during_stay" }); }}>Agregar</button>
                        <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
                    </div>
                </div>
            )}

            {Object.entries(grouped).map(([cat, svcs]) => (
                <div key={cat}>
                    <div className="row gap10" style={{ marginBottom: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: catColor[cat] }} />
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: catColor[cat] }}>{catLabel[cat]}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {svcs.map(s => (
                            <div key={s.id} style={{ background: "var(--surface)", border: `1px solid ${s.active ? "var(--border2)" : "var(--border)"}`, borderRadius: 12, padding: "16px 18px", opacity: s.active ? 1 : 0.5, transition: "all 0.2s" }}>
                                <div className="row between" style={{ marginBottom: 8 }}>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                                    <div style={{ width: 36, height: 20, borderRadius: 10, background: s.active ? catColor[cat] : "var(--surface3)", position: "relative", cursor: "pointer", flexShrink: 0, border: `1px solid ${s.active ? "transparent" : "var(--border2)"}` }} onClick={() => toggle(s.id)}>
                                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, transition: "left 0.2s", left: s.active ? 18 : 2 }} />
                                    </div>
                                </div>
                                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 22, fontWeight: 700, color: catColor[cat] }}>${s.price} <span style={{ fontSize: 12, color: "var(--text3)" }}>USD</span></div>
                                <div style={{ fontSize: 11, color: s.active ? "var(--green)" : "var(--text3)", marginTop: 6 }}>
                                    {s.active ? "✓ El bot lo ofrece automáticamente" : "✕ No se ofrece actualmente"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// VIEW: RESERVAS
// ============================================================
function ReservationsView({ reservationsData }) {
    const [reservations, setReservations] = useState(reservationsData);
    const [showAdd, setShowAdd] = useState(false);
    const [newRes, setNewRes] = useState({ guest: "", phone: "", checkin: "", checkout: "", room: "", adults: 2, children: 0 });
    const [filter, setFilter] = useState("all");

    const filtered = reservations.filter(r => filter === "all" || r.status === filter);

    const addReservation = () => {
        setReservations(prev => [...prev, { id: `R${Date.now()}`, ...newRes, adults: Number(newRes.adults), children: Number(newRes.children), status: "confirmed", tags: [] }]);
        setShowAdd(false);
        setNewRes({ guest: "", phone: "", checkin: "", checkout: "", room: "", adults: 2, children: 0 });
    };

    return (
        <div className="col gap20 fade">
            <div className="row between">
                <div className="col gap4">
                    <div style={{ fontFamily: "Bebas Neue", fontSize: 22, letterSpacing: 1 }}>Gestión de <span style={{ color: "var(--gold)" }}>Reservas</span></div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>
                        {reservations.filter(r => r.status === "checked_in").length} huéspedes en el hotel · {reservations.filter(r => r.status === "confirmed").length} próximas llegadas
                    </div>
                </div>
                <button className="btn-gold" onClick={() => setShowAdd(!showAdd)}>+ Nueva reserva</button>
            </div>

            {/* Filters */}
            <div className="row gap8">
                {[["all", "Todas"], ["confirmed", "Confirmadas"], ["checked_in", "En el hotel"], ["checked_out", "Check-out"]].map(([val, label]) => (
                    <button key={val} onClick={() => setFilter(val)}
                        style={{ background: filter === val ? "var(--blue)" : "var(--surface2)", border: `1px solid ${filter === val ? "var(--blue)" : "var(--border)"}`, borderRadius: 8, padding: "8px 14px", color: filter === val ? "#fff" : "var(--text2)", fontSize: 12, fontWeight: 600 }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="card col gap16" style={{ borderColor: "rgba(245,166,35,0.3)" }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Nueva reserva</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        <div><label>Nombre del huésped</label><input value={newRes.guest} onChange={e => setNewRes(p => ({ ...p, guest: e.target.value }))} placeholder="Juan García" /></div>
                        <div><label>Teléfono WhatsApp</label><input value={newRes.phone} onChange={e => setNewRes(p => ({ ...p, phone: e.target.value }))} placeholder="+5491155557890" /></div>
                        <div><label>Habitación</label><input value={newRes.room} onChange={e => setNewRes(p => ({ ...p, room: e.target.value }))} placeholder="Suite 301" /></div>
                        <div><label>Check-in</label><input type="date" value={newRes.checkin} onChange={e => setNewRes(p => ({ ...p, checkin: e.target.value }))} /></div>
                        <div><label>Check-out</label><input type="date" value={newRes.checkout} onChange={e => setNewRes(p => ({ ...p, checkout: e.target.value }))} /></div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div><label>Adultos</label><input type="number" value={newRes.adults} onChange={e => setNewRes(p => ({ ...p, adults: e.target.value }))} /></div>
                            <div><label>Niños</label><input type="number" value={newRes.children} onChange={e => setNewRes(p => ({ ...p, children: e.target.value }))} /></div>
                        </div>
                    </div>
                    <div style={{ background: "rgba(26,143,255,0.06)", border: "1px solid rgba(26,143,255,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--blue2)" }}>
                        ⚡ El bot enviará automáticamente el mensaje de pre-check-in 24hs antes de la llegada
                    </div>
                    <div className="row gap10">
                        <button className="btn-gold" onClick={addReservation}>Guardar reserva</button>
                        <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--text3)", background: "var(--surface2)" }}>
                    <span>Huésped</span><span>Habitación</span><span>Check-in</span><span>Check-out</span><span>Estado</span><span>Tags</span>
                </div>
                {filtered.map(r => (
                    <div key={r.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: "1px solid var(--border)", alignItems: "center" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div className="col gap2">
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{r.guest}</span>
                            <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "DM Mono, monospace" }}>{r.phone}</span>
                        </div>
                        <span style={{ fontSize: 13, color: "var(--text2)" }}>{r.room} · {r.adults}A {r.children > 0 ? `${r.children}N` : ""}</span>
                        <span style={{ fontSize: 13, fontFamily: "DM Mono, monospace" }}>{r.checkin}</span>
                        <span style={{ fontSize: 13, fontFamily: "DM Mono, monospace" }}>{r.checkout}</span>
                        <span className={`badge ${r.status === "checked_in" ? "badge-green" : r.status === "confirmed" ? "badge-blue" : "badge-red"}`} style={{ fontSize: 10 }}>
                            {r.status === "checked_in" ? "En el hotel" : r.status === "confirmed" ? "Confirmada" : "Check-out"}
                        </span>
                        <div className="row gap4">{r.tags.map(t => <Tag key={t} t={t} />)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// VIEW: MÉTRICAS
// ============================================================
function MetricsView({ metrics }) {
    return (
        <div className="col gap20 fade">
            <div style={{ fontFamily: "Bebas Neue", fontSize: 22, letterSpacing: 1 }}>Métricas & <span style={{ color: "var(--gold)" }}>Analytics</span></div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                <KpiCard icon="💰" label="Revenue total generado" value={`$${metrics.revenue_month.toLocaleString()}`} sub="este mes" color="var(--gold)" trend={22} />
                <KpiCard icon="💬" label="Conversaciones atendidas" value={metrics.conversations_month} sub="este mes" color="var(--blue2)" trend={15} />
                <KpiCard icon="✅" label="Tasa de resolución IA" value="94%" color="var(--green)" />
                <KpiCard icon="🛒" label="Conversion upselling" value="38%" sub="34 de 89 ofertas" color="var(--purple)" trend={8} />
                <KpiCard icon="⭐" label="Reseñas Google" value={metrics.google_reviews} sub="gracias al bot" color="var(--gold)" />
                <KpiCard icon="🚨" label="Quejas escaladas" value="3" sub="todas resueltas" color="var(--red)" />
            </div>

            {/* Upsell por stage */}
            <div className="card col gap16">
                <div style={{ fontWeight: 700, fontSize: 14 }}>Revenue generado por el bot — detalle</div>
                {[
                    { stage: "Pre Check-in", offers: 28, accepted: 18, revenue: 1200, color: "var(--blue2)" },
                    { stage: "Durante la estadía", offers: 45, accepted: 14, revenue: 2180, color: "var(--green)" },
                    { stage: "Check-out", offers: 16, accepted: 10, revenue: 450, color: "var(--gold)" },
                    { stage: "Comisiones actividades", offers: 12, accepted: 8, revenue: 990, color: "var(--purple)" },
                ].map(item => (
                    <div key={item.stage}>
                        <div className="row between" style={{ marginBottom: 6 }}>
                            <div className="row gap10">
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{item.stage}</span>
                                <span style={{ fontSize: 11, color: "var(--text3)" }}>{item.accepted}/{item.offers} ofertas aceptadas</span>
                            </div>
                            <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color: item.color }}>${item.revenue.toLocaleString()}</span>
                        </div>
                        <div style={{ background: "var(--surface2)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: item.color, borderRadius: 4, width: `${(item.revenue / metrics.revenue_month * 100).toFixed(0)}%`, transition: "width 1s" }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Reseñas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="card col gap14">
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Gestión de reseñas</div>
                    {[["Encuestas enviadas", 89, "var(--text2)"], ["Respuestas positivas", 67, "var(--green)"], ["Respuestas negativas", 4, "var(--red)"], ["Derivadas a Google", 23, "var(--gold)"]].map(([label, val, color]) => (
                        <div key={label} className="row between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                            <span style={{ fontSize: 13, color: "var(--text2)" }}>{label}</span>
                            <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, color, fontSize: 16 }}>{val}</span>
                        </div>
                    ))}
                </div>
                <div className="card col gap14">
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Top solicitudes de huéspedes</div>
                    {[["Limpieza / Housekeeping", 34], ["Room service", 22], ["Transporte / Taxi", 18], ["Información del hotel", 45], ["Actividades externas", 15]].map(([label, val]) => (
                        <div key={label}>
                            <div className="row between" style={{ marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: "var(--text2)" }}>{label}</span>
                                <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "DM Mono" }}>{val}</span>
                            </div>
                            <div style={{ background: "var(--surface2)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", background: "var(--blue)", borderRadius: 3, width: `${(val / 45 * 100).toFixed(0)}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MAIN APP
// ============================================================

export default function StormGuestHotelPanel() {
    const [view, setView] = useState("dashboard");
    const [hotel, setHotel] = useState({ name: "Cargando...", logo_letter: "H" });
    const [metrics, setMetrics] = useState({});
    const [reservations, setReservations] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = INJECT_STYLES;
        document.head.appendChild(style);

        const hid = localStorage.getItem('hotel_id') || 'h1';

        Promise.all([
            getHotel(hid),
            getAnalytics(hid),
            getReservations(hid),
            getServices(hid)
        ]).then(([hRes, mRes, rRes, sRes]) => {
            setHotel(hRes.data);
            setMetrics(mRes.data);
            setReservations(rRes.data);
            setServices(sRes.data);
            setLoading(false);
        }).catch(err => {
            console.error("Error fetching hotel data:", err);
            setLoading(false);
        });

        return () => {
            if (document.head.contains(style)) document.head.removeChild(style);
        };
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    const nav = [
        { id: "dashboard", icon: "▦", label: "Dashboard" },
        { id: "bot", icon: "🤖", label: "Bot IA" },
        { id: "services", icon: "💰", label: "Servicios" },
        { id: "reservations", icon: "📅", label: "Reservas" },
        { id: "metrics", icon: "📊", label: "Métricas" },
    ];

    if (loading) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: 24, color: "var(--text2)" }}>Cargando...</div>;
    }

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

            {/* SIDEBAR */}
            <div style={{ width: 230, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                {/* Glow */}
                <div style={{ position: "absolute", top: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,143,255,0.06), transparent 70%)", pointerEvents: "none" }} />

                {/* Brand */}
                <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border)" }}>
                    <div className="row gap10 center" style={{ marginBottom: 12 }}>
                        {/* Logo inline SVG brain+bolt */}
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #0a1f40, #0d2a5a)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚡</div>
                        <div>
                            <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 16, letterSpacing: 1, lineHeight: 1, color: "var(--text)" }}>SER STORM</div>
                            <div style={{ fontSize: 9, color: "var(--gold)", fontWeight: 700, letterSpacing: 2 }}>AI SOLUTIONS</div>
                        </div>
                    </div>
                    {/* Hotel info */}
                    <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 9, padding: "10px 12px" }}>
                        <div className="row gap8 center">
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, var(--blue), #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{hotel.logo_letter || hotel.name?.[0]}</div>
                            <div className="col gap1">
                                <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{hotel.name}</div>
                                <div style={{ fontSize: 10, color: "var(--text3)" }}>{hotel.location}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "12px 10px" }}>
                    {nav.map(item => (
                        <button key={item.id} onClick={() => setView(item.id)}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 2, background: view === item.id ? "linear-gradient(90deg, rgba(26,143,255,0.12), transparent)" : "transparent", border: "none", borderRadius: 9, color: view === item.id ? "var(--blue2)" : "var(--text3)", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: view === item.id ? 700 : 400, borderLeft: view === item.id ? "2px solid var(--blue)" : "2px solid transparent" }}>
                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Bot status */}
                <div style={{ padding: "10px 14px", margin: "0 10px 10px", background: "rgba(15,186,129,0.07)", border: "1px solid rgba(15,186,129,0.2)", borderRadius: 9 }}>
                    <div className="row gap8 center">
                        <Dot color="var(--green)" pulse />
                        <div className="col gap1">
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)" }}>Bot {hotel.bot_name} activo</span>
                            <span style={{ fontSize: 10, color: "var(--text3)" }}>{metrics.conversations_today} msgs hoy</span>
                        </div>
                    </div>
                </div>

                {/* User */}
                <div className="row gap10 center" style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, var(--gold), #f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#000" }}>G</div>
                    <div className="col gap1" style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis" }}>Gerente</div>
                        <div style={{ fontSize: 10, color: "var(--text3)" }}>{hotel.name}</div>
                    </div>
                </div>
                <button onClick={handleLogout} style={{ width: "calc(100% - 20px)", margin: "0 10px 10px", padding: 8, fontSize: 11 }} className="btn-danger">Cerrar Sesión</button>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
                {/* Topbar */}
                <div className="row between" style={{ padding: "14px 28px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
                    <div>
                        <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 20, letterSpacing: 1 }}>
                            {nav.find(n => n.id === view)?.label}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>{hotel.name} · {hotel.location}</div>
                    </div>
                    <div className="row gap12">
                        <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "var(--gold)" }} className="row gap6 center">
                            <span>💰</span> Revenue este mes: <strong>${metrics.revenue_month?.toLocaleString()}</strong>
                        </div>
                        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "var(--text2)" }} className="row gap6 center">
                            Plan <span style={{ color: "var(--blue2)", fontWeight: 700 }}>{hotel.plan}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
                    {view === "dashboard" && <DashboardView hotel={hotel} metrics={metrics} reservations={reservations} />}
                    {view === "bot" && <BotView hotel={hotel} />}
                    {view === "services" && <ServicesView servicesData={services} />}
                    {view === "reservations" && <ReservationsView reservationsData={reservations} />}
                    {view === "metrics" && <MetricsView metrics={metrics} />}
                </div>
            </div>
        </div>
    );
}

