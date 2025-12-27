# Copilot / AI Assistant Instructions — Track2Lift (t2l_mobile)

Summary
- Small React + Vite + TypeScript SPA focused on workouts, diet and a simple AI coach.
- Key integrations: Supabase (auth + user metadata) and Google Gemini/GenAI client used from the frontend.

Quick commands
- Install: `npm install`
- Dev: `npm run dev` (Vite)
```instructions
# Instruções do Assistente — Track2Lift (t2l_mobile)

Resumo
- SPA pequena em React + Vite + TypeScript para treinos, dieta e um coach AI.
- Integrações principais: Supabase (auth + metadata) e GenAI (atualmente chamado do frontend).

Comandos rápidos
- Instalar: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

Ambiente e segredos
- Usa variáveis Vite (`import.meta.env`) — também pode ler `process.env` no ambiente Node.
- Variáveis importantes:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `GEMINI_API_KEY` (usada em `views/tabs/AICoach.tsx` — no frontend em dev)
- Nunca comite chaves. Coloque em `.env.local` e use um backend para chamadas seguras em produção.

Arquitetura (alto nível)
- UI: `components/`, `views/` e `views/tabs/`.
- Lógica: `services/workoutService.ts`, `services/dietService.ts`, `services/supabaseClient.ts`.
- AI: `views/tabs/AICoach.tsx` monta prompts e chama a API GenAI. Para produção, mova as chamadas para um backend.

Convenções importantes
- Texto/strings: preferir português nas mensagens e prompts.
- `MuscleMap.tsx` depende de ids SVG específicos (ex.: `peito`, `costas`, `deltoide_anterior`, `biceps`, etc.). Preserve-os ao editar o SVG.
- `workoutService.ts` contém lógica de identificação de músculos/exercícios — alterações devem manter a compatibilidade.

Riscos e recomendações
- Substituir chamadas GenAI do frontend por um proxy/back-end para proteger `GEMINI_API_KEY`.
- Rever `supabaseClient.ts` para remover valores hardcoded antes de publicar.

Onde inspecionar
- `services/workoutService.ts` — catálogo e lógica de exercícios
- `services/supabaseClient.ts` — configuração do Supabase
- `views/tabs/AICoach.tsx` — prompt e uso do GenAI
- `services/dietService.ts` — helpers de nutrição

Contribuindo
- Teste localmente com `npm run dev` e variáveis apropriadas em `.env.local`.
- Preserve o estilo de prompts em português e o contexto do usuário (idade, peso, altura, objetivo) para o AI Coach.

``` 
