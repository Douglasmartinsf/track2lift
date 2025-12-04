import { supabase } from '../lib/supabaseClient.js';
import { EXERCISE_CATALOG, ORIGINAL_EXERCISE_CATALOG, identifyMuscleGroup } from '../lib/exercises.js';
import { showToast, showConfirmDialog } from '../lib/ui-utils.js';

// Mapeamento de grupos musculares para IDs do SVG
const MUSCLE_SVG_MAP = {
    'Peito': ['Peito'],
    'Costas': ['Costas'],
    'Deltoide Anterior': ['Deltoide-anterior-lateral'],
    'Deltoide Lateral': ['Deltoide-anterior-lateral', 'Deltoide-lateral'],
    'Deltoide Posterior': ['Deltoide-posterior'],
    'Bíceps': ['Biceps'],
    'Tríceps': ['Triceps'],
    'Antebraço': ['Antebraço'],
    'Quadríceps': ['Quadriceps'],
    'Posterior': ['Posterior'],
    'Panturrilha': ['Panturrilha'],
    'Abdômen': ['Abdomen']
};

// Módulo de treino: gerencia blocos de exercício, séries e persistência
let exerciseCounter = 0;
let editingWorkoutId = null;
// Estado do modal de edição de exercício
let currentEditingWorkout = null;
let currentExerciseIndex = -1;
// Tipo atualmente exibido no modal (strength|cardio)
let modalCurrentType = 'strength';
// Estado de navegação de data para a lista de treinos
let viewDate = new Date();

// ==================== FUNÇÕES DE PERSISTÊNCIA DE EXERCÍCIOS CUSTOMIZADOS ====================

// Carregar exercícios customizados do Supabase
async function loadCustomExercises() {
    try {
        const userResp = await supabase.auth.getUser();
        const currentUser = userResp?.data?.user;
        if (!currentUser) return;

        const { data, error } = await supabase
            .from('custom_exercises')
            .select('muscle_group, exercise_name')
            .eq('user_id', currentUser.id);

        if (error) {
            console.error('Erro ao carregar exercícios customizados:', error);
            return;
        }

        if (data && data.length > 0) {
            data.forEach(item => {
                const group = item.muscle_group;
                const exerciseName = item.exercise_name;

                EXERCISE_CATALOG[group] = EXERCISE_CATALOG[group] || [];
                if (!EXERCISE_CATALOG[group].includes(exerciseName)) {
                    EXERCISE_CATALOG[group].push(exerciseName);
                }
            });
        }
    } catch (err) {
        console.error('Erro ao carregar exercícios customizados:', err);
    }
}

