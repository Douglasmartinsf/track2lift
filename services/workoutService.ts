
import { UserProfile } from '../types';
import { supabase } from './supabaseClient';

const DEFAULT_CATALOG: Record<string, string[]> = {
    'Peito': ['Supino Reto', 'Supino Inclinado', 'Crucifixo', 'Crossover', 'Peck Deck', 'Flexão de Braço', 'Dumbbell Press'],
    'Costas': ['Puxada Alta', 'Remada Baixa', 'Remada Curvada', 'Barra Fixa', 'Pulldown', 'Serrote', 'Remada Cavalinho'],
    'Deltoide Anterior': ['Desenvolvimento Militar', 'Desenvolvimento Halteres', 'Elevação Frontal'],
    'Deltoide Lateral': ['Elevação Lateral', 'Remada Alta', 'Side Raises'],
    'Deltoide Posterior': ['Crucifixo Inverso', 'Face Pull', 'Rear Delt Fly'],
    'Bíceps': ['Rosca Direta', 'Rosca Alternada', 'Rosca Martelo', 'Rosca Scott', 'Rosca Concentrada', 'Bicep Curl'],
    'Tríceps': ['Tríceps Pulley', 'Tríceps Corda', 'Tríceps Testa', 'Mergulho Banco', 'Tríceps Francês', 'Skullcrusher'],
    'Antebraço': ['Rosca Inversa', 'Flexão de Punho', 'Farmer Walk'],
    'Quadríceps': ['Agachamento Livre', 'Leg Press', 'Cadeira Extensora', 'Agachamento Búlgaro', 'Passada', 'Hack Squat'],
    'Posterior': ['Stiff', 'Mesa Flexora', 'Cadeira Flexora', 'Elevação Pélvica', 'Leg Curl'],
    'Panturrilha': ['Gêmeos Sentado', 'Gêmeos em Pé', 'Panturrilha no Leg Press', 'Calf Raises'],
    'Abdômen': ['Abdominal Supra', 'Abdominal Infra', 'Prancha', 'Russian Twist', 'Abdominal Remador', 'Crunches'],
    'Cardio': ['Esteira', 'Bicicleta', 'Elíptico', 'Escada', 'Corda', 'Corrida na Rua']
};

export const EXERCISE_CATALOG = DEFAULT_CATALOG;

// --- Helper Pure Functions ---

export const getExerciseCatalog = (user: UserProfile | null): Record<string, string[]> => {
    const result: Record<string, string[]> = {};
    const excluded = new Set(user?.hidden_exercises || []);
    
    // Start with defaults
    Object.entries(DEFAULT_CATALOG).forEach(([group, exercises]) => {
        result[group] = exercises.filter(ex => !excluded.has(ex));
    });

    // Add custom exercises
    if (user?.custom_exercises) {
        user.custom_exercises.forEach(custom => {
            if (!result[custom.group]) {
                result[custom.group] = [];
            }
            // Avoid duplicates
            if (!result[custom.group].includes(custom.name)) {
                result[custom.group].push(custom.name);
            }
        });
    }

    // Clean up empty groups and sort
    Object.keys(result).forEach(group => {
        if (result[group].length === 0) {
            delete result[group];
        } else {
            result[group].sort();
        }
    });

    return result;
};

// Returns a specific group's exercises based on the user's settings
export const getExercisesForGroup = (user: UserProfile | null, group: string): string[] => {
    const catalog = getExerciseCatalog(user);
    return catalog[group] || [];
};

