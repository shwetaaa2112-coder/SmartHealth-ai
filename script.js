// 👤 CORE CLIENT-SIDE BACKEND ROUTER & AUTH ENGINE
let currentMode = 'login';
let currentUser = null;
let healthChartInstance = null; // Chart.js instance tracking

// Document load hote hi Auth check trigger hoga
document.addEventListener("DOMContentLoaded", function () {
    // Scroll wheel inputs par numbers change hone se rokein
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('wheel', function(e) {
            e.preventDefault();
        });
    });

    // Check if user is already logged in (Session maintaining)
    let savedSession = localStorage.getItem('current_active_user');
    if (savedSession) {
        currentUser = savedSession;
        enterDashboard();
    }
});

// Switch between Sign In and Sign Up tabs
window.switchAuthTab = function(mode) {
    currentMode = mode;
    document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
    document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
    document.getElementById('btnAuthSubmit').innerText = mode === 'login' ? 'Login to Dashboard' : 'Register New User';
};

// Handle Registration and Sign In
window.handleAuth = function(e) {
    e.preventDefault();
    let user = document.getElementById('authUsername').value.trim().toLowerCase();
    let pass = document.getElementById('authPassword').value;
    
    let users = JSON.parse(localStorage.getItem('registered_users')) || {};

    if (currentMode === 'register') {
        // Unique Username check to block duplication overwrites
        if (users[user]) {
            alert("❌ User already exists! Try logging in.");
            return;
        }
        // Save user structure securely
        users[user] = { password: pass, healthData: null, bmiHistory: [], lastInputState: null };
        localStorage.setItem('registered_users', JSON.stringify(users));
        alert("✅ Account registered successfully! You can now log in.");
        switchAuthTab('login');
    } else {
        // Sign In verification
        if (!users[user] || users[user].password !== pass) {
            alert("❌ Invalid credentials! Try again.");
            return;
        }
        currentUser = user;
        localStorage.setItem('current_active_user', currentUser);
        enterDashboard();
    }
};

// 🏆 FIX: Enter dashboard layout on successful authentication
function enterDashboard() {
    // 1. Display Dashboard Container smoothly (Universal Selector)
    let container = document.getElementById('mainDashboardContainer') || document.querySelector('.container') || document.getElementsByClassName('container')[0];
    if (container) {
        container.style.setProperty('display', 'block', 'important'); // Force block layout
    } else {
        console.error("Dashboard container class not found in DOM!");
    }
    
    // 2. Hide Authentication Screen Overlay completely
    let overlay = document.getElementById('authOverlay');
    if (overlay) {
        overlay.style.setProperty('display', 'none', 'important');
    }

    // 3. Setup dynamic header state info
    let logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) logoutBtn.style.display = 'block';
    
    let userDisplay = document.getElementById('userDisplay');
    if (userDisplay) userDisplay.innerText = `👤 Account: ${currentUser.toUpperCase()}`;
    
    // Load historical sessions & chart trends
    loadUserData();
    loadHistory();
    updateChart();
}

// Fetch current profile dynamic storage
function loadUserData() {
    let users = JSON.parse(localStorage.getItem('registered_users')) || {};
    let activeData = users[currentUser];
    let resultDiv = document.getElementById("result");
    
    if (activeData && activeData.healthData) {
        resultDiv.innerHTML = activeData.healthData;
        document.getElementById('btnDownload').style.display = 'block';
        
        // Form inputs state reload
        if (activeData.lastInputState) {
            let state = activeData.lastInputState;
            document.getElementById("name").value = state.name || "";
            document.getElementById("age").value = state.age || "";
            document.getElementById("height").value = state.height || "";
            document.getElementById("weight").value = state.weight || "";
            document.getElementById("bloodGroup").value = state.bloodGroup || "A+";
            document.getElementById("heartRate").value = state.heartRate || "";
            document.getElementById("sleepHours").value = state.sleepHours || "";
            document.getElementById("waterIntake").value = state.waterIntake || "";
            document.getElementById("stepsWalked").value = state.stepsWalked || "";
            document.getElementById("exerciseMinutes").value = state.exerciseMinutes || "";
            document.getElementById("stressLevel").value = state.stressLevel || "";
            
            if (state.gender) {
                let genderRadio = document.querySelector(`input[name="gender"][value="${state.gender}"]`);
                if (genderRadio) genderRadio.checked = true;
            }
        }
    } else {
        resultDiv.innerHTML = `
            <div class="empty-state">
              <div style='font-size:60px'>📊</div>
              <h3>Result yaha dikhega</h3>
            </div>`;
        document.getElementById('btnDownload').style.display = 'none';
    }
}

