# Checklist de Segurança - TRACK2LIFT

## ✅ Antes de Comitar

- [ ] Verifique se `assets/js/config.js` **NÃO** está sendo commitado
- [ ] Confirme que `.gitignore` inclui `assets/js/config.js`
- [ ] Certifique-se de que `config.example.js` não contém chaves reais
- [ ] Revise o histórico do Git para garantir que nenhuma chave foi exposta

## 🔍 Como Verificar se API Key está Segura

### Verifique o status do Git:
```bash
git status
```
✅ **Bom**: `config.js` aparece em "Untracked files" (se ainda não foi adicionado)
❌ **Ruim**: `config.js` aparece em "Changes to be committed"

### Verifique o .gitignore:
```bash
cat .gitignore | grep config.js
```
✅ Deve retornar: `assets/js/config.js`

### Teste o que será commitado:
```bash
git add .
git status
```
❌ Se `config.js` aparecer, CANCELE com `git reset`

## 🚨 Se Você Commitou a API Key por Acidente

### 1. **URGENTE**: Revogue a API Key imediatamente
- Acesse: https://console.cloud.google.com/apis/credentials
- Delete a chave comprometida
- Gere uma nova chave

### 2. Remova do histórico do Git:
```bash
# Remover arquivo do último commit (se ainda não deu push)
git reset HEAD~1
git add .
git commit -m "Remove: API key acidentalmente commitada"

# Remover do histórico completo (use com cuidado!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch assets/js/config.js" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (CUIDADO: reescreve histórico)
git push origin --force --all
```

### 3. Adicione a nova chave em `config.js` localmente

## 🛡️ Boas Práticas de Segurança

### Para Desenvolvimento Local:
1. ✅ Use `config.js` para API Keys
2. ✅ Mantenha `config.js` no `.gitignore`
3. ✅ Use `config.example.js` como template público
4. ✅ Documente no README como configurar

### Para Produção:
1. 🔒 **Backend Proxy**: Crie um servidor que faz chamadas à API
   ```
   Browser → Seu Backend → Gemini API
   ```
2. 🔒 **Serverless Functions**: Use Vercel/Netlify Functions
   ```javascript
   // api/gemini.js (Vercel)
   export default async function handler(req, res) {
     const apiKey = process.env.GEMINI_API_KEY;
     // Faz chamada à API
   }
   ```
3. 🔒 **Restrições de API**: Configure no Google Cloud Console
   - Restrinja por domínio
   - Defina quotas
   - Monitore uso

### Restrições Recomendadas no Google Cloud:
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique na sua API Key
3. Configure:
   - **Application restrictions**: HTTP referrers
   - **Adicione**: `seudominio.com/*`
   - **Website restrictions**: Ative
   - **API restrictions**: Apenas Generative Language API

## 📊 Monitoramento

### Verifique uso da API regularmente:
- Google Cloud Console → APIs & Services → Metrics
- Configure alertas de quota
- Revise logs de acesso

## 🔗 Links Úteis

- [Gerenciar API Keys](https://console.cloud.google.com/apis/credentials)
- [Melhores Práticas Google](https://cloud.google.com/docs/authentication/api-keys)
- [Segurança de API Keys](https://developers.google.com/maps/api-security-best-practices)

---

⚠️ **Lembre-se**: Segurança é responsabilidade de todos!
