// ===== FIREBASE CONFIGURATION =====
// PASTE YOUR CONFIG HERE (from Firebase Console - NOT the module version)
const firebaseConfig = {
    apiKey: "AIzaSyDWx_MULHW2T2XmdVvmO9spTKDVbO1rI-Q",
    authDomain: "dibs-29435.firebaseapp.com",
    projectId: "dibs-29435",
    storageBucket: "dibs-29435.firebasestorage.app",
    messagingSenderId: "948381873692",
    appId: "1:948381873692:web:a1da04a8f9294878cb91d9",
    measurementId: "G-0789MPE7XE"
};

// ===== FIREBASE INITIALIZATION =====
console.log("🚀 Initializing Firebase...");

// Wait for Firebase SDK to load
if (typeof firebase !== 'undefined') {
    try {
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully!");
        console.log("📱 Firebase App Name:", app.name);
        
        // ===== FIREBASE SERVICES =====
        window.firebaseAuth = firebase.auth();
        window.firebaseDB = firebase.firestore();
        window.firebaseStorage = firebase.storage();
        
        // ===== FIREBASE AUTH STATE LISTENER =====
        window.firebaseAuth.onAuthStateChanged((user) => {
            console.log("👤 Auth state changed:", user ? "User logged in" : "User logged out");
            console.log("📧 User email:", user?.email);
            
            if (user) {
                localStorage.setItem('firebaseUserId', user.uid);
                localStorage.setItem('userEmail', user.email || '');
                
                user.getIdToken().then((token) => {
                    localStorage.setItem('firebaseToken', token);
                    console.log("🔑 Token updated");
                });
            } else {
                localStorage.removeItem('firebaseUserId');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('firebaseToken');
            }
            
            // Update UI if function exists
            if (window.updateFirebaseStatus) {
                window.updateFirebaseStatus(user ? 'connected' : 'disconnected');
            }
        });
        
        console.log("✅ Firebase services ready!");
        
    } catch (error) {
        console.error("❌ Firebase initialization failed:", error);
    }
} else {
    console.error("❌ Firebase SDK not loaded!");
}

// ===== HELPER FUNCTIONS =====
window.getFirebaseUser = async () => {
    return new Promise((resolve) => {
        if (window.firebaseAuth) {
            const unsubscribe = window.firebaseAuth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        } else {
            resolve(null);
        }
    });
};

window.checkFirebaseAuth = () => {
    const user = window.firebaseAuth?.currentUser;
    const token = localStorage.getItem('firebaseToken');
    const userId = localStorage.getItem('firebaseUserId');
    
    return !!(user && token && userId);
};

// Check Firebase status after load
setTimeout(() => {
    if (window.firebaseAuth) {
        console.log("✅ Firebase config loaded successfully!");
        
        // Initial status check
        const user = window.firebaseAuth.currentUser;
        const statusElement = document.getElementById('firebaseStatus');
        if (statusElement) {
            if (user) {
                statusElement.innerHTML = '<i class="fas fa-circle status-dot connected"></i> <span class="status-text">Connected to Firebase</span>';
            } else {
                statusElement.innerHTML = '<i class="fas fa-circle status-dot"></i> <span class="status-text">Firebase ready - Please login</span>';
            }
        }
    } else {
        console.error("❌ Firebase failed to load");
        const statusElement = document.getElementById('firebaseStatus');
        if (statusElement) {
            statusElement.innerHTML = '<i class="fas fa-circle status-dot error"></i> <span class="status-text">Firebase connection failed</span>';
        }
    }
}, 1000);
