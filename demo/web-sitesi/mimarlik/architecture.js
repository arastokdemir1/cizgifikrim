import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

const host = document.querySelector("#arch-model");
const cue = document.querySelector("#model-cue");
const reset = document.querySelector(".model-reset");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealSections = document.querySelectorAll("[data-reveal]");

if (!reducedMotion.matches && "IntersectionObserver" in window && revealSections.length) {
  document.documentElement.classList.add("architecture-reveal-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
  revealSections.forEach((section) => revealObserver.observe(section));
}

if (host) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0.8, 10, 20);
  camera.lookAt(0, 1.1, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.className = "arch-renderer";
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "Avlu çevresinde U biçimli yerleşen duvarları, avluyu, camları ve peyzajı gösteren döndürülebilir WebGL 3D konsept maketi");
  host.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xf7efdf, 0x596355, 2.15));
  const sunLight = new THREE.DirectionalLight(0xffe6bd, 3.1);
  sunLight.position.set(-8, 13, 8);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.left = -13;
  sunLight.shadow.camera.right = 13;
  sunLight.shadow.camera.top = 13;
  sunLight.shadow.camera.bottom = -13;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  const model = new THREE.Group();
  scene.add(model);
  const plaster = new THREE.MeshStandardMaterial({ color: 0xd9d1c2, roughness: 0.88 });
  const roof = new THREE.MeshStandardMaterial({ color: 0xf1ecdf, roughness: 0.92 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x858b78, roughness: 0.96 });
  const courtyardMat = new THREE.MeshStandardMaterial({ color: 0xa3ad91, roughness: 0.95 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x648780, roughness: 0.18, metalness: 0.12 });
  const trunk = new THREE.MeshStandardMaterial({ color: 0x705b43, roughness: 0.9 });
  const foliage = new THREE.MeshStandardMaterial({ color: 0x74866b, roughness: 0.9 });

  function box(width, height, depth, x, y, z, material, cast = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    model.add(mesh);
    return mesh;
  }

  // A concept massing study: three wings leave the south side of the court open.
  box(14, 0.42, 10, 0, -0.28, 0, stone, false);
  box(4.1, 3.25, 9.1, -4.55, 1.55, 0, plaster);
  box(4.1, 3.25, 9.1, 4.55, 1.55, 0, plaster);
  box(6.2, 3.25, 3.05, 0, 1.55, -3.05, plaster);
  box(4.35, 0.24, 9.35, -4.55, 3.3, 0, roof);
  box(4.35, 0.24, 9.35, 4.55, 3.3, 0, roof);
  box(6.45, 0.24, 3.3, 0, 3.3, -3.05, roof);
  box(5.6, 0.08, 5.85, 0, -0.005, 0.25, courtyardMat, false);

  // Glazing faces the private courtyard, where shared rooms meet the garden.
  box(0.08, 1.72, 4.6, -2.48, 1.15, 0.15, glass, false);
  box(0.08, 1.72, 4.6, 2.48, 1.15, 0.15, glass, false);
  box(4.8, 1.72, 0.08, 0, 1.15, -1.48, glass, false);
  const frame = new THREE.MeshStandardMaterial({ color: 0x526963, roughness: 0.6 });
  for (const x of [-2.48, 2.48]) {
    for (const z of [-1.95, -0.35, 1.25, 2.15]) box(0.11, 1.85, 0.075, x, 1.15, z, frame, false);
  }
  for (const x of [-2.25, -0.8, 0.8, 2.25]) box(0.075, 1.85, 0.11, x, 1.15, -1.48, frame, false);

  // A small courtyard tree and a low seat make the empty center legible.
  box(1.65, 0.22, 0.62, 0, 0.19, 2.08, stone, false);
  for (const [x, z, size] of [[-1.05, 0.2, 0.58], [1.05, 1.1, 0.43]]) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.05, 10), trunk);
    stem.position.set(x, 0.62, z);
    stem.castShadow = true;
    model.add(stem);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12), foliage);
    crown.position.set(x, 1.45, z);
    crown.scale.y = 1.15;
    crown.castShadow = true;
    model.add(crown);
  }

  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.018, 6, 80),
    new THREE.MeshBasicMaterial({ color: 0xc1935b, transparent: true, opacity: 0.64 }),
  );
  orbit.rotation.x = Math.PI / 2;
  orbit.position.set(0, 3.72, 0.35);
  model.add(orbit);
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xd8a64f }),
  );
  sun.position.set(-2.25, 3.72, 0.35);
  model.add(sun);

  let yaw = 0.12;
  let pitch = 0;
  let pointerDown = false;
  let lastX = 0;
  let lastY = 0;
  let animationFrame = 0;
  model.rotation.y = yaw;

  const resize = () => {
    const bounds = host.getBoundingClientRect();
    renderer.setSize(bounds.width, bounds.height, false);
    camera.aspect = bounds.width / Math.max(1, bounds.height);
    const viewDistance = bounds.width >= 1500 ? 16.5 : bounds.width >= 1250 ? 18 : 20;
    camera.position.set(0.8, viewDistance * 0.48, viewDistance);
    camera.lookAt(0, 1.1, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  const draw = (time = 0) => {
    if (!reducedMotion.matches) {
      const angle = time * 0.00022;
      sun.position.set(Math.cos(angle) * 2.25, 3.72, 0.35 + Math.sin(angle) * 2.25);
    }
    renderer.render(scene, camera);
    animationFrame = window.requestAnimationFrame(draw);
  };
  const updateModel = () => {
    model.rotation.y = yaw;
    model.rotation.x = pitch;
    renderer.render(scene, camera);
  };
  const announce = () => {
    cue.textContent = `SÜRÜKLE VEYA OK TUŞLARIYLA DÖNDÜR · AÇI ${Math.round(THREE.MathUtils.radToDeg(yaw))}° · KONSEPT MAKETİ`;
  };

  host.addEventListener("pointerdown", (event) => {
    if (event.target === reset || event.pointerType === "mouse" && event.button !== 0) return;
    pointerDown = true;
    lastX = event.clientX;
    lastY = event.clientY;
    host.setPointerCapture(event.pointerId);
    host.classList.add("is-dragging");
  });
  host.addEventListener("pointermove", (event) => {
    if (!pointerDown) return;
    yaw += (event.clientX - lastX) * 0.009;
    pitch = THREE.MathUtils.clamp(pitch + (event.clientY - lastY) * 0.006, -0.28, 0.26);
    lastX = event.clientX;
    lastY = event.clientY;
    updateModel();
  });
  const endDrag = () => {
    pointerDown = false;
    host.classList.remove("is-dragging");
  };
  host.addEventListener("pointerup", endDrag);
  host.addEventListener("pointercancel", endDrag);
  host.addEventListener("keydown", (event) => {
    const step = THREE.MathUtils.degToRad(6);
    if (event.key === "ArrowLeft") yaw -= step;
    else if (event.key === "ArrowRight") yaw += step;
    else if (event.key === "ArrowUp") pitch = THREE.MathUtils.clamp(pitch - step, -0.28, 0.26);
    else if (event.key === "ArrowDown") pitch = THREE.MathUtils.clamp(pitch + step, -0.28, 0.26);
    else return;
    event.preventDefault();
    updateModel();
    announce();
  });
  reset.addEventListener("click", () => {
    yaw = 0.12;
    pitch = 0;
    updateModel();
    cue.textContent = "SÜRÜKLEYEREK VEYA OK TUŞLARIYLA DÖNDÜR · KONSEPT 3D MAKETİ";
    host.focus({ preventScroll: true });
  });

  new ResizeObserver(resize).observe(host);
  resize();
  host.classList.add("is-ready");
  if (!reducedMotion.matches) animationFrame = window.requestAnimationFrame(draw);
  reducedMotion.addEventListener("change", () => {
    window.cancelAnimationFrame(animationFrame);
    if (!reducedMotion.matches) animationFrame = window.requestAnimationFrame(draw);
    else renderer.render(scene, camera);
  });
}
