// Simple low-poly Tux penguin built entirely from Three.js primitives —
// no external 3D model files needed. Auto-rotates, and tilts slightly
// toward the mouse cursor for a subtle parallax feel.

(function () {
  const canvas = document.getElementById("tux-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const wrap = document.getElementById("tux-canvas-wrap");

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.3, 6);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function resize() {
    const size = wrap.clientWidth;
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }

  // ---- Lighting ----
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const fillLight = new THREE.AmbientLight(0x8ec07c, 0.55);
  scene.add(fillLight);

  const rim = new THREE.DirectionalLight(0xfe8019, 0.6);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  // ---- Tux group ----
  const tux = new THREE.Group();

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1d2021,
    roughness: 0.55,
    metalness: 0.05,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xebdbb2,
    roughness: 0.6,
  });
  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xfe8019,
    roughness: 0.4,
  });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1d2021 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xebdbb2 });

  // Body
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 24, 20),
    blackMat
  );
  body.scale.set(0.95, 1.25, 0.95);
  tux.add(body);

  // Belly (flattened sphere on the front)
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 20, 16),
    bellyMat
  );
  belly.scale.set(0.75, 1.05, 0.55);
  belly.position.set(0, -0.05, 0.55);
  tux.add(belly);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), blackMat);
  head.position.set(0, 1.25, 0.05);
  tux.add(head);

  // Head belly patch (face)
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 14), bellyMat);
  face.scale.set(0.8, 0.9, 0.6);
  face.position.set(0, 1.18, 0.42);
  tux.add(face);

  // Eyes
  [-0.22, 0.22].forEach((x) => {
    const eyeWhite = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 10),
      eyeWhiteMat
    );
    eyeWhite.position.set(x, 1.32, 0.62);
    tux.add(eyeWhite);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), eyeMat);
    pupil.position.set(x, 1.32, 0.7);
    tux.add(pupil);
  });

  // Beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 12), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 1.16, 0.78);
  tux.add(beak);

  // Wings
  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 14, 12),
      blackMat
    );
    wing.scale.set(0.35, 0.95, 0.55);
    wing.position.set(side * 1.05, 0.05, -0.1);
    wing.rotation.z = side * 0.35;
    tux.add(wing);
  });

  // Feet
  [-0.4, 0.4].forEach((x) => {
    const foot = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.22, 4),
      beakMat
    );
    foot.rotation.x = -Math.PI / 2;
    foot.position.set(x, -1.35, 0.25);
    tux.add(foot);
  });

  tux.scale.setScalar(0.85);
  scene.add(tux);

  // ---- Interaction state ----
  let targetRotY = 0;
  let targetRotX = 0;
  let pointerActive = false;

  function onPointerMove(e) {
    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    targetRotY = x * 1.2;
    targetRotX = y * 0.6;
    pointerActive = true;
  }

  wrap.addEventListener("pointermove", onPointerMove);
  wrap.addEventListener("pointerleave", () => {
    pointerActive = false;
  });

  let autoRot = 0;

  function animate() {
    requestAnimationFrame(animate);

    if (!prefersReducedMotion) {
      autoRot += 0.004;
    }

    const baseY = pointerActive ? targetRotY : Math.sin(autoRot) * 0.35 + autoRot * 0.15;
    tux.rotation.y += (baseY - tux.rotation.y) * 0.06;
    tux.rotation.x += (targetRotX * 0.4 - tux.rotation.x) * 0.06;

    renderer.render(scene, camera);
  }

  window.addEventListener("resize", resize);
  resize();
  animate();
})();
