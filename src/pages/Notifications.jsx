import React, { useState, useEffect } from 'react';
import { Mail, Send, RefreshCw, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { getGuests, sendNotification, testNotification } from '../services/api';

const HISTORY_KEY = 'sg_notification_history';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(h) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
}

export default function Notifications() {
  const [guests, setGuests] = useState([]);
  const [form, setForm] = useState({ guest_id: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState(loadHistory());
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    getGuests().then(data => setGuests(data || [])).catch(() => {});
  }, []);

  function showFeedback(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!form.guest_id || !form.subject || !form.message) return;
    setSending(true);
    try {
      const res = await sendNotification(form);
      const guest = guests.find(g => g.id === form.guest_id);
      const entry = {
        id: Date.now(),
        to: guest?.name || form.guest_id,
        subject: form.subject,
        sent: res.sent !== false,
        reason: res.reason,
        at: new Date().toISOString()
      };
      const newHistory = [entry, ...history];
      setHistory(newHistory);
      saveHistory(newHistory);

      if (res.reason === 'not_configured') {
        setNotConfigured(true);
        showFeedback('warn', 'Email enviado pero servidor no configurado.');
      } else if (res.sent === false) {
        showFeedback('error', 'No se pudo enviar el email.');
      } else {
        showFeedback('ok', 'Email enviado correctamente.');
        setForm({ guest_id: '', subject: '', message: '' });
      }
    } catch {
      showFeedback('error', 'Error al conectar con el servidor.');
    } finally {
      setSending(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await testNotification();
      if (res.reason === 'not_configured') {
        setNotConfigured(true);
        showFeedback('warn', 'Servidor de email no configurado.');
      } else {
        showFeedback('ok', 'Email de prueba enviado a tu cuenta.');
      }
    } catch {
      showFeedback('error', 'Error al enviar email de prueba.');
    } finally {
      setTesting(false);
    }
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          <p className="text-zinc-400 text-sm mt-1">Envía emails a huéspedes</p>
        </div>
        <button onClick={handleTest} disabled={testing}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm disabled:opacity-50">
          {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Enviar email de prueba
        </button>
      </div>

      {notConfigured && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300 text-sm">
            Configura <code className="bg-zinc-800 px-1 rounded">EMAIL_HOST</code>, <code className="bg-zinc-800 px-1 rounded">EMAIL_USER</code> y <code className="bg-zinc-800 px-1 rounded">EMAIL_PASS</code> en Railway para activar el envío de emails.
          </p>
        </div>
      )}

      {feedback && (
        <div className={`flex items-center gap-3 rounded-xl p-4 border ${
          feedback.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          feedback.type === 'warn' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
          'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {feedback.type === 'ok' ? <CheckCircle className="w-4 h-4" /> :
           feedback.type === 'warn' ? <AlertTriangle className="w-4 h-4" /> :
           <XCircle className="w-4 h-4" />}
          <span className="text-sm">{feedback.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSend} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Enviar email a huésped</h2>

          <div>
            <label className="text-zinc-400 text-sm block mb-1">Huésped</label>
            <select value={form.guest_id} onChange={e => setForm(f => ({ ...f, guest_id: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500">
              <option value="">Seleccionar huésped...</option>
              {guests.map(g => (
                <option key={g.id} value={g.id}>{g.name} {g.email ? `(${g.email})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-zinc-400 text-sm block mb-1">Asunto</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Asunto del email"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 placeholder:text-zinc-600" />
          </div>

          <div>
            <label className="text-zinc-400 text-sm block mb-1">Mensaje</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={5} placeholder="Escribe tu mensaje..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 placeholder:text-zinc-600 resize-none" />
          </div>

          <button type="submit" disabled={sending || !form.guest_id || !form.subject || !form.message}
            className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar email
          </button>
        </form>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Historial reciente</h2>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin emails enviados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                  {h.sent
                    ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{h.subject}</p>
                    <p className="text-zinc-400 text-xs">Para: {h.to}</p>
                  </div>
                  <span className="text-zinc-600 text-xs flex-shrink-0">
                    {new Date(h.at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
