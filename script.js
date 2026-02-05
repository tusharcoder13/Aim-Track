let goals = { day: [], week: [], month: [] };
let currentUser = null;
let unsubscribe = null;
let isGuest = true;

/* DOM */

const goalInput = document.getElementById("goalInput");
/* ENTER = ADD GOAL */
goalInput.addEventListener("keypress", function(e){
  if(e.key === "Enter"){
    e.preventDefault();
    addGoal();
  }
});
const goalType = document.getElementById("goalType");
const addBtn = document.getElementById("addBtn");

const authModal = document.getElementById("authModal");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
/* ENTER = LOGIN */
passwordInput.addEventListener("keypress", function(e){
  if(e.key === "Enter"){
    e.preventDefault();
    loginBtn.click();
  }
});
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const openLogin = document.getElementById("openLogin");

const userBar = document.getElementById("userBar");
const guestBar = document.getElementById("guestBar");
const historyBox = document.getElementById("historyBox");
const userEmailEl = document.getElementById("userEmail");
const avatarEl = document.getElementById("avatar");

/* 🔔 ASK NOTIFICATION PERMISSION */
if ("Notification" in window) {

  if (Notification.permission === "default") {
    Notification.requestPermission()
      .then(permission => {
        console.log("Notification permission:", permission);
      });
  }

}

/* ================= GUEST STORAGE ================= */
function saveLocal(){
  localStorage.setItem("guestGoals", JSON.stringify(goals));
}

function loadLocal(){
  const g = JSON.parse(localStorage.getItem("guestGoals"));
  if(g) goals = g;
}

/* ================= FIREBASE ================= */
function userDoc(uid){
  return db.collection("users").doc(uid);
}

function saveGoals(){

  if(isGuest){
    saveLocal();
    render();
    return;
  }

  if(!currentUser) return;

  userDoc(currentUser.uid).set({ goals }, {merge:true});
}

/* ================= AUTH ================= */

openLogin.onclick = ()=> authModal.style.display="flex";

loginBtn.onclick = ()=>{
  auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
};

registerBtn.onclick = () => {

  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();

  if(!email || !pass){
    alert("Enter email and password");
    return;
  }

  auth.createUserWithEmailAndPassword(email, pass)
  .then(()=>{
    alert("Account created & logged in 🎉");
    authModal.style.display="none";
  })
  .catch(err=>{
    alert(err.message);
  });

};


logoutBtn.onclick = ()=> auth.signOut();

/* ================= AUTH STATE ================= */

auth.onAuthStateChanged(user=>{
  if(user){
    currentUser = user;
    isGuest = false;

    authModal.style.display="none";
    userBar.style.display="flex";
    guestBar.style.display="none";
    historyBox.style.display="flex";

    userEmailEl.innerText = user.email;
    avatarEl.innerText = user.email[0].toUpperCase();

    mergeLocalToCloud();
    startRealtime();
  }
  else{
    currentUser = null;
    isGuest = true;

    userBar.style.display="none";
    guestBar.style.display="flex";
    historyBox.style.display="none";

    if(unsubscribe) unsubscribe();

    loadLocal();
    render();
  }
});

/* ================= MERGE LOCAL ================= */

function mergeLocalToCloud(){
  const local = JSON.parse(localStorage.getItem("guestGoals"));
  if(!local) return;

  goals = {
    day:[...goals.day,...local.day],
    week:[...goals.week,...local.week],
    month:[...goals.month,...local.month]
  };

  localStorage.removeItem("guestGoals");
  saveGoals();
}

/* ================= REALTIME ================= */

function startRealtime(){
  unsubscribe = userDoc(currentUser.uid).onSnapshot(doc=>{
    if(!doc.exists){
      saveGoals();
      return;
    }
    goals = doc.data().goals || {day:[],week:[],month:[]};
    render();
  });
}

/* ================= ADD ================= */

addBtn.onclick = addGoal;

function addGoal(){
  const text = goalInput.value.trim();
  if(!text) return;

  goals[goalType.value].push({
    text,
    completed:false,
    pinned:false
  });

  goalInput.value="";
  saveGoals();
}

