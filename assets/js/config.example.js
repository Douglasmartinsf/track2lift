/*
    assets/js/config.example.js

    EXEMPLO de configuração. Copie este arquivo para `assets/js/config.js`
    e preencha as chaves apenas LOCALMENTE. NÃO COMITE `assets/js/config.js`.

    Uso local:
    1. cp assets/js/config.example.js assets/js/config.js
    2. abra assets/js/config.js e preencha as chaves
    3. rode o servidor local: python -m http.server 8000

    Em produção (recomendado):
    - Configure as chaves como variáveis de ambiente no Netlify/Vercel/AWS.
    - Para a Gemini API (Google Generative Language), use uma Function/Serverless
        que receba requests do cliente e adicione a chave no servidor (proxy).

    Atenção:
    - A chave `SUPABASE_KEY` pode ser a chave anônima (anon/public) e normalmente
        é segura para uso no frontend. NUNCA exponha chaves `service_role`.
    - Se você acidentalmente comitou uma chave pública ou privada, considere
        rotacioná-la no painel do provedor.
*/

const CONFIG = {
    // Gemini (apenas para desenvolvimento local). Deixe vazio para testar o fluxo que
    // mostra instruções quando a chave não estiver configurada.
    GEMINI_API_KEY: "",

    // Supabase (URL do seu projeto e chave pública - anon)
    SUPABASE_URL: "",
    SUPABASE_KEY: "",
};

// Exporta para o app local
window.APP_CONFIG = CONFIG;