// 🔥 TOTAL INTEGRATED DYNAMIC LOGIC ENGINE (FORM SUBMIT)
window.processHealthData = function(e) {
    e.preventDefault();
    if (!currentUser) return alert("Please authenticate first!");

    // SAARA DATA NIKALO (Strict Parsing according to original standards)
    let name = document.getElementById("name").value;
    let age = Number(document.getElementById("age").value);
    let genderEI = document.querySelector('input[name="gender"]:checked');
    let gender = genderEI ? genderEI.value : "Not Selected";
    let height = parseFloat(document.getElementById("height").value);
    let weight = parseFloat(document.getElementById("weight").value);
    let bloodGroup = document.getElementById("bloodGroup").value;
    let heartRate = Number(document.getElementById("heartRate").value) || 72;
    let sleepHours = parseFloat(document.getElementById("sleepHours").value) || 0;
    let waterIntake = parseFloat(document.getElementById("waterIntake").value) || 0;
    let stepsWalked = Number(document.getElementById("stepsWalked").value) || 0;
    let exerciseMinutes = Number(document.getElementById("exerciseMinutes").value) || 0;
    let stressLevel = Number(document.getElementById("stressLevel").value) || 0;

    // BMI CALCULATE (Height in feet * 0.3048 to convert to meters)
    let heightInMeter = height * 0.3048;
    let bmi = (weight / (heightInMeter * heightInMeter)).toFixed(1);
    let status = bmi < 18.5 ? "Underweight" : bmi < 24.9 ? "Normal" : bmi < 29.9 ? "Overweight" : "Obese";
    let color = bmi < 18.5 ? "#3498db" : bmi < 24.9 ? "#2ecc71" : bmi < 29.9 ? "#e67e22" : "#e74c3c";

    // FINAL SCORE LOGIC
    let finalScore = 100;
    if (bmi < 18.5) finalScore -= 25;
    else if (bmi >= 25 && bmi < 30) finalScore -= 20;
    else if (bmi >= 30) finalScore -= 40;
    if (sleepHours < 6) finalScore -= 20;
    else if (sleepHours > 9) finalScore -= 10;
    if (waterIntake < 2) finalScore -= 15;
    finalScore = Math.max(0, finalScore);

    // HEALTH TIPS + BLOOD GROUP METABOLIC INSIGHTS
    let tips = "";
    if (stepsWalked < 5000) tips += "🚶 Walk more daily.<br>";
    if (stressLevel > 7) tips += "🧘 Reduce stress with meditation.<br>";
    if (bmi < 18.5) tips += "⚠️ Your weight is low. Try nutritious diet.<br>";
    else if (bmi > 24.9) tips += "⚠️ Your weight is high. Exercise recommended.<br>";
    else tips += "✅ Your weight is healthy.<br>";
    if (heartRate < 60) tips += "⚠️ Heart rate below normal.<br>";
    else if (heartRate > 100) tips += "⚠️ Heart rate above normal.<br>";
    else tips += "✅ Heart rate normal.<br>";
    if (waterIntake < 2) tips += "⚠️ Drink more water 2L daily.<br>";
    else tips += "✅ Water intake good.<br>";
    if (sleepHours < 7) tips += "⚠️ Increase sleep 7-9 hours.<br>";
    else tips += "✅ Sleep healthy.<br>";
    if (exerciseMinutes < 30) tips += "🏃 Exercise 30 min daily.<br>";
    else tips += "✅ Exercise good.<br>";

    if (bloodGroup === "O+" || bloodGroup === "O-") {
        tips += "🩸 <b>Blood Type O Profile:</b> Aapka metabolism strong protein processing ke liye optimized hai. High-protein food aur high-intensity workouts best results denge.<br>";
    } else if (bloodGroup === "A+" || bloodGroup === "A-") {
        tips += "🩸 <b>Blood Type A Profile:</b> Aapka digestive system complex grains aur vegetables ke liye zyaada responsive hai. Calming exercises jaise Yoga aur meditation aapke stress metrics ko better balance karenge.<br>";
    } else if (bloodGroup === "B+" || bloodGroup === "B-") {
        tips += "🩸 <b>Blood Type B Profile:</b> Aapka immune system balanced aur versatile hai. Dairy products, green vegetables, aur moderate activities (brisk walking/swimming) aapke baseline ke liye adaptive hain.<br>";
    } else if (bloodGroup === "AB+" || bloodGroup === "AB-") {
        tips += "🩸 <b>Blood Type AB Profile:</b> Yeh ek unique genetic profile hai jo A aur B dono ke traits share karti hai. Lean proteins aur balanced stretching/aerobics sessions aapki physical fitness ko maximize karenge.<br>";
    }

    // DISEASE RISK
    let diseaseRisk = "Low";
    let riskAlert = "✅ Current health indicators look stable.";
    if (bmi > 30 && heartRate > 100 && stressLevel > 8) {
        diseaseRisk = "High";
        riskAlert = "🚨 High chance of complications. Doctor consultation recommended.";
    } else if (bmi > 25 || sleepHours < 6 || waterIntake < 1.5) {
        diseaseRisk = "Medium";
        riskAlert = "⚠️ Some health indicators need attention.";
    }

    // HEALTH PRIORITIES
    let priorities = [];
    if (sleepHours < 7) priorities.push("😴 Sleep");
    if (waterIntake < 2) priorities.push("💧 Water");
    if (exerciseMinutes < 30) priorities.push("🏃 Exercise");
    if (stressLevel > 7) priorities.push("😟 Stress");

    // WELLNESS PERSONA
    let persona = "😊 Balanced Lifestyle";
    if (sleepHours < 6) persona = "😴 Sleepy Scholar";
    else if (exerciseMinutes > 45) persona = "🏃 Fitness Focused";
    else if (stressLevel > 8) persona = "⚠️ High Stress Achiever";

    // 🔮 WHAT-IF SIMULATOR
    let simulations = "";
    if (sleepHours < 8) {
        let potentialScore = Math.min(100, finalScore + 15);
        simulations += `😴 If Sleep = 8hr → Score: ${potentialScore}/100<br>`;
    }
    if (waterIntake < 3) {
        let potentialScore = Math.min(100, finalScore + 10);
        simulations += `💧 If Water = 3L → Score: ${potentialScore}/100<br>`;
    }
    if (exerciseMinutes < 30) {
        let potentialScore = Math.min(100, finalScore + 15);
        simulations += `🏃 If Exercise = 30min → Score: ${potentialScore}/100<br>`;
    }
    if (stepsWalked < 10000) {
        let potentialScore = Math.min(100, finalScore + 10);
        simulations += `🚶 If Steps = 10k → Score: ${potentialScore}/100<br>`;
    }
    if (stressLevel > 3) {
        let potentialScore = Math.min(100, finalScore + 20);
        simulations += `😌 If Stress = 3 → Score: ${potentialScore}/100<br>`;
    }
    if (simulations === "") {
        simulations = "🎉 Excellent! Your habits are already maximizing your health score.";
    }

    // UPDATE EXCLUSIVE DYNAMIC SCREEN DISPLAY
    let reportHTML = `
        <div style='background:#1a1a2e; color:white; padding:25px; border-radius:20px; font-family: inherit;'>
            <div style='text-align:center;'>
                <div style='font-size:60px'>${getEmoji(status)}</div>
                <div style='font-size:50px;font-weight:900;color:${color}'>${bmi}</div>
            </div>
            <div style='text-align:center;margin:20px 0'>
              <div style='font-size:22px;background:${color};padding:10px 25px;border-radius:50px;display:inline-block;color:white;font-weight:700'>${status}</div>
            </div>
            <div style='margin-top:20px;background:rgba(255,255,255,0.1);padding:20px;border-radius:20px'>
              <h3 style='margin:0 0 10px 0; color:#fff;'>Health Score</h3>
              <div style='font-size:40px;font-weight:bold;text-align:center'>${finalScore}/100</div>
            </div>
            <div style='margin-top:25px;text-align:left'>
              <h4 style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color:#fff;">📊 Your Diagnostics</h4>
              <p style="margin: 8px 0;"><b>Name:</b> ${name} | <b>Age:</b> ${age} | <b>Gender:</b> ${gender}</p>
              <p style="margin: 8px 0;"><b>Height:</b> ${height}ft | <b>Weight:</b> ${weight}kg | <b>Blood Group:</b> ${bloodGroup}</p>

              <h4 style='margin-top:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color:#fff;'>💡 Health Tips</h4>
              <p style="line-height:1.6; color:#e2e8f0;">${tips}</p>

              <h4 style='margin-top:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color:#fff;'>🚨 Disease Risk Assessment: <span style="color:${color}">${diseaseRisk}</span></h4>
              <p style="color:#e2e8f0;">${riskAlert}</p>

              <h4 style='margin-top:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color:#fff;'>🎯 High Health Priorities</h4>
              <p style="color:#e2e8f0;">${priorities.join("<br>") || "✅ No high priorities! Keep it up!"}</p>

              <h4 style='margin-top:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color:#fff;'>😊 Wellness Persona</h4>
              <p style="color:#e2e8f0;">${persona}</p>

              <h4 style='margin-top:20px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; color:#fff;'>🔮 What-If Simulator</h4>
              <p style="color:#e2e8f0; line-height:1.5;">${simulations}</p>
            </div>
        </div>`;

    document.getElementById("result").innerHTML = reportHTML;
    document.getElementById('btnDownload').style.display = 'block';

    // DB INTERFACE WRITE
    let users = JSON.parse(localStorage.getItem('registered_users')) || {};
    let activeData = users[currentUser];
    
    // Save current state variables securely
    activeData.healthData = reportHTML;
    activeData.lastInputState = { name, age, gender, height, weight, bloodGroup, heartRate, sleepHours, waterIntake, stepsWalked, exerciseMinutes, stressLevel };
    
    // History logs structure mapping
    activeData.bmiHistory.push({
        name: name,
        date: new Date().toLocaleDateString(),
        weight: weight,
        height: height,
        bmi: bmi,
        status: status
    });

    localStorage.setItem('registered_users', JSON.stringify(users));

    loadHistory(); 
    updateChart();
    showToast("✅ Metrics calculated & saved!");
};

