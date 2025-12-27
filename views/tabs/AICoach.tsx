
import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { GoogleGenAI } from '@google/genai';
import { Send, Bot, Loader } from 'lucide-react';

const AICoachTab: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
        { role: 'model', text: `Olá ${user.name || 'Atleta'}! Sou seu treinador IA. Como posso ajudar com seu objetivo de ${user.goal}?` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userText = input;
        const newMessages = [...messages, { role: 'user' as const, text: userText }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const systemPrompt = `Você é um treinador pessoal experiente chamado Track2Lift Coach. 
            O usuário tem ${user.age} anos, pesa ${user.weight}kg e tem ${user.height}cm de altura.
            O objetivo dele é: ${user.goal}.
            Seja motivador, direto e use emojis ocasionalmente. Responda em Português do Brasil.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: newMessages.map(m => ({
                    role: m.role,
                    parts: [{ text: m.text }]
                })),
                config: {
                    systemInstruction: systemPrompt
                }
            });

            if (response.text) {
                setMessages([...newMessages, { role: 'model', text: response.text }]);
            }
        } catch (err) {
            console.error(err);
            setMessages([...newMessages, { role: 'model', text: "Desculpe, estou tendo problemas para conectar ao servidor de treino agora. Verifique sua conexão." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${m.role === 'user' ? 'bg-destaque text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'}`}>
                            {m.role === 'model' && <Bot size={14} className="mb-2 text-destaque" />}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 rounded-tl-none flex items-center gap-3">
                             <Loader className="animate-spin text-destaque" size={16} />
                             <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Analisando...</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-zinc-950/50 backdrop-blur-md border-t border-zinc-800 flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Dúvidas sobre treino ou dieta?"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 focus:border-destaque outline-none transition-all text-white placeholder-zinc-600"
                />
                <button 
                    onClick={handleSend} 
                    disabled={loading || !input.trim()} 
                    className="bg-destaque hover:bg-red-700 text-white p-4 rounded-2xl transition-all shadow-lg shadow-destaque/20 disabled:opacity-30 active:scale-95"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default AICoachTab;
