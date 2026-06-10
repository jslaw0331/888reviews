// A simple helper function to load remote HTML efficiently
async function loadComponent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        return await response.text();
    } catch (e) {
        console.error(e);
        return `<div style="color:red; padding:20px; text-align:center; border: 1px dashed red;">Error loading ${url}.<br><br>Run <code>npm start</code> in the project folder and open <code>http://localhost:3000</code> (not file://).<br>Or use Live Server / <code>python -m http.server</code>.</div>`;
    }
}

class SiteHeader extends HTMLElement {
    async connectedCallback() {
        this.innerHTML = await loadComponent('/components/header.html');
        
        // Active nav: match hub pages and detail routes (/bonus/:slug → Bonuses, etc.)
        const currentPath = window.location.pathname;
        const navMatchers = {
            '/': (p) => p === '/' || p === '/index.html',
            '/casinos': (p) => /^\/(casinos|casino|review)(\/|$)/.test(p),
            '/slots': (p) => /^\/(slots|slot)(\/|$)/.test(p),
            '/providers': (p) => /^\/(providers|provider)(\/|$)/.test(p),
            '/bonuses': (p) => /^\/(bonuses|bonus)(\/|$)/.test(p),
            '/guides': (p) => /^\/(guides|guide)(\/|$)/.test(p),
            '/news': (p) => /^\/news(\/|$)/.test(p),
        };
        const isNavLinkActive = (href) => {
            if (!href || href === '#') return false;
            const match = navMatchers[href];
            return match ? match(currentPath) : currentPath === href || currentPath.startsWith(`${href}/`);
        };
        const links = this.querySelectorAll('.main-nav a');

        links.forEach((link) => {
            if (link.classList.contains('mobile-nav-cta')) return;
            const href = link.getAttribute('href');
            const active = isNavLinkActive(href);
            link.classList.toggle('active', active);
            if (active) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: this });

        // Add scroll shadow logic
        const headerEl = this.querySelector('#main-header');
        if(headerEl) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 10) {
                    headerEl.classList.add('scrolled');
                } else {
                    headerEl.classList.remove('scrolled');
                }
            });
        }
        
        // Mobile: full-screen panel slides in from the right; close + Escape
        const mobileMenuBtn = this.querySelector('#mobile-menu-btn');
        const mobileMenuClose = this.querySelector('#mobile-menu-close');
        const mainNav = this.querySelector('#main-nav');

        let menuScrollLockY = null;

        /** Match overlay height to the *visible* viewport (fixes cut-off when URL bar shows/hides or body is fixed). */
        const syncAppViewportHeight = () => {
            const vv = window.visualViewport;
            const h = vv ? vv.height : window.innerHeight;
            document.documentElement.style.setProperty('--app-vh', `${Math.round(h)}px`);
        };
        syncAppViewportHeight();
        window.addEventListener('resize', syncAppViewportHeight);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', syncAppViewportHeight);
            window.visualViewport.addEventListener('scroll', syncAppViewportHeight);
        }

        const setMobileMenuOpen = (open) => {
            document.body.classList.toggle('mobile-menu-open', open);
            document.documentElement.classList.toggle('mobile-menu-open', open);
            if (mobileMenuBtn) {
                mobileMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
                mobileMenuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            }
            /* Lock scroll on small screens only; restore position after opening mid-page */
            if (open) {
                syncAppViewportHeight();
                window.requestAnimationFrame(syncAppViewportHeight);
                const mobile = window.matchMedia('(max-width: 1024px)').matches;
                menuScrollLockY = mobile ? window.scrollY || window.pageYOffset || 0 : null;
                if (menuScrollLockY !== null) {
                    document.body.style.position = 'fixed';
                    document.body.style.top = `-${menuScrollLockY}px`;
                    document.body.style.left = '0';
                    document.body.style.right = '0';
                    document.body.style.width = '100%';
                }
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
                document.documentElement.style.touchAction = 'none';
            } else {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.left = '';
                document.body.style.right = '';
                document.body.style.width = '';
                document.documentElement.style.touchAction = '';
                if (menuScrollLockY !== null) {
                    window.scrollTo(0, menuScrollLockY);
                    menuScrollLockY = null;
                }
                syncAppViewportHeight();
            }
        };

        const closeMobileMenu = () => setMobileMenuOpen(false);

        const onDocumentKeydown = (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('mobile-menu-open')) {
                closeMobileMenu();
            }
        };

        if (mobileMenuBtn && mainNav) {
            mobileMenuBtn.addEventListener('click', () => {
                setMobileMenuOpen(!document.body.classList.contains('mobile-menu-open'));
            });
        }
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', closeMobileMenu);
        }
        if (mainNav) {
            mainNav.querySelectorAll('a[href]').forEach((a) => {
                a.addEventListener('click', () => {
                    if (window.matchMedia('(max-width: 1024px)').matches) closeMobileMenu();
                });
            });
        }
        document.addEventListener('keydown', onDocumentKeydown);

        window.addEventListener('resize', () => {
            if (window.matchMedia('(min-width: 1025px)').matches) closeMobileMenu();
        });
    }
}
customElements.define('site-header', SiteHeader);


class SiteFooter extends HTMLElement {
    async connectedCallback() {
        let html = await loadComponent('/components/footer.html');
        
        // Dynamic year injection
        const year = new Date().getFullYear();
        html = html.replace('${year}', year);
        
        this.innerHTML = html;
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: this });

        document.dispatchEvent(
            new CustomEvent('site-footer-loaded', { bubbles: true, composed: true, detail: { root: this } }),
        );

        // Scroll to Top Logic
        const scrollToTopBtn = this.querySelector('#scrollToTopBtn');
        if (scrollToTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 400) {
                    scrollToTopBtn.classList.add('visible');
                } else {
                    scrollToTopBtn.classList.remove('visible');
                }
            });

            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }
}
customElements.define('site-footer', SiteFooter);


class SiteSidebar extends HTMLElement {
    async connectedCallback() {
        this.innerHTML = await loadComponent('/components/sidebar.html');
        
        // Initialize Lucide icons automatically
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: this });
    }
}
customElements.define('site-sidebar', SiteSidebar);
