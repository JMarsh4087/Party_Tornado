const POINTS = { 1: 10, 2: 7, 3: 4 };
const votes = {};
const userId = "user-" + Math.random().toString(36).substring(2, 8); // Random anonymous ID

submitBtn.onclick = () => {
  const voteData = {};
  const selects = document.querySelectorAll('select');

  selects.forEach(select => {
    const value = parseInt(select.value);
    const index = parseInt(select.dataset.index);
    if (value >= 1 && value <= 3) {
      voteData[index] = value;
    }
  });

  const ranks = Object.values(voteData);
  if (new Set(ranks).size !== 3) {
    alert("Please rank exactly 3 different options.");
    return;
  }

  firebase.database().ref("votes/" + userId).set(voteData)
    .then(() => {
      alert("Vote submitted!");
      submitBtn.disabled = true;
      pickBtn.disabled = false;
    });
};

const container = document.getElementById('options-container');
const submitBtn = document.getElementById('submit-votes');
const pickBtn = document.getElementById('pick-random');
const resultsDiv = document.getElementById('results');
const finalChoiceDiv = document.getElementById('final-choice');

function renderOptions() {
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

function getVotes() {
  const selects = document.querySelectorAll('select');
  votes = {}; // reset votes object

  selects.forEach(select => {
    const value = parseInt(select.value);
    const index = parseInt(select.dataset.index);
    if (value === 1 || value === 2 || value === 3) {
      votes[index] = value;
    }
  });
}

submitBtn.onclick = () => {
  getVotes();

  const ranks = Object.values(votes);
  if (ranks.length !== 3 || new Set(ranks).size !== 3) {
    alert("Please assign unique ranks 1, 2, and 3.");
    return;
  }

  // Save votes to Firebase
  firebase.database().ref("votes/" + userId).set(votes)
    .then(() => {
      alert("Vote submitted!");
      submitBtn.disabled = true;
      pickBtn.disabled = false;
    })
    .catch(error => {
      alert("Error saving votes: " + error.message);
    });
};

function isValidVotes() {
  const ranks = Object.values(votes);
  return new Set(ranks).size === 3; // Only 3 unique ranks allowed
}

function showResults(scoreMap) {
  resultsDiv.innerHTML = "<h3>Vote Totals:</h3><ul>" +
    OPTIONS.map((opt, i) => `<li>${opt}: ${scoreMap[i] || 0} points</li>`).join('') +
    "</ul>";
}

function pickWeightedRandom(scoreMap) {
  const indexes = Object.keys(scoreMap);
  const weights = indexes.map(i => scoreMap[i]);
  const total = weights.reduce((sum, w) => sum + w, 0);
  const threshold = Math.random() * total;

  let cumulative = 0;
  for (let i = 0; i < indexes.length; i++) {
    cumulative += weights[i];
    if (threshold < cumulative) {
      return indexes[i];
    }
  }
  return null;
}

submitBtn.onclick = () => {
  getVotes();

  if (!isValidVotes()) {
    alert("Please assign a unique rank 1, 2, and 3.");
    return;
  }

  const scoreMap = {};
  for (let [i, rank] of Object.entries(votes)) {
    scoreMap[i] = (scoreMap[i] || 0) + POINTS[rank];
  }

  showResults(scoreMap);
  pickBtn.disabled = false;
};

pickBtn.onclick = () => {
  firebase.database().ref("votes").once("value", snapshot => {
    const allVotes = snapshot.val();
    const scoreMap = {};

    for (let user in allVotes) {
      const userVotes = allVotes[user];
      for (let i in userVotes) {
        const rank = userVotes[i];
        scoreMap[i] = (scoreMap[i] || 0) + POINTS[rank];
      }
    }

    showResults(scoreMap);

    const choice = pickWeightedRandom(scoreMap);
    finalChoiceDiv.innerHTML = `<h2>🎉 Final Pick: ${OPTIONS[choice]} 🎉</h2>`;
  });
};

renderOptions();

/*// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUslqFnWcO7pl7WCIzsIJ-gQa0elCpJT4",
  authDomain: "party-tornado.firebaseapp.com",
  projectId: "party-tornado",
  storageBucket: "party-tornado.firebasestorage.app",
  messagingSenderId: "294712968263",
  appId: "1:294712968263:web:0ad47c9333fc08d7031d62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
*/