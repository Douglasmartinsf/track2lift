# 🚀 Guia de Deploy - TRACK2LIFT no Netlify

Este guia mostra como fazer deploy do TRACK2LIFT no Netlify com a API Key segura.

## 📋 Pré-requisitos

1. Conta no [Netlify](https://www.netlify.com/) (gratuita)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. API Key do Google Gemini

## 🎯 Passo a Passo

### 1️⃣ Preparar o Repositório

```bash
# Certifique-se de que config.js está no .gitignore
git status

# Deve aparecer:
# - ✅ config.example.js (tracked)
# - ❌ config.js (untracked/ignored)

# Commit e push
git add .
git commit -m "feat: Add Netlify serverless function for Gemini API"
git push origin main
```

### 2️⃣ Criar Site no Netlify

#### Opção A: Via Interface Web
1. Acesse https://app.netlify.com/
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Conecte seu repositório Git
4. Configure:
   - **Build command**: (deixe vazio)
   - **Publish directory**: `.` (ponto)
   - **Functions directory**: `netlify/functions`
5. Clique em **"Deploy site"**

#### Opção B: Via Netlify CLI
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Inicializar e fazer deploy
netlify init

# Durante o setup:
# - Build command: (deixe vazio)
# - Publish directory: .
# - Functions directory: netlify/functions
```

### 3️⃣ Configurar Variável de Ambiente

#### Via Interface Web:
1. No painel do Netlify, vá em **Site settings**
2. Clique em **Environment variables** (no menu lateral)
3. Clique em **Add a variable**
4. Configure:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Sua chave da API do Gemini
   - **Scopes**: Selecione todos os escopos
5. Clique em **Create variable**

#### Via Netlify CLI:
```bash
netlify env:set GEMINI_API_KEY "SUA_CHAVE_AQUI"
```

### 4️⃣ Re-deploy (se necessário)

Se você já tinha feito deploy antes de adicionar a variável:

```bash
# Via CLI
netlify deploy --prod

# Ou via interface web:
# Triggers → Deploy site
```

### 5️⃣ Testar

1. Acesse seu site: `https://seu-site.netlify.app`
2. Vá para a seção de IA
3. Tente gerar uma sugestão de refeição
4. ✅ Deve funcionar sem expor a API Key!

## 🔍 Verificar que está Funcionando

### Teste da Function:
```bash
# Via navegador, abra o DevTools (F12) → Network
# Ao gerar uma refeição, você deve ver:
# - Request para: /.netlify/functions/gemini
# - Status: 200 OK
# - Sem API Key visível na requisição
```

### Logs da Function (se houver erro):
```bash
# Via CLI
netlify functions:log gemini

# Ou via interface web:
# Functions → gemini → Recent deployments → View function logs
```

## 📊 Configurar Google Analytics 4

### 1️⃣ Criar Propriedade no GA4

1. Acesse https://analytics.google.com/
2. Clique em **Admin** (canto inferior esquerdo)
3. Clique em **Create Property**
4. Configure:
   - **Property name**: TRACK2LIFT
   - **Reporting time zone**: Seu fuso horário
   - **Currency**: BRL (ou sua moeda)
5. Clique em **Next**
6. Preencha detalhes do negócio e clique em **Create**
7. Aceite os termos de serviço

### 2️⃣ Obter Measurement ID

1. No Admin, vá em **Data Streams**
2. Clique em **Add stream** → **Web**
3. Configure:
   - **Website URL**: `https://seu-site.netlify.app`
   - **Stream name**: TRACK2LIFT Production
4. Clique em **Create stream**
5. **Copie o Measurement ID** (formato: `G-XXXXXXXXXX`)

### 3️⃣ Atualizar o Código

Abra `index.html` e substitua **DUAS vezes** o placeholder `G-XXXXXXXXXX`:

```html
<!-- Linha ~7 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-SEU_ID_AQUI"></script>

<!-- Linha ~13 -->
gtag('config', 'G-SEU_ID_AQUI');
```

### 4️⃣ Fazer Deploy

```bash
git add index.html
git commit -m "feat: Add Google Analytics tracking"
git push origin main
```

Netlify vai fazer re-deploy automaticamente.

### 5️⃣ Testar Rastreamento

1. Acesse seu site em produção
2. No GA4, vá em **Reports** → **Realtime**
3. Navegue pelo site e clique nos CTAs
4. ✅ Você deve ver eventos aparecendo em tempo real!

### 📈 Eventos Rastreados

O site já está configurado para rastrear:

| Evento | Descrição | Parâmetros |
|--------|-----------|------------|
| `cta_click` | Clique em qualquer botão CTA | `button_location` (hero/header/final/ai_result) |
| `navigation_click` | Clique em links do menu | `link_text`, `section_target` |
| `scroll_depth` | Profundidade de scroll | `depth_percentage` (25/50/75/100) |
| `social_click` | Clique em redes sociais | `platform` (instagram/linkedin) |

### 📊 Criar Relatórios Customizados

1. No GA4, vá em **Explore** → **Create new exploration**
2. Crie relatórios para:
   - **CTA Performance**: `cta_click` por `button_location`
   - **Engagement**: `scroll_depth` + tempo na página
   - **Conversão**: Funil de navegação até clique no CTA

## 🎨 Configurações Opcionais

### Custom Domain
1. **Site settings** → **Domain management**
2. Clique em **Add custom domain**
3. Siga as instruções para configurar DNS
4. **⚠️ Importante**: Após configurar domínio, atualize a URL no GA4 Data Stream

### HTTPS (automático)
- Netlify fornece HTTPS gratuito via Let's Encrypt
- Ativa automaticamente após configurar domínio

### Deploy Previews
- Pull Requests geram previews automáticos
- Útil para testar antes de fazer merge

### Cookie Consent (LGPD/GDPR)
Se você precisa de banner de cookies:
```html
<!-- Adicione antes do GA4 script -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'analytics_storage': 'denied'
});
// Ative após consentimento: gtag('consent', 'update', {'analytics_storage': 'granted'});
</script>
```

## 🔒 Segurança em Produção

### ✅ Implementado:
- [x] API Key escondida no servidor (Netlify Function)
- [x] Variáveis de ambiente seguras
- [x] Headers de segurança (HSTS, XSS Protection, etc.)
- [x] HTTPS automático

### 🔄 Próximos Passos (Opcional):
1. **Rate Limiting**: Adicionar na Netlify Function
   ```javascript
   // Exemplo de rate limiting simples
   const requestCounts = new Map();
   const MAX_REQUESTS_PER_MINUTE = 10;
   ```

2. **Restrições de API no Google Cloud**:
   - Console → Credentials → Sua API Key
   - HTTP referrers: `seu-dominio.netlify.app/*`

3. **Conversões no GA4**:
   - Admin → Events → Mark as conversion
   - Marque `cta_click` como conversão
   - Configure funis de conversão em Explore

## 🐛 Troubleshooting

### Erro: "Servidor não configurado corretamente"
- ✅ Verifique se `GEMINI_API_KEY` está nas variáveis de ambiente
- ✅ Re-deploy após adicionar a variável

### Erro: "Function not found"
- ✅ Verifique se `netlify.toml` está na raiz
- ✅ Confirme que a pasta `netlify/functions` existe
- ✅ Re-deploy

### Erro: "CORS"
- ✅ Normalmente não acontece com Netlify Functions
- ✅ Se ocorrer, adicione headers CORS na function

### Função funciona local mas não em produção
```bash
# Teste local da function
netlify dev

# Isso simula o ambiente Netlify localmente
# Acesse: http://localhost:8888
```

## 📊 Monitoramento de Uso

### Limites Gratuitos:
- **Netlify**: 
  - 100GB bandwidth/mês
  - 300 build minutes/mês
  - 125k function invocations/mês
  
- **Google Gemini**:
  - Consulte: https://ai.google.dev/pricing

### Ver Uso Atual:
- Netlify: Site settings → Usage and billing
- Gemini: Google Cloud Console → Billing

## 🔗 Links Úteis

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Netlify Deploy Docs](https://docs.netlify.com/site-deploys/overview/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Custom Domains](https://docs.netlify.com/domains-https/custom-domains/)

---

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Site funcionando em `https://seu-site.netlify.app`
- [ ] IA gerando sugestões corretamente
- [ ] API Key não visível no código do navegador
- [ ] Variável `GEMINI_API_KEY` configurada no Netlify
- [ ] **Google Analytics 4 Measurement ID configurado**
- [ ] **Eventos de CTA aparecendo no GA4 Realtime**
- [ ] HTTPS ativo
- [ ] Custom domain configurado (opcional)
- [ ] Conversões marcadas no GA4 (opcional)

---

🎉 **Parabéns! Seu site está no ar com tracking completo!**
