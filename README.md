# TRACK2LIFT — Visão Geral do Projeto

TRACK2LIFT é uma aplicação front-end estática (single-page) focada em rastreamento de treinos, registro de exercícios e visualização de progresso com integração experimental de IA. O repositório contém a landing page pública, a aplicação interna (login/dashboard), e recursos estáticos (CSS, imagens, SVGs, scripts) organizados para evitar processos de build.

Visão geral das funcionalidades
- Landing Page: seção pública com hero, chamadas para ação e visual atrativo (textura tipográfica e gráficos decorativos). Serve como ponto de atração e introdução ao produto.
- Autenticação: tela de login/cadastro integrada com Supabase; fluxos de sessão, alteração de senha e gerenciamento de conta estão implementados no front-end.
- Dashboard: lista de treinos salvos, cartões com resumo, indicadores rápidos (ex.: número de exercícios) e ação para editar/excluir treinos.
- Formulário de Treino: criação/edição de treinos com blocos de exercício; cada bloco suporta modos `strength` (reps + peso) e `cardio` (duração), séries dinâmicas e autosave local (rascunho).
- Visualização corporal: recurso decorativo/funcional que injeta um SVG de musculatura e destaca grupos musculares relacionados aos exercícios do treino.
- Integração IA (demo): botão de demonstração que usa uma função serverless para chamar a API Gemini de forma segura (proxy), exibindo sugestões e conteúdos gerados.

Arquitetura e principais tecnologias
- Frontend: HTML estático + Tailwind CSS (CDN) + Vanilla JS.
- Charts: Chart.js para visualizações de progresso (dashboard/hero).
- Backend-as-a-Service: Supabase para autenticação e persistência (tabela `workouts`, campo `exercises` em JSONB).
- Serverless: função proxy (ex.: Netlify Functions) usada para encapsular a Gemini API Key e evitar exposição no cliente.

Principais pontos técnicos
- Organização sem build: todos os arquivos são servidos estáticamente; `app.js` contém a lógica principal e é carregado com `defer`.
- Gerenciamento de SVG: o SVG de musculatura (`assets/img/muscle.svg`) é carregado uma vez e cacheado em memória (`cachedMuscleSvg`). A função `getBodyWatermark(activeGroups, svgContent)` gera uma versão inline do SVG com grupos colorizados por `id`.
- UX do formulário: cada exercício salva um `type` (`strength` ou `cardio`) e `sets` no formato apropriado — isso simplifica renderização e edição de treinos no dashboard.
- Heurísticas de identificação: `identifyMuscleGroup(exerciseName)` mapeia nomes de exercícios para grupos usando um catálogo granular e palavras-chave.

Conteúdo do repositório (diretório de alto nível)
- `index.html` — landing page + mount points para o app
- `assets/`
   - `css/` — estilos locais e fallbacks (inclui `styles.css`, `hero-texture.css`)
   - `js/`
      - `tailwind-config.js` — define `window.tailwind.config` antes do CDN
      - `app.js` — lógica principal (auth, UI, forms, charts, SVG painting, integração Gemini)
      - `analytics.js` — GA4 helper (event tracking)
   - `img/` — imagens e `muscle.svg` usado para a visualização corporal
   - `fonts/` — fontes customizadas (logo)
- `logo/` — assets da marca
- `netlify/functions/` — funções serverless (proxy Gemini)

Modelo de dados (resumo)
O principal documento persistido é `workout`, com um campo `exercises` que contém um array de exercícios; cada exercício possui `name`, `type` e `sets`. Exemplo simplificado:

```json
{
   "date": "2025-11-22",
   "name": "Treino A",
   "exercises": [
      { "name": "Supino Reto", "type": "strength", "sets": [{ "reps": 8, "weight": 80 }] },
      { "name": "Esteira", "type": "cardio", "sets": [{ "duration": 20 }] }
   ]
}
```

Segurança (visão resumida)
- Chaves sensíveis não devem estar no repositório. Use um proxy serverless e variáveis de ambiente no provedor de hospedagem.
- A chave do Supabase usada em frontend deve ser `anon`. Regras de Row-Level Security (RLS) devem ser configuradas para garantir isolamento entre usuários.

