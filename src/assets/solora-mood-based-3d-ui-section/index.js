import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ─── Setup ───
const root = document.getElementById('root') ?? document.body;
root.style.margin = '0';
root.style.overflow = 'hidden';
root.style.fontFamily = "'Inter', sans-serif";
root.style.cursor = 'default';
root.style.background = '#0a0a1a';

// Load Inter font
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// ─── State ───
let selectedMood = null;
let mouseX = 0, mouseY = 0;
let targetBgColor = new THREE.Color(0x0a0a1a);
let currentBgColor = new THREE.Color(0x0a0a1a);
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredOrb = null;

// ─── Audio Context (lazy) ───
let audioCtx = null;
function playTone(freq, duration = 0.15, type = 'sine', volume = 0.08) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// ─── Mood Data ───
const moods = [
  { name: 'Relaxed', emoji: '😌', color: '#4fc3f7', glowColor: '#0288d1', desc: 'Beach, calm ocean', particleStyle: 'wave', freq: 396 },
  { name: 'Romantic', emoji: '💖', color: '#f48fb1', glowColor: '#c2185b', desc: 'Intimate, cozy', particleStyle: 'hearts', freq: 528 },
  { name: 'Adventurous', emoji: '🧭', color: '#ffb74d', glowColor: '#e65100', desc: 'Exploration, action', particleStyle: 'wind', freq: 639 },
  { name: 'Family Fun', emoji: '👨‍👩‍👧', color: '#fff176', glowColor: '#f9a825', desc: 'Lively, energetic', particleStyle: 'bounce', freq: 741 },
  { name: 'Need Peace', emoji: '🌿', color: '#a5d6a7', glowColor: '#2e7d32', desc: 'Nature, silence', particleStyle: 'leaves', freq: 432 },
  { name: 'Creative', emoji: '🎨', color: '#ce93d8', glowColor: '#7b1fa2', desc: 'Artistic, imaginative', particleStyle: 'paint', freq: 852 },
  { name: 'Self-Care', emoji: '🛁', color: '#b39ddb', glowColor: '#4527a0', desc: 'Spa, relaxation', particleStyle: 'bubbles', freq: 417 },
  { name: 'Solo Recharge', emoji: '🌙', color: '#5c6bc0', glowColor: '#1a237e', desc: 'Quiet, introspective', particleStyle: 'stars', freq: 369 },
];

// ─── HTML Overlay ───
const overlay = document.createElement('div');
overlay.id = 'solora-overlay';
overlay.innerHTML = `
  <div id="header-section">
    <div id="logo">SOLORA</div>
    <h1 id="main-title">Choose Your Mood</h1>
    <p id="sub-title">Find your perfect staycation experience</p>
  </div>
  <div id="mood-label-container">
    <div id="mood-label" style="opacity:0; transform:translateY(20px);">
      <span id="mood-emoji"></span>
      <span id="mood-name"></span>
      <span id="mood-desc"></span>
    </div>
  </div>
  <div id="selected-banner" style="opacity:0; pointer-events:none;">
    <span id="banner-emoji"></span>
    <span id="banner-text"></span>
    <button id="banner-close">✕</button>
  </div>
`;
overlay.style.cssText = `
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 10; display: flex; flex-direction: column;
  align-items: center; justify-content: flex-start;
`;
root.appendChild(overlay);

