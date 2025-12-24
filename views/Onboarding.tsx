import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingViewProps {
    onComplete: (data: Partial<UserProfile>) => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [goal, setGoal] = useState<UserProfile['goal']>('Hipertrofia');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete({
            age: Number(age),
            weight: Number(weight),
            height: Number(height),
            goal
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-fundo flex items-center justify-center p-4">
             <div className="relative w-full max-w-lg bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-zinc-700">
                <h2 className="text-2xl font-bold mb-2">Configure seu Perfil</h2>
                <p className="text-zinc-400 mb-6 text-sm">Precisamos de alguns dados para calcular suas metas.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Idade</label>
                            <input type="number" required min="10" max="100" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:border-destaque outline-none" 
                                value={age} onChange={e => setAge(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Peso (kg)</label>
                            <input type="number" required min="30" max="300" step="0.1" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:border-destaque outline-none" 
                                value={weight} onChange={e => setWeight(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Altura (cm)</label>
                            <input type="number" required min="100" max="250" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 focus:border-destaque outline-none" 
                                value={height} onChange={e => setHeight(e.target.value)} />
                        </div>
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Objetivo</label>
                         <div className="space-y-2">
                             {(['Emagrecimento', 'Hipertrofia', 'Manutenção'] as const).map(g => (
                                 <label key={g} className={`block p-4 rounded-lg border-2 cursor-pointer transition ${goal === g ? 'border-destaque bg-red-900/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'}`}>
                                     <input type="radio" name="goal" className="hidden" value={g} checked={goal === g} onChange={() => setGoal(g)} />
                                     <span className={`font-bold ${goal === g ? 'text-destaque' : 'text-white'}`}>{g}</span>
                                 </label>
                             ))}
                         </div>
                    </div>

                    <button type="submit" className="w-full bg-destaque text-white font-bold py-3 rounded-lg hover:bg-red-700 transition">
                        Salvar e Começar
                    </button>
                </form>
             </div>
        </div>
    );
};

export default OnboardingView;
