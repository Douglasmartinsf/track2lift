
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { getExerciseCatalog, removeExercise, resetExerciseCatalog } from '../../services/workoutService';
import { List, Filter, Loader2, Trash2, AlertTriangle, Check, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseManagerProps {
    user: UserProfile;
    onUpdateUser: (u: UserProfile) => void;
}

const ExerciseRow = ({ 
    exercise, 
    group, 
    onDelete, 
    isDeleting 
}: { 
    exercise: string, 
    group: string, 
    onDelete: () => void, 
    isDeleting: boolean 
}) => {
    const [isConfirming, setIsConfirming] = useState(false);

    return (
        <div className={`group flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800/50 last:border-0 h-[64px] transition-colors ${isConfirming ? 'bg-zinc-900' : 'hover:bg-zinc-800/30'}`}>
            
            {/* Exercise Name */}
            <div className="flex-1 min-w-0 mr-4">
                <span className={`text-sm font-medium truncate block transition-colors duration-300 ${isConfirming ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    {exercise}
                </span>
            </div>

            {/* Actions Container */}
            <div className="shrink-0 flex items-center">
                <AnimatePresence mode="wait" initial={false}>
                    {isConfirming ? (
                        <motion.div 
                            key="confirm"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="flex items-center"
                        >
                            <div className="flex items-center gap-2 bg-zinc-950 border border-red-900/30 rounded-full p-1 pr-1.5 pl-4 shadow-lg shadow-black/20">
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-wider whitespace-nowrap mr-1">Excluir?</span>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }}
                                    className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors shrink-0"
                                >
                                    <X size={14} />
                                </button>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    className="w-7 h-7 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-900/20 transition-colors shrink-0"
                                >
                                    {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} strokeWidth={4} />}
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.button 
                            key="delete"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsConfirming(true)}
                            className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors active:scale-95"
                            disabled={isDeleting}
                        >
                            <Trash2 size={18} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const ExerciseManager: React.FC<ExerciseManagerProps> = ({ user, onUpdateUser }) => {
    const [filterGroup, setFilterGroup] = useState<string>('Todos');
    
    // Optimistic State
    const [localCatalog, setLocalCatalog] = useState<Record<string, string[]>>({});
    const [deletingItem, setDeletingItem] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Reset Logic States
    const [isResetting, setIsResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Sync local state when user prop changes
    useEffect(() => {
        setLocalCatalog(getExerciseCatalog(user));
    }, [user]);

    const availableGroups = ['Todos', ...Object.keys(localCatalog).sort()];
    
    const filteredExercises = Object.entries(localCatalog).filter(([group]) => {
        if (filterGroup === 'Todos') return true;
        return group === filterGroup;
    });

    const hasExercises = Object.keys(localCatalog).length > 0;

    const executeDelete = async (group: string, exercise: string) => {
        setDeletingItem(exercise);
        
        // Optimistic UI Update (delay for animation feel)
        const previousCatalog = { ...localCatalog };
        
        try {
            const updatedUser = await removeExercise(user, group, exercise);
            onUpdateUser(updatedUser);
        } catch (err: any) {
            console.error("Delete failed:", err);
            setLocalCatalog(previousCatalog);
            setError("Erro ao remover exercício.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setDeletingItem(null);
        }
    };

    const handleResetCatalog = async () => {
        setIsResetting(true);
        try {
            const updatedUser = await resetExerciseCatalog(user);
            onUpdateUser(updatedUser);
            setShowResetConfirm(false);
        } catch (err: any) {
            setError("Erro ao resetar catálogo.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="pb-12 w-full max-w-full overflow-hidden">
            {error && (
                <div className="fixed top-20 left-4 right-4 z-50 bg-zinc-900/95 border border-red-500/50 text-red-500 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-pulse">
                    <AlertTriangle size={24} className="shrink-0" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 ml-1">
                    <List size={14} /> Gerenciar Exercícios
                </h3>
                
                <div className="relative w-full sm:w-auto">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <Filter size={12} />
                    </div>
                    <select 
                        value={filterGroup} 
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="w-full sm:w-40 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-lg pl-8 pr-3 py-2 outline-none focus:border-destaque appearance-none cursor-pointer"
                    >
                        {availableGroups.map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden min-h-[300px] max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar relative">
                {!hasExercises ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                        <p className="text-zinc-500 text-sm font-medium">Nenhum exercício disponível.</p>
                    </div>
                ) : (
                    filteredExercises.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                            <p className="text-zinc-500 text-sm">Nenhum exercício neste grupo.</p>
                        </div>
                    ) : (
                        filteredExercises.map(([group, exercises]) => (
                            <div key={group} className="border-b border-zinc-800 last:border-0 bg-zinc-900">
                                <div className="px-5 py-2 bg-zinc-950/80 border-b border-zinc-800/50 sticky top-0 backdrop-blur-sm z-20">
                                    <span className="text-[10px] font-black text-destaque uppercase tracking-widest">{group}</span>
                                </div>
                                <div className="bg-zinc-900">
                                    <AnimatePresence initial={false}>
                                        {(exercises as string[]).map(exercise => (
                                            <motion.div
                                                key={exercise}
                                                layout
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <ExerciseRow 
                                                    exercise={exercise} 
                                                    group={group} 
                                                    isDeleting={deletingItem === exercise}
                                                    onDelete={() => executeDelete(group, exercise)}
                                                />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
            
            {/* Reset Defaults Section */}
            <div className="mt-8 border-t border-zinc-800/50 pt-6">
                {!showResetConfirm ? (
                    <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        <RotateCcw size={14} /> Restaurar lista padrão
                    </button>
                ) : (
                    <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-red-500 mb-1">Restaurar Padrões?</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Isso removerá todos os exercícios personalizados e reexibirá os que foram ocultados. Seus treinos passados não serão afetados.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowResetConfirm(false)}
                                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-xs font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleResetCatalog}
                                disabled={isResetting}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                {isResetting ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar Reset'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExerciseManager;
