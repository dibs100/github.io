
// ===== ENCRYPTION UTILITIES =====
// Simple XOR encryption for GitHub-safe storage
// This is NOT military-grade encryption, but suitable for public GitHub
const EncryptionUtils = {
    // Encryption key - can be stored in GitHub as it's part of code
    ENCRYPTION_KEY: 'dibesh-portfolio-2025-secure-key-12345',
    
    // Simple XOR encryption (safe for GitHub)
    encrypt(text) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
            result += String.fromCharCode(charCode);
        }
        // Convert to base64 for storage
        return btoa(result);
    },
    
    decrypt(encryptedText) {
        try {
            // Decode from base64
            const decoded = atob(encryptedText);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    },
    
    // Hash password (one-way for comparison)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }
};

// ===== PASSWORD MANAGER =====
class PasswordManager {
    constructor() {
        this.STORAGE_KEY = 'dibesh_admin_password';
        this.DEFAULT_PASSWORD = 'admin123'; // Will be encrypted before storage
        this.init();
    }

    init() {
        // Check if encrypted password exists in localStorage
        const storedEncryptedPassword = localStorage.getItem(this.STORAGE_KEY);
        
        if (!storedEncryptedPassword) {
            // First time setup - encrypt and store default password
            const encryptedDefault = EncryptionUtils.encrypt(this.DEFAULT_PASSWORD);
            localStorage.setItem(this.STORAGE_KEY, encryptedDefault);
        }
    }

    getEncryptedPassword() {
        return localStorage.getItem(this.STORAGE_KEY);
    }

    validatePassword(password) {
        const encryptedStored = this.getEncryptedPassword();
        if (!encryptedStored) return false;
        
        const decryptedPassword = EncryptionUtils.decrypt(encryptedStored);
        return password === decryptedPassword;
    }

    setPassword(newPassword) {
        // Validate password strength
        if (newPassword.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }
        
        // Encrypt and store
        const encryptedPassword = EncryptionUtils.encrypt(newPassword);
        localStorage.setItem(this.STORAGE_KEY, encryptedPassword);
        return { success: true };
    }
}

// Initialize Password Manager
const passwordManager = new PasswordManager();

// ===== LANGUAGE SWITCHING =====
const langEnBtn = document.getElementById('langEn');
const langDeBtn = document.getElementById('langDe');
const langEnMobileBtn = document.getElementById('langEnMobile');
const langDeMobileBtn = document.getElementById('langDeMobile');
const htmlElement = document.getElementById('htmlLang');

function switchLanguage(lang) {
    // Update active buttons
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (lang === 'en') {
        if (langEnBtn) langEnBtn.classList.add('active');
        if (langEnMobileBtn) langEnMobileBtn.classList.add('active');
        htmlElement.setAttribute('lang', 'en');
    } else {
        if (langDeBtn) langDeBtn.classList.add('active');
        if (langDeMobileBtn) langDeMobileBtn.classList.add('active');
        htmlElement.setAttribute('lang', 'de');
    }
    
    // Show/hide language-specific content
    document.querySelectorAll('.lang-en').forEach(el => {
        el.style.display = lang === 'en' ? 'block' : 'none';
    });
    
    document.querySelectorAll('.lang-de').forEach(el => {
        el.style.display = lang === 'de' ? 'block' : 'none';
    });
    
    // Update navigation links
    document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
        const text = link.getAttribute(`data-${lang}`);
        if (text) {
            link.textContent = text;
        }
    });
    
    // Store preference in localStorage
    localStorage.setItem('preferredLanguage', lang);
}

// Event listeners for language buttons
if (langEnBtn) langEnBtn.addEventListener('click', () => switchLanguage('en'));
if (langDeBtn) langDeBtn.addEventListener('click', () => switchLanguage('de'));
if (langEnMobileBtn) langEnMobileBtn.addEventListener('click', () => switchLanguage('en'));
if (langDeMobileBtn) langDeMobileBtn.addEventListener('click', () => switchLanguage('de'));

// Check for saved language preference
const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
switchLanguage(savedLanguage);

// ===== MOBILE MENU TOGGLE =====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        mobileMenuBtn.innerHTML = mobileNav.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
}

// ===== ZABBIX BUTTON =====
const zabbixBtn = document.getElementById('zabbixBtn');
if (zabbixBtn) {
    zabbixBtn.addEventListener('click', () => {
        // UPDATE THIS URL TO YOUR ACTUAL ZABBIX LAB URL
        const zabbixUrl = "https://your-actual-zabbix-lab-url.com/";
        window.open(zabbixUrl, '_blank');
    });
}

