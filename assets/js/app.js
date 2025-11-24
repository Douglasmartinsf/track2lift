/*
=================================================
=== 🚀 App Navigation & Workout Logger Logic ===
=================================================
*/
// ===============================
// === Supabase Edition SPA Logic ===
// ===============================
(function () {
    // --- Configuração Pública do Supabase (embed pública) ---
    // Estes valores são públicos (chave anon) e usados para permitir operações básicas do frontend.
    const SUPABASE_URL = "https://qxyazvgwlenprvmbjehr.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eWF6dmd3bGVucHJ2bWJqZWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjYwMjcsImV4cCI6MjA3ODY0MjAyN30.gDpxBscKUbLK9IlR3lqH7Wuh3_IdFPG6uPCEQ-dIYZI";

    // --- Inicialização do Supabase ---
    let supabase;
    try {
        const { createClient } = window['@supabase/supabase-js'] || window.supabase || {};
        if (typeof createClient === 'function') {
            supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        } else if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        } else {
            throw new Error('Supabase client não disponível. Verifique se o CDN foi carregado.');
        }

        // --- LINHA NOVA: Permite debug no Console ---
        window.supabase = supabase;
        // -------------------------------------------
    } catch (e) {
        console.error("Erro ao inicializar Supabase. Verifique o CDN.", e);
        const authMessage = document.getElementById('authMessage');
        if (authMessage) {
            authMessage.textContent = "Erro crítico ao carregar o app. Verifique o console.";
            authMessage.style.color = "#DC2626";
        }
        return;
    }

    // appTabs binding moved to header/tab logic at the end of the file

    // --- FUNÇÃO AUXILIAR PARA O MENU CENTRAL (Correção de Sobreposição) ---
    // mode: 'public' | 'app' | 'none'
    function setHeaderNavVisibility(mode) {
        // 1. Reseta (Esconde TUDO primeiro)
        if (publicNavMenu) {
            publicNavMenu.classList.add('hidden');
            publicNavMenu.classList.remove('md:flex');
        }
        if (appNavMenu) {
            appNavMenu.classList.add('hidden');
            appNavMenu.classList.remove('md:flex');
        }

        // 2. Ativa apenas o necessário
        if (mode === 'public') {
            publicNavMenu?.classList.remove('hidden');
            publicNavMenu?.classList.add('md:flex');
        } else if (mode === 'app') {
            appNavMenu?.classList.remove('hidden');
            appNavMenu?.classList.add('md:flex');
        }
    }

    // --- Validação de Configuração (Apenas para Gemini local) ---
    if (!window.APP_CONFIG || !window.APP_CONFIG.GEMINI_API_KEY) {
        console.warn("Aviso: config.js não encontrado ou GEMINI_API_KEY faltando. A demo de IA pode falhar localmente.");
    }

    // ============================================================
    // === 1. DECLARAÇÃO DE TODAS AS VARIÁVEIS GLOBAIS DO APP ===
    // ============================================================
    // === 1. DECLARAÇÃO DE TODAS AS VARIÁVEIS GLOBAIS DO APP ===
    // ============================================================

    // Containers de Página
    const landingPageContainer = document.getElementById('landingPageContainer');
    const appContainer = document.getElementById('appContainer');
    const authContainer = document.getElementById('authContainer');
    const changePasswordContainer = document.getElementById('changePasswordContainer');
    const accountSettingsContainer = document.getElementById('accountSettingsContainer'); // Settings
    const onboardingContainer = document.getElementById('onboardingContainer'); // Onboarding

    // Header e Navegação
    const headerNavMenu = document.querySelector('nav');
    const headerCtaButton = document.querySelector('header .cta-button');
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const logoLink = document.querySelector('header a[aria-label="TRACK2LIFT"]');
    const logoutButton = document.getElementById('logoutButton');
    const siteFooter = document.querySelector('footer'); // Footer

    // Menus do Header
    const publicNavMenu = document.getElementById('publicNavMenu');
    const appNavMenu = document.getElementById('appNavMenu');

    const publicAuthButtons = document.getElementById('publicAuthButtons');
    const loggedUserMenu = document.getElementById('loggedUserMenu');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    // Itens do Dropdown
    const menuGoToApp = document.getElementById('menuGoToApp');
    const menuAccountSettings = document.getElementById('menuAccountSettings');
    const menuChangePassword = document.getElementById('menuChangePassword');
    const menuLogout = document.getElementById('menuLogout');

    // Views do App
    const dashboardView = document.getElementById('dashboardView');
    const workoutFormView = document.getElementById('workoutFormView');

    // Dashboard (Abas e Dieta)
    const userNameDisplay = document.getElementById('userNameDisplay');
    // Tenta pegar .app-tab (novo) ou fallback seguro
    const appTabs = document.querySelectorAll('.app-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    const appDietIngredients = document.getElementById('appDietIngredients');
    const generateDietBtn = document.getElementById('generateDietBtn');
    const appDietResult = document.getElementById('appDietResult');
    const dietContent = document.getElementById('dietContent');
    const dietPlaceholder = document.getElementById('dietPlaceholder');

    // Dieta & Calculadora
    const dietTargetCal = document.getElementById('dietTargetCal');
    const dietBMR = document.getElementById('dietBMR');
    const dietTDEE = document.getElementById('dietTDEE');
    const dietGoalLabel = document.getElementById('dietGoalLabel');
    const dietConsumedCal = document.getElementById('dietConsumedCal');
    const dietProgressBar = document.getElementById('dietProgressBar');
    const dietConsumedProt = document.getElementById('dietConsumedProt');
    const dietConsumedCarb = document.getElementById('dietConsumedCarb');
    const dietConsumedFat = document.getElementById('dietConsumedFat');
    const saveGeneratedMealBtn = document.getElementById('saveGeneratedMealBtn');
    const dietLogList = document.getElementById('dietLogList');
    const addCustomMealBtn = document.getElementById('addCustomMealBtn');

    let currentGeneratedMeal = null; // Para guardar o que a IA gerou antes de salvar
    let dailyTarget = 2000; // Valor padrão

    // Onboarding (ESTES ESTAVAM FALTANDO!)
    const onboardingName = document.getElementById('onboardingName');
    const onboardingForm = document.getElementById('onboardingForm');
    const finishOnboardingBtn = document.getElementById('finishOnboardingBtn');
    const onboardingErrorMsg = document.getElementById('onboardingErrorMsg');

    // Settings Form
    const settingsName = document.getElementById('settingsName');
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsAge = document.getElementById('settingsAge');
    const settingsWeight = document.getElementById('settingsWeight');
    const settingsHeight = document.getElementById('settingsHeight');
    const settingsGoal = document.getElementById('settingsGoal');
    const settingsNewPassword = document.getElementById('settingsNewPassword');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const settingsMsg = document.getElementById('settingsMsg');

    // Elementos do Formulário de Treino
    const showWorkoutFormBtn = document.getElementById('showWorkoutFormBtn');
    const savedWorkoutsList = document.getElementById('savedWorkoutsList');
    const noWorkoutsMessage = document.getElementById('noWorkoutsMessage');

    const goBackToDashboardBtn = document.getElementById('goBackToDashboardBtn');
    const workoutDateInput = document.getElementById('workoutDate');
    const workoutNameInput = document.getElementById('workoutName');
    const exerciseListContainer = document.getElementById('exerciseListContainer');
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const saveWorkoutBtn = document.getElementById('saveWorkoutBtn');

    // Auth (Login/Signup/Recovery)
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const recoveryForm = document.getElementById('recoveryForm'); // Recovery
    const authToggleButton = document.getElementById('authToggleButton');
    const authToggleText = document.getElementById('authToggleText');
    const authErrorMsg = document.getElementById('authErrorMsg');
    const authFooter = document.getElementById('authFooter');
    const authMessage = document.getElementById('authMessage');

    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const recoveryButton = document.getElementById('recoveryButton');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    const signupSuccessMessage = document.getElementById('signupSuccessMessage');
    const backToLoginFromSuccess = document.getElementById('backToLoginFromSuccess');

    // Tela de Senha (Reset)
    const newPasswordInput = document.getElementById('newPasswordInput');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const passwordMsg = document.getElementById('passwordMsg');

    // Variáveis de Estado
    let exerciseCounter = 0;
    let currentUser = null;
    let editingWorkoutId = null;
    let cachedMuscleSvg = null;

    // --- CATÁLOGO DE EXERCÍCIOS (GRANULAR) ---
    const EXERCISE_CATALOG = {
        "Peito": ["Supino Reto (Barra)", "Supino Inclinado (Halteres)", "Crucifixo", "Crossover", "Flexão de Braço", "Supino Máquina", "Voador"],
        "Costas": ["Puxada Alta", "Remada Curvada", "Remada Baixa", "Levantamento Terra", "Barra Fixa", "Pulldown", "Serrote"],
        "Ombros": ["Desenvolvimento Militar", "Elevação Lateral", "Elevação Frontal", "Crucifixo Inverso", "Remada Alta", "Arnold Press"],

        // BRAÇOS DIVIDIDOS
        "Bíceps": ["Rosca Direta", "Rosca Martelo", "Rosca Scott", "Rosca Concentrada", "Rosca Alternada"],
        "Tríceps": ["Tríceps Corda", "Tríceps Testa", "Tríceps Francês", "Tríceps Pulley", "Tríceps Coice", "Mergulho"],
        "Antebraço": ["Rosca Inversa", "Flexão de Punho", "Extensão de Punho"],

        // PERNAS DIVIDIDAS
        "Quadríceps": ["Agachamento Livre", "Leg Press 45", "Cadeira Extensora", "Agachamento Búlgaro", "Afundo", "Hack Squat"],
        "Posterior": ["Mesa Flexora", "Cadeira Flexora", "Stiff", "Bom Dia", "Elevação Pélvica"],
        "Panturrilha": ["Panturrilha em Pé", "Panturrilha Sentado", "Burrinho"],

        "Abdômen": ["Abdominal Supra", "Prancha", "Elevação de Pernas", "Abdominal Remador"],
        "Cardio": ["Esteira", "Bicicleta", "Elíptico", "Escada"]
    };

    // --- Lógica Inteligente de Categorização (Atualizada) ---
    function identifyMuscleGroup(exerciseName) {
        if (!exerciseName) return null;

        const lowerName = exerciseName.toLowerCase();

        // 1. Busca Exata
        for (const [group, exercises] of Object.entries(EXERCISE_CATALOG)) {
            const match = exercises.find(ex => ex.toLowerCase() === lowerName);
            if (match) return { group: group, exactMatch: true, correctName: match };
        }

        // 2. Ambiguidades
        if (lowerName.includes('crucifixo')) {
            if (lowerName.includes('inverso') || lowerName.includes('reverso')) return { group: 'Ombros', exactMatch: false };
            return { group: 'Peito', exactMatch: false };
        }

        // 3. Palavras-Chave GRANULARES
        const keywords = {
            'Peito': ['supino', 'flexão', 'flexao', 'crossover', 'peck', 'voador', 'chest', 'peitoral'],
            'Costas': ['remada', 'puxada', 'barra', 'pulldown', 'dorsal', 'back', 'terra', 'lombar', 'serrote'],
            'Ombros': ['desenvolvimento', 'elevação lateral', 'elevacao lateral', 'frontal', 'militar', 'arnold', 'ombro', 'deltoide'],

            // Braços
            'Bíceps': ['rosca', 'biceps', 'bíceps', 'scott', 'concentrada'],
            'Tríceps': ['triceps', 'tríceps', 'testa', 'frances', 'francês', 'corda', 'coice', 'mergulho', 'pulley'],
            'Antebraço': ['punho', 'inversa', 'antebraço', 'antebraco'],

            // Pernas
            'Quadríceps': ['agachamento', 'leg', 'extensora', 'búlgaro', 'bulgaro', 'hack', 'sissy', 'quadriceps'],
            'Posterior': ['flexora', 'stiff', 'sumo', 'elevacao pelvica', 'elevação pélvica', 'gluteo', 'glúteo', 'posterior'],
            'Panturrilha': ['panturrilha', 'gemeos', 'gêmeos', 'sóleo'],

            'Abdômen': ['abdominal', 'abdominais', 'prancha', 'infra', 'supra', 'obliquo', 'abs'],
            'Cardio': ['esteira', 'corrida', 'caminhada', 'bike', 'bicicleta', 'eliptico', 'elíptico', 'escada']
        };

        for (const [group, terms] of Object.entries(keywords)) {
            if (terms.some(term => lowerName.includes(term))) {
                return { group: group, exactMatch: false };
            }
        }

        return null;
    }

    // --- MAPEAMENTO DE MUSCULATURA SVG (IDS EXATOS DO SEU ARQUIVO) ---
    const MUSCLE_SVG_MAP = {
        // Chave do App : IDs do Grupo <g> no SVG
        'Peito': ['Peito'],
        'Costas': ['Costas'],
        'Ombros': ['Ombro'],

        'Bíceps': ['Biceps'],
        'Tríceps': ['Triceps'],
        'Antebraço': ['Antebraço'], // Atenção ao ç

        'Quadríceps': ['Quadriceps'],
        'Posterior': ['Posterior'],
        'Panturrilha': ['Panturrilha'],

        'Abdômen': ['Abdomen'],
        'Cardio': ['Contorno'], // Cardio destaca o corpo todo
        'Geral': ['Contorno']
    };

    // BODY_SVG_TEMPLATE removed: SVG is now loaded from `assets/img/muscle.svg` and cached in `cachedMuscleSvg`.

    // --- GERADOR DE SVG DINÂMICO (Usa o SVG carregado externamente) ---
    function getBodyWatermark(activeGroups, svgContent) {
        if (!svgContent) return ''; // Segurança

        const colorActive = "#DC2626"; // Vermelho Destaque
        const opacityActive = "0.8";
        const colorInactive = "currentColor";
        const opacityInactive = "0.05";
        // Contorno sempre visível, porém mais sutil quando não for o foco
        const opacityContorno = "0.35";
        // Cor cinza usada quando existe um músculo selecionado (para destacar o ativo)
        const grayColor = "#9ca3af"; // equivalente ao zinc-400
        const grayOpacity = "0.35";

        // 1. Identifica Grupos Ativos
        let activeIds = [];
        activeGroups.forEach(group => {
            if (MUSCLE_SVG_MAP[group]) {
                activeIds = [...activeIds, ...MUSCLE_SVG_MAP[group]];
            }
        });

        // 2. Parse do Template (Usa o conteúdo baixado)
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, "image/svg+xml");
        const svgElement = doc.documentElement;

        // Detecta se há algum músculo ativo diferente do Contorno
        const hasNonContornoActive = activeIds.some(id => id && id !== 'Contorno');

        // 3. Limpa TUDO primeiro (Fase de Reset)
        const allGroups = svgElement.querySelectorAll('g[id]');

        allGroups.forEach(g => {
            // Ignora grupos estruturais principais para não sumir com o desenho todo
            if (g.id === 'Full-body' || g.id === 'camada_corpo') return;

            const isContorno = g.id === 'Contorno';

            // Se for o contorno, já aplica a cor de destaque, porém com opacidade mais baixa
            // Se houver um músculo ativo (ex: Peito), as demais partes (exceto Contorno e o ativo)
            // recebem uma cor cinza suave para não sumirem no fundo.
            let fillColor;
            let fillOpacity;

            if (isContorno) {
                fillColor = colorActive;
                fillOpacity = opacityContorno;
            } else if (hasNonContornoActive) {
                // Existe um músculo selecionado: aplica cinza às partes não-ativas
                fillColor = grayColor;
                fillOpacity = grayOpacity;
            } else {
                // Estado padrão (nenhum músculo específico destacado)
                fillColor = colorInactive;
                fillOpacity = opacityInactive;
            }

            const paths = g.querySelectorAll('path');
            paths.forEach(path => {
                path.style.fill = fillColor;
                path.style.fillOpacity = fillOpacity;
                path.removeAttribute('fill');
                // Reseta filtros ou estilos inline que possam existir no arquivo original
                path.style.filter = 'none';
            });
        });

        // 4. Ativa os Músculos Selecionados
        activeIds.forEach(id => {
            const group = doc.getElementById(id);
            if (group) {
                const paths = group.querySelectorAll('path');
                paths.forEach(path => {
                    // Se o grupo ativo for o próprio Contorno, torna-o totalmente ativo;
                    // caso contrário, aplica destaque normal aos músculos selecionados.
                    if (id === 'Contorno') {
                        path.style.fill = colorActive;
                        path.style.fillOpacity = opacityActive;
                    } else {
                        path.style.fill = colorActive;
                        path.style.fillOpacity = opacityActive;
                    }
                });
            }
        });

        return new XMLSerializer().serializeToString(svgElement);
    }

    // --- Lógica de Auto-Save (Rascunho) ---
    function saveWorkoutDraft() {
        const workoutData = {
            date: workoutDateInput.value,
            name: workoutNameInput.value,
            exercises: []
        };

        const exerciseBlocks = exerciseListContainer.querySelectorAll('.exercise-block');
        exerciseBlocks.forEach(block => {
            const exerciseName = getExerciseNameFromBlock(block);
            const isCardio = block.dataset.type === 'cardio';
            const exercise = { name: exerciseName, type: isCardio ? 'cardio' : 'strength', sets: [] };

            const setRows = block.querySelectorAll('.set-row');
            setRows.forEach(row => {
                if (isCardio) {
                    const durationEl = row.querySelector('.duration-input');
                    const duration = durationEl ? durationEl.value : '';
                    exercise.sets.push({ duration: duration || 0 });
                } else {
                    const repsEl = row.querySelector('.reps-input');
                    const weightEl = row.querySelector('.weight-input');
                    const reps = repsEl ? repsEl.value : '';
                    const weight = weightEl ? weightEl.value : '';
                    exercise.sets.push({ reps, weight });
                }
            });

            workoutData.exercises.push(exercise);
        });

        localStorage.setItem('track2lift_draft', JSON.stringify(workoutData));
    }

    function loadWorkoutDraft() {
        const draftJSON = localStorage.getItem('track2lift_draft');
        if (!draftJSON) return false;

        try {
            const draft = JSON.parse(draftJSON);

            // Restaura cabeçalho
            workoutDateInput.value = draft.date;
            workoutNameInput.value = draft.name;

            // Limpa lista atual para evitar duplicação
            exerciseListContainer.innerHTML = '';
            exerciseCounter = 0;

            // Reconstrói exercícios e séries usando selects + input custom
            draft.exercises.forEach(exData => {
                addExerciseBlock(); // Cria o bloco HTML

                // Pega o último bloco criado (o que acabamos de adicionar)
                const currentBlock = exerciseListContainer.lastElementChild;

                const muscleSelect = currentBlock.querySelector('.muscle-group-select');
                const exerciseSelect = currentBlock.querySelector('.exercise-select');
                const customInput = currentBlock.querySelector('.custom-exercise-input');
                const setsContainer = currentBlock.querySelector('.sets-container');

                // Usa a função de identificação de grupo para decidir comportamento
                const res = identifyMuscleGroup(exData.name);
                if (res) {
                    muscleSelect.value = res.group;
                    muscleSelect.dispatchEvent(new Event('change'));

                    if (res.exactMatch) {
                        // Usa o nome formatado do catálogo para garantir correspondência
                        exerciseSelect.value = res.correctName;
                        if (!exerciseSelect.value) {
                            exerciseSelect.value = 'custom_option';
                            exerciseSelect.dispatchEvent(new Event('change'));
                            customInput.value = exData.name;
                        } else {
                            customInput.value = res.correctName;
                        }
                    } else {
                        exerciseSelect.value = 'custom_option';
                        exerciseSelect.dispatchEvent(new Event('change'));
                        customInput.value = exData.name;
                    }
                } else {
                    // Não identificado: guarda temporariamente para recuperação quando o usuário escolher
                    currentBlock.dataset.tempName = exData.name;
                }

                // Recria as séries salvas
                setsContainer.innerHTML = '';
                exData.sets.forEach(setData => {
                    addSetBlock(setsContainer);
                    const currentSet = setsContainer.lastElementChild;
                    // Se o dado salvo tem 'duration', é cardio
                    if (setData.duration !== undefined) {
                        const strengthDiv = currentSet.querySelector('.inputs-strength');
                        const cardioDiv = currentSet.querySelector('.inputs-cardio');
                        if (strengthDiv && cardioDiv) {
                            strengthDiv.classList.add('hidden');
                            cardioDiv.classList.remove('hidden');
                        }
                        const durationEl = currentSet.querySelector('.duration-input');
                        if (durationEl) durationEl.value = setData.duration;
                        // Marca o bloco pai também
                        currentBlock.dataset.type = 'cardio';
                    } else {
                        const repsEl = currentSet.querySelector('.reps-input');
                        const weightEl = currentSet.querySelector('.weight-input');
                        if (repsEl) repsEl.value = setData.reps;
                        if (weightEl) weightEl.value = setData.weight;
                    }
                });
            });
            return true;
        } catch (e) {
            console.error("Erro ao restaurar rascunho", e);
            return false;
        }
    }

    // ============================================================
    // === FUNÇÕES DE NAVEGAÇÃO (ROTEAMENTO) - BLOCO COMPLETO ===
    // ============================================================

    function updateHeaderState() {
        if (currentUser) {
            // Usuário LOGADO
            publicAuthButtons?.classList.add('hidden');
            loggedUserMenu?.classList.remove('hidden');

            if (userEmailDisplay) {
                const displayName = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
                userEmailDisplay.textContent = displayName;
            }

            headerNavMenu?.classList.remove('hidden');
            headerNavMenu?.classList.add('md:flex');
        } else {
            // Usuário DESLOGADO
            publicAuthButtons?.classList.remove('hidden');
            loggedUserMenu?.classList.add('hidden');
        }
    }

    // ============================================================
    // === SISTEMA DE ROTEAMENTO E HEADER INTELIGENTE ===
    // ============================================================

    function showLandingPage() {
        // 1. Visibilidade dos Containers
        landingPageContainer?.classList.remove('hidden');
        appContainer?.classList.add('hidden');
        authContainer?.classList.add('hidden');
        accountSettingsContainer?.classList.add('hidden');

        // 2. Configuração do Header
        headerNavMenu?.classList.remove('hidden');     // Mostra a barra do header
        headerNavMenu?.classList.add('md:flex');
        mobileMenuButton?.classList.remove('hidden');  // Mostra botão mobile

        // MODO PÚBLICO: Mostra links (Recursos, IA...)
        setHeaderNavVisibility('public');

        // Mostra botão "Ir para App" se estiver logado
        menuGoToApp?.classList.remove('hidden');
        if (menuGoToApp) menuGoToApp.parentElement.classList.remove('hidden');

        if (siteFooter) siteFooter.classList.remove('hidden');
        updateHeaderState();
        window.scrollTo(0, 0);
    }

    function showAppPage() {
        // 1. Visibilidade dos Containers
        landingPageContainer?.classList.add('hidden');
        appContainer?.classList.remove('hidden');
        authContainer?.classList.add('hidden');
        accountSettingsContainer?.classList.add('hidden');

        // 2. Configuração do Header
        headerNavMenu?.classList.remove('hidden');     // Barra visível
        headerNavMenu?.classList.add('md:flex');
        mobileMenuButton?.classList.add('hidden');     // Sem menu mobile no app

        // MODO APP: Mostra as abas (Treinos, Dieta) no header
        setHeaderNavVisibility('app');

        // Esconde botão "Ir para App" (já estamos nele)
        menuGoToApp?.classList.add('hidden');

        // 3. Lógica de Dados
        if (localStorage.getItem('track2lift_draft')) {
            if (typeof showWorkoutFormView === 'function') showWorkoutFormView();
        } else {
            if (typeof showDashboardView === 'function') showDashboardView();
        }

        // 5. VERIFICAÇÃO DE ONBOARDING
        if (currentUser && !currentUser.user_metadata?.goal) {
            if (typeof showOnboardingPage === 'function') showOnboardingPage();
            return;
        }

        // --- IMPORTANTE: CALCULA A DIETA AO ENTRAR ---
        calculateDietTargets();
        // ---------------------------------------------

        if (typeof loadDietLogs === 'function') loadDietLogs();

        // Ensure footer visible when leaving onboarding
        if (siteFooter) siteFooter.classList.remove('hidden');
        updateHeaderState();
        window.scrollTo(0, 0);
    }

    function showAccountSettingsPage() {
        // Esconde tudo, mostra settings
        landingPageContainer?.classList.add('hidden');
        appContainer?.classList.add('hidden');
        authContainer?.classList.add('hidden');
        accountSettingsContainer?.classList.remove('hidden'); // NOVO ID

        // Header: Sem menu de seções, com botão de voltar
        setHeaderNavVisibility('none');
        if (menuGoToApp) menuGoToApp.parentElement.classList.remove('hidden');
        mobileMenuButton?.classList.add('hidden');

        updateHeaderState();
        window.scrollTo(0, 0);

        // --- CARREGA DADOS ATUAIS NOS INPUTS ---
        if (currentUser) {
            if (settingsName) settingsName.value = currentUser.user_metadata?.name || '';
            if (settingsEmail) settingsEmail.value = currentUser.email || '';
            if (settingsNewPassword) settingsNewPassword.value = '';
            if (settingsMsg) settingsMsg.textContent = '';
            if (settingsAge) settingsAge.value = currentUser.user_metadata?.age || '';
            if (settingsWeight) settingsWeight.value = currentUser.user_metadata?.weight || '';
            if (settingsHeight) settingsHeight.value = currentUser.user_metadata?.height || '';
            if (settingsGoal) settingsGoal.value = currentUser.user_metadata?.goal || '';
        }
    }

    // NOVA FUNÇÃO: Mostrar Tela de Onboarding (Versão Simplificada)
    async function showOnboardingPage() {
        // 1. Oculta outras telas
        const views = [landingPageContainer, appContainer, authContainer, changePasswordContainer, accountSettingsContainer];
        views.forEach(el => el?.classList.add('hidden'));

        // 2. Mostra Onboarding
        if (onboardingContainer) onboardingContainer.classList.remove('hidden');

        // 3. Esconde Header/Footer
        if (headerNavMenu) {
            headerNavMenu.classList.add('hidden');
            headerNavMenu.classList.remove('md:flex');
        }
        if (siteFooter) siteFooter.classList.add('hidden');

        // 4. DEFINE O NOME (Lógica Direta)
        const nameSpan = document.getElementById('onboardingName');

        if (nameSpan) {
            // Garante que temos um usuário
            let user = currentUser;

            // Se a variável global estiver vazia, busca do Supabase agora
            if (!user) {
                try {
                    const { data } = await supabase.auth.getUser();
                    user = data.user;
                } catch (e) {
                    console.warn('Erro ao buscar usuário para onboarding:', e);
                }
            }

            if (user) {
                // Tenta pegar nome, depois nome completo, depois email, depois 'Atleta'
                const meta = user.user_metadata || {};
                let displayName = meta.name || meta.full_name || user.email?.split('@')[0] || "Atleta";

                // Formata (Primeira letra maiúscula)
                displayName = displayName.toString();
                displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

                nameSpan.textContent = displayName;
            } else {
                // Se não tiver usuário logado (erro bizarro), mantém o padrão
                nameSpan.textContent = "Atleta";
            }
        }
    }

    function showAuthPage() {
        // 1. Visibilidade dos Containers
        landingPageContainer?.classList.add('hidden');
        appContainer?.classList.add('hidden');
        authContainer?.classList.remove('hidden');
        accountSettingsContainer?.classList.add('hidden');

        // 2. Configuração do Header (SUMIR COM TUDO)
        headerNavMenu?.classList.add('hidden');
        headerNavMenu?.classList.remove('md:flex');
        headerCtaButton?.classList.add('hidden');
        mobileMenuButton?.classList.add('hidden');

        // 3. Esconde o footer na tela de login
        if (siteFooter) siteFooter.classList.add('hidden');

        window.scrollTo(0, 0);
    }

    function showDashboardView() {
        dashboardView?.classList.remove('hidden');
        workoutFormView?.classList.add('hidden');
        loadWorkouts();
    }

    async function showWorkoutFormView() {
        dashboardView?.classList.add('hidden');
        workoutFormView?.classList.remove('hidden');

        // Tenta recuperar o ID de edição
        const storedEditingId = localStorage.getItem('track2lift_editing_id');
        if (storedEditingId) {
            editingWorkoutId = storedEditingId;
            saveWorkoutBtn.textContent = "Atualizar Treino";

            // Muda texto para Cancelar Edição
            const cancelTextSpan = goBackToDashboardBtn.querySelector('span');
            if (cancelTextSpan) cancelTextSpan.innerHTML = "&times; Cancelar Edição";

            // Tenta buscar o treino do Supabase para preencher o formulário
            try {
                const { data: wk, error: wkErr } = await supabase.from('workouts').select('*').eq('id', storedEditingId).single();
                if (wkErr) throw wkErr;
                if (wk) {
                    // Usa a função existente para preencher o formulário
                    loadWorkoutForEditing(wk);
                    return; // Já populamos o formulário
                }
            } catch (err) {
                console.warn('Não foi possível restaurar a edição a partir do servidor:', err);
                // Se falhar, continuamos e permitimos o uso do rascunho/local
            }
        } else {
            // Se não é edição, garante texto padrão
            editingWorkoutId = null;
            saveWorkoutBtn.textContent = "Salvar Treino";
            const cancelTextSpan = goBackToDashboardBtn.querySelector('span');
            if (cancelTextSpan) cancelTextSpan.innerHTML = "&times; Cancelar Treino";
        }

        const hasDraft = localStorage.getItem('track2lift_draft');

        if (hasDraft) {
            loadWorkoutDraft();
        } else if (!storedEditingId) {
            // Só limpa se NÃO estivermos restaurando uma edição (e não tiver rascunho)
            exerciseListContainer.innerHTML = '';
            exerciseCounter = 0;
            addExerciseBlock();
            if (workoutDateInput) workoutDateInput.valueAsDate = new Date();
            if (workoutNameInput) workoutNameInput.value = '';
        }
    }

    // Atualiza estado do header apenas para login/logout (não controla visibilidade de seções)
    function updateHeaderState() {
        if (currentUser) {
            // Usuário LOGADO: Mostra menu de usuário, esconde botão de login
            publicAuthButtons?.classList.add('hidden');
            loggedUserMenu?.classList.remove('hidden');

            if (userEmailDisplay) {
                const displayName = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
                userEmailDisplay.textContent = displayName;
            }

            // Garante que o container pai do menu esteja visível (para mostrar o dropdown)
            headerNavMenu?.classList.remove('hidden');
            headerNavMenu?.classList.add('md:flex'); // Garante layout correto

        } else {
            // Usuário DESLOGADO: Mostra botão de login, esconde menu de usuário
            publicAuthButtons?.classList.remove('hidden');
            loggedUserMenu?.classList.add('hidden');
        }
    }

    // --- Auth Logic ---
    async function handleLogin(e) {
        e.preventDefault();
        authErrorMsg.textContent = '';

        const email = loginForm.email.value;
        const password = loginForm.password.value;

        const { error, data } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            // Tradução manual das mensagens de erro do Supabase
            if (error.message && error.message.includes("Invalid login credentials")) {
                authErrorMsg.textContent = "E-mail ou senha incorretos.";
            } else if (error.message && error.message.includes("Email not confirmed")) {
                authErrorMsg.textContent = "Você precisa confirmar seu e-mail antes de entrar.";
            } else {
                // Fallback para outros erros
                authErrorMsg.textContent = "Erro: " + (error.message || JSON.stringify(error));
            }
            return;
        }

        // --- TRAVA DE SEGURANÇA: E-MAIL NÃO CONFIRMADO ---
        if (data && data.user && !data.user.email_confirmed_at) {
            // Força logout imediato caso o Supabase tenha retornado usuário, mas sem confirmação
            try {
                await supabase.auth.signOut();
            } catch (signOutErr) {
                console.warn('Erro ao forçar signOut:', signOutErr);
            }

            authErrorMsg.textContent = "Por favor, confirme seu e-mail antes de acessar.";
            authErrorMsg.className = "text-center text-yellow-400 text-sm font-bold mt-2 min-h-[20px]";
            return;
        }

        currentUser = data.user;
        showAppPage();
    }

    async function handleSignup(e) {
        e.preventDefault();
        authErrorMsg.textContent = '';

        // DEBUG: Verificando o que está sendo pego
        const nameInput = document.getElementById('signup-name'); // Pega pelo ID direto
        const name = nameInput ? nameInput.value : '';

        const email = signupForm.email.value;
        const password = signupForm.password.value;

        console.log("Tentando cadastrar:", { name, email }); // <--- OLHE ISSO NO CONSOLE

        if (!name) {
            authErrorMsg.textContent = "Por favor, digite seu nome.";
            return;
        }

        const { error, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name // Garante que está enviando
                }
            }
        });

        // --- DETECÇÃO INTELIGENTE DE E-MAIL DUPLICADO ---
        // Se não houver erro, mas o array de identidades vier vazio,
        // significa que o Supabase bloqueou a criação porque o e-mail já existe.
        if (!error && data?.user && data?.user?.identities && data.user.identities.length === 0) {
            authErrorMsg.textContent = "Este e-mail já possui cadastro. Tente fazer login.";
            return;
        }
        // ------------------------------------------------

        if (error) {
            console.log("Erro Signup:", error);

            if (error.message.includes("User already registered") || error.message.includes("already registered")) {
                authErrorMsg.textContent = "Este e-mail já possui cadastro. Tente fazer login.";
            } else if (error.message.includes("Password should be at least")) {
                authErrorMsg.textContent = "A senha deve ter no mínimo 6 caracteres.";
            } else {
                authErrorMsg.textContent = "Erro: " + error.message;
            }
            return;
        }

        // SUCESSO: NÃO ENTRA DIRETO NO APP. MOSTRA AVISO DE CONFIRMAÇÃO
        try {
            signupForm.classList.add('hidden');
            if (authFooter) authFooter.classList.add('hidden'); // Esconde rodapé
            if (authMessage) authMessage.textContent = ""; // Limpa subtítulo
        } catch (err) {
            console.warn('Erro ao trocar visibilidade pós-signup:', err);
        }

        signupSuccessMessage?.classList.remove('hidden');
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        currentUser = null;
        showLandingPage();
    }

    // --- Persistência Supabase (Com correção do Nome e Mensagem Vazia) ---
    async function loadWorkouts() {
        if (!currentUser) return;

        // --- CORREÇÃO DO NOME ---
        // Prioriza o nome salvo, se não tiver, usa o e-mail
        if (userNameDisplay) {
            const meta = currentUser.user_metadata || {};
            let displayName = meta.name || meta.full_name || currentUser.email.split('@')[0];

            // Formatação (Primeira letra maiúscula)
            displayName = displayName.toString().split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');

            userNameDisplay.textContent = displayName;
        }
        // ------------------------

        // Carrega SVG externo se necessário
        if (!cachedMuscleSvg) {
            try {
                const resp = await fetch('assets/img/muscle.svg');
                if (resp.ok) {
                    cachedMuscleSvg = await resp.text();
                }
            } catch (e) { console.error(e); }
        }

        // 1. Define estado de carregamento visualmente
        if (noWorkoutsMessage) {
            noWorkoutsMessage.textContent = "Carregando seus treinos...";
            noWorkoutsMessage.classList.remove('hidden');
        }
        savedWorkoutsList.innerHTML = '';
        if (noWorkoutsMessage) savedWorkoutsList.appendChild(noWorkoutsMessage);

        // 2. Busca no Supabase
        const { data: workouts, error } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false });

        if (error) {
            savedWorkoutsList.innerHTML = `<div class="text-red-500 col-span-full">Erro: ${error.message}</div>`;
            return;
        }

        // 3. Verifica se está vazio
        if (!workouts || workouts.length === 0) {
            if (noWorkoutsMessage) {
                noWorkoutsMessage.classList.remove('hidden');
                noWorkoutsMessage.innerHTML = "Você ainda não registrou nenhum treino.<br>Bora começar?";
            }
            return;
        }

        // 4. Se tem treinos, esconde a mensagem e renderiza os cards
        noWorkoutsMessage?.classList.add('hidden');
        savedWorkoutsList.innerHTML = '';
        savedWorkoutsList.appendChild(noWorkoutsMessage);

        workouts.forEach(workout => {
            const dateObj = new Date(workout.date);
            const formattedDate = dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

            const groupsRaw = [...new Set(workout.exercises.map(ex => {
                const check = identifyMuscleGroup(ex.name);
                return check ? check.group : null;
            }))].filter(g => g);

            // Lógica de Ranqueamento
            const muscleCounts = {};
            workout.exercises.forEach(ex => {
                const check = identifyMuscleGroup(ex.name);
                if (check) {
                    const group = check.group;
                    const setQuantity = ex.sets ? ex.sets.length : 0;
                    muscleCounts[group] = (muscleCounts[group] || 0) + setQuantity;
                }
            });

            const sortedMuscles = Object.keys(muscleCounts).sort((a, b) => muscleCounts[b] - muscleCounts[a]);

            let groupsText = 'Geral';
            if (sortedMuscles.length > 0) {
                groupsText = sortedMuscles.length <= 2 ? sortedMuscles.join(', ') : `${sortedMuscles[0]}, ${sortedMuscles[1]} +`;
            }

            const bodySvg = cachedMuscleSvg ? getBodyWatermark(groupsRaw, cachedMuscleSvg) : '';

            const item = document.createElement('div');
            item.className = "relative overflow-hidden bg-card p-5 rounded-xl border border-zinc-700 flex flex-col justify-between group hover:border-destaque/50 transition-all duration-300 hover:shadow-lg hover:shadow-destaque/10 card-hover-subtle h-full min-h-[150px]";

            item.innerHTML = `
                <div class="relative z-10 pr-24">
                    <div class="flex flex-col items-start gap-2 mb-3">
                        <span class="text-[10px] font-bold text-zinc-400 border border-zinc-700 bg-zinc-800/80 px-2 py-1 rounded uppercase tracking-wider whitespace-nowrap backdrop-blur-sm">
                            ${formattedDate}
                        </span>
                        <h4 class="text-lg font-bold text-texto leading-tight line-clamp-2" title="${workout.name}">
                            ${workout.name || 'Treino Sem Nome'}
                        </h4>
                    </div>
                    <p class="text-destaque text-xs font-bold uppercase tracking-wide mb-4 flex flex-wrap items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-destaque inline-block"></span>
                        <span class="truncate block" title="${sortedMuscles.join(', ')}">
                            ${groupsText}
                        </span>
                    </p>
                </div>

                <div class="relative z-10 flex justify-between items-center mt-auto pt-3 card-sep border-t border-zinc-700/50">
                    <div class="flex items-center gap-1.5 text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5a2.4 2.4 0 0 1 1.8 -2.4a2.4 2.4 0 0 1 1.8 2.4"></path><path d="M4 14.5a2.4 2.4 0 0 1 1.8 -2.4a2.4 2.4 0 0 1 1.8 2.4"></path><path d="M4 9.5a2.4 2.4 0 0 1 1.8 -2.4a2.4 2.4 0 0 1 1.8 2.4"></path><path d="M4 4.5a2.4 2.4 0 0 1 1.8 -2.4a2.4 2.4 0 0 1 1.8 2.4"></path><path d="M14 14a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z"></path><path d="M14 21v-1"></path><path d="M14 10v-6"></path><path d="M20 14a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z"></path><path d="M20 21v-1"></path><path d="M20 10v-6"></path></svg>
                        <span class="text-xs font-medium">${workout.exercises.length} exercícios</span>
                    </div>
                    
                    <div class="flex gap-1">
                        <button class="btn-edit p-1.5 rounded-md text-zinc-400 hover:text-texto hover:bg-zinc-700 transition" title="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-delete p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition" title="Excluir">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            `;

            const svgWrapper = document.createElement('div');
            svgWrapper.className = 'absolute -right-5 -bottom-5 w-40 h-40 opacity-30 pointer-events-none transition-transform duration-500 group-hover:scale-105 flex items-end justify-end';
            svgWrapper.style.zIndex = '1';
            svgWrapper.innerHTML = `<div class="w-32 h-32 md:w-40 md:h-40 opacity-30">${bodySvg}</div>`;

            item.insertBefore(svgWrapper, item.firstChild);

            const btnEdit = item.querySelector('.btn-edit');
            const btnDelete = item.querySelector('.btn-delete');
            btnEdit.addEventListener('click', () => loadWorkoutForEditing(workout));
            btnDelete.addEventListener('click', () => deleteWorkout(workout.id));

            savedWorkoutsList.appendChild(item);
        });
    }

    // Função para DELETAR
    async function deleteWorkout(id) {
        if (confirm("Tem certeza que deseja excluir este treino? Essa ação não pode ser desfeita.")) {
            const { error } = await supabase.from('workouts').delete().eq('id', id);

            if (error) {
                alert("Erro ao excluir: " + error.message);
            } else {
                loadWorkouts(); // Recarrega a lista
            }
        }
    }

    // Função para PREPARAR EDIÇÃO
    function loadWorkoutForEditing(workout) {
        // 1. Define modo de edição E SALVA NO STORAGE
        editingWorkoutId = workout.id;
        localStorage.setItem('track2lift_editing_id', workout.id);

        // 2. Muda a interface para o formulário
        dashboardView.classList.add('hidden');
        workoutFormView.classList.remove('hidden');

        // 3. Atualiza textos (Botão Salvar e Cancelar)
        saveWorkoutBtn.textContent = "Atualizar Treino";

        // Atualiza o botão de Cancelar para "Cancelar Edição"
        const cancelTextSpan = goBackToDashboardBtn.querySelector('span');
        if (cancelTextSpan) cancelTextSpan.innerHTML = "&times; Cancelar Edição";

        // 4. Preenche cabeçalho
        workoutDateInput.value = workout.date;
        workoutNameInput.value = workout.name;

        // 5. Limpa lista e reconstrói os exercícios
        exerciseListContainer.innerHTML = '';
        exerciseCounter = 0;

        // Loop para recriar o DOM usando a inteligência de identificação
        workout.exercises.forEach(exData => {
            addExerciseBlock();
            const currentBlock = exerciseListContainer.lastElementChild;
            const muscleSelect = currentBlock.querySelector('.muscle-group-select');
            const exerciseSelect = currentBlock.querySelector('.exercise-select');
            const customInput = currentBlock.querySelector('.custom-exercise-input');
            const setsContainer = currentBlock.querySelector('.sets-container');

            // --- USO DA NOVA INTELIGÊNCIA ---
            const result = identifyMuscleGroup(exData.name);

            if (result) {
                // Caso A: Identificamos o grupo (seja exato ou por palavra-chave)
                muscleSelect.value = result.group;

                // Dispara mudança para carregar a lista de exercícios desse grupo
                muscleSelect.dispatchEvent(new Event('change'));

                if (result.exactMatch) {
                    // Se existe na lista oficial, seleciona ele usando o nome correto do catálogo
                    exerciseSelect.value = result.correctName;

                    // Fallback: se a seleção exata falhar, joga para custom
                    if (!exerciseSelect.value) {
                        exerciseSelect.value = "custom_option";
                        exerciseSelect.dispatchEvent(new Event('change'));
                        customInput.value = exData.name;
                    } else {
                        customInput.value = result.correctName;
                    }
                } else {
                    // Se foi por palavra-chave (heurística), usa personalizado e preenche
                    exerciseSelect.value = "custom_option";
                    exerciseSelect.dispatchEvent(new Event('change'));
                    customInput.value = exData.name;
                }
            } else {
                // Caso B: Não identificamos nada.
                // Deixa tudo em branco para o usuário categorizar.
                // Salvamos o nome num atributo temporário para recuperar depois
                currentBlock.dataset.tempName = exData.name;
            }

            // Series
            setsContainer.innerHTML = '';
            exData.sets.forEach(setData => {
                addSetBlock(setsContainer);
                const currentSet = setsContainer.lastElementChild;
                // Verifica se o dado salvo tem 'duration' (Cardio) ou 'reps' (Força)
                if (setData.duration !== undefined) {
                    // É Cardio
                    const strengthDiv = currentSet.querySelector('.inputs-strength');
                    const cardioDiv = currentSet.querySelector('.inputs-cardio');
                    if (strengthDiv && cardioDiv) {
                        strengthDiv.classList.add('hidden');
                        cardioDiv.classList.remove('hidden');
                    }
                    const durationEl = currentSet.querySelector('.duration-input');
                    if (durationEl) durationEl.value = setData.duration;
                    // Marca o bloco pai também
                    currentBlock.dataset.type = 'cardio';
                } else {
                    // É Força
                    const repsEl = currentSet.querySelector('.reps-input');
                    const weightEl = currentSet.querySelector('.weight-input');
                    if (repsEl) repsEl.value = setData.reps;
                    if (weightEl) weightEl.value = setData.weight;
                }
            });
        });

        // Força um salvamento imediato do rascunho para garantir persistência dos dados
        saveWorkoutDraft();
    }

    async function saveWorkoutToSupabase() {
        if (!currentUser) return;

        saveWorkoutBtn.textContent = "Salvando...";
        saveWorkoutBtn.disabled = true;

        // Monta o objeto de dados
        const workoutData = {
            user_id: currentUser.id,
            date: workoutDateInput.value,
            name: workoutNameInput.value || 'Treino Rápido',
            exercises: []
        };

        // Coleta dados do HTML (igual antes)
        const exerciseBlocks = exerciseListContainer.querySelectorAll('.exercise-block');
        exerciseBlocks.forEach(block => {
            const exerciseName = getExerciseNameFromBlock(block);
            if (!exerciseName) return;

            const isCardio = block.dataset.type === 'cardio';
            const exercise = { name: exerciseName, type: isCardio ? 'cardio' : 'strength', sets: [] };
            const setRows = block.querySelectorAll('.set-row');

            setRows.forEach(row => {
                if (isCardio) {
                    const durationEl = row.querySelector('.duration-input');
                    const duration = durationEl ? durationEl.value : '';
                    if (duration !== '') {
                        exercise.sets.push({ duration: duration });
                    }
                } else {
                    const reps = row.querySelector('.reps-input').value;
                    const weight = row.querySelector('.weight-input').value;
                    // Salva mesmo se for 0, mas não se for vazio
                    if (reps !== '' || weight !== '') {
                        exercise.sets.push({ reps: reps || 0, weight: weight || 0 });
                    }
                }
            });
            workoutData.exercises.push(exercise);
        });

        if (workoutData.exercises.length === 0) {
            alert('Adicione pelo menos um exercício com nome.');
            saveWorkoutBtn.textContent = editingWorkoutId ? "Atualizar Treino" : "Salvar Treino";
            saveWorkoutBtn.disabled = false;
            return;
        }

        let error;

        // DECISÃO: Insert ou Update?
        if (editingWorkoutId) {
            // MODO EDIÇÃO
            const response = await supabase
                .from('workouts')
                .update({
                    date: workoutData.date,
                    name: workoutData.name,
                    exercises: workoutData.exercises
                })
                .eq('id', editingWorkoutId); // Importante: Onde ID é igual ao que estamos editando
            error = response.error;
        } else {
            // MODO CRIAÇÃO (Novo)
            const response = await supabase.from('workouts').insert([workoutData]);
            error = response.error;
        }

        saveWorkoutBtn.disabled = false;

        if (error) {
            alert('Erro ao salvar: ' + error.message);
            saveWorkoutBtn.textContent = editingWorkoutId ? "Atualizar Treino" : "Salvar Treino";
            return;
        }

        // Sucesso! Limpa rascunho e estado de edição persistente, atualiza UI e volta.
        localStorage.removeItem('track2lift_draft');
        localStorage.removeItem('track2lift_editing_id');
        editingWorkoutId = null; // Reseta o ID de edição
        saveWorkoutBtn.textContent = "Salvar Treino"; // Reseta texto do botão

        // Restaura texto do botão Cancel para o padrão
        const cancelTextSpan = goBackToDashboardBtn.querySelector('span');
        if (cancelTextSpan) cancelTextSpan.innerHTML = "&times; Cancelar Treino";

        showDashboardView();
    }

    // --- Lógica do Logger de Treino (Formulário) ---
    function addExerciseBlock() {
        exerciseCounter++;
        const exerciseId = `exercise-${exerciseCounter}`;

        // HTML com Selects + Input Oculto
        const exerciseHtml = `
            <div id="${exerciseId}" class="exercise-block bg-zinc-800 p-4 rounded-lg border border-zinc-700 space-y-4">
                <div class="flex flex-col gap-3">
                    <div class="flex justify-between items-start">
                        <span class="text-sm font-bold text-destaque uppercase tracking-wider">Exercício ${document.querySelectorAll('.exercise-block').length + 1}</span>
                        <button class="remove-exercise-btn text-zinc-400 hover:text-red-500 transition duration-300" data-target="${exerciseId}" title="Remover exercício">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select class="muscle-group-select w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-texto focus:outline-none focus:border-destaque">
                            <option value="" disabled selected>Grupo Muscular</option>
                            ${Object.keys(EXERCISE_CATALOG).map(group => `<option value="${group}">${group}</option>`).join('')}
                        </select>

                        <select class="exercise-select w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-texto focus:outline-none focus:border-destaque disabled:opacity-50" disabled>
                            <option value="" disabled selected>Selecione o Grupo primeiro</option>
                        </select>
                    </div>

                    <input type="text"
                        class="exercise-name-input custom-exercise-input hidden w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-texto focus:outline-none focus:border-destaque placeholder-zinc-500"
                        placeholder="Digite o nome do seu exercício...">
                </div>

                <div class="sets-container space-y-3 pt-2"></div>
                
                <button class="add-set-btn w-fit mt-2 bg-destaque hover:bg-red-700 text-texto font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center gap-2 text-sm shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>Adicionar Série</span>
                </button>
            </div>
        `;

        exerciseListContainer.insertAdjacentHTML('beforeend', exerciseHtml);

        const newBlock = document.getElementById(exerciseId);
        const setsContainer = newBlock.querySelector('.sets-container');
        addSetBlock(setsContainer);

        // --- LÓGICA DE EVENTOS DO NOVO BLOCO ---
        setupExerciseBlockEvents(newBlock);
    }

    function addSetBlock(setsContainer) {
        const setCount = setsContainer.children.length + 1;
        // HTML híbrido: contém tanto inputs de força quanto de cardio. Alternamos via classes
        const setHtml = `
            <div class="set-row flex items-center gap-3 group">
                <span class="set-number-label text-zinc-500 font-medium text-sm w-12 text-center whitespace-nowrap">Série ${setCount}</span>
                
                <div class="inputs-strength grid grid-cols-2 gap-3 w-full">
                    <input type="number" min="0"
                        class="reps-input w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-texto focus:outline-none focus:border-destaque placeholder-zinc-500"
                        placeholder="Reps"
                        oninput="this.value = !!this.value && Math.abs(this.value) >= 0 ? Math.abs(this.value) : null">

                    <div class="relative w-full">
                        <input type="number" min="0" step="0.5"
                            class="weight-input w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-3 pr-8 py-2 text-texto focus:outline-none focus:border-destaque placeholder-zinc-500"
                            placeholder="Peso"
                            oninput="this.value = !!this.value && Math.abs(this.value) >= 0 ? Math.abs(this.value) : null">
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold pointer-events-none">kg</span>
                    </div>
                </div>

                <div class="inputs-cardio hidden w-full">
                    <div class="relative w-full">
                        <input type="number" min="0"
                            class="duration-input w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-3 pr-10 py-2 text-texto focus:outline-none focus:border-destaque placeholder-zinc-500"
                            placeholder="Duração"
                            oninput="this.value = !!this.value && Math.abs(this.value) >= 0 ? Math.abs(this.value) : null">
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold pointer-events-none">min</span>
                    </div>
                </div>

                <button class="remove-set-btn text-zinc-600 hover:text-red-500 transition p-1 rounded-md hover:bg-zinc-700 opacity-0 group-hover:opacity-100" title="Remover Série">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `;
        setsContainer.insertAdjacentHTML('beforeend', setHtml);
    }

    // Atualiza os números das séries (Série 1, Série 2...) após exclusão
    function updateSetNumbers(setsContainer) {
        const rows = setsContainer.querySelectorAll('.set-row');
        rows.forEach((row, index) => {
            const label = row.querySelector('.set-number-label');
            if (label) {
                label.textContent = `Série ${index + 1}`;
            }
        });
    }

    // --- Setup events para cada bloco de exercício (selects + custom) ---
    function setupExerciseBlockEvents(block) {
        const muscleSelect = block.querySelector('.muscle-group-select');
        const exerciseSelect = block.querySelector('.exercise-select');
        const customInput = block.querySelector('.custom-exercise-input');

        if (!muscleSelect || !exerciseSelect || !customInput) return;

        // Função para alternar o modo do bloco (Força vs Cardio)
        const toggleCardioMode = (isCardio) => {
            const setsRows = block.querySelectorAll('.set-row');

            setsRows.forEach(row => {
                const strengthDiv = row.querySelector('.inputs-strength');
                const cardioDiv = row.querySelector('.inputs-cardio');

                if (isCardio) {
                    strengthDiv.classList.add('hidden');
                    cardioDiv.classList.remove('hidden');
                } else {
                    strengthDiv.classList.remove('hidden');
                    cardioDiv.classList.add('hidden');
                }
            });

            // Marca o bloco para sabermos na hora de salvar
            if (isCardio) block.dataset.type = 'cardio';
            else block.dataset.type = 'strength';
        };

        // Quando muda o Grupo Muscular
        muscleSelect.addEventListener('change', (e) => {
            const group = e.target.value;
            const exercises = EXERCISE_CATALOG[group] || [];

            // Verifica se é cardio
            const isCardio = (group === 'Cardio');
            toggleCardioMode(isCardio);

            // Recria as opções
            exerciseSelect.innerHTML = `<option value="" disabled selected>Selecione o Exercício</option>`;
            exercises.forEach(ex => {
                exerciseSelect.innerHTML += `<option value="${ex}">${ex}</option>`;
            });

            exerciseSelect.innerHTML += `<option value="custom_option">+ Outro / Personalizado</option>`;
            exerciseSelect.disabled = false;
            exerciseSelect.value = "";

            customInput.classList.add('hidden');
            customInput.value = '';

            if (block.dataset.tempName) {
                const tempName = block.dataset.tempName;
                delete block.dataset.tempName;
                exerciseSelect.value = "custom_option";
                exerciseSelect.dispatchEvent(new Event('change'));
                customInput.value = tempName;
            }
        });

        // Quando muda o Exercício (verifica heurística se for personalizado)
        exerciseSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom_option') {
                customInput.classList.remove('hidden');
                customInput.focus();
            } else {
                customInput.classList.add('hidden');
                customInput.value = e.target.value;
            }
        });

        // Se o usuário digitar algo customizado, verificamos se é cardio (ex: "Corrida na areia")
        customInput.addEventListener('input', () => {
            const check = identifyMuscleGroup(customInput.value);
            if (check && check.group === 'Cardio') {
                toggleCardioMode(true);
            } else {
                // Se o select de grupo já for Cardio, mantém. Se não, volta pra força.
                if (muscleSelect.value !== 'Cardio') toggleCardioMode(false);
            }
        });

        // Observer: Se adicionar nova série, garante que ela nasça no modo certo
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    const isCardio = block.dataset.type === 'cardio';
                    toggleCardioMode(isCardio);
                }
            });
        });

        const setsContainer = block.querySelector('.sets-container');
        if (setsContainer) observer.observe(setsContainer, { childList: true });
    }

    // Helper para pegar o nome do exercício independente da origem (Select ou Input)
    function getExerciseNameFromBlock(block) {
        const exerciseSelect = block.querySelector('.exercise-select');
        const customInput = block.querySelector('.custom-exercise-input');

        if (!exerciseSelect) return customInput ? customInput.value : '';
        // Se o select estiver em "custom_option" OU se o input estiver visível/preenchido manualmente
        if (exerciseSelect.value === 'custom_option' || !exerciseSelect.value) {
            return customInput ? customInput.value : '';
        }
        return exerciseSelect.value;
    }


    // --- Event Listeners ---
    // --- Roteamento Global de Botões de Acesso (Event Delegation) ---
    // "Ouve" cliques na página inteira, mas só age se for um botão de navegação
    document.addEventListener('click', (e) => {
        // Procura se o clique foi dentro de um link de ação (a.cta-button) ou botões específicos
        // IMPORTANTE: Só pegamos tags <a> para não quebrar os <button> de formulários (Salvar/Login)
        const targetBtn = e.target.closest('a.cta-button, #heroCTA, #publicAuthButtons a, #menuGoToApp');

        if (targetBtn) {
            // Se achou um botão de navegação:
            e.preventDefault(); // Para o link de carregar a página/adicionar # na URL

            if (currentUser) {
                console.log("Usuário logado -> Indo para App");
                showAppPage();
            } else {
                console.log("Usuário deslogado -> Indo para Auth");
                showAuthPage();
            }
        }
    });

    logoLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showLandingPage();
    });

    logoutButton?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

    showWorkoutFormBtn?.addEventListener('click', showWorkoutFormView);
    // Botão "Voltar" agora funciona como "Cancelar Treino"
    goBackToDashboardBtn?.addEventListener('click', (e) => {
        e.preventDefault();

        const hasDraft = !!localStorage.getItem('track2lift_draft');
        const hasEditing = !!localStorage.getItem('track2lift_editing_id') || !!editingWorkoutId;

        if (hasDraft || hasEditing) {
            const confirmCancel = confirm("Isso vai descartar as alterações e sair da edição. Tem certeza?");
            if (confirmCancel) {
                // Limpa rascunho e estado de edição persistente
                localStorage.removeItem('track2lift_draft');
                localStorage.removeItem('track2lift_editing_id');
                editingWorkoutId = null;

                // Restaura texto do botão Cancel
                const cancelTextSpan = goBackToDashboardBtn.querySelector('span');
                if (cancelTextSpan) cancelTextSpan.innerHTML = "&times; Cancelar Treino";

                showDashboardView();
            }
        } else {
            // Se não tem nada digitado e não estamos editando, só volta
            showDashboardView();
        }
    });
    addExerciseBtn?.addEventListener('click', addExerciseBlock);
    saveWorkoutBtn?.addEventListener('click', saveWorkoutToSupabase);

    // Auto-save: Salva rascunho a cada alteração no formulário de treino
    workoutFormView?.addEventListener('input', () => {
        // Pequeno delay (debounce) para não salvar a cada milissegundo
        clearTimeout(window.saveDraftTimeout);
        window.saveDraftTimeout = setTimeout(saveWorkoutDraft, 500);
    });

    // Delegação para botões dinâmicos (Adicionar/Remover Exercício e REMOVER SÉRIE)
    exerciseListContainer?.addEventListener('click', function (e) {
        // 1. Adicionar Série
        const addSetBtn = e.target.closest('.add-set-btn');
        if (addSetBtn) {
            const setsContainer = addSetBtn.previousElementSibling;
            addSetBlock(setsContainer);
        }

        // 2. Remover Exercício Inteiro
        const removeExBtn = e.target.closest('.remove-exercise-btn');
        if (removeExBtn) {
            const targetId = removeExBtn.dataset.target;
            const exerciseElement = document.getElementById(targetId);
            if (exerciseElement) {
                if (exerciseListContainer.children.length > 1) {
                    exerciseElement.remove();
                    // Re-numera os exercícios restantes (Ex: Exercício 1, 2, 3...)
                    document.querySelectorAll('.exercise-block').forEach((block, index) => {
                        const label = block.querySelector('.text-destaque');
                        if (label) label.textContent = `Exercício ${index + 1}`;
                    });
                } else {
                    alert('Você deve ter pelo menos um exercício.');
                }
            }
        }

        // 3. Remover Série Específica (NOVO)
        const removeSetBtn = e.target.closest('.remove-set-btn');
        if (removeSetBtn) {
            const setRow = removeSetBtn.closest('.set-row');
            const setsContainer = setRow.parentElement;

            // Verifica se é a única série (opcional: impedir apagar a última)
            if (setsContainer.children.length > 1) {
                setRow.remove();
                updateSetNumbers(setsContainer); // Renumera (1, 2, 3...)
            } else {
                // Se for a última série, limpamos os inputs para não quebrar o layout
                const inputs = setRow.querySelectorAll('input');
                inputs.forEach(input => input.value = '');
            }
        }
    });

    // Auth forms
    loginForm?.addEventListener('submit', handleLogin);
    signupForm?.addEventListener('submit', handleSignup);

    // Lógica de alternância (Toggle) entre Login e Cadastro usando um único botão
    authToggleButton?.addEventListener('click', (e) => {
        e.preventDefault();
        if (authErrorMsg) authErrorMsg.textContent = ''; // Limpa mensagens de erro antigas

        // Verifica se o formulário de login está visível
        const isLoginVisible = loginForm && !loginForm.classList.contains('hidden');

        if (isLoginVisible) {
            // Mudar para Cadastro
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            // Atualiza os textos do rodapé
            if (authToggleText) authToggleText.textContent = "Já tem uma conta?";
            authToggleButton.textContent = "Entrar";
        } else {
            // Mudar para Login
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            // Atualiza os textos do rodapé
            if (authToggleText) authToggleText.textContent = "Não tem uma conta?";
            authToggleButton.textContent = "Cadastre-se";
        }
    });

    // --- LÓGICA DE RECUPERAÇÃO DE SENHA ---

    // Clique em "Esqueci minha senha"
    forgotPasswordLink?.addEventListener('click', (e) => {
        e.preventDefault();
        if (authErrorMsg) authErrorMsg.textContent = '';

        // Esconde Login e Rodapé, Mostra Recuperação
        loginForm.classList.add('hidden');
        authFooter?.classList.add('hidden'); // Esconde o "Cadastre-se" para limpar a tela
        recoveryForm?.classList.remove('hidden');
    });

    // Clique em "Voltar para o Login"
    backToLoginBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (authErrorMsg) {
            authErrorMsg.textContent = '';
            authErrorMsg.className = "text-center text-red-500 text-sm font-bold mt-2 min-h-[20px]"; // Reseta cor de erro
        }

        recoveryForm?.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authFooter?.classList.remove('hidden');
    });

    // Botão de voltar da tela de sucesso do cadastro
    backToLoginFromSuccess?.addEventListener('click', (e) => {
        e.preventDefault();
        signupSuccessMessage?.classList.add('hidden');
        loginForm.classList.remove('hidden');
        if (authFooter) authFooter.classList.remove('hidden');
        // Reseta textos
        if (authMessage) authMessage.textContent = "Acesse sua conta para continuar";
    });

    // --- LÓGICA DE ONBOARDING (Salvar Perfil + Correção de Nome) ---
    onboardingForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (onboardingErrorMsg) onboardingErrorMsg.textContent = '';
        finishOnboardingBtn.disabled = true;
        finishOnboardingBtn.textContent = "Salvando perfil...";

        const age = parseInt(document.getElementById('obAge').value);
        const weight = parseFloat(document.getElementById('obWeight').value);
        const height = parseInt(document.getElementById('obHeight').value);
        const goalRadio = document.querySelector('input[name="obGoal"]:checked');
        const goal = goalRadio ? goalRadio.value : 'Emagrecimento';

        if (!age || !weight || !height) {
            if (onboardingErrorMsg) onboardingErrorMsg.textContent = "Preencha todos os campos numéricos.";
            finishOnboardingBtn.disabled = false;
            finishOnboardingBtn.textContent = "Salvar e Começar →";
            return;
        }

        // --- PLANO B: CORREÇÃO DE NOME ---
        // Se o nome não existe no metadata, tentamos usar o que está na tela (se editável) 
        // ou pedimos para salvar o nome atual da variável (fallback)
        const currentMeta = currentUser?.user_metadata || {};
        const updates = {
            age: age,
            weight: weight,
            height: height,
            goal: goal,
            onboarding_completed: true
        };

        // Se o nome não foi salvo no cadastro, força salvar agora
        // (Pega do texto "Bem-vindo, Douglas" se o JS conseguiu renderizar, ou mantém o que tem)
        if (!currentMeta.name) {
            // Tenta extrair o nome do email se não tiver nada
            const nameFromEmail = currentUser.email.split('@')[0];
            // Capitaliza
            const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
            updates.name = formattedName;
        }
        // ----------------------------------

        const { data, error } = await supabase.auth.updateUser({
            data: updates
        });

        if (error) {
            console.error("Erro Onboarding:", error);
            if (onboardingErrorMsg) onboardingErrorMsg.textContent = "Erro: " + error.message;
            finishOnboardingBtn.disabled = false;
            finishOnboardingBtn.textContent = "Tentar Novamente";
        } else {
            currentUser = data.user;
            onboardingContainer.classList.add('hidden');
            if (siteFooter) siteFooter.classList.remove('hidden');

            // Atualiza o nome no header imediatamente
            updateHeaderState();
            showAppPage();
        }
    });

    // Envio do Formulário de Recuperação
    recoveryForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('recovery-email')?.value;
        if (!email) return;

        recoveryButton.disabled = true;
        recoveryButton.textContent = "Enviando...";
        if (authErrorMsg) authErrorMsg.textContent = "";

        // URL para onde o usuário volta (a raiz do seu site)
        const redirectUrl = window.location.origin;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        });

        if (error) {
            if (authErrorMsg) authErrorMsg.textContent = "Erro: " + error.message;
            recoveryButton.disabled = false;
            recoveryButton.textContent = "Enviar Link";
        } else {
            // Sucesso Visual
            if (authErrorMsg) {
                authErrorMsg.textContent = "Link enviado! Verifique seu e-mail.";
                authErrorMsg.className = "text-center text-green-500 text-sm font-bold mt-2 min-h-[20px]";
            }

            // Limpa form e volta pro login após 3 segundos
            setTimeout(() => {
                backToLoginBtn?.click();
                recoveryButton.disabled = false;
                recoveryButton.textContent = "Enviar Link";
            }, 3000);
        }
    });

    // --- Ações do Menu de Usuário ---

    // Ir para o App
    menuGoToApp?.addEventListener('click', (e) => {
        e.preventDefault();
        showAppPage();
    });

    // Logout (Substitui o botão antigo do dashboard)
    menuLogout?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

    // Abrir Configurações da Conta
    menuAccountSettings?.addEventListener('click', (e) => {
        e.preventDefault();
        if (settingsMsg) settingsMsg.textContent = '';
        if (settingsNewPassword) settingsNewPassword.value = '';
        showAccountSettingsPage();
    });

    // Fechar (Voltar para o App)
    closeSettingsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showAppPage();
    });

    // --- SALVAR ALTERAÇÕES DE CONTA ---
    saveSettingsBtn?.addEventListener('click', async (e) => {
        e.preventDefault();

        const newName = settingsName?.value.trim();
        const newEmail = settingsEmail?.value.trim();
        const newPass = settingsNewPassword?.value;

        const updates = {};
        let hasUpdates = false;
        updates.data = updates.data || {};

        // Verifica Nome
        if (newName && newName !== (currentUser.user_metadata?.name || '')) {
            updates.data.name = newName;
            hasUpdates = true;
        }

        // Verifica Email
        if (newEmail && newEmail !== currentUser.email) {
            updates.email = newEmail;
            hasUpdates = true;
        }

        // Verifica Senha
        if (newPass) {
            if (newPass.length < 6) {
                if (settingsMsg) {
                    settingsMsg.textContent = "A senha nova deve ter no mínimo 6 caracteres.";
                    settingsMsg.className = "mt-3 text-sm font-medium text-yellow-400";
                }
                return;
            }
            updates.password = newPass;
            hasUpdates = true;
        }

        // Verifica campos adicionais (idade, peso, altura, objetivo)
        const ageVal = settingsAge?.value || '';
        const weightVal = settingsWeight?.value || '';
        const heightVal = settingsHeight?.value || '';
        const goalVal = settingsGoal?.value || '';

        if (ageVal !== (currentUser.user_metadata?.age || '')) {
            updates.data.age = ageVal;
            hasUpdates = true;
        }
        if (weightVal !== (currentUser.user_metadata?.weight || '')) {
            updates.data.weight = weightVal;
            hasUpdates = true;
        }
        if (heightVal !== (currentUser.user_metadata?.height || '')) {
            updates.data.height = heightVal;
            hasUpdates = true;
        }
        if (goalVal !== (currentUser.user_metadata?.goal || '')) {
            updates.data.goal = goalVal;
            hasUpdates = true;
        }

        if (!hasUpdates) {
            if (settingsMsg) {
                settingsMsg.textContent = "Nenhuma alteração detectada.";
                settingsMsg.className = "mt-3 text-sm font-medium text-zinc-400";
            }
            return;
        }

        if (saveSettingsBtn) {
            saveSettingsBtn.textContent = "Salvando...";
            saveSettingsBtn.disabled = true;
        }

        // Chama Supabase
        const { data, error } = await supabase.auth.updateUser(updates);

        if (saveSettingsBtn) {
            saveSettingsBtn.disabled = false;
            saveSettingsBtn.textContent = "Salvar Alterações";
        }

        if (error) {
            if (settingsMsg) {
                settingsMsg.textContent = "Erro: " + error.message;
                settingsMsg.className = "mt-3 text-sm font-medium text-red-500";
            }
        } else {
            // Sucesso!
            currentUser = data.user; // Atualiza localmente

            // Feedback específico
            let msg = "Perfil atualizado com sucesso!";
            if (updates.email) msg += " Verifique seu novo e-mail para confirmar.";

            if (settingsMsg) {
                settingsMsg.textContent = msg;
                settingsMsg.className = "mt-3 text-sm font-medium text-green-500";
            }

            // Atualiza nome no header se mudou
            if (updates.data?.name) updateHeaderState();
        }
    });

    // --- EXCLUIR CONTA ---
    deleteAccountBtn?.addEventListener('click', async (e) => {
        e.preventDefault();

        const confirm1 = confirm("Tem certeza? Essa ação apagará TODOS os seus dados permanentemente.");
        if (!confirm1) return;

        const confirm2 = confirm("Última chance: Deseja realmente excluir sua conta?");
        if (!confirm2) return;

        if (deleteAccountBtn) {
            deleteAccountBtn.textContent = "Excluindo...";
            deleteAccountBtn.disabled = true;
        }

        // Chama a função RPC do banco que criamos no Passo 1
        const { error } = await supabase.rpc('delete_own_user');

        if (error) {
            alert("Erro ao excluir conta: " + error.message);
            if (deleteAccountBtn) {
                deleteAccountBtn.textContent = "Excluir minha conta";
                deleteAccountBtn.disabled = false;
            }
        } else {
            alert("Sua conta foi excluída. Sentiremos sua falta!");
            currentUser = null;
            showLandingPage();
        }
    });

    // Cancelar Alteração de Senha (volta para o App completo)
    cancelPasswordBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showAppPage();
    });

    // Salvar Nova Senha (ajustado para retornar ao App)
    savePasswordBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        const newPassword = newPasswordInput.value;

        if (newPassword.length < 6) {
            passwordMsg.textContent = "A senha deve ter no mínimo 6 caracteres.";
            passwordMsg.className = "text-center text-sm font-medium text-yellow-400";
            return;
        }

        savePasswordBtn.textContent = "Atualizando...";
        savePasswordBtn.disabled = true;

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            passwordMsg.textContent = "Erro: " + error.message;
            passwordMsg.className = "text-center text-sm font-medium text-red-500";
            savePasswordBtn.textContent = "Tentar Novamente";
        } else {
            passwordMsg.textContent = "Senha alterada com sucesso!";
            passwordMsg.className = "text-center text-sm font-medium text-green-500";
            savePasswordBtn.textContent = "Sucesso!";
            setTimeout(() => {
                showAppPage(); // Retorna ao App após sucesso
            }, 1500);
        }
        savePasswordBtn.disabled = false;
        // Restaura o texto do botão (caso queira manter)
        setTimeout(() => { savePasswordBtn.textContent = "Atualizar Senha"; }, 1600);
    });

    // --- Sessão Persistente e Segurança ---
    async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && session.user) {
            // TRAVA DE SEGURANÇA: Se o e-mail não foi confirmado, bloqueia o acesso no F5
            if (!session.user.email_confirmed_at) {
                console.log("Sessão encontrada, mas e-mail não confirmado. Deslogando...");
                await supabase.auth.signOut();
                currentUser = null;
                updateHeaderState();
                showLandingPage();

                // Opcional: Mostra erro no login para o usuário entender
                if (authErrorMsg) {
                    authErrorMsg.textContent = "Sua sessão expirou ou o e-mail não foi confirmado.";
                    authErrorMsg.className = "text-center text-yellow-400 text-sm font-bold mt-2 min-h-[20px]";
                }
                return;
            }

            currentUser = session.user;
            updateHeaderState();

            // Se estiver na raiz e logado, mostra o app (comportamento padrão)
            // Mas respeita se o usuário estiver na tela de senha (via link de recuperação)
            const isOnPasswordPage = changePasswordContainer && !changePasswordContainer.classList.contains('hidden');
            if (!isOnPasswordPage) {
                // Ao restaurar sessão no F5, abrir o App para recalcular metas e carregar dados
                showAppPage();
            }
        } else {
            currentUser = null;
            updateHeaderState();
            showLandingPage();
        }
    }
    checkSession();

    // Atualiza sessão ao logar/deslogar
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Evento Supabase:", event);

        // 1. INTERCEPTAÇÃO DE RECUPERAÇÃO DE SENHA (Prioridade Máxima)
        if (event === 'PASSWORD_RECOVERY') {
            currentUser = session?.user;
            showChangePasswordPage();
            return;
        }

        // 2. TRAVA DE SEGURANÇA: E-MAIL NÃO CONFIRMADO
        // Se o usuário tentou logar, mas não confirmou o e-mail
        if (event === 'SIGNED_IN' && session && session.user && !session.user.email_confirmed_at) {
            console.log("Login bloqueado: E-mail não confirmado.");
            await supabase.auth.signOut(); // Chuta o usuário para fora

            // Mostra aviso na tela de login
            if (authErrorMsg) {
                authErrorMsg.textContent = "Verifique seu e-mail para ativar sua conta.";
                authErrorMsg.className = "text-center text-yellow-400 text-sm font-bold mt-2 min-h-[20px]";
            }

            showAuthPage(); // Garante que ele veja a tela de login com o erro
            return;
        }

        // 3. Fluxo Normal
        if (session && session.user) {
            currentUser = session.user;

            if (event === 'SIGNED_IN') {
                const isOnPasswordPage = changePasswordContainer && !changePasswordContainer.classList.contains('hidden');
                if (!isOnPasswordPage) {
                    showAppPage();
                }
            }
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showLandingPage();
        }
    });
})();
// Código movido de index.html - carregado com `defer`

