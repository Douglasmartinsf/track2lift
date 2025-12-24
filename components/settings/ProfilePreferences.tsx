
import React, { useState, useMemo } from 'react';
import { UserProfile } from '../../types';
import { supabase } from '../../services/supabaseClient';
import { User, Save, Loader2, Flame, Dumbbell, Scale, CheckCircle, AlertTriangle } from 'lucide-react';

interface ProfilePreferencesProps {
    user: UserProfile;
    onUpdateUser: (u: UserProfile) => void;
}

const ProfilePreferences: React.FC<ProfilePreferencesProps> = ({ user, onUpdateUser }) => {
    const [name, setName] = useState(user.name || '');
    const [weight, setWeight] = useState(user.weight || '');
    const [height, setHeight] = useState(user.height || '');
    const [age, setAge] = useState(user.age || '');
    const [goal, setGoal] = useState(user.goal || 'Manutenção');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Check for changes to enable/disable save button
    const hasChanges = useMemo(() => {
        const currentName = String(name).trim();
        const originalName = String(user.name || '').trim();
        
        // Handle mixed types (number from DB vs string from Input)
        const currentWeight = weight === '' ? 0 : Number(weight);
        const originalWeight = user.weight || 0;

        const currentHeight = height === '' ? 0 : Number(height);
        const originalHeight = user.height || 0;

        const currentAge = age === '' ? 0 : Number(age);
        const originalAge = user.age || 0;

        const currentGoal = goal;
        const originalGoal = user.goal || 'Manutenção';

        return (
            currentName !== originalName ||
            currentWeight !== originalWeight ||
            currentHeight !== originalHeight ||
            currentAge !== originalAge ||
            currentGoal !== originalGoal
        );
    }, [name, weight, height, age, goal, user]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!hasChanges) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const updates = {
                name,
                weight: Number(weight),
                height: Number(height),
                age: Number(age),
                goal
            };

            const { error: updateError } = await supabase.auth.updateUser({
                data: updates
            });

            if (updateError) throw updateError;
            
            // Update local user object for immediate feedback
            onUpdateUser({ ...user, ...updates });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erro ao salvar alterações.");
        } finally {
            setLoading(false);
        }
    };

    const goalOptions = [
        { id: 'Emagrecimento', label: 'Emagrecimento', icon: Flame },
        { id: 'Hipertrofia', label: 'Hipertrofia', icon: Dumbbell },
        { id: 'Manutenção', label: 'Manutenção', icon: Scale },
    ];

    return (
        <div className="pb-28 relative w-full max-w-full">
            {/* Feedback Toasts */}
            {success && (
                <div className="fixed top-20 left-4 right-4 z-50 bg-zinc-900/95 border border-green-500/50 text-green-500 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle size={24} className="shrink-0" />
                    <span className="text-sm font-bold">Perfil salvo com sucesso!</span>
                </div>
            )}
            {error && (
                <div className="fixed top-20 left-4 right-4 z-50 bg-zinc-900/95 border border-red-500/50 text-red-500 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-pulse">
                    <AlertTriangle size={24} className="shrink-0" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-zinc-900 shadow-2xl text-zinc-400 mb-3 relative overflow-hidden group">
                    <User size={40} />
                    <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-xs text-white cursor-not-allowed">
                        Em breve
                    </div>
                </div>
                <p className="text-zinc-500 text-sm font-medium">{user.email}</p>
            </div>

            <form className="space-y-6 w-full">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nome de Exibição</label>
                    <input 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:border-destaque focus:ring-1 focus:ring-destaque outline-none text-white transition text-lg font-medium placeholder-zinc-600" 
                        placeholder="Como quer ser chamado?"
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                    />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Idade</label>
                        <div className="relative">
                            <input 
                                type="number" inputMode="numeric" pattern="[0-9]*"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 focus:border-destaque outline-none text-white text-center font-bold text-lg" 
                                value={age} onChange={e => setAge(e.target.value)} 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">anos</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Peso</label>
                        <div className="relative">
                            <input 
                                type="number" inputMode="decimal" step="0.1"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 focus:border-destaque outline-none text-white text-center font-bold text-lg" 
                                value={weight} onChange={e => setWeight(e.target.value)} 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">kg</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Altura</label>
                        <div className="relative">
                            <input 
                                type="number" inputMode="numeric" pattern="[0-9]*"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 focus:border-destaque outline-none text-white text-center font-bold text-lg" 
                                value={height} onChange={e => setHeight(e.target.value)} 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">cm</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Objetivo Atual</label>
                    <div className="flex flex-col gap-3">
                        {goalOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setGoal(option.id as any)}
                                className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 w-full ${
                                    goal === option.id 
                                    ? 'bg-destaque/10 border-destaque text-white shadow-[0_0_20px_rgba(220,38,38,0.1)]' 
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'
                                }`}
                            >
                                <div className={`p-2.5 rounded-full transition-colors ${
                                    goal === option.id ? 'bg-destaque text-white' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                }`}>
                                    <option.icon size={20} />
                                </div>
                                <span className="font-bold text-base">{option.label}</span>
                                {goal === option.id && (
                                    <div className="absolute right-4 w-3 h-3 rounded-full bg-destaque shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </form>

            {/* Danger Zone */}
            <div className="mt-8">
                <h3 className="text-xs font-bold text-red-500/70 uppercase mb-3 ml-1 flex items-center gap-2">
                    <AlertTriangle size={12} /> Zona de Perigo
                </h3>
                <div className="border border-red-900/30 bg-red-950/10 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex flex-col gap-4">
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            A exclusão da conta apaga permanentemente seus treinos e registros de dieta. Essa ação não pode ser desfeita.
                        </p>
                        <button type="button" className="w-full bg-transparent border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600 py-3 rounded-xl transition font-medium text-sm active:scale-[0.98]">
                            Excluir Minha Conta
                        </button>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-fundo via-fundo/95 to-transparent pt-8 pb-4">
                <div className="container mx-auto max-w-lg px-4">
                    <button 
                        onClick={() => handleSave()}
                        disabled={loading || !hasChanges} 
                        className="w-full bg-destaque text-white font-bold py-4 rounded-2xl hover:bg-red-700 active:scale-[0.98] transition shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePreferences;
