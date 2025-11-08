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
- ✅ Para produção, considere:
  - Backend proxy para esconder API Keys
  - Variáveis de ambiente server-side
  - Restrições de domínio no Google Cloud Console

### Arquivos Sensíveis
Os seguintes arquivos NÃO devem ser commitados:
- `assets/js/config.js` - Contém API Keys
- `.env` - Se adicionar no futuro
- Qualquer arquivo com credenciais

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

- ✅ Hero section com palavras motivacionais animadas
- ✅ Sistema de features com ícones customizados
- ✅ Demo de IA para sugestões de refeições
- ✅ Gráficos de progresso interativos
- ✅ Design responsivo e moderno
- ✅ Animações suaves e elegantes

## 📝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Minha nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

**Lembre-se**: Nunca comite arquivos com API Keys!

## 📄 Licença

Este projeto é apenas para fins educacionais e de demonstração.

## 🤝 Suporte

Para problemas com a API do Gemini:
- Documentação: https://ai.google.dev/docs
- Obter API Key: https://aistudio.google.com/apikey

---

Desenvolvido com ❤️ e 💪