// Atualiza o ano no footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Menu Mobile Hamburguer
(function () {
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Fecha o menu ao clicar em um link
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
})();

// Configuração do Gráfico
(function () {
    if (document.getElementById('progressChart')) {
        const ctx = document.getElementById('progressChart').getContext('2d');

        // Criando um gradiente para a linha
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(220, 38, 38, 0.6)'); // #DC2626 com opacidade
        gradient.addColorStop(1, 'rgba(220, 38, 38, 0.05)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
                datasets: [{
                    label: 'Carga Média Semanal',
                    data: [65, 69, 68, 73, 76, 75, 80, 83], // Progressão com variação realista (alguns platôs e quedas)
                    borderColor: '#DC2626',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#FCFCFC',
                    pointBorderColor: '#DC2626',
                    pointHoverRadius: 7,
                    pointRadius: 5,
                    tension: 0.3, // Curvas suaves
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: window.innerWidth < 768 ? 1.5 : 2,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#181818',
                        titleColor: '#FCFCFC',
                        bodyColor: '#FCFCFC',
                        borderColor: '#DC2626',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: function () {
                                return null;
                            },
                            label: function (context) {
                                return context.parsed.y + ' kg';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 60,
                        max: 90,
                        grid: { color: 'rgba(252, 252, 252, 0.1)' },
                        ticks: {
                            color: '#a1a1aa',
                            stepSize: 5
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#a1a1aa' }
                    }
                }
            }
        });
    }
})();

