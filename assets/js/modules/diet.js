import { supabase } from '../lib/supabaseClient.js';
import { showToast, showConfirmDialog } from '../lib/ui-utils.js';

// --- ESTADO LOCAL ---
let currentDietLogs = []; // Armazena os logs carregados para facilitar a edição
let dailyTarget = 2000;
let editingLogId = null;
let viewDate = new Date();
let tempApiCache = {};
let datalistCounter = 0;
let searchTimeout = null;

// TBCA data (valores por 100g)
const TBCA_DATA = [
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

const LOCAL_FOODS = TBCA_DATA; // alias para uso semântico

function getEls() {
    return {
        dietTargetCal: document.getElementById('dietTargetCal'),
        dietBMR: document.getElementById('dietBMR'),
        dietTDEE: document.getElementById('dietTDEE'),
        dietGoalLabel: document.getElementById('dietGoalLabel'),
        dietConsumedCal: document.getElementById('dietConsumedCal'),
        dietProgressBar: document.getElementById('dietProgressBar'),
        dietConsumedProt: document.getElementById('dietConsumedProt'),
        dietConsumedCarb: document.getElementById('dietConsumedCarb'),
        dietConsumedFat: document.getElementById('dietConsumedFat'),
        dietLogList: document.getElementById('dietLogList'),
        mealModal: document.getElementById('mealModal'),
        savedMealsSelect: document.getElementById('savedMealsSelect'),
        mealNameInput: document.getElementById('mealNameInput'),
        foodRowsContainer: document.getElementById('foodRowsContainer'),
        addFoodRowBtn: document.getElementById('addFoodRowBtn'),
        confirmMealBtn: document.getElementById('confirmMealBtn'),
        closeMealModalBtn: document.getElementById('closeMealModalBtn'),
        cancelMealBtn: document.getElementById('cancelMealBtn'),
        modalTotalCal: document.getElementById('modalTotalCal'),
        modalTotalProt: document.getElementById('modalTotalProt'),
        modalTotalCarb: document.getElementById('modalTotalCarb'),
        modalTotalFat: document.getElementById('modalTotalFat')
    };
}

export async function calculateDietTargets() {
    console.log('🔍 calculateDietTargets: INICIANDO');
    try { const { data } = await supabase.auth.getUser(); if (data?.user) { /* no-op */ } } catch (e) { }
    const { dietTargetCal, dietBMR, dietTDEE, dietGoalLabel } = getEls();
    const user = (await supabase.auth.getUser()).data?.user;
    if (!user) {
        console.log('❌ calculateDietTargets: Usuário não encontrado');
        return;
    }

    const meta = user.user_metadata || {};
    console.log('📋 calculateDietTargets: user_metadata =', meta);
    const weight = parseFloat(meta.weight) || 0;
    const height = parseFloat(meta.height) || 0;
    const age = parseInt(meta.age) || 0;
    const goal = meta.goal || 'Manutenção';
    console.log('📊 calculateDietTargets: weight =', weight, '| height =', height, '| age =', age, '| goal =', goal);

    if (weight === 0) {
        console.log('⚠️ calculateDietTargets: Peso = 0, perfil incompleto');
        if (dietGoalLabel) dietGoalLabel.textContent = "Perfil Incompleto";
        return;
    }

    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    const tdee = Math.round(bmr * 1.55);
    let target = tdee;
    let label = "Manutenção";

    if (goal === 'Emagrecimento') { target = tdee - 500; label = "Déficit"; }
    if (goal === 'Hipertrofia') { target = tdee + 300; label = "Superávit"; }

    console.log('🧮 calculateDietTargets: BMR =', bmr, '| TDEE =', tdee, '| target =', target);
    console.log('🔄 calculateDietTargets: ANTES dailyTarget =', dailyTarget);
    dailyTarget = target;
    console.log('✅ calculateDietTargets: DEPOIS dailyTarget =', dailyTarget);

    if (dietTargetCal) dietTargetCal.textContent = target;
    if (dietBMR) dietBMR.textContent = Math.round(bmr);
    if (dietTDEE) dietTDEE.textContent = tdee;
    if (dietGoalLabel) dietGoalLabel.textContent = label;

    updateDietProgress();
    updateDietGoalIcon(meta.goal || 'Manutenção');
}

export function updateDietProgress(current) {
    const { dietConsumedCal, dietProgressBar, dietTargetCal } = getEls();
    const consumed = current !== undefined ? current : parseInt(dietConsumedCal?.textContent || 0);

    // Lê o target do DOM ao invés de usar a variável (evita problemas de escopo/timing)
    const targetFromDOM = parseInt(dietTargetCal?.textContent || 0);
    const target = targetFromDOM > 0 ? targetFromDOM : (dailyTarget || 2000);

    console.log('📊 updateDietProgress: dailyTarget (var) =', dailyTarget, '| target (DOM) =', targetFromDOM, '| usando =', target, '| consumido =', consumed);

    const percent = Math.min(100, Math.max(0, (consumed / target) * 100));

    if (dietProgressBar) {
        dietProgressBar.style.width = `${percent}%`;
    }
} export function updateModalTotals() {
    // Agnostic totals calculation: read macros from input.dataset.macros regardless of source
    let totals = { cal: 0, prot: 0, carb: 0, fat: 0 };
    const { foodRowsContainer, modalTotalCal, modalTotalProt, modalTotalCarb, modalTotalFat } = getEls();
    if (!foodRowsContainer) return totals;

    const rows = Array.from(foodRowsContainer.querySelectorAll('.food-row'));
    rows.forEach(row => {
        // Prefer the new class name, fallback to previous ones for compatibility
        const inputEl = row.querySelector('.food-search-input') || row.querySelector('.food-input') || row.querySelector('.food-select');
        const gramsEl = row.querySelector('.food-grams');
        const grams = gramsEl ? parseFloat(gramsEl.value) || 0 : 0;
        if (!inputEl || grams <= 0) return;

        let macros = null;
        if (inputEl.dataset && inputEl.dataset.macros) {
            try { macros = JSON.parse(inputEl.dataset.macros); } catch (e) { macros = null; }
        }

        if (macros) {
            const factor = grams / 100;
            totals.cal += (macros.cal || 0) * factor;
            totals.prot += (macros.prot || 0) * factor;
            totals.carb += (macros.carb || 0) * factor;
            totals.fat += (macros.fat || 0) * factor;
        }
    });

    if (modalTotalCal) modalTotalCal.textContent = Math.round(totals.cal);
    if (modalTotalProt) modalTotalProt.textContent = Math.round(totals.prot);
    if (modalTotalCarb) modalTotalCarb.textContent = Math.round(totals.carb);
    if (modalTotalFat) modalTotalFat.textContent = Math.round(totals.fat);
    return totals;
}

// --- UI DA LINHA DE ALIMENTO (AUTOCOMPLETE CUSTOMIZADO) ---
export function addFoodRow(preFoodName = '', preGrams = '', preMacros = null) {
    const { foodRowsContainer } = getEls();
    if (!foodRowsContainer) return;

    const div = document.createElement('div');
    div.className = "grid grid-cols-[2fr_1fr_auto] gap-2 items-start food-row relative mb-2"; // items-start para alinhar com dropdown

    // Estrutura: Input + Lista UL (Dropdown) absoluta
    div.innerHTML = `
        <div class="relative w-full food-search-container">
            <input type="text" class="food-search-input w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-texto outline-none focus:border-destaque placeholder-zinc-500 transition-colors" placeholder="Buscar alimento (ex: Frango)" value="${preFoodName}" autocomplete="off">
            
            <ul class="food-dropdown-list hidden absolute left-0 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-zinc-700/50">
                </ul>
            
            <div class="loading-spinner absolute right-3 top-2.5 hidden">
                <svg class="animate-spin h-4 w-4 text-destaque" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
        </div>
        
        <div class="relative">
            <input type="number" class="food-grams w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-2 pr-6 py-2 text-sm text-texto outline-none focus:border-destaque" placeholder="0" value="${preGrams}">
            <span class="absolute right-2 top-2.5 text-xs text-zinc-500">g</span>
        </div>
        
        <button class="text-zinc-500 hover:text-red-500 delete-row-btn px-1 py-2">&times;</button>
    `;

    foodRowsContainer.appendChild(div);

    // Elementos
    const input = div.querySelector('.food-search-input');
    const dropdown = div.querySelector('.food-dropdown-list');
    const spinner = div.querySelector('.loading-spinner');
    const gramsInput = div.querySelector('.food-grams');

    // Pré-carregamento de dados (Edição)
    if (preMacros) {
        input.dataset.macros = JSON.stringify(preMacros);
    } else if (preFoodName) {
        const local = LOCAL_FOODS.find(f => f.name === preFoodName);
        if (local) input.dataset.macros = JSON.stringify(local);
    }

    // Função para Renderizar Opções no Dropdown
    const renderOptions = (items) => {
        dropdown.innerHTML = '';
        if (items.length === 0) {
            dropdown.innerHTML = '<li class="px-3 py-2 text-xs text-zinc-500 italic">Nenhum resultado encontrado</li>';
            return;
        }

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = "px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 cursor-pointer transition-colors flex justify-between items-center";
            li.innerHTML = `
                <span>${item.name}</span>
                <span class="text-[10px] text-zinc-500 bg-zinc-900/50 px-1.5 py-0.5 rounded ml-2">${Math.round(item.cal)}kcal/100g</span>
            `;

            // Ao clicar na opção
            li.addEventListener('mousedown', (e) => { // mousedown dispara antes do blur
                e.preventDefault(); // Impede perda de foco imediata
                input.value = item.name;
                // Salvar apenas os macros, não o objeto completo
                input.dataset.macros = JSON.stringify(item.macros || item);
                dropdown.classList.add('hidden');
                updateModalTotals();
            });
            dropdown.appendChild(li);
        });
        dropdown.classList.remove('hidden');
    };

    // Evento: Digitação
    input.addEventListener('input', async (e) => {
        const val = e.target.value.trim();

        // 1. Limpa estado anterior
        input.removeAttribute('data-macros'); // Invalida macros antigos se mudou o texto

        if (val.length === 0) {
            dropdown.classList.add('hidden');
            return;
        }

        // 2. Filtra Locais (Instantâneo)
        const localMatches = LOCAL_FOODS.filter(f => f.name.toLowerCase().includes(val.toLowerCase()));
        renderOptions(localMatches); // Mostra locais primeiro

        // 3. Busca API (Debounce)
        if (val.length >= 2) {
            spinner.classList.remove('hidden');

            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const apiResults = await searchOpenFoodFacts(val);
                spinner.classList.add('hidden');

                // Combina resultados: Locais no topo + API embaixo
                // Evita duplicatas de nome exato
                const combined = [...localMatches];
                apiResults.forEach(apiItem => {
                    if (!combined.some(c => c.name === apiItem.name)) {
                        combined.push(apiItem);
                    }
                });

                renderOptions(combined);
            }, 400);
        } else {
            spinner.classList.add('hidden');
        }
    });

    // Evento: Foco (Mostrar locais se vazio ou busca atual)
    input.addEventListener('focus', () => {
        if (input.value.length === 0) renderOptions(LOCAL_FOODS); // Sugere locais ao clicar
        else input.dispatchEvent(new Event('input')); // Re-trigger busca atual
    });

    // Evento: Blur (Fechar dropdown ao clicar fora)
    input.addEventListener('blur', () => {
        // Pequeno delay para permitir o click no item
        setTimeout(() => dropdown.classList.add('hidden'), 200);
    });

    gramsInput.addEventListener('input', updateModalTotals);
    div.querySelector('.delete-row-btn').addEventListener('click', () => { div.remove(); updateModalTotals(); });
}

