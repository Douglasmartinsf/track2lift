
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Workout, UserProfile, WorkoutTemplate } from '../../types';
import { identifyMuscleGroup, getExerciseCatalog } from '../../services/workoutService';
import MuscleMap from '../../components/MuscleMap';
import { Plus, ChevronLeft, ChevronRight, Edit2, Trash2, Dumbbell, TrendingUp, ChevronDown, X, Check, Loader2, AlertTriangle, Layers, Timer, Weight, Bookmark, Save, RefreshCw, PenTool } from 'lucide-react';
import WorkoutModal from '../../components/modals/WorkoutModal';
import RoutineManager from '../../components/modals/RoutineManager';
import { motion, AnimatePresence } from 'framer-motion';

const ExerciseCard = ({ workout, onEdit, onDelete, onLongPress, userCatalog }: { workout: Workout, onEdit: () => void, onDelete?: () => void, onLongPress?: () => void, userCatalog: Record<string, string[]> }) => {
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

    // Long-press handling
    const timerRef = useRef<number | null>(null);
    const intervalRef = useRef<number | null>(null);
    const [pressProgress, setPressProgress] = useState(0);
    const [longPressed, setLongPressed] = useState(false);

    const LONG_PRESS_MS = 600;

    const PROG_R = 18; // SVG circle radius used for progress indicator (match avatar outer radius)
    const PROG_CIRC = 2 * Math.PI * PROG_R;
    const clearPress = () => {
        if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
        if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null; }
        setPressProgress(0);
    }

    const startPress = () => {
        setLongPressed(false);
        const start = Date.now();
        intervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - start;
            const progress = Math.min(100, Math.round((elapsed / LONG_PRESS_MS) * 100));
            setPressProgress(progress);
        }, 50);

        timerRef.current = window.setTimeout(() => {
            setLongPressed(true);
            clearPress();
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) (navigator as any).vibrate?.(30);
            if (onLongPress) onLongPress();
        }, LONG_PRESS_MS);
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        if (longPressed) {
            // consumed by long-press
            setLongPressed(false);
            clearPress();
            return;
        }
        clearPress();
        onEdit();
    }

    const handlePointerLeave = () => {
        clearPress();
    }

    return (
        <motion.div layout className="relative overflow-hidden rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-white/5 mb-3 touch-pan-y flex items-center gap-3 p-3 cursor-pointer select-none" onPointerDown={startPress} onPointerUp={handlePointerUp} onPointerCancel={clearPress} onPointerLeave={handlePointerLeave} whileTap={{ scale: 0.995 }}
            animate={pressProgress > 0 && pressProgress < 100 ? { x: [0, -1, 1, -1, 1, 0] } : { x: 0 }}
            transition={pressProgress > 0 && pressProgress < 100 ? { duration: 0.2, repeat: Infinity, repeatType: 'loop' } : {}}
        >
                <div className="w-14 h-14 bg-zinc-950 rounded-full border border-zinc-800 shadow-[0_6px_18px_rgba(0,0,0,0.4)] relative shrink-0 overflow-visible flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-black to-red-950/20 opacity-40" />
                    <div className="relative w-full h-full p-1 flex items-center justify-center">
                        <MuscleMap activeMuscles={muscleGroup ? [muscleGroup] : []} offsetY={yOffset} />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 rounded-full overflow-hidden relative flex items-center justify-center">
                                <svg className="w-full h-full" viewBox="0 0 40 40" aria-hidden>
                                    <circle cx="20" cy="20" r="18" strokeWidth="2.5" stroke="rgba(255,255,255,0.06)" fill="none" />
                                    <circle cx="20" cy="20" r="18" strokeWidth="2.5" stroke="#ef4444" fill="none"
                                        strokeDasharray={`${PROG_CIRC}`}
                                        strokeDashoffset={`${PROG_CIRC * (1 - pressProgress / 100)}`}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dashoffset 50ms linear', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 rounded-full bg-red-600" style={{ opacity: Math.min(0.6, pressProgress / 160) }} />
                                <Trash2 size={18} className="text-white relative" style={{ opacity: Math.min(1, pressProgress / 100) }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h5 className="flex-1 min-w-0 font-display font-black text-base text-white truncate tracking-tight mb-1">
                        {workout.exercises[0]?.name || workout.name}
                    </h5>

                    <div className="flex items-center gap-2">
                        <div className="shrink-0 flex items-center gap-1 border border-zinc-800 px-2 py-0.5 rounded-md">
                            <Layers size={10} className="text-zinc-400" />
                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">
                                {workout.exercises[0]?.sets.length} séries
                            </span>
                        </div>

                            <div className="min-w-0 flex items-center gap-1 border border-zinc-800 px-2 py-0.5 rounded-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-destaque shrink-0" />
                                <span className="flex-1 min-w-0 text-[10px] font-bold text-zinc-300 uppercase tracking-wide truncate">
                                    {muscleGroup || 'Geral'}
                                </span>
                            </div>
                    </div>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"><ChevronRight size={18} /></div>
            </motion.div>
    );
};

