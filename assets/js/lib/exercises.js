// Catálogo de exercícios e helper para identificar grupo muscular
const EXERCISE_CATALOG = {
    "Peito": ["Supino Reto (Barra)", "Supino Inclinado", "Crucifixo", "Crossover", "Flexão de Braço", "Voador"],
    "Costas": ["Puxada Alta", "Remada Curvada", "Remada Baixa", "Levantamento Terra", "Barra Fixa", "Serrote"],
    "Deltoide Anterior": ["Desenvolvimento", "Elevação Frontal", "Arnold Press"],
    "Deltoide Lateral": ["Elevação Lateral", "Desenvolvimento Arnold"],
    "Deltoide Posterior": ["Crucifixo Inverso", "Remada Alta", "Face Pull"],
    "Bíceps": ["Rosca Direta", "Rosca Martelo", "Rosca Scott", "Rosca Concentrada"],
    "Tríceps": ["Tríceps Corda", "Tríceps Testa", "Tríceps Francês", "Mergulho"],
    "Antebraço": ["Rosca Inversa", "Flexão de Punho"],
    "Quadríceps": ["Agachamento Livre", "Leg Press 45", "Cadeira Extensora", "Agachamento Búlgaro", "Afundo"],
    "Posterior": ["Mesa Flexora", "Cadeira Flexora", "Stiff", "Elevação Pélvica"],
    "Panturrilha": ["Panturrilha em Pé", "Panturrilha Sentado"],
    "Abdômen": ["Abdominal Supra", "Prancha", "Infra"],
    "Cardio": ["Esteira", "Bicicleta", "Elíptico", "Escada"]
};

// Cópia congelada do catálogo original para identificar exercícios customizados
const ORIGINAL_EXERCISE_CATALOG = JSON.parse(JSON.stringify(EXERCISE_CATALOG));

function identifyMuscleGroup(name) {
    if (!name) return null;
    const lower = name.toLowerCase();
    for (const [group, exercises] of Object.entries(EXERCISE_CATALOG)) {
        if (exercises.some(ex => ex.toLowerCase() === lower)) return { group, exactMatch: true, correctName: exercises.find(ex => ex.toLowerCase() === lower) };
    }
    const keywords = {
        'Peito': ['supino', 'flexão', 'peck', 'chest'], 'Costas': ['remada curvada', 'remada baixa', 'puxada', 'dorsal', 'back', 'barra fixa', 'serrote', 'levantamento terra'],
        'Deltoide Anterior': ['desenvolvimento', 'frontal', 'arnold'],
        'Deltoide Lateral': ['lateral', 'desenvolvimento arnold'],
        'Deltoide Posterior': ['crucifixo inverso', 'remada alta', 'face pull'],
        'Bíceps': ['rosca', 'biceps'], 'Tríceps': ['triceps', 'testa', 'corda'],
        'Quadríceps': ['agachamento', 'leg', 'extensora'], 'Posterior': ['flexora', 'stiff'],
        'Cardio': ['esteira', 'bike', 'corrida']
    };
    for (const [group, terms] of Object.entries(keywords)) {
        if (terms.some(t => lower.includes(t))) return { group, exactMatch: false };
    }
    return null;
}

export { EXERCISE_CATALOG, ORIGINAL_EXERCISE_CATALOG, identifyMuscleGroup };
