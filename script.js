import * as THREE from "https://cdn.skypack.dev/three@0.133.1/build/three.module";
import { GUI } from "https://cdn.skypack.dev/lil-gui@0.16.1";
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
        <option value="">Choose Rank</option>
        <option value="1">1️⃣ (Yaaaas!)</option>
        <option value="2">2️⃣ (Like it.)</option>
        <option value="3">3️⃣ (I guess so.)</option>
        <option value="Veto">🚫Veto🚫</option>
      </select>
    `;
    container.appendChild(div);
    if (!Array.isArray(OPTIONS)) {
    container.innerHTML = "<p style='color:red;'>OPTIONS not defined.</p>";
    return;
    }
  });
}

const gifLinks = [
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjV2eXFua3J4OW14ZHlubnA2ejlpMmhuaXJhdzgyM2JtMTMycHFtaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/d3mlXPjoK1ROfr9u/giphy.webp",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjV2eXFua3J4OW14ZHlubnA2ejlpMmhuaXJhdzgyM2JtMTMycHFtaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MXvDhlmD0eB5qNvvjZ/giphy.webp",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjV2eXFua3J4OW14ZHlubnA2ejlpMmhuaXJhdzgyM2JtMTMycHFtaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7aCRvp4PHhmTUtMY/200.webp",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjV2eXFua3J4OW14ZHlubnA2ejlpMmhuaXJhdzgyM2JtMTMycHFtaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ensH2FRpbq4V9WIoCM/200.webp",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWo1OGJ3a2ZmMjZsb2g1ZXdtcDU3M2xva2VyZGJnaXphZ2FjbWpsMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/68FsmDsSBACTC/200.webp",
  "https://media2.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NzJoODRndW5lOWh5c3B0d2c0bHZ4YTZnNzhsYmVjaTJqem1hNGswcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0G16Vajk8KdqsC3e/200.webp",
  "https://media2.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3NzJoODRndW5lOWh5c3B0d2c0bHZ4YTZnNzhsYmVjaTJqem1hNGswcCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/t0PGq0CLQMXba/giphy.webp",
  "https://media4.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Zmx4ajRkMDM3eGc4bHNha2Z3ZGRnb2U0dzhvYmhqcmZ6bnBzbHh4dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/HhhajSmRfikXC/giphy.webp",
  "https://media4.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Zmx4ajRkMDM3eGc4bHNha2Z3ZGRnb2U0dzhvYmhqcmZ6bnBzbHh4dCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/uFdss38UliWR2/giphy.webp",
  "https://media0.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bDVzMW85aHZpMTQ5cWJ1YjY4bXExZTVra3Q1bnR1a2ZiZGloMmE2eCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7nE3w2AXGslyg/200.webp",
  "https://media1.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eGNqeDl5aDYxMnh3dmwwamRxMXFid3RvN2xzYXZmcWxrYnNwN3ZqayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/er5dUr5XWSlH2x33Fr/200.webp",
  "https://media4.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cGIzY3c3dG4yY21qYTJkOWM1bHVwdjdtN3RsZ3ZzdW1leHVybG9pOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3UreUb6rZ7kcB0KlPX/200.webp",
  "https://media4.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cHB3NmJqZW5xenBkN21rMXE0aWZmMTg5azY5eWJpM3JubTBvYm9mayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/4OMBMoJTOdF0vF4RVf/200.webp",
  "https://media4.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cHB3NmJqZW5xenBkN21rMXE0aWZmMTg5azY5eWJpM3JubTBvYm9mayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/cOEHZYZ9l2H182HQbY/giphy.webp",
  "https://media3.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bXpkYXdva2FrZDZkandmMGYybWg4MDUxdGEwN3F4dWY3Z3dza3J1NiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/nM6a5kDV8JhTccIx0g/200.webp"
];

function renderRandomGif() {
  const randomIndex = Math.floor(Math.random() * gifLinks.length);
  const gif = gifLinks[randomIndex];
  const container = document.getElementById('tornado-gif-container');
  container.innerHTML = `<img src="${gif}" alt="Tornado" style="width: 200px; display: block; margin: 10px auto;">`;
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
    const extraClass = score < 0 ? 'veto' : '';
    return `<li class="${cls} ${extraClass}">${OPTIONS[index]}: ${score} points</li>`;
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
      finalChoiceDiv.innerHTML = `<h3>🏆Winner:</h3><p>${OPTIONS[choiceIndex]}</p>🏆`;
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
  renderRandomGif();
  renderOptions();
};

//const tornadoContainer = document.querySelector('.container');

const config = {
    height: 1.1,
    density: 2.5,
    curl: 12,
};

class Controls {
    constructor() {
        const gui = new GUI();
        if (window.innerWidth < 600) gui.close();

        gui.add(config, 'height', 1, 1.8).step(.01).onChange(v => {
            viz.material.uniforms.u_height.value = v;
        });
        gui.add(config, 'density', 1, 4).step(.1).onChange(v => {
            viz.material.uniforms.u_density.value = v;
        });
        gui.add(config, 'curl', 4, 20).step(.1).onChange(v => {
            viz.material.uniforms.u_curl.value = v;
        });
    }
}

class Viz {

    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      
        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.z = 2.9;
        this.camera.position.y = 1.1;
        this.camera.lookAt(0, 0, 0);

        this.rotationY = -.4 * Math.PI;

        this.raycaster = new THREE.Raycaster();

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseTarget = new THREE.Vector2(0, 0);

        this.clock = new THREE.Clock();

        this.setupScene();
        this.render();
    }

    setupScene() {

        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });
        const planeGeometry = new THREE.PlaneGeometry(2000, 1000);
        this.floor = new THREE.Mesh(planeGeometry, planeMaterial);
        this.floor.position.set(0, -2, 0);
        this.floor.rotation.set(-.2 * Math.PI, 0, 0);
        this.scene.add(this.floor);

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { type: 'f', value: 0 },
                u_height: { type: 'f', value: config.height },
                u_density: { type: 'f', value: config.density },
                u_curl: { type: 'f', value: config.curl },
                u_wind: { type: 'v2', value: new THREE.Vector2(0, 0) },
            },
            vertexShader: document.getElementById("vertexShader").textContent,
            fragmentShader: document.getElementById("fragmentShader").textContent,
            side: THREE.DoubleSide,
            transparent: true
        });
        const curve = new THREE.LineCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0),
        );
        const geometry = new THREE.TubeGeometry(curve, 512, .55, 512, false);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(0, -.65, 0);
        this.mesh.rotation.set(0, this.rotationY, 0);
        this.scene.add(this.mesh);
    }


    addCanvasEvents() {
        container.addEventListener('mousemove', (e) => {
            updateMousePosition(e.clientX, e.clientY, this);
        });
        container.addEventListener('touchmove', (e) => {
            updateMousePosition(e.touches[0].pageX, e.touches[0].pageY, this);
        });
		

        function updateMousePosition(eX, eY, viz) {
            const x = eX - container.offsetLeft;
            const y = eY - container.offsetTop;
            viz.mouseTarget.x = x / container.offsetWidth * 2 - 1;
            viz.mouseTarget.y = -(y / container.offsetHeight) * 2 + 1;
        }
    }

    render() {
        this.material.uniforms.u_time.value = 1.3 * this.clock.getElapsedTime();

        this.mouse.x += (this.mouseTarget.x - this.mouse.x) * .1;
        this.mouse.y += (this.mouseTarget.y - this.mouse.y) * .1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.floor);
        if (intersects.length) {
            this.material.uniforms.u_wind.value = new THREE.Vector2(intersects[0].uv.x - .5, .5 - intersects[0].uv.y)
                .rotateAround(new THREE.Vector2(0, 0), this.rotationY)
                .multiplyScalar(200);
        }

        this.renderer.render(this.scene, this.camera);
    }

    loop() {
        this.render();
        requestAnimationFrame(this.loop.bind(this));
    }

    updateSize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
}

const controls = new Controls();
const viz = new Viz();
viz.addCanvasEvents();
viz.updateSize();
viz.loop();

window.addEventListener('resize', () => viz.updateSize());