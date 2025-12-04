// Utilitários de UI - Toast e Modais de Confirmação

// Sistema de Toast para notificações
export function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();

    const toast = document.createElement('div');
    const typeColors = {
        success: 'bg-green-600 border-green-500',
        error: 'bg-red-600 border-red-500',
        warning: 'bg-yellow-600 border-yellow-500',
        info: 'bg-zinc-700 border-zinc-600'
    };

    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
        warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    toast.className = `flex items-center gap-3 ${typeColors[type]} border-l-4 text-white px-4 py-3 rounded-lg shadow-xl mb-3 animate-slide-in-right`;
    toast.innerHTML = `
        <div class="flex-shrink-0">${icons[type]}</div>
        <div class="flex-1 text-sm font-medium">${message}</div>
        <button class="flex-shrink-0 text-white/80 hover:text-white transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => removeToast(toast));

    toastContainer.appendChild(toast);

    // Auto-remove após 4 segundos
    setTimeout(() => removeToast(toast), 4000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed top-4 right-4 z-[9999] flex flex-col items-end max-w-md';
    document.body.appendChild(container);
    return container;
}

function removeToast(toast) {
    toast.style.animation = 'slide-out-right 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
}

// Modal de confirmação reutilizável
export function showConfirmDialog(options) {
    return new Promise((resolve) => {
        const {
            title = 'Confirmar ação',
            message = 'Tem certeza que deseja continuar?',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'warning', // warning, danger, info
            icon = null
        } = options;

        // Criar backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] flex items-center justify-center p-4 animate-fade-in';

        // Cores baseadas no tipo
        const typeColors = {
            warning: 'text-yellow-400',
            danger: 'text-red-400',
            info: 'text-blue-400'
        };

        const defaultIcons = {
            warning: '<svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
            danger: '<svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>',
            info: '<svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        };

        const confirmBtnColors = {
            warning: 'bg-yellow-600 hover:bg-yellow-700',
            danger: 'bg-red-600 hover:bg-red-700',
            info: 'bg-blue-600 hover:bg-blue-700'
        };

        backdrop.innerHTML = `
            <div class="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl max-w-md w-full animate-scale-in">
                <div class="p-6 text-center">
                    <h3 class="text-xl font-bold text-white mb-2">${title}</h3>
                    <p class="text-zinc-400 mb-6">${message}</p>
                    <div class="flex gap-3">
                        <button id="confirmDialogCancel" class="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition">
                            ${cancelText}
                        </button>
                        <button id="confirmDialogConfirm" class="flex-1 px-4 py-3 ${confirmBtnColors[type]} text-white rounded-lg font-medium transition">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        const confirmBtn = backdrop.querySelector('#confirmDialogConfirm');
        const cancelBtn = backdrop.querySelector('#confirmDialogCancel');

        const cleanup = () => {
            backdrop.style.animation = 'fade-out 0.2s ease-out';
            setTimeout(() => backdrop.remove(), 200);
        };

        confirmBtn.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(false);
        });

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                cleanup();
                resolve(false);
            }
        });

        document.body.appendChild(backdrop);
    });
}

// Adicionar animações CSS necessárias
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in-right {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slide-out-right {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes scale-in {
        from {
            transform: scale(0.9);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .animate-slide-in-right {
        animation: slide-in-right 0.3s ease-out;
    }
    
    .animate-fade-in {
        animation: fade-in 0.2s ease-out;
    }
    
    .animate-scale-in {
        animation: scale-in 0.2s ease-out;
    }
`;
document.head.appendChild(style);
