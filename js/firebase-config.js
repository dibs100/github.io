// ===== FIREBASE CONFIGURATION =====
// PASTE YOUR COPIED CONFIG HERE - Replace with your actual config

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDWx_MULHW2T2XmdVvmO9spTKDVbO1rI-Q",
    authDomain: "dibs-29435.firebaseapp.com",
    projectId: "dibs-29435",
    storageBucket: "dibs-29435.firebasestorage.app",
    messagingSenderId: "948381873692",
    appId: "1:948381873692:web:a1da04a8f9294878cb91d9",
    measurementId: "G-0789MPE7XE"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>

// ===== FIREBASE INITIALIZATION =====
console.log("🚀 Initializing Firebase...");

try {
    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase SDK not loaded!");
        throw new Error('Firebase SDK not loaded. Check if script tags are correct.');
    }
    
    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized successfully!");
    console.log("📱 Firebase App Name:", app.name);
    
} catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    
    // Show user-friendly error
    if (window.showFirebaseError) {
        window.showFirebaseError("Firebase initialization failed. Please refresh the page.");
    }
}

// ===== FIREBASE SERVICES =====
// Make Firebase services available globally
window.firebaseAuth = firebase.auth();
window.firebaseDB = firebase.firestore();
window.firebaseStorage = firebase.storage();

// ===== FIREBASE AUTH STATE LISTENER =====
// This helps track login state globally
if (window.firebaseAuth) {
    window.firebaseAuth.onAuthStateChanged((user) => {
        console.log("👤 Auth state changed:", user ? "User logged in" : "User logged out");
        console.log("📧 User email:", user?.email);
        
        // Store user info in localStorage for quick access
        if (user) {
            localStorage.setItem('firebaseUserId', user.uid);
            localStorage.setItem('userEmail', user.email || '');
            
            // Get fresh token
            user.getIdToken().then((token) => {
                localStorage.setItem('firebaseToken', token);
            });
        } else {
            // Clear user data on logout
            localStorage.removeItem('firebaseUserId');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('firebaseToken');
        }
        
        // Notify other parts of the app
        if (window.onAuthStateChanged) {
            window.onAuthStateChanged(user);
        }
    });
}

// ===== HELPER FUNCTIONS =====
window.getFirebaseUser = async () => {
    return new Promise((resolve) => {
        const unsubscribe = window.firebaseAuth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
};

window.checkFirebaseAuth = () => {
    const user = window.firebaseAuth.currentUser;
    const token = localStorage.getItem('firebaseToken');
    const userId = localStorage.getItem('firebaseUserId');
    
    return !!(user && token && userId);
};

console.log("✅ Firebase config loaded successfully!");
