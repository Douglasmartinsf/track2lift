# Instruções para Agentes AI - TRACK2LIFT

Este é um **site estático single-page** (HTML/CSS/JS) sem backend ou build. Foco em mudanças incrementais e testáveis.

## Arquitetura

**Stack**: Página única (`index.html`) + Tailwind CSS via CDN + Chart.js + Google Gemini API  
**Sem build**: Nenhum bundler, transpilador ou gerenciador de pacotes. O navegador carrega tudo diretamente.

### Estrutura de arquivos
```
index.html              # Fonte única de UI e estrutura DOM
assets/
  js/
    tailwind-config.js  # DEVE carregar ANTES do CDN do Tailwind
    app.js             # Toda lógica JS (charts, Gemini, handlers) - carregado com defer
  css/
    styles.css         # Fallbacks de cores + @font-face + .btn-loading + .nav-menu
    hero-texture.css   # Textura de palavras motivacionais + z-index layering para hero
  fonts/
    MontserratAlt1-ExtraBold.{woff,woff2}  # Fonte da logo
logo/
  logo.svg            # Logo principal no header
  logo.png            # Versões alternativas
```

## Ordem de carregamento crítica

No `<head>` de `index.html`:
1. `assets/js/tailwind-config.js` → Define `window.tailwind.config` com cores customizadas
2. `https://cdn.tailwindcss.com` → Processa a config e gera utilitários
3. `assets/css/styles.css` → Fallbacks e estilos locais

⚠️ **Nunca inverta** a ordem dos itens 1 e 2, ou as cores customizadas não serão aplicadas.

## Cores e temas

Todas as cores customizadas estão em `tailwind-config.js`:
- `fundo`: `#181818` (background escuro)
- `texto`: `#FCFCFC` (texto principal claro)
- `destaque`: `#DC2626` (vermelho brand)
- `card`: `#27272a` (zinc-800 para cards)

Use as classes Tailwind inline: `bg-destaque`, `text-texto`, `hover:bg-red-700`.  
Fallbacks CSS existem em `styles.css` caso o CDN falhe.

## Layout e navegação

### Header
- **Estrutura**: Grid com 3 colunas (`grid grid-cols-3`)
  - Coluna 1: Logo SVG (`h-5 md:h-6 lg:h-7`)
  - Coluna 2: Menu de navegação centralizado com links e separadores `|` vermelhos
  - Coluna 3: Botão CTA alinhado à direita
- **Menu**: Classe `.nav-menu` aplicada para efeito de underline animado no hover
- **Links**: Recursos, IA, Progresso (âncoras para seções da página)
- **Sticky**: Header fixo no topo com `sticky top-0 z-50`

## IDs DOM usados por scripts