// ===== Lógica da API Gemini =====
(function () {
    const generateButton = document.getElementById('generateButton');
    const resultCard = document.getElementById('resultCard');
    const ingredientesInput = document.getElementById('ingredientesInput');

    // Guardar o texto original do botão
    let originalButtonText = '';
    if (generateButton) {
        originalButtonText = generateButton.textContent;
        generateButton.addEventListener('click', handleGeneration);
    }

    async function handleGeneration() {
        // Pega o valor do radio button selecionado
        const selectedGoal = document.querySelector('input[name="objetivo"]:checked');
        const goal = selectedGoal ? selectedGoal.value : '';
        const ingredients = ingredientesInput.value;

        if (!goal) {
            resultCard.innerHTML = `<span class="text-center text-yellow-400">Por favor, selecione um objetivo.</span>`;
            return;
        }

        if (!ingredients) {
            resultCard.innerHTML = `<span class="text-center text-yellow-400">Por favor, insira pelo menos um ingrediente.</span>`;
            return;
        }

        // Estado de Loading
        setLoading(true);

        const systemPrompt = "Você é um nutricionista e chef fitness. Crie apenas uma PRÉVIA resumida de refeição.";
        const userQuery = `Com base no objetivo de "${goal}" e usando os ingredientes "${ingredients}", crie UMA PRÉVIA de refeição estruturada assim:

1. Nome da refeição em <h3>
2. Um <div class="recipe-content"> contendo:
   - Primeiro <div class="recipe-section">: <h4>Ingredientes</h4> seguido de <ul> com 3-4 ingredientes principais em <li>
   - Segundo <div class="recipe-section">: <h4>Modo de Preparo</h4> seguido de <ol> com APENAS os 2 primeiros passos em <li>. Termine o segundo passo com "..."

Use HTML limpo sem comentários. Responda em português do Brasil.`;

        try {
            let resultText = await callGeminiAPI(systemPrompt, userQuery);

            // Limpa marcadores de código markdown e textos introdutórios da IA
            resultText = resultText
                .replace(/^```html\s*/i, '')           // Remove ```html no início
                .replace(/^```\s*/gm, '')              // Remove ``` no início
                .replace(/```\s*$/gm, '')              // Remove ``` no final
                .replace(/^(ok,?\s*)?aqui está.*?:/i, '') // Remove "Ok, aqui está..." ou similar
                .replace(/^claro,?\s*aqui está.*?:/i, '') // Remove "Claro, aqui está..."
                .replace(/^(?:html|css|javascript)\s*$/gmi, '') // Remove labels de linguagem soltas
                .trim();

            // Adiciona CTA para plataforma completa
            const ctaMessage = `
                <div class="mt-8 pt-6 border-t-2 border-zinc-700 text-center">
                    <p class="text-zinc-300 mb-2 text-lg">Esta é apenas uma prévia.</p>
                    <p class="text-destaque font-bold mb-6 text-lg">Na plataforma completa, você recebe planos adaptados ao seu progresso.</p>
                    <a href="#" class="cta-button inline-block bg-destaque text-texto font-bold py-3 px-8 rounded-lg text-lg">
                        Acessar Plataforma Completa
                    </a>
                </div>
            `;

            resultCard.innerHTML = resultText + ctaMessage;
        } catch (error) {
            console.error("Erro ao chamar a API Gemini:", error);

            let errorMessage = '';

            if (error.message === "API_KEY_MISSING") {
                errorMessage = `
                    <div class="text-center space-y-4">
                        <p class="text-yellow-400 font-bold">⚠️ API Key não configurada</p>
                        <p class="text-zinc-300 text-base">Para usar este recurso, você precisa:</p>
                        <ol class="text-left text-zinc-300 text-sm space-y-2 max-w-md mx-auto">
                            <li>1. Obter uma chave gratuita em: <a href="https://aistudio.google.com/apikey" target="_blank" class="text-destaque hover:underline">Google AI Studio</a></li>
                            <li>2. Copiar o arquivo <code class="bg-zinc-700 px-2 py-1 rounded">config.example.js</code> para <code class="bg-zinc-700 px-2 py-1 rounded">config.js</code></li>
                            <li>3. Abrir <code class="bg-zinc-700 px-2 py-1 rounded">assets/js/config.js</code></li>
                            <li>4. Inserir sua chave em <code class="bg-zinc-700 px-2 py-1 rounded">GEMINI_API_KEY</code></li>
                        </ol>
                    </div>
                `;
            } else {
                errorMessage = `
                    <div class="text-center space-y-2">
                        <p class="text-red-400 font-bold">❌ Erro ao gerar sugestão</p>
                        <p class="text-zinc-400 text-sm">${error.message || 'Tente novamente mais tarde.'}</p>
                    </div>
                `;
            }

            resultCard.innerHTML = errorMessage;
        } finally {
            setLoading(false);
        }
    }

    function setLoading(isLoading) {
        const formCard = document.getElementById('formCard');

        if (isLoading) {
            generateButton.disabled = true;
            generateButton.classList.add('btn-loading');
            generateButton.textContent = ''; // Limpa o texto

            // Esconde o formulário e mostra o card de resultado com loading
            formCard.classList.add('hidden');
            resultCard.classList.remove('hidden');
            resultCard.classList.add('flex', 'items-center', 'justify-center');

            resultCard.innerHTML = `
                <div class="flex flex-col items-center justify-center gap-3 opacity-70">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="animate-pulse">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 3c1.918 0 3.52 1.35 3.91 3.151a4 4 0 0 1 2.09 7.723l0 7.126h-12v-7.126a4 4 0 1 1 2.092 -7.723a4 4 0 0 1 3.908 -3.151z" />
                        <path d="M6.161 17.009l11.839 -.009" />
                    </svg>
                    <span class="text-center">Gerando sua sugestão...</span>
                </div>
            `;
        } else {
            // Remove as classes de centralização quando mostra o resultado
            resultCard.classList.remove('flex', 'items-center', 'justify-center');

            generateButton.disabled = false;
            generateButton.classList.remove('btn-loading');
            generateButton.textContent = originalButtonText; // Restaura o texto original
        }
    }

    // Função de wrapper para fetch com retentativas
    async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // Se a resposta não for ok, trata como um erro para tentar novamente
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (retries > 0) {
                // Não loga retentativas no console como erro
                await new Promise(res => setTimeout(res, delay));
                return fetchWithRetry(url, options, retries - 1, delay * 2);
            } else {
                // Joga o erro final se todas as retentativas falharem
                throw error;
            }
        }
    }

    async function callGeminiAPI(systemPrompt, userQuery) {
        // Usa o proxy serverless (Netlify Function) — o endpoint deve existir em produção
        const PROXY_ENDPOINT = '/.netlify/functions/gemini';

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, userQuery })
        };

        // fetchWithRetry já retorna JSON quando a resposta é ok
        const data = await fetchWithRetry(PROXY_ENDPOINT, options, 3, 1000);

        // A resposta pode variar conforme a versão da API. Suportamos múltiplos formatos.
        // 1) data.text (caso a function retorne um campo text simplificado)
        if (typeof data === 'string') return data;
        if (data?.text) return data.text;

        // 2) Estrutura do modelo: candidates[0].content.parts[0].text
        try {
            const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) return candidateText;
        } catch (e) { /* ignore */ }

        // 3) Alguns endpoints podem retornar generated_text ou output[0]
        if (data?.generated_text) return data.generated_text;
        if (Array.isArray(data?.output) && data.output[0]?.content) {
            return data.output[0].content;
        }

        throw new Error('Resposta do proxy em formato inesperado. Veja console para detalhes.');
    }

    // --- LÓGICA DE ABAS DO HEADER (EVENT DELEGATION - DINÂMICO) ---
    document.addEventListener('click', (e) => {
        // 1. Verifica se clicou numa aba do App
        const tab = e.target.closest('.app-tab');

        if (tab) {
            e.preventDefault();

            // Ignora aba Progresso
            if (tab.dataset.tab === 'progress') return;

            // 2. Segurança: Confirmação se houver dados não salvos
            if (typeof workoutFormView !== 'undefined' && !workoutFormView.classList.contains('hidden')) {
                const hasUnsaved = localStorage.getItem('track2lift_draft') || (typeof editingWorkoutId !== 'undefined' && editingWorkoutId);
                if (hasUnsaved) {
                    if (!confirm("Sair do formulário? Dados não salvos serão perdidos.")) return;
                }
                if (typeof showDashboardView === 'function') showDashboardView();
            }

            // 3. Atualiza VISUAL dos Botões (Header)
            // Busca todos os botões frescos para garantir
            const allTabs = document.querySelectorAll('.app-tab');
            allTabs.forEach(t => {
                t.classList.remove('text-destaque', 'border-destaque', 'font-bold');
                t.classList.add('text-zinc-400', 'border-transparent', 'font-medium');
            });

            // Ativa o clicado
            tab.classList.remove('text-zinc-400', 'border-transparent', 'font-medium');
            tab.classList.add('text-destaque', 'border-destaque', 'font-bold');

            // 4. Alterna o CONTEÚDO (Aba de baixo)
            const targetId = `tab-${tab.dataset.tab}`;

            // AQUI ESTÁ A CORREÇÃO: Busca as divs de conteúdo NA HORA do clique
            const allContents = document.querySelectorAll('.tab-content');

            if (allContents.length === 0) {
                console.error("Erro: Nenhuma div com classe .tab-content encontrada.");
            }

            allContents.forEach(content => {
                if (content.id === targetId) {
                    content.classList.remove('hidden'); // Mostra a certa
                } else {
                    content.classList.add('hidden');    // Esconde as outras
                }
            });
        }
    });

    // --- GERADOR DE DIETA (APP INTERNO) ---
    if (generateDietBtn) {
        generateDietBtn.addEventListener('click', async () => {
            const goal = document.querySelector('input[name="appDietGoal"]:checked').value;
            const ingredients = appDietIngredients.value;

            if (!ingredients) {
                alert("Por favor, digite suas preferências ou ingredientes.");
                return;
            }

            // Estado de Loading
            generateDietBtn.disabled = true;
            generateDietBtn.innerHTML = `<span class="animate-spin mr-2">⏳</span> Gerando Plano...`;
            dietPlaceholder.classList.add('hidden');
            dietContent.classList.remove('hidden');
            dietContent.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full gap-4 text-zinc-400">
                    <div class="w-12 h-12 border-4 border-zinc-700 border-t-destaque rounded-full animate-spin"></div>
                    <p>A IA está montando seu cardápio completo...</p>
                </div>
            `;

            const prompt = `Você é um nutricionista esportivo de elite.
            Objetivo do aluno: ${goal}.
            Preferências/Ingredientes: ${ingredients}.
            
            Crie um plano alimentar diário COMPLETO (Café, Almoço, Lanche, Jantar).
            Para cada refeição, liste os alimentos e quantidades aproximadas.
            No final, forneça uma estimativa total de Calorias, Proteínas, Carboidratos e Gorduras.
            
            Use formatação HTML rica:
            - Use <h3> para nomes das refeições (ex: Café da Manhã)
            - Use <ul> para listas de alimentos
            - Use <strong> para destacar os macros no final
            - Não use Markdown, apenas HTML puro limpo (sem tags html/body).`;

            try {
                const response = await fetch('/.netlify/functions/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemPrompt: "Nutricionista Esportivo",
                        userQuery: prompt
                    })
                });

                const data = await response.json();
                let text = data.text || (data.candidates && data.candidates[0].content.parts[0].text) || "Erro ao ler resposta.";

                // Limpeza básica
                text = text.replace(/```html/g, '').replace(/```/g, '');

                dietContent.innerHTML = text;

            } catch (error) {
                console.error(error);
                dietContent.innerHTML = `<div class="text-red-500 text-center">Erro ao gerar dieta. Verifique sua conexão ou tente novamente.</div>`;
            } finally {
                generateDietBtn.disabled = false;
                generateDietBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z"/><path d="M9 12h6"/><path d="M12 9v6"/></svg>
                    Gerar Novo Plano
                `;
            }
        });
    }
})();

