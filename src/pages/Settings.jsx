import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Eye, EyeOff, Send, Loader2, CheckCircle, AlertCircle, CreditCard, Building2, Palette } from 'lucide-react';
import { getSettings, updateSettings, testNotification } from '../services/api';
import { supabaseAdmin } from '../lib/supabase';

// Prompt base de Julia — mismo que el backend, para poder restaurarlo
const BASE_PROMPT_PLACEHOLDER = `Eres Julia, la asistente virtual de este hotel. Tu rol es atender a los huéspedes con calidez, profesionalismo y eficiencia.

Tono: cálido, profesional y conciso. Detecta automáticamente el idioma del huésped y responde siempre en ese mismo idioma. Máximo 3-4 oraciones por respuesta.`;

function Alert({ type, message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
      isError
        ? 'bg-red-950/50 border border-red-800 text-red-300'
        : 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
    }`}>
      {isError
        ? <AlertCircle className="w-4 h-4 shrink-0" />
        : <CheckCircle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  );
}

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" />;
}

function ConfiguredBadge({ configured }) {
  return configured ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
      <CheckCircle className="w-3 h-3" /> Configurado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500">
      Sin configurar
    </span>
  );
}

export default function Settings() {
  // ── Hotel branding ────────────────────────────────────────────
  const [hotel, setHotel] = useState({ name: '', primary_color: '#C9964A', primary_color_light: '#E2B96E', logo_url: '' });
  const [hotelId, setHotelId] = useState('');
  const [hotelSaving, setHotelSaving] = useState(false);
  const [hotelStatus, setHotelStatus] = useState(null);

  useEffect(() => {
    const loadHotel = async () => {
      const slug = localStorage.getItem('hotel_id') || 'demo';
      const { data } = await supabaseAdmin.from('hotels')
        .select('id, name, primary_color, primary_color_light, logo_url, concierge_name')
        .eq('slug', slug).single();
      if (data) {
        setHotelId(data.id);
        setHotel({
          name: data.name || '',
          primary_color: data.primary_color || '#C9964A',
          primary_color_light: data.primary_color_light || '#E2B96E',
          logo_url: data.logo_url || '',
          concierge_name: data.concierge_name || 'Julia',
        });
      }
    };
    loadHotel();
  }, []);

  const handleSaveHotel = async () => {
    if (!hotelId) return;
    setHotelSaving(true);
    setHotelStatus(null);
    const { error } = await supabaseAdmin.from('hotels').update({
      name: hotel.name,
      primary_color: hotel.primary_color,
      primary_color_light: hotel.primary_color_light,
      logo_url: hotel.logo_url || null,
      concierge_name: hotel.concierge_name || 'Julia',
    }).eq('id', hotelId);
    setHotelSaving(false);
    setHotelStatus(error
      ? { type: 'error', message: 'Error al guardar: ' + error.message }
      : { type: 'success', message: 'Datos del hotel actualizados. Recargá la guest app para ver los cambios.' }
    );
  };

  // ── Prompt de Julia ──────────────────────────────────────────
  const [prompt, setPrompt] = useState('');
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptStatus, setPromptStatus] = useState(null); // { type, message }

  // ── SMTP ──────────────────────────────────────────────────────
  const [smtp, setSmtp] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState(null); // { type, message }

  // ── Stripe ────────────────────────────────────────────────────
  const [stripe, setStripe] = useState({
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
  });
  const [hasStripeSecret, setHasStripeSecret] = useState(false);
  const [hasStripeWebhook, setHasStripeWebhook] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [stripeSaving, setStripeSaving] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null); // { type, message }

  // ── Cargar config al montar ──────────────────────────────────
  useEffect(() => {
    // Prompt viene de Supabase (concierge_personality), ya cargado en loadHotel
    getSettings()
      .then((data) => {
        setSmtp({
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port || 587,
          smtp_user: data.smtp_user || '',
          smtp_pass: '',
          smtp_from: data.smtp_from || '',
        });
        setStripe({
          stripe_publishable_key: data.stripe_publishable_key || '',
          stripe_secret_key: '',
          stripe_webhook_secret: '',
        });
        setHasStripeSecret(!!data.has_stripe_secret);
        setHasStripeWebhook(!!data.has_stripe_webhook);
      })
      .catch(() => {});
  }, []);

  // Cargar prompt desde Supabase cuando hotelId esté disponible
  useEffect(() => {
    if (!hotelId) return;
    supabaseAdmin.from('hotels').select('concierge_personality').eq('id', hotelId).single()
      .then(({ data }) => { if (data?.concierge_personality) setPrompt(data.concierge_personality); });
  }, [hotelId]);

  // ── Guardar prompt ───────────────────────────────────────────
  async function handleSavePrompt() {
    if (!hotelId) return;
    setPromptSaving(true);
    setPromptStatus(null);
    try {
      const { error } = await supabaseAdmin.from('hotels').update({ concierge_personality: prompt || null }).eq('id', hotelId);
      if (error) throw error;
      setPromptStatus({ type: 'success', message: 'Prompt guardado correctamente.' });
    } catch {
      setPromptStatus({ type: 'error', message: 'Error al guardar. Intentá de nuevo.' });
    } finally {
      setPromptSaving(false);
    }
  }

  function handleRestorePrompt() {
    setPrompt('');
    setPromptStatus({ type: 'success', message: 'Prompt restablecido al valor por defecto. Guardá para confirmar.' });
  }

  // ── Guardar SMTP ─────────────────────────────────────────────
  async function handleSaveSmtp() {
    setSmtpSaving(true);
    setSmtpStatus(null);
    try {
      const payload = { ...smtp };
      // Si no se tocó la contraseña, no la enviamos para no pisar la existente
      if (!payload.smtp_pass) delete payload.smtp_pass;
      await updateSettings(payload);
      setSmtpStatus({ type: 'success', message: 'Configuración de email guardada.' });
    } catch {
      setSmtpStatus({ type: 'error', message: 'Error al guardar. Verificá los datos e intentá de nuevo.' });
    } finally {
      setSmtpSaving(false);
    }
  }

  // ── Probar email ─────────────────────────────────────────────
  async function handleTestEmail() {
    setSmtpTesting(true);
    setSmtpStatus(null);
    try {
      const result = await testNotification();
      if (result.sent) {
        setSmtpStatus({ type: 'success', message: `Email de prueba enviado a ${result.to}.` });
      } else {
        setSmtpStatus({ type: 'error', message: `No se pudo enviar: ${result.reason || 'configuración incompleta'}` });
      }
    } catch {
      setSmtpStatus({ type: 'error', message: 'Error al probar la configuración.' });
    } finally {
      setSmtpTesting(false);
    }
  }

  // ── Guardar Stripe ───────────────────────────────────────────
  async function handleSaveStripe() {
    setStripeSaving(true);
    setStripeStatus(null);
    try {
      const payload = {};
      // Siempre enviamos la publicable (puede borrarse poniéndola vacía)
      payload.stripe_publishable_key = stripe.stripe_publishable_key;
      // Solo enviamos secretas si el usuario escribió algo
      if (stripe.stripe_secret_key) payload.stripe_secret_key = stripe.stripe_secret_key;
      if (stripe.stripe_webhook_secret) payload.stripe_webhook_secret = stripe.stripe_webhook_secret;

      const result = await updateSettings(payload);

      // Actualizar indicadores con lo que devuelve el servidor
      if (result?.data) {
        setHasStripeSecret(!!result.data.has_stripe_secret);
        setHasStripeWebhook(!!result.data.has_stripe_webhook);
        setStripe((s) => ({
          ...s,
          stripe_publishable_key: result.data.stripe_publishable_key || s.stripe_publishable_key,
          stripe_secret_key: '',
          stripe_webhook_secret: '',
        }));
      }

      setStripeStatus({ type: 'success', message: 'Configuración de Stripe guardada correctamente.' });
    } catch {
      setStripeStatus({ type: 'error', message: 'Error al guardar. Verificá los datos e intentá de nuevo.' });
    } finally {
      setStripeSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración del Hotel</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Personalizá el comportamiento de Julia y la configuración de correo para tu hotel.
        </p>
      </div>

      {/* ── Card: Hotel Branding ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Información del Hotel</h2>
            <p className="text-zinc-400 text-sm mt-0.5">Nombre, colores y logo que ven los huéspedes en la app.</p>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: hotel.primary_color + '20', border: '1px solid ' + hotel.primary_color + '40' }}>
            <Building2 className="w-5 h-5" style={{ color: hotel.primary_color }} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Nombre del hotel</label>
            <input type="text" value={hotel.name}
              onChange={e => setHotel(h => ({ ...h, name: e.target.value }))}
              placeholder="Ej: Serstormia Hotel & Suites"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600" />
          </div>

          {/* Colores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" /> Color principal
              </label>
              <div className="flex items-center gap-3">
                <input type="color" value={hotel.primary_color}
                  onChange={e => setHotel(h => ({ ...h, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-700 bg-zinc-950 p-0.5" />
                <input type="text" value={hotel.primary_color}
                  onChange={e => setHotel(h => ({ ...h, primary_color: e.target.value }))}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-emerald-600" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" /> Color claro
              </label>
              <div className="flex items-center gap-3">
                <input type="color" value={hotel.primary_color_light}
                  onChange={e => setHotel(h => ({ ...h, primary_color_light: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-zinc-700 bg-zinc-950 p-0.5" />
                <input type="text" value={hotel.primary_color_light}
                  onChange={e => setHotel(h => ({ ...h, primary_color_light: e.target.value }))}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-emerald-600" />
              </div>
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Nombre del concierge IA</label>
            <input type="text" value={hotel.concierge_name || ''}
              onChange={e => setHotel(h => ({ ...h, concierge_name: e.target.value }))}
              placeholder="Ej: Julia, Brown, Pedro..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">URL del logo</label>
            <div className="flex items-center gap-3">
              {hotel.logo_url && (
                <img src={hotel.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-zinc-800 border border-zinc-700 p-1 flex-shrink-0" />
              )}
              <input type="text" value={hotel.logo_url}
                onChange={e => setHotel(h => ({ ...h, logo_url: e.target.value }))}
                placeholder="https://... (dejá vacío para usar la inicial del nombre)"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600" />
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl p-4 border border-zinc-700 bg-zinc-950">
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Preview en la app</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: hotel.primary_color + '30', border: '1px solid ' + hotel.primary_color + '50' }}>
                {hotel.logo_url
                  ? <img src={hotel.logo_url} className="w-6 h-6 object-contain" />
                  : <span className="font-bold text-lg" style={{ color: hotel.primary_color }}>{hotel.name?.[0] || 'H'}</span>
                }
              </div>
              <div>
                <p className="font-bold text-white text-sm">{hotel.name || 'Nombre del hotel'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-2.5 h-2.5" viewBox="0 0 24 24" fill={hotel.primary_color}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                  <span className="text-[10px] ml-1" style={{ color: hotel.primary_color + '80' }}>Luxury Collection</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Alert type={hotelStatus?.type} message={hotelStatus?.message} />

        <button onClick={handleSaveHotel} disabled={hotelSaving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
          {hotelSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar branding
        </button>
      </div>

      {/* ── Card: Julia ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{hotel.concierge_name || 'Julia'} — Asistente Virtual</h2>
            <p className="text-zinc-400 text-sm mt-0.5">
              Personalizá cómo {hotel.concierge_name || 'Julia'} responde a tus huéspedes
            </p>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg select-none">
            J
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">System Prompt</label>
            <span className="text-xs text-zinc-500">{prompt.length} caracteres</span>
          </div>
          <textarea
            rows={12}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={BASE_PROMPT_PLACEHOLDER}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600 resize-y leading-relaxed"
          />
          <p className="text-xs text-zinc-500">
            Si dejás el campo vacío, Julia usará el prompt base de StormGuest.
          </p>
        </div>

        <Alert type={promptStatus?.type} message={promptStatus?.message} />

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSavePrompt}
            disabled={promptSaving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            {promptSaving ? <Spinner /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
          <button
            onClick={handleRestorePrompt}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm px-4 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar prompt por defecto
          </button>
        </div>
      </div>

      {/* ── Card: Email SMTP ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Configuración de Email</h2>
          <p className="text-zinc-400 text-sm mt-0.5">
            Cada hotel configura su propio servidor de email. Si no completás estos datos, se usará el servidor global de StormGuest.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SMTP Host */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-zinc-300">SMTP Host</label>
            <input
              type="text"
              value={smtp.smtp_host}
              onChange={(e) => setSmtp((s) => ({ ...s, smtp_host: e.target.value }))}
              placeholder="smtp.gmail.com"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Puerto */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Puerto</label>
            <input
              type="number"
              value={smtp.smtp_port}
              onChange={(e) => setSmtp((s) => ({ ...s, smtp_port: Number(e.target.value) }))}
              placeholder="587"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Usuario */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Usuario</label>
            <input
              type="text"
              value={smtp.smtp_user}
              onChange={(e) => setSmtp((s) => ({ ...s, smtp_user: e.target.value }))}
              placeholder="info@tuhotel.com"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-zinc-300">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={smtp.smtp_pass}
                onChange={(e) => setSmtp((s) => ({ ...s, smtp_pass: e.target.value }))}
                placeholder="Dejá vacío para no cambiar la contraseña guardada"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 pr-12 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* From */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-zinc-300">From (remitente visible)</label>
            <input
              type="text"
              value={smtp.smtp_from}
              onChange={(e) => setSmtp((s) => ({ ...s, smtp_from: e.target.value }))}
              placeholder='Hotel Demo <info@hotel.com>'
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <Alert type={smtpStatus?.type} message={smtpStatus?.message} />

        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <button
            onClick={handleSaveSmtp}
            disabled={smtpSaving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            {smtpSaving ? <Spinner /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
          <button
            onClick={handleTestEmail}
            disabled={smtpTesting}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm px-4 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-600 disabled:opacity-60 transition-colors"
          >
            {smtpTesting ? <Spinner /> : <Send className="w-4 h-4" />}
            Probar configuración
          </button>
        </div>
      </div>

      {/* ── Card: Stripe ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Configuración de Pagos (Stripe)</h2>
            <p className="text-zinc-400 text-sm mt-0.5">
              Conectá tu cuenta de Stripe para procesar pagos directamente desde tu hotel.
            </p>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Publishable Key */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Stripe Publishable Key</label>
            <input
              type="text"
              value={stripe.stripe_publishable_key}
              onChange={(e) => setStripe((s) => ({ ...s, stripe_publishable_key: e.target.value }))}
              placeholder="pk_live_... o pk_test_..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-600 font-mono"
            />
          </div>

          {/* Secret Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Stripe Secret Key</label>
              <ConfiguredBadge configured={hasStripeSecret} />
            </div>
            <div className="relative">
              <input
                type={showStripeSecret ? 'text' : 'password'}
                value={stripe.stripe_secret_key}
                onChange={(e) => setStripe((s) => ({ ...s, stripe_secret_key: e.target.value }))}
                placeholder={hasStripeSecret ? 'Dejá vacío para no cambiar la clave guardada' : 'sk_live_... o sk_test_...'}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 pr-12 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-600 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowStripeSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showStripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Stripe Webhook Secret</label>
              <ConfiguredBadge configured={hasStripeWebhook} />
            </div>
            <div className="relative">
              <input
                type={showWebhookSecret ? 'text' : 'password'}
                value={stripe.stripe_webhook_secret}
                onChange={(e) => setStripe((s) => ({ ...s, stripe_webhook_secret: e.target.value }))}
                placeholder={hasStripeWebhook ? 'Dejá vacío para no cambiar el secret guardado' : 'whsec_...'}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 pr-12 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-600 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              El webhook secret se obtiene desde el Dashboard de Stripe en la sección Webhooks.
            </p>
          </div>
        </div>

        <Alert type={stripeStatus?.type} message={stripeStatus?.message} />

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSaveStripe}
            disabled={stripeSaving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            {stripeSaving ? <Spinner /> : <Save className="w-4 h-4" />}
            Guardar configuración Stripe
          </button>
        </div>
      </div>
    </div>
  );
}
