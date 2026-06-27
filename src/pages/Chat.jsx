import React, { useEffect, useState, useRef } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { Search, User, Send, Loader2, MessageSquare, Bot } from 'lucide-react';

export default function Chat() {
    const [guests, setGuests] = useState([]);
    const [activeGuest, setActiveGuest] = useState(null);
    const [activeConvId, setActiveConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [dbHotelId, setDbHotelId] = useState("");
    const [conciergeName, setConciergeName] = useState("Julia");
    const [search, setSearch] = useState("");

    const messagesEndRef = useRef(null);

    useEffect(() => { fetchGuestsWithConversations(); }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Realtime — new messages in active conversation
    useEffect(() => {
        if (!activeConvId) return;

        const channel = supabase
            .channel(`admin-chat-${activeConvId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${activeConvId}`
            }, (payload) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === payload.new.id)) return prev;
                    return [...prev, payload.new];
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [activeConvId]);

    // Realtime — new conversations (new guests starting a chat)
    useEffect(() => {
        if (!dbHotelId) return;

        const channel = supabase
            .channel(`admin-conversations-${dbHotelId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'conversations',
                filter: `hotel_id=eq.${dbHotelId}`
            }, () => {
                fetchGuestsWithConversations();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [dbHotelId]);

    const fetchGuestsWithConversations = async () => {
        setLoading(true);
        const hotelSlug = localStorage.getItem('hotel_id') || 'demo';
        const { data: hotelData } = await supabaseAdmin
            .from('hotels')
            .select('id, concierge_name')
            .eq('slug', hotelSlug)
            .single();
        if (!hotelData) { setLoading(false); return; }

        setDbHotelId(hotelData.id);
        if (hotelData.concierge_name) setConciergeName(hotelData.concierge_name);

        const { data: conversations } = await supabaseAdmin
            .from('conversations')
            .select('id, guest_id')
            .eq('hotel_id', hotelData.id)
            .order('updated_at', { ascending: false });

        if (!conversations || conversations.length === 0) {
            setLoading(false);
            return;
        }

        const uniqueGuestIds = [...new Set(conversations.map(c => c.guest_id).filter(Boolean))];

        const { data: guestsData } = await supabaseAdmin
            .from('guests')
            .select('id, name, email')
            .in('id', uniqueGuestIds);

        const list = guestsData || [];
        setGuests(list);

        // Auto-select first guest only on initial load
        if (list.length > 0 && !activeGuest) {
            const firstConv = conversations.find(c => c.guest_id === list[0].id);
            if (firstConv) {
                await selectGuest(list[0], firstConv.id, hotelData.id);
            }
        }
        setLoading(false);
    };

    const selectGuest = async (guest, knownConvId = null, hotelIdOverride = null) => {
        setActiveGuest(guest);
        setMessages([]);

        const hotelId = hotelIdOverride || dbHotelId;
        let convId = knownConvId;
        if (!convId) {
            const { data: conv } = await supabaseAdmin
                .from('conversations')
                .select('id')
                .eq('guest_id', guest.id)
                .eq('hotel_id', hotelId)
                .maybeSingle();
            convId = conv?.id ?? null;
        }

        setActiveConvId(convId);
        if (!convId) return;

        const { data } = await supabaseAdmin
            .from('messages')
            .select('id, sender, content, created_at')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });

        setMessages(data || []);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeGuest || !activeConvId || sending) return;

        const msgText = newMessage.trim();
        setNewMessage("");
        setSending(true);

        await supabaseAdmin.from('messages').insert({
            conversation_id: activeConvId,
            sender: 'staff',
            content: msgText
        });

        setSending(false);
    };

    const filteredGuests = guests.filter(g =>
        (g.name || '').toLowerCase().includes(search.toLowerCase())
    );

    const getInitials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="h-full flex flex-col p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Bandeja de Chat</h1>
                <p className="text-zinc-400 mt-1">Conversaciones en tiempo real con tus huéspedes.</p>
            </div>

            <div className="flex-1 flex bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl min-h-0">

                {/* Left: Inbox */}
                <div className="w-72 border-r border-zinc-800 flex flex-col bg-zinc-950/50 flex-shrink-0">
                    <div className="p-4 border-b border-zinc-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Buscar huésped..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-white"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                            </div>
                        ) : filteredGuests.length === 0 ? (
                            <div className="text-center text-zinc-600 text-sm p-8">Sin conversaciones</div>
                        ) : (
                            filteredGuests.map(guest => (
                                <button
                                    key={guest.id}
                                    onClick={() => selectGuest(guest)}
                                    className={`w-full text-left p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors flex items-center space-x-3 ${
                                        activeGuest?.id === guest.id ? 'bg-zinc-800 border-l-2 border-l-emerald-500' : ''
                                    }`}
                                >
                                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-400">
                                        {getInitials(guest.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm text-zinc-200 truncate">{guest.name || 'Huésped'}</h3>
                                        <p className="text-xs text-zinc-500 truncate">{guest.email || ''}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Chat window */}
                {activeGuest ? (
                    <div className="flex-1 flex flex-col bg-zinc-950 min-w-0">
                        {/* Header */}
                        <div className="h-16 border-b border-zinc-800 flex items-center px-6 bg-zinc-900/20 flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mr-3 text-xs font-bold text-emerald-400">
                                {getInitials(activeGuest.name)}
                            </div>
                            <div>
                                <h2 className="font-bold text-zinc-100">{activeGuest.name}</h2>
                                <p className="text-xs text-emerald-500">Huésped activo</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {messages.map((msg, idx) => {
                                const isStaff = msg.sender === 'staff';
                                const isBot = msg.sender === 'bot';
                                const isFromHotel = isStaff || isBot;
                                return (
                                    <div key={msg.id || idx} className={`flex ${isFromHotel ? 'justify-end' : 'justify-start'}`}>
                                        {isBot && (
                                            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mr-2 flex-shrink-0 self-end">
                                                <Bot className="w-3 h-3 text-purple-400" />
                                            </div>
                                        )}
                                        <div className={`px-4 py-3 max-w-sm text-sm rounded-2xl ${
                                            isStaff
                                                ? 'bg-emerald-600 text-white rounded-tr-sm'
                                                : isBot
                                                    ? 'bg-purple-900/60 border border-purple-500/20 text-purple-100 rounded-tl-sm'
                                                    : 'bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-tl-sm'
                                        }`}>
                                            {isBot && <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-1">{conciergeName} AI</p>}
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            {messages.length === 0 && (
                                <div className="text-center text-zinc-600 text-sm mt-10">Sin mensajes aún.</div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-zinc-800 flex-shrink-0">
                            <form onSubmit={sendMessage} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Responde al huésped..."
                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder:text-zinc-600"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending || !activeConvId}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-5 flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 bg-zinc-950">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p>Seleccioná un huésped para chatear.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
