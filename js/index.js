// ===== UTILITY FUNCTIONS =====
function showLoading(show, text = "Loading...") {
    const overlay = document.getElementById('loadingOverlay');
    const textElement = document.getElementById('loadingText');
    
    if (overlay && textElement) {
        if (show) {
            textElement.textContent = text;
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy');
    });
}

// ===== HEADER SCROLL EFFECT =====
function initHeaderScroll() {
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });
}

// ===== MOBILE MENU =====
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            });
        });
    }
}

// ===== LANGUAGE SWITCHING =====
function initLanguageSwitching() {
    const langEnBtn = document.getElementById('langEn');
    const langDeBtn = document.getElementById('langDe');
    const langEnMobileBtn = document.getElementById('langEnMobile');
    const langDeMobileBtn = document.getElementById('langDeMobile');
    
    function switchLanguage(lang) {
        localStorage.setItem('preferredLanguage', lang);
        document.documentElement.lang = lang;
        
        document.querySelectorAll('.lang-en, .lang-de').forEach(el => {
            if (el.classList.contains(`lang-${lang}`)) {
                el.style.display = '';
                if (el.tagName === 'SPAN' || el.tagName === 'A' || el.tagName === 'BUTTON') {
                    el.style.display = 'inline-flex';
                } else if (el.tagName === 'LI') {
                    el.style.display = 'flex';
                } else {
                    el.style.display = 'block';
                }
            } else {
                el.style.display = 'none';
            }
        });
        
        document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
            const text = link.getAttribute(`data-${lang}`);
            if (text) {
                link.textContent = text;
            }
        });
        
        [langEnBtn, langEnMobileBtn].forEach(btn => {
            if (btn) btn.classList.toggle('active', lang === 'en');
        });
        [langDeBtn, langDeMobileBtn].forEach(btn => {
            if (btn) btn.classList.toggle('active', lang === 'de');
        });
    }
    
    if (langEnBtn) langEnBtn.addEventListener('click', () => switchLanguage('en'));
    if (langDeBtn) langDeBtn.addEventListener('click', () => switchLanguage('de'));
    if (langEnMobileBtn) langEnMobileBtn.addEventListener('click', () => switchLanguage('en'));
    if (langDeMobileBtn) langDeMobileBtn.addEventListener('click', () => switchLanguage('de'));
    
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    switchLanguage(savedLang);
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
                    link.classList.remove('active');
                });
                document.querySelectorAll(`nav a[href="${targetId}"], .mobile-nav a[href="${targetId}"]`).forEach(link => {
                    link.classList.add('active');
                });
            }
        });
    });
}

// ===== ACTIVE NAV ON SCROLL =====
function initActiveNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, { passive: true });
}

// ===== ANIMATED COUNTER =====
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200;
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const count = parseInt(counter.innerText);
        const inc = target / speed;
        
        if (count < target) {
            counter.innerText = Math.ceil(count + inc);
            setTimeout(() => animateCounter(counter), 20);
        } else {
            counter.innerText = target;
        }
    };
    
    const observerOptions = {
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                animateCounter(counter);
                observer.unobserve(counter);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => observer.observe(counter));
}

// ===== PARTICLES =====
function initParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        container.appendChild(particle);
    }
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.expertise-card, .timeline-item, .cert-card, .reference-card, .contact-card');
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                revealObserver.unobserve(entry.target);
            }
        });
    }, revealOptions);
    
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        revealObserver.observe(el);
    });
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initMobileMenu();
    initLanguageSwitching();
    initSmoothScroll();
    initActiveNavOnScroll();
    initAnimatedCounters();
    initParticles();
    initScrollReveal();
    
    setTimeout(() => {
        showLoading(false);
    }, 500);
});
