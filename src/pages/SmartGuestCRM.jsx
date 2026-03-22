import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getGuests } from "../services/api";

// ============================================================
// MOCK DATA - Reemplazar con fetch real al backend
// ============================================================
const MOCK_KANBAN = {
  "Nuevo": [
    { id: "1", guest_name: "Martín García", guest_phone: "+5491155557890", last_message: "Hola! ¿tienen disponibilidad para el finde?", last_message_at: new Date(Date.now() - 300000).toISOString(), tags: ["pareja"], stage: "inquiry" },
    { id: "2", guest_name: "Laura Pérez", guest_phone: "+5491144445678", last_message: "Me interesa el spa que mencionaron", last_message_at: new Date(Date.now() - 600000).toISOString(), tags: ["familia"], stage: "during_stay" },
  ],
  "Reservas": [
    { id: "3", guest_name: "Carlos Rodríguez", guest_phone: "+5491133338901", last_message: "Perfecto! Confirmo la reserva del 15/03", last_message_at: new Date(Date.now() - 1800000).toISOString(), tags: ["negocios"], stage: "pre_stay" },
  ],
  "En proceso": [
    { id: "4", guest_name: "Ana Martínez", guest_phone: "+5491122221234", last_message: "Necesito que limpien la habitación", last_message_at: new Date(Date.now() - 900000).toISOString(), tags: ["familia", "esquiador"], stage: "during_stay" },
    { id: "5", guest_name: "Diego López", guest_phone: "+5491111115678", last_message: "Podrían traerme una almohada extra?", last_message_at: new Date(Date.now() - 1200000).toISOString(), tags: ["pareja"], stage: "during_stay" },
  ],
  "Quejas": [
    { id: "6", guest_name: "Sofía Castro", guest_phone: "+5491199998765", last_message: "El aire acondicionado no funciona bien", last_message_at: new Date(Date.now() - 2400000).toISOString(), tags: [], stage: "during_stay" },
  ],
  "Resuelto": [],
};

const MOCK_STATS = {
  conversations: { total: 234, new_count: 12, in_progress: 45, resolved: 177, escalated: 3 },
  upselling: { total_offers: 89, accepted: 34, total_revenue: 4250, conversion_rate: 38.2 },
  reviews: { positive: 67, negative: 4, google_reviews: 52 },
  tags: [
    { tag: "pareja", count: 89 }, { tag: "familia", count: 67 }, { tag: "esquiador", count: 45 },
    { tag: "negocios", count: 34 }, { tag: "amigos", count: 28 },
  ],
  revenue: { total_revenue: 4250, pre_stay_revenue: 1200, during_stay_revenue: 2180, checkout_revenue: 870 },
};

const MOCK_GUESTS = [
  { id: "g1", name: "Martín García", phone: "+5491155557890", email: "martin@email.com", tags: ["pareja", "esquiador"], total_stays: 3, total_spent: 850, last_contact: new Date().toISOString() },
  { id: "g2", name: "Laura Pérez", phone: "+5491144445678", email: "laura@email.com", tags: ["familia"], total_stays: 1, total_spent: 320, last_contact: new Date(Date.now() - 86400000).toISOString() },
  { id: "g3", name: "Carlos Rodríguez", phone: "+5491133338901", email: "carlos@empresa.com", tags: ["negocios"], total_stays: 8, total_spent: 2100, last_contact: new Date(Date.now() - 172800000).toISOString() },
  { id: "g4", name: "Ana Martínez", phone: "+5491122221234", email: "ana@email.com", tags: ["familia", "esquiador"], total_stays: 2, total_spent: 640, last_contact: new Date(Date.now() - 3600000).toISOString() },
];

// ============================================================
// UTILS
// ============================================================
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function tagColor(tag) {
  const colors = {
    pareja: "#e879f9", familia: "#38bdf8", esquiador: "#a78bfa",
    negocios: "#fb923c", amigos: "#4ade80", turismo: "#facc15",
    evento_musical: "#f472b6", evento_deportivo: "#34d399",
  };
  return colors[tag] || "#94a3b8";
}

// ============================================================
// COMPONENTS
// ============================================================

