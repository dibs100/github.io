// ===== SIMPLE PASSWORD MANAGER =====
class SimplePasswordManager {
    constructor() {
        this.STORAGE_KEY = 'admin_password';
        this.AUTH_KEY = 'isAuthenticated';
        this.DEFAULT_PASSWORD = 'admin123';
        
        console.log("🔐 Password Manager initialized");
        
        // Auto-setup: If no password is stored, set default
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            console.log("⚠️ No password found. Setting default: 'admin123'");
            localStorage.setItem(this.STORAGE_KEY, this.DEFAULT_PASSWORD);
        } else {
            console.log("✅ Password found in storage");
        }
    }
    
    validatePassword(password) {
        const storedPassword = localStorage.getItem(this.STORAGE_KEY);
        console.log("🔍 Validating password:", { 
            input: password, 
            stored: storedPassword,
            match: password === storedPassword 
        });
        return password === storedPassword;
    }
    
    changePassword(currentPassword, newPassword, confirmPassword) {
        console.log("🔄 Changing password...");
        
        // Validate current password
        if (!this.validatePassword(currentPassword)) {
            console.log("❌ Current password incorrect");
            return { success: false, error: "Current password is incorrect" };
        }
        
        // Validate new password
        if (newPassword.length < 6) {
            return { success: false, error: "New password must be at least 6 characters" };
        }
        
        if (newPassword !== confirmPassword) {
            return { success: false, error: "New passwords do not match" };
        }
        
        // Store new password
        localStorage.setItem(this.STORAGE_KEY, newPassword);
        console.log("✅ Password changed successfully!");
        return { success: true };
    }
    
    login(password) {
        console.log("🔑 Attempting login...");
        
        if (this.validatePassword(password)) {
            localStorage.setItem(this.AUTH_KEY, 'true');
            console.log("✅ Login successful!");
            return { success: true };
        }
        
        console.log("❌ Login failed");
        return { success: false, error: "Invalid password" };
    }
    
    logout() {
        localStorage.removeItem(this.AUTH_KEY);
        console.log("👋 Logged out");
    }
    
    isAuthenticated() {
        return localStorage.getItem(this.AUTH_KEY) === 'true';
    }
    
    // Debug info
    debug() {
        console.log("=== PASSWORD DEBUG ===");
        console.log("Has password:", !!localStorage.getItem(this.STORAGE_KEY));
        console.log("Is authenticated:", this.isAuthenticated());
        console.log("=====================");
    }
}

// ===== GLOBAL HELPER FUNCTIONS =====
window.showLoading = function(show, text = "Loading...") {
    const overlay = document.getElementById('loadingOverlay');
    const textElement = document.getElementById('loadingText');
    
    if (overlay && textElement) {
        if (show) {
            textElement.textContent = text;
            overlay.style.display = 'flex';
        } else {
            overlay.style.display = 'none';
        }
    }
};

window.showMessage = function(type, message) {
    if (type === 'error') {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.style.display = 'block';
            // Update both language versions
            const enSpan = errorElement.querySelector('.lang-en');
            const deSpan = errorElement.querySelector('.lang-de');
            if (enSpan) enSpan.textContent = message;
            if (deSpan) deSpan.textContent = message;
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        } else {
            alert("Error: " + message);
        }
    } else {
        const successElement = document.getElementById('passwordSuccess');
        if (successElement) {
            successElement.style.display = 'block';
            // Update both language versions
            const enSpan = successElement.querySelector('.lang-en');
            const deSpan = successElement.querySelector('.lang-de');
            if (enSpan) enSpan.textContent = message;
            if (deSpan) deSpan.textContent = message;
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 5000);
        } else {
            alert("Success: " + message);
        }
    }
};

// ===== DOM ELEMENTS & PASSWORD MANAGER =====
let loginModal, loginClose, loginSubmit, loginError, passwordInput;
let passwordModal, passwordClose, changePasswordSubmit, passwordSuccess;
let currentPasswordInput, newPasswordInput, confirmPasswordInput;
let changePasswordBtn;
const passwordManager = new SimplePasswordManager();

// ===== MODAL FUNCTIONS =====
function showLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'flex';
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
        if (loginError) loginError.style.display = 'none';
    }
}

function hideLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'none';
        if (passwordInput) passwordInput.value = '';
        if (loginError) loginError.style.display = 'none';
    }
}

function showChangePasswordModal() {
    if (passwordModal) {
        passwordModal.style.display = 'flex';
        if (currentPasswordInput) {
            currentPasswordInput.value = '';
            currentPasswordInput.focus();
        }
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        if (passwordSuccess) passwordSuccess.style.display = 'none';
    }
    hideLoginModal();
}

