// ===== PASSWORD MANAGER =====
class PasswordManager {
    constructor() {
        this.STORAGE_KEY = 'admin_password_hash';
        this.AUTH_KEY = 'isAuthenticated';
        this.DEFAULT_PASSWORD = 'admin123'; // Default password for first-time setup
    }
    
    // Hash password for storage (simple XOR encryption)
    hashPassword(password) {
        const key = 'dibesh-portfolio-secure-key';
        let result = '';
        for (let i = 0; i < password.length; i++) {
            const charCode = password.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result);
    }
    
    // Check if password matches stored hash
    validatePassword(password) {
        const storedHash = localStorage.getItem(this.STORAGE_KEY);
        
        // If no password is set yet, use default
        if (!storedHash) {
            return password === this.DEFAULT_PASSWORD;
        }
        
        const inputHash = this.hashPassword(password);
        return inputHash === storedHash;
    }
    
    // Change password
    changePassword(currentPassword, newPassword, confirmPassword) {
        // Validate current password
        if (!this.validatePassword(currentPassword)) {
            return { success: false, error: "Current password is incorrect" };
        }
        
        // Validate new password
        if (newPassword.length < 6) {
            return { success: false, error: "New password must be at least 6 characters" };
        }
        
        if (newPassword !== confirmPassword) {
            return { success: false, error: "New passwords do not match" };
        }
        
        // Store new password hash
        const newHash = this.hashPassword(newPassword);
        localStorage.setItem(this.STORAGE_KEY, newHash);
        
        return { success: true };
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        return localStorage.getItem(this.AUTH_KEY) === 'true';
    }
    
    // Login
    login(password) {
        if (this.validatePassword(password)) {
            localStorage.setItem(this.AUTH_KEY, 'true');
            return { success: true };
        }
        return { success: false, error: "Invalid password" };
    }
    
    // Logout
    logout() {
        localStorage.removeItem(this.AUTH_KEY);
    }
}

// ===== GLOBAL HELPER FUNCTIONS =====
window.showLoading = function(show, text = "Loading...") {
    const overlay = document.getElementById('loadingOverlay');
    const textElement = document.getElementById('loadingText');
    
    if (overlay && textElement) {
        overlay.style.display = show ? 'flex' : 'none';
        textElement.textContent = text;
    }
};

window.showError = function(message) {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.style.display = 'block';
        errorElement.querySelector('.lang-en').textContent = message;
        errorElement.querySelector('.lang-de').textContent = message;
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
};

window.showSuccess = function(message) {
    const successElement = document.getElementById('passwordSuccess');
    if (successElement) {
        successElement.style.display = 'block';
        successElement.querySelector('.lang-en').textContent = message;
        successElement.querySelector('.lang-de').textContent = message;
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    }
};

// ===== DOM ELEMENTS & PASSWORD MANAGER =====
let loginModal, loginClose, loginSubmit, loginError, passwordInput;
let passwordModal, passwordClose, changePasswordSubmit, passwordSuccess;
let currentPasswordInput, newPasswordInput, confirmPasswordInput;
let changePasswordBtn;
const passwordManager = new PasswordManager();

// ===== MODAL FUNCTIONS =====
function showLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'flex';
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
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
        showError("Please enter password");
        return;
    }
    
    showLoading(true, "Logging in...");
    
    // Simulate network delay
    setTimeout(() => {
        const result = passwordManager.login(password);
        
        if (result.success) {
            console.log("✅ Login successful");
            
            // Hide login modal
            hideLoginModal();
            
            // Show success message
            setTimeout(() => {
                alert("Login successful! Redirecting to admin panel...");
                window.location.href = 'admin.html';
            }, 500);
            
        } else {
            showError(result.error || "Login failed");
        }
        
        showLoading(false);
    }, 1000);
}

function handleChangePasswordSubmit(e) {
    e.preventDefault();
    
    const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : '';
    const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showError("Please fill in all fields");
        return;
    }
    
    showLoading(true, "Changing password...");
    
    // Simulate network delay
    setTimeout(() => {
        const result = passwordManager.changePassword(currentPassword, newPassword, confirmPassword);
        
        if (result.success) {
            console.log("✅ Password changed successfully");
            showSuccess("Password changed successfully!");
            
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
            showError(result.error || "Failed to change password");
        }
        
        showLoading(false);
    }, 1000);
}

// ===== INITIALIZE FIREBASE AUTH =====
// This ensures Firebase is ready for admin page
function initializeFirebaseForAdmin() {
    console.log("🔥 Initializing Firebase for admin access...");
    
    // Check if Firebase is available
    if (typeof firebase !== 'undefined' && window.firebaseAuth) {
        // Create a single admin user for Firestore access
        // This allows using Firestore without individual user accounts
        
        // Store admin flag
        localStorage.setItem('isAdmin', 'true');
        console.log("✅ Firebase ready for admin access");
    } else {
        console.log("ℹ️ Firebase not available, using local storage only");
    }
}

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, initializing...");
    
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
    
    // Initialize Firebase for admin access
    setTimeout(() => {
        initializeFirebaseForAdmin();
    }, 1500);
    
    // ===== EXISTING LANGUAGE & NAVIGATION CODE =====
    // Keep all your existing portfolio functionality
    
    // Language switcher
    const langEnBtn = document.getElementById('langEn');
    const langDeBtn = document.getElementById('langDe');
    const langEnMobile = document.getElementById('langEnMobile');
    const langDeMobile = document.getElementById('langDeMobile');
    
    function switchLanguage(lang) {
        document.querySelectorAll('.lang-en, .lang-de').forEach(el => {
            el.style.display = 'none';
        });
        
        document.querySelectorAll(`.lang-${lang}`).forEach(el => {
            el.style.display = '';
        });
        
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
    
    console.log("✅ Initialization complete");
});
