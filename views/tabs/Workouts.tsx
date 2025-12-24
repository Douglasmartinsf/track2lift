
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Workout, UserProfile, WorkoutTemplate } from '../../types';
import { identifyMuscleGroup, getExerciseCatalog } from '../../services/workoutService';
import MuscleMap from '../../components/MuscleMap';
import { Plus, ChevronLeft, ChevronRight, Edit2, Trash2, Dumbbell, TrendingUp, ChevronDown, X, Check, Loader2, AlertTriangle, Layers, Timer, Weight, Bookmark, Save, RefreshCw } from 'lucide-react';
import WorkoutModal from '../../components/modals/WorkoutModal';
import RoutineManager from '../../components/modals/RoutineManager';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

const ExerciseCard = ({ workout, onEdit, onDelete, userCatalog }: { workout: Workout, onEdit: () => void, onDelete: () => void, userCatalog: Record<string, string[]> }) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const x = useMotionValue(0);
    
    // Transformações visuais baseadas no arraste
    const opacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
    const scaleIcon = useTransform(x, [-100, 0], [1.2, 0.5]);
    const backgroundColor = useTransform(x, [-100, -80], ["#ef4444", "#dc2626"]);

    const handleDragEnd = (_: any, info: any) => {
        // Se arrastou mais de 60px para a esquerda, ativa confirmação
        if (info.offset.x < -40) {
            setIsConfirming(true);
        } else {
            setIsConfirming(false);
        }
    };

    const handleTap = () => {
        if (!isConfirming && Math.abs(x.get()) < 5) {
            onEdit();
        }
    };

    // Passamos o userCatalog aqui para identificar exercícios personalizados corretamente
    const muscleGroup = workout.exercises[0] ? identifyMuscleGroup(workout.exercises[0].name, userCatalog)?.group : null;

    const getMuscleOffset = (group: string | null | undefined) => {
        if (!group) return 0;
        const lowerBody = ['Quadríceps', 'Posterior', 'Panturrilha'];
        const core = ['Abdômen', 'Cardio']; 
        if (lowerBody.includes(group)) return -25;
        if (core.includes(group)) return 0;
        return 15;
    }

    const yOffset = getMuscleOffset(muscleGroup);

    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 mb-3 touch-pan-y">
            {/* Camada de Ações (Fundo) */}
            <motion.div 
                style={{ opacity, backgroundColor }}
                className="absolute inset-0 flex items-center justify-end px-8"
            >
                <motion.div style={{ scale: scaleIcon }} className="text-white">
                    <Trash2 size={24} />
                </motion.div>
            </motion.div>

            {/* Card Principal Arrastável */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={{ right: 0, left: 0.1 }}
                onDragEnd={handleDragEnd}
                animate={{ x: isConfirming ? -100 : 0 }}
                style={{ x }}
                onTap={handleTap}
                className="relative z-10 bg-zinc-900 border border-white/5 p-5 hover:border-destaque/30 transition-colors shadow-lg flex items-center justify-between touch-pan-y cursor-pointer select-none rounded-[2rem]"
            >
                <div className="flex items-center gap-4 pointer-events-none">
                    <div className="w-12 h-12 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden relative shrink-0 p-1">
                         <MuscleMap activeMuscles={muscleGroup ? [muscleGroup] : []} offsetY={yOffset} />
                    </div>
                    <div>
                        <h5 className="font-display font-black text-base text-white uppercase truncate max-w-[180px] sm:max-w-none">
                            {workout.exercises[0]?.name || workout.name}
                        </h5>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                                {workout.exercises[0]?.sets.length} séries
                            </span>
                            <div className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">
                                {muscleGroup || 'Geral'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-600 pointer-events-none">
                    <Edit2 size={16} className="opacity-30" />
                    <ChevronLeft size={16} className="animate-pulse" />
                </div>
            </motion.div>

            {/* Overlay de Confirmação */}
            <AnimatePresence>
                {isConfirming && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute inset-0 z-30 bg-red-600 flex items-center justify-between px-6 rounded-[2rem]"
                    >
                        <div className="flex items-center gap-3 text-white">
                            <Trash2 size={20} className="animate-bounce" />
                            <span className="font-display font-black text-xs uppercase tracking-widest">Excluir?</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }}
                                className="p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors active:scale-90"
                            >
                                <X size={20} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="p-3 bg-white text-red-600 rounded-full shadow-2xl hover:bg-zinc-100 transition-colors active:scale-90"
                            >
                                <Check size={20} strokeWidth={4} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const WorkoutSkeleton = () => (
    <div className="relative rounded-[2rem] bg-zinc-900/40 border border-white/5 p-5 mb-3 flex items-center gap-4">
        <div className="w-12 h-12 bg-zinc-800 rounded-2xl animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-zinc-800/60 rounded animate-pulse" />
        </div>
    </div>
);

const WorkoutsTab: React.FC<{ user: UserProfile }> = ({ user }) => {
    const [date, setDate] = useState(new Date());
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMapExpanded, setIsMapExpanded] = useState(true);
    const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    
    // States for Delete All confirmation
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [isDeletingLoading, setIsDeletingLoading] = useState(false);

    // States for Overwrite Confirmation (Loading Routine)
    const [showOverwriteModal, setShowOverwriteModal] = useState(false);
    const [pendingTemplate, setPendingTemplate] = useState<WorkoutTemplate | null>(null);

    // Routine Manager State
    const [routineMode, setRoutineMode] = useState<'SAVE' | 'LOAD' | null>(null);

    // Sticky State Logic
    const [isStuck, setIsStuck] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Memoize user catalog to prevent recalculations
    const userCatalog = useMemo(() => getExerciseCatalog(user), [user]);

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

    const dateStr = date.toISOString().split('T')[0];

    const fetchWorkouts = async () => {
        setIsLoading(true);
        // Pequeno delay artificial para evitar flicker muito rápido se a conexão for instantânea
        // e garantir a transição suave
        const minTime = new Promise(resolve => setTimeout(resolve, 300));
        
        const fetchPromise = supabase
            .from('workouts')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', dateStr)
            .order('created_at');

        const [_, { data }] = await Promise.all([minTime, fetchPromise]);
        
        setWorkouts(data || []);
        setIsLoading(false);
    };

    useEffect(() => { fetchWorkouts(); }, [dateStr]);

    const handleSave = async (workout: Partial<Workout>) => {
        if (editingWorkout) {
            await supabase.from('workouts').update(workout).eq('id', editingWorkout.id);
        } else {
            await supabase.from('workouts').insert([{ ...workout, user_id: user.id, date: dateStr }]);
        }
        setIsModalOpen(false);
        setEditingWorkout(undefined);
        fetchWorkouts();
    };

    const handleDelete = async (id: string) => {
        await supabase.from('workouts').delete().eq('id', id);
        fetchWorkouts();
    };

    const confirmDeleteAll = async () => {
        if (workouts.length === 0) return;
        setIsDeletingLoading(true);
        try {
            const idsToDelete = workouts.map(w => w.id);
            const { error } = await supabase.from('workouts').delete().in('id', idsToDelete);
            if (error) throw error;
            setWorkouts([]); 
            await fetchWorkouts(); 
            setShowDeleteAllModal(false);
        } catch (error) {
            console.error("Erro ao excluir:", error);
        } finally {
            setIsDeletingLoading(false);
        }
    };

    const applyRoutine = async (template: WorkoutTemplate) => {
        setIsLoading(true);
        setRoutineMode(null);
        setShowOverwriteModal(false);
        setPendingTemplate(null);

        try {
            // 1. Limpar exercícios existentes do dia
            if (workouts.length > 0) {
                const idsToDelete = workouts.map(w => w.id);
                const { error: delError } = await supabase.from('workouts').delete().in('id', idsToDelete);
                if (delError) throw delError;
                setWorkouts([]); // Limpa visualmente antes de carregar
            }

            // 2. Inserir exercícios do template
            const newWorkouts = template.data.map(w => ({
                user_id: user.id,
                date: dateStr,
                name: w.name,
                exercises: w.exercises
            }));

            const { error } = await supabase.from('workouts').insert(newWorkouts);
            if (error) throw error;
            await fetchWorkouts();
        } catch (err) {
            console.error("Error loading routine", err);
            alert("Erro ao carregar rotina.");
            setIsLoading(false);
        }
    };

    const handleLoadRoutine = (template: WorkoutTemplate) => {
        if (workouts.length > 0) {
            setPendingTemplate(template);
            setRoutineMode(null);
            setShowOverwriteModal(true);
        } else {
            applyRoutine(template);
        }
    };

    const muscleStats = useMemo(() => {
        if (!workouts.length && !isLoading) return { groups: [], volume: 0, sets: 0, duration: 0, focus: 'Descanso' };
        if (isLoading) return { groups: [], volume: 0, sets: 0, duration: 0, focus: '...' };

        const groupsMap = new Map<string, number>();
        let vol = 0;
        let totalSets = 0;
        let totalDuration = 0;

        workouts.forEach(w => w.exercises.forEach(ex => {
            const idResult = identifyMuscleGroup(ex.name, userCatalog);
            if (idResult) {
                const currentSets = groupsMap.get(idResult.group) || 0;
                groupsMap.set(idResult.group, currentSets + (ex.sets.length || 0));
            }
            
            totalSets += ex.sets.length;

            ex.sets.forEach(s => {
                if (ex.type === 'cardio') {
                    totalDuration += s.duration || 0;
                } else {
                    vol += (s.reps || 0) * (s.weight || 0);
                }
            });
        }));
        
        const sortedGroups = Array.from(groupsMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
        
        let headerFocus = sortedGroups[0] || 'Geral';
        if (headerFocus === 'Cardio' && sortedGroups.length > 1) {
            headerFocus = sortedGroups[1];
        }

        let mapGroups = sortedGroups;
        
        if (sortedGroups.length > 1 && sortedGroups.includes('Cardio')) {
            mapGroups = sortedGroups.filter(g => g !== 'Cardio');
        }

        return { groups: mapGroups, volume: vol, sets: totalSets, duration: totalDuration, focus: headerFocus };
    }, [workouts, isLoading, userCatalog]);

    const summaryOffsetY = useMemo(() => {
        const lowerBody = ['Quadríceps', 'Posterior', 'Panturrilha'];
        if (lowerBody.includes(muscleStats.focus)) return -30;
        if (['Abdômen', 'Geral', 'Cardio'].includes(muscleStats.focus)) return 0;
        return 15;
    }, [muscleStats.focus]);

    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    const secondaryTags = muscleStats.groups.filter(g => g !== muscleStats.focus);
    const maxTagsToShow = 2;
    const isLongTitle = muscleStats.focus.length > 14;

    return (
        <div className="relative pb-24 w-full min-h-screen">
            {/* Sentinel for Sticky Detection - placed absolutely just above where sticky happens */}
            <div ref={sentinelRef} className="absolute top-0 left-0 right-0 h-px -translate-y-full pointer-events-none opacity-0" />

            {/* STICKY HEADER */}
            <div className={`sticky top-0 z-[100] -mx-4 px-4 mb-6 flex items-center justify-between transition-all duration-300 ease-in-out ${
                isStuck 
                ? 'pt-6 pb-4 bg-fundo/95 backdrop-blur-md border-b border-zinc-800/50 shadow-2xl shadow-black/40' 
                : 'pt-2 pb-2 bg-transparent border-b border-transparent shadow-none'
            }`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white"><ChevronLeft size={20}/></button>
                    <div className="min-w-[70px]">
                        <h2 className="font-display font-black text-lg leading-none">{isToday ? 'HOJE' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                    </div>
                    <button onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))} disabled={isToday} className="p-2 hover:bg-zinc-800 rounded-full transition disabled:opacity-10 text-zinc-400 hover:text-white"><ChevronRight size={20}/></button>
                </div>
                
                {/* 
                    UPDATED HEADER ACTIONS
                    - Replaced the small '+' button with a large 'Adicionar' pill button.
                    - Adjusted spacing and sizing for better touch targets and visual balance.
                */}
                <div className="flex items-center gap-3 shrink-0">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRoutineMode('LOAD')}
                        className="bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 h-12 w-12 flex items-center justify-center rounded-2xl border border-zinc-700/50 backdrop-blur-sm transition-colors"
                        title="Minhas Rotinas"
                    >
                        <Bookmark size={20} />
                    </motion.button>

                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setEditingWorkout(undefined); setIsModalOpen(true); }}
                        className="bg-gradient-to-br from-destaque to-red-800 text-white h-12 px-6 rounded-2xl shadow-[0_0_16px_rgba(220,38,38,0.4)] hover:shadow-[0_0_24px_rgba(220,38,38,0.6)] border border-white/10 flex items-center gap-2 group"
                    >
                        <Plus size={20} strokeWidth={3} className="group-active:scale-90 transition-transform" />
                        <span className="font-bold text-sm uppercase tracking-wider hidden sm:inline">Adicionar</span>
                        <span className="font-bold text-sm uppercase tracking-wider sm:hidden">Novo</span>
                    </motion.button>
                </div>
            </div>

            {/* Immersive Muscle Stats Card */}
            <div className="mb-8">
                <motion.div 
                    onClick={() => setIsMapExpanded(!isMapExpanded)}
                    initial={false}
                    animate={{ height: isMapExpanded ? 448 : 'auto' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative overflow-hidden rounded-[2.5rem] border border-zinc-800 shadow-2xl bg-zinc-950"
                >
                    {/* Background Radial Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-destaque/10 via-zinc-950/60 to-zinc-950 pointer-events-none" />

                    {/* Header Section */}
                    <div className="relative z-20 flex justify-between items-start p-5 shrink-0">
                        <div className="flex-1 min-w-0 mr-2">
                            {/* SWAPPED ORDER: Icon first, Text second */}
                            <div className="flex items-center gap-2 mb-1 opacity-70">
                                <TrendingUp size={14} className="text-destaque" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">Resumo do Dia</span>
                            </div>
                            
                            <motion.h3 
                                layout
                                className={`font-display font-black text-white uppercase tracking-tight drop-shadow-lg leading-none ${isLongTitle ? 'text-xl' : 'text-3xl'}`}
                            >
                                {muscleStats.focus}
                            </motion.h3>
                        </div>

                        <motion.div 
                            animate={{ rotate: isMapExpanded ? 180 : 0 }} 
                            className="text-zinc-400 bg-black/20 backdrop-blur-md p-2 rounded-full border border-white/5 shrink-0"
                        >
                            <ChevronDown size={20} />
                        </motion.div>
                    </div>

                    {/* Centralized SVG Map (Expanded Only) */}
                    <AnimatePresence>
                        {isMapExpanded && (
                            <>
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                                >
                                    {/* Scale 0.85 reduces zoom as requested */}
                                    <div className="w-full h-full pb-16 pt-8 px-8 scale-[0.85]">
                                        <MuscleMap 
                                            activeMuscles={muscleStats.groups} 
                                            disableZoom={false} 
                                            offsetY={summaryOffsetY} 
                                            enableAnimation={true} 
                                        />
                                    </div>
                                    
                                    {/* Bottom Overlay Gradient for Readability */}
                                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none" />
                                </motion.div>

                                {/* Minimalist Overlay Metrics (Expanded Only) */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-6"
                                >
                                    {/* Active Muscle Tags */}
                                    {secondaryTags.length > 0 && (
                                        <div className="flex flex-nowrap justify-center items-center gap-2 mb-4 opacity-90 overflow-hidden px-2">
                                            {secondaryTags.slice(0, maxTagsToShow).map(g => (
                                                <span key={g} className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 shadow-lg whitespace-nowrap">
                                                    {g}
                                                </span>
                                            ))}
                                            {secondaryTags.length > maxTagsToShow && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 whitespace-nowrap shrink-0">
                                                    +{secondaryTags.length - maxTagsToShow}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Refined Stats Design - Clean & Minimal */}
                                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex justify-between items-center relative">
                                        
                                        {/* Volume */}
                                        <div className="flex-1 flex flex-col items-center justify-center border-r border-white/10">
                                            <div className="flex items-end gap-0.5">
                                                <span className="text-2xl font-display font-black text-white leading-none tracking-tight">
                                                    {isLoading ? '-' : (muscleStats.volume / 1000).toFixed(1)}
                                                </span>
                                                <span className="text-xs font-bold text-zinc-500 mb-0.5">k</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
                                                <Weight size={10} className="text-destaque" />
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Kg Total</span>
                                            </div>
                                        </div>

                                        {/* Sets */}
                                        <div className="flex-1 flex flex-col items-center justify-center border-r border-white/10">
                                            <span className="text-2xl font-display font-black text-white leading-none tracking-tight">
                                                {isLoading ? '-' : muscleStats.sets}
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
                                                <Layers size={10} className="text-destaque" />
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Séries</span>
                                            </div>
                                        </div>

                                        {/* Cardio */}
                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            <div className="flex items-end gap-0.5">
                                                <span className="text-2xl font-display font-black text-white leading-none tracking-tight">
                                                    {isLoading ? '-' : muscleStats.duration}
                                                </span>
                                                <span className="text-xs font-bold text-zinc-500 mb-0.5">min</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
                                                <Timer size={10} className="text-destaque" />
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Cardio</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <div className="space-y-1">
                {/* Header Section com Layout Simétrico */}
                <div className="flex flex-col items-center justify-center px-2 mb-6 mt-4 gap-3">
                    <div className="flex items-center justify-center w-full">
                        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent flex-1" />
                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] px-4 text-center">Timeline de Treino</h4>
                        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent flex-1" />
                    </div>
                    
                    {!isLoading && workouts.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3"
                        >
                            <button 
                                onClick={() => setRoutineMode('SAVE')}
                                className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-white transition-all uppercase tracking-widest px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600 active:scale-95"
                            >
                                <Save size={12} />
                                Salvar Dia
                            </button>
                            <button 
                                onClick={() => setShowDeleteAllModal(true)} 
                                className="flex items-center gap-2 text-[10px] font-bold text-red-800 hover:text-red-500 transition-all uppercase tracking-widest px-4 py-2 rounded-full bg-red-950/10 border border-red-900/20 hover:bg-red-950/30 hover:border-red-500/30 active:scale-95"
                            >
                                <Trash2 size={12} />
                                Limpar
                            </button>
                        </motion.div>
                    )}
                </div>
                
                {isLoading ? (
                    <div className="space-y-3">
                        <WorkoutSkeleton />
                        <WorkoutSkeleton />
                        <WorkoutSkeleton />
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {workouts.length === 0 ? (
                            <motion.button 
                                layout
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsModalOpen(true)} 
                                className="w-full py-16 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-900/20 group hover:border-destaque/40 transition-all"
                            >
                                <Dumbbell size={32} className="mx-auto mb-4 text-zinc-600 group-hover:text-destaque transition-colors" />
                                <p className="text-zinc-400 text-sm font-black uppercase tracking-widest">Nenhum exercício registrado</p>
                            </motion.button>
                        ) : (
                            workouts.map((w) => (
                                <motion.div 
                                    layout
                                    key={w.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                >
                                    <ExerciseCard 
                                        workout={w} 
                                        userCatalog={userCatalog}
                                        onEdit={() => { setEditingWorkout(w); setIsModalOpen(true); }}
                                        onDelete={() => handleDelete(w.id)}
                                    />
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                )}
                
                {!isLoading && workouts.length > 0 && (
                    <div className="w-full text-center mt-6 pb-6">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                            Deslize para a esquerda para excluir • Clique para editar
                        </p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <WorkoutModal 
                    onClose={() => { setIsModalOpen(false); setEditingWorkout(undefined); }} 
                    onSave={handleSave} 
                    initialData={editingWorkout}
                    date={dateStr}
                    user={user} 
                />
            )}

            {/* Routine Manager Modal */}
            <AnimatePresence>
                {routineMode && (
                    <RoutineManager 
                        mode={routineMode}
                        user={user}
                        currentWorkouts={workouts}
                        onClose={() => setRoutineMode(null)}
                        onLoadRoutine={handleLoadRoutine}
                    />
                )}
            </AnimatePresence>

            {/* Confirm Delete All Modal */}
            <AnimatePresence>
                {showDeleteAllModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
                        >
                            {/* Glow Effect */}
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="flex flex-col items-center text-center gap-4 relative z-10">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2 border border-red-500/20">
                                    <Trash2 size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-display font-bold text-white mb-2 uppercase">Limpar dia?</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        Isso removerá <strong>{workouts.length}</strong> exercícios registrados em <strong>{date.toLocaleDateString('pt-BR')}</strong>.
                                    </p>
                                    <div className="mt-3 flex items-center justify-center gap-2 text-red-400 text-xs font-bold bg-red-950/30 py-2 px-3 rounded-lg border border-red-900/30">
                                        <AlertTriangle size={14} />
                                        Essa ação não pode ser desfeita.
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 w-full mt-4">
                                    <button 
                                        onClick={() => setShowDeleteAllModal(false)}
                                        disabled={isDeletingLoading}
                                        className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl font-bold text-sm transition-colors outline-none"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={confirmDeleteAll}
                                        disabled={isDeletingLoading}
                                        className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 outline-none active:scale-95"
                                    >
                                        {isDeletingLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm Overwrite Modal */}
            <AnimatePresence>
                {showOverwriteModal && pendingTemplate && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
                        >
                            {/* Glow Effect */}
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="flex flex-col items-center text-center gap-4 relative z-10">
                                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-2 border border-amber-500/20">
                                    <RefreshCw size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-display font-bold text-white mb-2 uppercase">Sobrescrever Treino?</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        Você já tem <strong>{workouts.length}</strong> exercícios registrados hoje. 
                                        Carregar a rotina <strong>"{pendingTemplate.name}"</strong> irá <span className="text-amber-500 font-bold">substituir</span> o treino atual.
                                    </p>
                                    <div className="mt-3 flex items-center justify-center gap-2 text-amber-400 text-xs font-bold bg-amber-950/30 py-2 px-3 rounded-lg border border-amber-900/30">
                                        <AlertTriangle size={14} />
                                        O treino atual será perdido.
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 w-full mt-4">
                                    <button 
                                        onClick={() => {
                                            setShowOverwriteModal(false);
                                            setPendingTemplate(null);
                                        }}
                                        className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl font-bold text-sm transition-colors outline-none"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={() => pendingTemplate && applyRoutine(pendingTemplate)}
                                        className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 outline-none active:scale-95"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Substituir'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkoutsTab;
