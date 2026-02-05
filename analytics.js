auth.onAuthStateChanged(user => {
  if(!user){
    alert("Login required");
    window.location.href="index.html";
    return;
  }

  const uid = user.uid;

  db.collection("users")
    .doc(uid)
    .collection("history")
    .get()
    .then(snapshot => {

      let total = 0;
      let day = 0, week = 0, month = 0;

      const activityByDate = {};
      const dates = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const goals = data.goals || [];
        const date = data.date;

        dates.push(date);
        activityByDate[date] = goals.length;

        goals.forEach(g => {
          total++;
          if(g.type === "day") day++;
          if(g.type === "week") week++;
          if(g.type === "month") month++;
        });
      });

      // update counters
      document.getElementById("totalDone").innerText = total;
      document.getElementById("dayDone").innerText = day;
      document.getElementById("weekDone").innerText = week;
      document.getElementById("monthDone").innerText = month;

      // streak
      const streak = calculateStreak(dates);
      document.getElementById("streakCount").innerText =
        streak + (streak === 1 ? " day" : " days");

      // productivity score
      const score = Math.min(
        100,
        Math.round((total * 10 + streak * 15))
      );
      document.getElementById("productivityScore").innerText = score + "%";

      // smart insight
      document.getElementById("smartInsight").innerText =
        generateInsight(streak, total);

      // chart
      drawChart(activityByDate);
    });
});

/* ================= STREAK ================= */
function calculateStreak(dates){
  if(!dates.length) return 0;

  const set = new Set(dates);
  let streak = 0;
  let d = new Date();

  while(true){
    const key = d.toISOString().slice(0,10);
    if(set.has(key)){
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

/* ================= INSIGHT ================= */
function generateInsight(streak, total){
  if(streak >= 5)
    return "🔥 Amazing consistency! Keep the streak alive.";

  if(total >= 20)
    return "🏆 You are highly productive. Great discipline.";

  if(total > 0)
    return "🚀 Good start! Try completing at least one goal daily.";

  return "👋 Start completing goals to unlock insights.";
}

/* ================= ULTRA PREMIUM CHART ================= */

let chartInstance = null;

function drawChart(data){

  const labels = Object.keys(data).sort().slice(-7);

  if(labels.length === 0){
    labels.push("No Data");
    data["No Data"] = 0;
  }

  const values = labels.map(d => data[d]);

  const ctx = document.getElementById("chart").getContext("2d");

  if(chartInstance) chartInstance.destroy();

  /* gradient bars */
  const gradient = ctx.createLinearGradient(0,0,0,400);
  gradient.addColorStop(0,"rgba(56,189,248,0.95)");
  gradient.addColorStop(0.5,"rgba(59,130,246,0.7)");
  gradient.addColorStop(1,"rgba(56,189,248,0.2)");

  /* glow shadow plugin */
  const glowPlugin = {
    id:'glow',
    beforeDatasetsDraw(chart){
      const {ctx} = chart;
      ctx.save();
      ctx.shadowColor="rgba(56,189,248,0.6)";
      ctx.shadowBlur=18;
      ctx.shadowOffsetX=0;
      ctx.shadowOffsetY=6;
    },
    afterDatasetsDraw(chart){
      chart.ctx.restore();
    }
  };

  /* average calculation */
  const avg = values.reduce((a,b)=>a+b,0)/values.length;

  chartInstance = new Chart(ctx,{
    type:"bar",
    data:{
      labels:labels,
      datasets:[{
        label:"Completed",
        data:values,
        backgroundColor:gradient,
        borderRadius:14,
        borderSkipped:false,
        barThickness:40,
        hoverBackgroundColor:"#60a5fa"
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:{
        duration:1200,
        easing:"easeOutQuart"
      },
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:"#020617",
          titleColor:"#38bdf8",
          bodyColor:"#e5e7eb",
          borderColor:"#38bdf8",
          borderWidth:1,
          padding:12
        }
      },
      scales:{
        x:{
          ticks:{
            color:"#cbd5f5",
            font:{size:13, weight:"500"}
          },
          grid:{display:false}
        },
        y:{
          beginAtZero:true,
          ticks:{
            color:"#94a3b8",
            stepSize:1
          },
          grid:{
            color:"rgba(255,255,255,0.05)"
          }
        }
      }
    },
    plugins:[glowPlugin,{
      id:'averageLine',
      afterDraw(chart){
        const {ctx, scales:{y}} = chart;
        ctx.save();
        ctx.strokeStyle="rgba(250,204,21,0.7)";
        ctx.setLineDash([6,6]);
        ctx.beginPath();
        ctx.moveTo(40,y.getPixelForValue(avg));
        ctx.lineTo(chart.width-10,y.getPixelForValue(avg));
        ctx.stroke();

        ctx.fillStyle="#facc15";
        ctx.fillText("Avg",chart.width-40,y.getPixelForValue(avg)-6);
        ctx.restore();
      }
    }]
  });
}


