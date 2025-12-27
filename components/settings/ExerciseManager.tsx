
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../../types';
import { getExerciseCatalog, removeExercise, resetExerciseCatalog } from '../../services/workoutService';
import { Search, Loader2, Trash2, AlertTriangle, X, RotateCcw, Dumbbell, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseManagerProps {
    user: UserProfile;
    onUpdateUser: (u: UserProfile) => void;
}

interface ExerciseRowProps {
    exercise: string;
    group: string;
    onDelete: () => void;
    isDeleting: boolean;
}

const ExerciseRow: React.FC<ExerciseRowProps> = ({ 
    exercise, 
    group, 
    onDelete, 
    isDeleting 
}) => {
    const [isConfirming, setIsConfirming] = useState(false);

    return (
        <motion.div 
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`group relative flex items-center justify-between p-4 mb-2 bg-zinc-900 border border-zinc-800 rounded-2xl transition-all ${isConfirming ? 'border-red-900/50 bg-red-950/10' : 'hover:border-zinc-700'}`}
        >
            {/* Exercise Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${isConfirming ? 'bg-red-900/20 text-red-500' : 'bg-zinc-800 text-zinc-500'}`}>
                    <Dumbbell size={14} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold truncate transition-colors duration-300 ${isConfirming ? 'text-red-200' : 'text-zinc-200'}`}>
                        {exercise}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">
                        {group}
                    </span>
                </div>
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
                            className="flex items-center gap-2"
                        >
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }}
                                className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors"
                            >
                                <X size={16} />
                            </button>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="h-8 px-3 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-900/20 transition-colors"
                            >
                                <span className="text-xs font-bold uppercase">Excluir</span>
                                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.button 
                            key="delete"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setIsConfirming(true)}
                            className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors active:scale-95"
                            disabled={isDeleting}
                        >
                            <Trash2 size={16} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const ExerciseManager: React.FC<ExerciseManagerProps> = ({ user, onUpdateUser }) => {
    const [filterGroup, setFilterGroup] = useState<string>('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    
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

    const availableGroups = useMemo(() => ['Todos', ...Object.keys(localCatalog).sort()], [localCatalog]);
    
    // Filter logic
    const filteredExercises = useMemo(() => {
        let results: { group: string, items: string[] }[] = [];
        
        Object.entries(localCatalog).forEach(([group, items]) => {
            const list = items as string[];
            // 1. Filter by Group
            if (filterGroup !== 'Todos' && group !== filterGroup) return;

            // 2. Filter by Search Term
            const matchingItems = list.filter(item => 
                searchTerm === '' || 
                item.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (matchingItems.length > 0) {
                results.push({ group, items: matchingItems });
            }
        });

        return results;
    }, [localCatalog, filterGroup, searchTerm]);

    const hasExercises = Object.keys(localCatalog).length > 0;

    const executeDelete = async (group: string, exercise: string) => {
        setDeletingItem(exercise);
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
        <div className="pb-24 w-full max-w-full overflow-hidden">
            {error && (
                <div className="fixed top-20 left-4 right-4 z-50 bg-zinc-900/95 border border-red-500/50 text-red-500 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-pulse">
                    <AlertTriangle size={24} className="shrink-0" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            {/* Search & Filter Header */}
            <div className="sticky top-0 z-20 bg-fundo pt-2 pb-4 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <Search size={16} />
                    </div>
                    <input 
                        type="text"
                        placeholder="Buscar exercício..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-destaque focus:ring-1 focus:ring-destaque transition-all"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white bg-zinc-800 rounded-full"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Horizontal Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 mask-gradient-x">
                    {availableGroups.map(g => (
                        <button 
                            key={g} 
                            onClick={() => setFilterGroup(g)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all active:scale-95 ${
                                filterGroup === g 
                                ? 'bg-destaque text-white border-destaque shadow-lg shadow-destaque/20' 
                                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Content */}
            <div className="space-y-6 mt-2 min-h-[300px]">
                {!hasExercises ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-500 opacity-60">
                        <Layers size={48} className="mb-4 stroke-1" />
                        <p className="text-sm font-medium">Nenhum exercício disponível.</p>
                    </div>
                ) : (
                    filteredExercises.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-zinc-500 opacity-60">
                            <Search size={48} className="mb-4 stroke-1" />
                            <p className="text-sm">Nenhum resultado encontrado.</p>
                        </div>
                    ) : (
                        filteredExercises.map(({ group, items }) => (
                            <div key={group} className="space-y-2">
                                <div className="flex items-center gap-2 px-1 mb-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destaque shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
                                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{group}</h3>
                                    <div className="h-px bg-zinc-800 flex-1 ml-2" />
                                </div>
                                
                                <div className="space-y-2">
                                    <AnimatePresence initial={false}>
                                        {items.map(exercise => (
                                            <ExerciseRow 
                                                key={`${group}-${exercise}`}
                                                exercise={exercise} 
                                                group={group} 
                                                isDeleting={deletingItem === exercise}
                                                onDelete={() => executeDelete(group, exercise)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
            
            {/* Reset System Section */}
            <div className="mt-12">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    
                    {!showResetConfirm ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                    <RotateCcw size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-200">Restaurar Padrões</h4>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">Ação do Sistema</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowResetConfirm(true)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                            >
                                Restaurar
                            </button>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-red-500 mb-1">Confirmar Restauração?</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Isso irá reverter sua lista de exercícios para o estado original. Exercícios personalizados serão removidos.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 py-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleResetCatalog}
                                    disabled={isResetting}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                                >
                                    {isResetting ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExerciseManager;
