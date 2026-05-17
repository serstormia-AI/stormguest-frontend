import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Link2, Webhook, RefreshCw, Trash2,
  CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink, Plus,
  Server, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  getIntegrations, importCsv, saveIcalUrl, syncIcalNow,
  saveWebhookConfig, deleteIntegration, savePollingConfig, pollNow, getSyncLogs
} from '../services/api';

const PROVIDERS = ['cloudbeds', 'apaleo', 'beds24', 'little_hotelier', 'otro'];
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

function Badge({ active }) {
  return active
    ? <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">Activa</span>
    : <span className="text-xs bg-zinc-800 text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">Inactiva</span>;
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <h2 className="text-white font-semibold text-lg">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [feedback, setFeedback]   = useState(null);
  const [loading, setLoading]     = useState({});

  // CSV
  const fileRef = useRef();
  const [csvResult, setCsvResult] = useState(null);

  // iCal
  const [icalUrl, setIcalUrl]       = useState('');
  const [icalProvider, setIcalProvider] = useState('');

  // Webhook
  const [whProvider, setWhProvider] = useState('cloudbeds');
  const [whSecret, setWhSecret]     = useState('');
  const [generatedSecret, setGeneratedSecret] = useState(null);

  // API Polling
  const [pollProvider, setPollProvider]   = useState('cloudbeds');
  const [pollApiKey, setPollApiKey]       = useState('');
  const [pollClientId, setPollClientId]   = useState('');
  const [pollClientSecret, setPollClientSecret] = useState('');
  const [pollPropertyId, setPollPropertyId]     = useState('');

  // Sync logs
  const [logsOpen, setLogsOpen]   = useState(null); // integration id
  const [logs, setLogs]           = useState([]);

  useEffect(() => { loadIntegrations(); }, []);

  async function loadIntegrations() {
    try {
      const data = await getIntegrations();
      setIntegrations(data || []);
      const ical = data?.find(i => i.type === 'ical');
      if (ical?.config?.ical_url) setIcalUrl(ical.config.ical_url);
      if (ical?.provider) setIcalProvider(ical.provider);
    } catch { /* silently fail */ }
  }

  function show(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 6000);
  }

  function setLoad(key, val) {
    setLoading(l => ({ ...l, [key]: val }));
  }

  async function handleCsv(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvResult(null);
    setLoad('csv', true);
    try {
      const res = await importCsv(file);
      setCsvResult(res);
      loadIntegrations();
      show('ok', `CSV procesado: ${res.created} creadas, ${res.updated} actualizadas, ${res.skipped} omitidas`);
    } catch (err) {
      show('error', err.response?.data?.error || 'Error al procesar el CSV');
    } finally {
      setLoad('csv', false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSaveIcal(e) {
    e.preventDefault();
    setLoad('ical', true);
    try {
      await saveIcalUrl(icalUrl, icalProvider || undefined);
      await loadIntegrations();
      show('ok', 'URL iCal guardada. Sincronización automática cada hora.');
    } catch (err) {
      show('error', err.response?.data?.error || 'Error al guardar iCal');
    } finally {
      setLoad('ical', false);
    }
  }

  async function handleSyncNow() {
    setLoad('sync', true);
    try {
      await syncIcalNow();
      show('ok', 'Sincronización completada');
      loadIntegrations();
    } catch (err) {
      show('error', err.response?.data?.error || 'Error al sincronizar');
    } finally {
      setLoad('sync', false);
    }
  }

  async function handleSaveWebhook(e) {
    e.preventDefault();
    setLoad('webhook', true);
    try {
      const res = await saveWebhookConfig(whProvider, whSecret || undefined);
      setGeneratedSecret(res.webhook_secret);
      await loadIntegrations();
      show('ok', 'Webhook configurado. Copiá el secret y guardalo en tu PMS.');
    } catch (err) {
      show('error', err.response?.data?.error || 'Error al configurar webhook');
    } finally {
      setLoad('webhook', false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta integración?')) return;
    try {
      await deleteIntegration(id);
      setIntegrations(prev => prev.filter(i => i.id !== id));
      show('ok', 'Integración eliminada');
    } catch {
      show('error', 'Error al eliminar');
    }
  }

  async function handleSavePolling(e) {
    e.preventDefault();
    setLoad('polling', true);
    try {
      await savePollingConfig({
        provider:       pollProvider,
        api_key:        pollProvider === 'cloudbeds' ? pollApiKey    : undefined,
        client_id:      pollProvider === 'apaleo'    ? pollClientId  : undefined,
        client_secret:  pollProvider === 'apaleo'    ? pollClientSecret : undefined,
        property_id:    pollPropertyId || undefined,
      });
      await loadIntegrations();
      show('ok', `Polling ${pollProvider} configurado. Primera sync en <15 min.`);
      setPollApiKey(''); setPollClientId(''); setPollClientSecret('');
    } catch (err) {
      show('error', err.response?.data?.error || 'Error al configurar polling');
    } finally {
      setLoad('polling', false);
    }
  }

  async function handlePollNow(id) {
    setLoad(`poll_${id}`, true);
    try {
      await pollNow(id);
      show('ok', 'Polling completado');
      loadIntegrations();
    } catch (err) {
      show('error', err.response?.data?.error || 'Error al ejecutar polling');
    } finally {
      setLoad(`poll_${id}`, false);
    }
  }

  async function toggleLogs(id) {
    if (logsOpen === id) { setLogsOpen(null); return; }
    setLogsOpen(id);
    try {
      const data = await getSyncLogs(id);
      setLogs(data || []);
    } catch { setLogs([]); }
  }

  const webhookUrl = (slug) =>
    `${API_BASE}/api/integrations/webhook/${slug || ':hotel_slug'}`;

  const hotelSlug = localStorage.getItem('hotel_slug') || '';

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Integraciones PMS</h1>
        <p className="text-zinc-400 text-sm mt-1">Importá reservas desde tu sistema de gestión hotelera</p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-3 rounded-xl p-4 border ${
          feedback.type === 'ok'    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          feedback.type === 'warn'  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                                      'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {feedback.type === 'ok' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> :
           feedback.type === 'warn' ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> :
           <XCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm">{feedback.msg}</span>
        </div>
      )}

      {/* CSV Import */}
      <Section icon={Upload} title="Importar CSV">
        <p className="text-zinc-400 text-sm">
          Exportá tus reservas desde tu PMS y subí el archivo. Columnas soportadas en español e inglés:
          nombre, email, teléfono, habitación, fecha entrada/salida, notas.
        </p>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
        >
          {loading.csv
            ? <RefreshCw className="w-8 h-8 mx-auto text-emerald-400 animate-spin" />
            : <Upload className="w-8 h-8 mx-auto text-zinc-600 group-hover:text-emerald-400 transition-colors" />}
          <p className="text-zinc-400 text-sm mt-2">
            {loading.csv ? 'Procesando...' : 'Clic para seleccionar archivo CSV'}
          </p>
          <p className="text-zinc-600 text-xs mt-1">Máx. 5 MB</p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsv} />
        </div>

        {csvResult && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Creadas',      val: csvResult.created,  color: 'text-emerald-400' },
              { label: 'Actualizadas', val: csvResult.updated,  color: 'text-blue-400' },
              { label: 'Omitidas',     val: csvResult.skipped,  color: 'text-amber-400' },
              { label: 'Errores',      val: csvResult.errors?.length || 0, color: 'text-red-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-zinc-800/60 rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
        {csvResult?.errors?.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-1 max-h-40 overflow-y-auto">
            {csvResult.errors.map((e, i) => (
              <p key={i} className="text-red-400 text-xs">Fila {e.row}: {e.reason}</p>
            ))}
          </div>
        )}
      </Section>

      {/* iCal Sync */}
      <Section icon={Link2} title="Sincronización iCal">
        <p className="text-zinc-400 text-sm">
          Pegá la URL iCal de tu PMS (Beds24, Little Hotelier, Booking.com, Airbnb). Se sincroniza automáticamente cada hora.
        </p>
        <form onSubmit={handleSaveIcal} className="space-y-3">
          <input
            value={icalUrl}
            onChange={e => setIcalUrl(e.target.value)}
            placeholder="https://beds24.com/ical/..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 placeholder:text-zinc-600"
          />
          <div className="flex gap-3">
            <select
              value={icalProvider}
              onChange={e => setIcalProvider(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-emerald-500"
            >
              <option value="">PMS (opcional)</option>
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="submit" disabled={!icalUrl || loading.ical}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-50">
              {loading.ical ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Guardar URL
            </button>
            {integrations.some(i => i.type === 'ical') && (
              <button type="button" onClick={handleSyncNow} disabled={loading.sync}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 rounded-lg text-sm transition-colors disabled:opacity-50">
                {loading.sync ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sincronizar ahora
              </button>
            )}
          </div>
        </form>
      </Section>

      {/* Webhook */}
      <Section icon={Webhook} title="Webhook (Cloudbeds / Apaleo)">
        <p className="text-zinc-400 text-sm">
          Para PMS que soportan webhooks salientes. Configurá esta URL en tu PMS y StormGuest recibirá
          las reservas en tiempo real.
        </p>
        <form onSubmit={handleSaveWebhook} className="space-y-3">
          <div className="flex gap-3">
            <select
              value={whProvider}
              onChange={e => setWhProvider(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-emerald-500"
            >
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              value={whSecret}
              onChange={e => setWhSecret(e.target.value)}
              placeholder="Webhook secret (dejar vacío para generar uno)"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 placeholder:text-zinc-600"
            />
            <button type="submit" disabled={loading.webhook}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-50">
              {loading.webhook ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Configurar
            </button>
          </div>
        </form>

        {/* Webhook URL para copiar */}
        <div className="space-y-2">
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">URL a configurar en tu PMS</p>
          <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2">
            <code className="text-emerald-400 text-xs flex-1 truncate">{webhookUrl(hotelSlug)}</code>
            <button onClick={() => navigator.clipboard.writeText(webhookUrl(hotelSlug))}
              className="text-zinc-500 hover:text-zinc-300 flex-shrink-0">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {generatedSecret && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
            <p className="text-amber-300 text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Guardá este secret ahora — no se mostrará de nuevo
            </p>
            <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2">
              <code className="text-white text-xs flex-1 break-all">{generatedSecret}</code>
              <button onClick={() => navigator.clipboard.writeText(generatedSecret)}
                className="text-zinc-500 hover:text-zinc-300 flex-shrink-0">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* API Polling — Cloudbeds / Apaleo */}
      <Section icon={Server} title="API Polling (Cloudbeds / Apaleo)">
        <p className="text-zinc-400 text-sm">
          Para PMS con API REST. StormGuest consulta automáticamente cada 15 minutos y reconcilia reservas.
          Las credenciales se guardan encriptadas con AES-256-GCM.
        </p>
        <form onSubmit={handleSavePolling} className="space-y-3">
          <select value={pollProvider} onChange={e => setPollProvider(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-emerald-500">
            <option value="cloudbeds">Cloudbeds</option>
            <option value="apaleo">Apaleo</option>
          </select>

          {pollProvider === 'cloudbeds' && (
            <input value={pollApiKey} onChange={e => setPollApiKey(e.target.value)}
              placeholder="API Key de Cloudbeds"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 placeholder:text-zinc-600" />
          )}
          {pollProvider === 'apaleo' && (<>
            <input value={pollClientId} onChange={e => setPollClientId(e.target.value)}
              placeholder="Client ID"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 placeholder:text-zinc-600" />
            <input value={pollClientSecret} onChange={e => setPollClientSecret(e.target.value)}
              type="password" placeholder="Client Secret"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 placeholder:text-zinc-600" />
          </>)}

          <div className="flex gap-3">
            <input value={pollPropertyId} onChange={e => setPollPropertyId(e.target.value)}
              placeholder="Property ID (opcional)"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 placeholder:text-zinc-600" />
            <button type="submit" disabled={loading.polling}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-50">
              {loading.polling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </form>
      </Section>

      {/* Integraciones activas */}
      {integrations.length > 0 && (
        <Section icon={ExternalLink} title="Integraciones configuradas">
          <div className="space-y-2">
            {integrations.map(i => (
              <div key={i.id} className="bg-zinc-800/50 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Badge active={i.active} />
                    <div>
                      <p className="text-white text-sm font-medium capitalize">
                        {i.type === 'api_polling' ? 'API Polling' : i.type} {i.provider ? `— ${i.provider}` : ''}
                      </p>
                      {i.last_sync && (
                        <p className="text-zinc-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(i.last_sync).toLocaleString('es-AR')}
                        </p>
                      )}
                      {i.last_error && (
                        <p className="text-red-400 text-xs">Error: {i.last_error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {i.type === 'api_polling' && (
                      <button onClick={() => handlePollNow(i.id)} disabled={loading[`poll_${i.id}`]}
                        className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50">
                        {loading[`poll_${i.id}`] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Sync
                      </button>
                    )}
                    <button onClick={() => toggleLogs(i.id)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors">
                      {logsOpen === i.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(i.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sync logs expandibles */}
                {logsOpen === i.id && (
                  <div className="border-t border-zinc-700/50 p-3 space-y-1 max-h-48 overflow-y-auto">
                    {logs.length === 0
                      ? <p className="text-zinc-600 text-xs text-center py-2">Sin logs registrados</p>
                      : logs.map(l => (
                          <div key={l.id} className="flex items-center gap-2 text-xs">
                            {l.action === 'error'
                              ? <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                              : l.action === 'created'
                              ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              : <div className="w-3 h-3 rounded-full bg-zinc-600 flex-shrink-0" />}
                            <span className="text-zinc-400">{new Date(l.synced_at).toLocaleTimeString('es-AR')}</span>
                            <span className={`capitalize ${l.action === 'error' ? 'text-red-400' : l.action === 'created' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {l.action}
                            </span>
                            {l.external_id && <span className="text-zinc-600">#{l.external_id}</span>}
                            {l.detail?.error && <span className="text-red-400 truncate">{l.detail.error}</span>}
                          </div>
                        ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
