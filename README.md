# TRACK2LIFT

Site estático single-page para rastreamento de treinos, dieta e progresso com IA integrada.

## 🚀 Como Rodar Localmente

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd track2lift
```

### 2. Configure a API Key do Gemini (obrigatório para funcionalidade de IA)

#### Opção A: Primeiro uso
1. Obtenha uma API Key gratuita em: https://aistudio.google.com/apikey
2. Copie o arquivo de exemplo:
   ```bash
   cp assets/js/config.example.js assets/js/config.js
   ```
3. Edite `assets/js/config.js` e insira sua chave:
   ```javascript
   const CONFIG = {
       GEMINI_API_KEY: "SUA_CHAVE_AQUI"
   };
   ```

#### Opção B: Se já tem config.js
- Não faça nada, o arquivo `config.js` já está no `.gitignore`

### 3. Inicie um servidor local

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (se tiver instalado)
npx http-server -p 8000
```

### 4. Abra no navegador
Acesse: http://localhost:8000

⚠️ **Importante**: Não use `file://` - o CORS bloqueará as chamadas à API.

## 🔒 Segurança

### API Keys
- ✅ **NUNCA** comite o arquivo `config.js` (já está no `.gitignore`)
- ✅ **SEMPRE** use `config.example.js` como referência
- ✅ Para produção, use Netlify Functions com variáveis de ambiente

## 📁 Estrutura do Projeto

```
track2lift/
├── index.html                      # Página principal
├── assets/
│   ├── js/
│   │   ├── tailwind-config.js      # Configuração do Tailwind
│   │   ├── config.js               # ⚠️ API Keys (NÃO COMITAR)
│   │   ├── config.example.js       # ✅ Template de configuração
│   │   └── app.js                  # Lógica principal
│   ├── css/
│   │   ├── styles.css              # Estilos globais
│   │   └── hero-texture.css        # Estilos da hero section
│   └── fonts/
│       └── MontserratAlt1-*        # Fonte customizada
├── logo/
│   └── logo.svg                    # Logo principal
├── .gitignore                      # Arquivos ignorados pelo Git
└── README.md                       # Este arquivo
```

## 🛠️ Stack Tecnológica

- **HTML5** - Estrutura
- **Tailwind CSS** (CDN) - Estilização
- **Vanilla JavaScript** - Lógica
- **Chart.js** - Gráficos de progresso
- **Google Gemini API** - IA para sugestões de refeições

**Sem build**: Tudo roda direto no navegador!

## 🎨 Funcionalidades

### Interface
- **Hero Section Dinâmica**: Textura animada com 19 palavras motivacionais, layering z-index (0-10), fade mask radial gradient
- **Design System**: Tailwind CSS customizado via `tailwind-config.js` (cores: fundo #181818, destaque #DC2626, card #27272a)
- **Navegação**: Header sticky com menu horizontal e underline animation via `.nav-menu`
- **Responsividade**: Breakpoints mobile-first (sm:640px, md:768px, lg:1024px)

### Visualização de Dados
- **Chart.js**: Gráficos de linha com gradiente canvas (rgba decay 0.6→0.05)
- **Progress Tracking**: 8 semanas de dados, tooltips customizados, escala Y: 60-90kg, step 5
- **Aspect Ratio Responsivo**: 1.5 (mobile) / 2 (desktop)

### IA Generativa
- **Google Gemini 2.0 Flash**: Sugestões de refeições personalizadas
- **Arquitetura Serverless**: Netlify Functions (`/netlify/functions/gemini.js`) como proxy seguro
- **Input System**: Card-based objective selection (3 opções com ícones SVG, radio buttons customizados)
- **Retry Logic**: `fetchWithRetry()` com 3 tentativas, delay 1s
- **Loading State**: `.btn-loading` com spinner CSS puro (keyframe `spin`)

### Analytics
- **Google Analytics 4**: Measurement ID G-K0PQ8F17GD
- **Event Tracking** (`analytics.js`):
  - `cta_click`: {button_location, button_text}
  - `navigation_click`: {link_text, section_target}
  - `scroll_depth`: {depth_percentage: 25/50/75/100}
  - `social_click`: {platform}

### Performance
- **Zero Build**: HTML/CSS/JS estático, sem bundler
- **CDN Dependencies**: Tailwind CSS, Chart.js
- **Font Loading**: `MontserratAlt1` local (.woff2 + .woff), Inter via Google Fonts
- **Lazy Loading**: Scripts com `defer`, Chart.js animations desabilitadas no hero

## � Licença

## 📄 Licença

Este projeto é apenas para fins educacionais e de demonstração.

## 🤝 Suporte

Para problemas com a API do Gemini:
- Documentação: https://ai.google.dev/docs
- Obter API Key: https://aistudio.google.com/apikey