### IDs em `app.js` (carregado com `defer`)
- `#currentYear` → Footer com ano dinâmico
- `#progressChart` → Gráfico de progresso principal (seção #progress)
- `#generateButton`, `#resultCard`, `#objetivoSelect`, `#ingredientesInput` → Demo Gemini AI

### IDs em script inline (final do `<body>`)
- `#heroProgressChart` → Canvas decorativo na hero section com plugins customizados (`fillExtensionPlugin`, `arrowPlugin`)

### Outros elementos importantes
- `#siteLogo` → Logo SVG no header (classes: `h-5 md:h-6 lg:h-7`)
- `.nav-menu` → Container do menu para underline animado

**Ao renomear um ID ou classe**, atualize todos os scripts que o referenciam.

## Integração Gemini AI

`app.js` implementa `callGeminiAPI(systemPrompt, userQuery)`:
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`
- Retry automático via `fetchWithRetry(url, options, retries, delay)`
- Estado de loading: adiciona classe `.btn-loading` ao botão (spinner CSS puro)

⚠️ **Segurança**: `apiKey` está vazio no código. Não comite chaves reais. Para produção, use proxy/backend ou variáveis de ambiente.

HTML retornado pela API é injetado diretamente em `#resultCard`. Se precisar sanitizar, use DOMPurify ou limite os prompts.

## Convenções de código

1. **HTML**: Use classes Tailwind inline. Evite estilos inline `style=""` (exceto via JS).
2. **JS**: IIFEs para evitar poluição global. Ex: `(function() { /* código */ })();`
3. **CSS**: Apenas fallbacks e utilidades que o CDN não gera (`.btn-loading`, `@keyframes spin`, `.nav-menu` para underline animation).
4. **Fontes**: `MontserratAlt1` é local (`.logo-font` em CSS). Inter vem do Google Fonts.
5. **Ícones**: Tabler Icons (SVG inline) com cor `#DC2626` (destaque) nas features.

## Fluxo de desenvolvimento

### Teste local (obrigatório)
```powershell
python -m http.server 8000
```
Depois abra `http://localhost:8000`. **Não use `file://`** (CORS bloqueia fetch da API).

### Workflow típico
1. Edite `index.html` para mudanças de UI
2. Edite `app.js` para lógica/handlers
3. Recarregue o navegador (sem build)
4. Confira console do navegador para erros de JS

### Chart.js
**Gráfico principal** (`#progressChart` em `app.js`):
- Dados: `[65, 69, 68, 73, 76, 75, 80, 83]` (8 semanas de progressão realista)
- Gradiente: `rgba(220, 38, 38, 0.6)` → `rgba(220, 38, 38, 0.05)`
- Escala Y: min 60, max 90, step 5
- Tooltips customizados: mostra valores com unidade "kg"

**Gráfico hero** (`#heroProgressChart` inline no final do HTML):
- **Canvas duplo**: `#heroBackgroundCanvas` (z-index: 2) + `#heroProgressChart` (z-index: 4)
- **Background canvas**: Desenha gradiente semi-transparente para cobrir palavras motivacionais
- **Chart canvas**: Gráfico de linha transparente sobre o background
- **Dados**: 140 pontos com oscilações tipo ações usando gerador seeded random (seed=48)
- **Plugins customizados**:
  - `fillExtensionPlugin`: estende o preenchimento do gráfico até a borda direita
- **Cores**: `borderColor: 'rgba(255,50,50,0.6)'`, `borderWidth: 4`, `backgroundColor: 'rgba(220,38,38,0.2)'`
- **Performance**: `animation: false` para carregamento instantâneo
- Altura ajustada dinamicamente para preencher a hero section

## Hero Section - Textura de palavras motivacionais

**Arquivo**: `assets/css/hero-texture.css` + `assets/js/app.js`

### Z-index layering (ordem de baixo para cima):
1. **z-index: 0** → `#animated-words-container` - Palavras motivacionais criadas via JS (opacity: 0.036)
2. **z-index: 3** → `#hero-section::after` - Máscara radial suave (rgba 0.5-0.85 no hover)
3. **z-index: 5** → Elementos decorativos (3 gradientes vermelhos com blur, opacity: 0.07)
4. **z-index: 10** → Conteúdo (texto, logo, botões)

### Implementação das palavras (via JavaScript):
- **Container**: `#animated-words-container` criado dinamicamente em `app.js`
- **Palavras**: Array de 19 palavras motivacionais repetidas 17 vezes (323 palavras totais)
  - Lista: 'FOCO', 'EVOLUÇÃO', 'PROGRESSO', 'ELITE', 'MOTIVAÇÃO', 'DISCIPLINA', 'FORÇA', 'SUPERAÇÃO', 'RESULTADO', 'CONQUISTA', 'DETERMINAÇÃO', 'VITÓRIA', 'PERSISTÊNCIA', 'AMBIÇÃO', 'CONSISTÊNCIA', 'RESILIÊNCIA', 'EXCELÊNCIA', 'ESTRATÉGIA', 'DEDICAÇÃO'
- **Posicionamento**: `left: -10%; right: -10%` (estende além das bordas)
- **Font**: bold, 1.5rem, line-height 2.5, margin-right 2rem (espaçamento entre palavras)
- **Cor padrão**: `#a1a1aa` (zinc-400)
- **Opacidade padrão**: 0.036

### Animações de palavras:
1. **Animação aleatória (sem hover)**:
   - Uma palavra visível aleatória fica vermelha a cada 2.5s
   - Cor: `#EF4444` (red-500), Opacity: 0.35
   - Contorno animado: `text-stroke-draw` (1.2s)
   - Remoção suave: `text-stroke-remove` (0.8s)
   - Verificação de viewport: apenas palavras visíveis na hero section

2. **Efeito de hover no botão CTA**:
   - Todas as palavras ficam vermelhas simultaneamente
   - Cor: `#EF4444` (red-500), Opacity: 0.45
   - Transform: `scale(1.05)`
   - Contorno animado: `text-stroke-draw` (1.2s)
   - Fade mask intensifica: ellipse 90%×100%, opacity 0.85 no centro

### Animações de contorno (keyframes):
- **`text-stroke-draw`**: 4 estágios (0% → 25% → 50% → 75% → 100%)
  - Stroke evolui de 2px transparente para 1px rgba(255,255,255,0.6)
  - Text-shadow progressivo em todas as direções
- **`text-stroke-remove`**: Reverso suave em 0.8s
  - Remove stroke e shadows gradualmente

### Elementos decorativos:
- **3 círculos com gradiente e blur**:
  1. Superior esquerdo: 550px, `bg-gradient-to-tr`, blur-150px
  2. Superior direito: 550px, `bg-gradient-to-tl`, blur-150px
  3. Inferior direito: 350px, `bg-gradient-to-tr`, blur-200px
- **Propriedades anti-animação**: `animation: none`, `transform: translateZ(0)`, `backface-visibility: hidden`
- **Isolamento**: Container com `isolation: isolate` para evitar interferência de rendering

### Fade mask (::after):
- **Estado normal**: `radial-gradient(ellipse 80% 60%...)`
  - Centro: rgba(24,24,24,0.5)
  - Transição suave para transparente
- **Estado hover**: `radial-gradient(ellipse 90% 100%...)`
  - Centro: rgba(24,24,24,0.85) - muito mais escuro
  - Área vertical: 100% (cobertura completa)
  - Transição: 0.4s ease

### IDs e classes críticas:
- `#hero-section` - Container principal
- `#heroCTA` - Botão que dispara efeitos de hover
- `#animated-words-container` - Container de palavras (criado via JS)
- `.word-highlight` - Palavra com destaque vermelho individual
- `.word-removing` - Palavra em processo de remoção de efeito

### Comportamento JavaScript:
- `isElementInViewport(el)` - Verifica se palavra está visível
- `animateRandomWord()` - Seleciona e destaca palavra aleatória
- `startAnimation()` - Inicia intervalo de 2.5s
- `stopAnimation()` - Para animação no hover
- Event listeners: `mouseenter` e `mouseleave` no `#heroCTA`
- Limpeza de estilos inline no `mouseleave` para evitar conflitos

## O que evitar

- ❌ Adicionar `package.json`, Webpack, Vite, ou qualquer bundler sem discutir primeiro
- ❌ Remover fallbacks CSS (importantes para CDN offline)
- ❌ Injetar bibliotecas pesadas (prefira vanilla JS ou micro-libs via CDN)
- ❌ Ignorar os atributos `onerror` nas imagens (UX para logos inexistentes)
- ❌ Quebrar a ordem de carregamento `tailwind-config.js` → CDN Tailwind

## Extensões futuras

Se o usuário pedir:
- **Backend para Gemini**: Sugira Node.js/Express serverless ou Cloudflare Workers
- **Build otimizado**: Adicione Vite + safelist do Tailwind + minificação
- **Multi-page**: Considere migrar para framework (Astro, 11ty) mantendo simplicidade
