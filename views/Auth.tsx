import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Logo } from '../components/icons/Logo';

interface AuthViewProps {
    onSuccess: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onSuccess();
            } else {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { name } }
                });
                if (error) throw error;
                if (data.user && !data.session) {
                    setError("Cadastro realizado! Verifique seu email para confirmar.");
                } else {
                    onSuccess();
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-fundo">
             {/* Decorative Background */}
             <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                <div className="absolute w-[600px] h-[600px] rounded-full bg-red-700 blur-[150px] -top-20 -left-20"></div>
                <div className="absolute w-[400px] h-[400px] rounded-full bg-red-800 blur-[120px] bottom-0 right-0"></div>
            </div>

            {/* Logo Section */}
            <div className="relative z-10 mb-10 text-center animate-fade-in-up">
                <div className="flex justify-center mb-6">
                    <Logo className="w-80 h-auto drop-shadow-2xl" />
                </div>
                <p className="text-zinc-400 text-lg">Seu treino. Sua dieta. Um app.</p>
            </div>

            <div className="relative z-10 w-full max-w-sm bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-center text-2xl font-bold font-display mb-6 text-white">
                    {isLogin ? 'Entrar' : 'Criar Conta'}
                </h2>

                {error && (
                    <div className={`mb-6 p-3 rounded-xl text-sm text-center font-medium ${error.includes('Verifique') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <input 
                                type="text" placeholder="Seu Nome" 
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3.5 focus:border-destaque outline-none transition text-white placeholder-zinc-500"
                                value={name} onChange={(e) => setName(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    )}
                    <div>
                        <input 
                            type="email" placeholder="Email" 
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3.5 focus:border-destaque outline-none transition text-white placeholder-zinc-500"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <input 
                            type="password" placeholder="Senha" 
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3.5 focus:border-destaque outline-none transition text-white placeholder-zinc-500"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        type="submit" disabled={loading}
                        className="w-full bg-destaque text-white font-bold py-4 rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-red-900/20"
                    >
                        {loading ? 'Carregando...' : (isLogin ? 'Acessar App' : 'Cadastrar')}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-zinc-800">
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="w-full flex items-center justify-center gap-2 text-sm text-zinc-400 group transition"
                    >
                        <span>{isLogin ? 'Ainda não tem conta?' : 'Já tem conta?'}</span>
                        <span className="text-destaque font-bold group-hover:text-red-400 group-hover:underline transition">
                            {isLogin ? 'Criar agora' : 'Entrar'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthView;