import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase picks up the recovery token from the URL hash automatically
        supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setSessionReady(true);
            }
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        setDone(true);
        setTimeout(() => navigate('/login'), 3000);
    };

    if (done) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Contraseña actualizada</h2>
                    <p className="text-zinc-400">Redirigiendo al login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center mb-8 gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-emerald-500/20">S</div>
                    <span className="font-bold text-xl text-white tracking-wide">StormGuest</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                    <h1 className="text-xl font-bold text-white mb-1">Nueva contraseña</h1>
                    <p className="text-zinc-400 text-sm mb-6">Ingresá tu nueva contraseña para acceder al panel.</p>

                    {!sessionReady && (
                        <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verificando enlace...
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1.5">Nueva contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1.5">Confirmar contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    placeholder="Repetí la contraseña"
                                    required
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !sessionReady}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualizar contraseña'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
