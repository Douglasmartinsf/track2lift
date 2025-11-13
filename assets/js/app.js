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
    } catch (e) {
        console.error("Erro ao inicializar Supabase. Verifique o CDN.", e);
        const authMessage = document.getElementById('authMessage');
        if (authMessage) {
            authMessage.textContent = "Erro crítico ao carregar o app. Verifique o console.";
            authMessage.style.color = "#DC2626";
        }
        return;
    }

    // --- Validação de Configuração (Apenas para Gemini local) ---
    if (!window.APP_CONFIG || !window.APP_CONFIG.GEMINI_API_KEY) {
        console.warn("Aviso: config.js não encontrado ou GEMINI_API_KEY faltando. A demo de IA pode falhar localmente.");
    }

    // --- Seletores de Navegação ---
    const landingPageContainer = document.getElementById('landingPageContainer');
    const appContainer = document.getElementById('appContainer');
    const authContainer = document.getElementById('authContainer');

    const headerNavMenu = document.querySelector('.nav-menu');
    const headerCtaButton = document.querySelector('header .cta-button');
    const logoLink = document.querySelector('header a[aria-label="TRACK2LIFT"]');
    const logoutButton = document.getElementById('logoutButton');

    // Botões CTA da Landing Page
    const ctaButtons = document.querySelectorAll('a[href="#download"], a[href="#features"]#heroCTA');

    // --- Seletores do App (Dashboard) ---
    const dashboardView = document.getElementById('dashboardView');
    const showWorkoutFormBtn = document.getElementById('showWorkoutFormBtn');
    const savedWorkoutsList = document.getElementById('savedWorkoutsList');
    const noWorkoutsMessage = document.getElementById('noWorkoutsMessage');

    // --- Seletores do App (Formulário) ---
    const workoutFormView = document.getElementById('workoutFormView');
    const goBackToDashboardBtn = document.getElementById('goBackToDashboardBtn');
    const workoutDateInput = document.getElementById('workoutDate');
    const workoutNameInput = document.getElementById('workoutName');
    const exerciseListContainer = document.getElementById('exerciseListContainer');
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const saveWorkoutBtn = document.getElementById('saveWorkoutBtn');

    // --- Seletores de Auth ---
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');
    const authErrorMsg = document.getElementById('authErrorMsg');

    let exerciseCounter = 0;
    let currentUser = null;

    // --- Navegação SPA ---
    function showLandingPage() {
        landingPageContainer?.classList.remove('hidden');
        appContainer?.classList.add('hidden');
        authContainer?.classList.add('hidden');
        // Restaurar header para o modo Landing: garantir que o menu esteja visível e com layout md:flex
        headerNavMenu?.classList.add('md:flex');
        headerNavMenu?.classList.remove('hidden');
        headerCtaButton?.classList.remove('hidden');
        // Reexibir seções que o auth pode ter escondido — usa style.display para forçar quando necessário
        ['hero-section', 'features', 'ai-demo', 'progress'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('hidden');
                // Remove qualquer ocultação inline aplicada anteriormente
                if (el.style && el.style.display === 'none') el.style.display = '';
            }
        });

        window.scrollTo(0, 0);
    }

    function showAuthPage() {
        landingPageContainer?.classList.add('hidden');
        appContainer?.classList.add('hidden');
        authContainer?.classList.remove('hidden');
        headerNavMenu?.classList.add('hidden');
        headerCtaButton?.classList.add('hidden');
        // Esconder seções principais explicitamente (caso estejam fora do landingPageContainer)
        // Usa style.display = 'none' para forçar a ocultação mesmo que outras classes interfiram
        ['hero-section', 'features', 'ai-demo', 'progress'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('hidden');
                try {
                    el.style.display = 'none';
                } catch (e) {
                    // ignora
                }
            }
        });

        window.scrollTo(0, 0);
    }


    function showAppPage() {
        landingPageContainer?.classList.add('hidden');
        appContainer?.classList.remove('hidden');
        authContainer?.classList.add('hidden');
        headerNavMenu?.classList.add('hidden');
        headerCtaButton?.classList.add('hidden');
        showDashboardView();
        window.scrollTo(0, 0);
    }

    function showDashboardView() {
        dashboardView?.classList.remove('hidden');
        workoutFormView?.classList.add('hidden');
        loadWorkouts();
    }

    function showWorkoutFormView() {
        dashboardView?.classList.add('hidden');
        workoutFormView?.classList.remove('hidden');
        exerciseListContainer.innerHTML = '';
        exerciseCounter = 0;
        addExerciseBlock();
        if (workoutDateInput && !workoutDateInput.value) {
            workoutDateInput.valueAsDate = new Date();
        }
        if (workoutNameInput) workoutNameInput.value = '';
    }

    // --- Auth Logic ---
    async function handleLogin(e) {
        e.preventDefault();
        authErrorMsg.textContent = '';
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            authErrorMsg.textContent = error.message;
            return;
        }
        currentUser = data.user;
        showAppPage();
    }

    async function handleSignup(e) {
        e.preventDefault();
        authErrorMsg.textContent = '';
        const email = signupForm.email.value;
        const password = signupForm.password.value;
        const { error, data } = await supabase.auth.signUp({ email, password });
        if (error) {
            authErrorMsg.textContent = error.message;
            return;
        }
        currentUser = data.user;
        showAppPage();
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        currentUser = null;
        showLandingPage();
    }

    // --- Persistência Supabase ---
    async function loadWorkouts() {
        if (!currentUser) return;
        const { data: workouts, error } = await supabase
            .from('workouts')
            .select('id, date, name, exercises')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false });
        if (error) {
            savedWorkoutsList.innerHTML = `<div class="text-red-500">Erro ao carregar treinos: ${error.message}</div>`;
            return;
        }
        if (!workouts || workouts.length === 0) {
            noWorkoutsMessage?.classList.remove('hidden');
            savedWorkoutsList.innerHTML = '';
            return;
        }
        noWorkoutsMessage?.classList.add('hidden');
        savedWorkoutsList.innerHTML = '';
        workouts.forEach(workout => {
            const formattedDate = new Date(workout.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const workoutHtml = `
                <div class="bg-card p-4 rounded-lg border border-zinc-700 flex justify-between items-center">
                    <div>
                        <h4 class="text-xl font-bold">${workout.name || 'Treino Rápido'}</h4>
                        <p class="text-zinc-400">${formattedDate}</p>
                    </div>
                    <span class="text-zinc-500">${workout.exercises?.length || 0} exercícios</span>
                </div>
            `;
            savedWorkoutsList.insertAdjacentHTML('beforeend', workoutHtml);
        });
    }

    async function saveWorkoutToSupabase() {
        if (!currentUser) return;
        const workoutData = {
            user_id: currentUser.id,
            date: workoutDateInput.value,
            name: workoutNameInput.value || 'Treino Rápido',
            exercises: []
        };
        const exerciseBlocks = exerciseListContainer.querySelectorAll('.exercise-block');
        exerciseBlocks.forEach(block => {
            const exerciseName = block.querySelector('.exercise-name-input').value;
            if (!exerciseName) return;
            const exercise = { name: exerciseName, sets: [] };
            const setRows = block.querySelectorAll('.set-row');
            setRows.forEach(row => {
                const reps = row.querySelector('.reps-input').value;
                const weight = row.querySelector('.weight-input').value;
                if (reps || weight) {
                    exercise.sets.push({ reps: reps || 0, weight: weight || 0 });
                }
            });
            workoutData.exercises.push(exercise);
        });
        if (workoutData.exercises.length === 0) {
            alert('Adicione pelo menos um exercício com nome.');
            return;
        }
        const { error } = await supabase.from('workouts').insert([workoutData]);
        if (error) {
            alert('Erro ao salvar treino: ' + error.message);
            return;
        }
        showDashboardView();
    }

    // --- Lógica do Logger de Treino (Formulário) ---
    function addExerciseBlock() {
        exerciseCounter++;
        const exerciseId = `exercise-${exerciseCounter}`;
        const exerciseHtml = `
            <div id="${exerciseId}" class="exercise-block bg-zinc-800 p-4 rounded-lg border border-zinc-700 space-y-4">
                <div class="flex justify-between items-center gap-4">
                    <input type="text"
                        class="exercise-name-input w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-texto focus:outline-none focus:border-destaque"
                        placeholder="Nome do Exercício (ex: Supino Reto)">
                    <button class="remove-exercise-btn text-zinc-400 hover:text-red-500 transition duration-300" data-target="${exerciseId}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
                <div class="sets-container space-y-3"></div>
                <button class="add-set-btn w-full bg-destaque bg-opacity-20 hover:bg-opacity-40 text-destaque font-semibold py-2 px-4 rounded-lg transition duration-300">
                    Adicionar Série
                </button>
            </div>
        `;
        exerciseListContainer.insertAdjacentHTML('beforeend', exerciseHtml);
        const newBlock = document.getElementById(exerciseId);
        const setsContainer = newBlock.querySelector('.sets-container');
        addSetBlock(setsContainer);
    }

    function addSetBlock(setsContainer) {
        const setCount = setsContainer.children.length + 1;
        const setHtml = `
            <div class="set-row grid grid-cols-3 gap-3 items-center">
                <span class="text-zinc-300 font-medium text-center">Série ${setCount}</span>
                <input type="number"
                    class="reps-input w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-texto focus:outline-none focus:border-destaque"
                    placeholder="Reps">
                <input type="number"
                    class="weight-input w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-texto focus:outline-none focus:border-destaque"
                    placeholder="Peso (kg)">
            </div>
        `;
        setsContainer.insertAdjacentHTML('beforeend', setHtml);
    }

    // --- Event Listeners ---
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthPage();
        });
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
    goBackToDashboardBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboardView();
    });
    addExerciseBtn?.addEventListener('click', addExerciseBlock);
    saveWorkoutBtn?.addEventListener('click', saveWorkoutToSupabase);

    // Delegação para botões dinâmicos
    exerciseListContainer?.addEventListener('click', function (e) {
        const addSetBtn = e.target.closest('.add-set-btn');
        if (addSetBtn) {
            const setsContainer = addSetBtn.previousElementSibling;
            addSetBlock(setsContainer);
        }
        const removeBtn = e.target.closest('.remove-exercise-btn');
        if (removeBtn) {
            const targetId = removeBtn.dataset.target;
            const exerciseElement = document.getElementById(targetId);
            if (exerciseElement) {
                if (exerciseListContainer.children.length > 1) {
                    exerciseElement.remove();
                } else {
                    alert('Você deve ter pelo menos um exercício.');
                }
            }
        }
    });

    // Auth forms
    loginForm?.addEventListener('submit', handleLogin);
    signupForm?.addEventListener('submit', handleSignup);
    switchToSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        authErrorMsg.textContent = '';
    });
    switchToLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authErrorMsg.textContent = '';
    });

    // --- Sessão Persistente ---
    async function checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
            currentUser = session.user;
            showAppPage();
        } else {
            showLandingPage();
        }
    }
    checkSession();

    // Atualiza sessão ao logar/deslogar
    supabase.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
            currentUser = session.user;
            showAppPage();
        } else {
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
})();

