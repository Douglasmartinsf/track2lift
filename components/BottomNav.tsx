import React from 'react';
import { DashboardTab } from '../types';
import { Activity, Utensils, BarChart2 } from 'lucide-react';

interface BottomNavProps {
    activeTab: DashboardTab;
    setActiveTab: (tab: DashboardTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 pb-safe pt-2 px-6 z-50 h-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
            <div className="flex justify-between items-center h-full pb-2">
                <button 
                    onClick={() => setActiveTab(DashboardTab.WORKOUTS)}
                    className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === DashboardTab.WORKOUTS ? 'text-destaque' : 'text-zinc-500'}`}
                >
                    <Activity size={24} strokeWidth={activeTab === DashboardTab.WORKOUTS ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Treinos</span>
                </button>

                <button 
                    onClick={() => setActiveTab(DashboardTab.DIET)}
                    className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === DashboardTab.DIET ? 'text-destaque' : 'text-zinc-500'}`}
                >
                    <Utensils size={24} strokeWidth={activeTab === DashboardTab.DIET ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Dieta</span>
                </button>

                <button 
                    onClick={() => setActiveTab(DashboardTab.PROGRESS)}
                    className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === DashboardTab.PROGRESS ? 'text-destaque' : 'text-zinc-500'}`}
                >
                    <BarChart2 size={24} strokeWidth={activeTab === DashboardTab.PROGRESS ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Progresso</span>
                </button>
            </div>
        </div>
    );
};

export default BottomNav;