function Tag({ label }) {
  return (
    <span style={{
      background: tagColor(label) + "22",
      color: tagColor(label),
      border: `1px solid ${tagColor(label)}44`,
      borderRadius: 4, padding: "1px 7px", fontSize: 10,
      fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, color = "#3b82f6", icon }) {
  return (
    <div style={{
      background: "#111827", border: "1px solid #1f2937",
      borderRadius: 12, padding: "20px 24px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "12px 12px 0 0" }} />
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#f9fafb", fontFamily: "monospace" }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function GuestCard({ conv, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#0f172a", border: "1px solid #1e293b",
      borderRadius: 10, padding: "12px 14px", marginBottom: 8,
      cursor: "pointer", transition: "all 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 13 }}>
          {conv.guest_name || conv.guest_phone}
        </div>
        <div style={{ fontSize: 10, color: "#475569" }}>{timeAgo(conv.last_message_at)}</div>
      </div>
      <div style={{
        fontSize: 12, color: "#64748b", marginBottom: 8, lineHeight: 1.4,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
      }}>
        {conv.last_message}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {conv.tags?.map(t => <Tag key={t} label={t} />)}
        <span style={{
          background: "#1e3a5f", color: "#60a5fa", borderRadius: 4,
          padding: "1px 7px", fontSize: 10, fontWeight: 600,
        }}>
          {conv.stage?.replace("_", " ")}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// VIEWS
// ============================================================

function KanbanView() {
  const [columns, setColumns] = useState(MOCK_KANBAN);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const handleDrop = (targetCol) => {
    if (!dragging) return;
    const { card, sourceCol } = dragging;
    if (sourceCol === targetCol) { setDragging(null); return; }

    setColumns(prev => {
      const newCols = { ...prev };
      newCols[sourceCol] = newCols[sourceCol].filter(c => c.id !== card.id);
      newCols[targetCol] = [card, ...newCols[targetCol]];
      return newCols;
    });
    setDragging(null);
    setDragOver(null);
  };

  const colColors = {
    "Nuevo": "#3b82f6", "Reservas": "#10b981", "En proceso": "#f59e0b",
    "Quejas": "#ef4444", "Resuelto": "#6b7280"
  };

  return (
    <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "0 0 16px 0" }}>
      {Object.entries(columns).map(([colName, cards]) => (
        <div
          key={colName}
          onDragOver={e => { e.preventDefault(); setDragOver(colName); }}
          onDrop={() => handleDrop(colName)}
          onDragLeave={() => setDragOver(null)}
          style={{
            minWidth: 260, maxWidth: 280, flex: "0 0 260px",
            background: dragOver === colName ? "#1a2744" : "#0f172a",
            border: `1px solid ${dragOver === colName ? colColors[colName] : "#1e293b"}`,
            borderRadius: 12, padding: 12,
            transition: "all 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: colColors[colName] }} />
            <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 13 }}>{colName}</span>
            <span style={{
              marginLeft: "auto", background: "#1e293b", color: "#94a3b8",
              borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 600,
            }}>{cards.length}</span>
          </div>
          <div style={{ minHeight: 100 }}>
            {cards.map(card => (
              <div
                key={card.id}
                draggable
                onDragStart={() => setDragging({ card, sourceCol: colName })}
                style={{ opacity: dragging?.card?.id === card.id ? 0.5 : 1 }}
              >
                <GuestCard conv={card} onClick={() => { }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsView() {
  const s = MOCK_STATS;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="💬" label="Conversaciones totales" value={s.conversations.total} sub={`+${s.conversations.new_count} nuevas hoy`} color="#3b82f6" />
        <StatCard icon="💰" label="Revenue generado" value={`$${s.upselling.total_revenue}`} sub={`${s.upselling.conversion_rate}% conversión`} color="#10b981" />
        <StatCard icon="⭐" label="Reseñas positivas" value={s.reviews.positive} sub={`${s.reviews.google_reviews} en Google`} color="#f59e0b" />
        <StatCard icon="🔥" label="Upsells aceptados" value={s.upselling.accepted} sub={`de ${s.upselling.total_offers} ofertas`} color="#a78bfa" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Revenue breakdown */}
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 16, fontSize: 14 }}>Revenue por Stage</div>
          {[
            { label: "Pre Check-in", val: s.revenue.pre_stay_revenue, color: "#3b82f6" },
            { label: "Durante la estadía", val: s.revenue.during_stay_revenue, color: "#10b981" },
            { label: "Check-out", val: s.revenue.checkout_revenue, color: "#f59e0b" },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>${item.val}</span>
              </div>
              <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4, background: item.color,
                  width: `${(item.val / s.revenue.total_revenue * 100).toFixed(0)}%`,
                  transition: "width 1s ease"
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Tags distribution */}
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 16, fontSize: 14 }}>Tipo de huésped</div>
          {s.tags.map((t, i) => (
            <div key={t.tag} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, textAlign: "right", color: "#475569", fontSize: 11 }}>#{i + 1}</div>
              <Tag label={t.tag} />
              <div style={{ flex: 1, background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  background: tagColor(t.tag),
                  width: `${(t.count / s.tags[0].count * 100).toFixed(0)}%`
                }} />
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", width: 30, textAlign: "right" }}>{t.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuestsView({ guests }) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);

  const filtered = guests.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.phone.includes(search);
    const matchTag = !selectedTag || g.tags.includes(selectedTag);
    return matchSearch && matchTag;
  });

  const allTags = [...new Set(guests.flatMap(g => g.tags))];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar huésped, teléfono..."
          style={{
            background: "#111827", border: "1px solid #1f2937", borderRadius: 8,
            padding: "10px 14px", color: "#e2e8f0", fontSize: 13, flex: 1, minWidth: 200,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              style={{
                background: selectedTag === tag ? tagColor(tag) + "33" : "#111827",
                border: `1px solid ${selectedTag === tag ? tagColor(tag) : "#1f2937"}`,
                borderRadius: 8, padding: "8px 14px", color: selectedTag === tag ? tagColor(tag) : "#94a3b8",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1.5fr 2fr 1fr 1fr 1fr",
          padding: "12px 20px", borderBottom: "1px solid #1f2937",
          fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
        }}>
          <span>Huésped</span><span>Teléfono</span><span>Tags</span>
          <span>Estadías</span><span>Gasto total</span><span>Último contacto</span>
        </div>
        {filtered.map(g => (
          <div key={g.id} style={{
            display: "grid", gridTemplateColumns: "2fr 1.5fr 2fr 1fr 1fr 1fr",
            padding: "14px 20px", borderBottom: "1px solid #0f172a",
            alignItems: "center", cursor: "pointer", transition: "background 0.1s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#0f172a"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div>
              <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 14 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: "#475569" }}>{g.email}</div>
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13, fontFamily: "monospace" }}>{g.phone}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {g.tags.map(t => <Tag key={t} label={t} />)}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 14, textAlign: "center" }}>{g.total_stays}</div>
            <div style={{ color: "#10b981", fontSize: 14, fontWeight: 700 }}>${g.total_spent}</div>
            <div style={{ color: "#475569", fontSize: 12 }}>{timeAgo(g.last_contact)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignView({ guests }) {
  const [template, setTemplate] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");

  const allTags = ["pareja", "familia", "esquiador", "negocios", "amigos", "turismo"];

  const generateMessage = async () => {
    setGenerating(true);
    // Simular generación con IA
    await new Promise(r => setTimeout(r, 1500));
    setTemplate(`¡Hola {nombre}! 👋\n\n¿Ya pensaron en su próxima escapada? En ${selectedTags.includes("esquiador") ? "la temporada de nieve" : "nuestro hotel"} los esperamos con los brazos abiertos.\n\nTenemos una propuesta especial preparada para ustedes. ¿Les cuento más? 🏔️`);
    setGenerating(false);
  };

  const estimatedReach = selectedTags.length === 0 ? guests.length :
    guests.filter(g => selectedTags.some(t => g.tags.includes(t))).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 16, fontSize: 14 }}>Nueva Campaña</div>
          <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
            placeholder="Nombre de la campaña..."
            style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, marginBottom: 12, outline: "none", boxSizing: "border-box" }} />

          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Segmento objetivo:</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setSelectedTags(prev =>
                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
              )}
                style={{
                  background: selectedTags.includes(tag) ? tagColor(tag) + "22" : "#0f172a",
                  border: `1px solid ${selectedTags.includes(tag) ? tagColor(tag) : "#1e293b"}`,
                  borderRadius: 6, padding: "6px 12px", color: selectedTags.includes(tag) ? tagColor(tag) : "#64748b",
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                }}>
                {tag}
              </button>
            ))}
          </div>

          <div style={{ background: "#0f172a", borderRadius: 8, padding: 12, marginBottom: 12, border: "1px solid #1e293b" }}>
            <span style={{ color: "#10b981", fontWeight: 700, fontSize: 18 }}>{estimatedReach}</span>
            <span style={{ color: "#6b7280", fontSize: 12 }}> huéspedes alcanzados</span>
          </div>

          <input value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="Describí el objetivo de la campaña para que la IA la genere..."
            style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />

          <button onClick={generateMessage} disabled={generating}
            style={{
              width: "100%", background: generating ? "#1e293b" : "linear-gradient(135deg, #3b82f6, #6366f1)",
              border: "none", borderRadius: 8, padding: "11px", color: "#fff",
              fontWeight: 700, fontSize: 13, cursor: generating ? "default" : "pointer",
            }}>
            {generating ? "✨ Generando con IA..." : "✨ Generar mensaje con IA"}
          </button>
        </div>
      </div>

      <div>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 16, fontSize: 14 }}>Preview del mensaje</div>

          {/* Mockup WhatsApp */}
          <div style={{ background: "#0a0a0a", borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏨</div>
              <div>
                <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>Hotel</div>
                <div style={{ color: "#10b981", fontSize: 10 }}>● en línea</div>
              </div>
            </div>
            <div style={{ background: "#1e3a5f", borderRadius: "12px 12px 12px 4px", padding: "10px 14px", maxWidth: "85%", marginLeft: 0 }}>
              <div style={{ color: "#e2e8f0", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {template || "El mensaje aparecerá aquí después de generarlo con IA..."}
              </div>
              <div style={{ color: "#60a5fa", fontSize: 10, textAlign: "right", marginTop: 4 }}>Ahora ✓✓</div>
            </div>
          </div>

          <textarea value={template} onChange={e => setTemplate(e.target.value)}
            placeholder="O escribí el mensaje manualmente..."
            rows={6}
            style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, marginBottom: 10, outline: "none", resize: "vertical", boxSizing: "border-box" }} />

          <button style={{
            width: "100%", background: "linear-gradient(135deg, #10b981, #059669)",
            border: "none", borderRadius: 8, padding: "11px", color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            🚀 Enviar campaña ahora
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function SmartGuestCRM() {
  const [activeView, setActiveView] = useState("kanban");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [guests, setGuests] = useState(MOCK_GUESTS);
  const navigate = useNavigate();

  useEffect(() => {
    const hotel_id = localStorage.getItem('hotel_id') || 'h1';
    getGuests(hotel_id).then(res => {
      // Formatear datos de API para encajar con el frontend
      const apiGuests = res.data.map(g => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        email: g.email || "",
        tags: g.tags || [],
        total_stays: g.total_stays || 1,
        total_spent: g.total_spent || 0,
        last_contact: g.last_contact || new Date().toISOString()
      }));
      setGuests(apiGuests);
    }).catch(console.error);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const nav = [
    { id: "kanban", icon: "⬛", label: "CRM Kanban" },
    { id: "analytics", icon: "📊", label: "Analytics" },
    { id: "guests", icon: "👥", label: "Huéspedes" },
    { id: "campaigns", icon: "📣", label: "Campañas" },
  ];

  return (
    <div style={{
      display: "flex", height: "100vh", background: "#030712",
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
      color: "#e2e8f0", overflow: "hidden",
    }}>

      {/* SIDEBAR */}
      <div style={{
        width: sidebarOpen ? 220 : 64, transition: "width 0.25s ease",
        background: "#070f1e", borderRight: "1px solid #0f1e33",
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 16px 20px", borderBottom: "1px solid #0f1e33", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>⚡</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#f1f5f9", letterSpacing: -0.5 }}>SmartGuest</div>
              <div style={{ fontSize: 10, color: "#3b82f6", fontWeight: 600 }}>AI PLATFORM</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {nav.map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: sidebarOpen ? "10px 12px" : "10px", marginBottom: 4,
                background: activeView === item.id ? "#0f2244" : "transparent",
                border: "none", borderRadius: 8,
                color: activeView === item.id ? "#60a5fa" : "#475569",
                cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 600,
                transition: "all 0.15s",
                borderLeft: activeView === item.id ? "2px solid #3b82f6" : "2px solid transparent",
              }}
              onMouseEnter={e => { if (activeView !== item.id) e.currentTarget.style.color = "#94a3b8"; }}
              onMouseLeave={e => { if (activeView !== item.id) e.currentTarget.style.color = "#475569"; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            margin: 10, padding: 10, background: "#0f1e33", border: "1px solid #1e3a5f",
            borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: 14,
          }}>
          {sidebarOpen ? "◀" : "▶"}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: "16px 28px", borderBottom: "1px solid #0f1e33",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#070f1e",
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>
              {nav.find(n => n.id === activeView)?.label}
            </h1>
            <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>
              Hotel Interamericano · Bariloche
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{
              background: "#0f2244", border: "1px solid #1e3a5f",
              borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#60a5fa",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              IA Activa
            </div>
            <button onClick={handleLogout} style={{
              width: 36, height: 36, borderRadius: "50%", border: "none",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, cursor: "pointer",
            }} title="Cerrar sesión">👤</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 28 }}>
          {activeView === "kanban" && <KanbanView />}
          {activeView === "analytics" && <AnalyticsView />}
          {activeView === "guests" && <GuestsView guests={guests} />}
          {activeView === "campaigns" && <CampaignView guests={guests} />}
        </div>
      </div>
    </div>
  );
}
