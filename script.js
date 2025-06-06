console.log("Loading script.js...");
console.log("OPTIONS inside script.js:", typeof OPTIONS !== "undefined" ? OPTIONS : "NOT DEFINED");

// Firebase references
const auth = firebase.auth();
const database = firebase.database();

// DOM elements
const submitBtn = document.getElementById('submit-votes');
const pickBtn = document.getElementById('pick-random');
const resultsDiv = document.getElementById('results');
const finalChoiceDiv = document.getElementById('final-choice');
const container = document.getElementById('options-container');
const adminEmailInput = document.getElementById('admin-email');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginBtn = document.getElementById('admin-login-btn');
const loginStatusSpan = document.getElementById('login-status');
const clearVotesBtn = document.getElementById('clear-votes-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const loginFormDiv = document.getElementById('login-form');

const adminUID = 'J8RixVVu3pQcmqwnq94AeoHm5WM2';

// Constants
const POINTS = { 1: 5, 2: 3, 3: 1, Veto: -10 };
const votes = {};
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "user-" + Math.random().toString(36).substring(2, 8);
  localStorage.setItem("userId", userId);
}

// Render voting options
function renderOptions() {
  container.innerHTML = '';
  OPTIONS.forEach((option, i) => {
    const div = document.createElement('div');
    div.className = 'option';
    div.innerHTML = `
      <label>${option}</label>
      <select data-index="${i}">
        <option value="">Rank</option>
        <option value="1">1 (Yaaaas!)</option>
        <option value="2">2 (Like it.)</option>
        <option value="3">3 (I guess so.)</option>
        <option value="Veto">Veto (NOPE.)</option>
      </select>
    `;
    container.appendChild(div);
    if (!Array.isArray(OPTIONS)) {
    container.innerHTML = "<p style='color:red;'>OPTIONS not defined.</p>";
    return;
    }
  });
}

// Get user votes
function getVotes() {
  Object.keys(votes).forEach(key => delete votes[key]);

  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    const value = select.value;
    const index = parseInt(select.dataset.index);
    if (["1", "2", "3", "Veto"].includes(value)) {
      votes[index] = value === "Veto" ? "Veto" : parseInt(value);
    }
  });
}

// Validate votes
function isValidVotes() {
  const ranks = Object.values(votes);
  return ranks.length >= 3;
}

// Display results
function showResults(scoreMap) {
  const fullScores = OPTIONS.map((_, i) => [i, scoreMap[i] || 0]);

  const ranked = fullScores.sort((a, b) => b[1] - a[1]);

  const listItems = ranked.map(([index, score], i) => {
    let cls = '';
    if (i === 0) cls = 'first';
    else if (i === 1) cls = 'second';
    else if (i === 2) cls = 'third';
    return `<li class="${cls}">${OPTIONS[index]}: ${score} points</li>`;
  });

  resultsDiv.innerHTML = `<h3>Vote Totals:</h3><ul class="vote-results">${listItems.join('')}</ul>`;
}

// Pick weighted random choice
function pickWeightedRandom(scoreMap) {
  const entries = Object.entries(scoreMap);
  const total = entries.reduce((sum, [_, score]) => sum + score, 0);
  let threshold = Math.random() * total;
  for (const [index, score] of entries) {
    threshold -= score;
    if (threshold <= 0) {
      return index;
    }
  }
  return null;
}

// Submit votes
submitBtn.onclick = () => {
  getVotes();
  if (!isValidVotes()) {
    alert("Please rank at least 3 options.");
    return;
  }

  database.ref("votes/" + userId).set(votes);
  alert("Thanks for voting!");
  submitBtn.disabled = true;
};

// Firebase Vote Listener (Live Updates)
database.ref("votes").on("value", (snapshot) => {
  const data = snapshot.val();
  const scores = {};

  for (const uid in data) {
    const vote = data[uid];
    for (const index in vote) {
      const rank = vote[index];
      const points = POINTS[rank];
      scores[index] = (scores[index] || 0) + points;
    }
  }

  showResults(scores);
  pickBtn.disabled = Object.keys(scores).length === 0;

  pickBtn.onclick = () => {
    const choiceIndex = pickWeightedRandom(scores);
    if (choiceIndex !== null) {
      finalChoiceDiv.innerHTML = `<h3>Winner:</h3><p>${OPTIONS[choiceIndex]}</p>`;
    } else {
      finalChoiceDiv.innerHTML = `<p>No votes to pick from.</p>`;
    }
  };
});

// Admin Login
adminLoginBtn.onclick = () => {
  const email = adminEmailInput.value;
  const password = adminPasswordInput.value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      if (userCredential.user.uid === adminUID) {
        loginStatusSpan.textContent = "Logged in!";
        loginFormDiv.style.display = "none";
        clearVotesBtn.style.display = "inline";
        adminLogoutBtn.style.display = "inline";
        clearVotesBtn.disabled = false;
      } else {
        loginStatusSpan.textContent = "Access denied: Not an admin.";
        auth.signOut();
      }
    })
    .catch((error) => {
      loginStatusSpan.textContent = "Login failed: " + error.message;
    });
};

// Clear all votes (admin)
clearVotesBtn.onclick = () => {
  if (confirm("Are you sure you want to clear all votes?")) {
    database.ref("votes").remove()
      .then(() => {
        alert("All votes cleared.");
        finalChoiceDiv.innerHTML = "";
        submitBtn.disabled = false;
        renderOptions();
        localStorage.removeItem("userId");
      })
      .catch((error) => {
        alert("Error clearing votes: " + error.message);
      });
  }
};

// Admin Logout
adminLogoutBtn.onclick = () => {
  auth.signOut().then(() => {
    loginFormDiv.style.display = "block";
    clearVotesBtn.style.display = "none";
    adminLogoutBtn.style.display = "none";
    loginStatusSpan.textContent = "";
  });
};

// On load
window.onload = () => {
  renderOptions();
};
