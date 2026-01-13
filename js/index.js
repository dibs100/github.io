// ===== DOM ELEMENTS =====
let loginModal, loginClose, loginSubmit, loginError, passwordInput;
let passwordModal, passwordClose, registerSubmit, passwordSuccess, emailInput;
let changePasswordBtn, registerSubmitBtn, confirmPassword, newPassword, registerEmail;

// ===== LOADING FUNCTIONS =====
function showLoading(show, text = "Loading...") {
    const overlay = document.getElementById('loadingOverlay');
    const textElement = document.getElementById('loadingText');
    
    if (overlay && textElement) {
        overlay.style.display = show ? 'flex' : 'none';
        textElement.textContent = text;
    }
}

function showError(message) {
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.style.display = 'block';
        errorElement.querySelector('.lang-en').textContent = message;
        errorElement.querySelector('.lang-de').textContent = message;
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const successElement = document.getElementById('passwordSuccess');
    if (successElement) {
        successElement.style.display = 'block';
        successElement.querySelector('.lang-en').textContent = message;
        successElement.querySelector('.lang-de').textContent = message;
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    }
}

// ===== FIREBASE AUTH FUNCTIONS =====
async function loginWithFirebase(email, password) {
    try {
        showLoading(true, "Logging in...");
        
        // Validate inputs
        if (!email || !password) {
            throw new Error("Please fill in all fields");
        }
        
        // Check if Firebase auth is available
        if (!window.firebaseAuth) {
            throw new Error("Authentication service not available. Please refresh the page.");
        }
        
        // Sign in with email and password
        const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log("✅ Login successful:", user.email);
        
        // Get fresh ID token
        const token = await user.getIdToken();
        
        // Store user data in localStorage
        localStorage.setItem('firebaseUserId', user.uid);
        localStorage.setItem('userEmail', user.email || '');
        localStorage.setItem('firebaseToken', token);
        
        // Hide login modal
        if (loginModal) {
            loginModal.style.display = 'none';
        }
        
        // Clear form
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        // Show success message
        setTimeout(() => {
            alert("Login successful! Redirecting to admin panel...");
            window.location.href = 'admin.html';
        }, 500);
        
    } catch (error) {
        console.error("❌ Login error:", error);
        
        let errorMessage = "Login failed. ";
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = "No account found with this email.";
                break;
            case 'auth/wrong-password':
                errorMessage = "Incorrect password.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Invalid email address.";
                break;
            case 'auth/user-disabled':
                errorMessage = "This account has been disabled.";
                break;
            case 'auth/too-many-requests':
                errorMessage = "Too many failed attempts. Try again later.";
                break;
            default:
                errorMessage += error.message;
        }
        
        showError(errorMessage);
        
    } finally {
        showLoading(false);
    }
}

async function registerWithFirebase(email, password, confirmPassword) {
    try {
        // Validate inputs
        if (!email || !password || !confirmPassword) {
            throw new Error("Please fill in all fields");
        }
        
        if (password !== confirmPassword) {
            throw new Error("Passwords do not match");
        }
        
        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }
        
        showLoading(true, "Creating account...");
        
        // Check if Firebase auth is available
        if (!window.firebaseAuth) {
            throw new Error("Registration service not available. Please refresh the page.");
        }
        
        // Create user with email and password
        const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log("✅ Registration successful:", user.email);
        
        // Create user profile in Firestore
        if (window.firebaseDB) {
            try {
                await window.firebaseDB.collection('users').doc(user.uid).set({
                    email: user.email,
                    displayName: email.split('@')[0],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    noteCount: 0
                });
                console.log("✅ User profile created in Firestore");
            } catch (firestoreError) {
                console.warn("⚠️ Could not create Firestore profile:", firestoreError);
                // Continue even if Firestore fails
            }
        }
        
        // Get fresh ID token
        const token = await user.getIdToken();
        
        // Store user data
        localStorage.setItem('firebaseUserId', user.uid);
        localStorage.setItem('userEmail', user.email || '');
        localStorage.setItem('firebaseToken', token);
        
        // Hide registration modal
        if (passwordModal) {
            passwordModal.style.display = 'none';
        }
        
        // Clear form
        if (registerEmail) registerEmail.value = '';
        if (newPassword) newPassword.value = '';
        if (confirmPassword) confirmPassword.value = '';
        
        // Show success message
        showSuccess("Account created successfully! Redirecting...");
        
        // Auto-login and redirect
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 2000);
        
    } catch (error) {
        console.error("❌ Registration error:", error);
        
        let errorMessage = "Registration failed. ";
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = "Email already registered. Try login instead.";
                break;
            case 'auth/weak-password':
                errorMessage = "Password is too weak. Use at least 6 characters.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Invalid email address.";
                break;
            case 'auth/operation-not-allowed':
                errorMessage = "Email/password accounts are not enabled.";
                break;
            default:
                errorMessage += error.message;
        }
        
        showError(errorMessage);
        
    } finally {
        showLoading(false);
    }
}

