import * as THREE from "https://cdn.skypack.dev/three@0.133.1/build/three.module";
import { GUI } from "https://cdn.skypack.dev/lil-gui@0.16.1";

const container = document.querySelector('.container');

const config = {
  height: 2,
  density: 4,
  curl: 15,
};

class Controls {
  constructor() {
    const gui = new GUI();
    if (window.innerWidth < 600) gui.close();

    gui.add(config, 'height', 1, 2).step(0.01).onChange(v => {
      viz.material.uniforms.u_height.value = v;
    });
    gui.add(config, 'density', 1, 8).step(0.1).onChange(v => {
      viz.material.uniforms.u_density.value = v;
    });
    gui.add(config, 'curl', 5, 25).step(0.1).onChange(v => {
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
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 }); // for troubleshooting
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
        u_height: { value: config.height },
        u_density: { value: config.density },
        u_curl: { value: config.curl },
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
    const geometry = new THREE.TubeGeometry(curve, 640, 0.55, 640, false);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(0, -0.65, 0);
    this.mesh.rotation.set(0, this.rotationY, 0);
    this.scene.add(this.mesh);
  }

  addCanvasEvents() {
    container.addEventListener('mousemove', (e) => {
      updateMousePosition(e.clientX, e.clientY, this);
    });

    container.addEventListener('touchmove', (e) => {
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
      .multiplyScalar(10);

    // Wind based on movement
    const windFromMovement = this.mouseDelta
      .clone()
      .rotateAround(new THREE.Vector2(0, 0), this.rotationY)
      .multiplyScalar(10);

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
const controls = new Controls();
const viz = new Viz();
viz.addCanvasEvents();
viz.updateSize();
viz.loop();

window.addEventListener('mousemove', (event) => {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = -(event.clientY / window.innerHeight) * 2 + 1;
  viz.mouseTarget.set(x, y); // This drives raycasting + tornado wind
});

// ✅ Keep responsive
window.addEventListener('resize', () => viz.updateSize());
