
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Workout, Exercise, ExerciseSet, UserProfile } from '../../types';
import { identifyMuscleGroup, getExercisesForGroup, addCustomExercise, getExerciseCatalog } from '../../services/workoutService';
import MuscleMap from '../MuscleMap';
import { X, Plus, Save, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabaseClient';

interface WorkoutModalProps {
    onClose: () => void;
    onSave: (w: Partial<Workout>) => void;
    initialData?: Workout;
    date: string;
    user?: UserProfile; // Make sure to pass this from parent
}

const WorkoutModal: React.FC<WorkoutModalProps> = ({ onClose, onSave, initialData, date, user }) => {
    // If user is not passed via props, we try to get it from state or simple mock to prevent crash,
    // but ideally it should come from props.
    // Assuming App architecture passes user down or uses a context.
    
    const initialExercise = initialData?.exercises?.[0] || { name: '', type: 'strength', sets: [{ reps: 0, weight: 0 }] };
    
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
    
    // State management for exercises
    const [availableExercises, setAvailableExercises] = useState<string[]>([]);
    const [exerciseName, setExerciseName] = useState(initialExercise.name);
    const [sets, setSets] = useState<ExerciseSet[]>(initialExercise.sets);

    // Logic to handle "Custom" input vs "Select" dropdown
    const [isCustomInput, setIsCustomInput] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        document.body.classList.add('modal-open');
        
        // Initial setup
        if (user) {
            // Get muscles from user-specific catalog (keys of the map)
            // But we want ALL muscles that CAN exist (keys of Default Catalog usually covers it)
            // However, getExercisesForGroup handles the mapping.
            // Let's rely on standard keys for the dropdown to keep it simple.
            const standardGroups = ['Peito', 'Costas', 'Deltoide Anterior', 'Deltoide Lateral', 'Deltoide Posterior', 'Bíceps', 'Tríceps', 'Antebraço', 'Quadríceps', 'Posterior', 'Panturrilha', 'Abdômen'];
            setMuscleGroups(standardGroups);

            if (initialExercise.name) {
                // Determine muscle group using full catalog to catch custom exercises
                const fullCatalog = getExerciseCatalog(user); 
                const id = identifyMuscleGroup(initialExercise.name, fullCatalog);
                
                if (id) setSelectedGroup(id.group);
            }
        }

        return () => document.body.classList.remove('modal-open');
    }, [user, initialExercise.name]);

    // Fetch exercises whenever group changes
    useEffect(() => {
        if (selectedGroup && user) {
            const list = getExercisesForGroup(user, selectedGroup);
            setAvailableExercises(list);
            
            // If switching groups, ensure we reset unless loading initial data
            if (exerciseName && !list.includes(exerciseName) && !isCustomInput) {
                 const match = list.find(e => e.toLowerCase() === exerciseName.toLowerCase());
                 if (!match) {
                     // Check if it really belongs to another group (prevent clearing on first load)
                     const fullCatalog = getExerciseCatalog(user);
                     const id = identifyMuscleGroup(exerciseName, fullCatalog);
                     
                     // Only clear if the exercise definitively belongs to a different group than the one currently selected
                     // and we aren't just initializing the form
                     if (id?.group && id.group !== selectedGroup) {
                         setExerciseName('');
                     }
                 }
            }
        }
    }, [selectedGroup, user]);

    // Determines if current mode is cardio based on group selection
    const isCardio = selectedGroup === 'Cardio';

    const handleGroupChange = (group: string) => {
        setSelectedGroup(group);
        setExerciseName('');
        setIsCustomInput(false);
        // Reset sets structure when switching types
        if (group === 'Cardio') {
            setSets([{ duration: 0 }]);
        } else {
            setSets([{ reps: 0, weight: 0 }]);
        }
    };

    const handleSelectChange = (value: string) => {
        if (value === 'outro') {
            setIsCustomInput(true);
            setExerciseName('');
        } else {
            setIsCustomInput(false);
            setExerciseName(value);
        }
    };

    const addSet = () => {
        const lastSet = sets[sets.length - 1];
        if (isCardio) {
            setSets([...sets, { duration: lastSet?.duration || 0 }]);
        } else {
            setSets([...sets, { reps: lastSet?.reps || 0, weight: lastSet?.weight || 0 }]);
        }
    };

    const removeSet = (index: number) => {
        setSets(sets.filter((_, i) => i !== index));
    };

    // Validation Logic
    const isValid = useMemo(() => {
        if (!exerciseName || sets.length === 0) return false;
        
        if (isCardio) {
            // For cardio, ensure duration exists and is > 0
            return sets.every(s => s.duration !== undefined && s.duration > 0);
        } else {
            // For strength, ensure reps AND weight exist and are > 0
            return sets.every(s => 
                s.reps !== undefined && s.reps > 0 && 
                s.weight !== undefined && s.weight > 0
            );
        }
    }, [exerciseName, sets, isCardio]);

    // Detect if any meaningful change was made compared to initial data
    const hasChanges = useMemo(() => {
        if (!initialData) return true; // creating new => allow save when valid
        const initialEx = initialData.exercises?.[0] || { name: '', sets: [] };
        // compute initial group if possible
        let initialGroup = '';
        if (user && initialEx.name) {
            try {
                const fullCatalog = getExerciseCatalog(user);
                const id = identifyMuscleGroup(initialEx.name, fullCatalog);
                initialGroup = id?.group || '';
            } catch (e) {
                initialGroup = '';
            }
        }

        const nameChanged = exerciseName !== (initialEx.name || '');
        const groupChanged = selectedGroup !== initialGroup;

        // Compare sets more robustly: length or any per-set field differs
        const initialSets = initialEx.sets || [];
        const currentSets = sets || [];
        let setsChanged = false;
        if (initialSets.length !== currentSets.length) {
            setsChanged = true;
        } else {
            for (let i = 0; i < currentSets.length; i++) {
                const a: any = initialSets[i] || {};
                const b: any = currentSets[i] || {};
                // cardio uses duration; strength uses reps and weight
                if (a.duration !== undefined || b.duration !== undefined) {
                    if (Number(a.duration || 0) !== Number(b.duration || 0)) { setsChanged = true; break; }
                } else {
                    if (Number(a.reps || 0) !== Number(b.reps || 0)) { setsChanged = true; break; }
                    if (Number(a.weight || 0) !== Number(b.weight || 0)) { setsChanged = true; break; }
                }
            }
        }

        return nameChanged || setsChanged || groupChanged;
    }, [initialData, exerciseName, sets, selectedGroup, user]);

    const handleSave = async () => {
        if (!isValid) return;
        setSaving(true);

        try {
            // If it was a custom input, save it to Supabase via helper
            if (isCustomInput && selectedGroup && user) {
                await addCustomExercise(user, selectedGroup, exerciseName);
            }

            const exercise: Exercise = {
                name: exerciseName,
                type: isCardio ? 'cardio' : 'strength',
                sets: sets
            };

            onSave({ 
                name: exerciseName, 
                exercises: [exercise], 
                date: initialData?.date || date 
            });
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar exercício. Tente novamente.");
            setSaving(false);
        }
    };

    // Calculate current value for the Select element
    const selectValue = useMemo(() => {
        if (isCustomInput) return 'outro';
        if (availableExercises.includes(exerciseName)) return exerciseName;
        if (!exerciseName) return '';
        return 'outro'; // Fallback
    }, [isCustomInput, availableExercises, exerciseName]);

    const blockInvalidChar = (e: React.KeyboardEvent) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    if (!user) return null;

    const modalContent = (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900 w-full max-w-lg rounded-3xl border border-zinc-700 flex flex-col shadow-2xl overflow-hidden max-h-[90vh]"
            >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white">{initialData ? 'Editar Exercício' : 'Novo Exercício'}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                    <div className="flex gap-4">
                        <div className="w-24 shrink-0 bg-zinc-950 rounded-xl p-2 border border-zinc-800 overflow-hidden relative">
                            <MuscleMap activeMuscles={selectedGroup ? [selectedGroup] : []} />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Grupo Muscular</label>
                                <select 
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-destaque outline-none transition-colors text-white appearance-none cursor-pointer"
                                    value={selectedGroup}
                                    onChange={e => handleGroupChange(e.target.value)}
                                >
                                    <option value="" disabled={!!selectedGroup}>Selecione...</option>
                                    {muscleGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                    <option value="Cardio">Cardio</option>
                                </select>
                            </div>
                            
                            <AnimatePresence mode="wait">
                                {selectedGroup && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} 
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Exercício</label>
                                        </div>

                                        <select 
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:border-destaque outline-none transition-colors text-white appearance-none cursor-pointer"
                                            value={selectValue}
                                            onChange={e => handleSelectChange(e.target.value)}
                                        >
                                            <option value="" disabled>Selecione...</option>
                                            {availableExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                                            <option value="outro" className="font-bold text-destaque">+ Outro (Digitar)</option>
                                        </select>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {isCustomInput && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Nome do Novo Exercício</label>
                             <div className="relative">
                                <input 
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:border-destaque outline-none transition-colors text-white pr-10"
                                    placeholder="Digite o nome..."
                                    value={exerciseName}
                                    autoFocus
                                    onChange={e => setExerciseName(e.target.value)}
                                />
                                <button 
                                    onClick={() => setIsCustomInput(false)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                >
                                    <X size={16}/>
                                </button>
                             </div>
                             <p className="text-[10px] text-zinc-500 mt-1">* Será salvo na lista de {selectedGroup}</p>
                        </motion.div>
                    )}

                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{isCardio ? 'Sessões' : 'Séries'}</label>
                            <span className="text-xs text-zinc-600 font-bold uppercase">{sets.length} {isCardio ? (sets.length === 1 ? 'sessão' : 'sessões') : (sets.length === 1 ? 'série' : 'séries')}</span>
                        </div>
                        
                        <div className="space-y-2">
                            <AnimatePresence initial={false}>
                                {sets.map((set, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="flex gap-2 items-center"
                                    >
                                        <div className="w-8 h-10 flex items-center justify-center bg-zinc-800 rounded-lg text-xs font-bold text-zinc-500 border border-zinc-700/50">
                                            {i + 1}
                                        </div>
                                        <div className={`flex-1 grid ${isCardio ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                                            
                                            {isCardio ? (
                                                /* INPUT DE DURAÇÃO PARA CARDIO */
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        min="0"
                                                        onKeyDown={blockInvalidChar}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-center font-bold text-white focus:border-destaque outline-none transition-colors" 
                                                        placeholder="0" 
                                                        value={set.duration || ''} 
                                                        onChange={e => {
                                                            const newSets = [...sets];
                                                            newSets[i].duration = Math.max(0, Number(e.target.value));
                                                            // Limpar reps/weight para garantir consistência
                                                            delete newSets[i].reps;
                                                            delete newSets[i].weight;
                                                            setSets(newSets);
                                                        }} 
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-zinc-600">
                                                        <Clock size={10} strokeWidth={3} />
                                                        <span className="text-[10px] font-bold uppercase">Min</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* INPUTS DE FORÇA (REPS + KG) */
                                                <>
                                                    <div className="relative">
                                                        <input 
                                                            type="number"
                                                            min="0"
                                                            onKeyDown={blockInvalidChar}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-center font-bold text-white focus:border-destaque outline-none transition-colors" 
                                                            placeholder="0" 
                                                            value={set.reps || ''} 
                                                            onChange={e => {
                                                                const newSets = [...sets];
                                                                newSets[i].reps = Math.max(0, Number(e.target.value));
                                                                setSets(newSets);
                                                            }} 
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-bold uppercase pointer-events-none">Reps</span>
                                                    </div>
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            onKeyDown={blockInvalidChar}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-center font-bold text-white focus:border-destaque outline-none transition-colors" 
                                                            placeholder="0" 
                                                            value={set.weight || ''} 
                                                            onChange={e => {
                                                                const newSets = [...sets];
                                                                newSets[i].weight = Math.max(0, Number(e.target.value));
                                                                setSets(newSets);
                                                            }} 
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-bold uppercase pointer-events-none">Kg</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => removeSet(i)} 
                                            className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        
                        <button 
                            onClick={addSet} 
                            className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-destaque/50 hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide"
                        >
                            <Plus size={16} /> {isCardio ? 'Adicionar Sessão' : 'Adicionar Série'}
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-800 bg-zinc-900/95 shrink-0">
                    <button 
                        onClick={handleSave} 
                        disabled={saving || !isValid || !hasChanges} 
                        className="w-full bg-destaque text-white py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-destaque/20 flex items-center justify-center gap-2"
                    >
                        {saving ? 'Salvando...' : <><Save size={18} /> {initialData ? 'Salvar Alterações' : 'Salvar Exercício'}</>}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default WorkoutModal;