// Animação de palavras aleatórias na hero section
(function () {
    const heroSection = document.getElementById('hero-section');
    const heroCTA = document.getElementById('heroCTA');

    if (!heroSection || !heroCTA) return;

    // Criar container de palavras individuais
    const wordsContainer = document.createElement('div');
    wordsContainer.id = 'animated-words-container';

    const words = [
        'FOCO', 'EVOLUÇÃO', 'PROGRESSO', 'ELITE', 'MOTIVAÇÃO',
        'DISCIPLINA', 'FORÇA', 'SUPERAÇÃO', 'RESULTADO',
        'CONQUISTA', 'DETERMINAÇÃO', 'VITÓRIA', 'PERSISTÊNCIA',
        'AMBIÇÃO', 'CONSISTÊNCIA', 'RESILIÊNCIA', 'EXCELÊNCIA',
        'ESTRATÉGIA', 'DEDICAÇÃO'
    ];

    // Repetir as palavras múltiplas vezes para preencher o background
    const wordElements = [];
    const numRepetitions = 17; // Número de repetições do conjunto de palavras

    for (let i = 0; i < numRepetitions; i++) {
        words.forEach(word => {
            const wordEl = document.createElement('span');
            wordEl.textContent = word + ' ';
            wordsContainer.appendChild(wordEl);
            wordElements.push(wordEl);
        });
    }

    heroSection.insertBefore(wordsContainer, heroSection.firstChild);

    let animationInterval = null;
    let currentRedWord = null;

    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        const heroRect = heroSection.getBoundingClientRect();

        return (
            rect.top >= heroRect.top &&
            rect.left >= heroRect.left &&
            rect.bottom <= heroRect.bottom &&
            rect.right <= heroRect.right
        );
    }

    function animateRandomWord() {
        // Aplica animação de remoção na palavra anterior
        if (currentRedWord) {
            currentRedWord.classList.remove('word-highlight');
            currentRedWord.classList.add('word-removing');

            // Remove a classe de remoção após a animação terminar
            setTimeout(() => {
                if (currentRedWord) {
                    currentRedWord.classList.remove('word-removing');
                }
            }, 800); // Duração da animação de remoção
        }

        // Filtra apenas palavras visíveis na hero section
        const visibleWords = wordElements.filter(word => isElementInViewport(word));

        if (visibleWords.length === 0) return; // Se não houver palavras visíveis, não faz nada

        // Seleciona uma palavra aleatória entre as visíveis
        const randomIndex = Math.floor(Math.random() * visibleWords.length);
        currentRedWord = visibleWords[randomIndex];

        // Aplica a classe de destaque
        currentRedWord.classList.add('word-highlight');
    }

    function startAnimation() {
        if (!animationInterval) {
            animateRandomWord();
            animationInterval = setInterval(animateRandomWord, 2500); // Troca a cada 2.5s
        }
    }

    // Inicia a animação
    startAnimation();
})();


