
import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { Bug, Lightbulb, Send, Loader2, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportFeedbackProps {
    user: UserProfile;
}

type FeedbackType = 'bug' | 'suggestion';

const SupportFeedback: React.FC<SupportFeedbackProps> = ({ user }) => {
    const [type, setType] = useState<FeedbackType>('bug');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const isSuggestion = type === 'suggestion';
    const [isFocused, setIsFocused] = useState(false);
    const textareaFocusClasses = isSuggestion ? 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500' : 'focus:border-destaque focus:ring-1 focus:ring-destaque';
    const messageIconClass = `${isSuggestion && isFocused ? 'absolute right-4 bottom-4 text-amber-400' : 'absolute right-4 bottom-4 text-zinc-700'} pointer-events-none`;
    const activeSendButtonClasses = isSuggestion && isFocused
        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
        : 'bg-destaque text-white hover:bg-red-700 shadow-red-900/20';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        setStatus('idle');

        try {
            const { error } = await supabase.from('app_feedback').insert({
                user_id: user.id,
                type,
                message,
                created_at: new Date().toISOString(),
                user_email: user.email 
            });

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            // Simula delay visual para feedback
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setStatus('success');
            setMessage('');
            setTimeout(() => setStatus('idle'), 3000);

        } catch (err) {
            console.error(err);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-24 w-full max-w-full">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-destaque/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                
                <h3 className="text-lg font-display font-bold text-white mb-2">Central de Feedback</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Encontrou um problema ou tem uma ideia para melhorar o Track2Lift? 
                    Sua opinião é fundamental para a evolução do app.
                </p>

                {/* Type Selector - Sem animação de layoutId, apenas toggle de classe */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => setType('bug')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                            type === 'bug'
                                ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800'
                        }`}
                    >
                        <Bug size={24} strokeWidth={2.5} />
                        <span className="text-xs font-bold uppercase tracking-wider">Bug / Erro</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setType('suggestion')}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                            type === 'suggestion'
                                ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800'
                        }`}
                    >
                        <Lightbulb size={24} strokeWidth={2.5} />
                        <span className="text-xs font-bold uppercase tracking-wider">Sugestão</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase ml-1 block mb-2">
                            {type === 'bug' ? 'Descreva o problema' : 'Descreva sua ideia'}
                        </label>
                        <div className="relative">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder={type === 'bug' ? "O app fechou quando cliquei em..." : "Seria legal se tivesse..."}
                                className={`w-full h-40 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm text-white placeholder-zinc-600 ${textareaFocusClasses} outline-none resize-none transition-all`}
                            />
                            <MessageSquare size={16} className={messageIconClass} />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="w-full bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
                            >
                                <CheckCircle size={20} />
                                Obrigado pelo feedback!
                            </motion.div>
                        ) : status === 'error' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="w-full bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
                            >
                                <AlertCircle size={20} />
                                Erro ao enviar. Tente novamente.
                            </motion.div>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                type="submit"
                                disabled={loading || !message.trim()}
                                className={`w-full py-4 rounded-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                                    loading || !message.trim()
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        : `${activeSendButtonClasses} active:scale-[0.98]`
                                }`}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Enviar Feedback
                                    </>
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </form>
            </div>

            <div className="text-center">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                    Versão Beta 1.0.4
                </p>
            </div>
        </div>
    );
};

export default SupportFeedback;
