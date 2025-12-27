
# Track2Lift — t2l_mobile

Aplicativo SPA em React + Vite + TypeScript focado em treinos, dieta e um coach AI simples.

## Começando (Desenvolvimento)

Pré-requisitos: `Node.js` (v16+ recomendado)

- Instalar dependências:

```bash
npm install
```

- Criar um arquivo `.env.local` a partir de exemplo e adicionar chaves necessárias (não comitar):

```
GEMINI_API_KEY=seu_token_gemini
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

- Rodar em modo desenvolvimento:

```bash
npm run dev
```

## Build e Preview

```bash
npm run build
npm run preview
```

## Principais pontos

- Arquitetura: `components/`, `views/`, `services/`.
- Integrações: Supabase (auth + metadata) e GenAI (cliente usado no frontend — para produção mover para backend).
- Mensagens e prompts do coach AI estão em `views/tabs/AICoach.tsx`.

## Segurança

- Nunca comite chaves privadas. Use `.env.local` e um backend para proteger chaves de APIs de terceiros.

## Contribuição rápida

- Rodar `npm install` e `npm run dev`.
- Testar fluxos de autenticação Supabase e a aba do AI Coach localmente.

---
Arquivo de instruções do assistente e detalhes adicionais estão em `.github/copilot-instructions.md`.