// ===== LOGIN FUNCTIONALITY =====
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const loginClose = document.getElementById('loginClose');
const loginSubmit = document.getElementById('loginSubmit');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const changePasswordBtn = document.getElementById('changePasswordBtn');

// ===== PASSWORD CHANGE MODAL =====
const passwordModal = document.getElementById('passwordModal');
const passwordClose = document.getElementById('passwordClose');
const changePasswordSubmit = document.getElementById('changePasswordSubmit');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordSuccess = document.getElementById('passwordSuccess');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        loginModal.classList.add('active');
        passwordInput.focus();
        loginError.style.display = 'none';
    });
}

if (loginClose) {
    loginClose.addEventListener('click', () => {
        loginModal.classList.remove('active');
        passwordInput.value = '';
        loginError.style.display = 'none';
    });
}

if (loginSubmit) {
    loginSubmit.addEventListener('click', handleLogin);
}

// ===== HANDLE LOGIN FUNCTION =====
function handleLogin() {
    if (passwordManager.validatePassword(passwordInput.value)) {
        // Successful login - set authentication flag
        localStorage.setItem('isAuthenticated', 'true');
        // Redirect to admin page
        window.location.href = "admin.html";
    } else {
        loginError.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Allow Enter key for login
if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
}

// ===== CHANGE PASSWORD BUTTON =====
if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
        loginModal.classList.remove('active');
        passwordModal.classList.add('active');
        currentPasswordInput.focus();
        passwordSuccess.style.display = 'none';
        // Clear inputs
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
    });
}

// Password modal close
if (passwordClose) {
    passwordClose.addEventListener('click', () => {
        passwordModal.classList.remove('active');
    });
}

// ===== CHANGE PASSWORD SUBMIT =====
if (changePasswordSubmit) {
    changePasswordSubmit.addEventListener('click', () => {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validate current password
        if (!passwordManager.validatePassword(currentPassword)) {
            alert('Current password is incorrect');
            currentPasswordInput.focus();
            return;
        }

        // Validate new password
        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters long');
            newPasswordInput.focus();
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            confirmPasswordInput.focus();
            return;
        }

        // Check if new password is same as current
        if (newPassword === currentPassword) {
            alert('New password cannot be the same as current password');
            newPasswordInput.focus();
            return;
        }

        // Change password
        const result = passwordManager.setPassword(newPassword);
        if (!result.success) {
            alert(result.error);
            return;
        }
        
        // Show success message
        passwordSuccess.style.display = 'block';
        
        // Clear inputs
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        
        // Auto-close after 2 seconds
        setTimeout(() => {
            passwordModal.classList.remove('active');
            passwordSuccess.style.display = 'none';
            
            // Show login modal again
            loginModal.classList.add('active');
            passwordInput.focus();
        }, 2000);
    });
}

// Allow Enter key for password change
[currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                changePasswordSubmit.click();
            }
        });
    }
});

// ===== CLOSE MODALS WHEN CLICKING OUTSIDE =====
loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('active');
        passwordInput.value = '';
        loginError.style.display = 'none';
    }
});

passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
        passwordModal.classList.remove('active');
    }
});

// ===== SMOOTH SCROLLING FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if(targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
            
            // Update active link
            if(this.getAttribute('href') !== '#contact') {
                document.querySelectorAll('nav a, .mobile-nav a').forEach(a => {
                    a.classList.remove('active');
                });
                this.classList.add('active');
            }
            
            // Close mobile menu if open
            if (mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    });
});

// ===== UPDATE ACTIVE LINK ON SCROLL =====
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a, .mobile-nav a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if(scrollY >= (sectionTop - 150)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===== CLOSE MOBILE MENU WHEN CLICKING OUTSIDE =====
document.addEventListener('click', (e) => {
    if (!mobileNav.contains(e.target) && !mobileMenuBtn.contains(e.target) && mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    }
});

// ===== SESSION MANAGEMENT =====
// Auto-logout after 30 minutes of inactivity
let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    // Only set timer if logged in
    if (localStorage.getItem('isAuthenticated') === 'true') {
        inactivityTimer = setTimeout(() => {
            localStorage.removeItem('isAuthenticated');
            // Only redirect if on admin page
            if (window.location.pathname.includes('admin.html')) {
                window.location.href = 'index.html';
            }
        }, 30 * 60 * 1000); // 30 minutes
    }
}

// Reset on user activity
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);

// Initialize inactivity timer
resetInactivityTimer();
