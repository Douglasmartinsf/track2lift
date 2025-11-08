// Google Analytics 4 - Event Tracking
// Rastreia cliques em CTAs e interações importantes

(function () {
    // Verifica se o GA4 está carregado
    function trackEvent(eventName, eventParams = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventParams);
        }
    }

    // Aguarda o DOM carregar
    document.addEventListener('DOMContentLoaded', function () {

        // ===== TRACKING DE CTAs =====

        // CTA Hero Section - "Comece a sua evolução"
        const heroCTA = document.getElementById('heroCTA');
        if (heroCTA) {
            heroCTA.addEventListener('click', function () {
                trackEvent('cta_click', {
                    cta_location: 'hero',
                    cta_text: 'Comece a sua evolução',
                    event_category: 'engagement',
                    event_label: 'Hero CTA'
                });
            });
        }

        // CTA Header - "Acessar Agora"
        const headerCTA = document.querySelector('a[href="#download"]');
        if (headerCTA && headerCTA.textContent.includes('Acessar Agora')) {
            headerCTA.addEventListener('click', function () {
                trackEvent('cta_click', {
                    cta_location: 'header',
                    cta_text: 'Acessar Agora',
                    event_category: 'engagement',
                    event_label: 'Header CTA'
                });
            });
        }

        // CTA Final - "Comece a sua evolução" (final da página)
        const finalCTAs = document.querySelectorAll('a[href="#"]');
        finalCTAs.forEach(function (cta) {
            if (cta.textContent.includes('Comece a sua evolução') && cta !== heroCTA) {
                cta.addEventListener('click', function () {
                    trackEvent('cta_click', {
                        cta_location: 'final_section',
                        cta_text: 'Comece a sua evolução',
                        event_category: 'engagement',
                        event_label: 'Final CTA'
                    });
                });
            }
        });

        // ===== TRACKING DE SEÇÃO IA =====

        // Botão "Gerar Sugestão de Refeição"
        const generateButton = document.getElementById('generateButton');
        if (generateButton) {
            generateButton.addEventListener('click', function () {
                trackEvent('ai_recipe_generate_click', {
                    event_category: 'ai_interaction',
                    event_label: 'Generate Recipe Button'
                });
            });
        }

        // CTA "Acessar Plataforma Completa" (dentro do resultado da IA)
        // Este será rastreado dinamicamente quando o resultado for exibido
        document.addEventListener('click', function (e) {
            if (e.target.textContent.includes('Acessar Plataforma Completa')) {
                trackEvent('cta_click', {
                    cta_location: 'ai_result',
                    cta_text: 'Acessar Plataforma Completa',
                    event_category: 'conversion',
                    event_label: 'AI Result CTA'
                });
            }
        });

        // ===== TRACKING DE NAVEGAÇÃO =====

        // Links do menu
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                trackEvent('navigation_click', {
                    link_text: this.textContent.trim(),
                    link_url: this.getAttribute('href'),
                    event_category: 'navigation',
                    event_label: 'Menu Navigation'
                });
            });
        });

        // ===== TRACKING DE SCROLL DEPTH =====

        let scrollDepths = [25, 50, 75, 100];
        let scrollDepthTracked = [];

        window.addEventListener('scroll', function () {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );

            scrollDepths.forEach(function (depth) {
                if (scrollPercent >= depth && !scrollDepthTracked.includes(depth)) {
                    scrollDepthTracked.push(depth);
                    trackEvent('scroll_depth', {
                        scroll_depth: depth + '%',
                        event_category: 'engagement',
                        event_label: 'Scroll Depth: ' + depth + '%'
                    });
                }
            });
        });

        // ===== TRACKING DE LINKS SOCIAIS (Footer) =====

        const socialLinks = document.querySelectorAll('footer a');
        socialLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                trackEvent('social_click', {
                    social_network: this.textContent.trim(),
                    event_category: 'social',
                    event_label: 'Footer Social Link'
                });
            });
        });

    });
})();