// ===== MODAL FUNCTIONS =====
function showLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'flex';
        if (emailInput) emailInput.focus();
    }
}

function hideLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'none';
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (loginError) loginError.style.display = 'none';
    }
}

function showRegisterModal() {
    if (passwordModal) {
        passwordModal.style.display = 'flex';
        if (registerEmail) registerEmail.focus();
    }
    hideLoginModal();
}

function hideRegisterModal() {
    if (passwordModal) {
        passwordModal.style.display = 'none';
        if (registerEmail) registerEmail.value = '';
        if (newPassword) newPassword.value = '';
        if (confirmPassword) confirmPassword.value = '';
        if (passwordSuccess) passwordSuccess.style.display = 'none';
    }
}

// ===== EVENT HANDLERS =====
function handleLoginSubmit(e) {
    e.preventDefault();
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    loginWithFirebase(email, password);
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const email = registerEmail ? registerEmail.value.trim() : '';
    const password = newPassword ? newPassword.value.trim() : '';
    const confirm = confirmPassword ? confirmPassword.value.trim() : '';
    registerWithFirebase(email, password, confirm);
}

// ===== INITIALIZATION =====
function initFirebaseAuth() {
    console.log("🔥 Initializing Firebase Auth...");
    
    // Check if user is already logged in
    const userId = localStorage.getItem('firebaseUserId');
    const token = localStorage.getItem('firebaseToken');
    
    if (userId && token && window.firebaseAuth) {
        window.firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                console.log("✅ User already logged in:", user.email);
                // User is logged in, admin button should go directly to admin page
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) {
                    loginBtn.onclick = () => {
                        window.location.href = 'admin.html';
                    };
                    loginBtn.title = "Go to Admin Panel";
                    loginBtn.innerHTML = '<i class="fas fa-user-cog"></i>';
                }
            }
        });
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
    emailInput = document.getElementById('emailInput');
    passwordInput = document.getElementById('passwordInput');
    
    passwordModal = document.getElementById('passwordModal');
    passwordClose = document.getElementById('passwordClose');
    registerSubmit = document.getElementById('registerSubmit');
    passwordSuccess = document.getElementById('passwordSuccess');
    registerEmail = document.getElementById('registerEmail');
    newPassword = document.getElementById('newPassword');
    confirmPassword = document.getElementById('confirmPassword');
    
    changePasswordBtn = document.getElementById('changePasswordBtn');
    registerSubmitBtn = document.getElementById('registerSubmit');
    
    // Set up event listeners
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    if (loginClose) {
        loginClose.addEventListener('click', hideLoginModal);
    }
    
    if (passwordClose) {
        passwordClose.addEventListener('click', hideRegisterModal);
    }
    
    if (loginSubmit) {
        loginSubmit.addEventListener('click', handleLoginSubmit);
    }
    
    if (registerSubmit) {
        registerSubmit.addEventListener('click', handleRegisterSubmit);
    }
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', showRegisterModal);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (loginModal && e.target === loginModal) {
            hideLoginModal();
        }
        if (passwordModal && e.target === passwordModal) {
            hideRegisterModal();
        }
    });
    
    // Allow Enter key to submit forms
    if (emailInput && passwordInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLoginSubmit(e);
            }
        });
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLoginSubmit(e);
            }
        });
    }
    
    if (registerEmail && newPassword && confirmPassword) {
        const handleRegisterEnter = (e) => {
            if (e.key === 'Enter') {
                handleRegisterSubmit(e);
            }
        };
        
        registerEmail.addEventListener('keypress', handleRegisterEnter);
        newPassword.addEventListener('keypress', handleRegisterEnter);
        confirmPassword.addEventListener('keypress', handleRegisterEnter);
    }
    
    // Check Firebase auth status after a delay
    setTimeout(() => {
        initFirebaseAuth();
    }, 1000);
    
    // ===== EXISTING CODE (Language switcher, navigation, etc.) =====
    // Your existing language switcher, mobile menu, and navigation code here...
    // Keep all your existing functionality for the portfolio site
    
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
    
    console.log("✅ Initialization complete");
});
