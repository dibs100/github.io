// ===== FIREBASE CONFIGURATION =====
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
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof firebase !== 'undefined') {
            try {
                // Check if already initialized
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                    console.log("Firebase initialized successfully!");
                    
                    // Initialize services
                    window.firebaseAuth = firebase.auth();
                    window.firebaseDB = firebase.firestore();
                } else {
                    console.log("Firebase already initialized");
                    window.firebaseAuth = firebase.auth();
                    window.firebaseDB = firebase.firestore();
                }
            } catch (error) {
                console.error("Firebase initialization failed:", error);
            }
        } else {
            console.log("Firebase SDK not loaded - using local storage mode");
        }
    }, 100);
});
