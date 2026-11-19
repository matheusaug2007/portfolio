// Peça central da Hero: uma gota de metal líquido azul (three.js, arquivo local).
// A superfície ondula devagar (deformação no shader), reflete um "estúdio" pintado em canvas
// e se inclina na direção do mouse; mexer o mouse rápido agita a gota.
// Sem WebGL a área fica vazia e o nome continua inteiro.
import * as THREE from '../vendor/three.module.min.js';

const canvas = document.getElementById('orbCanvas');
const box = document.getElementById('heroOrb');

if (canvas && box) {
  try {
    start();
  } catch (e) {
    box.style.display = 'none';
  }
}

// Ambiente que o metal reflete: céu claro, horizonte escuro, "softboxes" brancas e um brilho azul.
function makeEnvironment(dark) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');

  const sky = g.createLinearGradient(0, 0, 0, 512);
  if (dark) {
    // tema escuro: letras brancas por cima, a gota pode ter fundo bem escuro
    sky.addColorStop(0, '#ffffff');
    sky.addColorStop(0.28, '#dce8ff');
    sky.addColorStop(0.44, '#7aa0ea');
    sky.addColorStop(0.56, '#1a3470');
    sky.addColorStop(0.74, '#0a1838');
    sky.addColorStop(1, '#2a5cc8');
  } else {
    // tema claro: letras azul-marinho por cima, a gota fica sempre num azul médio/claro
    // (sem zonas escuras), para o nome nunca se perder em cima dela
    sky.addColorStop(0, '#ffffff');
    sky.addColorStop(0.3, '#e9f1ff');
    sky.addColorStop(0.48, '#9dbfff');
    sky.addColorStop(0.6, '#5f95f5');
    sky.addColorStop(0.8, '#4a85f0');
    sky.addColorStop(1, '#78a8ff');
  }
  g.fillStyle = sky;
  g.fillRect(0, 0, 1024, 512);

  // luzes de estúdio (geram os reflexos nítidos)
  g.fillStyle = '#ffffff';
  g.fillRect(90, 70, 190, 60);
  g.fillRect(560, 90, 70, 150);
  g.fillRect(800, 40, 140, 36);
  g.fillRect(330, 150, 26, 120);
  // reflexos mais fracos no "chão", para a metade de baixo não ficar chapada
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  g.fillRect(150, 330, 220, 22);
  g.fillRect(700, 360, 90, 60);

  // brilho azul da marca vindo de baixo
  const glow = g.createRadialGradient(330, 430, 10, 330, 430, 260);
  glow.addColorStop(0, 'rgba(0, 102, 255, 1)');
  glow.addColorStop(1, 'rgba(0, 102, 255, 0)');
  g.fillStyle = glow;
  g.fillRect(0, 250, 1024, 262);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function start() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 50);
  camera.position.set(0, 0, 7.3);

  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null;
  function setEnvironment(dark) {
    const tex = makeEnvironment(dark);
    const rt = pmrem.fromEquirectangular(tex);
    tex.dispose();
    if (envRT) envRT.dispose();
    envRT = rt;
    scene.environment = rt.texture;
  }

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x4d8dff,
    metalness: 1,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });

  // deformação: duas ondas 3D somadas; a normal é recalculada pelo gradiente, para o reflexo acompanhar
  const uniforms = { uTime: { value: 0 }, uAmp: { value: 0.085 } };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uAmp = uniforms.uAmp;
    shader.vertexShader = 'uniform float uTime;\nuniform float uAmp;\n' + shader.vertexShader
      .replace('#include <beginnormal_vertex>', `
        vec3 pn = normalize(position);
        float t = uTime;
        float f1 = 1.7, f2 = 3.1;
        vec3 a1 = f1 * position + vec3(t * 0.9, t * 1.1, t * 0.7);
        vec3 a2 = f2 * position + vec3(-t * 0.6, t * 0.8, -t * 0.9);
        vec3 s1 = sin(a1), c1 = cos(a1), s2 = sin(a2), c2 = cos(a2);
        float d1 = s1.x * s1.y * s1.z;
        float d2 = s2.x * s2.y * s2.z;
        vec3 g1 = f1 * vec3(c1.x * s1.y * s1.z, s1.x * c1.y * s1.z, s1.x * s1.y * c1.z);
        vec3 g2 = f2 * vec3(c2.x * s2.y * s2.z, s2.x * c2.y * s2.z, s2.x * s2.y * c2.z);
        float orbD = uAmp * (d1 + 0.45 * d2);
        vec3 grad = uAmp * (g1 + 0.45 * g2);
        vec3 gt = grad - pn * dot(grad, pn);
        vec3 objectNormal = normalize(pn - gt / (1.0 + orbD));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif
      `)
      .replace('#include <begin_vertex>', 'vec3 transformed = position * (1.0 + orbD);');
  };

  const orb = new THREE.Mesh(new THREE.SphereGeometry(1, 160, 120), material);
  scene.add(orb);

  function applyTheme() {
    const dark = document.body.classList.contains('dark-theme');
    setEnvironment(dark);
    material.color.set(dark ? 0x4d8dff : 0x7aaeff);
    material.envMapIntensity = dark ? 1.25 : 1;
    requestFrame();
  }
  new MutationObserver(applyTheme).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  function resize() {
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    requestFrame();
  }
  new ResizeObserver(resize).observe(box);

  // ── movimento ──
  const hero = document.getElementById('home');
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  let agitation = 0;
  let last = null;

  if (finePointer && !reduceMotion && hero) {
    hero.addEventListener('pointermove', (e) => {
      // durante a viagem pelo scroll a gota não acompanha o mouse
      if (parseFloat(box.dataset.p || '0') > 0.05) { target.x = 0; target.y = 0; return; }
      const r = hero.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (last) {
        const v = Math.hypot(e.clientX - last.x, e.clientY - last.y);
        agitation = Math.min(1, agitation + v / 900);
      }
      last = { x: e.clientX, y: e.clientY };
    });
    hero.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; last = null; });
  }

  // só anima enquanto a Hero está na tela
  let visible = true;
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) requestFrame();
  }).observe(box);

  let raf = 0;
  let prev = performance.now();
  let time = 1.2;

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;

    if (!reduceMotion) time += dt;
    agitation *= 0.96;
    cur.x += (target.x - cur.x) * 0.06;
    cur.y += (target.y - cur.y) * 0.06;

    uniforms.uTime.value = time;
    uniforms.uAmp.value = 0.085 + agitation * 0.07;
    orb.rotation.y = time * 0.12 + cur.x * 0.5;
    orb.rotation.x = cur.y * 0.35;
    orb.position.x = cur.x * 0.08;
    orb.position.y = -cur.y * 0.06;

    renderer.render(scene, camera);
    if (!reduceMotion && visible) requestFrame();
  }

  function requestFrame() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  applyTheme();
  resize();
  requestFrame();
}
