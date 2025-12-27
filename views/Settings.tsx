
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ChevronLeft, User, Dumbbell, MessageSquare } from 'lucide-react';
import ProfilePreferences from '../components/settings/ProfilePreferences';
import ExerciseManager from '../components/settings/ExerciseManager';
import SupportFeedback from '../components/settings/SupportFeedback';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsViewProps {
    user: UserProfile;
    onUpdateUser: (u: UserProfile) => void;
    onBack: () => void;
}

type SettingsTab = 'PROFILE' | 'EXERCISES' | 'SUPPORT';

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
                <div className="flex p-1 bg-zinc-900 rounded-2xl border border-zinc-800 mb-8 shrink-0 w-full overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setActiveTab('PROFILE')}
                        className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
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
                        className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                            activeTab === 'EXERCISES' 
                            ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <Dumbbell size={16} />
                        Exercícios
                    </button>
                    <button 
                        onClick={() => setActiveTab('SUPPORT')}
                        className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                            activeTab === 'SUPPORT' 
                            ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <MessageSquare size={16} />
                        Suporte
                    </button>
                </div>

                {/* Content Area with Animation */}
                <div className="flex-1 w-full max-w-full relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="w-full"
                        >
                            {activeTab === 'PROFILE' && (
                                <ProfilePreferences user={user} onUpdateUser={onUpdateUser} />
                            )}
                            {activeTab === 'EXERCISES' && (
                                <ExerciseManager user={user} onUpdateUser={onUpdateUser} />
                            )}
                            {activeTab === 'SUPPORT' && (
                                <SupportFeedback user={user} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
