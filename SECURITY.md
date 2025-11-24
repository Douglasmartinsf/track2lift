# Security Overview — TRACK2LIFT

Este documento descreve a postura de segurança adotada pelo projeto, os riscos principais e as medidas recomendadas. O objetivo é explicar decisões arquiteturais e comportamentos técnicos relacionados à segurança, não servir como um guia de operações.

Principais metas de segurança
- Minimizar superfície de exposição de chaves e segredos.
- Manter o princípio do menor privilégio para credenciais expostas ao cliente.
- Garantir que dados do usuário (workouts) sejam isolados por design (controle de acesso).

Design e controles técnicos
- Chaves sensíveis: a aplicação NÃO deve conter chaves privadas no repositório. Para integrações com a Gemini, a arquitetura recomenda um proxy serverless (ex.: `netlify/functions/gemini.js`) que lê `GEMINI_API_KEY` do ambiente da plataforma.
- Supabase: o frontend usa a chave `anon` (pública) para operações do usuário. A separação de privilégios deve ser garantida por Row-Level Security (RLS) nas tabelas do Supabase.
- SVG e assets: o app injeta SVGs inline para permitir pintura de grupos por `id`. Evite embutir informações sensíveis em assets (por exemplo, data URIs contendo tokens) — SVGs podem conter `<image>` com data URIs e, por isso, deve-se revisar assets externos antes de usá-los.
- Cache client-side: `cachedMuscleSvg` guarda o texto do SVG em memória para reduzir requisições. É uma otimização local — nada sensível deve ser cacheado no cliente.

Riscos específicos e mitigação
- Exposição de chaves no repo: risco mitigado por `.gitignore` e política de não-commitar `config.js`. Em caso de vazamento, proceda com rotação e limpeza do histórico.
- Uso indevido de chaves do Supabase: sempre usar `anon` no cliente e políticas RLS no servidor para evitar acesso cross-user.

Incidente e resposta resumida
1. Revogar chave comprometida (console do provedor).
2. Rotacionar e publicar nova credencial no serviço de CI/CD/host (variáveis de ambiente).
3. Se a chave foi comprometida em um commit, considerar limpeza do histórico e comunicar partes afetadas.

Links e referências
- Google Cloud: gerenciamento de API keys — https://cloud.google.com/docs/authentication/api-keys
- Supabase: Row-Level Security — https://supabase.com/docs/guides/auth#row-level-security