// Helper for muscle identification
export const identifyMuscleGroup = (exerciseName: string, userCatalog?: Record<string, string[]>): { group: string; exactMatch: boolean; correctName?: string } | null => {
    const lower = exerciseName.toLowerCase();
    
    // Use provided catalog or default fallback
    const catalog = userCatalog || DEFAULT_CATALOG;
    const allGroups = Object.keys(catalog);

    // 1. Exact Search
    for (const group of allGroups) {
        const groupExercises = catalog[group];
        const match = groupExercises.find(ex => ex.toLowerCase() === lower);
        if (match) return { group, exactMatch: true };
    }
    
    // 2. Partial Search (Prioritize specific/longer matches)
    // E.g. "Crucifixo Inverso" (Posterior) should not be caught by "Crucifixo" (Chest)
    let bestMatch: { group: string; matchLength: number; correctName: string } | null = null;

    for (const group of allGroups) {
        const groupExercises = catalog[group];
        const match = groupExercises.find(ex => lower.includes(ex.toLowerCase()) || ex.toLowerCase().includes(lower));
        
        if (match) {
            // If we found a match, check if it's better (longer string = more specific) than the previous one
            if (!bestMatch || match.length > bestMatch.matchLength) {
                bestMatch = { group, matchLength: match.length, correctName: match };
            }
        }
    }

    if (bestMatch) {
        return { group: bestMatch.group, exactMatch: true, correctName: bestMatch.correctName };
    }
    
    // 3. Fallback keywords
    if (lower.includes('supino') || lower.includes('peito') || lower.includes('chest')) return { group: 'Peito', exactMatch: false };
    if (lower.includes('puxada') || lower.includes('remada') || lower.includes('costas') || lower.includes('back')) return { group: 'Costas', exactMatch: false };
    if (lower.includes('agachamento') || lower.includes('leg') || lower.includes('quad')) return { group: 'Quadríceps', exactMatch: false };
    if (lower.includes('rosca') || lower.includes('bíceps') || lower.includes('bicep')) return { group: 'Bíceps', exactMatch: false };
    if (lower.includes('tríceps') || lower.includes('tricep') || lower.includes('testa')) return { group: 'Tríceps', exactMatch: false };
    if (lower.includes('ombro') || lower.includes('shoulder') || lower.includes('desenvolvimento')) return { group: 'Deltoide Lateral', exactMatch: false };
    if (lower.includes('corrida') || lower.includes('caminhada') || lower.includes('esteira') || lower.includes('cardio')) return { group: 'Cardio', exactMatch: false };
    if (lower.includes('stiff') || lower.includes('flexora')) return { group: 'Posterior', exactMatch: false };
    
    return null;
};

// --- Async State Management Functions ---

export const addCustomExercise = async (user: UserProfile, group: string, exerciseName: string): Promise<UserProfile> => {
    const currentCustom = user.custom_exercises || [];
    const currentHidden = user.hidden_exercises || [];

    // Check if it was hidden, if so, unhide it
    let newHidden = [...currentHidden];
    if (currentHidden.includes(exerciseName)) {
        newHidden = currentHidden.filter(e => e !== exerciseName);
    }

    // Check if already in custom
    let newCustom = [...currentCustom];
    const exists = newCustom.some(c => c.name === exerciseName && c.group === group);
    if (!exists) {
        newCustom.push({ name: exerciseName, group });
    }

    // Update Supabase
    const { error } = await supabase.auth.updateUser({
        data: {
            custom_exercises: newCustom,
            hidden_exercises: newHidden
        }
    });

    if (error) throw error;

    // Return updated user object locally for immediate UI update
    return {
        ...user,
        custom_exercises: newCustom,
        hidden_exercises: newHidden
    };
};

export const removeExercise = async (user: UserProfile, group: string, exerciseName: string): Promise<UserProfile> => {
    const name = exerciseName.trim();
    const currentCustom = user.custom_exercises || [];
    const currentHidden = user.hidden_exercises || [];
    const defaults = DEFAULT_CATALOG[group] || [];

    let newCustom = [...currentCustom];
    let newHidden = [...currentHidden];

    // Check custom list
    const isCustom = currentCustom.some(c => c.name === name && c.group === group);
    
    // Check default list (careful: name must match exactly for string comparison, but getExerciseCatalog provides exact strings)
    const isDefault = defaults.includes(name);

    if (isCustom) {
        // Remove permanently from custom list
        newCustom = newCustom.filter(c => !(c.name === name && c.group === group));
    } 
    
    if (isDefault) {
        // Add to hidden list if it's a default
        if (!newHidden.includes(name)) {
            newHidden.push(name);
        }
    }

    // Update Supabase
    const { error } = await supabase.auth.updateUser({
        data: {
            custom_exercises: newCustom,
            hidden_exercises: newHidden
        }
    });

    if (error) throw error;

    // Return updated user object locally for immediate UI update
    return {
        ...user,
        custom_exercises: newCustom,
        hidden_exercises: newHidden
    };
};

export const resetExerciseCatalog = async (user: UserProfile): Promise<UserProfile> => {
    // Reset custom and hidden lists to empty
    const { error } = await supabase.auth.updateUser({
        data: {
            custom_exercises: [],
            hidden_exercises: []
        }
    });

    if (error) throw error;

    return {
        ...user,
        custom_exercises: [],
        hidden_exercises: []
    };
};
