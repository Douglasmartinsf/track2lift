# ⚡ Deploy Rápido - TRACK2LIFT

## 🚀 Para fazer deploy AGORA:

### 1. Commit e Push
```bash
git add .
git commit -m "feat: Add production-ready setup with Netlify Functions"
git push origin main
```

### 2. Deploy no Netlify
1. Acesse: https://app.netlify.com/
2. **Add new site** → **Import an existing project**
3. Conecte seu GitHub/GitLab/Bitbucket
4. Selecione o repositório `track2lift`
5. **Deploy settings**:
   - Build command: *(vazio)*
   - Publish directory: `.`
6. Clique em **Deploy**

### 3. Adicione a API Key
1. No painel do Netlify: **Site settings** → **Environment variables**
2. **Add a variable**:
   - Key: `GEMINI_API_KEY`
   - Value: `AIzaSyDzk-K3sU7w3STfA8DpThHk1cxBwmoKMaE`
3. **Create variable**

### 4. Re-deploy
- **Deploys** → **Trigger deploy** → **Deploy site**

### 5. Teste!
- Acesse: `https://seu-site.netlify.app`
- Vá para seção IA
- Gere uma refeição
- ✅ Deve funcionar!

---

## 🔍 Verificação Rápida

```bash
# Ver o que será commitado
git status

# ✅ Deve incluir:
# - netlify/functions/gemini.js
# - netlify.toml
# - DEPLOY.md
# - .gitignore (atualizado)

# ❌ NÃO deve incluir:
# - assets/js/config.js (tem sua API key!)
```

---

## 🆘 Problemas?

### "Servidor não configurado"
→ Adicione `GEMINI_API_KEY` nas Environment Variables

### "Function not found"
→ Verifique se `netlify.toml` está na raiz

### Quer testar localmente antes?
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Rodar localmente
netlify dev

# Acesse: http://localhost:8888
```

---

**Documentação completa**: Veja `DEPLOY.md`
