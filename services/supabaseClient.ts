import { createClient } from '@supabase/supabase-js';

// Função auxiliar para tentar ler variáveis de ambiente de diferentes fontes (Vite, Create React App, Node)
const getEnv = (key: string, altKey?: string) => {
    // Tenta import.meta.env (Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        if (import.meta.env[key]) return import.meta.env[key];
        // @ts-ignore
        if (altKey && import.meta.env[altKey]) return import.meta.env[altKey];
    }
    
    // Tenta process.env (Webpack/Node)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
        // @ts-ignore
        if (process.env[key]) return process.env[key];
        // @ts-ignore
        if (altKey && process.env[altKey]) return process.env[altKey];
    }

    return '';
};

// Tenta encontrar a URL e a KEY em variáveis de ambiente comuns
// Se você não estiver usando .env, SUBSTITUA AS STRINGS ABAIXO pelas suas chaves do Supabase
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL', 'REACT_APP_SUPABASE_URL') || 
                     getEnv('SUPABASE_URL') || 
                     'https://qxyazvgwlenprvmbjehr.supabase.co'; // <--- COLOQUE SUA URL AQUI SE NECESSÁRIO

const SUPABASE_KEY = getEnv('VITE_SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_KEY') || 
                     getEnv('SUPABASE_KEY') || 
                     'sb_publishable_sswXVkOFllhpeaBCTM5yeg_5corFrvt'; // <--- COLOQUE SUA KEY AQUI SE NECESSÁRIO

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);