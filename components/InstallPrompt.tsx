import React, { useState, useEffect } from 'react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice?.outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-destaque p-4 rounded-xl shadow-lg flex justify-between items-center z-50">
      <p className="text-white font-bold">Instale o Track2Lift no seu celular!</p>
      <button
        onClick={handleInstallClick}
        className="bg-white text-destaque px-4 py-2 rounded-lg font-bold"
      >
        Baixar
      </button>
    </div>
  );
};

export default InstallPrompt;
