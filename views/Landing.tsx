import React from 'react';
import { Dumbbell, Apple, BarChart } from 'lucide-react';

interface LandingViewProps {
    onLoginClick: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onLoginClick }) => {
    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 text-center bg-gradient-to-br from-[#181818] via-[#1e1e1e] to-[#0f0f0f]">
                {/* Background Blobs */}
                <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
                    <div className="absolute w-[500px] h-[500px] rounded-full bg-red-700 blur-[150px] -top-32 -left-32"></div>
                    <div className="absolute w-[500px] h-[500px] rounded-full bg-red-600 blur-[150px] top-1/2 right-0"></div>
                </div>

                <div className="relative z-10 container mx-auto px-6">
                    <div className="mb-8 animate-fade-in-up">
                         <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-display tracking-tight">
                            <span>TRACK</span><span className="text-destaque">2</span><span>LIFT</span>
                        </h1>
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                        Seu treino, sua dieta. <br/> <span className="text-destaque">Um app.</span>
                    </h2>
                    
                    <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
                         Pare de adivinhar. Registre seus treinos, planeje sua dieta e veja seu progresso decolar.
                    </p>
                    
                    <button 
                        onClick={onLoginClick}
                        className="bg-destaque text-white font-bold py-4 px-10 rounded-xl text-lg hover:bg-red-700 hover:scale-105 transition shadow-lg shadow-red-900/30"
                    >
                        Comece a sua evolução
                    </button>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 bg-zinc-900/30">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16">
                        Tudo que você precisa para <span className="text-destaque">evoluir</span>.
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<Dumbbell size={40} className="text-destaque" />} 
                            title="Log de Treino"
                            desc="Registre cada série, repetição e peso. Acompanhe sua força e progrida sem estagnação."
                        />
                        <FeatureCard 
                            icon={<Apple size={40} className="text-destaque" />} 
                            title="Controle de Dieta"
                            desc="Monitore suas calorias e macros. Alcance seus objetivos de peso com precisão."
                        />
                        <FeatureCard 
                            icon={<BarChart size={40} className="text-destaque" />} 
                            title="Tracking"
                            desc="Acompanhe sua evolução com gráficos detalhados e veja seus resultados crescerem."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="bg-zinc-800/50 p-8 rounded-2xl border border-zinc-700 hover:border-destaque transition hover:-translate-y-1">
        <div className="mb-4 flex justify-center">{icon}</div>
        <h3 className="text-xl font-bold mb-3 text-center">{title}</h3>
        <p className="text-zinc-400 text-center text-sm">{desc}</p>
    </div>
);

export default LandingView;