export function createGoalIcon(goal) {
    if (!goal) goal = 'Manutenção';
    if (goal === 'Emagrecimento') {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M18.918 8.174c2.56 4.982 .501 11.656 -5.38 12.626c-7.702 1.687 -12.84 -7.716 -7.054 -13.229c.309 -.305 1.161 -1.095 1.516 -1.349c0 .528 .27 3.475 1 3.167c3 0 4 -4.222 3.587 -7.389c2.7 1.411 4.987 3.376 6.331 6.174z" />
            </svg>`;
    }
    if (goal === 'Hipertrofia') {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M2.017 20.305c1.13 1.614 6.042 2.882 8.362-.14c2.51 1.2 6.65.828 10.02-1.052c.468-.261.912-.591 1.183-1.054c.613-1.045.628-2.495-.49-4.634c-1.865-4.655-5.218-8.74-6.572-10.383c-.278-.254-2.052-.614-3.133-.96c-.478-.147-1.367-.246-2.431 1.156c-.505.665-2.796 2.297.111 3.395c.45.115.782.326 2.836-.05c.268-.046.936 0 1.407.827l.983 1.406a.96.96 0 0 1 .17.44c.172 1.5.166 3.376 1.002 4.326c-1.291-.933-4.664-2.042-7.206 1.113M2.001 12.94a6.714 6.714 0 0 1 8.416-.419" />
            </svg>`;
    }
    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M7 20l10 0" />
            <path d="M6 6l6 -1l6 1" />
            <path d="M12 3l0 17" />
            <path d="M9 12l-3 -6l-3 6a3 3 0 0 0 6 0" />
            <path d="M21 12l-3 -6l-3 6a3 3 0 0 0 6 0" />
        </svg>`;
}

export function updateDietGoalIcon(goal) {
    const target = document.getElementById('dietTargetCal');
    if (!target) return;
    const card = target.closest('.bg-zinc-900');
    if (!card) return;
    const existing = card.querySelector('#dietGoalIcon');
    if (existing) existing.remove();
    const wrapper = document.createElement('div');
    wrapper.id = 'dietGoalIcon';
    wrapper.className = 'absolute right-10 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center pointer-events-none opacity-50';
    wrapper.innerHTML = createGoalIcon(goal);
    card.appendChild(wrapper);
}

// --- DATE HELPERS ---
function getFormattedDateString(date) {
    if (!date || !(date instanceof Date)) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function updateDateDisplay() {
    try {
        const elDate = document.getElementById('currentDietDateDisplay');
        const elWeek = document.getElementById('currentDietWeekDay');
        if (!elDate && !elWeek) return;

        const now = new Date();
        const isToday = now.getFullYear() === viewDate.getFullYear() && now.getMonth() === viewDate.getMonth() && now.getDate() === viewDate.getDate();

        if (elDate) {
            elDate.textContent = isToday ? 'Hoje' : viewDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
        if (elWeek) {
            elWeek.textContent = viewDate.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
        }
    } catch (err) { /* silent */ }
}

// --- SIMPLE OPENFOODFACTS SEARCH HELPER ---
async function searchOpenFoodFacts(query) {
    try {
        const url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(query) + '&search_simple=1&action=process&json=1&page_size=8';
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        if (!json || !Array.isArray(json.products)) return [];
        const results = [];
        json.products.forEach(p => {
            const name = p.product_name || p.generic_name || p.brands || p.brand || p.product_name_en || '';
            if (!name) return;
            const n = p.nutriments || {};
            const macros = {
                cal: n['energy-kcal_100g'] || n['energy_100g'] || 0,
                prot: n['proteins_100g'] || 0,
                carb: n['carbohydrates_100g'] || n['carbs_100g'] || 0,
                fat: n['fat_100g'] || 0
            };
            results.push({ name: String(name).trim(), macros });
        });
        return results;
    } catch (err) {
        return [];
    }
}

// --- LÓGICA DE CARREGAMENTO (USANDO ESTADO LOCAL) ---
async function deleteSavedMeal(mealId, mealName) {
    const confirmed = await showConfirmDialog({
        title: 'Excluir Refeição',
        message: `Tem certeza que deseja excluir a refeição "${mealName}"?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger'
    });
    if (!confirmed) return;

    try {
        const { error } = await supabase
            .from('saved_meals')
            .delete()
            .eq('id', mealId);

        if (error) throw error;

        showToast('Refeição excluída com sucesso!', 'success');

        // Recarregar lista de refeições salvas
        await openSavedMealsModal();

    } catch (err) {
        console.error('Erro ao excluir refeição:', err);
        showToast('Erro ao excluir refeição: ' + err.message, 'error');
    }
}

