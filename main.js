/* ===================================
   CACTUS COMUNIDAD CREATIVA
   Main JavaScript
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initParticles();
    initHeader();
    initNavigation();
    initAnimations();
    initCounters();
    initPricing();
    initPortfolio();
    initApps();
    initForm();
    initLanguageSwitcher();
    initSolutions();
    applyTranslations();
});

// ============================================
// AI PARTICLES BACKGROUND
// ============================================
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        particle.style.opacity = `${0.1 + Math.random() * 0.3}`;
        particle.style.width = `${2 + Math.random() * 4}px`;
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

// ============================================
// HEADER SCROLL EFFECT
// ============================================
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

// ============================================
// MOBILE NAVIGATION
// ============================================
function initNavigation() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
        toggle.classList.toggle('active');
    });

    // Close menu on link click
    menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            toggle.classList.remove('active');
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// ANIMATED COUNTERS
// ============================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    if (!counters.length) return;

    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
        current += step;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };

    requestAnimationFrame(updateCounter);
}

// ============================================
// PRICING TOGGLE
// ============================================
function initPricing() {
    const toggle = document.getElementById('pricingToggle');
    if (!toggle) return;

    const monthlyLabel = document.querySelector('[data-period="monthly"]');
    const annualLabel = document.querySelector('[data-period="annual"]');
    const amounts = document.querySelectorAll('.pricing-price .amount');

    toggle.addEventListener('change', () => {
        const isAnnual = toggle.checked;

        if (monthlyLabel) monthlyLabel.classList.toggle('active', !isAnnual);
        if (annualLabel) annualLabel.classList.toggle('active', isAnnual);

        amounts.forEach(amount => {
            const monthly = amount.getAttribute('data-monthly');
            const annual = amount.getAttribute('data-annual');
            if (monthly && annual) {
                amount.textContent = isAnnual ? formatPrice(annual) : formatPrice(monthly);
            }
        });
    });
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-US').format(price);
}

// ============================================
// PORTFOLIO FILTER & GRID
// ============================================
function initPortfolio() {
    const grid = document.getElementById('portfolioGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (!grid) return;

    // Render portfolio items
    renderPortfolio(grid);

    // Filter functionality
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            filterPortfolio(grid, filter);
        });
    });
}

function renderPortfolio(grid) {
    const lang = getCurrentLang();
    const portfolioItems = TRANSLATIONS[lang].portfolio.items;
    const globalPortfolio = GLOBAL_DATA.portfolio;

    grid.innerHTML = portfolioItems.map((item, index) => {
        const globalItem = globalPortfolio.find(g => g.id === item.id) || globalPortfolio[index];
        const hasUrl = globalItem.url ? true : false;
        const featuredClass = globalItem.featured ? 'featured' : '';

        return `
            <div class="portfolio-item ${featuredClass}" data-category="${globalItem.category}" data-aos="fade-up" data-aos-delay="${index * 100}" ${hasUrl ? `onclick="window.open('${globalItem.url}', '_blank')"` : ''} style="${hasUrl ? 'cursor: pointer;' : ''}">
                <img src="${globalItem.image}" alt="${item.title}" class="portfolio-image">
                <div class="portfolio-overlay">
                    <span class="portfolio-category">${capitalizeFirst(globalItem.category)}</span>
                    <h3 class="portfolio-title">${item.title}</h3>
                    <p class="portfolio-description">${item.description}</p>
                    ${hasUrl ? '<span class="portfolio-link">Ver proyecto →</span>' : ''}
                </div>
                ${globalItem.featured ? '<span class="portfolio-badge">Destacado</span>' : ''}
            </div>
        `;
    }).join('');
}

function filterPortfolio(grid, filter) {
    const items = grid.querySelectorAll('.portfolio-item');

    items.forEach(item => {
        const category = item.getAttribute('data-category');

        if (filter === 'all' || category === filter) {
            item.style.display = 'block';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
            }, 50);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.8)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// APPS SECTION
// ============================================
function initApps() {
    const grid = document.getElementById('appsGrid');
    if (!grid) return;

    renderApps(grid);
}

function renderApps(grid) {
    const lang = getCurrentLang();
    const trans = TRANSLATIONS[lang].apps;
    const globalApps = GLOBAL_DATA.apps;

    grid.innerHTML = globalApps.map((app, index) => {
        const appTrans = trans.items.find(t => t.id === app.id);
        if (!appTrans) return '';

        const isLive = app.status === 'live';
        const isBeta = app.status === 'beta';
        const isComingSoon = app.status === 'coming-soon';
        const isFree = app.price === 0;
        const hasFreeTrial = app.freeTrial > 0;

        // Status badge
        let statusBadge = '';
        if (isLive) {
            statusBadge = `<span class="app-status live">Live</span>`;
        } else if (isBeta) {
            statusBadge = `<span class="app-status beta">Beta</span>`;
        } else if (isComingSoon) {
            statusBadge = `<span class="app-status coming-soon">${trans.comingSoon}</span>`;
        }

        // Pricing display
        let priceDisplay = '';
        if (isFree) {
            priceDisplay = `<span class="app-price free">${trans.free}</span>`;
        } else {
            priceDisplay = `
                <span class="app-price">$${app.price}</span>
                <span class="app-price-details">/${trans.month}</span>
            `;
        }

        // Trial or coupon badge
        let trialBadge = '';
        if (app.hasCoupon) {
            trialBadge = `<span class="app-coupon-badge">${trans.withCoupon}: ${trans.free}</span>`;
        } else if (hasFreeTrial && !isFree) {
            trialBadge = `<span class="app-trial-badge">${app.freeTrial} ${trans.freeTrial}</span>`;
        }

        // Category
        const categoryName = trans.categories[app.category] || capitalizeFirst(app.category);

        // CTA buttons
        let ctaButtons = '';
        if (isLive && app.url) {
            ctaButtons = `
                <a href="${app.url}" target="_blank" class="btn btn-primary">${trans.viewApp}</a>
                ${hasFreeTrial && !isFree ? `<a href="${app.url}" target="_blank" class="btn btn-outline">${trans.tryFree}</a>` : ''}
            `;
        } else if (isComingSoon) {
            ctaButtons = `<a href="#contacto" class="btn btn-outline">${trans.comingSoon}</a>`;
        } else {
            ctaButtons = `<a href="${app.url || '#contacto'}" ${app.url ? 'target="_blank"' : ''} class="btn btn-outline">${trans.tryFree}</a>`;
        }

        return `
            <div class="app-card ${isComingSoon ? 'coming-soon' : ''}" data-aos="fade-up" data-aos-delay="${index * 100}" style="--app-color: ${app.color}; --app-color-bg: ${app.color}20;">
                <div class="app-header">
                    <div class="app-icon" style="background: ${app.color}20;">
                        ${app.icon}
                    </div>
                    ${statusBadge}
                </div>
                <span class="app-category">${categoryName}</span>
                <h3 class="app-name">${appTrans.name}</h3>
                <p class="app-tagline">${appTrans.tagline}</p>
                <p class="app-description">${appTrans.description}</p>
                <div class="app-pricing">
                    ${priceDisplay}
                    ${trialBadge}
                </div>
                <div class="app-cta">
                    ${ctaButtons}
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// CONTACT FORM
// ============================================
function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Here you would typically send to your backend
        // For now, we'll simulate a submission
        console.log('Form submitted:', data);

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = '<span class="btn-text">Enviando...</span>';
        submitBtn.disabled = true;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        const lang = getCurrentLang();
        const successMessage = {
            es: '¡Mensaje enviado! Te contactaremos pronto.',
            en: 'Message sent! We\'ll contact you soon.',
            pt: 'Mensagem enviada! Entraremos em contato em breve.'
        };

        submitBtn.innerHTML = `<span class="btn-text">${successMessage[lang]}</span>`;

        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            form.reset();
        }, 3000);
    });
}

// ============================================
// LANGUAGE SWITCHER
// ============================================
function initLanguageSwitcher() {
    // Create language switcher if it doesn't exist
    const nav = document.querySelector('.nav');
    if (!nav || document.querySelector('.lang-switcher')) return;

    const langSwitcher = document.createElement('div');
    langSwitcher.className = 'lang-switcher';

    langSwitcher.innerHTML = `
        <button class="lang-btn" aria-label="Cambiar idioma">
            <span class="lang-flag">${AVAILABLE_LANGUAGES[getCurrentLang()].flag}</span>
            <span class="lang-code">${getCurrentLang().toUpperCase()}</span>
        </button>
        <div class="lang-dropdown">
            ${Object.entries(AVAILABLE_LANGUAGES).map(([code, lang]) => `
                <button class="lang-option ${code === getCurrentLang() ? 'active' : ''}" data-lang="${code}">
                    <span class="lang-flag">${lang.flag}</span>
                    <span class="lang-name">${lang.name}</span>
                </button>
            `).join('')}
        </div>
    `;

    // Insert before the CTA button
    const navCta = nav.querySelector('.nav-cta');
    if (navCta) {
        nav.insertBefore(langSwitcher, navCta);
    } else {
        nav.appendChild(langSwitcher);
    }

    // Add styles for language switcher
    addLangSwitcherStyles();

    // Toggle dropdown
    const langBtn = langSwitcher.querySelector('.lang-btn');
    const langDropdown = langSwitcher.querySelector('.lang-dropdown');

    langBtn.addEventListener('click', () => {
        langDropdown.classList.toggle('open');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!langSwitcher.contains(e.target)) {
            langDropdown.classList.remove('open');
        }
    });

    // Language selection
    langSwitcher.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            setLang(lang);
            window.location.reload();
        });
    });
}

function addLangSwitcherStyles() {
    if (document.getElementById('lang-switcher-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'lang-switcher-styles';
    styles.textContent = `
        .lang-switcher {
            position: relative;
            margin-right: 16px;
        }

        .lang-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: transparent;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 13px;
            transition: all var(--transition-fast);
        }

        .lang-btn:hover {
            border-color: var(--primary);
            color: var(--text-primary);
        }

        .lang-flag {
            font-size: 16px;
        }

        .lang-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 8px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 8px;
            min-width: 150px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all var(--transition-fast);
            z-index: 100;
        }

        .lang-dropdown.open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .lang-option {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 10px 12px;
            background: transparent;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            color: var(--text-secondary);
            font-size: 13px;
            text-align: left;
            transition: all var(--transition-fast);
        }

        .lang-option:hover,
        .lang-option.active {
            background: rgba(0, 217, 255, 0.1);
            color: var(--text-primary);
        }

        .lang-option.active {
            color: var(--primary);
        }

        @media (max-width: 992px) {
            .lang-switcher {
                position: absolute;
                top: 20px;
                right: 70px;
            }
        }
    `;

    document.head.appendChild(styles);
}

// ============================================
// SOLUTIONS INTERACTION
// ============================================
function initSolutions() {
    const items = document.querySelectorAll('.solution-item');

    items.forEach(item => {
        item.addEventListener('click', () => {
            items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// ============================================
// APPLY TRANSLATIONS
// ============================================
function applyTranslations() {
    const lang = getCurrentLang();
    const trans = TRANSLATIONS[lang];

    // Update page title and meta
    document.title = trans.meta.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = trans.meta.description;

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Navigation
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');
    if (navLinks.length >= 5) {
        navLinks[0].textContent = trans.nav.services;
        navLinks[1].textContent = trans.nav.solutions;
        navLinks[2].textContent = trans.nav.apps;
        navLinks[3].textContent = trans.nav.portfolio;
        navLinks[4].textContent = trans.nav.pricing;
    }
    updateElement('.nav-cta .btn-text', trans.nav.cta);

    // Hero section
    updateElement('.hero-badge span:last-child', trans.hero.badge);
    updateElement('.hero-title .title-line:nth-child(1)', trans.hero.title.line1);
    updateElement('.hero-title .gradient-text', trans.hero.title.line2);
    updateElement('.hero-title .title-line:nth-child(3)', trans.hero.title.line3);
    updateElement('.hero-description', trans.hero.description);
    updateElement('.hero-ctas .btn-primary .btn-text', trans.hero.cta1);
    updateElement('.hero-ctas .btn-outline .btn-text', trans.hero.cta2);

    // Stats
    const stats = document.querySelectorAll('.stat');
    if (stats.length >= 3) {
        stats[0].querySelector('.stat-label').textContent = trans.hero.stats.clients;
        stats[1].querySelector('.stat-label').textContent = trans.hero.stats.projects;
        stats[2].querySelector('.stat-label').textContent = trans.hero.stats.countries;

        stats[0].querySelector('.stat-number').setAttribute('data-count', GLOBAL_DATA.stats.clients);
        stats[1].querySelector('.stat-number').setAttribute('data-count', GLOBAL_DATA.stats.projects);
        stats[2].querySelector('.stat-number').setAttribute('data-count', GLOBAL_DATA.stats.countries);
    }

    // Marquee
    updateMarquee(trans.marquee);

    // Services section
    updateElement('.services .section-tag', trans.services.tag);
    updateServicesTitle(trans.services);
    updateElement('.services .section-description', trans.services.description);

    // Update service cards
    updateServiceCards(trans.services.items, trans.services.cta);

    // Solutions section
    updateElement('.solutions .section-tag', trans.solutions.tag);
    updateSolutionsTitle(trans.solutions);
    updateElement('.solutions .section-description', trans.solutions.description);
    updateElement('.ai-title', trans.solutions.aiTitle);
    updateSolutionItems(trans.solutions.items);
    updateSolutionMetrics(trans.solutions.metrics);

    // Programs section
    updateElement('.programs .section-tag', trans.programs.tag);
    updateProgramsTitle(trans.programs);
    updateElement('.programs .section-description', trans.programs.description);
    updatePrograms(trans.programs);

    // Apps section
    updateElement('.apps .section-tag', trans.apps.tag);
    updateAppsTitle(trans.apps);
    updateElement('.apps .section-description', trans.apps.description);
    updateAppsSections(trans.apps);

    // Portfolio section
    updateElement('.portfolio .section-tag', trans.portfolio.tag);
    updatePortfolioTitle(trans.portfolio);
    updateElement('.portfolio .section-description', trans.portfolio.description);
    updatePortfolioFilters(trans.portfolio.filters);

    // Pricing section
    updateElement('.pricing .section-tag', trans.pricing.tag);
    updatePricingTitle(trans.pricing);
    updateElement('.pricing .section-description', trans.pricing.description);
    updatePricingLabels(trans.pricing);
    updatePricingCards(trans.pricing);

    // CTA section
    updateElement('.cta-title', trans.cta.title);
    updateElement('.cta-description', trans.cta.description);
    updateElement('.cta-actions .btn-primary .btn-text', trans.cta.button);
    updateElement('.cta-actions .btn-whatsapp .btn-text', trans.cta.whatsapp);

    // Contact section
    updateElement('.contact .section-tag', trans.contact.tag);
    updateContactTitle(trans.contact);
    updateElement('.contact-description', trans.contact.description);
    updateContactMethods(trans.contact.methods);
    updateContactForm(trans.contact.form);

    // Footer
    updateElement('.footer-tagline', trans.footer.tagline);
    updateElement('.footer-description', trans.footer.description);
    updateElement('.footer-links:nth-child(2) h4', trans.footer.services);
    updateElement('.footer-links:nth-child(3) h4', trans.footer.apps);
    updateElement('.footer-links:nth-child(4) h4', trans.footer.company);
    // Update "View All" link in apps footer
    const appsLinks = document.querySelectorAll('.footer-links:nth-child(3) li a');
    if (appsLinks.length >= 4 && trans.footer.viewAll) {
        appsLinks[3].textContent = trans.footer.viewAll;
    }
    updateElement('.copyright', `© ${GLOBAL_DATA.company.year} ${GLOBAL_DATA.company.name} Comunidad Creativa. ${trans.footer.copyright}`);
    updateElement('.footer-legal a:nth-child(1)', trans.footer.privacy);
    updateElement('.footer-legal a:nth-child(2)', trans.footer.terms);

    // Update chatbot if initialized
    if (window.cactusBot) {
        window.cactusBot.updateGreeting();
    }

    // Re-render portfolio with new translations
    const portfolioGrid = document.getElementById('portfolioGrid');
    if (portfolioGrid) {
        renderPortfolio(portfolioGrid);
    }

    // Re-render apps with new translations
    const appsGrid = document.getElementById('appsGrid');
    if (appsGrid) {
        renderApps(appsGrid);
    }
}

// Helper functions for translations
function updateElement(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
}

function updateMarquee(items) {
    const marqueeContents = document.querySelectorAll('.marquee-content');
    marqueeContents.forEach(content => {
        content.innerHTML = items.map(item =>
            `<span>${item}</span><span class="marquee-dot">◆</span>`
        ).join('');
    });
}

function updateServicesTitle(services) {
    const title = document.querySelector('.services .section-title');
    if (title) {
        title.innerHTML = `${services.title} <span class="gradient-text">${services.titleHighlight}</span>`;
    }
}

function updateServiceCards(items, cta) {
    const cards = document.querySelectorAll('.service-card');
    cards.forEach((card, index) => {
        if (items[index]) {
            const item = items[index];
            const titleEl = card.querySelector('.service-title');
            const descEl = card.querySelector('.service-description');
            const featuresEl = card.querySelector('.service-features');
            const linkEl = card.querySelector('.service-link span:first-child');
            const badgeEl = card.querySelector('.service-badge');

            if (titleEl) titleEl.textContent = item.title;
            if (descEl) descEl.textContent = item.description;
            if (featuresEl) {
                featuresEl.innerHTML = item.features.map(f => `<li>${f}</li>`).join('');
            }
            if (linkEl) linkEl.textContent = cta;
            if (badgeEl && item.badge) badgeEl.textContent = item.badge;
        }
    });
}

function updateSolutionsTitle(solutions) {
    const title = document.querySelector('.solutions .section-title');
    if (title) {
        title.innerHTML = `${solutions.title} <span class="gradient-text">${solutions.titleHighlight}</span> ${solutions.titleEnd || ''}`;
    }
}

function updateSolutionItems(items) {
    const solutionItems = document.querySelectorAll('.solution-item');
    solutionItems.forEach((el, index) => {
        if (items[index]) {
            const titleEl = el.querySelector('.solution-info h3');
            const descEl = el.querySelector('.solution-info p');
            if (titleEl) titleEl.textContent = items[index].title;
            if (descEl) descEl.textContent = items[index].description;
        }
    });
}

function updateSolutionMetrics(metrics) {
    const metricEls = document.querySelectorAll('.ai-metrics .metric');
    const labels = [metrics.precision, metrics.speed, metrics.active];
    metricEls.forEach((el, index) => {
        const labelEl = el.querySelector('.metric-label');
        if (labelEl && labels[index]) labelEl.textContent = labels[index];
    });
}

function updateProgramsTitle(programs) {
    const title = document.querySelector('.programs .section-title');
    if (title) {
        title.innerHTML = `${programs.title} <span class="gradient-text">${programs.titleHighlight}</span>`;
    }
}

function updatePrograms(programs) {
    // ROWI
    const rowiCard = document.querySelector('.program-card:first-child');
    if (rowiCard) {
        updateElement('.program-card:first-child .program-badge', programs.rowi.badge);
        updateElement('.program-card:first-child .program-title', programs.rowi.title);
        updateElement('.program-card:first-child .program-description', programs.rowi.description);
        const features = rowiCard.querySelector('.program-features');
        if (features) {
            features.innerHTML = programs.rowi.features.map(f =>
                `<li><span class="feature-icon">✓</span><span>${f}</span></li>`
            ).join('');
        }
        updateElement('.program-card:first-child .btn', programs.demoCta);
    }

    // SCA
    const scaCard = document.querySelector('.program-card:last-child');
    if (scaCard) {
        updateElement('.program-card:last-child .program-badge', programs.sca.badge);
        updateElement('.program-card:last-child .program-title', programs.sca.title);
        updateElement('.program-card:last-child .program-description', programs.sca.description);
        const features = scaCard.querySelector('.program-features');
        if (features) {
            features.innerHTML = programs.sca.features.map(f =>
                `<li><span class="feature-icon">✓</span><span>${f}</span></li>`
            ).join('');
        }
        updateElement('.program-card:last-child .btn', programs.demoCta);
    }

    // Lab
    updateElement('.lab-title', programs.lab.title);
    updateElement('.lab-description', programs.lab.description);
    const labServices = document.querySelector('.lab-services');
    if (labServices) {
        labServices.innerHTML = programs.lab.tags.map(tag =>
            `<span class="lab-tag">${tag}</span>`
        ).join('');
    }
}

function updateAppsTitle(apps) {
    const title = document.querySelector('.apps .section-title');
    if (title) {
        title.innerHTML = `${apps.title} <span class="gradient-text">${apps.titleHighlight}</span>`;
    }
}

function updateAppsSections(apps) {
    // Coming soon section
    const comingSoonSection = document.querySelector('.apps-coming-soon');
    if (comingSoonSection) {
        updateElement('.coming-soon-icon', apps.comingSoonSection.icon);
        updateElement('.coming-soon-title', apps.comingSoonSection.title);
        updateElement('.coming-soon-description', apps.comingSoonSection.description);
        updateElement('.coming-soon-cta .btn', apps.comingSoonSection.cta);
    }
}

function updatePortfolioTitle(portfolio) {
    const title = document.querySelector('.portfolio .section-title');
    if (title) {
        title.innerHTML = `${portfolio.title} <span class="gradient-text">${portfolio.titleHighlight}</span>`;
    }
}

function updatePortfolioFilters(filters) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const filterMap = ['all', 'social', 'automation', 'content', 'strategy'];
    filterBtns.forEach((btn, index) => {
        const key = filterMap[index];
        if (filters[key]) {
            btn.textContent = filters[key];
        }
    });
}

function updatePricingTitle(pricing) {
    const title = document.querySelector('.pricing .section-title');
    if (title) {
        title.innerHTML = `${pricing.title} <span class="gradient-text">${pricing.titleHighlight}</span>`;
    }
}

function updatePricingLabels(pricing) {
    updateElement('[data-period="monthly"]', pricing.monthly);
    const annualLabel = document.querySelector('[data-period="annual"]');
    if (annualLabel) {
        annualLabel.innerHTML = `${pricing.annual} <span class="save-badge">${pricing.saveBadge}</span>`;
    }
}

function updatePricingCards(pricing) {
    const cards = document.querySelectorAll('.pricing-card');
    const planKeys = ['starter', 'growth', 'scale', 'enterprise'];

    cards.forEach((card, index) => {
        const planKey = planKeys[index];
        const plan = pricing.plans[planKey];
        if (!plan) return;

        updateElement(`.pricing-card:nth-child(${index + 1}) .pricing-name`, plan.name);
        updateElement(`.pricing-card:nth-child(${index + 1}) .pricing-description`, plan.description);

        // Update badge if exists
        const badge = card.querySelector('.pricing-badge');
        if (badge && plan.badge) {
            badge.textContent = plan.badge;
        }

        // Update features
        const featuresEl = card.querySelector('.pricing-features');
        if (featuresEl && plan.features) {
            // Get feature states from data.js
            const globalPricing = GLOBAL_DATA.pricing;
            const priceKey = planKey;

            featuresEl.innerHTML = plan.features.map((feature, fIndex) => {
                // Determine if feature is included (first 5 for starter, all for others)
                const isIncluded = planKey === 'starter' ? fIndex < 5 : true;
                const icon = isIncluded ? '✓' : '✕';
                const className = isIncluded ? '' : 'disabled';

                return `<li class="${className}"><span class="${isIncluded ? 'check' : 'x'}">${icon}</span> ${feature}</li>`;
            }).join('');
        }

        // Update CTA
        const cta = card.querySelector('.btn');
        if (cta) {
            cta.textContent = planKey === 'enterprise' ? pricing.ctaEnterprise : pricing.cta;
        }

        // Update period text
        const periodEl = card.querySelector('.period');
        if (periodEl) {
            periodEl.textContent = pricing.perMonth;
        }

        // Update custom price text
        const customText = card.querySelector('.custom-text');
        if (customText) {
            customText.textContent = pricing.custom;
        }
    });
}

function updateContactTitle(contact) {
    const title = document.querySelector('.contact .section-title');
    if (title) {
        title.innerHTML = `${contact.title} <span class="gradient-text">${contact.titleHighlight}</span>`;
    }
}

function updateContactMethods(methods) {
    const methodEls = document.querySelectorAll('.contact-method');

    if (methodEls[0]) {
        updateElement('.contact-method:nth-child(1) .method-label', methods.email);
    }
    if (methodEls[1]) {
        updateElement('.contact-method:nth-child(2) .method-label', methods.whatsapp);
    }
    if (methodEls[2]) {
        updateElement('.contact-method:nth-child(3) .method-label', methods.location);
        updateElement('.contact-method:nth-child(3) .method-value', methods.locationValue);
    }
}

function updateContactForm(form) {
    // Labels
    document.querySelectorAll('.form-group label').forEach(label => {
        const forAttr = label.getAttribute('for');
        if (form[forAttr]) {
            label.textContent = form[forAttr];
        }
    });

    // Placeholders
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const companyInput = document.getElementById('company');
    const messageInput = document.getElementById('message');

    if (nameInput) nameInput.placeholder = form.namePlaceholder;
    if (emailInput) emailInput.placeholder = form.emailPlaceholder;
    if (companyInput) companyInput.placeholder = form.companyPlaceholder;
    if (messageInput) messageInput.placeholder = form.messagePlaceholder;

    // Service select
    const serviceSelect = document.getElementById('service');
    if (serviceSelect) {
        serviceSelect.innerHTML = `<option value="">${form.servicePlaceholder}</option>` +
            form.services.map(s => `<option value="${s.value}">${s.label}</option>`).join('');
    }

    // Budget select
    const budgetSelect = document.getElementById('budget');
    if (budgetSelect) {
        budgetSelect.innerHTML = `<option value="">${form.budgetPlaceholder}</option>` +
            form.budgets.map(b => `<option value="${b.value}">${b.label}</option>`).join('');
    }

    // Submit button
    updateElement('.contact-form .btn .btn-text', form.submit);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
