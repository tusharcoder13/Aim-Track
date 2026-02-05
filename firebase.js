// ================= FIREBASE CONFIG =================

const firebaseConfig = {
  apiKey: "AIzaSyAMaYeu_N6PO77ub29Pi3wZKNd0Fof1D44",
  authDomain: "goal-planner-8330b.firebaseapp.com",
  projectId: "goal-planner-8330b",
  storageBucket: "goal-planner-8330b.firebasestorage.app",
  messagingSenderId: "869435593362",
  appId: "1:869435593362:web:2e5be829f5c6f177c34c4b",
  measurementId: "G-84T15NJFL1"
};

// ================= INITIALIZE FIREBASE =================

firebase.initializeApp(firebaseConfig);

// 🔥 EXPOSE THESE GLOBALLY
window.db = firebase.firestore();
window.auth = firebase.auth();
