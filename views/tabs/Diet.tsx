import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { UserProfile, DietLog } from '../../types';
import { calculateTargets } from '../../services/dietService';
import { Plus, ChevronLeft, ChevronRight, Trash2, Utensils, Zap, Droplet, Layers, Flame, Dumbbell, Scale } from 'lucide-react';
import MealModal from '../../components/modals/MealModal';

const DietTab: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [date, setDate] = useState(new Date());
    const [logs, setLogs] = useState<DietLog[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sticky State Logic
    const [isStuck, setIsStuck] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        }, { threshold: [1], rootMargin: '-1px 0px 0px 0px' });

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => {
            if (sentinelRef.current) observer.unobserve(sentinelRef.current);
        };
    }, []);

    const { target } = calculateTargets(user);
    const dateStr = date.toISOString().split('T')[0];

    const fetchLogs = async () => {
        const { data } = await supabase.from('diet_logs').select('*').eq('user_id', user.id).eq('date', dateStr).order('created_at');
        setLogs(data || []);
    };

    useEffect(() => { fetchLogs(); }, [dateStr]);

    // Calculations
    const totalStats = logs.reduce((acc, log) => ({
        cal: acc.cal + log.calories,
        prot: acc.prot + log.protein,
        carb: acc.carb + log.carbs,
        fat: acc.fat + log.fats
    }), { cal: 0, prot: 0, carb: 0, fat: 0 });

    const percentCal = Math.min(100, (totalStats.cal / target) * 100);
    
    const targetProt = Math.round((target * 0.3) / 4);
    const targetCarb = Math.round((target * 0.4) / 4);
    const targetFat = Math.round((target * 0.3) / 9);

    const handleSaveMeal = async (meal: Partial<DietLog>) => {
        await supabase.from('diet_logs').insert([{ ...meal, user_id: user.id, date: dateStr }]);
        setIsModalOpen(false);
        fetchLogs();
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Excluir esta refeição?")) return;
        await supabase.from('diet_logs').delete().eq('id', id);
        fetchLogs();
    };

    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    const displayDate = isToday ? 'Hoje' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });

    const MacroBar = ({ label, current, max, colorClass, icon: Icon }: any) => {
        const pct = Math.min(100, (current / max) * 100);
        return (
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-end text-xs mb-1">
                    <span className="flex items-center gap-1 text-zinc-400 font-medium">
                        <Icon size={10} /> {label}
                    </span>
                    <span className="font-bold text-zinc-200">{current}/{max}g</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }}></div>
                </div>
            </div>
        );
    };

    const getGoalIcon = () => {
        const style = "text-destaque drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]";
        const size = 32;
        switch (user.goal) {
            case 'Emagrecimento': return <Flame size={size} className={style} fill="currentColor" fillOpacity={0.2} />;
            case 'Hipertrofia': return <Dumbbell size={size} className={style} fill="currentColor" fillOpacity={0.2} />;
            case 'Manutenção': return <Scale size={size} className={style} fill="currentColor" fillOpacity={0.2} />;
            default: return <Scale size={size} className={style} />;
        }
    };

    return (
        <div className="relative w-full pb-24">
             {/* Sentinel for Sticky Detection */}
             <div ref={sentinelRef} className="absolute top-0 left-0 right-0 h-px -translate-y-full pointer-events-none opacity-0" />

             {/* Sticky Date Header - Dynamic Styles */}
             <div className={`sticky top-0 z-20 transition-all duration-300 ease-in-out mb-6 ${
                 isStuck 
                 ? 'pt-6 pb-4 bg-fundo/95 backdrop-blur-md border-b border-zinc-800 shadow-sm rounded-b-2xl' 
                 : 'pt-2 pb-2 bg-transparent border-b border-transparent shadow-none'
             }`}>
                <div className="flex items-center justify-between">
                    <button 
                        onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))} 
                        className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95 border border-zinc-800"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                            <h2 className="font-display font-extrabold text-xl leading-none">
                                {displayDate}
                            </h2>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                {weekday}
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))}
                        disabled={isToday}
                        className={`p-3 rounded-full border border-zinc-800 transition ${isToday ? 'bg-zinc-900/50 text-zinc-600 cursor-not-allowed opacity-50' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Nutrition Summary Card */}
                <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-destaque/5 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Calorias Diárias</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-extrabold text-white">{totalStats.cal}</span>
                                <span className="text-zinc-500 font-medium">/ {target} kcal</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-center p-3 bg-zinc-850 rounded-2xl border border-zinc-800 shadow-inner">
                            {getGoalIcon()}
                        </div>
                    </div>

                    {/* Calorie Progress */}
                    <div className="w-full bg-zinc-800 h-3 rounded-full mb-6 overflow-hidden border border-zinc-700/50">
                        <div className={`h-full rounded-full transition-all duration-700 ease-out ${totalStats.cal > target ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-destaque shadow-[0_0_10px_rgba(220,38,38,0.5)]'}`} style={{ width: `${percentCal}%` }}></div>
                    </div>

                    {/* Macros Grid */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800/50">
                        <MacroBar label="Prot" current={totalStats.prot} max={targetProt} colorClass="bg-blue-500" icon={Zap} />
                        <MacroBar label="Carb" current={totalStats.carb} max={targetCarb} colorClass="bg-amber-500" icon={Layers} />
                        <MacroBar label="Gord" current={totalStats.fat} max={targetFat} colorClass="bg-purple-500" icon={Droplet} />
                    </div>
                </div>

                {/* Add Meal Button */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-zinc-900/40 border border-dashed border-zinc-700 hover:border-destaque/50 hover:bg-zinc-800/60 text-zinc-400 hover:text-white py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.99]"
                >
                    <div className="p-1 rounded bg-zinc-800 group-hover:bg-destaque transition-colors">
                        <Plus size={16} className="text-zinc-400 group-hover:text-white" />
                    </div>
                    <span className="font-semibold text-sm uppercase tracking-wide">Registrar Refeição</span>
                </button>

                {/* Meals List */}
                <div className="space-y-4">
                    {logs.length === 0 ? (
                         <div className="text-center py-8 opacity-50">
                            <div className="inline-block p-4 rounded-full bg-zinc-900 mb-3">
                                <Utensils size={24} className="text-zinc-600"/>
                            </div>
                            <p className="text-sm text-zinc-500">Nenhuma refeição registrada hoje.</p>
                         </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex justify-between items-center group relative overflow-hidden shadow-md">
                                <div className="relative z-10 flex-1">
                                    <h4 className="font-bold text-base text-zinc-100 mb-1">{log.meal_name}</h4>
                                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {log.protein}g</span>
                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> {log.carbs}g</span>
                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> {log.fats}g</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="text-right">
                                        <span className="block font-bold text-white text-lg">{log.calories}</span>
                                        <span className="text-[10px] uppercase text-zinc-500 font-bold">kcal</span>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(log.id)} 
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-500 hover:text-red-500 hover:bg-zinc-700 transition"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isModalOpen && <MealModal onClose={() => setIsModalOpen(false)} onSave={handleSaveMeal} />}
        </div>
    );
};

export default DietTab;