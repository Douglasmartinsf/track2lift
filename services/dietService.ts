import { FoodItem, UserProfile } from '../types';

export const calculateTargets = (profile: UserProfile) => {
  if (!profile.weight || !profile.height || !profile.age) return { target: 2000, bmr: 0, tdee: 0, label: 'Indefinido' };

  const weight = profile.weight;
  const height = profile.height;
  const age = profile.age;
  const goal = profile.goal || 'Manutenção';

  // Mifflin-St Jeor Equation
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  const tdee = Math.round(bmr * 1.55); // Moderate activity factor
  
  let target = tdee;
  let label = "Manutenção";

  if (goal === 'Emagrecimento') { 
      target = tdee - 500; 
      label = "Déficit"; 
  }
  if (goal === 'Hipertrofia') { 
      target = tdee + 300; 
      label = "Superávit"; 
  }

  return { target: Math.round(target), bmr: Math.round(bmr), tdee, label };
};

export const TBCA_DATA = [
    { name: "Arroz Branco Cozido", cal: 128, prot: 2.5, carb: 28.1, fat: 0.2 },
    { name: "Arroz Integral Cozido", cal: 124, prot: 2.6, carb: 25.8, fat: 1.0 },
    { name: "Feijão Carioca Cozido", cal: 76, prot: 4.8, carb: 13.6, fat: 0.5 },
    { name: "Frango Grelhado", cal: 159, prot: 32.0, carb: 0.0, fat: 2.5 },
    { name: "Carne Moída (Patinho)", cal: 219, prot: 35.9, carb: 0.0, fat: 7.3 },
    { name: "Ovo Cozido", cal: 146, prot: 13.3, carb: 0.6, fat: 9.5 },
    { name: "Ovo Frito", cal: 240, prot: 15.6, carb: 1.2, fat: 18.6 },
    { name: "Pão Francês (50g)", cal: 150, prot: 4.0, carb: 29.3, fat: 1.5 },
    { name: "Pão Integral (Fatia)", cal: 120, prot: 4.5, carb: 22.0, fat: 1.8 },
    { name: "Batata Doce Cozida", cal: 77, prot: 0.6, carb: 18.4, fat: 0.1 },
    { name: "Banana Prata", cal: 98, prot: 1.3, carb: 26.0, fat: 0.1 },
    { name: "Aveia em Flocos", cal: 394, prot: 13.9, carb: 66.6, fat: 8.5 },
    { name: "Leite Integral", cal: 60, prot: 3.2, carb: 4.6, fat: 3.3 },
    { name: "Whey Protein (30g)", cal: 120, prot: 24.0, carb: 3.0, fat: 1.5 },
    { name: "Azeite de Oliva", cal: 884, prot: 0.0, carb: 0.0, fat: 100.0 },
    { name: "Tapioca", cal: 230, prot: 0.0, carb: 54.0, fat: 0.0 },
    { name: "Salada Variada", cal: 20, prot: 1.0, carb: 3.0, fat: 0.0 }
].sort((a, b) => a.name.localeCompare(b.name));

export const searchOpenFoodFacts = async (query: string): Promise<any[]> => {
    try {
        const url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(query) + '&search_simple=1&action=process&json=1&page_size=8';
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        if (!json || !Array.isArray(json.products)) return [];
        
        return json.products.map((p: any) => {
            const name = p.product_name || p.generic_name || p.brands || p.brand || p.product_name_en || '';
            const n = p.nutriments || {};
            return {
                name: String(name).trim(),
                macros: {
                    cal: n['energy-kcal_100g'] || n['energy_100g'] || 0,
                    prot: n['proteins_100g'] || 0,
                    carb: n['carbohydrates_100g'] || n['carbs_100g'] || 0,
                    fat: n['fat_100g'] || 0
                }
            };
        }).filter((p: any) => p.name);
    } catch (err) {
        return [];
    }
};

export const calculateMealTotals = (foods: FoodItem[]) => {
    return foods.reduce((acc, food) => {
        if (!food.macros) return acc;
        const factor = food.grams / 100;
        return {
            cal: acc.cal + (food.macros.cal * factor),
            prot: acc.prot + (food.macros.prot * factor),
            carb: acc.carb + (food.macros.carb * factor),
            fat: acc.fat + (food.macros.fat * factor),
        };
    }, { cal: 0, prot: 0, carb: 0, fat: 0 });
};
