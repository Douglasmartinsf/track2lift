// arquivo que define `tailwind.config` antes do CDN do Tailwind ser carregado
// Mantém as cores personalizadas do projeto
window.tailwind = window.tailwind || {};
window.tailwind.config = {
    theme: {
        extend: {
            colors: {
                'fundo': '#181818',
                'texto': '#FCFCFC',
                'destaque': '#DC2626',
                'card': '#27272a'
            }
        }
    }
};

// Debug: confirma que o arquivo foi carregado antes do CDN
try { console.debug('[tailwind-config] loaded', !!window.tailwind && !!window.tailwind.config); } catch (e) { /* noop */ }