async function openSavedMealsModal() {
    try {
        const user = (await supabase.auth.getUser()).data?.user;
        if (!user) {
            showToast('Você precisa estar logado para acessar refeições salvas.', 'error');
            return;
        }

        // Buscar refeições salvas do usuário
        const { data: savedMeals, error } = await supabase
            .from('saved_meals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const modal = document.getElementById('selectSavedMealModal');
        const closeBtn = document.getElementById('closeSelectSavedMealModalBtn');
        const mealList = document.getElementById('savedMealListContainer');
        const noMealsMsg = document.getElementById('noSavedMealsMessage');

        if (!modal || !mealList || !noMealsMsg) {
            console.error('Elementos do modal de refeições salvas não encontrados');
            return;
        }

        // Limpar lista anterior
        mealList.innerHTML = '';

        if (!savedMeals || savedMeals.length === 0) {
            mealList.classList.add('hidden');
            noMealsMsg.classList.remove('hidden');
        } else {
            mealList.classList.remove('hidden');
            noMealsMsg.classList.add('hidden');

            // Renderizar refeições salvas
            savedMeals.forEach(meal => {
                const ingredientCount = meal.ingredients?.length || 0;

                // Calcular totais de macros
                let totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0;
                if (meal.ingredients && Array.isArray(meal.ingredients)) {
                    meal.ingredients.forEach(ing => {
                        const grams = parseFloat(ing.grams) || 0;
                        if (ing.macros && grams > 0) {
                            const factor = grams / 100;
                            totalCal += (ing.macros.cal || 0) * factor;
                            totalProt += (ing.macros.prot || 0) * factor;
                            totalCarb += (ing.macros.carb || 0) * factor;
                            totalFat += (ing.macros.fat || 0) * factor;
                        }
                    });
                }

                const mealCard = document.createElement('div');
                mealCard.className = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 transition group hover:border-destaque cursor-pointer';
                mealCard.innerHTML = `
                    <div class="flex justify-between items-center gap-3">
                        <div class="flex-1">
                            <h4 class="text-white font-bold mb-2">${meal.name}</h4>
                            <div class="flex items-center gap-2 text-xs">
                                <div class="flex items-center gap-1">
                                    <span class="font-bold text-white">${Math.round(totalProt)}g</span>
                                    <span class="text-zinc-500">P</span>
                                </div>
                                <span class="text-zinc-700">•</span>
                                <div class="flex items-center gap-1">
                                    <span class="font-bold text-white">${Math.round(totalCarb)}g</span>
                                    <span class="text-zinc-500">C</span>
                                </div>
                                <span class="text-zinc-700">•</span>
                                <div class="flex items-center gap-1">
                                    <span class="font-bold text-white">${Math.round(totalFat)}g</span>
                                    <span class="text-zinc-500">G</span>
                                </div>
                                <span class="text-zinc-700">•</span>
                                <div class="flex items-center gap-1">
                                    <span class="font-bold text-destaque">${Math.round(totalCal)}</span>
                                    <span class="text-zinc-500">kcal</span>
                                </div>
                            </div>
                        </div>
                        <button class="meal-delete-btn p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition" title="Excluir Refeição">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                        </button>
                    </div>
                `;

                // Evento para selecionar refeição (click no card inteiro)
                mealCard.addEventListener('click', (e) => {
                    // Não selecionar se clicou no botão de deletar
                    if (e.target.closest('.meal-delete-btn')) return;
                    modal.classList.add('hidden');
                    loadSavedMealIntoModal(meal);
                });

                // Evento para excluir refeição
                const deleteBtn = mealCard.querySelector('.meal-delete-btn');
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await deleteSavedMeal(meal.id, meal.name);
                });

                mealList.appendChild(mealCard);
            });
        }

        // Configurar botão de fechar
        const closeHandler = () => {
            modal.classList.add('hidden');
        };
        closeBtn.removeEventListener('click', closeHandler);
        closeBtn.addEventListener('click', closeHandler);

        // Abrir modal
        modal.classList.remove('hidden');

    } catch (err) {
        console.error('Erro ao carregar refeições salvas:', err);
        showToast('Erro ao carregar refeições salvas: ' + err.message, 'error');
    }
}