// Animação de palavras aleatórias (Hero Section e Auth Screen)
(function () {
    const wordElements = []; // Array global para armazenar todas as palavras de todos os containers

    // Função para gerar a textura de palavras (Versão CORRIGIDA - Full Coverage)
    function generateWordTexture(targetId, containerId) {
        const targetSection = document.getElementById(targetId);
        if (!targetSection) return;

        if (document.getElementById(containerId)) return;

        const wordsContainer = document.createElement('div');
        wordsContainer.id = containerId;

        // --- CORREÇÃO DO LAYOUT ---
        // 1. Removemos 'inset-0' e 'w-full' que limitavam o tamanho.
        // 2. Usamos width 120% e height 150% para garantir que sobre para todos os lados.
        // 3. Posicionamos negativo (top/left) para centralizar esse excesso.
        wordsContainer.className = "absolute -top-[20%] -left-[10%] w-[120%] h-[150%] overflow-hidden pointer-events-none select-none z-0 flex flex-wrap content-start";

        const words = [
            'FOCO', 'EVOLUÇÃO', 'PROGRESSO', 'ELITE', 'MOTIVAÇÃO',
            'DISCIPLINA', 'FORÇA', 'SUPERAÇÃO', 'RESULTADO',
            'CONQUISTA', 'DETERMINAÇÃO', 'VITÓRIA', 'PERSISTÊNCIA',
            'AMBIÇÃO', 'CONSISTÊNCIA', 'RESILIÊNCIA', 'EXCELÊNCIA',
            'ESTRATÉGIA', 'DEDICAÇÃO'
        ];

        const numRepetitions = 100;

        for (let i = 0; i < numRepetitions; i++) {
            words.forEach(word => {
                const wordEl = document.createElement('span');
                wordEl.textContent = word + ' ';

                // --- ESTILO RESTAURADO ---
                // Voltei para 'leading-loose' (espaçamento normal/bom)
                // Mantive mr-8 para espaçamento lateral equilibrado
                wordEl.className = "inline-block mr-8 text-lg font-bold text-zinc-600 leading-loose opacity-[0.05] transition-all duration-500";

                wordsContainer.appendChild(wordEl);
                wordElements.push(wordEl);
            });
        }

        targetSection.insertBefore(wordsContainer, targetSection.firstChild);
    }

    // 1. Gera textura para a Hero Section
    generateWordTexture('hero-section', 'animated-words-container');

    // 2. Gera textura para a Auth Screen (Login)
    generateWordTexture('authContainer', 'auth-words-container');

    // 3. Gera textura para Configurações
    generateWordTexture('accountSettingsContainer', 'settings-words-container');
    // 4. Gera textura para Onboarding
    generateWordTexture('onboardingContainer', 'onboarding-words-container');


    // Lógica de Animação
    let animationInterval = null;
    let currentRedWord = null;

    // Verifica se o elemento está visível na tela (Viewport global)
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();

        // Verifica se o elemento tem tamanho (não está hidden) e está dentro da janela visível
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.top >= -50 && // Pequena margem
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 50 &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    function animateRandomWord() {
        // Limpa palavra anterior
        if (currentRedWord) {
            currentRedWord.classList.remove('word-highlight');
            currentRedWord.classList.add('word-removing');

            const oldWord = currentRedWord;
            setTimeout(() => {
                if (oldWord) oldWord.classList.remove('word-removing');
            }, 800);
        }

        // Filtra apenas palavras que estão ATUALMENTE visíveis na tela
        // Isso alterna automaticamente entre Hero e Auth dependendo de qual tela o usuário está
        const visibleWords = wordElements.filter(word => isElementInViewport(word));

        if (visibleWords.length === 0) return;

        const randomIndex = Math.floor(Math.random() * visibleWords.length);
        currentRedWord = visibleWords[randomIndex];
        currentRedWord.classList.add('word-highlight');
    }

    function startAnimation() {
        if (!animationInterval) {
            // Pequeno delay inicial para garantir renderização
            setTimeout(() => {
                animateRandomWord();
                animationInterval = setInterval(animateRandomWord, 2500);
            }, 500);
        }
    }

    startAnimation();
})();

