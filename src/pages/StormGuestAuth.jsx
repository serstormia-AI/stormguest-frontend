import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { supabase, supabaseAdmin } from "../lib/supabase";

// ============================================================
// SER STORM AI SOLUTIONS — AUTH SYSTEM
// Login unificado para los 3 paneles
// Roles: super_admin | hotel_manager | reception
// ============================================================

const INJECT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #020810;
    --surface: #060f22;
    --surface2:#091629;
    --border:  #0f2040;
    --border2: #173060;
    --text:    #ddeeff;
    --text2:   #6a8aaa;
    --text3:   #2a4060;
    --blue:    #1a8fff;
    --blue2:   #38b0ff;
    --gold:    #f5a623;
    --gold2:   #ffc84a;
    --green:   #0fba81;
    --red:     #ff4d6a;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  /* Animated grid */
  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(26,143,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(26,143,255,0.03) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }

  #root { position: relative; z-index: 1; }

  input {
    background: rgba(6,15,34,0.8);
    border: 1px solid var(--border2);
    border-radius: 10px;
    padding: 13px 16px;
    color: var(--text);
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none; width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s;
    backdrop-filter: blur(8px);
  }
  input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(26,143,255,0.12);
  }
  input::placeholder { color: var(--text3); }
  label {
    display: block; font-size: 11px; font-weight: 700;
    color: var(--text3); letter-spacing: 1.5px;
    text-transform: uppercase; margin-bottom: 7px;
  }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.18s; }

  .fade { animation: fadeUp 0.4s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

  .shimmer {
    animation: shimmer 2s infinite;
  }
  @keyframes shimmer {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
`;

// ============================================================
// DEMO USERS (para la vista de "Cuentas Demo" del frontend)
// ============================================================
const DEMO_USERS = [
  {
    email: "admin@stormguest.com",
    password: "Storm2024!",
    role: "super_admin",
    name: "Admin",
    avatar: "AD",
    panel: "admin",
  },
  {
    email: "manager@demo.com",
    password: "Hotel2024!",
    role: "hotel_manager",
    name: "Manager",
    avatar: "MG",
    hotel: "Hotel Demo",
    hotel_id: "demo",
    panel: "hotel",
  },
  {
    email: "recepcion@demo.com",
    password: "Recep2024!",
    role: "reception",
    name: "Recepcion",
    avatar: "RC",
    hotel: "Hotel Demo",
    hotel_id: "demo",
    panel: "crm",
  }
];

const ROLE_CONFIG = {
  super_admin: { label: "Super Admin", color: "var(--gold)", icon: "🌩️", desc: "Acceso completo a todos los hoteles" },
  hotel_manager: { label: "Gerente de Hotel", color: "var(--blue2)", icon: "🏨", desc: "Gestión completa de tu hotel" },
  reception: { label: "Recepción", color: "var(--green)", icon: "💬", desc: "CRM y conversaciones" },
};

// ============================================================
// PARTICLE LIGHTNING (background effect)
// ============================================================
function LightningBg() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {/* Central glow */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,143,255,0.05) 0%, transparent 65%)" }} />
      {/* Top glow gold */}
      <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 400, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(245,166,35,0.04) 0%, transparent 65%)" }} />
      {/* Circuit lines */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M10,60 H50 V30 H80" stroke="#1a8fff" strokeWidth="0.5" fill="none" />
            <path d="M60,10 V50 H90 V80" stroke="#1a8fff" strokeWidth="0.5" fill="none" />
            <circle cx="50" cy="30" r="2.5" fill="#1a8fff" />
            <circle cx="80" cy="30" r="2.5" fill="#f5a623" />
            <circle cx="90" cy="50" r="2.5" fill="#1a8fff" />
            <path d="M0,90 H40 V110" stroke="#1a8fff" strokeWidth="0.5" fill="none" />
            <circle cx="40" cy="90" r="2" fill="#1a8fff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>
    </div>
  );
}

// ============================================================
// LOGIN FORM
// ============================================================
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) { setError("Ingresá tu email primero."); return; }
    setResetLoading(true);
    setError("");
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: "https://stormguest-frontend.vercel.app/reset-password",
    });
    setResetLoading(false);
    if (resetErr) { setError(resetErr.message); return; }
    setResetSent(true);
  };

  async function performLogin(emailVal, passwordVal) {
    // 1. Try Supabase Auth (users migrated or created via new flow)
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: emailVal.trim().toLowerCase(),
      password: passwordVal,
    });

    if (!authErr && authData?.user) {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('role, hotel_id, name')
        .eq('email', emailVal.trim().toLowerCase())
        .single();
      if (!profile) throw new Error('Perfil de usuario no encontrado');

      // Resolve hotel_id UUID → slug so all pages can query by slug
      let hotelSlug = profile.hotel_id;
      if (hotelSlug && hotelSlug.includes('-')) {
        const { data: h } = await supabaseAdmin.from('hotels').select('slug').eq('id', hotelSlug).maybeSingle();
        if (h?.slug) hotelSlug = h.slug;
      }

      return { token: authData.session.access_token, role: profile.role, hotel_id: hotelSlug, name: profile.name, email: authData.user.email };
    }

    // 2. Fall back to Express (legacy bcrypt users)
    const res = await loginUser(emailVal, passwordVal);
    const userData = res.data;
    // Decode JWT to extract email (no crypto needed — just reading our own token)
    try {
      const payload = JSON.parse(atob(userData.token.split('.')[1]));
      if (payload.email) userData.email = payload.email;
    } catch {}


    // Auto-migrate to Supabase Auth silently — guardar auth_user_id resultante
    supabaseAdmin.auth.admin.createUser({
      email: emailVal.trim().toLowerCase(),
      password: passwordVal,
      email_confirm: true,
      user_metadata: { name: userData.name, role: userData.role, hotel_id: userData.hotel_id },
    }).then(({ data }) => {
      if (data?.user?.id) {
        supabaseAdmin.from('users')
          .update({ auth_user_id: data.user.id })
          .eq('email', emailVal.trim().toLowerCase())
          .catch(() => {});
      }
    }).catch(() => {});

    return userData;
  }

  const handleSubmit = async () => {
    if (!email || !password) { setError("Completá todos los campos"); return; }
    setLoading(true);
    setError("");
    try {
      const userData = await performLogin(email, password);
      localStorage.setItem('token', userData.token);
      localStorage.setItem('role', userData.role);
      localStorage.setItem('hotel_id', userData.hotel_id);
      localStorage.setItem('name', userData.name);
      if (userData.email) localStorage.setItem('email', userData.email);
      onLogin(userData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Error al conectar con el servidor.");
      setLoading(false);
    }
  };

  const quickLogin = async (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setDemoOpen(false);
    setLoading(true);
    try {
      const userData = await performLogin(user.email, user.password);
      localStorage.setItem('token', userData.token);
      localStorage.setItem('role', userData.role);
      localStorage.setItem('hotel_id', userData.hotel_id);
      localStorage.setItem('name', userData.name);
      if (userData.email) localStorage.setItem('email', userData.email);
      onLogin(userData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Error al iniciar sesión.");
      setLoading(false);
    }
  };

  return (
    <div className="fade" style={{ width: "100%", maxWidth: 420 }}>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #0a1f40, #0d2a5a)", border: "1px solid var(--border2)", marginBottom: 18, position: "relative", boxShadow: "0 0 40px rgba(26,143,255,0.15)" }}>
          <span style={{ fontSize: 38 }}>⚡</span>
          {/* Subtle circuit dots */}
          <div style={{ position: "absolute", top: 8, right: 8, width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", opacity: 0.7 }} className="shimmer" />
          <div style={{ position: "absolute", bottom: 10, left: 10, width: 4, height: 4, borderRadius: "50%", background: "var(--blue)", opacity: 0.7 }} className="shimmer" />
        </div>
        <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 28, letterSpacing: 3, color: "var(--text)", lineHeight: 1 }}>SER STORM</div>
        <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700, letterSpacing: 3, marginTop: 4 }}>AI SOLUTIONS</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 12 }}>Plataforma de gestión hotelera con IA</div>
      </div>

      {/* Card */}
      <div style={{ background: "rgba(6,15,34,0.85)", border: "1px solid var(--border2)", borderRadius: 18, padding: "32px 28px", backdropFilter: "blur(16px)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ fontFamily: "Bebas Neue", fontSize: 22, letterSpacing: 1, marginBottom: 24, color: "var(--text)" }}>Iniciar sesión</div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="gerente@tuhotel.com"
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 24, position: "relative" }}>
          <label>Contraseña</label>
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{ paddingRight: 44 }}
          />
          <button onClick={() => setShowPass(!showPass)}
            style={{ position: "absolute", right: 14, top: 34, background: "none", border: "none", color: "var(--text3)", fontSize: 16, padding: 0 }}>
            {showPass ? "🙈" : "👁"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.25)", borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "var(--red)", marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "13px", borderRadius: 11, border: "none", background: loading ? "var(--surface2)" : "linear-gradient(135deg, var(--gold), var(--gold2))", color: loading ? "var(--text3)" : "#08080a", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, boxShadow: loading ? "none" : "0 6px 24px rgba(245,166,35,0.3)" }}>
          {loading ? "⚡ Verificando..." : "Ingresar al sistema"}
        </button>

        {/* Forgot */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          {resetSent ? (
            <div style={{ fontSize: 13, color: "var(--green)" }}>
              ✅ Revisá tu email para resetear la contraseña.
            </div>
          ) : (
            <button
              style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 12, cursor: "pointer" }}
              onClick={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? "Enviando..." : "¿Olvidaste tu contraseña?"}
            </button>
          )}
        </div>
      </div>

      {/* Demo accounts — solo en desarrollo, nunca en producción */}
      {import.meta.env.DEV && <div style={{ marginTop: 20 }}>
        <button onClick={() => setDemoOpen(!demoOpen)}
          style={{ width: "100%", background: "rgba(26,143,255,0.06)", border: "1px solid rgba(26,143,255,0.2)", borderRadius: 11, padding: "11px", color: "var(--blue2)", fontSize: 13, fontWeight: 600 }}>
          {demoOpen ? "▲" : "▼"} Ver cuentas de demo (Testing)
        </button>

        {demoOpen && (
          <div className="fade" style={{ marginTop: 10, background: "rgba(6,15,34,0.85)", border: "1px solid var(--border2)", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(12px)" }}>
            {DEMO_USERS.map((u, i) => {
              const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.hotel_manager;
              return (
                <button key={u.email} onClick={() => quickLogin(u)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", background: "transparent", border: "none", borderBottom: i < DEMO_USERS.length - 1 ? "1px solid var(--border)" : "none", textAlign: "left", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(26,143,255,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: rc.color + "20", border: `1px solid ${rc.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {rc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email} · {rc.label}</div>
                  </div>
                  <div style={{ fontSize: 12, color: rc.color, fontWeight: 700, flexShrink: 0 }}>→</div>
                </button>
              );
            })}
          </div>
        )}
      </div>}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 28, fontSize: 11, color: "var(--text3)" }}>
        Powered by <span style={{ color: "var(--gold)", fontWeight: 700 }}>Ser Storm AI Solutions</span>
        <br />Todos los derechos reservados © 2024
      </div>
    </div>
  );
}

