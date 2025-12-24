
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabaseClient';
import { UserProfile, Workout, WorkoutTemplate } from '../../types';
import { X, Save, Download, Trash2, ChevronRight, Dumbbell, Loader2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoutineManagerProps {
    mode: 'SAVE' | 'LOAD';
    user: UserProfile;
    currentWorkouts?: Workout[]; // Obrigatório apenas para SAVE
    onClose: () => void;
    onLoadRoutine?: (template: WorkoutTemplate) => void;
}

const RoutineManager: React.FC<RoutineManagerProps> = ({ mode, user, currentWorkouts, onClose, onLoadRoutine }) => {
    const [routineName, setRoutineName] = useState('');
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        document.body.classList.add('modal-open');
        if (mode === 'LOAD') {
            fetchTemplates();
        }
        return () => document.body.classList.remove('modal-open');
    }, [mode]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('workout_templates')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        setTemplates(data || []);
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!routineName.trim() || !currentWorkouts || currentWorkouts.length === 0) return;
        setIsActionLoading(true);

        try {
            // Limpa os IDs para salvar apenas os dados crus
            const cleanData = currentWorkouts.map(w => ({
                name: w.name,
                exercises: w.exercises,
                // Não salvamos ID ou Data específica, pois isso será gerado ao carregar
            }));

            const { error } = await supabase.from('workout_templates').insert({
                user_id: user.id,
                name: routineName,
                data: cleanData
            });

            if (error) throw error;
            onClose();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar rotina.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Excluir esta rotina?')) return;
        
        const { error } = await supabase.from('workout_templates').delete().eq('id', id);
        if (!error) {
            setTemplates(templates.filter(t => t.id !== id));
        }
    };

    const modalContent = (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-700 flex flex-col shadow-2xl overflow-hidden max-h-[85vh]"
            >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {mode === 'SAVE' ? <Save size={20} className="text-destaque" /> : <Bookmark size={20} className="text-destaque" />}
                        {mode === 'SAVE' ? 'Salvar Rotina' : 'Minhas Rotinas'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {mode === 'SAVE' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Nome da Rotina</label>
                                <input 
                                    autoFocus
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-500 focus:border-destaque outline-none transition-colors"
                                    placeholder="Ex: Treino de Perna A"
                                    value={routineName}
                                    onChange={e => setRoutineName(e.target.value)}
                                />
                            </div>
                            
                            <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
                                <p className="text-zinc-400 text-xs mb-3 font-medium">Isso salvará os seguintes exercícios:</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                    {currentWorkouts?.map((w, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-destaque shrink-0" />
                                            <span className="truncate">{w.name}</span>
                                            <span className="text-zinc-600 text-xs ml-auto">
                                                {w.exercises[0]?.sets?.length} séries
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={isActionLoading || !routineName.trim()}
                                className="w-full bg-destaque text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-destaque/20 flex items-center justify-center gap-2 mt-4"
                            >
                                {isActionLoading ? <Loader2 className="animate-spin" /> : 'Salvar Predefinição'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="animate-spin text-destaque" />
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-10 text-zinc-500">
                                    <Dumbbell size={32} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Nenhuma rotina salva.</p>
                                    <p className="text-xs mt-1">Salve um treino do dia para vê-lo aqui.</p>
                                </div>
                            ) : (
                                templates.map((template) => (
                                    <motion.div 
                                        layout
                                        key={template.id}
                                        onClick={() => onLoadRoutine && onLoadRoutine(template)}
                                        className="group bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-destaque/30 p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between"
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="font-bold text-white text-base mb-1 truncate">{template.name}</h4>
                                            <p className="text-xs text-zinc-500 truncate">
                                                {template.data?.length || 0} exercícios • {new Date(template.created_at || '').toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={(e) => handleDelete(template.id, e)}
                                                className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="p-2 bg-destaque/10 text-destaque rounded-lg group-hover:bg-destaque group-hover:text-white transition-colors">
                                                <Download size={18} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default RoutineManager;