function hideChangePasswordModal() {
    if (passwordModal) {
        passwordModal.style.display = 'none';
        if (currentPasswordInput) currentPasswordInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        if (passwordSuccess) passwordSuccess.style.display = 'none';
    }
}

// ===== EVENT HANDLERS =====
function handleLoginSubmit(e) {
    e.preventDefault();
    const password = passwordInput ? passwordInput.value.trim() : '';
    
    if (!password) {
        showMessage('error', "Please enter password");
        return;
    }
    
    showLoading(true, "Logging in...");
    
    // Small delay for UX
    setTimeout(() => {
        const result = passwordManager.login(password);
        
        if (result.success) {
            console.log("✅ Login successful, redirecting...");
            
            // Hide login modal
            hideLoginModal();
            
            // Show success and redirect
            setTimeout(() => {
                showLoading(false);
                alert("✅ Login successful! Redirecting to admin panel...");
                window.location.href = 'admin.html';
            }, 500);
            
        } else {
            showLoading(false);
            showMessage('error', result.error || "Login failed");
        }
    }, 800);
}

function handleChangePasswordSubmit(e) {
    e.preventDefault();
    
    const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : '';
    const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('error', "Please fill in all fields");
        return;
    }
    
    showLoading(true, "Changing password...");
    
    setTimeout(() => {
        const result = passwordManager.changePassword(currentPassword, newPassword, confirmPassword);
        
        if (result.success) {
            console.log("✅ Password changed successfully");
            showLoading(false);
            showMessage('success', "Password changed successfully!");
            
            // Clear form
            if (currentPasswordInput) currentPasswordInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
            
            // Auto-close after success
            setTimeout(() => {
                hideChangePasswordModal();
                showLoginModal();
            }, 2000);
            
        } else {
            showLoading(false);
            showMessage('error', result.error || "Failed to change password");
        }
    }, 800);
}

// ===== INITIALIZE FIREBASE =====
function initializeFirebase() {
    console.log("🔥 Checking Firebase...");
    
    if (typeof firebase !== 'undefined' && window.firebaseAuth) {
        console.log("✅ Firebase is available for admin use");
        localStorage.setItem('isAdmin', 'true');
    } else {
        console.log("ℹ️ Firebase not available, using local storage");
    }
}

// ===== ZABBIX BUTTON FUNCTIONALITY =====
function initializeZabbixButton() {
    const zabbixBtn = document.getElementById('zabbixBtn');
    if (zabbixBtn) {
        console.log("✅ Zabbix button found");
        zabbixBtn.addEventListener('click', () => {
            console.log("🌐 Redirecting to Zabbix website...");
            // Open in a new tab
            window.open('https://zabbix-web.5fpbvwltlg7opaq3.myfritz.net', '_blank');
        });
    } else {
        console.error("❌ Zabbix button not found!");
    }
}

// ===== IMPROVED MOBILE MENU FUNCTIONALITY =====
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = mobileNav.classList.contains('active');
            
            if (isVisible) {
                mobileNav.classList.remove('active');
                mobileNav.style.display = 'none';
            } else {
                mobileNav.classList.add('active');
                mobileNav.style.display = 'block';
            }
        });
        
        // Close mobile nav when clicking a link
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                mobileNav.style.display = 'none';
            });
        });
        
        // Close mobile nav when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileNav.classList.contains('active') && 
                !mobileNav.contains(e.target) && 
                !mobileMenuBtn.contains(e.target)) {
                mobileNav.classList.remove('active');
                mobileNav.style.display = 'none';
            }
        });
    }
}

