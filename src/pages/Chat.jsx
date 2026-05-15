import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, Send, Clock, Loader2, MessageSquare } from 'lucide-react';

export default function Chat() {
    const [guests, setGuests] = useState([]);
    const [activeGuest, setActiveGuest] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [hotelId, setHotelId] = useState("");

    const messagesEndRef = useRef(null);

    // Initial Load
    useEffect(() => {
        fetchGuestsWithMessages();
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchGuestsWithMessages = async () => {
        setLoading(true);
        // Get demo hotel ID
        const { data: hotelData } = await supabase.from('hotels').select('id').eq('slug', 'demo').single();
        if (!hotelData) return;
        setHotelId(hotelData.id);

        // Fetch distinct guests who have messages (Simplified: just fetch all guests for now, ideally group by messages)
        const { data: guestsData } = await supabase
            .from('guests')
            .select('*')
            .eq('hotel_id', hotelData.id);

        if (guestsData) {
            setGuests(guestsData);
            // Select first guest by default if exists
            if (guestsData.length > 0) {
                selectGuest(guestsData[0].id, hotelData.id);
            }
        }
        setLoading(false);
    };

    // Realtime Subscription
    useEffect(() => {
        if (!activeGuest || !hotelId) return;

        // Suscripción Realtime
        const channel = supabase
            .channel('realtime-chat')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    console.log("Realtime: Mensaje recibido!");
                    if (payload.new.guest_id === activeGuest.id) {
                        setMessages(prev => [...prev, payload.new]);
                    }
                }
            )
            .subscribe();

        // FALLBACK: Polling cada 3 segundos por si el Realtime falla
        const fallbackInterval = setInterval(() => {
            fetchMessagesForActiveGuest(activeGuest.id);
        }, 3000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(fallbackInterval);
        };
    }, [activeGuest, hotelId]);

    const fetchMessagesForActiveGuest = async (guestId) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('guest_id', guestId)
            .order('created_at', { ascending: true });
        
        if (data) {
            // Solo actualizamos si hay mensajes nuevos para no parpadear
            setMessages(prev => {
                if (data.length !== prev.length) return data;
                return prev;
            });
        }
    };
    const selectGuest = async (guestId, hId = hotelId) => {
        const guest = guests.find(g => g.id === guestId);
        setActiveGuest(guest);

        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('hotel_id', hId)
            .eq('guest_id', guestId)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeGuest) return;

        const msgText = newMessage.trim();
        setNewMessage("");

        // Insert into DB. The realtime subscription will update the UI automatically.
        await supabase.from('messages').insert({
            hotel_id: hotelId,
            guest_id: activeGuest.id,
            sender_type: 'hotel',
            content: msgText
        });
    };

    return (
        <div className="h-full flex flex-col p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Bandeja de Chat</h1>
                <p className="text-zinc-400 mt-1">Comunícate con los huéspedes en tiempo real.</p>
            </div>

            <div className="flex-1 flex bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                
                {/* Left Pane: Inbox List */}
                <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/50">
                    <div className="p-4 border-b border-zinc-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="text" 
                                placeholder="Buscar huésped..." 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                        ) : (
                            guests.map(guest => (
                                <button 
                                    key={guest.id}
                                    onClick={() => selectGuest(guest.id)}
                                    className={`w-full text-left p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors flex items-start space-x-3 ${
                                        activeGuest?.id === guest.id ? 'bg-zinc-800 border-l-2 border-l-emerald-500' : ''
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-sm text-zinc-200 truncate">{guest.first_name} {guest.last_name}</h3>
                                            <span className="text-[10px] text-zinc-500 flex items-center"><Clock className="w-3 h-3 mr-1"/> Activo</span>
                                        </div>
                                        <p className="text-xs text-zinc-500 truncate">Ver conversación...</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Pane: Chat Window */}
                {activeGuest ? (
                    <div className="flex-1 flex flex-col bg-zinc-950">
                        {/* Chat Header */}
                        <div className="h-16 border-b border-zinc-800 flex items-center px-6 bg-zinc-900/20">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mr-3">
                                <User className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                                <h2 className="font-bold text-zinc-100">{activeGuest.first_name} {activeGuest.last_name}</h2>
                                <p className="text-xs text-emerald-500">En línea</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => {
                                const isHotel = msg.sender_type === 'hotel' || msg.sender_type === 'bot';
                                return (
                                    <div key={msg.id || idx} className={`flex ${isHotel ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-4 max-w-md text-sm shadow-md ${
                                            isHotel 
                                            ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-sm' 
                                            : 'bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-2xl rounded-tl-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            {messages.length === 0 && (
                                <div className="text-center text-zinc-500 text-sm mt-10">No hay mensajes anteriores.</div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
                            <form onSubmit={sendMessage} className="flex space-x-2">
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escribe tu respuesta..." 
                                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white"
                                />
                                <button 
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-6 flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p>Selecciona un huésped para comenzar a chatear.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