const style = document.createElement('style');
style.textContent = `
  * { box-sizing: border-box; }
  #header-section {
    text-align: center; padding-top: clamp(30px, 6vh, 70px); pointer-events: none;
    user-select: none;
  }
  #logo {
    font-family: 'Inter', sans-serif; font-weight: 700; font-size: 14px;
    letter-spacing: 6px; color: rgba(255,255,255,0.35); margin-bottom: 12px;
    text-transform: uppercase;
  }
  #main-title {
    font-family: 'Inter', sans-serif; font-weight: 600;
    font-size: clamp(28px, 5vw, 52px); color: #ffffff;
    margin: 0 0 10px 0; line-height: 1.15;
    background: linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  #sub-title {
    font-family: 'Inter', sans-serif; font-weight: 300;
    font-size: clamp(14px, 2vw, 18px); color: rgba(255,255,255,0.45);
    margin: 0; letter-spacing: 0.5px;
  }
  #mood-label-container {
    position: fixed; bottom: clamp(25px, 5vh, 50px); left: 50%;
    transform: translateX(-50%); pointer-events: none; z-index: 20;
  }
  #mood-label {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.06); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 50px; padding: 12px 28px;
    transition: opacity 0.3s ease, transform 0.3s ease;
    white-space: nowrap;
  }
  #mood-emoji { font-size: 22px; }
  #mood-name {
    font-family: 'Inter', sans-serif; font-weight: 600; font-size: 16px;
    color: #fff;
  }
  #mood-desc {
    font-family: 'Inter', sans-serif; font-weight: 300; font-size: 13px;
    color: rgba(255,255,255,0.45); margin-left: 4px;
  }
  #selected-banner {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: rgba(255,255,255,0.05); backdrop-filter: blur(30px);
    border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
    padding: 40px 60px; text-align: center; pointer-events: auto;
    transition: opacity 0.5s ease; z-index: 30;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  #banner-emoji { font-size: 48px; }
  #banner-text {
    font-family: 'Inter', sans-serif; font-weight: 500; font-size: 22px;
    color: #fff;
  }
  #banner-close {
    position: absolute; top: 14px; right: 18px; background: none;
    border: none; color: rgba(255,255,255,0.4); font-size: 18px;
    cursor: pointer; pointer-events: auto; padding: 4px 8px;
    font-family: 'Inter', sans-serif;
  }
  #banner-close:hover { color: #fff; }
`;
document.head.appendChild(style);

// ─── Three.js Scene ───
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a1a, 0.04);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
root.insertBefore(renderer.domElement, overlay);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';

// ─── Lights ───
const ambientLight = new THREE.AmbientLight(0x223355, 0.6);
ambientLight.name = 'ambientLight';
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
mainLight.position.set(5, 8, 10);
mainLight.name = 'mainLight';
scene.add(mainLight);

const rimLight = new THREE.PointLight(0x4488ff, 1.5, 30);
rimLight.position.set(-8, 5, -5);
rimLight.name = 'rimLight';
scene.add(rimLight);

const fillLight = new THREE.PointLight(0xff6644, 0.6, 25);
fillLight.position.set(8, -3, 5);
fillLight.name = 'fillLight';
scene.add(fillLight);

// ─── Background Stars ───
const starGeom = new THREE.BufferGeometry();
const starCount = 1500;
const starPos = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 60;
  starPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
  starPos[i * 3 + 2] = -10 - Math.random() * 30;
  starSizes[i] = Math.random() * 2 + 0.5;
}
starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeom.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

const starMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x667799) } },
  vertexShader: `
    attribute float size;
    uniform float uTime;
    varying float vAlpha;
    void main() {
      vAlpha = 0.3 + 0.7 * sin(uTime * 0.5 + position.x * 3.0 + position.y * 2.0);
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (200.0 / -mvPos.z);
      gl_Position = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
      gl_FragColor = vec4(uColor, alpha * 0.6);
    }
  `,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const stars = new THREE.Points(starGeom, starMat);
stars.name = 'backgroundStars';
scene.add(stars);

// ─── Orb Creation ───
const orbGroup = new THREE.Group();
orbGroup.name = 'orbGroup';
scene.add(orbGroup);

const orbData = [];

// Layout — elliptical arrangement
function getOrbPositions(count) {
  const positions = [];
  const isMobile = window.innerWidth < 768;
  const radiusX = isMobile ? 3.2 : 5.8;
  const radiusY = isMobile ? 3.8 : 2.8;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    positions.push(new THREE.Vector3(
      Math.cos(angle) * radiusX,
      Math.sin(angle) * radiusY * 0.85,
      Math.sin(angle * 2) * 0.5
    ));
  }
  return positions;
}

const positions = getOrbPositions(moods.length);

