
import React from 'react';
import { DashboardTab } from '../types';
import { Activity, Utensils, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
    activeTab: DashboardTab;
    setActiveTab: (tab: DashboardTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    
    const tabs = [
        { id: DashboardTab.WORKOUTS, icon: Activity, label: 'Treinos', disabled: false },
        { id: DashboardTab.DIET, icon: Utensils, label: 'Dieta', disabled: true }, // Temporarily disabled
        { id: DashboardTab.PROGRESS, icon: BarChart2, label: 'Progresso', disabled: true }, // Temporarily disabled
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 pb-safe pt-2 px-6 z-50 h-[88px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center h-full pb-4 max-w-sm mx-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    
                    return (
                        <button 
                            key={tab.id}
                            onClick={() => !tab.disabled && setActiveTab(tab.id)}
                            disabled={tab.disabled}
                            className={`relative flex flex-col items-center justify-center w-20 h-14 transition-all ${
                                tab.disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'
                            }`}
                        >
                            {/* Removed the background 'nav-pill' rectangle here */}
                            
                            <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-destaque' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`} />
                            </span>
                            
                            <span className={`relative z-10 text-[10px] font-bold mt-1 transition-colors duration-200 ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                                {tab.label}
                            </span>
                            
                            {isActive && (
                                <motion.div 
                                    layoutId="nav-glow"
                                    className="absolute -bottom-2 w-1 h-1 bg-destaque rounded-full shadow-[0_0_8px_2px_rgba(220,38,38,0.8)]"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
