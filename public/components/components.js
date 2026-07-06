// A simple helper function to load remote HTML efficiently
async function loadComponent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        return await response.text();
    } catch (e) {
        console.error(e);
        return `<div style="color:#64748b; padding:20px; text-align:center;">Nothing to show here yet. Check back soon.</div>`;
    }
}

const NAV_MATCHERS = {
    '/': (p) => p === '/' || p === '/index.html' || p === '/malaysia' || p === '/malaysia/',
    '/live': (p) => p === '/live' || p.startsWith('/live/'),
    '/bonus': (p) => /^\/(bonus|bonuses)(\/|$)/.test(p),
    '/mobile': (p) => p === '/mobile' || p.startsWith('/mobile/'),
    '/slots': (p) => /^\/(slots|slot)(\/|$)/.test(p),
    '/blackjack': (p) => p === '/blackjack' || p.includes('blackjack'),
    '/roulette': (p) => p === '/roulette' || p.includes('roulette'),
    '/baccarat': (p) => p === '/baccarat' || p.includes('baccarat'),
    '/ewallet': (p) => p === '/ewallet' || p.startsWith('/ewallet/') || p.startsWith('/malaysia/ewallet'),
    '/reviews': (p) => /^\/(reviews|review)(\/|$)/.test(p),
    '/about': (p) => p === '/about',
    '/guides': (p) => /^\/(guides|guide)(\/|$)/.test(p),
    '/news': (p) => /^\/news(\/|$)/.test(p),
};

function isNavLinkActive(href, currentPath = window.location.pathname) {
    if (!href || href === '#') return false;
    const match = NAV_MATCHERS[href];
    return match ? match(currentPath) : currentPath === href || currentPath.startsWith(`${href}/`);
}

function applyMainNavActiveState(root) {
    const currentPath = window.location.pathname;
    root.querySelectorAll('.main-nav a').forEach((link) => {
        if (link.classList.contains('mobile-nav-cta')) return;
        const href = link.getAttribute('href');
        const active = isNavLinkActive(href, currentPath);
        link.classList.toggle('active', active);
        if (active) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });

    root.querySelectorAll('.main-nav__item--dropdown').forEach((item) => {
        const childActive = [...item.querySelectorAll('.main-nav__dropdown a')].some((link) =>
            isNavLinkActive(link.getAttribute('href'), currentPath),
        );
        item.classList.toggle('active', childActive);
    });
}

function initMainNavDropdownHover(root) {
    const items = root.querySelectorAll('.main-nav__item--dropdown');
    if (!items.length) return;

    const desktopNavMq = window.matchMedia('(min-width: 1025px)');
    let closeTimer = null;

    const setOpen = (item, open) => {
        item.classList.toggle('is-open', open);
        const trigger = item.querySelector('.main-nav__dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    const closeAll = (except) => {
        items.forEach((item) => {
            if (item !== except) setOpen(item, false);
        });
    };

    items.forEach((item) => {
        item.addEventListener('mouseenter', () => {
            if (!desktopNavMq.matches) return;
            clearTimeout(closeTimer);
            closeAll(item);
            setOpen(item, true);
        });

        item.addEventListener('mouseleave', () => {
            if (!desktopNavMq.matches) return;
            closeTimer = window.setTimeout(() => setOpen(item, false), 140);
        });
    });

    document.addEventListener('click', (e) => {
        if (!desktopNavMq.matches) return;
        if (!root.contains(e.target)) closeAll();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && desktopNavMq.matches) closeAll();
    });
}

