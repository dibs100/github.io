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
            errorElement.querySelector('.lang-en').textContent = message;
            errorElement.querySelector('.lang-de').textContent = message;
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
            successElement.querySelector('.lang-en').textContent = message;
            successElement.querySelector('.lang-de').textContent = message;
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

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, initializing...");
    
    // Debug: Show what's in storage
    console.log("=== STORAGE DEBUG ===");
    console.log("Has password:", !!localStorage.getItem('admin_password'));
    console.log("Password value:", localStorage.getItem('admin_password'));
    console.log("Is authenticated:", localStorage.getItem('isAuthenticated') === 'true');
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
    
    // Set up event listeners
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
    
    // Initialize Firebase
    setTimeout(() => {
        initializeFirebase();
    }, 1000);
    
    // ===== EXISTING LANGUAGE & NAVIGATION CODE =====
    // Language switcher
    const langEnBtn = document.getElementById('langEn');
    const langDeBtn = document.getElementById('langDe');
    const langEnMobile = document.getElementById('langEnMobile');
    const langDeMobile = document.getElementById('langDeMobile');
    
    function switchLanguage(lang) {
        // Hide all language-specific elements
        document.querySelectorAll('.lang-en, .lang-de').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show elements for selected language
        document.querySelectorAll(`.lang-${lang}`).forEach(el => {
            el.style.display = '';
        });
        
        // Update active state on buttons
        [langEnBtn, langDeBtn, langEnMobile, langDeMobile].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        if (lang === 'en') {
            if (langEnBtn) langEnBtn.classList.add('active');
            if (langEnMobile) langEnMobile.classList.add('active');
        } else {
            if (langDeBtn) langDeBtn.classList.add('active');
            if (langDeMobile) langDeMobile.classList.add('active');
        }
    }
    
    if (langEnBtn) langEnBtn.addEventListener('click', () => switchLanguage('en'));
    if (langDeBtn) langDeBtn.addEventListener('click', () => switchLanguage('de'));
    if (langEnMobile) langEnMobile.addEventListener('click', () => switchLanguage('en'));
    if (langDeMobile) langDeMobile.addEventListener('click', () => switchLanguage('de'));
    
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.style.display = mobileNav.style.display === 'block' ? 'none' : 'block';
        });
        
        // Close mobile nav when clicking a link
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.style.display = 'none';
            });
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a, .mobile-nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Active navigation link on scroll
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        
        document.querySelectorAll('section').forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('nav a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
    
    // Check if user is already logged in
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
        console.log("Default password: admin123");
        console.log("Stored password:", localStorage.getItem('admin_password'));
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
