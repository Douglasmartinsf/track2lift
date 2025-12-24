import React from 'react';
import { DashboardTab, UserProfile } from '../types';
import WorkoutsTab from './tabs/Workouts';
import DietTab from './tabs/Diet';
import ProgressTab from './tabs/Progress';

interface DashboardViewProps {
    user: UserProfile;
    activeTab: DashboardTab;
    setActiveTab?: (tab: DashboardTab) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ user, activeTab }) => {
    
    // Removidas classes de animação (animate-in fade-in) do container pai.
    // Animações CSS que usam 'transform' quebram o comportamento de 'position: sticky'
    // nos elementos filhos, pois alteram o contexto de empilhamento (stacking context).
    const renderContent = () => {
        switch (activeTab) {
            case DashboardTab.WORKOUTS:
                return <WorkoutsTab user={user} />;
            case DashboardTab.DIET:
                return <DietTab user={user} />;
            case DashboardTab.PROGRESS:
                return <ProgressTab user={user} />;
            default:
                return <WorkoutsTab user={user} />;
        }
    };

    return (
        <div className="w-full min-h-full px-4 py-6">
            {renderContent()}
        </div>
    );
};

export default DashboardView;