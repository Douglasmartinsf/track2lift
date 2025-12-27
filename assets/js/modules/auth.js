// assets/js/modules/auth.js
// Módulo de Autenticação: exporta handleLogin, handleSignup, handleLogout
import { supabase } from '../lib/supabaseClient.js';

export async function handleLogin({ email, password }) {
    if (!email || !password) throw new Error('Email e senha são necessários');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function handleSignup({ email, password, name }) {
    if (!email || !password) throw new Error('Email e senha são necessários');
    const options = name ? { data: { name } } : undefined;
    const { data, error } = await supabase.auth.signUp({ email, password, options });

    // Se o erro for "Database error saving new user" mas o usuário foi criado,
    // considerar como sucesso parcial (email de confirmação foi enviado)
    if (error) {
        if (error.message?.includes('Database error saving new user') && data?.user) {
            console.warn('Aviso: usuário criado mas houve erro no database. Email de confirmação enviado.');
            return data; // Retorna os dados mesmo com o erro
        }
        throw error;
    }

    return data;
}

export async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
}