/* ================= ACTIONS ================= */

function toggleComplete(type, i){

  const goal = goals[type][i];
  goal.completed = !goal.completed;

  saveGoals();

  // save history only when completed true
  if(goal.completed && currentUser && !isGuest){

    const today = new Date().toISOString().slice(0,10);

    db.collection("users")
      .doc(currentUser.uid)
      .collection("history")
      .doc(today)
      .set({
        date: today,
        goals: firebase.firestore.FieldValue.arrayUnion({
          text: goal.text,
          type: type,
          time: new Date().toLocaleTimeString()
        })
      }, { merge:true })
      .then(()=> console.log("History saved"))
      .catch(err=> console.log("History error:", err));
  }
}


function togglePin(type,i){
  goals[type][i].pinned = !goals[type][i].pinned;
  saveGoals();
}

function deleteGoal(type,i){
  goals[type].splice(i,1);
  saveGoals();
}

/* ================= PROGRESS ================= */

function updateProgress(){
  ["day","week","month"].forEach(type=>{
    const total=goals[type].length;
    const done=goals[type].filter(g=>g.completed).length;
    const percent= total?Math.round(done/total*100):0;

    document.getElementById(type+"Progress").style.width=percent+"%";
    document.getElementById(type+"Percent").innerText=percent+"% completed";
  });
}

/* ================= RENDER ================= */

function render(){
  ["day","week","month"].forEach(type=>{
    const ul=document.getElementById(type);
    ul.innerHTML="";

    const sorted=[
      ...goals[type].filter(g=>g.pinned),
      ...goals[type].filter(g=>!g.pinned)
    ];

    sorted.forEach(g=>{
      const i = goals[type].indexOf(g);

      const li=document.createElement("li");
      li.innerHTML=`
      <div class="goal-left">
        <button class="pin-btn" onclick="togglePin('${type}',${i})">
          ${g.pinned?"⭐":"☆"}
        </button>
        <label>
          <input type="checkbox"
            ${g.completed?"checked":""}
            onchange="toggleComplete('${type}',${i})">
          ${g.text}
        </label>
      </div>

      <div class="actions">
        <button class="edit"
          onclick="editGoal('${type}',${i})">Edit</button>

        <button class="delete"
          onclick="deleteGoal('${type}',${i})">Delete</button>
      </div>

      `;
      ul.appendChild(li);
    });
  });

  updateProgress();
}

function editGoal(type, i){
  const updated = prompt("Edit goal:", goals[type][i].text);
  if(!updated) return;
  goals[type][i].text = updated;
  saveGoals();
}

resetPasswordBtn.onclick = () => {

  const email = emailInput.value.trim();

  if(!email){
    alert("Enter your email first");
    return;
  }

  auth.sendPasswordResetEmail(email)
    .then(()=>{
      alert("Password reset email sent 📩");
    })
    .catch(err=>{
      alert(err.message);
    });

};

document.querySelectorAll(".history-box a").forEach(a=>{
  if(a.href === location.href) a.classList.add("active");
});


/* ================= SMART NOTIFICATIONS ================= */

function sendReminder(title, message) {
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body: message,
    icon: "https://cdn-icons-png.flaticon.com/512/1827/1827349.png"
  });
}

function checkTodayGoals() {

  // notify only for logged-in users
  if (isGuest || !goals.day) return;

  const total = goals.day.length;
  const completed = goals.day.filter(g => g.completed).length;

  if (total === 0) return;

  // reminder if nothing completed
  if (completed === 0) {
    sendReminder(
      "⚡ Pending Goals",
      "You haven’t completed today’s goals yet. Keep your streak alive 🔥"
    );
  }

  // night reminder (after 8 PM)
  const hour = new Date().getHours();
  if (hour >= 20 && completed < total) {
    sendReminder(
      "🌙 Night Reminder",
      "Finish your remaining goals before the day ends 💪"
    );
  }
}

// run once after page load
setTimeout(checkTodayGoals, 5000);

// check every 1 hour
setInterval(checkTodayGoals, 60 * 60 * 1000);

/* INIT */
loadLocal();
render();