// ============================================================
// SUCCESS SCREEN (post login, antes de redirigir)
// ============================================================
function WelcomeScreen({ user, onContinue }) {
  const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.hotel_manager;

  useEffect(() => {
    const t = setTimeout(onContinue, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fade" style={{ textAlign: "center", color: "var(--text)" }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>{rc.icon}</div>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 36, letterSpacing: 2, color: rc.color, marginBottom: 8 }}>
        Bienvenido
      </div>
      <div style={{ fontFamily: "Bebas Neue", fontSize: 24, letterSpacing: 1, marginBottom: 14 }}>{user.name}</div>
      {user.hotel && <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 6 }}>{user.hotel}</div>}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: rc.color + "15", border: `1px solid ${rc.color}30`, borderRadius: 20, padding: "6px 16px", fontSize: 12, color: rc.color, fontWeight: 700 }}>
        {rc.label}
      </div>
      <div style={{ marginTop: 30, color: "var(--text3)", fontSize: 13 }} className="shimmer">
        Cargando tu panel...
      </div>
    </div>
  );
}

// ============================================================
// MAIN — AUTH ROUTER
// ============================================================
export default function StormGuestAuth() {
  const [user, setUser] = useState(null);
  const [welcome, setWelcome] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Si ya existe token, checkeamos para auto-redirect
    const token = localStorage.getItem('token');
    if (token && !user) {
      // Redirigimos directo si ya estaba logeado previamente en refresh
      const storedRole = localStorage.getItem('role');
      navigate("/");
    }

    const style = document.createElement("style");
    style.textContent = INJECT_STYLES;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) document.head.removeChild(style);
    }
  }, [navigate, user]);

  const handleLogin = (u) => {
    setUser(u);
    setWelcome(true);
  };

  const handleContinue = () => {
    if (!user) return;
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative" }}>
      <LightningBg />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {welcome && user
          ? <WelcomeScreen user={user} onContinue={handleContinue} />
          : <LoginForm onLogin={handleLogin} />
        }
      </div>
    </div>
  );
}
