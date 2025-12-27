
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabaseClient';
import { UserProfile, Workout, WorkoutTemplate } from '../../types';
import { getExerciseCatalog, identifyMuscleGroup } from '../../services/workoutService';
import { X, Save, Download, Trash2, ChevronRight, Dumbbell, Loader2, Bookmark, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoutineManagerProps {
    mode: 'SAVE' | 'LOAD';
    user: UserProfile;
    currentWorkouts?: Workout[]; // Obrigatório apenas para SAVE
    onClose: () => void;
    onLoadRoutine?: (template: WorkoutTemplate) => void;
    onRoutineSaved?: (name: string) => void;
}

const RoutineManager: React.FC<RoutineManagerProps> = ({ mode, user, currentWorkouts, onClose, onLoadRoutine, onRoutineSaved }) => {
    const [routineName, setRoutineName] = useState('');
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    // State for deletion popup
    const [templateToDelete, setTemplateToDelete] = useState<WorkoutTemplate | null>(null);

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
            }));

            const { error } = await supabase.from('workout_templates').insert({
                user_id: user.id,
                name: routineName,
                data: cleanData
            });

            if (error) throw error;

            // Persistence Step: Update the CURRENT workouts in the DB to tag them with this new routine name
            // This ensures that immediately after saving, the UI reflects "Routine Name" instead of Muscle Group
            const idsToUpdate = currentWorkouts.map(w => w.id);
            if (idsToUpdate.length > 0) {
                await supabase
                    .from('workouts')
                    .update({ source_routine_name: routineName })
                    .in('id', idsToUpdate);
            }
            
            // Notify parent to update header title locally
            if (onRoutineSaved) {
                onRoutineSaved(routineName);
            }

            onClose();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar rotina.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;
        const id = templateToDelete.id;
        
        // Close popup
        setTemplateToDelete(null);

        // Optimistic UI Update
        const previousTemplates = [...templates];
        setTemplates(prev => prev.filter(t => t.id !== id));

        try {
            const { error } = await supabase
                .from('workout_templates')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id); 

            if (error) throw error;
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir rotina. Tente novamente.");
            setTemplates(previousTemplates);
        }
    };

    const getRoutineSummary = (template: WorkoutTemplate) => {
        const catalog = getExerciseCatalog(user);
        const counts: Record<string, number> = {};

        if (!template.data || template.data.length === 0) return 'Sem exercícios';

        template.data.forEach(w => {
            w.exercises.forEach(ex => {
                const info = identifyMuscleGroup(ex.name, catalog);
                const group = info?.group || 'Outros';
                const numSets = ex.sets?.length || 0;
                counts[group] = (counts[group] || 0) + numSets;
            });
        });

        // Sort by sets count descending
        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(e => e[0]);

        if (sorted.length === 0) return 'Vazio';

        const top = sorted.slice(0, 2).join(', ');
        const remaining = sorted.length - 2;

        return remaining > 0 ? `${top} +${remaining}` : top;
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
                className="bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-700 flex flex-col shadow-2xl overflow-hidden max-h-[85vh] relative"
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
                                    maxLength={15}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-white placeholder-zinc-500 focus:border-destaque outline-none transition-colors"
                                    placeholder="Ex: Treino de Perna A"
                                    value={routineName}
                                    onChange={e => setRoutineName(e.target.value)}
                                />
                                <div className="text-right text-[10px] text-zinc-600 mt-1 font-bold">
                                    {routineName.length}/15
                                </div>
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
                                        className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl flex items-center justify-between"
                                    >
                                        {/* Área clicável de Texto */}
                                        <div 
                                            onClick={() => onLoadRoutine && onLoadRoutine(template)}
                                            className="flex-1 min-w-0 pr-4 cursor-pointer hover:opacity-70 transition-opacity"
                                        >
                                            <h4 className="font-bold text-white text-base mb-1 truncate">{template.name}</h4>
                                            <p className="text-xs text-zinc-500 truncate">
                                                {template.data?.length || 0} exercícios • {getRoutineSummary(template)}
                                            </p>
                                        </div>
                                        
                                        {/* Área de Ações */}
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setTemplateToDelete(template); }}
                                                className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            
                                            <button 
                                                onClick={() => onLoadRoutine && onLoadRoutine(template)}
                                                className="w-10 h-10 flex items-center justify-center bg-destaque/10 text-destaque border border-destaque/20 rounded-xl hover:bg-destaque hover:text-white transition-colors"
                                                title="Carregar Rotina"
                                            >
                                                <Download size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Confirmation Popup Overlay */}
                <AnimatePresence>
                    {templateToDelete && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-zinc-900 border border-zinc-700 w-full rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center"
                            >
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
                                    <Trash2 size={28} />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">Excluir Rotina?</h3>
                                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                                    Tem certeza que deseja excluir <strong>"{templateToDelete.name}"</strong>? <br/>
                                    Essa ação não pode ser desfeita.
                                </p>
                                
                                <div className="flex gap-3 w-full">
                                    <button 
                                        onClick={() => setTemplateToDelete(null)}
                                        className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-700 hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={confirmDelete}
                                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/30"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default RoutineManager;
