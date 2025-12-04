# TRACK2LIFT — Aplicação de Rastreamento de Treinos e Dieta

TRACK2LIFT é uma aplicação web moderna para rastreamento completo de treinos e dieta, com visualização de progresso e integração experimental de IA. Desenvolvida como uma SPA estática com foco em UX profissional e performance.

## 🎯 Funcionalidades Principais

### 💪 Gerenciamento de Treinos
- **Dashboard de Treinos**: Visualização de treinos por data com cards interativos
- **Criação/Edição**: Interface intuitiva para registrar exercícios de força e cardio
- **Templates**: Salve e reutilize templates de treino
- **Exercícios Personalizados**: Crie e gerencie seus próprios exercícios com persistência no Supabase
- **Visualização Corporal**: SVG interativo que destaca grupos musculares trabalhados
- **Autosave**: Rascunho local automático para não perder progresso

### 🍎 Rastreamento de Dieta
- **Registro de Refeições**: Tabela nutricional TBCA integrada com busca inteligente
- **Refeições Salvas**: Salve suas refeições favoritas como templates
- **Cálculo Automático**: Macros calculados automaticamente com base em peso/altura/objetivo
- **Barra de Progresso**: Visualização em tempo real do consumo calórico e macros
- **Histórico**: Visualize refeições por data

### 📊 Progresso e Análises
- **Gráficos Interativos**: Chart.js para visualização de evolução
- **Indicadores**: Volume total, grupos musculares mais trabalhados
- **Histórico**: Navegação por datas com carregamento dinâmico

### 🤖 IA Experimental
- **Sugestões Gemini**: Integração com Google Gemini via proxy serverless
- **Análise de Treinos**: Sugestões baseadas em seus treinos

### 🎨 UX Profissional
- **Sistema de Notificações Toast**: Feedback visual elegante para todas as ações
- **Modais Customizados**: Confirmações e alertas com design consistente
- **Sem Popups Nativos**: 100% da UI usa componentes customizados
- **Animações Suaves**: Transições fluidas em toda a aplicação
- **Responsivo**: Design otimizado para mobile e desktop

## 🏗️ Arquitetura Técnica

### Frontend
- **HTML5 + Tailwind CSS** (CDN) - Design system customizado
- **Vanilla JavaScript ES6 Modules** - Arquitetura modular limpa
- **Chart.js** - Visualizações e gráficos
- **Sem Build Process** - Deploy direto, sem webpack/vite

### Backend & Serviços
- **Supabase**
  - Autenticação completa (login, signup, recuperação de senha, exclusão de conta)
  - PostgreSQL com RLS (Row Level Security)
  - Tabelas: `workouts`, `workout_templates`, `diet_logs`, `saved_meals`, `custom_exercises`
- **Netlify Functions** - Proxy serverless para Gemini API
- **Hospedagem**: Netlify com CDN global

### Estrutura de Dados

**Workout**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "date": "2025-12-04",
  "name": "Treino A",
  "exercises": [
    {
      "name": "Supino Reto",
      "type": "strength",
      "muscleGroup": "Peito",
      "sets": [
        { "reps": 8, "weight": 80 },
        { "reps": 8, "weight": 80 }
      ]
    },
    {
      "name": "Esteira",
      "type": "cardio",
      "sets": [{ "duration": 20 }]
    }
  ]
}
```

**Diet Log**:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "date": "2025-12-04",
  "meal_name": "Almoço",
  "calories": 650,
  "protein": 45,
  "carbs": 60,
  "fats": 20,
  "foods": [
    { "name": "Arroz", "grams": "150", "macros": {...} },
    { "name": "Frango", "grams": "200", "macros": {...} }
  ]
}
```

## 📁 Estrutura do Projeto

```
track2lift/
├── index.html                    # Página única (landing + app)
├── assets/
│   ├── css/
│   │   ├── styles.css           # Estilos customizados
│   │   └── hero-texture.css     # Texturas da landing
│   ├── js/
│   │   ├── app.js               # Orquestrador principal
│   │   ├── tailwind-config.js   # Config do Tailwind
│   │   ├── analytics.js         # Tracking de eventos
│   │   ├── lib/
│   │   │   ├── supabaseClient.js
│   │   │   ├── exercises.js     # Catálogo de exercícios
│   │   │   └── ui-utils.js      # Sistema de toast/modais
│   │   └── modules/
│   │       ├── auth.js          # Autenticação
│   │       ├── workout.js       # Lógica de treinos
│   │       └── diet.js          # Lógica de dieta
│   ├── img/
│   │   └── muscle.svg           # SVG de visualização corporal
│   └── fonts/                   # Fontes customizadas
├── netlify/
│   └── functions/
│       └── gemini.js            # Proxy para Gemini API
└── logo/                        # Assets da marca
```

## 🚀 Deploy e Configuração

### Variáveis de Ambiente (Netlify)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_key
```

### Tabelas Supabase
Execute os scripts SQL em `supabase_*.sql` para criar as tabelas necessárias com RLS configurado.

### Deploy
```bash
# Fazer push para GitHub
git add .
git commit -m "Update"
git push origin main

# Netlify faz deploy automático
```

## 🔒 Segurança

- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ API Keys protegidas via serverless functions
- ✅ Função RPC para exclusão segura de conta (`delete_own_user`)
- ✅ Validação client-side e server-side
- ✅ HTTPS obrigatório via Netlify

## 🎨 Design System

### Paleta de Cores
- **Primary**: `#DC2626` (destaque/vermelho)
- **Background**: `#18181b` (zinc-900)
- **Cards**: `#27272a` (zinc-800)
- **Text**: `#e4e4e7` (zinc-200)
- **Borders**: `#3f3f46` (zinc-700)

### Componentes Reutilizáveis
- **Toast Notifications**: success, error, warning, info
- **Confirm Dialogs**: warning, danger, info
- **Loading States**: spinners e estados de carregamento
- **Form Validations**: feedback inline e mensagens

## 📊 Métricas e Analytics

- Google Analytics 4 integrado
- Tracking de eventos customizados
- Monitoramento de conversões (signups, treinos criados)

## 🤝 Contribuindo

1. Reporte bugs: [GitHub Issues](https://github.com/Douglasmartinsf/track2lift/issues/new?template=bug_report.md)
2. Sugira features: [Feature Request](https://github.com/Douglasmartinsf/track2lift/issues/new?template=feature_request.md)

## 📝 Licença

Projeto proprietário - Todos os direitos reservados

## 🙏 Agradecimentos

- **Supabase** - Backend as a Service
- **Tailwind CSS** - Framework CSS
- **Chart.js** - Biblioteca de gráficos
- **Google Gemini** - IA experimental

