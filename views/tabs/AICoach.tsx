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
        const newMessages = [...messages, { role: 'user' as const, text: input }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            // NOTE: In a production app, never expose API keys on client side directly without safeguards.
            // This follows the provided Gemini examples structure.
            if (!process.env.API_KEY) {
                throw new Error("API Key missing");
            }
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Context aware system instruction
            const systemPrompt = `Você é um treinador pessoal experiente chamado Track2Lift Coach. 
            O usuário tem ${user.age} anos, pesa ${user.weight}kg e tem ${user.height}cm de altura.
            O objetivo dele é: ${user.goal}.
            Seja motivador, direto e use emojis ocasionalmente. Responda em Português do Brasil.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: newMessages.map(m => ({
                    role: m.role,
                    parts: [{ text: m.text }]
                })),
                config: {
                    systemInstruction: systemPrompt
                }
            });

            setMessages([...newMessages, { role: 'model', text: response.text }]);
        } catch (err) {
            console.error(err);
            setMessages([...newMessages, { role: 'model', text: "Desculpe, estou tendo problemas para conectar ao servidor de treino agora. Verifique sua chave de API." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-destaque text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                            {m.role === 'model' && <Bot size={16} className="mb-2 text-zinc-400" />}
                            <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-800 rounded-2xl p-4 rounded-tl-none flex items-center gap-2">
                             <Loader className="animate-spin text-zinc-400" size={16} />
                             <span className="text-sm text-zinc-400">Pensando...</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Pergunte sobre treino ou dieta..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:border-destaque outline-none"
                />
                <button onClick={handleSend} disabled={loading} className="bg-zinc-800 hover:bg-destaque text-white p-3 rounded-xl transition">
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default AICoachTab;