// =====================
// Dieta: Cálculo e Logs
// =====================
(async function () {
    // Função de Cálculo Metabólico (Versão com Busca em Tempo Real)
    async function calculateDietTargets() {
        console.log("Calculando dieta...");

        // 1. Busca dados frescos do servidor (Ignora cache local antigo)
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
            console.error("Erro ao buscar dados do usuário para dieta:", error);
            return;
        }

        // Atualiza a variável global para garantir sincronia
        currentUser = data.user;
        const meta = currentUser.user_metadata || {};

        console.log("Dados encontrados:", meta); // Veja isso no console!

        // 2. Converte para números (Tratamento de erro robusto)
        const weight = parseFloat(meta.weight) || 0;
        const height = parseFloat(meta.height) || 0;
        const age = parseInt(meta.age) || 0;
        const goal = meta.goal || 'Manutenção';

        // 3. Validação
        if (weight === 0 || height === 0 || age === 0) {
            console.warn("Dados incompletos/zerados:", { weight, height, age });
            if (dietTargetCal) dietTargetCal.textContent = "---";
            if (dietGoalLabel) dietGoalLabel.textContent = "Complete seu Perfil";
            return;
        }

        // 4. Fórmula Mifflin-St Jeor
        // (10 x peso) + (6.25 x altura) - (5 x idade) + 5
        let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;

        // Fator de Atividade (1.55)
        const activityFactor = 1.55;
        const tdee = Math.round(bmr * activityFactor);

        // 5. Ajuste pelo Objetivo
        let target = tdee;
        let label = "Manutenção";

        if (goal === 'Emagrecimento') {
            target = tdee - 500;
            label = "Déficit Calórico";
        } else if (goal === 'Hipertrofia') {
            target = tdee + 300;
            label = "Superávit Calórico";
        }

        dailyTarget = target;

        // 6. Atualiza UI
        if (dietTargetCal) dietTargetCal.textContent = target;
        if (dietBMR) dietBMR.textContent = Math.round(bmr);
        if (dietTDEE) dietTDEE.textContent = tdee;
        if (dietGoalLabel) dietGoalLabel.textContent = label;

        if (typeof updateDietProgress === 'function') updateDietProgress();
    }

    // Carrega os logs do dia e atualiza UI
    async function loadDietLogs() {
        if (!currentUser) {
            if (dietPlaceholder) dietPlaceholder.classList.remove('hidden');
            return;
        }

        const today = new Date().toISOString().slice(0, 10);

        try {
            const { data, error } = await supabase
                .from('diet_logs')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('date', today)
                .order('created_at', { ascending: false });

            if (error) throw error;

            let totalCal = 0;
            let totalProt = 0;
            let totalCarb = 0;
            let totalFat = 0;

            if (dietLogList) dietLogList.innerHTML = '';

            if (!data || data.length === 0) {
                if (dietPlaceholder) {
                    dietPlaceholder.classList.remove('hidden');
                    dietContent.classList.add('hidden');
                }
                updateDietProgress(0);
                return;
            }

            data.forEach(item => {
                const kcal = Number(item.kcal) || 0;
                const protein = Number(item.protein) || 0;
                const carbs = Number(item.carbs) || 0;
                const fat = Number(item.fat) || 0;

                totalCal += kcal;
                totalProt += protein;
                totalCarb += carbs;
                totalFat += fat;

                if (dietLogList) {
                    const li = document.createElement('li');
                    li.className = 'py-2 border-b border-zinc-700 flex justify-between items-start';
                    li.innerHTML = `
                        <div>
                            <div class="font-bold text-sm">${item.name || 'Refeição'}</div>
                            <div class="text-zinc-400 text-sm">${item.description || ''}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-bold">${kcal} kcal</div>
                            <div class="text-zinc-400 text-xs">P ${protein} • C ${carbs} • G ${fat}</div>
                        </div>
                    `;
                    dietLogList.appendChild(li);
                }
            });

            if (dietPlaceholder) dietPlaceholder.classList.add('hidden');
            if (dietContent) dietContent.classList.remove('hidden');

            if (dietConsumedProt) dietConsumedProt.textContent = Math.round(totalProt) + ' g';
            if (dietConsumedCarb) dietConsumedCarb.textContent = Math.round(totalCarb) + ' g';
            if (dietConsumedFat) dietConsumedFat.textContent = Math.round(totalFat) + ' g';

            updateDietProgress(totalCal);
        } catch (e) {
            console.warn('Erro ao carregar diet logs:', e);
            if (dietPlaceholder) dietPlaceholder.classList.remove('hidden');
        }
    }

    function updateDietProgress(totalCal) {
        const pct = dailyTarget > 0 ? Math.min(100, Math.round((totalCal / dailyTarget) * 100)) : 0;
        if (dietProgressBar) dietProgressBar.style.width = pct + '%';
        if (dietConsumedCal) dietConsumedCal.textContent = (totalCal || 0) + ' kcal';

        // Mudança de cor simples
        if (dietProgressBar) {
            if (pct >= 100) {
                dietProgressBar.classList.remove('bg-destaque');
                dietProgressBar.classList.add('bg-yellow-500');
            } else {
                dietProgressBar.classList.add('bg-destaque');
                dietProgressBar.classList.remove('bg-yellow-500');
            }
        }
    }

    // Eventos: salvar refeição gerada e adicionar refeição manual
    if (addCustomMealBtn) {
        addCustomMealBtn.addEventListener('click', async () => {
            const name = prompt('Nome da refeição:');
            if (!name) return;
            const kcal = parseFloat(prompt('Kcal (ex: 450):')) || 0;
            const protein = parseFloat(prompt('Proteínas (g):')) || 0;
            const carbs = parseFloat(prompt('Carboidratos (g):')) || 0;
            const fat = parseFloat(prompt('Gorduras (g):')) || 0;

            try {
                const today = new Date().toISOString().slice(0, 10);
                const { error } = await supabase.from('diet_logs').insert([{ user_id: currentUser.id, date: today, name, description: '', kcal, protein, carbs, fat, is_generated: false }]);
                if (error) throw error;
                alert('Refeição adicionada');
                loadDietLogs();
            } catch (e) {
                console.error('Erro ao salvar refeição:', e);
                alert('Erro ao salvar. Veja console.');
            }
        });
    }

    if (saveGeneratedMealBtn) {
        saveGeneratedMealBtn.addEventListener('click', async () => {
            // Se não há meal gerada, pergunta manualmente
            let meal = currentGeneratedMeal;
            if (!meal) {
                const ok = confirm('Não há refeição gerada atualmente. Deseja adicionar manualmente?');
                if (!ok) return;
                const name = prompt('Nome da refeição:');
                const kcal = parseFloat(prompt('Kcal (ex: 450):')) || 0;
                const protein = parseFloat(prompt('Proteínas (g):')) || 0;
                const carbs = parseFloat(prompt('Carboidratos (g):')) || 0;
                const fat = parseFloat(prompt('Gorduras (g):')) || 0;
                meal = { name, description: '', kcal, protein, carbs, fat };
            }

            try {
                const today = new Date().toISOString().slice(0, 10);
                const { error } = await supabase.from('diet_logs').insert([{ user_id: currentUser.id, date: today, name: meal.name, description: meal.description || '', kcal: meal.kcal, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, is_generated: true }]);
                if (error) throw error;
                alert('Refeição salva no diário');
                currentGeneratedMeal = null;
                loadDietLogs();
            } catch (e) {
                console.error('Erro ao salvar refeição gerada:', e);
                alert('Erro ao salvar a refeição. Veja console.');
            }
        });
    }

    // Expose helpers for debugging
    window.calculateDietTargets = calculateDietTargets;
    window.loadDietLogs = loadDietLogs;
    window.updateDietProgress = updateDietProgress;

})();


