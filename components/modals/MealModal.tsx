import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FoodItem, DietLog } from '../../types';
import { searchOpenFoodFacts, calculateMealTotals, TBCA_DATA } from '../../services/dietService';
import { X, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface MealModalProps {
    onClose: () => void;
    onSave: (meal: Partial<DietLog>) => void;
}

const MealModal: React.FC<MealModalProps> = ({ onClose, onSave }) => {
    const [mealName, setMealName] = useState('');
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [grams, setGrams] = useState(100);

    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => document.body.classList.remove('modal-open');
    }, []);

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        const local = TBCA_DATA.filter(f => f.name.toLowerCase().includes(term.toLowerCase()));
        setSearchResults(local);
        searchOpenFoodFacts(term).then(apiResults => {
            setSearchResults([...local, ...apiResults.slice(0, 5)]);
        });
    };

    const addFood = (item: any) => {
        const newFood: FoodItem = { name: item.name, grams: grams, macros: item.macros };
        setFoods([...foods, newFood]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const totals = calculateMealTotals(foods);

    const handleSave = () => {
        if (!mealName || foods.length === 0) return;
        onSave({
            meal_name: mealName,
            foods,
            calories: Math.round(totals.cal),
            protein: Math.round(totals.prot),
            carbs: Math.round(totals.carb),
            fats: Math.round(totals.fat)
        });
    };

    const modalContent = (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900 w-full max-w-2xl rounded-3xl border border-zinc-700 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold">Nova Refeição</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X className="text-zinc-400 hover:text-white"/></button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome da Refeição</label>
                        <input className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 mt-1 focus:border-destaque outline-none transition-all" 
                            placeholder="Ex: Almoço Pós-Treino" value={mealName} onChange={e => setMealName(e.target.value)} />
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Alimentos</label>
                        <div className="flex gap-2 relative">
                            <input className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 focus:border-destaque outline-none transition-all" 
                                placeholder="Buscar alimento..." value={searchTerm} onChange={e => handleSearch(e.target.value)} />
                            <div className="relative">
                                <input type="number" className="w-24 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-3 text-center focus:border-destaque outline-none" 
                                    value={grams} onChange={e => setGrams(Number(e.target.value))} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500 uppercase pr-1">g</span>
                            </div>
                        </div>
                        
                        {searchResults.length > 0 && (
                            <div className="bg-zinc-800 border border-zinc-700 rounded-xl max-h-56 overflow-y-auto z-10 shadow-2xl">
                                {searchResults.map((res, i) => (
                                    <div key={i} onClick={() => addFood(res)} className="p-4 hover:bg-zinc-700 cursor-pointer text-sm border-b border-zinc-700/50 flex justify-between items-center transition-colors">
                                        <div>
                                            <div className="font-bold text-zinc-100">{res.name}</div>
                                            <div className="text-[10px] text-zinc-500 uppercase font-black">{Math.round(res.macros.cal)} kcal / 100g</div>
                                        </div>
                                        <Plus size={16} className="text-destaque" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            {foods.map((f, i) => (
                                <div key={i} className="flex justify-between items-center bg-zinc-950/50 border border-white/5 p-3 rounded-xl text-sm animate-in fade-in slide-in-from-left-2">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-zinc-200">{f.name}</span>
                                        <span className="text-[10px] text-zinc-500 font-black uppercase">{f.grams}g</span>
                                    </div>
                                    <button onClick={() => setFoods(foods.filter((_, idx) => idx !== i))} className="p-2 text-zinc-600 hover:text-red-500 transition-colors"><X size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                     <div className="grid grid-cols-4 gap-2 bg-zinc-950 p-5 rounded-2xl text-center border border-white/5">
                         <div>
                             <span className="block text-xl font-black text-destaque leading-none mb-1">{Math.round(totals.cal)}</span>
                             <span className="text-[10px] uppercase text-zinc-600 font-black">Kcal</span>
                         </div>
                         <div><span className="block font-bold text-zinc-300">{Math.round(totals.prot)}g</span><span className="text-[10px] text-zinc-600 font-bold">PROT</span></div>
                         <div><span className="block font-bold text-zinc-300">{Math.round(totals.carb)}g</span><span className="text-[10px] text-zinc-600 font-bold">CARB</span></div>
                         <div><span className="block font-bold text-zinc-300">{Math.round(totals.fat)}g</span><span className="text-[10px] text-zinc-600 font-bold">GORD</span></div>
                     </div>
                </div>

                <div className="p-6 border-t border-zinc-800 flex justify-end shrink-0">
                    <button onClick={handleSave} className="w-full bg-destaque text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-xl shadow-destaque/20">
                        Registrar Refeição
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default MealModal;