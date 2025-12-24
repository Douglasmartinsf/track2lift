
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ChevronLeft, AlertTriangle, User, Dumbbell } from 'lucide-react';
import ProfilePreferences from '../components/settings/ProfilePreferences';
import ExerciseManager from '../components/settings/ExerciseManager';

interface SettingsViewProps {
    user: UserProfile;
    onUpdateUser: (u: UserProfile) => void;
    onBack: () => void;
}

type SettingsTab = 'PROFILE' | 'EXERCISES';

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, onBack }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');

    return (
        <div className="bg-fundo min-h-screen relative flex flex-col w-full max-w-full overflow-x-hidden">
            {/* Mobile Sticky Header */}
            <div className="sticky top-0 z-30 bg-fundo/80 backdrop-blur-md border-b border-zinc-800 px-4 py-4 flex items-center gap-4 shrink-0 w-full">
                <button 
                    onClick={onBack} 
                    className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-100 transition active:scale-95"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-display font-bold text-lg">Configurações</h1>
            </div>

            <div className="container mx-auto max-w-lg px-4 pt-6 flex-1 flex flex-col w-full">
                
                {/* Tab Navigation */}
                <div className="flex p-1 bg-zinc-900 rounded-2xl border border-zinc-800 mb-8 shrink-0 w-full">
                    <button 
                        onClick={() => setActiveTab('PROFILE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                            activeTab === 'PROFILE' 
                            ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <User size={16} />
                        Perfil
                    </button>
                    <button 
                        onClick={() => setActiveTab('EXERCISES')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                            activeTab === 'EXERCISES' 
                            ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <Dumbbell size={16} />
                        Exercícios
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 animate-in fade-in duration-300 w-full max-w-full">
                    {activeTab === 'PROFILE' ? (
                        <ProfilePreferences user={user} onUpdateUser={onUpdateUser} />
                    ) : (
                        <ExerciseManager user={user} onUpdateUser={onUpdateUser} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
