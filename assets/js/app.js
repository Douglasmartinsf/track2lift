/*
=================================================
=== 🚀 TRACK2LIFT: ARQUIVO MESTRE (CORRIGIDO) ===
=================================================
*/

import { supabase } from './lib/supabaseClient.js';
import { handleLogin as authHandleLogin, handleSignup as authHandleSignup, handleLogout as authHandleLogout } from './modules/auth.js';
import { initDietModule, calculateDietTargets, loadDietLogs, openMealModal } from './modules/diet.js';
import { initWorkoutModule, loadWorkouts as loadWorkoutsModule, loadWorkoutForEditing as loadWorkoutForEditingModule, loadWorkoutDraft as loadWorkoutDraftModule, showWorkoutFormView as showWorkoutFormViewModule, clearEditingWorkout, viewDate, getFormattedDateString as getWorkoutFormattedDateString, updateWorkoutDateDisplay } from './modules/workout.js';
import { EXERCISE_CATALOG, identifyMuscleGroup } from './lib/exercises.js';
import { showToast, showConfirmDialog } from './lib/ui-utils.js';

(function () {
    // --- 2. SELETORES GLOBAIS ---
    const landingPageContainer = document.getElementById('landingPageContainer');
    const appContainer = document.getElementById('appContainer');
    const authContainer = document.getElementById('authContainer');
    const changePasswordContainer = document.getElementById('changePasswordContainer');
    const accountSettingsContainer = document.getElementById('accountSettingsContainer');
    const onboardingContainer = document.getElementById('onboardingContainer');

    const headerNavMenu = document.querySelector('nav');
    const publicNavMenu = document.getElementById('publicNavMenu');
    const appNavMenu = document.getElementById('appNavMenu');
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    const logoLink = document.querySelector('header a[aria-label="TRACK2LIFT"]');
    const siteFooter = document.querySelector('footer');

    const publicAuthButtons = document.getElementById('publicAuthButtons');
    const loggedUserMenu = document.getElementById('loggedUserMenu');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const menuGoToApp = document.getElementById('menuGoToApp');
    const menuAccountSettings = document.getElementById('menuAccountSettings');
    const menuChangePassword = document.getElementById('menuChangePassword');
    const menuReportBug = document.getElementById('menuReportBug');
    const menuLogout = document.getElementById('menuLogout');
    // Backwards-compatible selector: some templates use `logoutButton`
    const logoutButton = document.getElementById('logoutButton') || menuLogout;

    const dashboardView = document.getElementById('dashboardView');
    const workoutFormView = document.getElementById('workoutFormView');
    const userNameDisplay = document.getElementById('userNameDisplay');


    // Dieta: moved to `modules/diet.js` (selectors and listeners removed here)

    // Outros
    const onboardingName = document.getElementById('onboardingName');
    const onboardingForm = document.getElementById('onboardingForm');
    const finishOnboardingBtn = document.getElementById('finishOnboardingBtn');
    const onboardingErrorMsg = document.getElementById('onboardingErrorMsg');

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

    const showWorkoutFormBtn = document.getElementById('showWorkoutFormBtn');
    const savedWorkoutsList = document.getElementById('savedWorkoutsList');
    const noWorkoutsMessage = document.getElementById('noWorkoutsMessage');
    const goBackToDashboardBtn = document.getElementById('goBackToDashboardBtn');
    const workoutDateInput = document.getElementById('workoutDate');
    const workoutNameInput = document.getElementById('workoutName');
    const exerciseListContainer = document.getElementById('exerciseListContainer');

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const recoveryForm = document.getElementById('recoveryForm');
    const authToggleButton = document.getElementById('authToggleButton');
    const authErrorMsg = document.getElementById('authErrorMsg');
    const authFooter = document.getElementById('authFooter');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const recoveryButton = document.getElementById('recoveryButton');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    const backToLandingBtn = document.getElementById('backToLandingBtn');


    const newPasswordInput = document.getElementById('newPasswordInput');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const passwordMsg = document.getElementById('passwordMsg');

    let currentUser = null;
    let cachedMuscleSvg = null;
    let dailyTarget = 2000;
    // Controle do handler atual do botão principal para permitir remoção
    let currentMainButtonHandler = null;

    // --- 3. DADOS ESTÁTICOS ---
    // EXERCISE_CATALOG and identifyMuscleGroup are imported from './lib/exercises.js'

    const TBCA_DATA = [
        { name: "Arroz Branco Cozido", cal: 128, prot: 2.5, carb: 28.1, fat: 0.2 },
        { name: "Arroz Integral Cozido", cal: 124, prot: 2.6, carb: 25.8, fat: 1.0 },
        { name: "Feijão Carioca Cozido", cal: 76, prot: 4.8, carb: 13.6, fat: 0.5 },
        { name: "Frango Grelhado", cal: 159, prot: 32.0, carb: 0.0, fat: 2.5 },
        { name: "Carne Moída (Patinho)", cal: 219, prot: 35.9, carb: 0.0, fat: 7.3 },
        { name: "Ovo Cozido", cal: 146, prot: 13.3, carb: 0.6, fat: 9.5 },
        { name: "Ovo Frito", cal: 240, prot: 15.6, carb: 1.2, fat: 18.6 },
        { name: "Pão Francês (50g)", cal: 150, prot: 4.0, carb: 29.3, fat: 1.5 },
        { name: "Pão Integral (Fatia)", cal: 120, prot: 4.5, carb: 22.0, fat: 1.8 },
        { name: "Batata Doce Cozida", cal: 77, prot: 0.6, carb: 18.4, fat: 0.1 },
        { name: "Banana Prata", cal: 98, prot: 1.3, carb: 26.0, fat: 0.1 },
        { name: "Aveia em Flocos", cal: 394, prot: 13.9, carb: 66.6, fat: 8.5 },
        { name: "Leite Integral", cal: 60, prot: 3.2, carb: 4.6, fat: 3.3 },
        { name: "Whey Protein (30g)", cal: 120, prot: 24.0, carb: 3.0, fat: 1.5 },
        { name: "Azeite de Oliva", cal: 884, prot: 0.0, carb: 0.0, fat: 100.0 },
        { name: "Tapioca", cal: 230, prot: 0.0, carb: 54.0, fat: 0.0 },
        { name: "Salada Variada", cal: 20, prot: 1.0, carb: 3.0, fat: 0.0 }
    ].sort((a, b) => a.name.localeCompare(b.name));

    const MUSCLE_SVG_MAP = {
        'Peito': ['Peito'], 'Costas': ['Costas'], 'Ombros': ['Ombro'],
        'Bíceps': ['Biceps'], 'Tríceps': ['Triceps'], 'Antebraço': ['Antebraço'],
        'Quadríceps': ['Quadriceps'], 'Posterior': ['Posterior'], 'Panturrilha': ['Panturrilha'],
        'Abdômen': ['Abdomen'], 'Cardio': ['Contorno'], 'Geral': ['Contorno'],
        // Grupo extra usado para destacar partes genéricas/outros no SVG
        // O id no SVG é 'Outros' (maiúsculo), portanto mantemos a capitalização
        'Outros': ['Outros']
    };

    // ==========================================
    // 4. FUNÇÕES HELPERS (Restauradas)
    // ==========================================



    function setHeaderNavVisibility(mode) {
        // Ensure menus stay hidden on small screens by keeping the base `hidden` class
        // and toggle only the `md:flex` class so they show on medium+ breakpoints.
        if (publicNavMenu) { publicNavMenu.classList.add('hidden'); publicNavMenu.classList.remove('md:flex'); }
        if (appNavMenu) { appNavMenu.classList.add('hidden'); appNavMenu.classList.remove('md:flex'); }

        if (mode === 'public' && publicNavMenu) {
            publicNavMenu.classList.add('hidden');
            publicNavMenu.classList.add('md:flex');
            // Garantir que o headerNavMenu também seja visível
            if (headerNavMenu) {
                headerNavMenu.classList.remove('hidden');
                headerNavMenu.classList.add('md:flex');
            }
        }

        if (mode === 'app' && appNavMenu) {
            appNavMenu.classList.add('hidden');
            appNavMenu.classList.add('md:flex');
            // Garantir que o headerNavMenu também seja visível
            if (headerNavMenu) {
                headerNavMenu.classList.remove('hidden');
                headerNavMenu.classList.add('md:flex');
            }
        }

        // Update mobile menu content to match the selected header mode
        if (typeof mobileMenu !== 'undefined' && mobileMenu) {
            if (mode === 'public') {
                mobileMenu.innerHTML = `
                    <div class="px-6 py-4 space-y-4">
                        <a href="#features" class="block text-zinc-300 hover:text-destaque transition duration-300 font-medium py-2">Recursos</a>
                        <a href="#ai-demo" class="block text-zinc-300 hover:text-destaque transition duration-300 font-medium py-2">IA</a>
                        <a href="#progress" class="block text-zinc-300 hover:text-destaque transition duration-300 font-medium py-2">Progresso</a>
                        <a href="#download" class="block bg-destaque text-texto font-bold py-3 px-5 rounded-lg hover:bg-red-700 text-center mt-4">Acessar Agora</a>
                    </div>`;
            } else if (mode === 'app') {
                mobileMenu.innerHTML = `
                    <div class="px-6 py-4 space-y-4">
                        <button data-tab="workouts" class="app-tab block w-full text-left text-zinc-300 hover:text-destaque transition duration-300 font-medium py-2">Treinos</button>
                        <button data-tab="diet" class="app-tab block w-full text-left text-zinc-300 hover:text-destaque transition duration-300 font-medium py-2">Dieta</button>
                        <button data-tab="progress" class="app-tab block w-full text-left text-zinc-300 hover:text-destaque transition duration-300 font-medium py-2">Progresso</button>
                                </div>`;
            } else {
                mobileMenu.innerHTML = '';
            }
            // ensure the mobile menu is hidden after swapping content
            mobileMenu.classList.add('hidden');
        }
        // Hide the public "Ir para o app" link when we're already in the app
        if (menuGoToApp) {
            if (mode === 'app') menuGoToApp.classList.add('hidden');
            else menuGoToApp.classList.remove('hidden');
        }
    }

    // Header action handlers (podem ser alternados entre 'Registrar Treino' e 'Registrar Refeição')
    function headerOpenMeal(e) {
        if (e && e.preventDefault) e.preventDefault();
        openMealModal();
    }

    function updateHeaderActionForTab(tabName) {
        // Gerenciar workoutActions baseado na aba
        const workoutActions = document.getElementById('workoutActions');
        if (workoutActions) {
            if (tabName === 'diet') {
                // Adicionar botão de adicionar refeição na aba de dieta
                workoutActions.innerHTML = `
                    <button id="headerAddMealBtn" class="flex items-center gap-2 bg-destaque text-texto hover:bg-red-700 transition px-4 py-2 rounded-lg font-bold" title="Adicionar Refeição">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                        <span class="hidden lg:inline text-sm">Adicionar Refeição</span>
                    </button>
                `;
                // Adicionar event listener
                setTimeout(() => {
                    document.getElementById('headerAddMealBtn')?.addEventListener('click', () => {
                        openMealModal();
                    });
                }, 50);
            } else {
                // Limpar para outras abas (workouts, progresso, etc)
                // loadWorkouts() vai popular os botões se for workouts
                workoutActions.innerHTML = '';
            }
        }

        if (!showWorkoutFormBtn) return;

        // Normalize: remove both possible listeners to avoid duplicates
        try { showWorkoutFormBtn.removeEventListener('click', showWorkoutFormView); } catch (e) { }
        try { showWorkoutFormBtn.removeEventListener('click', headerOpenMeal); } catch (e) { }

        // Also remove any dynamically attached main-button handler
        try { if (currentMainButtonHandler) showWorkoutFormBtn.removeEventListener('click', currentMainButtonHandler); } catch (e) { }

        if (tabName === 'diet') {
            // Change label/icon to Registrar Refeição and attach meal handler
            showWorkoutFormBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14M5 12h14" />
                </svg>
                Registrar Refeição`;
            showWorkoutFormBtn.addEventListener('click', headerOpenMeal);
        } else {
            // Default: Registrar Novo Treino
            showWorkoutFormBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14M5 12h14" />
                </svg>
                Registrar Novo Treino`;
            showWorkoutFormBtn.addEventListener('click', showWorkoutFormView);
        }
        // If switching to workouts tab, ensure workouts are loaded so the button state can sync
        if (tabName === 'workouts') loadWorkouts();
    }

    // Atualiza dinamicamente o botão principal com base no estado dos treinos do dia
    function updateMainWorkoutButton(detail) {
        // Verificar se estamos na aba de treinos
        const activeTab = document.querySelector('.tab-button.active');
        const isWorkoutsTab = activeTab && activeTab.dataset.tab === 'workouts';

        // Só atualizar se estivermos na aba de treinos
        if (!isWorkoutsTab) return;

        // Show a small "Adicionar Treino" button in the dashboard header when
        // there is no workout for the day. If there's a workout, remove the CTA.
        const { hasWorkout } = detail || {};
        // Find the dashboard header container (left: greeting, right: actions)
        const headerContainer = document.querySelector('#dashboardView > div.flex.justify-between.items-center') || document.querySelector('#dashboardView > div');
        if (!headerContainer) return;
        const rightSide = headerContainer.children && headerContainer.children[1] ? headerContainer.children[1] : headerContainer;

        const existing = document.getElementById('addWorkoutBtn');
        if (hasWorkout) {
            if (existing) existing.remove();
            return;
        }

        if (!existing) {
            const btn = document.createElement('button');
            btn.id = 'addWorkoutBtn';
            btn.type = 'button';
            btn.className = 'cta-button bg-destaque text-texto font-bold py-2 px-4 rounded-lg flex items-center gap-2 no-hover-anim';
            // Ensure no hover/focus animation: inject a small CSS rule once and mark the button
            if (!document.getElementById('noHoverAnimStyles')) {
                const style = document.createElement('style');
                style.id = 'noHoverAnimStyles';
                style.innerHTML = `
                    .no-hover-anim { transition: none !important; transform: none !important; box-shadow: none !important; }
                    .no-hover-anim:hover, .no-hover-anim:focus { transform: none !important; box-shadow: none !important; outline: none !important; }
                    /* Disable pseudo-element animations that draw the contour */
                    .no-hover-anim::before, .no-hover-anim::after,
                    .no-hover-anim:hover::before, .no-hover-anim:hover::after,
                    .no-hover-anim:focus::before, .no-hover-anim:focus::after {
                        display: none !important;
                        animation: none !important;
                        opacity: 0 !important;
                        clip-path: none !important;
                        border: none !important;
                    }
                `;
                document.head.appendChild(style);
            }
            btn.setAttribute('aria-label', 'Adicionar treino para hoje');
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Adicionar Treino`;
            btn.addEventListener('click', (e) => { e.preventDefault(); showWorkoutFormViewModule(); });
            try { rightSide.appendChild(btn); } catch (e) { headerContainer.appendChild(btn); }
        }
    }

    // Atualiza o estado do header (mostra/hide botões públicos e menu do usuário)
    function updateHeaderState() {
        try {
            if (currentUser) {
                // Usuário autenticado
                if (publicAuthButtons) publicAuthButtons.classList.add('hidden');
                if (loggedUserMenu) loggedUserMenu.classList.remove('hidden');

                const meta = currentUser.user_metadata || {};
                let display = meta.name || meta.full_name || currentUser.email || '';
                display = display.toString().split(' ').map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1)) : '').join(' ');
                if (userEmailDisplay) userEmailDisplay.textContent = display;
                if (userNameDisplay) userNameDisplay.textContent = display;
            } else {
                // Nenhum usuário autenticado
                if (publicAuthButtons) publicAuthButtons.classList.remove('hidden');
                if (loggedUserMenu) loggedUserMenu.classList.add('hidden');
                if (userEmailDisplay) userEmailDisplay.textContent = 'Minha Conta';
                if (userNameDisplay) userNameDisplay.textContent = 'Atleta';
            }
        } catch (e) { /* silent */ }
    }

    async function calculateDietTargets() {
        if (!currentUser) return;
        try { const { data } = await supabase.auth.getUser(); if (data?.user) currentUser = data.user; } catch (e) { }

        const meta = currentUser.user_metadata || {};
        const weight = parseFloat(meta.weight) || 0;
        const height = parseFloat(meta.height) || 0;
        const age = parseInt(meta.age) || 0;
        const goal = meta.goal || 'Manutenção';

        if (weight === 0) { if (dietGoalLabel) dietGoalLabel.textContent = "Perfil Incompleto"; return; }

        let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        const tdee = Math.round(bmr * 1.55);
        let target = tdee;
        let label = "Manutenção";

        if (goal === 'Emagrecimento') { target = tdee - 500; label = "Déficit"; }
        if (goal === 'Hipertrofia') { target = tdee + 300; label = "Superávit"; }

        dailyTarget = target;
        if (dietTargetCal) dietTargetCal.textContent = target;
        if (dietBMR) dietBMR.textContent = Math.round(bmr);
        if (dietTDEE) dietTDEE.textContent = tdee;
        if (dietGoalLabel) dietGoalLabel.textContent = label;

        updateDietProgress();
        // Atualiza o ícone do objetivo ao lado do card de Meta Diária
        updateDietGoalIcon(meta.goal || 'Manutenção');
    }

    function createGoalIcon(goal) {
        // Returns an SVG string (red) matching the IA section icons
        if (!goal) goal = 'Manutenção';
        if (goal === 'Emagrecimento') {
            // IA section: Perder Peso (outline-only icon)
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M18.918 8.174c2.56 4.982 .501 11.656 -5.38 12.626c-7.702 1.687 -12.84 -7.716 -7.054 -13.229c.309 -.305 1.161 -1.095 1.516 -1.349c0 .528 .27 3.475 1 3.167c3 0 4 -4.222 3.587 -7.389c2.7 1.411 4.987 3.376 6.331 6.174z" />
                </svg>`;
        }
        if (goal === 'Hipertrofia') {
            // IA section: Ganhar Massa (outline-only icon used in IA cards)
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M2.017 20.305c1.13 1.614 6.042 2.882 8.362-.14c2.51 1.2 6.65.828 10.02-1.052c.468-.261.912-.591 1.183-1.054c.613-1.045.628-2.495-.49-4.634c-1.865-4.655-5.218-8.74-6.572-10.383c-.278-.254-2.052-.614-3.133-.96c-.478-.147-1.367-.246-2.431 1.156c-.505.665-2.796 2.297.111 3.395c.45.115.782.326 2.836-.05c.268-.046.936 0 1.407.827l.983 1.406a.96.96 0 0 1 .17.44c.172 1.5.166 3.376 1.002 4.326c-1.291-.933-4.664-2.042-7.206 1.113M2.001 12.94a6.714 6.714 0 0 1 8.416-.419" />
                </svg>`;
        }
        // Manutenção / default -> Manter Peso
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M7 20l10 0" />
                <path d="M6 6l6 -1l6 1" />
                <path d="M12 3l0 17" />
                <path d="M9 12l-3 -6l-3 6a3 3 0 0 0 6 0" />
                <path d="M21 12l-3 -6l-3 6a3 3 0 0 0 6 0" />
            </svg>`;
    }

    function updateDietGoalIcon(goal) {
        // Locate the card containing dietTargetCal and add the icon to its right
        const target = document.getElementById('dietTargetCal');
        if (!target) return;
        const card = target.closest('.bg-zinc-900');
        if (!card) return;
        // Remove existing icon if present
        const existing = card.querySelector('#dietGoalIcon');
        if (existing) existing.remove();
        const wrapper = document.createElement('div');
        wrapper.id = 'dietGoalIcon';
        wrapper.className = 'absolute right-10 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center pointer-events-none opacity-100';
        wrapper.innerHTML = createGoalIcon(goal);
        card.appendChild(wrapper);
    }

    // `loadDietLogs` is provided by `./modules/diet.js` and imported at the top of this file.
    // Local duplicate removed to ensure imported implementation is used by callers.

    function updateDietProgress(current) {
        const consumed = current !== undefined ? current : parseInt(dietConsumedCal?.textContent || 0);
        const percent = Math.min(100, (consumed / (dailyTarget || 2000)) * 100);
        if (dietProgressBar) dietProgressBar.style.width = `${percent}%`;
    }



    async function loadWorkouts() {
        try {
            await loadWorkoutsModule();
        } catch (err) {
            console.error('Erro ao carregar treinos (module):', err);
        }
    }



    function showLandingPage() {
        [appContainer, authContainer, accountSettingsContainer, onboardingContainer].forEach(e => e?.classList.add('hidden'));
        landingPageContainer?.classList.remove('hidden');
        setHeaderNavVisibility('public');
        if (siteFooter) siteFooter.classList.remove('hidden');
        updateHeaderState();
    }

    async function showAppPage() {
        [landingPageContainer, authContainer, accountSettingsContainer, onboardingContainer].forEach(e => e?.classList.add('hidden'));
        appContainer?.classList.remove('hidden');
        setHeaderNavVisibility('app');
        if (siteFooter) siteFooter.classList.remove('hidden');

        if (currentUser && !currentUser.user_metadata?.goal) { showOnboardingPage(); return; }

        await calculateDietTargets();
        await loadDietLogs();

        // Restaurar a aba ativa antes de abrir as configurações
        const savedTab = sessionStorage.getItem('activeTab');
        const shouldRestoreTab = savedTab && savedTab !== 'workouts';

        if (localStorage.getItem('track2lift_draft')) {
            showWorkoutFormView();
        } else if (!shouldRestoreTab) {
            showDashboardView();
        }

        updateHeaderState();

        // Restaurar a aba salva (se houver)
        if (shouldRestoreTab) {
            const tabButton = document.querySelector(`.app-tab[data-tab="${savedTab}"]`);
            if (tabButton) {
                tabButton.click();
            }
        }
    }

    async function showOnboardingPage() {
        [landingPageContainer, appContainer, authContainer, changePasswordContainer, accountSettingsContainer].forEach(e => e?.classList.add('hidden'));
        onboardingContainer?.classList.remove('hidden');
        if (headerNavMenu) { headerNavMenu.classList.add('hidden'); headerNavMenu.classList.remove('md:flex'); }
        if (siteFooter) siteFooter.classList.add('hidden');

        if (onboardingName) {
            let name = "Atleta";
            if (currentUser) {
                const m = currentUser.user_metadata || {};
                name = m.name || m.full_name || currentUser.email?.split('@')[0] || "Atleta";
            } else {
                try { const { data } = await supabase.auth.getUser(); if (data.user) { currentUser = data.user; name = data.user.user_metadata?.name || "Atleta"; } } catch (e) { }
            }
            onboardingName.textContent = name.charAt(0).toUpperCase() + name.slice(1);
        }
    }

    function showAccountSettingsPage() {
        // Salvar a aba ativa antes de abrir as configurações
        const activeTab = document.querySelector('.app-tab.active');
        if (activeTab) {
            sessionStorage.setItem('activeTab', activeTab.dataset.tab);
        }

        [landingPageContainer, appContainer, authContainer].forEach(e => e?.classList.add('hidden'));
        accountSettingsContainer?.classList.remove('hidden');
        setHeaderNavVisibility('none');
        if (currentUser) {
            const m = currentUser.user_metadata || {};
            if (settingsName) settingsName.value = m.name || '';
            if (settingsEmail) settingsEmail.value = currentUser.email;
            if (settingsAge) settingsAge.value = m.age || '';
            if (settingsWeight) settingsWeight.value = m.weight || '';
            if (settingsHeight) settingsHeight.value = m.height || '';
            if (settingsGoal) settingsGoal.value = m.goal || 'Manutenção';
        }
    }

    function showChangePasswordPage() {
        [landingPageContainer, appContainer, authContainer].forEach(e => e?.classList.add('hidden'));
        changePasswordContainer?.classList.remove('hidden');
        setHeaderNavVisibility('none');
    }

    function showAuthPage() {
        [landingPageContainer, appContainer, accountSettingsContainer].forEach(e => e?.classList.add('hidden'));
        authContainer?.classList.remove('hidden');
        if (headerNavMenu) { headerNavMenu.classList.add('hidden'); headerNavMenu.classList.remove('md:flex'); }
        if (siteFooter) siteFooter.classList.add('hidden');
    }

    function showDashboardView() {
        dashboardView?.classList.remove('hidden');
        workoutFormView?.classList.add('hidden');
        loadWorkouts();
        updateHeaderActionForTab('workouts');
    }

    function showWorkoutFormView() { showWorkoutFormViewModule(); }

    // --- EVENTOS ---
    document.addEventListener('click', async (e) => {
        const tab = e.target.closest('.app-tab');
        if (tab) {
            e.preventDefault();
            if (tab.dataset.tab === 'progress') return;
            if (workoutFormView && !workoutFormView.classList.contains('hidden')) {
                if (localStorage.getItem('track2lift_draft')) {
                    const confirmed = await showConfirmDialog({
                        title: 'Descartar Rascunho',
                        message: 'Você possui um rascunho não salvo. Tem certeza que deseja sair e perder essas alterações?',
                        confirmText: 'Descartar',
                        cancelText: 'Continuar Editando',
                        type: 'warning'
                    });
                    if (!confirmed) return;
                }
                showDashboardView();
            }
            document.querySelectorAll('.app-tab').forEach(t => {
                t.classList.remove('text-destaque', 'border-destaque', 'font-bold');
                t.classList.add('text-zinc-400', 'border-transparent', 'font-medium');
            });
            tab.classList.remove('text-zinc-400', 'border-transparent', 'font-medium');
            tab.classList.add('text-destaque', 'border-destaque', 'font-bold');

            // Salvar a aba ativa no sessionStorage
            sessionStorage.setItem('activeTab', tab.dataset.tab);

            const targetId = `tab-${tab.dataset.tab}`;
            document.querySelectorAll('.tab-content').forEach(c => {
                if (c.id === targetId) c.classList.remove('hidden');
                else c.classList.add('hidden');
            });

            // Update header CTA to match selected tab (workouts/diet/progress)
            updateHeaderActionForTab(tab.dataset.tab);

            // Se for aba de treinos, recarregar para atualizar botões DEPOIS de limpar
            if (tab.dataset.tab === 'workouts') {
                loadWorkouts();
            }

            // Se for aba de dieta, recalcular metas e recarregar logs
            if (tab.dataset.tab === 'diet') {
                (async () => {
                    await calculateDietTargets();
                    await loadDietLogs();
                })();
            }

            // Close mobile menu if open (user selected a tab)
            mobileMenu?.classList.add('hidden');
        }
        const navBtn = e.target.closest('a.cta-button, #heroCTA, #publicAuthButtons a, #menuGoToApp');
        if (navBtn) {
            e.preventDefault();
            if (currentUser) showAppPage(); else showAuthPage();
            // Ensure mobile menu closes after navigation
            mobileMenu?.classList.add('hidden');
        }
    });



    logoLink?.addEventListener('click', (e) => { e.preventDefault(); showLandingPage(); });
    // Mobile menu toggle (hamburger)
    mobileMenuButton?.addEventListener('click', (e) => {
        e.preventDefault();
        // Toggle the mobile menu visibility
        mobileMenu?.classList.toggle('hidden');
        // Toggle aria-expanded if present
        if (mobileMenuButton && mobileMenuButton.hasAttribute('aria-expanded')) {
            const expanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', String(!expanded));
        }
    });
    logoutButton?.addEventListener('click', (e) => { e.preventDefault(); logoutHandler(e); });
    // Note: click handler for `showWorkoutFormBtn` is attached dynamically
    // by `updateHeaderActionForTab` so we avoid adding a global listener here
    // which would conflict with the diet -> meal behavior.
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
        localStorage.removeItem('track2lift_draft');
        clearEditingWorkout();
        showDashboardView();
    });

    // Initialize workout module to wire exercise form listeners
    initWorkoutModule();
    // Recarregar treinos quando a data for alterada pelo módulo de workout
    document.addEventListener('workoutDateChanged', () => { loadWorkouts(); });
    // Atualiza o botão principal quando o módulo de workouts enviar estado
    document.addEventListener('workoutStateChanged', (e) => { updateMainWorkoutButton(e.detail); });
    // Initialize diet module (handles meal modal, saved meals, and diet logs)
    initDietModule();

    loginForm?.addEventListener('submit', handleLoginEvent);
    signupForm?.addEventListener('submit', handleSignupEvent);
    authToggleButton?.addEventListener('click', (e) => { e.preventDefault(); loginForm?.classList.toggle('hidden'); signupForm?.classList.toggle('hidden'); });

    onboardingForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        finishOnboardingBtn.textContent = "Salvando...";
        const age = document.getElementById('obAge').value;
        const weight = document.getElementById('obWeight').value;
        const height = document.getElementById('obHeight').value;
        const goal = document.querySelector('input[name="obGoal"]:checked')?.value;
        await supabase.auth.updateUser({ data: { age, weight, height, goal } });
        const { data } = await supabase.auth.getUser(); currentUser = data.user;
        onboardingContainer.classList.add('hidden');
        if (siteFooter) siteFooter.classList.remove('hidden');
        showAppPage();
    });

    menuAccountSettings?.addEventListener('click', () => showAccountSettingsPage());
    menuReportBug?.addEventListener('click', () => {
        // Abre o GitHub Issues em uma nova aba
        const issueUrl = 'https://github.com/Douglasmartinsf/track2lift/issues/new?template=bug_report.md&title=[BUG]%20';
        window.open(issueUrl, '_blank');
    });

    const menuSuggestions = document.getElementById('menuSuggestions');
    menuSuggestions?.addEventListener('click', () => {
        // Abre o GitHub Issues com template de feature request
        const suggestionUrl = 'https://github.com/Douglasmartinsf/track2lift/issues/new?template=feature_request.md&title=[SUGEST%C3%83O]%20';
        window.open(suggestionUrl, '_blank');
    });

    closeSettingsBtn?.addEventListener('click', () => showAppPage());
    saveSettingsBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        saveSettingsBtn.textContent = "Salvando...";
        const updates = { data: { name: settingsName.value, age: settingsAge.value, weight: settingsWeight.value, height: settingsHeight.value, goal: settingsGoal.value } };
        if (settingsEmail.value !== currentUser.email) updates.email = settingsEmail.value;
        if (settingsNewPassword.value) updates.password = settingsNewPassword.value;
        await supabase.auth.updateUser(updates);
        const { data } = await supabase.auth.getUser(); currentUser = data.user;
        saveSettingsBtn.textContent = "Salvo!";
        calculateDietTargets();
        setTimeout(() => saveSettingsBtn.textContent = "Salvar Alterações", 2000);
    });

    deleteAccountBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmed = await showConfirmDialog({
            title: 'Excluir Conta',
            message: 'Tem certeza que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita e todos os seus dados serão perdidos.',
            confirmText: 'Sim, Excluir Minha Conta',
            cancelText: 'Cancelar',
            type: 'danger'
        });
        if (!confirmed) return;

        try {
            deleteAccountBtn.textContent = "Excluindo...";
            deleteAccountBtn.disabled = true;

            // Chamar a função RPC para excluir o usuário e todos os dados associados
            const { error } = await supabase.rpc('delete_own_user');

            if (error) {
                console.error('Erro ao excluir conta:', error);
                showToast('Erro ao excluir conta: ' + error.message, 'error');
                deleteAccountBtn.textContent = "Excluir Conta";
                deleteAccountBtn.disabled = false;
                return;
            }

            // Fazer logout após exclusão bem-sucedida
            await supabase.auth.signOut();
            currentUser = null;
            showToast('Conta excluída com sucesso.', 'success');
            showLandingPage();
        } catch (err) {
            console.error('Erro ao excluir conta:', err);
            showToast('Erro ao excluir conta. Tente novamente.', 'error');
            deleteAccountBtn.textContent = "Excluir Conta";
            deleteAccountBtn.disabled = false;
        }
    });

    forgotPasswordLink?.addEventListener('click', (e) => { e.preventDefault(); loginForm?.classList.add('hidden'); authFooter?.classList.add('hidden'); recoveryForm?.classList.remove('hidden'); });
    backToLoginBtn?.addEventListener('click', (e) => { e.preventDefault(); recoveryForm?.classList.add('hidden'); loginForm?.classList.remove('hidden'); authFooter?.classList.remove('hidden'); });
    backToLandingBtn?.addEventListener('click', (e) => { e.preventDefault(); showLandingPage(); });
    document.getElementById('backToLoginFromSuccess')?.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('signupSuccessMessage')?.classList.add('hidden'); loginForm?.classList.remove('hidden'); authFooter?.classList?.remove('hidden'); });
    recoveryForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('recovery-email')?.value;
        recoveryButton.disabled = true;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) {
            showToast(error.message, 'error');
            recoveryButton.disabled = false;
        }
        else {
            showToast('Verifique seu email! Enviamos um link de recuperação.', 'success');
            setTimeout(() => backToLoginBtn.click(), 2000);
        }
    });

    // --- AUTH & INIT ---
    async function handleLoginEvent(e) {
        e.preventDefault();

        // Limpar mensagem de erro anterior
        if (authErrorMsg) authErrorMsg.textContent = '';

        try {
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const data = await authHandleLogin({ email, password });

            // authHandleLogin returns data similar to supabase.auth.signInWithPassword
            if (data?.user && !data.user.email_confirmed_at) {
                await supabase.auth.signOut();
                if (authErrorMsg) authErrorMsg.textContent = 'Por favor, confirme seu email antes de fazer login.';
                return;
            }

            currentUser = data.user || data?.session?.user || null;
            showAppPage();
        } catch (err) {
            // Exibir erro no elemento authErrorMsg ao invés de alert
            if (authErrorMsg) {
                const errorMessage = err.message || err;
                if (errorMessage.includes('Invalid login credentials')) {
                    authErrorMsg.textContent = 'Email ou senha inválidos. Tente novamente.';
                } else {
                    authErrorMsg.textContent = errorMessage;
                }
            }
        }
    }

    async function handleSignupEvent(e) {
        e.preventDefault();

        // Limpar mensagem de erro anterior
        if (authErrorMsg) authErrorMsg.textContent = '';

        try {
            const email = signupForm.email.value;
            const password = signupForm.password.value;
            const name = document.getElementById('signup-name').value;
            await authHandleSignup({ email, password, name });
            document.getElementById('signupSuccessMessage')?.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } catch (err) {
            // Exibir erro no elemento authErrorMsg ao invés de alert
            if (authErrorMsg) {
                authErrorMsg.textContent = err.message || err;
            }
        }
    }

    async function logoutHandler(e) {
        try {
            if (e && e.preventDefault) e.preventDefault();
            await authHandleLogout();
        } catch (err) { console.error('Logout failed', err); }
        currentUser = null; showLandingPage();
    }

    (async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            currentUser = data.session.user;
            // Atualiza o header imediatamente com o estado da sessão
            updateHeaderState();
            const isOnPasswordReset = changePasswordContainer && !changePasswordContainer.classList.contains('hidden');
            if (!isOnPasswordReset) showAppPage();
        } else {
            showLandingPage();
        }
    })();

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') { currentUser = session?.user; showChangePasswordPage(); return; }
        if (event === 'SIGNED_IN') { currentUser = session.user; if (changePasswordContainer?.classList.contains('hidden')) showAppPage(); }
        if (event === 'SIGNED_OUT') { currentUser = null; showLandingPage(); }
    });

    // --- ANIMAÇÃO ---
    (function () {
        const targets = [
            { id: 'hero-section', container: 'animated-words-container', pos: 'absolute' },
            { id: 'authContainer', container: 'auth-words-container', pos: 'fixed' },
            { id: 'accountSettingsContainer', container: 'settings-words-container', pos: 'fixed' },
            { id: 'onboardingContainer', container: 'onboarding-words-container', pos: 'fixed' },
            { id: 'changePasswordContainer', container: 'pw-words-container', pos: 'fixed' }
        ];
        const words = ['FOCO', 'EVOLUÇÃO', 'PROGRESSO', 'ELITE', 'MOTIVAÇÃO', 'DISCIPLINA', 'FORÇA', 'SUPERAÇÃO'];
        const elements = [];

        targets.forEach(t => {
            const section = document.getElementById(t.id);
            if (!section || document.getElementById(t.container)) return;
            const div = document.createElement('div');
            div.id = t.container;
            div.className = `${t.pos} -top-[10%] -left-[10%] w-[120%] h-[120%] overflow-hidden pointer-events-none z-0 flex flex-wrap content-start`;
            for (let i = 0; i < 100; i++) {
                words.forEach(w => {
                    const span = document.createElement('span');
                    span.textContent = w + ' ';
                    span.className = "inline-block mr-8 text-lg font-bold text-zinc-600 leading-loose opacity-[0.05] transition-all duration-500";
                    div.appendChild(span);
                    elements.push(span);
                });
            }
            section.insertBefore(div, section.firstChild);
        });

        setInterval(() => {
            const visible = elements.filter(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.width > 0; });
            if (!visible.length) return;
            const el = visible[Math.floor(Math.random() * visible.length)];
            el.classList.add('word-highlight');
            setTimeout(() => { el.classList.remove('word-highlight'); el.classList.add('word-removing'); setTimeout(() => el.classList.remove('word-removing'), 800); }, 1500);
        }, 2500);
    })();

    // --- CHART ---
    (function () {
        if (document.getElementById('progressChart')) {
            const ctx = document.getElementById('progressChart').getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(220, 38, 38, 0.6)'); gradient.addColorStop(1, 'rgba(220, 38, 38, 0.05)');
            new Chart(ctx, { type: 'line', data: { labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'], datasets: [{ label: 'Carga', data: [65, 69, 68, 73, 76, 75, 80, 83], borderColor: '#DC2626', backgroundColor: gradient, borderWidth: 3, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 60, max: 90 }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } } });
        }
    })();
})();