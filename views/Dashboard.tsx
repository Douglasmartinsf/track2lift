
import React, { useState, useEffect } from 'react';
import { DashboardTab, UserProfile } from '../types';
import WorkoutsTab from './tabs/Workouts';
import DietTab from './tabs/Diet';
import ProgressTab from './tabs/Progress';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardViewProps {
    user: UserProfile;
    activeTab: DashboardTab;
    setActiveTab?: (tab: DashboardTab) => void;
}

const tabOrder = {
    [DashboardTab.WORKOUTS]: 0,
    [DashboardTab.DIET]: 1,
    [DashboardTab.PROGRESS]: 2,
};

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 20 : -20,
        opacity: 0,
        filter: 'blur(5px)',
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        filter: 'none',
        transitionEnd: {
            transform: 'none',
            filter: 'none'
        }
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 20 : -20,
        opacity: 0,
        filter: 'blur(5px)',
    })
};

const DashboardView: React.FC<DashboardViewProps> = ({ user, activeTab }) => {
    const [direction, setDirection] = useState(0);
    const [prevTab, setPrevTab] = useState(activeTab);

    useEffect(() => {
        const currentOrder = tabOrder[activeTab] || 0;
        const prevOrder = tabOrder[prevTab] || 0;
        setDirection(currentOrder > prevOrder ? 1 : -1);
        setPrevTab(activeTab);
    }, [activeTab]);

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
        <div className="w-full min-h-full py-6">
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={activeTab}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    className="w-full"
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default DashboardView;
