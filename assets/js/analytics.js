// Google Analytics 4 - Event Tracking
// Rastreia cliques em CTAs e interações importantes

(function () {
    // Verifica se o GA4 está carregado
    function trackEvent(eventName, eventParams = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventParams);
            console.log('📊 GA4 Event:', eventName, eventParams);
        } else {
            console.warn('⚠️ GA4 não carregado ainda');
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
                    button_location: 'hero',
                    button_text: 'Comece a sua evolução'
                });
            });
        }

        // CTA Header - "Acessar Agora"
        const headerCTA = document.querySelector('a[href="#download"]');
        if (headerCTA && headerCTA.textContent.includes('Acessar Agora')) {
            headerCTA.addEventListener('click', function () {
                trackEvent('cta_click', {
                    button_location: 'header',
                    button_text: 'Acessar Agora'
                });
            });
        }

        // CTA Final - "Comece a sua evolução" (final da página)
        const finalCTAs = document.querySelectorAll('a[href="#"]');
        finalCTAs.forEach(function (cta) {
            if (cta.textContent.includes('Comece a sua evolução') && cta !== heroCTA) {
                cta.addEventListener('click', function () {
                    trackEvent('cta_click', {
                        button_location: 'final_section',
                        button_text: 'Comece a sua evolução'
                    });
                });
            }
        });

        // CTA "Acessar Plataforma Completa" (dentro do resultado da IA)
        document.addEventListener('click', function (e) {
            if (e.target.textContent.includes('Acessar Plataforma Completa')) {
                trackEvent('cta_click', {
                    button_location: 'ai_result',
                    button_text: 'Acessar Plataforma Completa'
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
                    section_target: this.getAttribute('href')
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
                        depth_percentage: depth
                    });
                }
            });
        });

        // ===== TRACKING DE LINKS SOCIAIS (Footer) =====

        const socialLinks = document.querySelectorAll('footer a');
        socialLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                const linkText = this.textContent.trim().toLowerCase();
                let platform = 'other';

                if (linkText.includes('instagram')) platform = 'instagram';
                else if (linkText.includes('linkedin')) platform = 'linkedin';

                trackEvent('social_click', {
                    platform: platform
                });
            });
        });

    });
})();