const WorkoutSkeleton = () => (
    <div className="relative rounded-[2rem] bg-zinc-900/40 border border-white/5 p-5 mb-3 flex items-center gap-4 h-[100px]">
        <div className="w-14 h-14 bg-zinc-800 rounded-full animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-zinc-800 rounded animate-pulse" />
            <div className="flex gap-2">
                <div className="h-4 w-16 bg-zinc-800/60 rounded animate-pulse" />
                <div className="h-4 w-20 bg-zinc-800/60 rounded animate-pulse" />
            </div>
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
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [isDeletingLoading, setIsDeletingLoading] = useState(false);
    const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);
    const [isDeletingSingleLoading, setIsDeletingSingleLoading] = useState(false);
    const [showOverwriteModal, setShowOverwriteModal] = useState(false);
    const [pendingTemplate, setPendingTemplate] = useState<WorkoutTemplate | null>(null);
    const [routineMode, setRoutineMode] = useState<'SAVE' | 'LOAD' | null>(null);
    const [activeRoutineName, setActiveRoutineName] = useState<string | null>(null);
    const [isRoutineModified, setIsRoutineModified] = useState(false);
    const [isStuck, setIsStuck] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const userCatalog = useMemo(() => getExerciseCatalog(user), [user]);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            // Detect if sentinel exited past the top of the visible scroll area
            setIsStuck(entry.boundingClientRect.top < 0);
        }, { threshold: [0], rootMargin: '0px 0px 0px 0px' });

        if (sentinelRef.current) observer.observe(sentinelRef.current);
        return () => { if (sentinelRef.current) observer.unobserve(sentinelRef.current); };
    }, []);

    const dateStr = date.toISOString().split('T')[0];

    const fetchWorkouts = async () => {
        setIsLoading(true);
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

    useEffect(() => { 
        fetchWorkouts();
        setActiveRoutineName(null); 
        setIsRoutineModified(false);
    }, [dateStr]);

    useEffect(() => {
        const checkRoutineContext = async () => {
            if (workouts.length === 0) {
                setActiveRoutineName(null);
                setIsRoutineModified(false);
                return;
            }

            const taggedRoutineName = workouts.find(w => w.source_routine_name)?.source_routine_name;

            if (taggedRoutineName) {
                setActiveRoutineName(taggedRoutineName);
                try {
                    const { data: templates } = await supabase
                        .from('workout_templates')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('name', taggedRoutineName)
                        .limit(1);

                    if (templates && templates.length > 0) {
                        const template = templates[0];
                        const currentNames = workouts.map(w => w.name || (w.exercises[0] ? w.exercises[0].name : '')).join('|');
                        const templateNames = template.data.map(w => w.name || (w.exercises[0] ? w.exercises[0].name : '')).join('|');
                        setIsRoutineModified(currentNames !== templateNames);
                    }
                } catch (e) {
                    console.error("Error verifying modification", e);
                }
            } else {
                try {
                    const { data: templates } = await supabase
                        .from('workout_templates')
                        .select('*')
                        .eq('user_id', user.id);

                    if (templates) {
                        const currentNames = workouts.map(w => w.name || (w.exercises[0] ? w.exercises[0].name : '')).join('|');
                        const exactMatch = templates.find(t => {
                            if (!t.data || t.data.length !== workouts.length) return false;
                            const templateNames = t.data.map(w => w.name || (w.exercises[0] ? w.exercises[0].name : '')).join('|');
                            return currentNames === templateNames;
                        });
                        setActiveRoutineName(exactMatch ? exactMatch.name : null);
                        setIsRoutineModified(false);
                    }
                } catch (err) {
                    console.error("Error matching routine", err);
                }
            }
        };

        if (workouts.length > 0) {
            checkRoutineContext();
        }
    }, [workouts, user.id]);

    const handleSave = async (workout: Partial<Workout>) => {
        const payload: any = { ...workout, user_id: user.id, date: dateStr };
        if (activeRoutineName) {
            payload.source_routine_name = activeRoutineName;
        }

        if (editingWorkout) {
            await supabase.from('workouts').update(workout).eq('id', editingWorkout.id);
        } else {
            await supabase.from('workouts').insert([payload]);
        }
        setIsModalOpen(false);
        setEditingWorkout(undefined);
        fetchWorkouts();
    };

    const handleDelete = async (id: string) => {
        await supabase.from('workouts').delete().eq('id', id);
        fetchWorkouts();
    };

    const handleConfirmSingleDelete = async () => {
        if (!workoutToDelete) return;
        setIsDeletingSingleLoading(true);
        try {
            await supabase.from('workouts').delete().eq('id', workoutToDelete.id);
            setWorkoutToDelete(null);
            await fetchWorkouts();
        } catch (err) {
            console.error('Error deleting workout', err);
        } finally {
            setIsDeletingSingleLoading(false);
        }
    };

    const confirmDeleteAll = async () => {
        if (workouts.length === 0) return;
        setIsDeletingLoading(true);
        try {
            const idsToDelete = workouts.map(w => w.id);
            await supabase.from('workouts').delete().in('id', idsToDelete);
            setWorkouts([]); 
            setActiveRoutineName(null);
            setIsRoutineModified(false);
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
            if (workouts.length > 0) {
                const idsToDelete = workouts.map(w => w.id);
                await supabase.from('workouts').delete().in('id', idsToDelete);
                setWorkouts([]);
            }

            const newWorkouts = template.data.map(w => ({
                user_id: user.id,
                date: dateStr,
                name: w.name,
                exercises: w.exercises,
                source_routine_name: template.name
            }));

            await supabase.from('workouts').insert(newWorkouts);
            setActiveRoutineName(template.name);
            setIsRoutineModified(false);
            await fetchWorkouts();
        } catch (err) {
            console.error("Error loading routine", err);
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
        if (isLoading) return { groups: [], volume: 0, sets: 0, duration: 0, focus: null };
        if (!workouts.length) return { groups: [], volume: 0, sets: 0, duration: 0, focus: 'Descanso' };

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
                if (ex.type === 'cardio') totalDuration += s.duration || 0;
                else vol += (s.reps || 0) * (s.weight || 0);
            });
        }));
        
        const sortedGroups = Array.from(groupsMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
        
        let headerFocus = sortedGroups[0] || 'Geral';
        if (headerFocus === 'Cardio' && sortedGroups.length > 1) headerFocus = sortedGroups[1];
        let mapGroups = sortedGroups;
        if (sortedGroups.length > 1 && sortedGroups.includes('Cardio')) mapGroups = sortedGroups.filter(g => g !== 'Cardio');

        return { groups: mapGroups, volume: vol, sets: totalSets, duration: totalDuration, focus: headerFocus };
    }, [workouts, isLoading, userCatalog]);

    const summaryOffsetY = useMemo(() => {
        if (!muscleStats.focus) return 0;
        const lowerBody = ['Quadríceps', 'Posterior', 'Panturrilha'];
        if (lowerBody.includes(muscleStats.focus)) return -30;
        if (['Abdômen', 'Geral', 'Cardio', 'Descanso'].includes(muscleStats.focus)) return 0;
        return 15;
    }, [muscleStats.focus]);

    const isFocusedView = useMemo(() => muscleStats.focus && !['Geral', 'Cardio', 'Descanso'].includes(muscleStats.focus), [muscleStats.focus]);
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    const secondaryTags = useMemo(() => activeRoutineName ? muscleStats.groups : muscleStats.groups.filter(g => g !== muscleStats.focus), [activeRoutineName, muscleStats.groups, muscleStats.focus]);
    
    // Truncate logic
    const displayTitle = activeRoutineName || muscleStats.focus || '';
    const truncatedTitle = displayTitle.length > 15 ? displayTitle.slice(0, 15) + '...' : displayTitle;
    const isLongTitle = truncatedTitle.length > 10;

    const backgroundGradient = useMemo(() => {
        if (!isMapExpanded) return 'linear-gradient(to right, rgba(220, 38, 38, 0.2) 0%, rgba(9, 9, 11, 0) 60%)';
        return isFocusedView 
            ? 'radial-gradient(circle at center, rgba(220, 38, 38, 0.25) 0%, rgba(9, 9, 11, 0.4) 70%, #09090b 100%)' 
            : 'radial-gradient(circle at center, rgba(220, 38, 38, 0.1) 0%, rgba(9, 9, 11, 0.6) 30%, #09090b 100%)';
    }, [isMapExpanded, isFocusedView]);

    return (
        <div className="relative pb-24 w-full min-h-screen px-4">
            <div ref={sentinelRef} className="absolute top-0 left-0 right-0 h-px pointer-events-none opacity-0" />

            <div className={`sticky top-0 z-[100] -mx-4 px-4 flex items-center justify-between gap-3 transition-all duration-300 ease-in-out ${
                isStuck 
                ? 'pt-6 pb-4 bg-zinc-950 shadow-2xl border-b border-zinc-800' 
                : 'pt-2 pb-2 bg-transparent border-b border-transparent'
            }`}>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <button onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white"><ChevronLeft size={18}/></button>
                        <div className="min-w-[65px] text-center">
                            <h2 className="font-display font-black text-base sm:text-lg leading-none">{isToday ? 'HOJE' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</h2>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                        </div>
                        <button onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))} disabled={isToday} className="p-2 hover:bg-zinc-800 rounded-full transition disabled:opacity-10 text-zinc-400 hover:text-white"><ChevronRight size={18}/></button>
                    </div>
                
                    <div className="flex items-center gap-2 shrink-0">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRoutineMode('LOAD')}
                            aria-label="Carregar rotina"
                            className="bg-zinc-800/50 text-zinc-300 h-12 min-w-[48px] px-3 sm:px-4 flex items-center justify-center rounded-xl border border-zinc-700/50 shrink-0"
                        >
                            <Bookmark size={18} />
                        </motion.button>

                        <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setEditingWorkout(undefined); setIsModalOpen(true); }}
                            aria-label="Adicionar exercício"
                            className="bg-gradient-to-br from-destaque to-red-800 text-white h-12 min-w-[48px] px-3 sm:px-6 rounded-xl shadow-lg border border-white/10 flex items-center gap-2 justify-center shrink-0"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span className="font-bold text-xs sm:text-sm uppercase tracking-wider hidden sm:inline">Adicionar</span>
                        </motion.button>
                    </div>
                </div>

            <div className="mb-8">
                <motion.div 
                    onClick={() => setIsMapExpanded(!isMapExpanded)}
                    initial={false}
                    animate={{ height: isMapExpanded ? 500 : 84 }}
                    style={{ overflow: 'hidden' }}
                    transition={{ type: "spring", stiffness: 170, damping: 26, mass: 1 }}
                    className="relative rounded-[2.5rem] border border-zinc-800 shadow-2xl bg-zinc-950 cursor-pointer"
                >
                    <motion.div 
                        initial={false}
                        animate={{ background: backgroundGradient }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 pointer-events-none" 
                    />

                    <div className="relative z-20 flex justify-between items-start p-5 shrink-0 h-[84px]">
                        <div className="flex-1 min-w-0 mr-2">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <TrendingUp size={12} className="text-destaque" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                                        Resumo do Dia
                                    </span>
                                </div>
                            </div>
                            
                            {isLoading || !muscleStats.focus ? (
                                <div className="h-8 w-40 bg-zinc-800/60 rounded animate-pulse mt-1" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <h3 className={`font-display font-black text-white uppercase tracking-tight drop-shadow-lg leading-none ${isLongTitle ? 'text-2xl' : 'text-3xl'}`}>
                                        {truncatedTitle}
                                    </h3>
                                    <AnimatePresence>
                                        {/* Only show 'Edited' badge if routine is modified AND map is collapsed (card is closed) */}
                                        {isRoutineModified && !isMapExpanded && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.8, x: -5 }}
                                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.8, x: -5 }}
                                                className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-full"
                                            >
                                                <PenTool size={10} className="text-amber-500" />
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">Editado</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        <motion.div 
                            animate={{ rotate: isMapExpanded ? 180 : 0 }} 
                            className="text-zinc-400 bg-black/20 backdrop-blur-md p-2 rounded-full border border-white/5 shrink-0"
                        >
                            <ChevronDown size={20} />
                        </motion.div>
                    </div>

                    <AnimatePresence>
                        {isMapExpanded && !isLoading && (
                            <>
                                <motion.div 
                                    key="map-container"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.4 } }}
                                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                                >
                                    <div className={`w-full h-full pb-16 pt-8 px-8 transition-transform duration-500 ${muscleStats.focus === 'Descanso' ? 'scale-[1.15]' : 'scale-[0.85]'}`}>
                                        <MuscleMap activeMuscles={muscleStats.groups} disableZoom={false} offsetY={summaryOffsetY} enableAnimation={true} />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none" />
                                </motion.div>

                                <motion.div 
                                    key="stats-overlay"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.4 } }}
                                    exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
                                    className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-6"
                                >
                                    {secondaryTags.length > 0 && (
                                        <div className="flex flex-nowrap justify-center items-center gap-2 mb-4 opacity-90 overflow-hidden px-2">
                                            {secondaryTags.slice(0, 2).map(g => (
                                                <span key={g} className="text-[9px] font-bold uppercase tracking-widest text-zinc-300 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 shadow-lg whitespace-nowrap">
                                                    {g}
                                                </span>
                                            ))}
                                            {secondaryTags.length > 2 && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 whitespace-nowrap shrink-0">
                                                    +{secondaryTags.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex justify-between items-center relative">
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

                                        <div className="flex-1 flex flex-col items-center justify-center border-r border-white/10">
                                            <span className="text-2xl font-display font-black text-white leading-none tracking-tight">
                                                {isLoading ? '-' : muscleStats.sets}
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-1.5 opacity-80">
                                                <Layers size={10} className="text-destaque" />
                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Séries</span>
                                            </div>
                                        </div>

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
                            <button onClick={() => setRoutineMode('SAVE')} className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-white transition-all uppercase tracking-widest px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 active:scale-95">
                                <Save size={12} /> Salvar Dia
                            </button>
                            <button onClick={() => setShowDeleteAllModal(true)} className="flex items-center gap-2 text-[10px] font-bold text-red-800 hover:text-red-500 transition-all uppercase tracking-widest px-4 py-2 rounded-full bg-red-950/10 border border-red-900/20 hover:bg-red-950/30 active:scale-95">
                                <Trash2 size={12} /> Limpar
                            </button>
                        </motion.div>
                    )}
                </div>
                
                {isLoading ? (
                    <div className="space-y-3">
                        <WorkoutSkeleton /><WorkoutSkeleton /><WorkoutSkeleton />
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {workouts.length === 0 ? (
                            <motion.button layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(true)} className="w-full py-16 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem] bg-zinc-900/20 group hover:border-destaque/40 transition-all">
                                <Dumbbell size={32} className="mx-auto mb-4 text-zinc-600 group-hover:text-destaque" />
                                <p className="text-zinc-400 text-sm font-black uppercase tracking-widest">Nenhum exercício registrado</p>
                            </motion.button>
                        ) : (
                            workouts.map((w) => (
                                <motion.div layout key={w.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 500, damping: 35 }}>
                                    <ExerciseCard workout={w} userCatalog={userCatalog} onEdit={() => { setEditingWorkout(w); setIsModalOpen(true); }} onDelete={() => setWorkoutToDelete(w)} onLongPress={() => setWorkoutToDelete(w)} />
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                )}
            </div>

            {isModalOpen && <WorkoutModal onClose={() => { setIsModalOpen(false); setEditingWorkout(undefined); }} onSave={handleSave} initialData={editingWorkout} date={dateStr} user={user} />}
            <AnimatePresence>{routineMode && <RoutineManager mode={routineMode} user={user} currentWorkouts={workouts} onClose={() => setRoutineMode(null)} onLoadRoutine={handleLoadRoutine} onRoutineSaved={fetchWorkouts} />}</AnimatePresence>
            <AnimatePresence>{workoutToDelete && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col items-center text-center gap-4 relative z-10">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2 border border-red-500/20"><Trash2 size={28} /></div>
                            <div><h3 className="text-xl font-display font-bold text-white mb-2 uppercase">Excluir Exercício?</h3><p className="text-sm text-zinc-400">Deseja remover "{workoutToDelete?.exercises[0]?.name}"?</p></div>
                            <div className="flex gap-3 w-full mt-4">
                                <button onClick={() => setWorkoutToDelete(null)} className="flex-1 py-3.5 bg-zinc-800 text-zinc-300 rounded-xl font-bold">Cancelar</button>
                                <button onClick={handleConfirmSingleDelete} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold">{isDeletingSingleLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar'}</button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}</AnimatePresence>
            <AnimatePresence>{showDeleteAllModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col items-center text-center gap-4 relative z-10">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2 border border-red-500/20"><Trash2 size={28} /></div>
                            <div><h3 className="text-xl font-display font-bold text-white mb-2 uppercase">Limpar dia?</h3><p className="text-sm text-zinc-400">Isso removerá {workouts.length} exercícios.</p></div>
                            <div className="flex gap-3 w-full mt-4">
                                <button onClick={() => setShowDeleteAllModal(false)} className="flex-1 py-3.5 bg-zinc-800 text-zinc-300 rounded-xl font-bold">Cancelar</button>
                                <button onClick={confirmDeleteAll} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold">{isDeletingLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar'}</button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}</AnimatePresence>
            <AnimatePresence>{showOverwriteModal && pendingTemplate && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500"><RefreshCw size={28} /></div>
                            <h3 className="text-xl font-display font-bold text-white uppercase">Sobrescrever Treino?</h3>
                            <p className="text-sm text-zinc-400">Isso substituirá o treino atual pela rotina <strong>"{pendingTemplate.name}"</strong>.</p>
                            <div className="flex gap-3 w-full mt-4">
                                <button onClick={() => { setShowOverwriteModal(false); setPendingTemplate(null); }} className="flex-1 py-3.5 bg-zinc-800 text-zinc-300 rounded-xl font-bold">Cancelar</button>
                                <button onClick={() => pendingTemplate && applyRoutine(pendingTemplate)} className="flex-1 py-3.5 bg-amber-600 text-white rounded-xl font-bold">Substituir</button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}</AnimatePresence>
        </div>
    );
};

export default WorkoutsTab;
