const historyContainer = document.getElementById("historyContainer");

auth.onAuthStateChanged(user => {

  if(!user){
    historyContainer.innerHTML =
      "<p style='color:#94a3b8'>Login to see history</p>";
    return;
  }

  db.collection("users")
    .doc(user.uid)
    .collection("history")
    .orderBy("date","desc")
    .onSnapshot(snapshot => {

      historyContainer.innerHTML = "";

      if(snapshot.empty){
        historyContainer.innerHTML =
          "<p style='color:#94a3b8'>No history yet.</p>";
        return;
      }

      snapshot.forEach(doc=>{
        const data = doc.data();

        const div = document.createElement("div");
        div.className = "section";

        div.innerHTML = `
          <h2>📅 ${data.date}</h2>
          <ul>
            ${data.goals.map(g =>
              `<li>✅ ${g.text} <small style="color:#64748b">${g.time}</small></li>`
            ).join("")}
          </ul>
        `;

        historyContainer.appendChild(div);
      });

    });

});
