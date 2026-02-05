// ================= FIREBASE CONFIG =================

const firebaseConfig = {
    YOUR API KEY
};

// ================= INITIALIZE FIREBASE =================

firebase.initializeApp(firebaseConfig);

// 🔥 EXPOSE THESE GLOBALLY
window.db = firebase.firestore();
window.auth = firebase.auth();