function loadSavedMealIntoModal(meal) {
    const { mealNameInput, foodRowsContainer } = getEls();

    if (mealNameInput) mealNameInput.value = meal.name;
    if (foodRowsContainer) foodRowsContainer.innerHTML = '';

    const ingredients = meal.ingredients || [];
    ingredients.forEach(ing => {
        addFoodRow(ing.name, ing.grams, ing.macros || null);
    });

    updateModalTotals();
}

async function saveMealAsTemplate(log) {
    try {
        const user = (await supabase.auth.getUser()).data?.user;
        if (!user) {
            showToast('Você precisa estar logado para salvar refeições.', 'error');
            return;
        }

        const modal = document.getElementById('saveMealTemplateModal');
        const input = document.getElementById('saveMealTemplateNameInput');
        const confirmBtn = document.getElementById('confirmSaveMealTemplateBtn');
        const cancelBtn = document.getElementById('cancelSaveMealTemplateBtn');
        const closeBtn = document.getElementById('closeSaveMealTemplateModalBtn');

        if (!modal || !input || !confirmBtn) {
            console.error('Elementos do modal de salvar refeição não encontrados');
            return;
        }

        // Preencher nome sugerido
        input.value = log.meal_name;

        // Abrir modal
        modal.classList.remove('hidden');

        // Focar no input e selecionar texto
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);

        // Função para fechar modal
        const closeModal = () => {
            modal.classList.add('hidden');
            input.value = '';
        };

        // Função para salvar
        const saveMeal = async () => {
            const templateName = input.value.trim();
            if (!templateName) {
                showToast('Digite um nome para a refeição.', 'warning');
                input.focus();
                return;
            }

            try {
                await supabase.from('saved_meals').insert([{
                    user_id: user.id,
                    name: templateName,
                    ingredients: log.foods || []
                }]);

                showToast('Refeição salva com sucesso!', 'success');
                closeModal();
            } catch (err) {
                console.error('Erro ao salvar refeição:', err);
                showToast('Erro ao salvar refeição.', 'error');
            }
        };

        // Remover listeners anteriores
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

        // Adicionar novos listeners
        newConfirmBtn.addEventListener('click', saveMeal);
        newCancelBtn.addEventListener('click', closeModal);
        newCloseBtn.addEventListener('click', closeModal);

        // Permitir Enter para confirmar
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveMeal();
            }
        });

    } catch (err) {
        console.error('Erro ao salvar template:', err);
        showToast('Erro ao salvar template.', 'error');
    }
}