// MULTI-USER DYNAMIC HISTORY ENGINE
function loadHistory() {
    let users = JSON.parse(localStorage.getItem('registered_users')) || {};
    let activeData = users[currentUser];
    let tbody = document.getElementById('historyBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!activeData || !activeData.bmiHistory || activeData.bmiHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">No records logged yet.</td></tr>';
        return;
    }

    let displayHistory = [...activeData.bmiHistory].reverse();
    displayHistory.forEach((item, index) => {
        let actualIndex = activeData.bmiHistory.length - 1 - index;
        let row = `<tr>
            <td><b>${item.name || 'Unknown'}</b></td>
            <td>${item.date}</td>
            <td>${item.weight} kg</td>
            <td>${item.height} ft</td>
            <td>${item.bmi}</td>
            <td>${item.status}</td>
            <td><button class="delete-btn" style="background:#ef4444; color:#fff; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;" onclick="deleteRecord(${actualIndex})">Delete</button></td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// DELETE SECURE RECORDS IN SELECTED ACCOUNT
window.deleteRecord = function (index) {
    let users = JSON.parse(localStorage.getItem('registered_users')) || {};
    let activeData = users[currentUser];
    
    if (activeData && activeData.bmiHistory) {
        activeData.bmiHistory.splice(index, 1);
        localStorage.setItem('registered_users', JSON.stringify(users));
        loadHistory();
        updateChart();
        showToast("🗑️ Record Deleted!");
    }
};

// 📈 DYNAMIC REAL-TIME DUAL LINE GRAPH (CHART.JS)
function updateChart() {
    let users = JSON.parse(localStorage.getItem('registered_users')) || {};
    let activeData = users[currentUser];
    
    let labels = [];
    let bmiData = [];
    let weightData = [];

    if (activeData && activeData.bmiHistory && activeData.bmiHistory.length > 0) {
        let recentLogs = activeData.bmiHistory.slice(-7);
        recentLogs.forEach(log => {
            labels.push(log.date);
            bmiData.push(parseFloat(log.bmi));
            weightData.push(parseFloat(log.weight));
        });
    }

    let ctx = document.getElementById('healthChart');
    if (!ctx) return;

    if (healthChartInstance) {
        healthChartInstance.destroy();
    }

    healthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'BMI Trend',
                    data: bmiData,
                    borderColor: '#7928ca',
                    backgroundColor: 'rgba(121, 40, 202, 0.1)',
                    yAxisID: 'y_bmi',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Weight Trend (kg)',
                    data: weightData,
                    borderColor: '#ff007f',
                    backgroundColor: 'rgba(255, 0, 127, 0.1)',
                    yAxisID: 'y_weight',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#ffffff' } }
            },
            scales: {
                x: { ticks: { color: '#a0aec0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y_bmi: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'BMI Value', color: '#7928ca' },
                    ticks: { color: '#7928ca' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y_weight: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Weight (kg)', color: '#ff007f' },
                    ticks: { color: '#ff007f' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// 📄 STYLISH REPORT ENGINE WITH LIVE CHART INTEGRATION
window.downloadPDFReport = function() {
    let resultDiv = document.getElementById("result");
    if (!resultDiv || resultDiv.innerText.trim() === "" || resultDiv.innerHTML.includes("Result yaha dikhega")) {
        alert("❌ First enter data and submit to generate report!");
        return;
    }

    let name = document.getElementById('name').value || currentUser;
    let chartCanvas = document.getElementById('healthChart');
    let chartImageHTML = "";
    
    if (chartCanvas && healthChartInstance) {
        let chartDataURL = chartCanvas.toDataURL("image/png");
        chartImageHTML = `
            <div style="margin-top: 30px; text-align: center;">
                <h3 style="border-bottom: 2px solid #7928ca; padding-bottom: 5px; color: #7928ca; text-align:left;">📈 Progress & Metrics Trend Graph</h3>
                <img src="${chartDataURL}" style="width: 100%; max-width: 550px; margin-top: 15px; border: 1px solid #ddd; border-radius: 8px; padding: 10px;" />
            </div>
        `;
    }

    let htmlDocumentContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Health Report - ${name}</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #f4f6f9; color: #333; }
            .report-card { max-width: 650px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-top: 8px solid #7928ca; }
            .header { text-align: center; border-bottom: 2px solid #eeeeee; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #7928ca; font-size: 26px; }
            .data-section { font-size: 15px; line-height: 1.8; color: #222; }
            .btn-print { background: linear-gradient(90deg, #ff007f, #7928ca); color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 20px; font-size: 14px; }
            @media print { .btn-print { display: none; } body { padding: 0; background: none; } .report-card { box-shadow: none; padding: 0; border: none; } }
        </style>
    </head>
    <body>
        <center><button class="btn-print" onclick="window.print()">🖨️ Save Report as PDF</button></center>
        <div class="report-card">
            <div class="header">
                <h1>SMARTHEALTH SECURE SUMMARY</h1>
                <p style="margin: 5px 0 0 0; color: #666;">Verified System Session Account: ${currentUser.toUpperCase()}</p>
            </div>
            <div class="data-section">
                ${resultDiv.innerHTML}
            </div>
            ${chartImageHTML}
            <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px;">
                * This document is a safe diagnostic summary sheet generated by SmartHealth.ai dashboard application. *
            </div>
        </div>
    </body>
    </html>
    `;

    let blob = new Blob([htmlDocumentContent], { type: "text/html;charset=utf-8" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Health_Report_${currentUser}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// LOGOUT TRIGGER
window.handleLogout = function() {
    currentUser = null;
    localStorage.removeItem('current_active_user');
    
    document.getElementById('authOverlay').style.display = 'flex';
    document.getElementById('btnLogout').style.display = 'none';
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('userDisplay').innerText = '';
    
    document.getElementById('healthForm').reset();
    document.getElementById("result").innerHTML = `
        <div class="empty-state">
          <div style='font-size:60px'>📊</div>
          <h3>Result yaha dikhega</h3>
        </div>`;
    document.getElementById('btnDownload').style.display = 'none';
    
    // Hide dashboard container again on logout
    let container = document.getElementById('mainDashboardContainer') || document.querySelector('.container');
    if (container) container.style.display = 'none';

    if (healthChartInstance) {
        healthChartInstance.destroy();
        healthChartInstance = null;
    }
};

// Helper dynamic UI Toast messages
function showToast(msg) {
    let check = document.querySelector('.toast-popup');
    if(check) check.remove();
    let toast = document.createElement('div');
    toast.className = 'toast-popup';
    toast.style.cssText = "position:fixed;bottom:20px;right:20px;background:#2ecc71;color:white;padding:12px 25px;border-radius:8px;z-index:10000;font-weight:bold;";
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
}

// Emoji generator
function getEmoji(status) {
    if (status.includes("Normal")) return "🔥";
    if (status.includes("Underweight")) return "😢";
    if (status.includes("Overweight")) return "⚠️";
    return "🚨";
}

// ⚡ RECOVERY MODULE: SAVE NEW PASSWORD FUNCTION
window.saveNewPassword = function(username) {
    let newPassField = document.getElementById("newPassInput");
    let statusText = document.getElementById("recoveryStatus");
    
    if (!newPassField || !newPassField.value.trim()) {
        alert("Please enter a new password!");
        return;
    }

    let newPass = newPassField.value.trim();
    let users = JSON.parse(localStorage.getItem('registered_users')) || {};

    if (users[username]) {
        users[username].password = newPass; 
        localStorage.setItem('registered_users', JSON.stringify(users)); 
        
        statusText.style.color = "#10b981";
        statusText.innerText = "🎉 Password updated successfully! You can login now.";
        
        document.getElementById("recoverUser").value = "";
        setTimeout(() => {
            document.getElementById("recoveryBox").style.display = "none";
        }, 2000);
    }
};