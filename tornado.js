import * as THREE from "https://cdn.skypack.dev/three@0.133.1/build/three.module";
import { GUI } from "https://cdn.skypack.dev/lil-gui@0.16.1";

const container = document.querySelector('.container');

const config = {
  Danger: 50,
  Intensity: 50,
  Speed: 50,
};

const guiContainer = document.querySelector('.gui-float');
const gui = new GUI({ title: 'Tornado Mayhem', container: guiContainer });

class Controls {
  constructor(viz) {
    if (window.innerWidth < 600) gui.close();

    gui.add(config, 'Danger', 1, 100).step(1).onChange(v => {
      // Remap 1–100 → 1–2.5
      const scaled = 1 + (v - 1) * (2.5 - 1) / (100 - 1);
      viz.material.uniforms.u_height.value = scaled;
    });

    gui.add(config, 'Intensity', 1, 100).step(1).onChange(v => {
      // Remap 1–100 → 1–8
      const scaled = 1 + (v - 1) * (8 - 1) / (100 - 1);
      viz.material.uniforms.u_density.value = scaled;
    });

    gui.add(config, 'Speed', 1, 100).step(1).onChange(v => {
      // Remap 1–100 → 5–25
      const scaled = 5 + (v - 1) * (25 - 5) / (100 - 1);
      viz.material.uniforms.u_curl.value = scaled;
    });
  }
}

class Viz {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(0, 1.1, 2.9);
    this.camera.lookAt(0, 0, 0);

    this.rotationY = -0.4 * Math.PI;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.mouseTarget = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.prevMouse = new THREE.Vector2();
    this.mouseDelta = new THREE.Vector2();

    this.setupScene();
    this.render();
  }

  setupScene() {
    const floorGeometry = new THREE.PlaneGeometry(2000, 1000);
    //const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // black
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 }); // for troubleshooting
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.position.set(0, -2, 0);
    this.floor.rotation.set(-0.2 * Math.PI, 0, 0);
    this.scene.add(this.floor);

    const vertexShader = document.getElementById("vertexShader")?.textContent;
    const fragmentShader = document.getElementById("fragmentShader")?.textContent;

this.hitMarker = new THREE.Mesh(
  new THREE.SphereGeometry(10, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xff00ff })
);
this.scene.add(this.hitMarker);
this.hitMarker.visible = false;

    if (!vertexShader || !fragmentShader) {
      console.error("❌ Shader script tags not found in HTML");
      return;
    }

this.material = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_height: { value: 1 + (config.Danger - 1) * (2.5 - 1) / (100 - 1) },
    u_density: { value: 1 + (config.Intensity - 1) * (8 - 1) / (100 - 1) },
    u_curl: { value: 5 + (config.Speed - 1) * (25 - 5) / (100 - 1) },
    u_wind: { value: new THREE.Vector2(0, 0) },
  },
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide,
  transparent: true,
});

    const curve = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0)
    );
    const geometry = new THREE.TubeGeometry(curve, 640, 1.20, 640, false);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(0, -0.65, 0);
    this.mesh.rotation.set(0, this.rotationY, 0);
    this.scene.add(this.mesh);
  }

  addCanvasEvents() {
    window.addEventListener('mousemove', (e) => {
      updateMousePosition(e.clientX, e.clientY, this);
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        updateMousePosition(e.touches[0].pageX, e.touches[0].pageY, this);
      }
    }, { passive: true }); // ✅ This allows page scrolling

    const updateMousePosition = (eX, eY, viz) => {
      const x = eX - container.offsetLeft;
      const y = eY - container.offsetTop;
      viz.mouseTarget.x = (x / container.offsetWidth) * 2 - 1;
      viz.mouseTarget.y = -(y / container.offsetHeight) * 2 + 1;
    };
  }

  render() {
  this.material.uniforms.u_time.value = 1.3 * this.clock.getElapsedTime();

  // Smooth interpolate mouse
  this.mouse.x += (this.mouseTarget.x - this.mouse.x) * 0.1;
  this.mouse.y += (this.mouseTarget.y - this.mouse.y) * 0.1;

  // Mouse movement delta
  this.mouseDelta.copy(this.mouseTarget).sub(this.prevMouse).multiplyScalar(0.5);
  this.prevMouse.copy(this.mouseTarget);

  // Raycast to floor
  this.raycaster.setFromCamera(this.mouse, this.camera);
  const intersects = this.raycaster.intersectObject(this.floor);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    const local = this.floor.worldToLocal(point.clone());

    // Floor size is 2000 x 1000
    const u = (local.x / 2000) + 0.5;
    const v = (local.y / 1000) + 0.5;

    // Wind based on pointer position (centered)
    const windFromPosition = new THREE.Vector2(u - 0.5, 0.5 - v)
      .rotateAround(new THREE.Vector2(0, 0), this.rotationY)
      .multiplyScalar(15);

    // Wind based on movement
    const windFromMovement = this.mouseDelta
      .clone()
      .rotateAround(new THREE.Vector2(0, 0), this.rotationY)
      .multiplyScalar(15);

    // Combine and smooth
    const combinedWind = windFromPosition.add(windFromMovement);
    this.material.uniforms.u_wind.value.lerp(combinedWind, 0.1);
  } else {
    console.warn("❌ No floor hit");
  }

if (intersects.length > 0) {
  const point = intersects[0].point;
  const local = this.floor.worldToLocal(point.clone());

  // Floor size is 2000 x 1000
  const u = (local.x / 2000) + 0.5;
  const v = (local.y / 1000) + 0.5;

  const windFromPosition = new THREE.Vector2(u - 0.5, 0.5 - v)
    .rotateAround(new THREE.Vector2(0, 0), this.rotationY)
    .multiplyScalar(20);

  const windFromMovement = this.mouseDelta
    .clone()
    .rotateAround(new THREE.Vector2(0, 0), this.rotationY)
    .multiplyScalar(20);

  const combinedWind = windFromPosition.add(windFromMovement);
  this.material.uniforms.u_wind.value.lerp(combinedWind, 0.1);

  // ✅ Move hit marker to intersection point
  this.hitMarker.position.copy(point);
  this.hitMarker.position.y += 5; // lift a little off the floor
  this.hitMarker.visible = true;
} else {
  console.warn("❌ No floor hit");
  this.hitMarker.visible = false;
}

  this.renderer.render(this.scene, this.camera);
}

  loop() {
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  updateSize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}

// ✅ Initialize everything
const viz = new Viz();
const controls = new Controls(viz);
viz.addCanvasEvents();
viz.updateSize();
viz.loop();

window.addEventListener('mousemove', (event) => {
  // 👇 Skip tornado interaction if mouse is over GUI
  const isOverGUI = event.target.closest('.gui-float');
  if (isOverGUI) return;

  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  viz.mouseTarget.set(x, y);
});

// ✅ Keep responsive
window.addEventListener('resize', () => viz.updateSize());