export async function loadDietLogs() {
    const { dietLogList, dietConsumedCal, dietConsumedProt, dietConsumedCarb, dietConsumedFat } = getEls();
    const user = (await supabase.auth.getUser()).data?.user;
    if (!user || !dietLogList) return;

    // Atualiza o display da data e usa a `viewDate` para carregar os logs
    updateDateDisplay();
    const today = getFormattedDateString(viewDate);
    // Carrega tudo (incluindo a coluna JSON 'foods')
    const { data, error } = await supabase.from('diet_logs').select('*').eq('user_id', user.id).eq('date', today);

    if (error) { console.error(error); return; }
    if (!data) return;

    // Salva no estado global para acesso fácil na edição
    currentDietLogs = data;

    dietLogList.innerHTML = '';
    let sums = { cal: 0, prot: 0, carb: 0, fat: 0 };
    if (data.length === 0) {
        dietLogList.innerHTML = '<p class="text-zinc-500 text-center py-4 text-sm italic">Nenhuma refeição hoje.</p>';
    } else {
        data.forEach(log => {
            sums.cal += log.calories; sums.prot += log.protein; sums.carb += log.carbs; sums.fat += log.fats;
            const row = document.createElement('div');
            // Novo Design do Card de Refeição
            row.className = "relative flex flex-col bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl hover:border-destaque/30 transition-all group";

            row.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div>
                <h4 class="text-white font-bold text-base leading-tight pr-4">${log.meal_name}</h4>
                <span class="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Refeição</span>
            </div>
        
            <div class="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button class="save-meal-template-btn p-1.5 rounded text-zinc-500 hover:text-destaque hover:bg-zinc-700 transition" data-id="${log.id}" title="Salvar como Template">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                </button>
                <button class="edit-log-btn p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-700 transition" data-id="${log.id}" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="delete-log-btn p-1.5 rounded text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition" data-id="${log.id}" title="Apagar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        </div>

        <div class="mt-auto grid grid-cols-[1fr_1fr_1fr_160px] gap-2 items-center bg-zinc-950/50 rounded-lg p-2 border border-zinc-800/50">
            <div class="text-center">
                <span class="block text-xs font-bold text-zinc-300">${log.protein}g</span>
                <span class="text-[9px] text-zinc-600 uppercase font-bold">Prot</span>
            </div>
            <div class="text-center border-l border-zinc-800">
                <span class="block text-xs font-bold text-zinc-300">${log.carbs}g</span>
                <span class="text-[9px] text-zinc-600 uppercase font-bold">Carb</span>
            </div>
            <div class="text-center border-l border-zinc-800">
                <span class="block text-xs font-bold text-zinc-300">${log.fats}g</span>
                <span class="text-[9px] text-zinc-600 uppercase font-bold">Gord</span>
            </div>
        
            <div class="pl-3 border-l border-zinc-800 flex items-center justify-center">
                <div class="flex items-baseline justify-center gap-2">
                    <span class="text-2xl font-black text-destaque leading-none">${log.calories}</span>
                    <span class="text-[10px] text-destaque/60 uppercase font-bold">Kcal</span>
                </div>
            </div>
        </div>
    `;
            dietLogList.appendChild(row);
        });
    }
    if (dietConsumedCal) dietConsumedCal.textContent = sums.cal;
    if (dietConsumedProt) dietConsumedProt.textContent = sums.prot + 'g';
    if (dietConsumedCarb) dietConsumedCarb.textContent = sums.carb + 'g';
    if (dietConsumedFat) dietConsumedFat.textContent = sums.fat + 'g';
    updateDietProgress(sums.cal);

    document.querySelectorAll('.save-meal-template-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            const logToSave = currentDietLogs.find(l => l.id == id);
            if (logToSave) {
                await saveMealAsTemplate(logToSave);
            }
        });
    });

    document.querySelectorAll('.delete-log-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const button = e.target.closest('.delete-log-btn');
            const logId = button?.dataset.id;

            if (!logId) {
                showToast('Erro: ID da refeição não encontrado', 'error');
                return;
            }

            const confirmed = await showConfirmDialog({
                title: 'Excluir Refeição',
                message: 'Tem certeza que deseja excluir esta refeição?',
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                type: 'danger'
            });
            if (!confirmed) return;

            try {
                const { error } = await supabase.from('diet_logs').delete().eq('id', logId);
                if (error) throw error;
                showToast('Refeição excluída com sucesso!', 'success');
                loadDietLogs();
            } catch (err) {
                console.error('Erro ao excluir refeição:', err);
                showToast('Erro ao excluir refeição: ' + err.message, 'error');
            }
        });
    });

    // Listener de Edição Otimizado
    document.querySelectorAll('.edit-log-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            // Busca o objeto completo na memória local
            const logToEdit = currentDietLogs.find(l => l.id == id);
            if (logToEdit) openMealModal(logToEdit);
        });
    });
}

// --- MODAL DE REFEIÇÃO (Com lógica de UI limpa) ---
export async function openMealModal(log = null) {
    const { mealModal, savedMealsSelect, mealNameInput, foodRowsContainer, modalTotalCal } = getEls();
    if (!mealModal) return;

    // Atualiza o título do modal conforme o modo (edição vs novo)
    const modalTitle = mealModal.querySelector('h3, h2, .modal-title');
    if (modalTitle) {
        modalTitle.textContent = log ? 'Editar Refeição' : 'Nova Refeição';
    }

    // Limpa UI de macros manuais se existir
    const existingEditContainer = mealModal.querySelector('.edit-totals-container');
    if (existingEditContainer) existingEditContainer.remove();

    if (log) {
        // --- MODO EDIÇÃO ---
        editingLogId = log.id;
        if (mealNameInput) mealNameInput.value = log.meal_name || '';

        // Esconder seletor e divisória (Container Pai)
        if (savedMealsSelect) {
            const container = savedMealsSelect.closest('.mb-4') || savedMealsSelect.parentElement;
            if (container) container.classList.add('hidden');
        }

        // Controle da Linha Divisória
        const divider = mealModal.querySelector('hr');
        if (divider) {
            if (log) {
                divider.classList.add('hidden'); // Esconde no modo edição
            } else {
                divider.classList.remove('hidden'); // Mostra no modo novo
            }
        }

        // Popular Alimentos
        if (foodRowsContainer) {
            foodRowsContainer.innerHTML = '';
            // Se tiver array de alimentos salvo, popula
            if (log.foods && Array.isArray(log.foods) && log.foods.length > 0) {
                log.foods.forEach(f => addFoodRow(f.name, f.grams, f.macros || null));
            } else {
                // Fallback para logs antigos
                addFoodRow();
            }
        }

        const confirmBtn = document.getElementById('confirmMealBtn');
        if (confirmBtn) confirmBtn.textContent = 'Salvar Alterações';

    } else {
        // --- MODO NOVO ---
        editingLogId = null;
        if (mealNameInput) mealNameInput.value = '';

        // Mostrar seletor
        if (savedMealsSelect) {
            savedMealsSelect.value = '';
            const container = savedMealsSelect.closest('.mb-4') || savedMealsSelect.parentElement;
            if (container) container.classList.remove('hidden');
        }

        if (foodRowsContainer) {
            foodRowsContainer.innerHTML = '';
            addFoodRow();
        }

        const confirmBtn = document.getElementById('confirmMealBtn');
        if (confirmBtn) confirmBtn.textContent = 'Registrar Refeição';

        // Carregar Templates
        try {
            const user = (await supabase.auth.getUser()).data?.user;
            if (user && savedMealsSelect) {
                const { data } = await supabase.from('saved_meals').select('*').eq('user_id', user.id);
                if (data) {
                    savedMealsSelect.innerHTML = '<option value="">-- Selecione para carregar --</option>';
                    data.forEach(m => {
                        const o = document.createElement('option');
                        o.value = m.id; // armazenamos o ID para permitir operações (ex: delete)
                        o.dataset.ingredients = JSON.stringify(m.ingredients); // ingredientes no dataset
                        o.textContent = m.name;
                        savedMealsSelect.appendChild(o);
                    });
                }
            }
        } catch (err) { console.error(err); }
    }

    updateModalTotals();
    mealModal.classList.remove('hidden');
}

// --- INICIALIZAÇÃO E SAVE ---
export function initDietModule() {
    const { closeMealModalBtn, cancelMealBtn, addFoodRowBtn, confirmMealBtn } = getEls();

    // Date navigation buttons (prev / next)
    const prevBtn = document.getElementById('prevDietDateBtn');
    const nextBtn = document.getElementById('nextDietDateBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() - 1);
        loadDietLogs();
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + 1);
        loadDietLogs();
    });

    if (closeMealModalBtn) closeMealModalBtn.addEventListener('click', () => document.getElementById('mealModal')?.classList.add('hidden'));

    if (cancelMealBtn) cancelMealBtn.addEventListener('click', () => document.getElementById('mealModal')?.classList.add('hidden'));

    if (addFoodRowBtn) addFoodRowBtn.addEventListener('click', () => addFoodRow());

    // Botão para abrir modal de refeições salvas
    const openSavedMealsBtn = document.getElementById('openSavedMealsBtn');
    if (openSavedMealsBtn) openSavedMealsBtn.addEventListener('click', openSavedMealsModal);

    // Manter compatibilidade com select se existir (remover depois)
    const savedMealsSelect = document.getElementById('savedMealsSelect');
    if (savedMealsSelect) savedMealsSelect.addEventListener('change', (e) => {
        const ings = JSON.parse(e.target.options[e.target.selectedIndex].dataset.ingredients || "[]");
        // Mostrar / esconder botão de deletar
        const delBtn = document.getElementById('deleteSavedMealBtn');
        if (delBtn) {
            if (e.target.value) delBtn.classList.remove('hidden');
            else delBtn.classList.add('hidden');
        }

        const container = document.getElementById('foodRowsContainer');
        if (container) {
            container.innerHTML = '';
            document.getElementById('mealNameInput').value = e.target.options[e.target.selectedIndex]?.text || '';
            ings.forEach(i => addFoodRow(i.name, i.grams, i.macros || null));
            updateModalTotals();
        }
    });

    if (confirmMealBtn) confirmMealBtn.addEventListener('click', async () => {
        try {
            const user = (await supabase.auth.getUser()).data?.user;
            if (!user) {
                showToast('Você precisa estar logado para salvar refeições.', 'error');
                return;
            }

            // --- 1. CAPTURAR ALIMENTOS DA UI ---
            const foods = [];
            document.querySelectorAll('.food-row').forEach(row => {
                const input = row.querySelector('.food-search-input') || row.querySelector('.food-input') || row.querySelector('.food-select');
                const name = input ? input.value : '';
                const gramsEl = row.querySelector('.food-grams');
                const grams = gramsEl ? (gramsEl.value || '') : '';
                let macros = null;
                if (input && input.dataset && input.dataset.macros) {
                    try { macros = JSON.parse(input.dataset.macros); } catch (e) { macros = null; }
                }
                if (name && grams) {
                    foods.push({ name, grams, macros });
                }
            });

            // --- 2. CALCULAR TOTAIS ---
            const totals = updateModalTotals();
            if (totals.cal === 0 && foods.length === 0) {
                showToast('Adicione alimentos à refeição.', 'warning');
                return;
            }

            // --- 3. MONTAR PAYLOAD COM O CAMPO 'foods' ---
            const payload = {
                user_id: user.id,
                date: getFormattedDateString(viewDate),
                meal_name: document.getElementById('mealNameInput').value || 'Refeição',
                calories: Math.round(totals.cal),
                protein: Math.round(totals.prot),
                carbs: Math.round(totals.carb),
                fats: Math.round(totals.fat),
                foods: foods // <--- SALVANDO O JSON
            };

            // --- 4. INSERT OU UPDATE ---
            if (editingLogId) {
                await supabase.from('diet_logs').update(payload).eq('id', editingLogId);
                showToast('Refeição atualizada com sucesso!', 'success');
                editingLogId = null;
            } else {
                await supabase.from('diet_logs').insert([payload]);
                showToast('Refeição salva com sucesso!', 'success');
            }

            document.getElementById('mealModal')?.classList.add('hidden');
            loadDietLogs();

        } catch (err) {
            console.error('Erro ao salvar:', err);
            showToast('Erro ao salvar refeição.', 'error');
        }
    });
}

export default {
    initDietModule, calculateDietTargets, loadDietLogs, openMealModal
};