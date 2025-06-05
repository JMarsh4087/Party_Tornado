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
const POINTS = { 1: 10, 2: 7, 3: 4 };
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
        <option value="1">1 (Most preferred)</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    `;
    container.appendChild(div);
  });
}

// Get user votes
function getVotes() {
  Object.keys(votes).forEach(key => delete votes[key]);

  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
    const value = parseInt(select.value);
    const index = parseInt(select.dataset.index);
    if ([1, 2, 3].includes(value)) {
      votes[index] = value;
    }
  });
}

// Validate votes
function isValidVotes() {
  const ranks = Object.values(votes);
  return ranks.length === 3 && new Set(ranks).size === 3;
}

// Display results
function showResults(scoreMap) {
  resultsDiv.innerHTML = "<h3>Vote Totals:</h3><ul>" +
    OPTIONS.map((opt, i) => `<li>${opt}: ${scoreMap[i] || 0} points</li>`).join('') +
    "</ul>";
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
    alert("Please rank exactly 3 unique options.");
    return;
  }

  database.ref("votes/" + userId).set(votes);
  alert("Thanks for voting!");
  submitBtn.disabled = true;
};

// Load and tally votes
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
    .then(() => {
      loginStatusSpan.textContent = "Logged in!";
      loginFormDiv.style.display = "none";
      clearVotesBtn.style.display = "inline";
      adminLogoutBtn.style.display = "inline";
      clearVotesBtn.disabled = false;
    })
    .catch((error) => {
      loginStatusSpan.textContent = "Login failed: " + error.message;
    });
};

// Clear all votes (admin)
clearVotesBtn.onclick = () => {
  if (confirm("Are you sure you want to clear all votes?")) {
    database.ref("votes").remove();
    alert("All votes cleared.");
    finalChoiceDiv.innerHTML = "";
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

// Initialize on load
window.onload = () => {
  renderOptions();
};