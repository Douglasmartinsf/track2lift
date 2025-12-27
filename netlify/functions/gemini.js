// Netlify Serverless Function para chamadas ao Gemini API
// Esta função atua como proxy seguro, escondendo a API Key do cliente

exports.handler = async (event, context) => {
    // Apenas aceita POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Pega a API Key das variáveis de ambiente (configurada no Netlify)
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('GEMINI_API_KEY não está configurada nas variáveis de ambiente');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Servidor não configurado corretamente' })
            };
        }

        // Parse do corpo da requisição
        const { systemPrompt, userQuery } = JSON.parse(event.body);

        if (!userQuery) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'userQuery é obrigatório' })
            };
        }

        // Monta a URL da API do Gemini
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

        // Monta o payload
        const payload = {
            contents: [{
                parts: [{ text: userQuery }]
            }]
        };

        // Adiciona system instruction se fornecido
        if (systemPrompt) {
            payload.systemInstruction = {
                parts: [{ text: systemPrompt }]
            };
        }

        // Faz a chamada para a API do Gemini
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro da API Gemini:', response.status, errorText);
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: 'Erro ao comunicar com a API do Gemini',
                    details: errorText
                })
            };
        }

        const data = await response.json();

        // Extrai o texto da resposta
        const candidate = data.candidates?.[0];
        if (candidate && candidate.content?.parts?.[0]?.text) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: candidate.content.parts[0].text
                })
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Resposta da API em formato inesperado',
                    data: data
                })
            };
        }

    } catch (error) {
        console.error('Erro no handler:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Erro interno do servidor',
                message: error.message
            })
        };
    }
};