// Orb shader material
function createOrbMaterial(color, glowColor) {
  const col = new THREE.Color(color);
  const glow = new THREE.Color(glowColor);
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: col },
      uGlowColor: { value: glow },
      uHover: { value: 0 },
      uClick: { value: 0 },
      uSelected: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uHover;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        // Subtle organic deformation
        float wave = sin(pos.x * 3.0 + uTime * 1.5) * cos(pos.y * 2.0 + uTime * 1.2) * 0.03;
        pos += normal * wave * (1.0 + uHover * 0.5);
        
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        vViewPos = mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uGlowColor;
      uniform float uTime;
      uniform float uHover;
      uniform float uClick;
      uniform float uSelected;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;
      
      void main() {
        vec3 viewDir = normalize(-vViewPos);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
        
        // Base glass color
        vec3 baseColor = mix(uColor * 0.15, uColor * 0.4, fresnel);
        
        // Inner glow
        float innerGlow = pow(max(dot(viewDir, vNormal), 0.0), 2.0) * 0.3;
        baseColor += uColor * innerGlow;
        
        // Rim lighting
        float rim = pow(fresnel, 1.5);
        vec3 rimColor = mix(uGlowColor, uColor, 0.5) * rim * (1.2 + uHover * 1.5);
        
        // Hover energy
        float energy = uHover * sin(vUv.y * 20.0 + uTime * 3.0) * 0.08;
        
        // Click pulse
        float pulse = uClick * fresnel * 2.0;
        
        vec3 finalColor = baseColor + rimColor + energy * uColor + pulse * uColor;
        
        // Alpha: glass-like transparency
        float alpha = 0.35 + fresnel * 0.55 + uHover * 0.15 + innerGlow * 0.5 + uClick * 0.3;
        alpha = clamp(alpha, 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

// Glow ring
function createGlowRing(color) {
  const ringGeom = new THREE.RingGeometry(0.75, 0.95, 64);
  const ringMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uHover: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uHover;
      varying vec2 vUv;
      void main() {
        float dist = abs(vUv.y - 0.5) * 2.0;
        float alpha = (1.0 - dist) * 0.2 * uHover;
        float pulse = 0.5 + 0.5 * sin(uTime * 2.0 + vUv.x * 6.28);
        alpha *= 0.5 + 0.5 * pulse;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.name = 'glowRing';
  return ring;
}

// Particle system per orb
function createParticles(color, style) {
  const count = 60;
  const geom = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = 0.6 + Math.random() * 0.6;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    vel[i * 3] = (Math.random() - 0.5) * 0.02;
    vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    sizes[i] = Math.random() * 3 + 1;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('aVelocity', new THREE.BufferAttribute(vel, 3));
  geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uHover: { value: 0 },
      uClick: { value: 0 },
    },
    vertexShader: `
      attribute vec3 aVelocity;
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime;
      uniform float uHover;
      uniform float uClick;
      varying float vAlpha;
      
      void main() {
        vec3 pos = position;
        float t = uTime + aPhase;
        
        // Floating motion
        pos += aVelocity * sin(t) * (2.0 + uHover * 3.0);
        pos *= 1.0 + uClick * 0.8;
        
        // Orbit
        float angle = t * 0.3;
        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        pos.xz = rot * pos.xz;
        
        vAlpha = (0.2 + uHover * 0.6) * (0.5 + 0.5 * sin(t * 2.0));
        
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (1.0 + uHover * 1.5 + uClick * 2.0) * (120.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geom, mat);
  points.name = 'orbParticles';
  return { points, velocity: vel, positions: pos, phases };
}

// Create each orb
moods.forEach((mood, i) => {
  const group = new THREE.Group();
  group.name = `moodOrb_${mood.name}`;
  group.position.copy(positions[i]);
  group.userData = {
    index: i,
    mood,
    basePos: positions[i].clone(),
    hoverAmount: 0,
    clickAmount: 0,
    targetHover: 0,
    targetClick: 0,
    floatPhase: Math.random() * Math.PI * 2,
    floatSpeed: 0.4 + Math.random() * 0.3,
  };

  // Main orb sphere
  const isMobile = window.innerWidth < 768;
  const orbRadius = isMobile ? 0.5 : 0.62;
  const sphereGeom = new THREE.SphereGeometry(orbRadius, 48, 48);
  const orbMat = createOrbMaterial(mood.color, mood.glowColor);
  const sphere = new THREE.Mesh(sphereGeom, orbMat);
  sphere.name = `orbSphere_${mood.name}`;
  group.add(sphere);

  // Inner core glow
  const coreGeom = new THREE.SphereGeometry(orbRadius * 0.45, 24, 24);
  const coreMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(mood.color),
    transparent: true, opacity: 0.25,
  });
  const core = new THREE.Mesh(coreGeom, coreMat);
  core.name = `orbCore_${mood.name}`;
  group.add(core);

  // Glow ring
  const ring = createGlowRing(mood.color);
  ring.name = `orbRing_${mood.name}`;
  group.add(ring);

  // Particles
  const { points: particles } = createParticles(mood.color, mood.particleStyle);
  particles.name = `orbParticles_${mood.name}`;
  group.add(particles);

  // Point light per orb
  const orbLight = new THREE.PointLight(new THREE.Color(mood.color), 0.3, 4);
  orbLight.name = `orbLight_${mood.name}`;
  group.add(orbLight);

  orbGroup.add(group);
  orbData.push(group);
});

// ─── Ambient Floating Particles (background) ───
const ambientParticleCount = 300;
const ambientGeom = new THREE.BufferGeometry();
const ambientPos = new Float32Array(ambientParticleCount * 3);
const ambientPhases = new Float32Array(ambientParticleCount);
const ambientSizes = new Float32Array(ambientParticleCount);
for (let i = 0; i < ambientParticleCount; i++) {
  ambientPos[i * 3] = (Math.random() - 0.5) * 25;
  ambientPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
  ambientPos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
  ambientPhases[i] = Math.random() * Math.PI * 2;
  ambientSizes[i] = Math.random() * 2 + 0.5;
}
ambientGeom.setAttribute('position', new THREE.BufferAttribute(ambientPos, 3));
ambientGeom.setAttribute('aPhase', new THREE.BufferAttribute(ambientPhases, 1));
ambientGeom.setAttribute('aSize', new THREE.BufferAttribute(ambientSizes, 1));

const ambientMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x334466) } },
  vertexShader: `
    attribute float aPhase;
    attribute float aSize;
    uniform float uTime;
    varying float vAlpha;
    void main() {
      vec3 pos = position;
      pos.y += sin(uTime * 0.3 + aPhase) * 0.3;
      pos.x += cos(uTime * 0.2 + aPhase * 1.5) * 0.2;
      vAlpha = 0.3 + 0.3 * sin(uTime * 0.8 + aPhase);
      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * (100.0 / -mvPos.z);
      gl_Position = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, d) * vAlpha * 0.4;
      gl_FragColor = vec4(uColor, alpha);
    }
  `,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const ambientParticles = new THREE.Points(ambientGeom, ambientMat);
ambientParticles.name = 'ambientParticles';
scene.add(ambientParticles);

// ─── Interaction ───
const interactableSpheres = orbData.map(g => g.children.find(c => c.name.startsWith('orbSphere')));

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  mouse.set(mouseX, mouseY);
});

window.addEventListener('click', (e) => {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(interactableSpheres);
  if (hits.length > 0) {
    const orbGroupHit = hits[0].object.parent;
    const data = orbGroupHit.userData;
    data.targetClick = 1;
    
    selectedMood = data.mood;
    targetBgColor = new THREE.Color(data.mood.glowColor).multiplyScalar(0.15);
    
    // Sound
    playTone(data.mood.freq, 0.4, 'sine', 0.06);
    setTimeout(() => playTone(data.mood.freq * 1.5, 0.3, 'sine', 0.04), 100);
    
    // Show banner
    const banner = document.getElementById('selected-banner');
    document.getElementById('banner-emoji').textContent = data.mood.emoji;
    document.getElementById('banner-text').textContent = `${data.mood.name} mode activated`;
    banner.style.opacity = '1';
    banner.style.pointerEvents = 'auto';
    
    setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.pointerEvents = 'none';
    }, 2500);
  }
});

document.getElementById('banner-close').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('selected-banner').style.opacity = '0';
  document.getElementById('selected-banner').style.pointerEvents = 'none';
});

// Touch support
window.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
  mouse.set(mouseX, mouseY);
  // Trigger click logic
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(interactableSpheres);
  if (hits.length > 0) {
    const orbGroupHit = hits[0].object.parent;
    const data = orbGroupHit.userData;
    data.targetClick = 1;
    selectedMood = data.mood;
    targetBgColor = new THREE.Color(data.mood.glowColor).multiplyScalar(0.15);
    playTone(data.mood.freq, 0.4, 'sine', 0.06);
    
    const banner = document.getElementById('selected-banner');
    document.getElementById('banner-emoji').textContent = data.mood.emoji;
    document.getElementById('banner-text').textContent = `${data.mood.name} mode activated`;
    banner.style.opacity = '1';
    banner.style.pointerEvents = 'auto';
    setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.pointerEvents = 'none';
    }, 2500);
  }
}, { passive: true });

// Custom cursor glow
const cursorGlow = document.createElement('div');
cursorGlow.style.cssText = `
  position: fixed; width: 24px; height: 24px; border-radius: 50%;
  background: radial-gradient(circle, rgba(120,180,255,0.3) 0%, transparent 70%);
  pointer-events: none; z-index: 100; transform: translate(-50%, -50%);
  transition: width 0.2s, height 0.2s, background 0.3s;
`;
root.appendChild(cursorGlow);

window.addEventListener('mousemove', (e) => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top = e.clientY + 'px';
});

// ─── Animation Loop ───
function animate() {
  const time = clock.getElapsedTime();
  const delta = Math.min(clock.getDelta(), 0.05);

  // Update star uniforms
  starMat.uniforms.uTime.value = time;
  ambientMat.uniforms.uTime.value = time;

  // Smooth background color transition
  currentBgColor.lerp(targetBgColor, 0.02);
  scene.fog.color.copy(currentBgColor);
  renderer.setClearColor(currentBgColor);

  // Parallax camera movement
  camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.03;
  camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.03;
  camera.lookAt(0, 0, 0);

  // Raycaster for hover
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(interactableSpheres);
  const newHovered = hits.length > 0 ? hits[0].object.parent : null;

  if (newHovered !== hoveredOrb) {
    if (newHovered) {
      playTone(newHovered.userData.mood.freq * 2, 0.08, 'sine', 0.03);
      renderer.domElement.style.cursor = 'pointer';
      cursorGlow.style.width = '40px';
      cursorGlow.style.height = '40px';

      const mood = newHovered.userData.mood;
      const label = document.getElementById('mood-label');
      document.getElementById('mood-emoji').textContent = mood.emoji;
      document.getElementById('mood-name').textContent = mood.name;
      document.getElementById('mood-desc').textContent = `— ${mood.desc}`;
      label.style.opacity = '1';
      label.style.transform = 'translateY(0)';
      label.style.borderColor = mood.color + '30';
    } else {
      renderer.domElement.style.cursor = 'default';
      cursorGlow.style.width = '24px';
      cursorGlow.style.height = '24px';
      const label = document.getElementById('mood-label');
      label.style.opacity = '0';
      label.style.transform = 'translateY(20px)';
    }
    hoveredOrb = newHovered;
  }

  // Update each orb
  orbData.forEach((group) => {
    const d = group.userData;
    const isHovered = group === hoveredOrb;
    d.targetHover = isHovered ? 1 : 0;
    d.hoverAmount += (d.targetHover - d.hoverAmount) * 0.08;
    d.clickAmount += (d.targetClick - d.clickAmount) * 0.06;
    if (d.clickAmount > 0.95) d.targetClick = 0;

    // Floating idle animation
    const floatY = Math.sin(time * d.floatSpeed + d.floatPhase) * 0.15;
    const floatX = Math.cos(time * d.floatSpeed * 0.7 + d.floatPhase) * 0.08;
    group.position.x = d.basePos.x + floatX;
    group.position.y = d.basePos.y + floatY;
    group.position.z = d.basePos.z + Math.sin(time * 0.3 + d.floatPhase) * 0.1;

    // Scale on hover
    const scale = 1 + d.hoverAmount * 0.25 + d.clickAmount * 0.15;
    group.scale.setScalar(scale);

    // Gentle rotation
    group.rotation.y = time * 0.15 + d.index * 0.5;
    group.rotation.x = Math.sin(time * 0.2 + d.floatPhase) * 0.1;

    // Update shader uniforms
    const sphere = group.children[0]; // orbSphere
    sphere.material.uniforms.uTime.value = time;
    sphere.material.uniforms.uHover.value = d.hoverAmount;
    sphere.material.uniforms.uClick.value = d.clickAmount;

    // Core glow
    const core = group.children[1];
    core.material.opacity = 0.15 + d.hoverAmount * 0.3 + d.clickAmount * 0.4;
    core.scale.setScalar(0.9 + d.hoverAmount * 0.15 + Math.sin(time * 2) * 0.05);

    // Ring
    const ring = group.children[2];
    ring.material.uniforms.uTime.value = time;
    ring.material.uniforms.uHover.value = d.hoverAmount;
    ring.lookAt(camera.position);

    // Particles
    const particles = group.children[3];
    particles.material.uniforms.uTime.value = time;
    particles.material.uniforms.uHover.value = d.hoverAmount;
    particles.material.uniforms.uClick.value = d.clickAmount;

    // Point light intensity
    const light = group.children[4];
    light.intensity = 0.3 + d.hoverAmount * 1.5 + d.clickAmount * 2;
  });

  // Ambient color shift for ambient particles
  if (selectedMood) {
    ambientMat.uniforms.uColor.value.lerp(new THREE.Color(selectedMood.color).multiplyScalar(0.4), 0.02);
    starMat.uniforms.uColor.value.lerp(new THREE.Color(selectedMood.color).multiplyScalar(0.3), 0.01);
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// ─── Resize ───
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Recompute orb positions
  const newPositions = getOrbPositions(moods.length);
  orbData.forEach((group, i) => {
    group.userData.basePos.copy(newPositions[i]);
  });
});