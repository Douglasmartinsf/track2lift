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
        // Detecta se está rodando em produção (Netlify) ou local
        const isProduction = window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1' &&
            !window.location.hostname.includes('192.168.');

        if (isProduction) {
            // Produção: usa Netlify Function (API Key segura no servidor)
            const functionUrl = '/.netlify/functions/gemini';

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userQuery })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data.text;

        } else {
            // Local: usa config.js (desenvolvimento)
            const apiKey = window.APP_CONFIG?.GEMINI_API_KEY || "";

            if (!apiKey || apiKey.trim() === "") {
                throw new Error("API_KEY_MISSING");
            }

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{
                    parts: [{ text: userQuery }]
                }],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
            };

            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            };

            const result = await fetchWithRetry(apiUrl, options);

            const candidate = result.candidates?.[0];
            if (candidate && candidate.content?.parts?.[0]?.text) {
                return candidate.content.parts[0].text;
            } else {
                throw new Error("Resposta da API em formato inesperado.");
            }
        }
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


