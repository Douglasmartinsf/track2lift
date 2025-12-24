import React from 'react';
import { ViewState, UserProfile } from '../types';
import { LogOut, User, Activity, Utensils, BarChart2 } from 'lucide-react';
import { LogoMobile } from './icons/LogoMobile';

interface HeaderProps {
    view: ViewState;
    user: UserProfile | null;
    setView: (v: ViewState) => void;
    activeTab?: string;
    setActiveTab?: (t: any) => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ view, user, setView, activeTab, setActiveTab, onLogout }) => {
    
    // Header only renders on authenticated views or onboarding now
    return (
        <header className="relative z-50 bg-fundo shadow-lg shadow-black/20 border-b border-zinc-800/50">
            <nav className="px-4 lg:px-8 py-4">
                <div className="w-full flex items-center justify-between">
                    <div className="flex items-center">
                        <LogoMobile className="h-7 w-auto" />
                    </div>

                    {/* Desktop Menu - Tabs Centered (Hidden on Mobile) */}
                    {user && view === ViewState.DASHBOARD && (
                        <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <button 
                                onClick={() => setActiveTab && setActiveTab('WORKOUTS')}
                                className={`flex items-center gap-2 font-medium transition ${activeTab === 'WORKOUTS' ? 'text-destaque border-b-2 border-destaque' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <Activity size={18} /> Treinos
                            </button>
                            <span className="text-zinc-700">|</span>
                            <button 
                                onClick={() => setActiveTab && setActiveTab('DIET')}
                                className={`flex items-center gap-2 font-medium transition ${activeTab === 'DIET' ? 'text-destaque border-b-2 border-destaque' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <Utensils size={18} /> Dieta
                            </button>
                            <span className="text-zinc-700">|</span>
                            <button 
                                onClick={() => setActiveTab && setActiveTab('PROGRESS')}
                                className={`flex items-center gap-2 font-medium transition ${activeTab === 'PROGRESS' ? 'text-destaque border-b-2 border-destaque' : 'text-zinc-400 hover:text-white'}`}
                            >
                                <BarChart2 size={18} /> Progresso
                            </button>
                        </div>
                    )}

                    {/* Right Side Actions */}
                    <div className="flex items-center">
                        {user && (
                            <div className="flex items-center gap-3 sm:gap-4">
                                <button onClick={() => setView(ViewState.SETTINGS)} className="flex items-center gap-2 text-zinc-300 hover:text-white bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700 transition">
                                    <User size={18} />
                                    <span className="max-w-[80px] truncate text-sm">{user.name || 'Atleta'}</span>
                                </button>
                                <button onClick={onLogout} className="text-zinc-500 hover:text-destaque p-2" title="Sair">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;