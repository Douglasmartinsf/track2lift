# Security Policy - TRACK2LIFT

## API Key Management

### Local Development
- **File**: `assets/js/config.js` (gitignored)
- **Template**: `config.example.js` (public reference)
- **Verification**: `git status` should NOT list `config.js` in staged files

### Production (Netlify)
```javascript
// netlify/functions/gemini.js
exports.handler = async (event) => {
  const apiKey = process.env.GEMINI_API_KEY; // Set in Netlify dashboard
  // Proxy request to Gemini API
}
```

**Environment Variables:**
- Netlify Dashboard → Site Settings → Environment Variables
- Key: `GEMINI_API_KEY`
- Value: Your API key

## Key Compromise Response

1. **Revoke immediately**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. **Remove from Git history**:
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch assets/js/config.js" \
  --prune-empty -- --all
git push origin --force --all
```
3. Generate new key, update environment variables

## API Restrictions (Google Cloud Console)

- **Application restrictions**: HTTP referrers only
- **Allowed referrers**: `track2lift.netlify.app/*`, `localhost:8000/*`
- **API restrictions**: Generative Language API only
- **Quotas**: Set daily limits to prevent abuse

## Monitoring

- **Usage**: Cloud Console → APIs & Services → Metrics
- **Alerts**: Configure quota threshold notifications
- **Logs**: Review access patterns for anomalies

## Links

- [API Credentials](https://console.cloud.google.com/apis/credentials)
- [Best Practices](https://cloud.google.com/docs/authentication/api-keys)
