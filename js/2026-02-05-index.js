// ===== SIMPLE PASSWORD MANAGER =====
class SimplePasswordManager {
    constructor() {
        this.STORAGE_KEY = 'admin_password';
        this.AUTH_KEY = 'isAuthenticated';
        this.DEFAULT_PASSWORD = 'admin123';
        
        // Auto-setup: If no password is stored, set default
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, this.DEFAULT_PASSWORD);
        }
    }
    
    validatePassword(password) {
        const storedPassword = localStorage.getItem(this.STORAGE_KEY);
        return password === storedPassword;
    }
    
    changePassword(currentPassword, newPassword, confirmPassword) {
        if (!this.validatePassword(currentPassword)) {
            return { success: false, error: "Current password is incorrect" };
        }
        
        if (newPassword.length < 6) {
            return { success: false, error: "New password must be at least 6 characters" };
        }
        
        if (newPassword !== confirmPassword) {
            return { success: false, error: "New passwords do not match" };
        }
        
        localStorage.setItem(this.STORAGE_KEY, newPassword);
        return { success: true };
    }
    
    login(password) {
        if (this.validatePassword(password)) {
            localStorage.setItem(this.AUTH_KEY, 'true');
            return { success: true };
        }
        return { success: false, error: "Invalid password" };
    }
    
    logout() {
        localStorage.removeItem(this.AUTH_KEY);
    }
    
    isAuthenticated() {
        return localStorage.getItem(this.AUTH_KEY) === 'true';
    }
}

const passwordManager = new SimplePasswordManager();

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
        
        // Close mobile menu when clicking a link
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
        // Save preference
        localStorage.setItem('preferredLanguage', lang);
        document.documentElement.lang = lang;
        
        // Update all language elements
        document.querySelectorAll('.lang-en, .lang-de').forEach(el => {
            if (el.classList.contains(`lang-${lang}`)) {
                el.style.display = '';
                // Handle different element types
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
        
        // Update navigation text
        document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
            const text = link.getAttribute(`data-${lang}`);
            if (text) {
                link.textContent = text;
            }
        });
        
        // Update button states
        [langEnBtn, langEnMobileBtn].forEach(btn => {
            if (btn) btn.classList.toggle('active', lang === 'en');
        });
        [langDeBtn, langDeMobileBtn].forEach(btn => {
            if (btn) btn.classList.toggle('active', lang === 'de');
        });
    }
    
    // Event listeners
    if (langEnBtn) langEnBtn.addEventListener('click', () => switchLanguage('en'));
    if (langDeBtn) langDeBtn.addEventListener('click', () => switchLanguage('de'));
    if (langEnMobileBtn) langEnMobileBtn.addEventListener('click', () => switchLanguage('en'));
    if (langDeMobileBtn) langDeMobileBtn.addEventListener('click', () => switchLanguage('de'));
    
    // Initialize with saved preference
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    switchLanguage(savedLang);
}

// ===== LOGIN MODAL =====
function initLoginModal() {
    const loginModal = document.getElementById('loginModal');
    const passwordModal = document.getElementById('passwordModal');
    const loginBtn = document.getElementById('loginBtn');
    const loginClose = document.getElementById('loginClose');
    const passwordClose = document.getElementById('passwordClose');
    const loginSubmit = document.getElementById('loginSubmit');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordSubmit = document.getElementById('changePasswordSubmit');
    const loginError = document.getElementById('loginError');
    const passwordSuccess = document.getElementById('passwordSuccess');
    
    // Open login modal
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', () => {
            if (passwordManager.isAuthenticated()) {
                window.location.href = 'admin.html';
            } else {
                loginModal.classList.add('active');
                document.getElementById('passwordInput')?.focus();
            }
        });
    }
    
    // Close modals
    if (loginClose) {
        loginClose.addEventListener('click', () => {
            loginModal.classList.remove('active');
            loginError.style.display = 'none';
        });
    }
    
    if (passwordClose) {
        passwordClose.addEventListener('click', () => {
            passwordModal.classList.remove('active');
            passwordSuccess.style.display = 'none';
        });
    }
    
    // Close on backdrop click
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
            loginError.style.display = 'none';
        }
        if (e.target === passwordModal) {
            passwordModal.classList.remove('active');
            passwordSuccess.style.display = 'none';
        }
    });
    
    // Login submit
    if (loginSubmit) {
        loginSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value;
            
            if (!password) {
                loginError.style.display = 'block';
                return;
            }
            
            showLoading(true, 'Logging in...');
            
            setTimeout(() => {
                const result = passwordManager.login(password);
                
                if (result.success) {
                    loginModal.classList.remove('active');
                    showLoading(false);
                    showToast('Login successful!');
                    setTimeout(() => {
                        window.location.href = 'admin.html';
                    }, 500);
                } else {
                    showLoading(false);
                    loginError.style.display = 'block';
                }
            }, 800);
        });
    }
    
    // Change password button
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            loginModal.classList.remove('active');
            passwordModal.classList.add('active');
            document.getElementById('currentPassword')?.focus();
        });
    }
    
    // Change password submit
    if (changePasswordSubmit) {
        changePasswordSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            showLoading(true, 'Changing password...');
            
            setTimeout(() => {
                const result = passwordManager.changePassword(currentPassword, newPassword, confirmPassword);
                
                showLoading(false);
                
                if (result.success) {
                    passwordSuccess.style.display = 'block';
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                    
                    setTimeout(() => {
                        passwordModal.classList.remove('active');
                        passwordSuccess.style.display = 'none';
                        loginModal.classList.add('active');
                    }, 2000);
                } else {
                    alert(result.error);
                }
            }, 800);
        });
    }
    
    // Enter key support
    document.getElementById('passwordInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginSubmit.click();
    });
    
    ['currentPassword', 'newPassword', 'confirmPassword'].forEach(id => {
        document.getElementById(id)?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') changePasswordSubmit.click();
        });
    });
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
                
                // Update active nav
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

// ===== SCROLL REVEAL ANIMATIONS =====
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

// ===== HIDE LOADING OVERLAY =====
function hideLoadingOverlay() {
    setTimeout(() => {
        showLoading(false);
    }, 500);
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initMobileMenu();
    initLanguageSwitching();
    initLoginModal();
    initSmoothScroll();
    initActiveNavOnScroll();
    initAnimatedCounters();
    initParticles();
    initScrollReveal();
    hideLoadingOverlay();
    
    // Check if already logged in
    if (passwordManager.isAuthenticated()) {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-user-cog"></i>';
            loginBtn.title = 'Go to Admin Panel';
        }
    }
});

// ===== RESET FUNCTIONS (for debugging) =====
window.resetPasswordSystem = function() {
    localStorage.removeItem('admin_password');
    localStorage.removeItem('isAuthenticated');
    localStorage.setItem('admin_password', 'admin123');
    alert('Password reset! Use "admin123" to login.');
    location.reload();
};

window.resetLanguage = function() {
    localStorage.removeItem('preferredLanguage');
    location.reload();
};