function initSiteHeaderChrome(root) {
    if (!root || root.dataset.headerBound === 'true') return;
    root.dataset.headerBound = 'true';

    applyMainNavActiveState(root);

    root.querySelectorAll('.main-nav__dropdown-trigger').forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
            const item = trigger.closest('.main-nav__item--dropdown');
            const desktopNav = window.matchMedia('(min-width: 1025px)').matches;
            if (desktopNav) {
                e.preventDefault();
            }
            const open = !item.classList.contains('is-open');
            root.querySelectorAll('.main-nav__item--dropdown').forEach((other) => {
                if (other !== item) {
                    other.classList.remove('is-open');
                    const otherTrigger = other.querySelector('.main-nav__dropdown-trigger');
                    if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
                }
            });
            item.classList.toggle('is-open', open);
            trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    });

    initMainNavDropdownHover(root);

    if (typeof lucide !== 'undefined') lucide.createIcons({ root });

    const headerEl = root.querySelector('#main-header');
    if (headerEl && !headerEl.dataset.scrollBound) {
        headerEl.dataset.scrollBound = 'true';
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                headerEl.classList.add('scrolled');
            } else {
                headerEl.classList.remove('scrolled');
            }
        });
    }

    const mobileMenuBtn = root.querySelector('#mobile-menu-btn');
    const mobileMenuClose = root.querySelector('#mobile-menu-close');
    const mainNav = root.querySelector('#main-nav');

    let menuScrollLockY = null;
    let menuCloseTimer = null;
    let menuSlideOutEnd = null;
    const MOBILE_MENU_SLIDE_MS = 280;

    const syncAppViewportHeight = () => {
        const vv = window.visualViewport;
        const h = vv ? vv.height : window.innerHeight;
        document.documentElement.style.setProperty('--app-vh', `${Math.round(h)}px`);
    };

    if (!document.documentElement.dataset.appVhBound) {
        document.documentElement.dataset.appVhBound = 'true';
        syncAppViewportHeight();
        window.addEventListener('resize', syncAppViewportHeight);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', syncAppViewportHeight);
            window.visualViewport.addEventListener('scroll', syncAppViewportHeight);
        }
    }

    const unlockMenuScroll = () => {
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
    };

    const lockMenuScroll = () => {
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
    };

    const cancelMobileMenuClose = () => {
        if (menuCloseTimer) {
            clearTimeout(menuCloseTimer);
            menuCloseTimer = null;
        }
        if (mainNav && menuSlideOutEnd) {
            mainNav.removeEventListener('transitionend', menuSlideOutEnd);
            menuSlideOutEnd = null;
        }
    };

    const finishMobileMenuClose = () => {
        cancelMobileMenuClose();
        if (mainNav) mainNav.classList.remove('is-slide-in');
        document.body.classList.remove('mobile-menu-open');
        document.documentElement.classList.remove('mobile-menu-open');
        unlockMenuScroll();
    };

    const setMobileMenuOpen = (open, { instant = false } = {}) => {
        cancelMobileMenuClose();

        const mobile = window.matchMedia('(max-width: 1024px)').matches;

        if (mobileMenuBtn) {
            mobileMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            mobileMenuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        }

        if (open) {
            document.body.classList.add('mobile-menu-open');
            document.documentElement.classList.add('mobile-menu-open');
            lockMenuScroll();
            if (mainNav && mobile) {
                mainNav.classList.remove('is-slide-in');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        mainNav.classList.add('is-slide-in');
                    });
                });
            } else if (mainNav) {
                mainNav.classList.add('is-slide-in');
            }
            return;
        }

        if (!mainNav || !mobile || instant) {
            finishMobileMenuClose();
            return;
        }

        mainNav.classList.remove('is-slide-in');
        menuSlideOutEnd = (e) => {
            if (e.target !== mainNav || e.propertyName !== 'transform') return;
            finishMobileMenuClose();
        };
        mainNav.addEventListener('transitionend', menuSlideOutEnd);
        menuCloseTimer = setTimeout(finishMobileMenuClose, MOBILE_MENU_SLIDE_MS + 50);
    };

    const closeMobileMenu = (instant = false) => setMobileMenuOpen(false, { instant });

    if (!document.documentElement.dataset.mobileMenuKeyBound) {
        document.documentElement.dataset.mobileMenuKeyBound = 'true';
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('mobile-menu-open')) {
                closeMobileMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (window.matchMedia('(min-width: 1025px)').matches) closeMobileMenu(true);
        });
    }

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
}

class SiteHeader extends HTMLElement {
    async connectedCallback() {
        this.innerHTML = await loadComponent('/components/header.html');
        initSiteHeaderChrome(this);
    }
}
customElements.define('site-header', SiteHeader);


class SiteFooter extends HTMLElement {
    async connectedCallback() {
        let html = await loadComponent('/components/footer.html');
        this.innerHTML = html;
        initFooterChrome(this);
        document.dispatchEvent(
            new CustomEvent('site-footer-loaded', { bubbles: true, composed: true, detail: { root: this } }),
        );
    }
}

function initFooterChrome(root = document) {
    const scope = root instanceof Document ? root : root;
    const year = new Date().getFullYear();

    scope.querySelectorAll('.footer-year').forEach((el) => {
        el.textContent = String(year);
    });

    scope.querySelectorAll('.fbl-copyright').forEach((el) => {
        el.innerHTML = el.innerHTML.replace(/\$\{year\}/g, String(year));
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons({ root: scope instanceof Document ? document : scope });
    }

    const scrollToTopBtn = scope.querySelector('#scrollToTopBtn');
    if (scrollToTopBtn && !scrollToTopBtn.dataset.bound) {
        scrollToTopBtn.dataset.bound = 'true';
        window.addEventListener('scroll', () => {
            scrollToTopBtn.classList.toggle('visible', window.scrollY > 400);
        });
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.site-header-inlined').forEach((el) => {
        initSiteHeaderChrome(el);
    });
    if (document.querySelector('.site-footer-inlined')) {
        initFooterChrome(document);
    }
});

customElements.define('site-footer', SiteFooter);

class SiteTrustBand extends HTMLElement {
    async connectedCallback() {
        this.innerHTML = await loadComponent('/components/trust-band.html');
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: this });
    }
}
customElements.define('site-trust-band', SiteTrustBand);


class SiteSidebar extends HTMLElement {
    async connectedCallback() {
        this.innerHTML = await loadComponent('/components/sidebar.html');

        if (typeof lucide !== 'undefined') lucide.createIcons({ root: this });
    }
}
customElements.define('site-sidebar', SiteSidebar);
