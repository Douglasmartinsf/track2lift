

# Track2Lift — t2l_mobile

> SPA React + Vite + TypeScript projetada para gerenciamento de treinos, controle de dieta e visualização de progresso. Este README é focado em apresentar o projeto tecnicamente para fins de portfólio.

Resumo rápido
- Projeto single-page com UI responsiva para criar/editar treinos, registrar refeições e acompanhar progresso.
- Implementado com foco em estrutura modular: componentes reutilizáveis, serviços para lógica de domínio e integração com Supabase para autenticação/armazenamento.

Stack técnico
- Frontend: `React` + `TypeScript` + `Vite`
- UI: CSS + `framer-motion` para animações leves
- Gráficos: `recharts`
- Autenticação / persistência: `@supabase/supabase-js`
- Outras: `lucide-react` (ícones)

Estrutura do repositório
- `components/` — componentes visuais e mapas interativos (ex.: `MuscleMap.tsx`).
- `views/` — páginas principais (Dashboard, Onboarding, Settings, Auth).
- `views/tabs/` — abas usadas no dashboard (Workouts, Diet, Progress, etc.).
- `services/` — lógica de domínio (gestão de treinos e dieta, cliente Supabase).
- `modals/` e `settings/` — gerência de rotinas, refeições e preferências.

Destaques técnicos (para mostrar em portfólio)
- Mapeamento interativo de músculos com SVG: `components/MuscleMap.tsx`.
- Lógica de catálogo/identificação de exercícios e persistência de preferências: `services/workoutService.ts`.
- Helpers de nutrição e integração com APIs externas em `services/dietService.ts`.
- Estrutura modular pensada para ser facilmente expandida para backend microservices.

Executando localmente

1. Instale dependências:

```bash
npm install
```

2. Crie um arquivo `.env.local` com as variáveis necessárias (ex.: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

3. Rode em modo desenvolvimento:

```bash
npm run dev
```

Build para produção

```bash
npm run build
npm run preview
```

Observações para portfólio
- Inclua imagens ou GIFs do app no README do repositório do portfólio para mostrar as telas-chave (Dashboard, visualização de treino e gráficos de progresso).
- No resumo do projeto (ex.: página do portfólio), destaque decisões arquiteturais (por que `Supabase`, escolha do Vite/TS, modularidade dos `services`).

Arquivos-chave para revisar
- `components/MuscleMap.tsx` — mapa de músculos e interação SVG
- `services/workoutService.ts` — catálogo de exercícios e lógica de treino
- `services/dietService.ts` — cálculos nutricionais e fetchers
- `services/supabaseClient.ts` — configuração do cliente Supabase

Contato / Demo
- Se este repositório for usado em um portfólio público, adicione um link de demo ou screenshots no topo do README.

---
Este README foi escrito para ser direto e técnico — se quiser que eu gere uma versão em inglês ou com imagens e GIFs embutidos, posso criar os assets e atualizar o arquivo.
