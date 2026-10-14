/* =========================================================
   GLOBE — Three.js Dot-Pattern Globe (Vanilla JS)
   کره سه‌بعدی با الگوی نقطه‌ای (Dot Pattern)
   ========================================================= */
import * as THREE from "three";

/* ---------- توابع کمکی ---------- */
function createCircleTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const g = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.55, "rgba(255,255,255,1)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* ---------- ساخت نقطه‌ها از تکسچر نقشه ---------- */
function buildDotsFromTexture(texture, cfg) {
  const img = texture.image;
  const w = img.width;
  const h = img.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const cols = cfg.gridSize;
  const rows = Math.floor(cfg.gridSize / 2);
  const radius = 1.008;
  const positions = [];

  for (let y = 0; y < rows; y++) {
    const v = (y + 0.5) / rows;
    const theta = v * Math.PI;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    for (let x = 0; x < cols; x++) {
      const u = (x + 0.5) / cols;
      const phi = u * Math.PI * 2;

      const px = Math.min(w - 1, Math.floor(u * w));
      const py = Math.min(h - 1, Math.floor(v * h));
      const i = (py * w + px) * 4;

      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > cfg.threshold) continue;

      const sx = sinT * Math.cos(phi) * radius;
      const sy = cosT * radius;
      const sz = sinT * Math.sin(phi) * radius;
      positions.push(sx, sy, sz);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(cfg.dotColor),
    size: cfg.dotSize,
    sizeAttenuation: true,
    map: createCircleTexture(),
    transparent: true,
    alphaTest: 0.3,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geo, mat);
}

/* ---------- fallback: کل کره با پترن فیبوناچی ---------- */
function buildFallbackDots(cfg) {
  const N = 4500;
  const radius = 1.008;
  const positions = [];
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    positions.push(
      Math.cos(theta) * r * radius,
      y * radius,
      Math.sin(theta) * r * radius
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(cfg.dotColor),
    size: cfg.dotSize,
    sizeAttenuation: true,
    map: createCircleTexture(),
    transparent: true,
    alphaTest: 0.3,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geo, mat);
}

/* =========================================================
   تابع اصلی
   ========================================================= */
export function initThreeGlobe(container, userConfig = {}) {
  if (!container) {
    console.warn("[ThreeGlobe] container not found");
    return null;
  }

  const cfg = Object.assign(
    {
      dotColor: "#c9bfe0",
      dotSize: 0.014,
      oceanColor: "#1a1625",
      oceanOpacity: 0.92,
      speed: 0.15,
      tilt: 23.5,
      gridSize: 200,
      threshold: 128,
      mapUrl: "https://unpkg.com/three-globe/example/img/earth-water.png",
      stopOnHover: true,
      dragEnabled: true,
    },
    userConfig
  );

  /* --- Scene --- */
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 3);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.borderRadius = "50%";
  renderer.domElement.style.cursor = "grab";
  container.appendChild(renderer.domElement);

  /* --- گروه اصلی --- */
  const globeGroup = new THREE.Group();
  globeGroup.rotation.z = THREE.MathUtils.degToRad(cfg.tilt);
  scene.add(globeGroup);

  /* --- اقیانوس --- */
  const oceanMat = new THREE.MeshBasicMaterial({
    color: cfg.oceanColor,
    transparent: true,
    opacity: cfg.oceanOpacity,
  });
  const ocean = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), oceanMat);
  globeGroup.add(ocean);

  /* --- هاله glow --- */
  const glowMat = new THREE.MeshBasicMaterial({
    color: cfg.dotColor,
    transparent: true,
    opacity: 0.05,
    side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.06, 48, 48), glowMat);
  globeGroup.add(glow);

  /* --- بارگذاری تکسچر و ساخت نقطه‌ها --- */
  let dotsMesh = null;
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");

  loader.load(
    cfg.mapUrl,
    (tex) => {
      try {
        dotsMesh = buildDotsFromTexture(tex, cfg);
        globeGroup.add(dotsMesh);
      } catch (err) {
        console.warn("[ThreeGlobe] buildDots failed, fallback used:", err);
        dotsMesh = buildFallbackDots(cfg);
        globeGroup.add(dotsMesh);
      }
    },
    undefined,
    (err) => {
      console.warn("[ThreeGlobe] map load failed, fallback used:", err);
      dotsMesh = buildFallbackDots(cfg);
      globeGroup.add(dotsMesh);
    }
  );

  /* --- انیمیشن --- */
  let rafId = 0;
  let paused = false;
  const clock = new THREE.Clock();

  function animate() {
    rafId = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    if (!paused) globeGroup.rotation.y += cfg.speed * dt;
    renderer.render(scene, camera);
  }
  animate();

  /* --- Hover --- */
  if (cfg.stopOnHover) {
    container.addEventListener("mouseenter", () => { paused = true; });
    container.addEventListener("mouseleave", () => { paused = false; });
  }

  /* --- Drag --- */
  if (cfg.dragEnabled) {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    container.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.style.cursor = "grabbing";
      try { container.setPointerCapture(e.pointerId); } catch (_) {}
    });

    container.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      globeGroup.rotation.y += dx * 0.005;
      globeGroup.rotation.x = Math.max(
        -0.8,
        Math.min(0.8, globeGroup.rotation.x + dy * 0.005)
      );
    });

    const endDrag = (e) => {
      dragging = false;
      renderer.domElement.style.cursor = "grab";
      try { container.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    container.addEventListener("pointerup", endDrag);
    container.addEventListener("pointercancel", endDrag);
  }

  /* --- Resize --- */
  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(container);

  /* --- API --- */
  return {
    dispose() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      try { renderer.dispose(); } catch (_) {}
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
    get group() { return globeGroup; },
    get scene() { return scene; },
    pause() { paused = true; },
    resume() { paused = false; },
  };
}