// ===== FIXED LANGUAGE SWITCHING FUNCTION =====
function switchLanguage(lang) {
    console.log(`🌐 Switching language to: ${lang}`);
    
    // Store language preference
    localStorage.setItem('preferredLanguage', lang);
    
    // Hide all language-specific elements first
    const allLangElements = document.querySelectorAll('.lang-en, .lang-de');
    console.log(`Found ${allLangElements.length} language elements`);
    
    allLangElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // Show elements for selected language
    const selectedLangElements = document.querySelectorAll(`.lang-${lang}`);
    console.log(`Found ${selectedLangElements.length} elements for ${lang}`);
    
    selectedLangElements.forEach(el => {
        // Show the element
        el.style.display = '';
        
        // Special handling for different element types
        if (el.classList.contains('section-title') || 
            el.classList.contains('skill-card') ||
            el.classList.contains('experience-card') ||
            el.classList.contains('certification-card') ||
            el.classList.contains('profile-card') ||
            el.classList.contains('hero-text') ||
            el.classList.contains('reference-card')) {
            el.style.display = 'block';
        } else if (el.tagName === 'SPAN' || el.tagName === 'LI' || el.tagName === 'P') {
            el.style.display = 'inline';
        } else if (el.tagName === 'A') {
            el.style.display = 'inline-block';
        } else if (el.tagName === 'DIV') {
            el.style.display = 'block';
        } else if (el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4') {
            el.style.display = 'block';
        }
    });
    
    // Special handling for tags inside skill-tags
    document.querySelectorAll('.skill-tags .tag').forEach(tag => {
        if (tag.classList.contains(`lang-${lang}`)) {
            tag.style.display = 'inline-block';
        } else if (tag.classList.contains('lang-en') || tag.classList.contains('lang-de')) {
            // Hide tags that have language classes but aren't for current language
            tag.style.display = 'none';
        } else {
            // Show tags without language classes (like "Nagios", "Zabbix")
            tag.style.display = 'inline-block';
        }
    });
    
    // Update active state on buttons - DESKTOP
    const langEnBtn = document.getElementById('langEn');
    const langDeBtn = document.getElementById('langDe');
    
    if (langEnBtn && langDeBtn) {
        langEnBtn.classList.remove('active');
        langDeBtn.classList.remove('active');
        
        if (lang === 'en') {
            langEnBtn.classList.add('active');
        } else {
            langDeBtn.classList.add('active');
        }
    }
    
    // Update active state on buttons - MOBILE (from mobile-nav)
    const mobileLangEnBtn = document.getElementById('langEnMobile');
    const mobileLangDeBtn = document.getElementById('langDeMobile');
    
    if (mobileLangEnBtn && mobileLangDeBtn) {
        mobileLangEnBtn.classList.remove('active');
        mobileLangDeBtn.classList.remove('active');
        
        if (lang === 'en') {
            mobileLangEnBtn.classList.add('active');
        } else {
            mobileLangDeBtn.classList.add('active');
        }
    }
    
    // Update document language attribute for accessibility
    document.documentElement.lang = lang;
    
    // Update navigation text from data attributes
    document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
        const text = link.getAttribute(`data-${lang}`);
        if (text) {
            link.textContent = text;
        }
    });
    
    console.log(`✅ Language switched to ${lang}`);
}