// Salvar exercício customizado no Supabase
async function saveCustomExerciseToSupabase(muscleGroup, exerciseName) {
    try {
        const userResp = await supabase.auth.getUser();
        const currentUser = userResp?.data?.user;
        if (!currentUser) {
            console.error('Usuário não autenticado');
            return false;
        }

        const { error } = await supabase
            .from('custom_exercises')
            .insert([{
                user_id: currentUser.id,
                muscle_group: muscleGroup,
                exercise_name: exerciseName
            }]);

        if (error) {
            // Ignora erro de duplicata (constraint UNIQUE)
            if (error.code === '23505') {
                return true; // Já existe, considera como sucesso
            }
            console.error('Erro ao salvar exercício customizado:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Erro ao salvar exercício customizado:', err);
        return false;
    }
}

// Deletar exercício customizado do Supabase
async function deleteCustomExerciseFromSupabase(muscleGroup, exerciseName) {
    try {
        const userResp = await supabase.auth.getUser();
        const currentUser = userResp?.data?.user;
        if (!currentUser) {
            console.error('Usuário não autenticado');
            return false;
        }

        const { error } = await supabase
            .from('custom_exercises')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('muscle_group', muscleGroup)
            .eq('exercise_name', exerciseName);

        if (error) {
            console.error('Erro ao deletar exercício customizado:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Erro ao deletar exercício customizado:', err);
        return false;
    }
}

// Helper para obter grupo muscular de um exercício (considera muscleGroup armazenado)
function getExerciseMuscleGroup(exercise) {
    // Se o exercício tem muscleGroup armazenado (customizados não salvos), usa ele
    if (exercise.muscleGroup) {
        return { group: exercise.muscleGroup, exactMatch: true };
    }
    // Caso contrário, tenta identificar pelo nome
    return identifyMuscleGroup(exercise.name);
}

function getFormattedDateString(date) {
    if (!date || !(date instanceof Date)) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function updateWorkoutDateDisplay() {
    try {
        const elDate = document.getElementById('currentWorkoutDateDisplay');
        const elWeek = document.getElementById('currentWorkoutWeekDay');
        if (!elDate && !elWeek) return;
        const now = new Date();
        const isToday = now.getFullYear() === viewDate.getFullYear() && now.getMonth() === viewDate.getMonth() && now.getDate() === viewDate.getDate();
        if (elDate) elDate.textContent = isToday ? 'Hoje' : viewDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (elWeek) elWeek.textContent = viewDate.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
    } catch (err) { /* silent */ }
}

function changeWorkoutDate(days) {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + days);
    updateWorkoutDateDisplay();
    // Dispara um evento para que o app principal (app.js) recarregue a lista de treinos
    document.dispatchEvent(new CustomEvent('workoutDateChanged', { detail: { viewDate } }));
}

// --- Helpers de SVG / watermark (local ao módulo) ---
let cachedMuscleSvg = null;
function getBodyWatermark(activeGroups, svgContent) {
    if (!svgContent) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");
    const svgElement = doc.documentElement;
    svgElement.querySelectorAll('g[id]').forEach(g => {
        if (g.id === 'Full-body' || g.id === 'camada_corpo') return;
        g.querySelectorAll('path').forEach(p => {
            p.style.fill = '#52525b';
            p.style.fillOpacity = '1';
            p.removeAttribute('fill');
        });
    });
    // Garantir que activeGroups é um array
    activeGroups = Array.isArray(activeGroups) ? activeGroups : (activeGroups ? [activeGroups] : []);
    activeGroups.forEach(group => {
        // Mapear grupo muscular para IDs do SVG
        const ids = MUSCLE_SVG_MAP[group] || [];

        ids.forEach(id => {
            const el = doc.getElementById(id);
            if (el) el.querySelectorAll('path').forEach(p => {
                p.style.fill = '#DC2626';
                p.style.fillOpacity = '1';
                p.removeAttribute('fill');
            });
        });
    });
    const contour = doc.getElementById('Contorno');
    if (contour) {
        contour.querySelectorAll('path').forEach(p => {
            p.style.fill = '#27272a';
            p.style.fillOpacity = '1';
        });
    }
    return new XMLSerializer().serializeToString(svgElement);
}

// Carrega e retorna o SVG cacheado
async function ensureCachedMuscleSvg() {
    if (cachedMuscleSvg) return cachedMuscleSvg;
    try { const resp = await fetch(`assets/img/muscle.svg?v=${Date.now()}`); if (resp.ok) cachedMuscleSvg = await resp.text(); } catch (e) { cachedMuscleSvg = ''; }
    return cachedMuscleSvg;
}

// --- loadWorkouts (Hero Layout) ---
async function loadWorkouts() {
    const savedWorkoutsList = document.getElementById('savedWorkoutsList');
    const noWorkoutsMessage = document.getElementById('noWorkoutsMessage');

    // 1. Atualiza Data e prepara interface (limpeza será feita após resposta do servidor)
    updateWorkoutDateDisplay();
    if (noWorkoutsMessage) noWorkoutsMessage.classList.add('hidden');

    const userResp = await supabase.auth.getUser();
    const currentUser = userResp?.data?.user;
    if (!currentUser) return;

    // Atualiza nome do usuário
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) {
        const meta = currentUser.user_metadata || {};
        let displayName = meta.name || meta.full_name || currentUser.email.split('@')[0];
        displayName = displayName.toString().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        userNameDisplay.textContent = displayName;
    }

    // Garante SVG carregado
    await ensureCachedMuscleSvg();

    // Busca no Banco
    const queryDate = getFormattedDateString(viewDate);
    const { data: workouts, error } = await supabase.from('workouts')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('date', queryDate)
        .order('created_at', { ascending: true });

    if (error) {
        if (savedWorkoutsList) savedWorkoutsList.innerHTML = `<div class="text-red-500">Erro: ${error.message}</div>`;
        return;
    }

    // Limpa o container APENAS após receber e validar a resposta (evita duplicação em chamadas concorrentes)
    if (savedWorkoutsList) savedWorkoutsList.innerHTML = '';

    // Estado Vazio
    if (!workouts || workouts.length === 0) {
        if (savedWorkoutsList) savedWorkoutsList.innerHTML = `
            <div class="flex flex-col items-center justify-center py-20 text-zinc-600 border border-zinc-800/50 rounded-2xl bg-zinc-900/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-40"><path d="M14.4 14.4 9.6 9.6M9.6 14.4l4.8-4.8"/><circle cx="12" cy="12" r="10"/></svg>
                <p class="text-xl font-medium text-zinc-400">Dia de descanso</p>
                <p class="text-sm text-zinc-600">Nenhum treino registrado para hoje.</p>
            </div>`;

        // Notifica App que não tem treino (para mudar botão do Header)
        document.dispatchEvent(new CustomEvent('workoutStateChanged', { detail: { hasWorkout: false, workout: null } }));

        // Adiciona botão de adicionar treino no header quando não há treino
        const workoutActions = document.getElementById('workoutActions');

        if (workoutActions) {
            workoutActions.innerHTML = `
                <button id="headerAddWorkoutBtn" class="flex items-center gap-2 bg-destaque text-texto hover:bg-red-700 transition px-4 py-2 rounded-lg font-bold" title="Adicionar Treino">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                    <span class="hidden lg:inline text-sm">Adicionar Treino</span>
                </button>
            `;

            // Event listener para adicionar treino
            document.getElementById('headerAddWorkoutBtn')?.addEventListener('click', () => {
                showWorkoutFormView();
            });
        }

        return;
    }

    // Notifica App que TEM treino (para mudar botão do Header para 'Editar')
    const mainWorkout = workouts[0];
    const otherWorkouts = workouts.slice(1);
    document.dispatchEvent(new CustomEvent('workoutStateChanged', { detail: { hasWorkout: true, workout: mainWorkout } }));

    // Adiciona botões de editar e excluir no header
    const workoutActions = document.getElementById('workoutActions');
    if (workoutActions && mainWorkout) {
        workoutActions.innerHTML = `
            <button id="headerEditWorkoutBtn" class="flex items-center gap-2 text-zinc-400 hover:text-destaque transition p-2 rounded-lg hover:bg-zinc-800/50" title="Editar Nome do Treino">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span class="hidden lg:inline text-sm font-medium">Editar Nome</span>
            </button>
            <button id="headerSaveTemplateBtn" class="flex items-center gap-2 text-zinc-400 hover:text-destaque transition p-2 rounded-lg hover:bg-zinc-800/50" title="Salvar como Template">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" /><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M14 4l0 4l-6 0l0 -4" /></svg>
                <span class="hidden lg:inline text-sm font-medium">Salvar</span>
            </button>
            <button id="headerDeleteWorkoutBtn" class="flex items-center gap-2 text-zinc-400 hover:text-red-500 transition p-2 rounded-lg hover:bg-zinc-800/50" title="Excluir Treino">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                <span class="hidden lg:inline text-sm font-medium">Excluir</span>
            </button>
        `;

        // Event listener para editar nome
        document.getElementById('headerEditWorkoutBtn')?.addEventListener('click', () => {
            openEditWorkoutNameModal(mainWorkout);
        });

        // Event listener para salvar como template
        document.getElementById('headerSaveTemplateBtn')?.addEventListener('click', async () => {
            await saveWorkoutAsTemplate(mainWorkout);
        });

        // Event listener para excluir treino
        document.getElementById('headerDeleteWorkoutBtn')?.addEventListener('click', async () => {
            const confirmed = await showConfirmDialog({
                title: 'Excluir Treino',
                message: `Tem certeza que deseja excluir o treino "${mainWorkout.name}"? Esta ação não pode ser desfeita.`,
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                type: 'danger'
            });
            if (!confirmed) return;
            const { error } = await supabase.from('workouts').delete().eq('id', mainWorkout.id);
            if (error) {
                showToast(`Erro ao excluir: ${error.message}`, 'error');
            } else {
                showToast('Treino excluído com sucesso!', 'success');
                loadWorkouts();
            }
        });
    }

    // --- RENDERIZA O HERÓI ---
    const renderHero = (workout) => {
        // 1. Lógica de Grupos Musculares e SVG (Mantida)
        // Computa grupos musculares ignorando exercícios do tipo cardio
        const groupsRawAll = [...new Set((workout.exercises || []).map(ex => { const check = getExerciseMuscleGroup(ex); return check ? check.group : null; }))].filter(g => g);
        const groupsRaw = groupsRawAll.filter(g => g !== 'Cardio');

        const muscleCounts = {};
        (workout.exercises || []).forEach(ex => {
            const check = getExerciseMuscleGroup(ex);
            if (check && check.group !== 'Cardio') {
                muscleCounts[check.group] = (muscleCounts[check.group] || 0) + (ex.sets ? ex.sets.length : 0);
            }
        });

        const sortedMuscles = Object.keys(muscleCounts).sort((a, b) => muscleCounts[b] - muscleCounts[a]);
        const top3 = sortedMuscles.slice(0, 3).join(', ');
        let groupsText = sortedMuscles.length > 3 ? `${top3} +` : top3;
        // Se não houver músculos de força mas existirem exercícios cardio, mostrar 'Cardio'
        const hasCardio = (workout.exercises || []).some(ex => ex.type === 'cardio' || getExerciseMuscleGroup(ex)?.group === 'Cardio');
        if (!groupsText) groupsText = hasCardio ? 'Cardio' : 'Geral';

        // Apenas exercícios de força afetam o SVG
        const bodySvg = cachedMuscleSvg ? getBodyWatermark(groupsRaw, cachedMuscleSvg) : '';

        // 2. Cálculo de Cardio Total
        let totalCardioMinutes = 0;
        (workout.exercises || []).forEach(ex => {
            if (ex.type === 'cardio' && ex.sets) {
                ex.sets.forEach(s => totalCardioMinutes += (Number(s.duration) || 0));
            }
        });
        // Formatação de tempo (ex: 1h 20min ou 45min)
        let cardioText = "0min";
        if (totalCardioMinutes > 0) {
            const h = Math.floor(totalCardioMinutes / 60);
            const m = totalCardioMinutes % 60;
            cardioText = h > 0 ? `${h}h ${m}min` : `${m}min`;
        }

        // 3. Separação entre Cardio e Strength (iteração preservando índices originais)
        let cardioHtmlList = '';
        let strengthHtmlList = '';
        let strengthCount = 0;
        (workout.exercises || []).forEach((ex, originalIndex) => {
            const isCardio = ex.type === 'cardio' || (getExerciseMuscleGroup(ex)?.group === 'Cardio');
            if (isCardio) {
                const totalMin = (ex.sets || []).reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
                cardioHtmlList += `
                    <div class="hero-exercise-item cursor-pointer hover:bg-zinc-800 transition p-2 rounded" data-index="${originalIndex}">
                        <div class="border-l-2 border-zinc-800 pl-3 py-1 mb-1">
                            <p class="text-zinc-200 font-bold text-sm mb-1">${ex.name}</p>
                            <div class="text-xs text-zinc-500">${totalMin}m</div>
                        </div>
                    </div>`;
            } else {
                strengthCount += 1;
                const sets = ex.sets || [];
                const setsHtml = sets.map(s => `<span class="text-xs text-zinc-500 font-mono bg-zinc-950 px-1 rounded"><strong class="text-zinc-300">${s.reps}</strong>x${s.weight}kg</span>`).join(' ');
                strengthHtmlList += `
                    <div class="hero-exercise-item cursor-pointer hover:bg-zinc-800 transition p-2 rounded" data-index="${originalIndex}">
                        <div class="border-l-2 border-zinc-800 pl-3 py-1 mb-1">
                            <p class="text-zinc-200 font-bold text-sm mb-1">${ex.name}</p>
                            <div class="flex flex-wrap gap-1">${setsHtml}</div>
                        </div>
                    </div>`;
            }
        });

        const totalExercises = strengthCount;
        const item = document.createElement('div');
        item.className = "w-full max-w-[1600px] mx-auto mb-12 flex flex-col gap-8";

        item.innerHTML = `
            <div class="text-center relative z-20 px-4">
                <div class="mb-2">
                    <h3 id="heroWorkoutTitle-${workout.id}" class="text-5xl lg:text-6xl font-black text-white leading-none tracking-tight break-words text-center uppercase logo-font">${workout.name || 'Treino'}</h3>
                </div>
                
                <div>
                    <span class="text-sm lg:text-base font-bold text-destaque uppercase tracking-widest">${groupsText}</span>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-[1fr_600px_1fr] gap-6 lg:gap-12 items-center justify-items-stretch relative">
                
                <div class="order-3 lg:order-1 px-4 lg:px-0 relative h-full flex flex-col justify-center">
                    <div class="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden shadow-2xl h-full flex flex-col">
                        <div class="bg-zinc-950/50 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                            <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Cardio Total</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-destaque"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div class="p-8 flex flex-col items-center justify-center text-center gap-2">
                            <span class="text-5xl font-black text-white tracking-tighter">${cardioText}</span>
                            <span class="text-xs text-zinc-500 font-medium uppercase tracking-wider">Tempo Acumulado</span>
                        </div>
                                <div class="flex-1 overflow-y-auto custom-scrollbar p-4">
                                    ${cardioHtmlList}
                                </div>
                                <div class="border-t border-zinc-800/60 px-4 py-3 bg-zinc-950/20 min-h-[50px] flex justify-center items-center">
                                    <button id="heroAddCardioBtn-${workout.id}" class="text-zinc-400 hover:text-destaque transition p-2" aria-label="Adicionar Cardio" title="Adicionar Cardio">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                                    </button>
                                </div>
                    </div>
                </div>

                <div class="relative order-1 lg:order-2 h-[400px] lg:h-[450px] w-full flex justify-center items-center py-6 justify-self-center">
                    <div class="absolute inset-0 bg-destaque/10 blur-[80px] rounded-full scale-75 pointer-events-none"></div>
                    <div class="relative z-10 w-[600px] h-full flex justify-center items-center transform scale-100 lg:scale-110 drop-shadow-2xl">
                        ${bodySvg}
                    </div>
                </div>

                <div class="order-2 lg:order-3 px-4 lg:px-0 relative h-full flex flex-col justify-center">
                    <div class="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative h-full flex flex-col">
                        <div class="bg-zinc-950/50 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                            <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Execução</span>
                            <span class="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full"><span class="text-destaque font-bold">${totalExercises}</span> <span class="text-destaque">Exercícios</span></span>
                        </div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-4">
                            ${strengthHtmlList}
                        </div>

                        <div class="border-t border-zinc-800/60 px-4 py-3 flex justify-center items-center gap-4 bg-zinc-950/20 min-h-[50px]">
                            <button id="heroAddStrengthBtn-${workout.id}" class="text-zinc-400 hover:text-destaque transition p-2" aria-label="Adicionar Exercício" title="Adicionar Exercício">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        savedWorkoutsList.appendChild(item);

        // --- Listeners para o bloco gerado (usa data-index com índice ORIGINAL) ---
        // Abrir modal ao clicar em um exercício (cardio ou strength)
        item.querySelectorAll('.hero-exercise-item').forEach(el => {
            el.addEventListener('click', (ev) => {
                const idx = Number(el.getAttribute('data-index'));
                if (Number.isFinite(idx)) openExerciseModal(workout, idx);
            });
        });

        // Botões de adicionar cardio / strength
        const addCardioBtn = document.getElementById(`heroAddCardioBtn-${workout.id}`);
        const addStrengthBtn = document.getElementById(`heroAddStrengthBtn-${workout.id}`);
        addCardioBtn?.addEventListener('click', () => openExerciseModal(workout, -1, 'cardio'));
        addStrengthBtn?.addEventListener('click', () => openExerciseModal(workout, -1, 'strength'));

        // Editar nome (abre modal de edição/global)
        const editBtn = document.getElementById(`heroEditNameBtn-${workout.id}`);
        editBtn?.addEventListener('click', () => openEditWorkoutNameModal(workout));
    };

    renderHero(mainWorkout);

    // Renderiza Extras (se houver, layout compacto)
    if (otherWorkouts.length > 0) {
        const divider = document.createElement('div');
        divider.className = "flex items-center gap-4 mb-3 mt-8 opacity-40 max-w-3xl mx-auto";
        divider.innerHTML = `<div class="h-px flex-1 bg-zinc-700"></div><span class="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Extras</span><div class="h-px flex-1 bg-zinc-700"></div>`;
        savedWorkoutsList.appendChild(divider);

        otherWorkouts.forEach(workout => {
            const item = document.createElement('div');
            item.className = "w-full max-w-3xl mx-auto flex justify-between items-center bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 p-4 rounded-lg mb-2 transition group";
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-zinc-700 group-hover:bg-destaque transition-colors"></div>
                    <div>
                        <h5 class="text-zinc-300 font-bold text-sm leading-tight group-hover:text-white">${workout.name}</h5>
                        <span class="text-xs text-zinc-600">${workout.exercises.length} exercícios</span>
                    </div>
                </div>
                <button class="btn-delete flex items-center justify-center w-8 h-8 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
             `;
            item.querySelector('.btn-delete').addEventListener('click', async () => { const confirmed = await showConfirmDialog({ title: 'Excluir treino extra', message: 'Tem certeza que deseja excluir este treino?', confirmText: 'Excluir', cancelText: 'Cancelar', type: 'danger' }); if (!confirmed) return; await supabase.from('workouts').delete().eq('id', workout.id); showToast('Treino excluído com sucesso!', 'success'); loadWorkouts(); });
            savedWorkoutsList.appendChild(item);
        });
    }
}

function getExerciseNameFromBlock(block) {
    const select = block.querySelector('.exercise-select');
    const input = block.querySelector('.custom-exercise-input');
    if (!select) return input ? input.value : '';
    if (select.value === 'custom_option' || !select.value) return input ? input.value : '';
    return select.value;
}

function addSetBlock(container) {
    const count = container.children.length + 1;
    const html = `
            <div class="set-row flex items-center gap-3 group">
                <span class="set-number-label text-zinc-500 font-medium text-sm w-12 text-center whitespace-nowrap">Série ${count}</span>
                <div class="inputs-strength grid grid-cols-2 gap-3 w-full"><input type="number" min="0" class="reps-input w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-texto focus:outline-none focus:border-destaque placeholder-zinc-500" placeholder="Reps" aria-label="Repetições"><div class="relative w-full"><input type="number" min="0" step="0.5" class="weight-input w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-3 pr-8 py-2 text-texto focus:outline-none focus:border-destaque placeholder-zinc-500" placeholder="Peso" aria-label="Peso"><span class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold pointer-events-none">kg</span></div></div>
                <div class="inputs-cardio hidden w-full"><div class="relative w-full"><input type="number" min="0" class="duration-input w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-3 pr-10 py-2 text-texto focus:outline-none focus:border-destaque placeholder-zinc-500" placeholder="Duração" aria-label="Duração"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold pointer-events-none">min</span></div></div>
                <button class="remove-set-btn text-zinc-600 hover:text-red-500 transition p-1 rounded-md hover:bg-zinc-700 opacity-0 group-hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>`;
    container.insertAdjacentHTML('beforeend', html);
    const row = container.lastElementChild;
    const block = container.closest('.exercise-block');
    if (block && block.dataset.type === 'cardio') {
        row.querySelector('.inputs-strength').classList.add('hidden');
        row.querySelector('.inputs-cardio').classList.remove('hidden');
    }
}

function updateSetNumbers(setsContainer) {
    const rows = setsContainer.querySelectorAll('.set-row');
    rows.forEach((row, index) => {
        const label = row.querySelector('.set-number-label');
        if (label) label.textContent = `Série ${index + 1}`;
    });
}

function addExerciseBlock() {
    exerciseCounter++;
    const exerciseId = `exercise-${exerciseCounter}`;
    const html = `
            <div id="${exerciseId}" class="exercise-block bg-zinc-800 p-4 rounded-lg border border-zinc-700 space-y-4">
                <div class="flex flex-col gap-3">
                    <div class="flex justify-between items-start"><span class="text-sm font-bold text-destaque uppercase tracking-wider">Exercício ${document.querySelectorAll('.exercise-block').length + 1}</span><button class="remove-exercise-btn text-zinc-400 hover:text-red-500 transition duration-300" data-target="${exerciseId}"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select class="muscle-group-select w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-texto focus:outline-none focus:border-destaque" aria-label="Grupo Muscular"><option value="" disabled selected>Grupo Muscular</option>${Object.keys(EXERCISE_CATALOG).map(group => `<option value="${group}">${group}</option>`).join('')}</select>
                        <select class="exercise-select w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-texto focus:outline-none focus:border-destaque disabled:opacity-50" disabled aria-label="Exercício"><option value="" disabled selected>Selecione o Grupo</option></select>
                    </div>
                    <input type="text" class="exercise-name-input custom-exercise-input hidden w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-texto focus:outline-none focus:border-destaque placeholder-zinc-500" placeholder="Nome do exercício..." aria-label="Nome do Exercício">
                </div>
                <div class="sets-container space-y-3 pt-2"></div>
                <button class="add-set-btn w-fit mt-2 text-zinc-400 hover:text-destaque transition text-sm font-medium py-1 px-2 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg><span>Adicionar Série</span></button>
            </div>`;
    const exerciseListContainer = document.getElementById('exerciseListContainer');
    exerciseListContainer.insertAdjacentHTML('beforeend', html);
    const block = document.getElementById(exerciseId);
    const setsContainer = block.querySelector('.sets-container');
    addSetBlock(setsContainer);
    const mSelect = block.querySelector('.muscle-group-select');
    const eSelect = block.querySelector('.exercise-select');
    const cInput = block.querySelector('.custom-exercise-input');

    mSelect.addEventListener('change', (e) => {
        const group = e.target.value;
        eSelect.innerHTML = '<option value="" disabled selected>Exercício</option>' + (EXERCISE_CATALOG[group] || []).map(ex => `<option value="${ex}">${ex}</option>`).join('') + '<option value="custom_option">+ Outro</option>';
        eSelect.disabled = false; eSelect.value = ""; cInput.classList.add('hidden'); cInput.value = '';
        if (block.dataset.type) {
            const isCardio = group === 'Cardio';
            block.dataset.type = isCardio ? 'cardio' : 'strength';
            block.querySelectorAll('.set-row').forEach(r => {
                r.querySelector('.inputs-strength').classList.toggle('hidden', isCardio);
                r.querySelector('.inputs-cardio').classList.toggle('hidden', !isCardio);
            });
        }
    });
    eSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom_option') { cInput.classList.remove('hidden'); cInput.focus(); } else { cInput.classList.add('hidden'); cInput.value = e.target.value; }
    });
}

async function saveWorkoutToSupabase() {
    // Nova versão: utiliza viewDate para definir a data do treino
    const { workoutNameInput, exerciseListContainer } = (typeof getEls === 'function') ? getEls() : { workoutNameInput: document.getElementById('workoutName'), exerciseListContainer: document.getElementById('exerciseListContainer') };
    const user = (await supabase.auth.getUser()).data?.user;

    if (!user) {
        showToast('Você precisa estar logado para salvar treinos.', 'error');
        return;
    }

    // 1. Captura os dados do DOM
    const workoutName = workoutNameInput?.value || "Treino do Dia";

    // Monta o array de exercícios
    const exercises = [];
    exerciseListContainer?.querySelectorAll('.exercise-block').forEach(block => {
        const nameEl = block.querySelector('.exercise-name-input');
        const name = nameEl ? nameEl.value : getExerciseNameFromBlock(block) || '';
        if (!name) return;

        const type = block.dataset.type || 'strength';
        const sets = [];

        block.querySelectorAll('.set-row').forEach(row => {
            if (type === 'cardio') {
                const duration = row.querySelector('.duration-input')?.value;
                if (duration) sets.push({ duration });
            } else {
                const reps = row.querySelector('.reps-input')?.value;
                const weight = row.querySelector('.weight-input')?.value;
                if (reps) sets.push({ reps, weight: weight || 0 });
            }
        });

        if (sets.length > 0) {
            exercises.push({ name, type, sets });
        }
    });

    if (exercises.length === 0) {
        showToast('Adicione pelo menos um exercício com séries.', 'warning');
        return;
    }

    // 2. Monta o Payload com a DATA CORRETA (viewDate)
    const payload = {
        user_id: user.id,
        date: getFormattedDateString(viewDate), // <--- CORREÇÃO AQUI
        name: workoutName,
        exercises: exercises
    };

    // 3. Envia para o Supabase
    try {
        let error;
        if (editingWorkoutId) {
            // Update
            const res = await supabase.from('workouts').update(payload).eq('id', editingWorkoutId);
            error = res.error;
        } else {
            // Insert
            const res = await supabase.from('workouts').insert([payload]);
            error = res.error;
        }

        if (error) throw error;

        // 4. Limpeza e Reload
        clearEditingWorkout(); // Limpa o form

        // Esconde o form e volta para a dashboard
        const formView = document.getElementById('workoutFormView');
        const dashView = document.getElementById('dashboardView');
        if (formView) formView.classList.add('hidden');
        if (dashView) dashView.classList.remove('hidden');

        // Recarrega a lista para mostrar o novo treino
        loadWorkouts();

    } catch (err) {
        console.error("Erro ao salvar treino:", err);
        showToast('Erro ao salvar treino: ' + err.message, 'error');
    }
}

function updateSetNumbersWrapper(setsContainer) {
    updateSetNumbers(setsContainer);
}

function loadWorkoutDraft() {
    const json = localStorage.getItem('track2lift_draft');
    const workoutDateInput = document.getElementById('workoutDate');
    const workoutNameInput = document.getElementById('workoutName');
    const exerciseListContainer = document.getElementById('exerciseListContainer');
    if (!json) return;
    try {
        const draft = JSON.parse(json);
        if (workoutDateInput) workoutDateInput.value = draft.date;
        if (workoutNameInput) workoutNameInput.value = draft.name;
        if (!exerciseListContainer) return;
        exerciseListContainer.innerHTML = '';
        exerciseCounter = 0;
        draft.exercises.forEach(exData => {
            addExerciseBlock();
            const currentBlock = exerciseListContainer.lastElementChild;
            const muscleSelect = currentBlock.querySelector('.muscle-group-select');
            const exerciseSelect = currentBlock.querySelector('.exercise-select');
            const customInput = currentBlock.querySelector('.custom-exercise-input');
            const setsContainer = currentBlock.querySelector('.sets-container');
            const res = getExerciseMuscleGroup(exData);
            if (res) {
                muscleSelect.value = res.group;
                muscleSelect.dispatchEvent(new Event('change'));
                if (res.exactMatch) {
                    exerciseSelect.value = res.correctName || exData.name;
                    if (!exerciseSelect.value) {
                        exerciseSelect.value = 'custom_option';
                        exerciseSelect.dispatchEvent(new Event('change'));
                        customInput.value = exData.name;
                    } else {
                        customInput.value = res.correctName || exData.name;
                    }
                } else {
                    exerciseSelect.value = 'custom_option';
                    exerciseSelect.dispatchEvent(new Event('change'));
                    customInput.value = exData.name;
                }
            } else {
                currentBlock.dataset.tempName = exData.name;
            }
            setsContainer.innerHTML = '';
            exData.sets.forEach(setData => {
                addSetBlock(setsContainer);
                const currentSet = setsContainer.lastElementChild;
                if (setData.duration !== undefined) {
                    currentSet.querySelector('.inputs-strength').classList.add('hidden');
                    currentSet.querySelector('.inputs-cardio').classList.remove('hidden');
                    currentSet.querySelector('.duration-input').value = setData.duration;
                    currentBlock.dataset.type = 'cardio';
                } else {
                    currentSet.querySelector('.reps-input').value = setData.reps;
                    currentSet.querySelector('.weight-input').value = setData.weight;
                }
            });
        });
    } catch (e) { console.error("Erro rascunho", e); }
}

function loadWorkoutForEditing(workout) {
    editingWorkoutId = workout.id;
    localStorage.setItem('track2lift_editing_id', workout.id);
    const dashboardView = document.getElementById('dashboardView');
    const workoutFormView = document.getElementById('workoutFormView');
    const saveWorkoutBtn = document.getElementById('saveWorkoutBtn');
    const goBackToDashboardBtn = document.getElementById('goBackToDashboardBtn');
    if (dashboardView) dashboardView.classList.add('hidden');
    if (workoutFormView) workoutFormView.classList.remove('hidden');
    // Mostra o botão de deletar quando estamos editando
    document.getElementById('deleteWorkoutBtn')?.classList.remove('hidden');
    if (saveWorkoutBtn) saveWorkoutBtn.textContent = "Atualizar Treino";
    const cancelTextSpan = goBackToDashboardBtn?.querySelector('span');
    if (cancelTextSpan) cancelTextSpan.innerHTML = "&times; Cancelar Edição";
    const workoutDateInput = document.getElementById('workoutDate');
    const workoutNameInput = document.getElementById('workoutName');
    const exerciseListContainer = document.getElementById('exerciseListContainer');
    if (workoutDateInput) workoutDateInput.value = workout.date;
    if (workoutNameInput) workoutNameInput.value = workout.name;
    if (!exerciseListContainer) return;
    exerciseListContainer.innerHTML = '';
    exerciseCounter = 0;
    workout.exercises.forEach(exData => {
        addExerciseBlock();
        const currentBlock = exerciseListContainer.lastElementChild;
        const muscleSelect = currentBlock.querySelector('.muscle-group-select');
        const exerciseSelect = currentBlock.querySelector('.exercise-select');
        const customInput = currentBlock.querySelector('.custom-exercise-input');
        const setsContainer = currentBlock.querySelector('.sets-container');
        const res = getExerciseMuscleGroup(exData);
        if (res) {
            muscleSelect.value = res.group;
            muscleSelect.dispatchEvent(new Event('change'));
            exerciseSelect.value = res.exactMatch ? (res.correctName || exData.name) : 'custom_option';
            exerciseSelect.dispatchEvent(new Event('change'));
            customInput.value = exData.name;
        } else { currentBlock.dataset.tempName = exData.name; }

        setsContainer.innerHTML = '';
        exData.sets.forEach(setData => {
            addSetBlock(setsContainer);
            const currentSet = setsContainer.lastElementChild;
            if (setData.duration !== undefined) {
                currentSet.querySelector('.inputs-strength').classList.add('hidden');
                currentSet.querySelector('.inputs-cardio').classList.remove('hidden');
                currentSet.querySelector('.duration-input').value = setData.duration;
                currentBlock.dataset.type = 'cardio';
            } else {
                currentSet.querySelector('.reps-input').value = setData.reps;
                currentSet.querySelector('.weight-input').value = setData.weight;
            }
        });
    });
}

// ---------------- Modal de Exercício ----------------
function renderModalSetRow(setData = {}, type = 'strength') {
    const isCardio = type === 'cardio' || setData.duration !== undefined;
    if (isCardio) {
        const value = setData.duration !== undefined ? setData.duration : '';
        return `
            <div class="modal-set-row flex items-center gap-3 mb-2">
                <div class="flex-1 relative"><input type="number" min="0" class="duration-input w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-10 py-2 text-texto" placeholder="Duração (min)" value="${value}"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">min</span></div>
                <button class="remove-modal-set-btn text-zinc-400 hover:text-red-500 p-2">✕</button>
            </div>`;
    }
    const repsVal = setData.reps !== undefined ? setData.reps : '';
    const weightVal = setData.weight !== undefined ? setData.weight : '';
    return `
        <div class="modal-set-row flex items-center gap-3 mb-2">
            <div class="w-24 text-zinc-400 text-sm modal-set-label">Série</div>
            <input type="number" min="0" class="reps-input w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-texto" placeholder="Reps" value="${repsVal}">
            <div class="relative flex-1"><input type="number" min="0" step="0.5" class="weight-input w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-10 py-2 text-texto" placeholder="Peso" value="${weightVal}"><span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">kg</span></div>
            <button class="remove-modal-set-btn text-zinc-400 hover:text-red-500 p-2">✕</button>
        </div>`;
}

function updateModalSetNumbers(setsContainer) {
    if (!setsContainer) return;
    const rows = setsContainer.querySelectorAll('.modal-set-row');
    rows.forEach((row, idx) => {
        const label = row.querySelector('.modal-set-label');
        if (label) label.textContent = `Série ${idx + 1}`;
    });
}

// Função para resetar completamente o modal de exercício
function resetExerciseModal() {
    const select = document.getElementById('modalExerciseSelect');
    const customContainer = document.getElementById('modalCustomExerciseContainer');
    const customInput = document.getElementById('modalCustomExerciseInput');
    const saveCheckbox = document.getElementById('modalSaveCustomCheckbox');
    const mgContainer = document.getElementById('muscleGroupSelectionContainer');
    const mgSelect = document.getElementById('modalMuscleGroupSelect');

    // Resetar select de grupo muscular
    if (mgSelect) mgSelect.selectedIndex = 0;

    // Resetar select de exercícios para estado inicial
    if (select) {
        select.innerHTML = '<option value="" disabled selected>Primeiro selecione o grupo muscular</option>';
    }

    // Limpar outros campos
    if (customInput) customInput.value = '';
    if (saveCheckbox) saveCheckbox.checked = false;
    if (customContainer) customContainer.classList.add('hidden');
    if (mgContainer) mgContainer.innerHTML = '';
}

async function openExerciseModal(workout, exerciseIndex = -1, typeHint = null) {
    currentEditingWorkout = workout;
    currentExerciseIndex = exerciseIndex;
    const modal = document.getElementById('exerciseModal');
    const title = document.getElementById('exerciseModalTitle');
    const select = document.getElementById('modalExerciseSelect');
    const setsContainer = document.getElementById('modalSetsContainer');
    const deleteBtn = document.getElementById('modalDeleteExerciseBtn');
    if (!modal || !select || !setsContainer) return;

    const muscleGroupContainer = document.getElementById('muscleGroupSelectionContainer');

    // Helpers
    const populateExerciseSelectForGroup = (group) => {
        const list = EXERCISE_CATALOG[group] || [];
        select.innerHTML = '<option value="" disabled selected>Selecione o exercício</option>' + list.map(n => `<option value="${n}">${n}</option>`).join('') + '<option value="custom_option">+ Outro...</option>';
    };

    const populateCardioExerciseSelect = () => {
        const list = EXERCISE_CATALOG['Cardio'] || [];
        select.innerHTML = '<option value="" disabled selected>Selecione Cardio</option>' + list.map(n => `<option value="${n}">${n}</option>`).join('') + '<option value="custom_option">+ Outro...</option>';
    };

    const ensureCustomContainer = () => {
        let cc = document.getElementById('modalCustomExerciseContainer');
        if (!cc && select) {
            select.insertAdjacentHTML('afterend', `
                <div id="modalCustomExerciseContainer" class="hidden space-y-3 mt-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                    <div>
                        <label class="block text-xs font-medium text-zinc-400 mb-2">Nome do Exercício</label>
                        <input id="modalCustomExerciseInput" 
                               class="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-2.5 text-texto placeholder-zinc-500 focus:outline-none focus:border-destaque transition-colors" 
                               placeholder="Digite o nome do exercício...">
                    </div>
                    <label class="flex items-center gap-3 cursor-pointer group">
                        <input id="modalSaveCustomCheckbox" type="checkbox" 
                               class="w-5 h-5 rounded border-2 border-zinc-600 bg-zinc-900 checked:bg-destaque checked:border-destaque transition-all cursor-pointer accent-destaque">
                        <span class="text-sm text-zinc-300 group-hover:text-white transition-colors">Salvar este exercício para uso futuro</span>
                    </label>
                </div>`);
            cc = document.getElementById('modalCustomExerciseContainer');
        }
        return cc;
    };

    // Prepara o modal conforme se estiver editando ou adicionando
    setsContainer.innerHTML = '';
    const allExercisesFlat = [];
    Object.keys(EXERCISE_CATALOG).forEach(g => { (EXERCISE_CATALOG[g] || []).forEach(ex => allExercisesFlat.push(ex)); });

    if (exerciseIndex >= 0 && workout.exercises && workout.exercises[exerciseIndex]) {
        const ex = workout.exercises[exerciseIndex];
        title.textContent = 'Editar Exercício';
        modalCurrentType = ex.type === 'cardio' ? 'cardio' : (getExerciseMuscleGroup(ex)?.group === 'Cardio' ? 'cardio' : 'strength');

        // Monta seletores dependendo do tipo
        if (modalCurrentType === 'cardio') {
            if (muscleGroupContainer) muscleGroupContainer.innerHTML = `<div class="text-xs text-zinc-400 mb-2">Cardio</div>`;
            populateCardioExerciseSelect();
            const found = allExercisesFlat.includes(ex.name);
            if (found) {
                select.value = ex.name;
            } else {
                select.value = 'custom_option';
                // Mostrar container customizado e preencher nome
                const customContainer = ensureCustomContainer();
                if (customContainer) customContainer.classList.remove('hidden');
                const customInput = document.getElementById('modalCustomExerciseInput');
                if (customInput) customInput.value = ex.name;
            }
        } else {
            // strength: mostra seletor de grupos
            if (muscleGroupContainer) muscleGroupContainer.innerHTML = `<select id="modalMuscleGroupSelect" class="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-texto"><option value="" disabled selected>Grupo Muscular</option>${Object.keys(EXERCISE_CATALOG).filter(g => g !== 'Cardio').map(g => `<option value="${g}">${g}</option>`).join('')}</select>`;
            const group = getExerciseMuscleGroup(ex)?.group || '';
            const mgSelect = document.getElementById('modalMuscleGroupSelect');
            if (mgSelect && group) { mgSelect.value = group; populateExerciseSelectForGroup(group); }
            else if (mgSelect) mgSelect.selectedIndex = 0;

            const found = allExercisesFlat.includes(ex.name);
            if (found) {
                select.value = ex.name;
            } else {
                select.value = 'custom_option';
                // Mostrar container customizado e preencher nome
                const customContainer = ensureCustomContainer();
                if (customContainer) customContainer.classList.remove('hidden');
                const customInput = document.getElementById('modalCustomExerciseInput');
                if (customInput) customInput.value = ex.name;
            }
        }

        // Renderiza sets
        (ex.sets || []).forEach(set => {
            setsContainer.insertAdjacentHTML('beforeend', renderModalSetRow(set, modalCurrentType));
        });
        deleteBtn?.classList.remove('hidden');
    } else {
        title.textContent = 'Adicionar Exercício';
        modalCurrentType = typeHint === 'cardio' ? 'cardio' : 'strength';

        if (modalCurrentType === 'cardio') {
            if (muscleGroupContainer) muscleGroupContainer.innerHTML = `<div class="text-xs text-zinc-400 mb-2">Cardio</div>`;
            populateCardioExerciseSelect();
        } else {
            if (muscleGroupContainer) muscleGroupContainer.innerHTML = `<select id="modalMuscleGroupSelect" class="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-texto"><option value="" disabled selected>Grupo Muscular</option>${Object.keys(EXERCISE_CATALOG).filter(g => g !== 'Cardio').map(g => `<option value="${g}">${g}</option>`).join('')}</select>`;
            // Resetar select de exercícios para estado padrão vazio
            select.innerHTML = '<option value="" disabled selected>Primeiro selecione o grupo muscular</option>';
        }

        // Inserir uma série inicial
        setsContainer.insertAdjacentHTML('beforeend', renderModalSetRow({}, modalCurrentType));
        deleteBtn?.classList.add('hidden');
    }

    // Garantir container custom existe e listeners básicos
    const customContainer = ensureCustomContainer();
    const modalMuscleSelect = document.getElementById('modalMuscleGroupSelect');

    // Attach one-time modal-level listeners
    if (modal.dataset.init !== '1') {
        modal.dataset.init = '1';

        // Mudança de grupo => popular exercícios
        modal.addEventListener('change', (ev) => {
            const target = ev.target;
            if (target && target.id === 'modalMuscleGroupSelect') {
                const g = target.value;
                populateExerciseSelectForGroup(g);
                // esconder custom
                const cc = document.getElementById('modalCustomExerciseContainer'); if (cc) cc.classList.add('hidden');
            }
            if (target && target.id === 'modalExerciseSelect') {
                if (target.value === 'custom_option') {
                    const cc = document.getElementById('modalCustomExerciseContainer'); if (cc) cc.classList.remove('hidden');
                    const input = document.getElementById('modalCustomExerciseInput'); if (input) input.focus();
                } else {
                    const cc = document.getElementById('modalCustomExerciseContainer'); if (cc) cc.classList.add('hidden');
                }
            }
        });

        // Ao remover linha de sets no modal, atualizar numeração
        const modalSetsContainerEl = document.getElementById('modalSetsContainer');
        modalSetsContainerEl?.addEventListener('click', (e) => {
            if (e.target.closest('.remove-modal-set-btn')) {
                const row = e.target.closest('.modal-set-row'); if (row) row.remove();
                updateModalSetNumbers(modalSetsContainerEl);
            }
        });
    }

    // Atualiza numeração das séries
    updateModalSetNumbers(setsContainer);

    // Mostrar modal
    modal.classList.remove('hidden');
}

async function saveExerciseFromModal() {
    if (!currentEditingWorkout) return;
    const modal = document.getElementById('exerciseModal');
    const select = document.getElementById('modalExerciseSelect');
    const setsContainer = document.getElementById('modalSetsContainer');
    if (!select || !setsContainer) return;

    let name = select.value;
    let muscleGroupForExercise = null; // Armazena o grupo muscular para este exercício

    // Validação: verificar se exercício foi selecionado
    if (!name || name === '') {
        showToast('Selecione um exercício', 'warning');
        return;
    }

    if (name === 'custom_option') {
        const customInput = document.getElementById('modalCustomExerciseInput');
        const custom = customInput ? customInput.value.trim() : '';
        if (!custom) {
            showToast('Digite o nome do exercício personalizado', 'warning');
            return;
        }
        name = custom;

        // Determinar o grupo muscular SEMPRE, independente de salvar no catálogo
        let groupName = 'Outros';
        if (modalCurrentType === 'cardio') {
            groupName = 'Cardio';
        } else {
            // Prioriza o grupo muscular selecionado no modal
            const mg = document.getElementById('modalMuscleGroupSelect');
            if (mg && mg.value) {
                groupName = mg.value;
            } else {
                // Para exercícios de força personalizados, exigir seleção de grupo muscular
                showToast('Selecione o grupo muscular antes de adicionar um exercício personalizado', 'warning');
                return;
            }
        }

        muscleGroupForExercise = groupName; // Armazena para adicionar ao exercício

        // Se o usuário optou por salvar, adiciona ao catálogo em sessão E salva no Supabase
        const saveChecked = document.getElementById('modalSaveCustomCheckbox')?.checked;
        if (saveChecked) {
            EXERCISE_CATALOG[groupName] = EXERCISE_CATALOG[groupName] || [];
            if (!EXERCISE_CATALOG[groupName].includes(name)) {
                EXERCISE_CATALOG[groupName].push(name);
                // Salvar no Supabase para persistir entre sessões
                await saveCustomExerciseToSupabase(groupName, name);
            }
        }
    } else {
        // Para exercícios não customizados de força, validar se grupo foi selecionado
        if (modalCurrentType !== 'cardio') {
            const mg = document.getElementById('modalMuscleGroupSelect');
            if (!mg || !mg.value) {
                showToast('Selecione o grupo muscular primeiro', 'warning');
                return;
            }
        }
    }

    const sets = [];
    setsContainer.querySelectorAll('.modal-set-row').forEach(row => {
        const dur = row.querySelector('.duration-input');
        if (dur && dur.value) { sets.push({ duration: Number(dur.value) }); return; }
        const reps = row.querySelector('.reps-input')?.value;
        const weight = row.querySelector('.weight-input')?.value;
        if (reps) sets.push({ reps: Number(reps), weight: weight ? Number(weight) : 0 });
    });

    if (sets.length === 0) {
        showToast('Adicione pelo menos uma série', 'warning');
        return;
    }

    const isCardio = sets.length && sets[0].duration !== undefined;
    const newEx = { name, type: isCardio ? 'cardio' : 'strength', sets };

    // Adicionar grupo muscular ao exercício se for customizado (para que o SVG funcione)
    if (muscleGroupForExercise) {
        newEx.muscleGroup = muscleGroupForExercise;
    }

    if (!currentEditingWorkout.exercises) currentEditingWorkout.exercises = [];
    if (currentExerciseIndex >= 0) currentEditingWorkout.exercises[currentExerciseIndex] = newEx;
    else currentEditingWorkout.exercises.push(newEx);

    // Persiste no Supabase
    try {
        const res = await supabase.from('workouts').update({ exercises: currentEditingWorkout.exercises }).eq('id', currentEditingWorkout.id);
        if (res.error) throw res.error;

        // Resetar modal antes de fechar
        resetExerciseModal();

        // Fechar modal e recarregar
        const modal = document.getElementById('exerciseModal');
        modal?.classList.add('hidden');
        await loadWorkouts();
    } catch (err) {
        console.error('Erro ao salvar exercício:', err);
        showToast('Erro ao salvar exercício: ' + err.message, 'error');
    }
}

async function deleteExerciseFromModal() {
    if (!currentEditingWorkout || currentExerciseIndex < 0) return;
    const confirmed = await showConfirmDialog({
        title: 'Remover Exercício',
        message: 'Tem certeza que deseja remover este exercício?',
        confirmText: 'Remover',
        cancelText: 'Cancelar',
        type: 'warning'
    });
    if (!confirmed) return;
    currentEditingWorkout.exercises.splice(currentExerciseIndex, 1);
    try {
        if ((currentEditingWorkout.exercises || []).length === 0) {
            const deleteWorkout = await showConfirmDialog({
                title: 'Treino Vazio',
                message: 'O treino ficou vazio. Deseja excluir o treino inteiro?',
                confirmText: 'Excluir Treino',
                cancelText: 'Manter Vazio',
                type: 'danger'
            });
            if (deleteWorkout) {
                await supabase.from('workouts').delete().eq('id', currentEditingWorkout.id);
                showToast('Treino excluído com sucesso!', 'success');
            } else {
                await supabase.from('workouts').update({ exercises: [] }).eq('id', currentEditingWorkout.id);
                showToast('Treino atualizado', 'success');
            }
        } else {
            await supabase.from('workouts').update({ exercises: currentEditingWorkout.exercises }).eq('id', currentEditingWorkout.id);
            showToast('Exercício removido com sucesso!', 'success');
        }

        // Resetar modal antes de fechar
        resetExerciseModal();

        const modal = document.getElementById('exerciseModal');
        modal?.classList.add('hidden');
        await loadWorkouts();
    } catch (err) { console.error('Erro ao deletar exercício:', err); showToast('Erro ao deletar exercício: ' + err.message, 'error'); }
}

// Função para abrir modal de gerenciar exercícios salvos
function openManageExercisesModal() {
    const modal = document.getElementById('manageExercisesModal');
    const contentArea = document.getElementById('manageExercisesContent');
    const filterSelect = document.getElementById('manageExercisesFilter');
    if (!modal || !contentArea) return;

    // Identificar exercícios customizados (não presentes no catálogo original)
    const customExercises = {};

    for (const [group, exercises] of Object.entries(EXERCISE_CATALOG)) {
        const originalExercises = ORIGINAL_EXERCISE_CATALOG[group] || [];
        const custom = exercises.filter(ex => !originalExercises.includes(ex));
        if (custom.length > 0) {
            customExercises[group] = custom;
        }
    }

    // Popular select de filtro
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="all">Todas as Musculaturas</option>';
        Object.keys(customExercises).sort().forEach(group => {
            filterSelect.innerHTML += `<option value="${group}">${group}</option>`;
        });

        // Remover listeners antigos e adicionar novo
        const newFilterSelect = filterSelect.cloneNode(true);
        filterSelect.parentNode.replaceChild(newFilterSelect, filterSelect);
        newFilterSelect.addEventListener('change', () => renderManageExercisesList(customExercises, newFilterSelect.value));
    }

    // Renderizar lista inicial
    renderManageExercisesList(customExercises, 'all');
    modal.classList.remove('hidden');
}

// Função auxiliar para renderizar lista de exercícios com filtro
function renderManageExercisesList(customExercises, filter = 'all') {
    const contentArea = document.getElementById('manageExercisesContent');
    if (!contentArea) return;

    // Filtrar exercícios
    const filteredExercises = filter === 'all'
        ? customExercises
        : { [filter]: customExercises[filter] };

    // Renderizar lista de exercícios customizados
    if (Object.keys(filteredExercises).length === 0 || Object.values(filteredExercises).every(arr => arr.length === 0)) {
        contentArea.innerHTML = `
            <div class="text-center py-8 text-zinc-400">
                <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <p class="text-lg">Nenhum exercício customizado ${filter === 'all' ? 'salvo' : 'neste grupo'}</p>
                <p class="text-sm mt-2">Adicione exercícios personalizados durante o registro de treinos</p>
            </div>
        `;
    } else {
        let html = '<div class="space-y-4">';

        for (const [group, exercises] of Object.entries(filteredExercises)) {
            if (!exercises || exercises.length === 0) continue;

            html += `
                <div class="border border-zinc-700 rounded-lg p-4 bg-zinc-800/50">
                    <h3 class="font-semibold text-destaque mb-3 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                        </svg>
                        ${group}
                    </h3>
                    <div class="space-y-2">
            `;

            exercises.forEach(exercise => {
                html += `
                    <div class="flex items-center justify-between bg-zinc-900/50 rounded px-3 py-2 hover:bg-zinc-900 transition-colors">
                        <span class="text-zinc-200">${exercise}</span>
                        <button 
                            onclick="window.deleteCustomExercise('${group}', '${exercise}')"
                            class="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-900/20"
                            title="Remover exercício"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        html += '</div>';
        contentArea.innerHTML = html;
    }
}

// Função global para deletar exercício customizado
window.deleteCustomExercise = async function (group, exerciseName) {
    const confirmed = await showConfirmDialog({
        title: 'Remover Exercício',
        message: `Tem certeza que deseja remover "${exerciseName}" da lista de exercícios salvos?`,
        confirmText: 'Remover',
        cancelText: 'Cancelar',
        type: 'danger'
    });
    if (!confirmed) return;

    const exercises = EXERCISE_CATALOG[group];
    if (!exercises) return;

    const index = exercises.indexOf(exerciseName);
    if (index > -1) {
        // Deletar do Supabase
        const deleted = await deleteCustomExerciseFromSupabase(group, exerciseName);

        if (deleted) {
            // Remover do catálogo em memória
            exercises.splice(index, 1);
            showToast('Exercício removido com sucesso!', 'success');

            // Manter filtro atual e reabrir modal
            const filterSelect = document.getElementById('manageExercisesFilter');
            const currentFilter = filterSelect ? filterSelect.value : 'all';
            openManageExercisesModal();

            // Restaurar filtro
            if (filterSelect) {
                setTimeout(() => {
                    const newFilterSelect = document.getElementById('manageExercisesFilter');
                    if (newFilterSelect) newFilterSelect.value = currentFilter;
                }, 50);
            }

            // Atualizar selects de exercício se o modal de exercício estiver aberto
            const exerciseModal = document.getElementById('exerciseModal');
            if (exerciseModal && !exerciseModal.classList.contains('hidden')) {
                const mgSelect = document.getElementById('exerciseMuscleGroup');
                const exSelect = document.getElementById('exerciseNameSelect');
                if (mgSelect && exSelect && mgSelect.value === group) {
                    // Repovoar select de exercícios
                    exSelect.innerHTML = '<option value="">Selecione...</option>';
                    const groupExercises = EXERCISE_CATALOG[group] || [];
                    groupExercises.forEach(ex => {
                        exSelect.innerHTML += `<option value="${ex}">${ex}</option>`;
                    });
                    exSelect.innerHTML += '<option value="__outro__">Outro</option>';
                }
            }
        } else {
            showToast('Erro ao deletar exercício. Tente novamente.', 'error');
        }
    }
};

async function saveWorkoutAsTemplate(workout) {
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
        showToast('O treino precisa ter pelo menos um exercício para ser salvo como template.', 'warning');
        return;
    }

    const modal = document.getElementById('saveTemplateModal');
    const input = document.getElementById('saveTemplateNameInput');
    const confirmBtn = document.getElementById('confirmSaveTemplateBtn');
    const cancelBtn = document.getElementById('cancelSaveTemplateBtn');
    const closeBtn = document.getElementById('closeSaveTemplateModalBtn');

    if (!modal || !input || !confirmBtn) {
        console.error('Elementos do modal de salvar template não encontrados');
        return;
    }

    // Preencher nome sugerido
    input.value = workout.name + ' (Template)';

    // Abrir modal
    modal.classList.remove('hidden');

    // Focar no input e selecionar texto
    setTimeout(() => {
        input.focus();
        input.select();
    }, 100);

    // Função para fechar modal
    const closeModal = () => {
        modal.classList.add('hidden');
        input.value = '';
    };

    // Função para salvar
    const saveTemplate = async () => {
        const templateName = input.value.trim();
        if (!templateName) {
            showToast('Digite um nome para o template.', 'warning');
            input.focus();
            return;
        }

        try {
            const userResp = await supabase.auth.getUser();
            const currentUser = userResp?.data?.user;
            if (!currentUser) {
                showToast('Você precisa estar logado para salvar templates.', 'error');
                return;
            }

            const payload = {
                user_id: currentUser.id,
                name: templateName,
                exercises: workout.exercises
            };

            const { error } = await supabase.from('workout_templates').insert([payload]);
            if (error) throw error;

            showToast(`Template "${templateName}" salvo com sucesso!`, 'success');
            closeModal();
        } catch (err) {
            console.error('Erro ao salvar template:', err);
            showToast('Erro ao salvar template: ' + err.message, 'error');
        }
    };

    // Remover listeners anteriores
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

    // Adicionar novos listeners
    newConfirmBtn.addEventListener('click', saveTemplate);
    newCancelBtn.addEventListener('click', closeModal);
    newCloseBtn.addEventListener('click', closeModal);

    // Permitir Enter para confirmar
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveTemplate();
        }
    });
}

async function deleteWorkoutTemplate(templateId, templateName) {
    const confirmed = await showConfirmDialog({
        title: 'Excluir Template',
        message: `Tem certeza que deseja excluir o template "${templateName}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger'
    });
    if (!confirmed) return;

    try {
        const { error } = await supabase
            .from('workout_templates')
            .delete()
            .eq('id', templateId);

        if (error) throw error;

        showToast('Template excluído com sucesso!', 'success');

        // Recarregar lista de templates
        await useWorkoutTemplate();

    } catch (err) {
        console.error('Erro ao excluir template:', err);
        showToast('Erro ao excluir template: ' + err.message, 'error');
    }
}

async function useWorkoutTemplate() {
    try {
        const userResp = await supabase.auth.getUser();
        const currentUser = userResp?.data?.user;
        if (!currentUser) {
            showToast('Você precisa estar logado para usar templates.', 'error');
            return;
        }

        // Buscar templates do usuário
        const { data: templates, error } = await supabase
            .from('workout_templates')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const modal = document.getElementById('selectTemplateModal');
        const closeBtn = document.getElementById('closeSelectTemplateModalBtn');
        const templateList = document.getElementById('templateListContainer');
        const noTemplatesMsg = document.getElementById('noTemplatesMessage');

        if (!modal || !templateList || !noTemplatesMsg) {
            console.error('Elementos do modal de template não encontrados');
            return;
        }

        // Limpar lista anterior
        templateList.innerHTML = '';

        if (!templates || templates.length === 0) {
            templateList.classList.add('hidden');
            noTemplatesMsg.classList.remove('hidden');
        } else {
            templateList.classList.remove('hidden');
            noTemplatesMsg.classList.add('hidden');

            // Renderizar templates
            templates.forEach(template => {
                const exerciseCount = template.exercises?.length || 0;
                const templateCard = document.createElement('div');
                templateCard.className = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 transition group hover:border-destaque';
                templateCard.innerHTML = `
                    <div class="flex justify-between items-center gap-3">
                        <button class="flex-1 text-left template-select-btn">
                            <h4 class="text-white font-bold mb-1">${template.name}</h4>
                            <p class="text-zinc-400 text-sm">${exerciseCount} exercício${exerciseCount !== 1 ? 's' : ''}</p>
                        </button>
                        <div class="flex items-center gap-2">
                            <button class="template-delete-btn p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition" title="Excluir Template">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 6h18"/>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                            </button>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-500">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M9 6l6 6l-6 6" />
                            </svg>
                        </div>
                    </div>
                `;

                // Evento para selecionar template
                const selectBtn = templateCard.querySelector('.template-select-btn');
                selectBtn.addEventListener('click', async () => {
                    modal.classList.add('hidden');
                    await createWorkoutFromTemplate(template);
                });

                // Evento para excluir template
                const deleteBtn = templateCard.querySelector('.template-delete-btn');
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await deleteWorkoutTemplate(template.id, template.name);
                });

                templateList.appendChild(templateCard);
            });
        }

        // Configurar botão de fechar
        const closeHandler = () => {
            modal.classList.add('hidden');
        };
        closeBtn.removeEventListener('click', closeHandler);
        closeBtn.addEventListener('click', closeHandler);

        // Abrir modal
        modal.classList.remove('hidden');

    } catch (err) {
        console.error('Erro ao carregar templates:', err);
        showToast('Erro ao carregar templates: ' + err.message, 'error');
    }
}

async function createWorkoutFromTemplate(template) {
    const modal = document.getElementById('nameWorkoutFromTemplateModal');
    const closeBtn = document.getElementById('closeNameWorkoutFromTemplateModalBtn');
    const cancelBtn = document.getElementById('cancelNameWorkoutFromTemplateBtn');
    const confirmBtn = document.getElementById('confirmNameWorkoutFromTemplateBtn');
    const nameInput = document.getElementById('nameWorkoutFromTemplateInput');

    if (!modal || !nameInput) {
        console.error('Modal de nome do treino não encontrado');
        return;
    }

    // Preencher com nome sugerido
    nameInput.value = template.name.replace(' (Template)', '').replace('(Template)', '').trim();

    // Handlers
    const closeHandler = () => {
        modal.classList.add('hidden');
    };

    const confirmHandler = async () => {
        try {
            const userResp = await supabase.auth.getUser();
            const currentUser = userResp?.data?.user;
            if (!currentUser) {
                showToast('Você precisa estar logado para criar treinos.', 'error');
                return;
            }

            const workoutName = nameInput.value.trim();
            if (!workoutName) {
                showToast('Por favor, digite um nome para o treino.', 'warning');
                return;
            }

            const payload = {
                user_id: currentUser.id,
                date: getFormattedDateString(viewDate),
                name: workoutName,
                exercises: template.exercises
            };

            const res = await supabase.from('workouts').insert([payload]);
            if (res.error) throw res.error;

            modal.classList.add('hidden');
            showToast(`Treino "${workoutName}" criado com sucesso!`, 'success');
            await loadWorkouts();

        } catch (err) {
            console.error('Erro ao criar treino do template:', err);
            showToast('Erro ao criar treino: ' + err.message, 'error');
        }
    };

    // Remove listeners antigos
    closeBtn.removeEventListener('click', closeHandler);
    cancelBtn.removeEventListener('click', closeHandler);
    confirmBtn.removeEventListener('click', confirmHandler);

    // Adiciona novos listeners
    closeBtn.addEventListener('click', closeHandler);
    cancelBtn.addEventListener('click', closeHandler);
    confirmBtn.addEventListener('click', confirmHandler);

    // Abre o modal e foca no input
    modal.classList.remove('hidden');
    nameInput.focus();
    nameInput.select();
}

function clearEditingWorkout() {
    editingWorkoutId = null;
    localStorage.removeItem('track2lift_editing_id');
    // Esconder o botão de deletar ao limpar o estado de edição
    document.getElementById('deleteWorkoutBtn')?.classList.add('hidden');
}

function showWorkoutFormView() {
    const modal = document.getElementById('workoutSetupModal');
    if (!modal) {
        console.error('Modal workoutSetupModal não encontrado');
        return;
    }

    const closeBtn = document.getElementById('closeWorkoutSetupModalBtn');
    const createBtn = document.getElementById('createFromScratchBtn');
    const useTemplateBtn = document.getElementById('useSavedTemplateBtn');
    const buttonContainer = createBtn?.parentElement;
    const form = document.getElementById('createFromScratchForm');
    const confirmBtn = document.getElementById('confirmCreateWorkoutBtn');
    const nameInput = document.getElementById('newWorkoutNameInput');

    // Remove listeners antigos se existirem
    if (modal._closeHandler) closeBtn?.removeEventListener('click', modal._closeHandler);
    if (modal._createHandler) createBtn?.removeEventListener('click', modal._createHandler);
    if (modal._templateHandler) useTemplateBtn?.removeEventListener('click', modal._templateHandler);
    if (modal._confirmHandler) confirmBtn?.removeEventListener('click', modal._confirmHandler);

    // Cria novos handlers
    modal._closeHandler = () => {
        modal.classList.add('hidden');
        if (form) form.classList.add('hidden');
        if (buttonContainer) buttonContainer.classList.remove('hidden');
    };

    modal._templateHandler = async () => {
        modal.classList.add('hidden');
        await useWorkoutTemplate();
    };

    modal._createHandler = () => {
        if (buttonContainer) buttonContainer.classList.add('hidden');
        if (form) {
            form.classList.remove('hidden');
            nameInput?.focus();
        }
    };

    modal._confirmHandler = async () => {
        const userResp = await supabase.auth.getUser();
        const currentUser = userResp?.data?.user;
        if (!currentUser) {
            showToast('Você precisa estar logado para criar treinos.', 'error');
            return;
        }
        const name = (nameInput?.value || 'Treino A').trim() || 'Treino A';
        const payload = { user_id: currentUser.id, date: getFormattedDateString(viewDate), name, exercises: [] };
        try {
            const res = await supabase.from('workouts').insert([payload]);
            if (res.error) throw res.error;
            modal.classList.add('hidden');
            if (form) form.classList.add('hidden');
            if (buttonContainer) buttonContainer.classList.remove('hidden');
            showToast(`Treino "${name}" criado com sucesso!`, 'success');
            await loadWorkouts();
        } catch (err) {
            console.error('Erro ao criar treino:', err);
            showToast('Erro ao criar treino: ' + err.message, 'error');
        }
    };

    // Adiciona novos listeners
    closeBtn?.addEventListener('click', modal._closeHandler);
    createBtn?.addEventListener('click', modal._createHandler);
    useTemplateBtn?.addEventListener('click', modal._templateHandler);
    confirmBtn?.addEventListener('click', modal._confirmHandler);

    // Abre o modal (garante que os botões e form estão no estado inicial)
    if (buttonContainer) buttonContainer.classList.remove('hidden');
    if (form) form.classList.add('hidden');
    modal.classList.remove('hidden');
}

// Abre o modal de editar nome do treino
function openEditWorkoutNameModal(workout) {
    const modal = document.getElementById('editWorkoutNameModal');
    const input = document.getElementById('editWorkoutNameInput');
    if (!modal || !input) return;
    modal.dataset.workoutId = workout.id;
    input.value = workout.name || '';
    modal.classList.remove('hidden');
}

function initWorkoutModule() {
    // Carregar exercícios customizados do Supabase ao inicializar
    loadCustomExercises();

    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const saveWorkoutBtn = document.getElementById('saveWorkoutBtn');
    const exerciseListContainer = document.getElementById('exerciseListContainer');
    const goBackToDashboardBtn = document.getElementById('goBackToDashboardBtn');

    addExerciseBtn?.addEventListener('click', addExerciseBlock);
    saveWorkoutBtn?.addEventListener('click', saveWorkoutToSupabase);

    exerciseListContainer?.addEventListener('click', function (e) {
        if (e.target.closest('.add-set-btn')) addSetBlock(e.target.closest('.add-set-btn').previousElementSibling);
        if (e.target.closest('.remove-exercise-btn')) { const el = document.getElementById(e.target.closest('.remove-exercise-btn').dataset.target); if (el) el.remove(); }
        if (e.target.closest('.remove-set-btn')) {
            const row = e.target.closest('.remove-set-btn').closest('.set-row');
            const container = row.parentElement; row.remove();
            updateSetNumbers(container);
        }
    });

    goBackToDashboardBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (localStorage.getItem('track2lift_draft')) {
            const confirmed = await showConfirmDialog({
                title: 'Descartar Alterações',
                message: 'Você possui alterações não salvas. Tem certeza que deseja descartar?',
                confirmText: 'Descartar',
                cancelText: 'Continuar Editando',
                type: 'warning'
            });
            if (!confirmed) return;
        }
        localStorage.removeItem('track2lift_draft'); clearEditingWorkout();
        const dashboardTab = document.querySelector('.app-tab[data-tab="workouts"]');
        if (dashboardTab) dashboardTab.click();
    });

    // Date navigation for workouts
    const prevBtn = document.getElementById('prevWorkoutDateBtn');
    const nextBtn = document.getElementById('nextWorkoutDateBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => changeWorkoutDate(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeWorkoutDate(1));

    // Modal de Exercício: listeners (fechar, salvar, adicionar série, deletar)
    const exerciseModal = document.getElementById('exerciseModal');
    const closeExerciseModalBtn = document.getElementById('closeExerciseModalBtn');
    const modalAddSetBtn = document.getElementById('modalAddSetBtn');
    const modalSetsContainer = document.getElementById('modalSetsContainer');
    const modalSaveBtn = document.getElementById('modalSaveBtn');
    const modalDeleteBtn = document.getElementById('modalDeleteExerciseBtn');
    const manageExercisesBtn = document.getElementById('manageExercisesBtn');
    const manageExercisesModal = document.getElementById('manageExercisesModal');
    const closeManageExercisesBtn = document.getElementById('closeManageExercisesBtn');

    closeExerciseModalBtn?.addEventListener('click', () => {
        // Resetar modal ao fechar
        resetExerciseModal();
        exerciseModal?.classList.add('hidden');
    });
    modalAddSetBtn?.addEventListener('click', () => { if (modalSetsContainer) { modalSetsContainer.insertAdjacentHTML('beforeend', renderModalSetRow({}, modalCurrentType)); updateModalSetNumbers(modalSetsContainer); } });
    modalSaveBtn?.addEventListener('click', async () => { await saveExerciseFromModal(); });
    modalDeleteBtn?.addEventListener('click', async () => { await deleteExerciseFromModal(); });

    // Abrir modal de gerenciar exercícios
    manageExercisesBtn?.addEventListener('click', () => { openManageExercisesModal(); });
    closeManageExercisesBtn?.addEventListener('click', () => { manageExercisesModal?.classList.add('hidden'); });

    // Delegation: remover linhas de sets dentro do modal
    modalSetsContainer?.addEventListener('click', (e) => {
        if (e.target.closest('.remove-modal-set-btn')) {
            const row = e.target.closest('.modal-set-row'); if (row) { row.remove(); updateModalSetNumbers(modalSetsContainer); }
        }
    });

    // Delete workout button (apenas disponível em modo edição)
    document.getElementById('deleteWorkoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (editingWorkoutId) {
            const confirmed = await showConfirmDialog({
                title: 'Excluir Treino',
                message: 'Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                type: 'danger'
            });
            if (!confirmed) return;

            await supabase.from('workouts').delete().eq('id', editingWorkoutId);
            clearEditingWorkout();
            showToast('Treino excluído com sucesso!', 'success');
            // mostra dashboard e recarrega
            const dashboardView = document.getElementById('dashboardView');
            const workoutFormView = document.getElementById('workoutFormView');
            if (workoutFormView) workoutFormView.classList.add('hidden');
            if (dashboardView) dashboardView.classList.remove('hidden');
            await loadWorkouts();
        }
    });

    // Inicializa modal de editar nome do treino (save / delete / close)
    const editNameModal = document.getElementById('editWorkoutNameModal');
    if (editNameModal && editNameModal.dataset.init !== '1') {
        editNameModal.dataset.init = '1';
        const saveBtn = document.getElementById('editWorkoutNameSaveBtn');
        const closeBtn = document.getElementById('closeEditWorkoutNameModalBtn');
        const input = document.getElementById('editWorkoutNameInput');

        closeBtn?.addEventListener('click', () => { editNameModal.classList.add('hidden'); });

        saveBtn?.addEventListener('click', async () => {
            const id = editNameModal.dataset.workoutId;
            if (!id) {
                showToast('Erro: ID do treino não encontrado', 'error');
                return;
            }
            const newName = (input?.value || '').trim() || 'Treino';
            try {
                const res = await supabase.from('workouts').update({ name: newName }).eq('id', id);
                if (res.error) throw res.error;
                editNameModal.classList.add('hidden');
                showToast('Nome do treino atualizado!', 'success');
                await loadWorkouts();
            } catch (err) {
                showToast('Erro ao atualizar nome: ' + err.message, 'error');
            }
        });
    }
}

function showDashboardView() {
    const dashboardView = document.getElementById('dashboardView');
    const workoutFormView = document.getElementById('workoutFormView');
    if (workoutFormView) workoutFormView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.remove('hidden');
    clearEditingWorkout();
    const dashboardTab = document.querySelector('.app-tab[data-tab="workouts"]');
    if (dashboardTab) dashboardTab.click();
}

export { initWorkoutModule, loadWorkouts, loadWorkoutForEditing, addExerciseBlock, addSetBlock, updateSetNumbersWrapper as updateSetNumbers, saveWorkoutToSupabase, loadWorkoutDraft, showWorkoutFormView, clearEditingWorkout, viewDate, getFormattedDateString, updateWorkoutDateDisplay, changeWorkoutDate };