// ===== INITIALIZE LANGUAGE FROM STORAGE =====
function initializeLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    console.log(`🌐 Initializing language: ${savedLang}`);
    
    // Apply language immediately
    switchLanguage(savedLang);
    
    // Set up click handlers for DESKTOP buttons
    const langEnBtn = document.getElementById('langEn');
    const langDeBtn = document.getElementById('langDe');
    
    if (langEnBtn) {
        langEnBtn.addEventListener('click', () => {
            console.log("EN button clicked");
            switchLanguage('en');
        });
    }
    
    if (langDeBtn) {
        langDeBtn.addEventListener('click', () => {
            console.log("DE button clicked");
            switchLanguage('de');
        });
    }
    
    // Set up click handlers for MOBILE buttons (from mobile navigation)
    const langEnMobileBtn = document.getElementById('langEnMobile');
    const langDeMobileBtn = document.getElementById('langDeMobile');
    
    if (langEnMobileBtn) {
        langEnMobileBtn.addEventListener('click', () => {
            console.log("Mobile EN button clicked");
            switchLanguage('en');
        });
    }
    
    if (langDeMobileBtn) {
        langDeMobileBtn.addEventListener('click', () => {
            console.log("Mobile DE button clicked");
            switchLanguage('de');
        });
    }
    
    console.log("✅ Language system initialized");
}

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, initializing...");
    
    // Debug: Show what's in storage
    console.log("=== STORAGE DEBUG ===");
    console.log("Has password:", !!localStorage.getItem('admin_password'));
    console.log("Password value:", localStorage.getItem('admin_password'));
    console.log("Is authenticated:", localStorage.getItem('isAuthenticated') === 'true');
    console.log("Preferred language:", localStorage.getItem('preferredLanguage'));
    console.log("====================");
    
    // Initialize DOM elements
    loginModal = document.getElementById('loginModal');
    loginClose = document.getElementById('loginClose');
    loginSubmit = document.getElementById('loginSubmit');
    loginError = document.getElementById('loginError');
    passwordInput = document.getElementById('passwordInput');
    
    passwordModal = document.getElementById('passwordModal');
    passwordClose = document.getElementById('passwordClose');
    changePasswordSubmit = document.getElementById('changePasswordSubmit');
    passwordSuccess = document.getElementById('passwordSuccess');
    currentPasswordInput = document.getElementById('currentPassword');
    newPasswordInput = document.getElementById('newPassword');
    confirmPasswordInput = document.getElementById('confirmPassword');
    
    changePasswordBtn = document.getElementById('changePasswordBtn');
    
    // ===== SET UP EVENT LISTENERS =====
    
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
        console.log("✅ Login button found");
    } else {
        console.error("❌ Login button not found!");
    }
    
    if (loginClose) {
        loginClose.addEventListener('click', hideLoginModal);
    }
    
    if (passwordClose) {
        passwordClose.addEventListener('click', hideChangePasswordModal);
    }
    
    if (loginSubmit) {
        loginSubmit.addEventListener('click', handleLoginSubmit);
    }
    
    if (changePasswordSubmit) {
        changePasswordSubmit.addEventListener('click', handleChangePasswordSubmit);
    }
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', showChangePasswordModal);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (loginModal && e.target === loginModal) {
            hideLoginModal();
        }
        if (passwordModal && e.target === passwordModal) {
            hideChangePasswordModal();
        }
    });
    
    // Allow Enter key to submit forms
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLoginSubmit(e);
            }
        });
    }
    
    if (currentPasswordInput && newPasswordInput && confirmPasswordInput) {
        const handleEnter = (e) => {
            if (e.key === 'Enter') {
                handleChangePasswordSubmit(e);
            }
        };
        
        currentPasswordInput.addEventListener('keypress', handleEnter);
        newPasswordInput.addEventListener('keypress', handleEnter);
        confirmPasswordInput.addEventListener('keypress', handleEnter);
    }
    
    // ===== INITIALIZE NEW FEATURES =====
    
    // Initialize Zabbix button
    initializeZabbixButton();
    
    // Initialize mobile menu with improved functionality
    initializeMobileMenu();
    
    // Initialize Firebase
    setTimeout(() => {
        initializeFirebase();
    }, 1000);
    
    // ===== INITIALIZE LANGUAGE SYSTEM =====
    initializeLanguage();
    
    // ===== SMOOTH SCROLLING =====
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a, .mobile-nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    // Close mobile menu if open
                    const mobileNav = document.getElementById('mobileNav');
                    if (mobileNav && mobileNav.classList.contains('active')) {
                        mobileNav.classList.remove('active');
                        mobileNav.style.display = 'none';
                    }
                    
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // ===== ACTIVE NAVIGATION ON SCROLL =====
    
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + 100;
        
        document.querySelectorAll('section').forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Update desktop navigation
                document.querySelectorAll('nav a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
                
                // Update mobile navigation
                document.querySelectorAll('.mobile-nav a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
    
    // ===== CHECK IF USER IS ALREADY LOGGED IN =====
    
    if (passwordManager.isAuthenticated()) {
        console.log("✅ User already logged in");
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-user-cog"></i>';
            loginBtn.title = "Go to Admin Panel";
            loginBtn.onclick = () => {
                window.location.href = 'admin.html';
            };
        }
    }
    
    console.log("✅ Initialization complete");
    
    // Debug button for testing (remove in production)
    const debugBtn = document.createElement('button');
    debugBtn.innerHTML = '🔧';
    debugBtn.style.position = 'fixed';
    debugBtn.style.bottom = '10px';
    debugBtn.style.right = '10px';
    debugBtn.style.zIndex = '9999';
    debugBtn.style.padding = '5px 10px';
    debugBtn.style.background = '#333';
    debugBtn.style.color = 'white';
    debugBtn.style.border = 'none';
    debugBtn.style.borderRadius = '5px';
    debugBtn.style.cursor = 'pointer';
    debugBtn.title = 'Debug Password System';
    
    debugBtn.addEventListener('click', () => {
        console.log("=== DEBUG INFO ===");
        passwordManager.debug();
        console.log("Preferred language:", localStorage.getItem('preferredLanguage'));
        console.log("Default password: admin123");
        console.log("Stored password:", localStorage.getItem('admin_password'));
        console.log("Number of EN elements:", document.querySelectorAll('.lang-en').length);
        console.log("Number of DE elements:", document.querySelectorAll('.lang-de').length);
        
        // Debug language switching
        console.log("Current language elements visible:");
        document.querySelectorAll('.lang-en, .lang-de').forEach(el => {
            if (el.style.display !== 'none') {
                console.log("Visible:", el.className, el.tagName, el.textContent?.substring(0, 50));
            }
        });
        
        console.log("=================");
        alert("Check console (F12) for debug info");
    });
    
    document.body.appendChild(debugBtn);
});

// ===== RESET FUNCTION (for testing) =====
// To use: In browser console, type: resetPasswordSystem()
window.resetPasswordSystem = function() {
    console.log("🔄 Resetting password system...");
    localStorage.removeItem('admin_password');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAdmin');
    
    // Set default password
    localStorage.setItem('admin_password', 'admin123');
    
    console.log("✅ Password system reset!");
    console.log("🔑 Default password: admin123");
    
    alert("Password system reset! Use 'admin123' to login.");
    location.reload();
};

// ===== RESET LANGUAGE (for testing) =====
window.resetLanguage = function() {
    console.log("🔄 Resetting language...");
    localStorage.removeItem('preferredLanguage');
    console.log("✅ Language reset to default (EN)");
    location.reload();
};
