// Intro 3D : entrée dans le data center DC-01, puis plongée dans l'écran du NOC vers le portfolio.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js";
const root = document.documentElement;
const overlay = document.getElementById("intro");
window.__introBoot = true;

if (overlay && root.classList.contains("intro-active")) demarrer();
else if (overlay) overlay.remove();

function demarrer() {
  const canvas = overlay.querySelector("canvas");
  const journal = overlay.querySelector(".intro-log");
  const barre = overlay.querySelector(".intro-progression span");
  const stat = overlay.querySelector(".intro-stat");
  const bouton = overlay.querySelector(".intro-passer");
  const hud = overlay.querySelector(".intro-hud");
  const voile = overlay.querySelector(".intro-voile");
  let fini = false;
  let arreter = null;

  const log = (texte, classe) => {
    const p = document.createElement("p");
    if (classe) p.className = classe;
    p.textContent = texte;
    journal.appendChild(p);
    requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add("on")));
  };

  const touches = (e) => {
    if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); terminer(true); }
  };
  const molette = () => terminer(true);

  function terminer(rapide) {
    if (fini) return;
    fini = true;
    try { sessionStorage.setItem("intro-vue", "1"); } catch (e) { /* navigation privée */ }
    window.removeEventListener("keydown", touches);
    window.removeEventListener("wheel", molette);
    window.removeEventListener("touchmove", molette);
    overlay.classList.add(rapide ? "sortie-rapide" : "sortie");
    root.classList.remove("intro-active");
    root.classList.add("intro-fin");
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event("intro:fin"));
    setTimeout(() => { if (arreter) arreter(); overlay.remove(); }, rapide ? 450 : 900);
    setTimeout(() => root.classList.remove("intro-fin"), 2200);
  }

  bouton.addEventListener("click", () => terminer(true));
  window.addEventListener("keydown", touches);
  window.addEventListener("wheel", molette, { passive: true });
  window.addEventListener("touchmove", molette, { passive: true });

  log("> connexion au site DC-01…");
  const secours = setTimeout(() => terminer(true), 6500);

  const polices = Promise.race([
    Promise.all([
      document.fonts.load('600 40px "JetBrains Mono"'),
      document.fonts.load('400 40px "JetBrains Mono"'),
      document.fonts.load("800 80px Inter")
    ]),
    new Promise((r) => setTimeout(r, 1200))
  ]).catch(() => {});

  Promise.all([import(THREE_URL), polices])
    .then(([THREE]) => {
      clearTimeout(secours);
      if (fini) return;
      arreter = scene3D(THREE, { canvas, overlay, log, barre, stat, hud, voile, terminer });
    })
    .catch(() => terminer(true));
}

/* ---------- utilitaires ---------- */
function alea(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const borne = (x) => Math.min(1, Math.max(0, x));
const lisse = (a, b, x) => { const t = borne((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const MONO = '"JetBrains Mono", ui-monospace, Consolas, monospace';
const SANS = 'Inter, system-ui, "Segoe UI", Arial, sans-serif';

function toile(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")];
}

function rectArrondi(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/* Façade d'une baie 42U : serveurs, switchs, baies de disques. Renvoie la texture et la position des LED. */
function textureBaie(THREE, graine) {
  const W = 296, H = 1024;
  const [c, g] = toile(W, H);
  const rnd = alea(graine);
  g.fillStyle = "#060a10"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1a2434"; g.fillRect(0, 0, 14, H); g.fillRect(W - 14, 0, 14, H);
  g.fillStyle = "#04070b";
  for (let y = 22; y < H - 22; y += 8) { g.fillRect(4, y, 6, 3); g.fillRect(W - 10, y, 6, 3); }
  const haut = 30, bas = H - 30, U = (bas - haut) / 42;
  const leds = [];
  let u = 0;
  while (u < 42) {
    const r = rnd();
    let h = r < 0.32 ? 1 : r < 0.66 ? 2 : r < 0.84 ? 1 : r < 0.93 ? 4 : 3;
    if (u + h > 42) h = 42 - u;
    const y0 = haut + u * U, hh = h * U;
    if (rnd() < 0.1) {
      g.fillStyle = "#0b111a"; g.fillRect(16, y0 + 1, W - 32, hh - 2);
      g.fillStyle = "rgba(0,0,0,.35)";
      for (let x = 24; x < W - 24; x += 6) g.fillRect(x, y0 + 3, 2, hh - 6);
    } else {
      const d = g.createLinearGradient(0, y0, 0, y0 + hh);
      d.addColorStop(0, "#1f2a3c"); d.addColorStop(1, "#111925");
      g.fillStyle = d; g.fillRect(16, y0 + 1, W - 32, hh - 2);
      g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(16, y0 + 1, W - 32, 1);
      g.fillStyle = "#2b3a52"; g.fillRect(19, y0 + 3, 6, hh - 6);
      if (h === 1 && rnd() < 0.6) {
        const n = 12, x0 = 74, pw = (W - 104 - x0) / n;
        for (let k = 0; k < n; k++) {
          g.fillStyle = "#04070b"; g.fillRect(x0 + k * pw + 1, y0 + 3, pw - 3, hh - 6);
          leds.push({ x: x0 + k * pw + pw / 2, y: y0 + 4, t: "port" });
        }
        leds.push({ x: 36, y: y0 + hh / 2, t: "etat" });
      } else {
        g.fillStyle = "rgba(0,0,0,.5)";
        for (let x = 116; x < W - 26; x += 7) g.fillRect(x, y0 + 4, 3, hh - 8);
        if (h >= 2) {
          const nb = Math.min(6, Math.floor((hh - 8) / 14));
          for (let b = 0; b < nb; b++) for (let col = 0; col < 2; col++) {
            g.fillStyle = "#090e16"; g.fillRect(42 + col * 34, y0 + 5 + b * 14, 30, 11);
            g.fillStyle = "#1a2433"; g.fillRect(44 + col * 34, y0 + 7 + b * 14, 18, 2);
            leds.push({ x: 67 + col * 34, y: y0 + 10.5 + b * 14, t: "disque" });
          }
        }
        leds.push({ x: 33, y: y0 + Math.min(hh / 2, 7), t: "etat" });
      }
    }
    u += h;
  }
  const reflet = g.createLinearGradient(0, 0, W, H);
  reflet.addColorStop(0, "rgba(140,190,255,.06)"); reflet.addColorStop(0.45, "rgba(140,190,255,0)");
  reflet.addColorStop(0.55, "rgba(140,190,255,.035)"); reflet.addColorStop(1, "rgba(140,190,255,0)");
  g.fillStyle = reflet; g.fillRect(0, 0, W, H);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, leds: leds.map((l) => ({ u: l.x / W, v: 1 - l.y / H, t: l.t })) };
}

function texturePorte(THREE, gauche) {
  const W = 256, H = 683;
  const [c, g] = toile(W, H);
  const d = g.createLinearGradient(0, 0, W, H);
  d.addColorStop(0, "#1a2433"); d.addColorStop(1, "#0c121c");
  g.fillStyle = d; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.06)"; g.lineWidth = 2; g.strokeRect(10, 10, W - 20, H - 20);
  g.fillStyle = "rgba(34,211,238,.06)"; g.fillRect(40, 70, W - 80, 200);
  g.strokeStyle = "rgba(34,211,238,.22)"; g.strokeRect(40, 70, W - 80, 200);
  g.fillStyle = "rgba(255,255,255,.05)";
  g.beginPath(); g.moveTo(40, 230); g.lineTo(120, 70); g.lineTo(150, 70); g.lineTo(70, 270); g.lineTo(40, 270); g.fill();
  const bord = gauche ? W - 6 : 2;
  g.shadowColor = "#3ddc84"; g.shadowBlur = 12; g.fillStyle = "#3ddc84"; g.fillRect(bord, 0, 4, H); g.shadowBlur = 0;
  g.fillStyle = "#273449"; g.fillRect(gauche ? W - 36 : 28, 300, 8, 150);
  g.textAlign = "center";
  if (gauche) {
    g.fillStyle = "#dbe4f0"; g.font = `600 52px ${MONO}`; g.fillText("DC-01", W / 2 - 6, 360);
    g.fillStyle = "#8796ad"; g.font = `400 15px ${MONO}`; g.fillText("SALLE SERVEURS", W / 2 - 6, 392);
    g.fillStyle = "#3ddc84"; g.fillText("ZONE B · ALLÉE FROIDE", W / 2 - 6, 418);
  } else {
    g.strokeStyle = "#f5a524"; g.lineWidth = 4; g.lineJoin = "round";
    g.beginPath(); g.moveTo(W / 2 + 6, 318); g.lineTo(W / 2 + 46, 386); g.lineTo(W / 2 - 34, 386); g.closePath(); g.stroke();
    g.fillStyle = "#f5a524"; g.font = `600 34px ${MONO}`; g.fillText("!", W / 2 + 6, 378);
    g.font = `600 15px ${MONO}`; g.fillText("ACCÈS RESTREINT", W / 2 + 6, 420);
    g.fillStyle = "#8796ad"; g.font = `400 13px ${MONO}`; g.fillText("badge requis", W / 2 + 6, 444);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function textureEnseigne(THREE) {
  const [c, g] = toile(1024, 128);
  g.fillStyle = "#070c14"; g.fillRect(0, 0, 1024, 128);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `600 52px ${MONO}`;
  g.shadowColor = "#3ddc84"; g.shadowBlur = 18; g.fillStyle = "#3ddc84";
  g.fillText("▮ DATA CENTER · DC-01", 512, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function textureSol(THREE) {
  const [c, g] = toile(256, 256);
  g.fillStyle = "#0d141f"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#1c2940"; g.lineWidth = 4; g.strokeRect(2, 2, 252, 252);
  g.fillStyle = "#070b12";
  for (let y = 26; y < 240; y += 16) for (let x = 26; x < 240; x += 16) {
    g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function textureHalo(THREE, couleur) {
  const [c, g] = toile(128, 128);
  const d = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  d.addColorStop(0, couleur); d.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = d; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* Écran du NOC : même look que le terminal du site, pour une transition sans couture. */
function creerEcran(THREE) {
  const W = 1280, H = 720;
  const [c, g] = toile(W, H);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  let dernier = "";
  const cmd = "ssh portfolio@192.168.10.20";
  function dessiner(t) {
    const n = Math.max(0, Math.min(cmd.length, Math.floor((t - 4.3) * 16)));
    const etape = t > 6.05 ? 3 : t > 5.75 ? 2 : n >= cmd.length ? 1 : 0;
    const curseur = Math.floor(t * 2.4) % 2;
    const cle = n + "|" + etape + "|" + curseur;
    if (cle === dernier) return;
    dernier = cle;
    g.fillStyle = "#070d17"; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(34,211,238,.06)"; g.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
    for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
    const fx = 150, fy = 110, fw = 980, fh = 500;
    g.fillStyle = "rgba(10,17,30,.96)"; rectArrondi(g, fx, fy, fw, fh, 18); g.fill();
    g.strokeStyle = "#1e2d45"; g.lineWidth = 2; g.stroke();
    g.save(); rectArrondi(g, fx, fy, fw, fh, 18); g.clip();
    g.fillStyle = "#0d1626"; g.fillRect(fx, fy, fw, 50);
    g.restore();
    ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(fx + 30 + i * 24, fy + 25, 7, 0, 7); g.fill(); });
    g.fillStyle = "#8796ad"; g.font = `400 20px ${MONO}`; g.fillText("ahmed@sio: ~", fx + 110, fy + 32);
    let y = fy + 110;
    const x = fx + 44;
    g.font = `400 28px ${MONO}`;
    g.fillStyle = "#3ddc84"; g.fillText("ahmed@sio:~$", x, y);
    const px = x + g.measureText("ahmed@sio:~$ ").width;
    g.fillStyle = "#dbe4f0"; g.fillText(cmd.slice(0, n), px, y);
    if (etape === 0 && curseur) { g.fillStyle = "#3ddc84"; g.fillRect(px + g.measureText(cmd.slice(0, n)).width + 4, y - 24, 14, 30); }
    if (etape >= 1) { y += 46; g.fillStyle = "#8796ad"; g.fillText("Connexion à 192.168.10.20… ", x, y); g.fillStyle = "#22d3ee"; g.fillText("ok", x + g.measureText("Connexion à 192.168.10.20… ").width, y); }
    if (etape >= 2) { y += 46; g.fillStyle = "#8796ad"; g.fillText("Bienvenue sur le portfolio.", x, y); }
    if (etape >= 3) {
      g.fillStyle = "#ffffff"; g.font = `800 84px ${SANS}`; g.fillText("Ahmed Bouziani", x, y + 120);
      g.fillStyle = "#22d3ee"; g.font = `400 26px ${MONO}`; g.fillText("BTS SIO · option SISR", x, y + 172);
    }
    tex.needsUpdate = true;
  }
  dessiner(0);
  return { tex, dessiner };
}

/* ---------- scène ---------- */
function scene3D(THREE, ui) {
  const { canvas } = ui;
  const petit = Math.min(innerWidth, innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !petit, powerPreference: "high-performance" });
  let dpr = Math.min(window.devicePixelRatio || 1, petit ? 1.25 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const FOND = 0x03060c, DENS = 0.05;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOND);
  scene.fog = new THREE.FogExp2(FOND, DENS);
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.05, 70);

  const monde = new THREE.Group();
  scene.add(monde);

  // Dimensions
  const ALLEE = 1.1, PAS = 0.64, HB = 2.1, LB = 0.6, PB = 1.0;
  const N = petit ? 34 : 40, Z0 = 1.8;
  const Z_MUR = -26.2, Z_ECRAN = -26.07, Z_PORTE = 2.7;
  const Z_FIN = Z_ECRAN + 0.1;

  // Lumières
  const ambiance = new THREE.AmbientLight(0x2a3a55, 0.35);
  const hemi = new THREE.HemisphereLight(0x7fa6d8, 0x05080e, 0.15);
  const entree = new THREE.PointLight(0x9fd8ff, 7, 10, 1.6);
  entree.position.set(0, 3, 5.2);
  scene.add(ambiance, hemi, entree);
  const lampes = [-1, -8, -15, -22].map((z) => {
    const l = new THREE.PointLight(0xc4e6ff, 0, 11, 1.4);
    l.position.set(0, 2.85, z);
    monde.add(l);
    return { l, z };
  });
  const lumiereEcran = new THREE.PointLight(0x22d3ee, 0, 7, 1.5);
  lumiereEcran.position.set(0, 1.6, Z_ECRAN + 0.8);
  monde.add(lumiereEcran);

  // Sol (réfléchissant : un monde miroir est dessiné dessous, le sol semi-transparent par-dessus)
  const texSol = textureSol(THREE);
  const LSOL = 10, PSOL = 34;
  texSol.repeat.set(LSOL / 0.6, PSOL / 0.6);
  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry(LSOL, PSOL),
    new THREE.MeshLambertMaterial({ map: texSol, transparent: true, opacity: 0.86, depthWrite: true })
  );
  sol.rotation.x = -Math.PI / 2;
  sol.position.set(0, 0, 6 - PSOL / 2);
  sol.renderOrder = 1;
  scene.add(sol);

  const plafond = new THREE.Mesh(new THREE.PlaneGeometry(LSOL, PSOL), new THREE.MeshLambertMaterial({ color: 0x060a11 }));
  plafond.rotation.x = Math.PI / 2;
  plafond.position.set(0, 3.3, 6 - PSOL / 2);
  monde.add(plafond);

  // Baies
  const rnd = alea(42);
  const variantes = [textureBaie(THREE, 7), textureBaie(THREE, 1337)];
  const geoFace = new THREE.PlaneGeometry(LB - 0.02, HB - 0.08);
  const geoCorps = new THREE.BoxGeometry(PB, HB, LB);
  const matCorps = new THREE.MeshLambertMaterial({ color: 0x0b111b });
  const matsFace = variantes.map((v) => new THREE.MeshLambertMaterial({
    map: v.tex, emissiveMap: v.tex, emissive: 0xffffff, emissiveIntensity: 0.04
  }));
  const corps = new THREE.InstancedMesh(geoCorps, matCorps, N * 2);
  const faces = [new THREE.InstancedMesh(geoFace, matsFace[0], N * 2), new THREE.InstancedMesh(geoFace, matsFace[1], N * 2)];
  const compte = [0, 0];
  const tmp = new THREE.Object3D();
  const matLed = new THREE.Matrix4(), matT = new THREE.Matrix4(), matS = new THREE.Matrix4();
  const ledsM = [], ledsC = [], ledsA = [];
  const VERT = [0.24, 0.86, 0.52], CYAN = [0.13, 0.83, 0.93], AMBRE = [0.96, 0.65, 0.14], ROUGE = [1, 0.3, 0.3];
  let iCorps = 0;
  for (const cote of [-1, 1]) {
    for (let i = 0; i < N; i++) {
      const z = Z0 - i * PAS;
      tmp.position.set(cote * (ALLEE + PB / 2), HB / 2, z);
      tmp.rotation.set(0, 0, 0); tmp.scale.set(1, 1, 1); tmp.updateMatrix();
      corps.setMatrixAt(iCorps++, tmp.matrix);
      const v = rnd() < 0.5 ? 0 : 1;
      tmp.position.set(cote * (ALLEE - 0.004), HB / 2, z);
      tmp.rotation.set(0, cote < 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      tmp.updateMatrix();
      faces[v].setMatrixAt(compte[v]++, tmp.matrix);
      for (const l of variantes[v].leds) {
        if (l.t === "port" && rnd() < 0.22) continue;
        const lx = (l.u - 0.5) * (LB - 0.02), ly = (l.v - 0.5) * (HB - 0.08);
        const taille = l.t === "etat" ? 0.034 : l.t === "port" ? 0.026 : 0.024;
        matT.makeTranslation(lx, ly, 0.004);
        matS.makeScale(taille, taille, 1);
        matLed.copy(tmp.matrix).multiply(matT).multiply(matS);
        ledsM.push(matLed.clone());
        const r = rnd();
        let col, anim;
        if (l.t === "port") { col = r < 0.82 ? VERT : AMBRE; anim = [6 + rnd() * 10, rnd(), 2]; }
        else if (l.t === "disque") { col = r < 0.6 ? VERT : CYAN; anim = [3 + rnd() * 9, rnd(), r < 0.75 ? 2 : 0]; }
        else { col = r < 0.03 ? ROUGE : r < 0.07 ? AMBRE : r < 0.55 ? CYAN : VERT; anim = [1.2 + rnd() * 2, rnd(), r < 0.03 ? 3 : 1]; }
        ledsC.push(...col); ledsA.push(...anim);
      }
    }
  }
  faces.forEach((f, k) => { f.count = compte[k]; f.instanceMatrix.needsUpdate = true; monde.add(f); });
  monde.add(corps);

  // LED : quads additifs, clignotement et allumage progressif calculés dans le shader
  const nLeds = ledsM.length;
  const geoLed = new THREE.PlaneGeometry(1, 1);
  geoLed.setAttribute("aCouleur", new THREE.InstancedBufferAttribute(new Float32Array(ledsC), 3));
  geoLed.setAttribute("aAnim", new THREE.InstancedBufferAttribute(new Float32Array(ledsA), 3));
  const uniformsLed = { uTemps: { value: 0 }, uVague: { value: -10 }, uDens: { value: DENS }, uPorte: { value: Z_PORTE } };
  const matLeds = new THREE.ShaderMaterial({
    uniforms: uniformsLed,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
    vertexShader: `
      attribute vec3 aCouleur; attribute vec3 aAnim;
      uniform float uTemps, uVague, uDens, uPorte;
      varying vec2 vUv; varying vec3 vCouleur; varying float vI;
      float hash(float n){ return fract(sin(n) * 43758.5453); }
      void main(){
        vUv = uv;
        vec4 m = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vec4 mv = viewMatrix * m;
        gl_Position = projectionMatrix * mv;
        float on = smoothstep(0.0, 1.0, uVague - (uPorte - m.z) - hash(aAnim.y * 17.0) * 0.8);
        float b = 1.0;
        if (aAnim.z > 2.5) b = step(0.5, fract(uTemps * 1.1 + aAnim.y));
        else if (aAnim.z > 1.5) b = 0.12 + 0.88 * step(0.38, hash(floor(uTemps * aAnim.x + aAnim.y * 10.0) + aAnim.y * 91.0));
        else if (aAnim.z > 0.5) b = 0.6 + 0.4 * sin(uTemps * aAnim.x + aAnim.y * 6.283);
        float d = -mv.z;
        vI = on * b * exp(-uDens * uDens * d * d);
        vCouleur = aCouleur;
      }`,
    fragmentShader: `
      varying vec2 vUv; varying vec3 vCouleur; varying float vI;
      void main(){
        float d = length(vUv - 0.5) * 2.0;
        float coeur = smoothstep(0.42, 0.0, d);
        float halo = exp(-d * d * 4.0) * 0.5;
        float a = (coeur * 1.5 + halo) * vI;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vCouleur * a + vec3(coeur * coeur * vI * 0.55), 1.0);
      }`
  });
  const leds = new THREE.InstancedMesh(geoLed, matLeds, nLeds);
  ledsM.forEach((m, i) => leds.setMatrixAt(i, m));
  leds.frustumCulled = false;
  leds.renderOrder = 2;
  monde.add(leds);

  // Chemins de câbles, goulotte fibre jaune, suspentes
  const longueur = Z0 - (Z0 - (N - 1) * PAS) + 3;
  const zMilieu = Z0 - (N - 1) * PAS / 2 - 0.5;
  const matTole = new THREE.MeshLambertMaterial({ color: 0x1c2636 });
  const matFibre = new THREE.MeshLambertMaterial({ color: 0x9c7a12, emissive: 0x181200 });
  for (const cote of [-1, 1]) {
    const tole = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, longueur), matTole);
    tole.position.set(cote * 1.55, 2.48, zMilieu);
    const fibre = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, longueur), matFibre);
    fibre.position.set(cote * 0.92, 2.78, zMilieu);
    monde.add(tole, fibre);
  }
  const nSusp = Math.floor(longueur / 2.4);
  const suspentes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.85, 0.02), matTole, nSusp * 4);
  let iS = 0;
  for (let k = 0; k < nSusp; k++) for (const x of [-1.85, -1.25, 1.25, 1.85]) {
    tmp.position.set(x, 2.9, Z0 - k * 2.4); tmp.rotation.set(0, 0, 0); tmp.updateMatrix();
    suspentes.setMatrixAt(iS++, tmp.matrix);
  }
  monde.add(suspentes);

  // Néons du plafond (allumage en vague, avec scintillement)
  const zNeons = [];
  for (let z = 1.8; z > Z_MUR + 1; z -= 2.2) zNeons.push(z);
  const neons = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.03, 1.5), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), zNeons.length);
  const couleurNeon = new THREE.Color();
  zNeons.forEach((z, i) => {
    tmp.position.set(0, 3.12, z); tmp.rotation.set(0, 0, 0); tmp.updateMatrix();
    neons.setMatrixAt(i, tmp.matrix);
    neons.setColorAt(i, couleurNeon.setRGB(0.02, 0.025, 0.03));
  });
  monde.add(neons);

  // Mur d'entrée, portes coulissantes, lecteur de badge
  const matMur = new THREE.MeshLambertMaterial({ color: 0x111a27 });
  const murG = new THREE.Mesh(new THREE.BoxGeometry(5.1, 4, 0.3), matMur); murG.position.set(-3.45, 2, Z_PORTE + 0.15);
  const murD = murG.clone(); murD.position.x = 3.45;
  const murH = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 0.3), matMur); murH.position.set(0, 3.2, Z_PORTE + 0.15);
  const matCadre = new THREE.MeshBasicMaterial({ color: 0x3ddc84, toneMapped: false });
  const cadreH = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.025, 0.02), matCadre); cadreH.position.set(0, 2.41, Z_PORTE + 0.31);
  const cadreG = new THREE.Mesh(new THREE.BoxGeometry(0.025, 2.41, 0.02), matCadre); cadreG.position.set(-0.93, 1.205, Z_PORTE + 0.31);
  const cadreD = cadreG.clone(); cadreD.position.x = 0.93;
  const enseigne = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.21), new THREE.MeshBasicMaterial({ map: textureEnseigne(THREE), toneMapped: false }));
  enseigne.position.set(0, 2.68, Z_PORTE + 0.31);
  const porteG = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 0.05), new THREE.MeshLambertMaterial({ map: texturePorte(THREE, true) }));
  porteG.position.set(-0.45, 1.2, Z_PORTE + 0.15); porteG.name = "porteG";
  const porteD = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 0.05), new THREE.MeshLambertMaterial({ map: texturePorte(THREE, false) }));
  porteD.position.set(0.45, 1.2, Z_PORTE + 0.15); porteD.name = "porteD";
  const lecteur = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.17, 0.03), new THREE.MeshLambertMaterial({ color: 0x1b2433 }));
  lecteur.position.set(1.22, 1.25, Z_PORTE + 0.31);
  const matBadge = new THREE.MeshBasicMaterial({ color: 0xff4d4f, toneMapped: false });
  const voyant = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.016), matBadge);
  voyant.position.set(1.22, 1.3, Z_PORTE + 0.33);
  const haloBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({
    map: textureHalo(THREE, "rgba(255,255,255,1)"), color: 0xff4d4f, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
  }));
  haloBadge.position.set(1.22, 1.3, Z_PORTE + 0.335);
  monde.add(murG, murD, murH, cadreH, cadreG, cadreD, enseigne, porteG, porteD, lecteur, voyant, haloBadge);

  // Mur du fond et écran du NOC
  const murFond = new THREE.Mesh(new THREE.PlaneGeometry(LSOL, 3.3), new THREE.MeshLambertMaterial({ color: 0x0a1019 }));
  murFond.position.set(0, 1.65, Z_MUR);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.6), new THREE.MeshBasicMaterial({
    map: textureHalo(THREE, "rgba(34,211,238,.55)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
  }));
  halo.position.set(0, 1.62, Z_MUR + 0.03);
  const cadre = new THREE.Mesh(new THREE.BoxGeometry(3.36, 1.96, 0.08), new THREE.MeshLambertMaterial({ color: 0x05080d }));
  cadre.position.set(0, 1.62, Z_ECRAN - 0.05);
  const ecran = creerEcran(THREE);
  const dalle = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), new THREE.MeshBasicMaterial({ map: ecran.tex, toneMapped: false }));
  dalle.position.set(0, 1.62, Z_ECRAN);
  monde.add(murFond, halo, cadre, dalle);

  // Reflet : copie du monde retournée sous le sol
  const reflet = monde.clone(true);
  reflet.scale.y = -1;
  reflet.traverse((o) => {
    if (o.isPointLight) o.visible = false;
    if (o.isMesh && o.material === matFibre) o.visible = false;
    if (o.isInstancedMesh && o.geometry === neons.geometry) o.instanceColor = neons.instanceColor;
    if (o.isInstancedMesh && o.material === matLeds) o.renderOrder = 0;
  });
  scene.add(reflet);
  const refletG = reflet.getObjectByName("porteG"), refletD = reflet.getObjectByName("porteD");

  // Poussière en suspension dans la lumière
  const nPoussiere = petit ? 220 : 420;
  const posP = new Float32Array(nPoussiere * 3);
  for (let i = 0; i < nPoussiere; i++) {
    posP[i * 3] = (rnd() - 0.5) * 2.1; posP[i * 3 + 1] = 0.2 + rnd() * 2.8; posP[i * 3 + 2] = Z_PORTE - rnd() * 28;
  }
  const geoP = new THREE.BufferGeometry();
  geoP.setAttribute("position", new THREE.BufferAttribute(posP, 3));
  const matP = new THREE.PointsMaterial({
    size: 0.016, map: textureHalo(THREE, "rgba(200,235,255,1)"), color: 0xbfe3ff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const poussiere = new THREE.Points(geoP, matP);
  scene.add(poussiere);

  /* ---------- chronologie ---------- */
  const T_BADGE = 0.8, T_PORTE = 1.05, D_PORTE = 1.35, T_VAGUE = 1.4, V_VAGUE = 11;
  const T_DEP = 1.15, T_ARR = 8.2, Z_DEP = 5.7;
  const zCam = (t) => t < T_DEP ? 6.2 - 0.5 * lisse(0, T_DEP, t) : Z_DEP + (Z_FIN - Z_DEP) * easeInOut(borne((t - T_DEP) / (T_ARR - T_DEP)));
  const vMax = Math.abs(Z_FIN - Z_DEP) / (T_ARR - T_DEP) * 1.5;
  const evenements = [
    [0.05, "> lecture du badge…"],
    [T_BADGE, "✓ AHMED.BOUZIANI — accès autorisé", "ok"],
    [1.5, "> mise sous tension de l'allée froide B"],
    [2.9, `> ${N * 2} serveurs en ligne · 21,4 °C · hygrométrie 45 %`],
    [4.3, "> ssh portfolio@192.168.10.20"],
    [6.1, "✓ connexion établie", "ok"]
  ];
  let iEvt = 0;

  let pfx = 0, pfy = 0, cibleX = 0, cibleY = 0;
  const pointeur = (e) => { cibleX = (e.clientX / innerWidth) * 2 - 1; cibleY = (e.clientY / innerHeight) * 2 - 1; };
  window.addEventListener("pointermove", pointeur, { passive: true });

  let fovBase = 60;
  function redimensionner() {
    const a = innerWidth / innerHeight;
    fovBase = a < 0.8 ? 76 : a < 1.2 ? 68 : 58;
    camera.aspect = a;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  }
  redimensionner();
  window.addEventListener("resize", redimensionner);

  const regard = new THREE.Vector3(), devant = new THREE.Vector3(), cibleEcran = new THREE.Vector3(0, 1.62, Z_ECRAN);
  let t = 0, avant = performance.now(), raf = 0, premier = true, sortie = false;
  let mesures = 0, cumul = 0, zPrec = zCam(0), latence = "0,4";
  const neonsOn = zNeons.map((z) => T_VAGUE + (Z_PORTE - z) / V_VAGUE);

  function image(maintenant) {
    raf = requestAnimationFrame(image);
    const dt = Math.min(0.05, (maintenant - avant) / 1000);
    avant = maintenant;
    if (!premier) t += dt;

    // Qualité adaptative : si la machine peine, on baisse la résolution
    if (!premier && mesures < 45) {
      cumul += dt; mesures++;
      if (mesures === 45 && cumul / 45 > 1 / 38 && dpr > 0.7) { dpr *= 0.72; renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight, false); }
    }

    while (iEvt < evenements.length && t >= evenements[iEvt][0]) { ui.log(evenements[iEvt][1], evenements[iEvt][2]); iEvt++; }

    // Badge
    const ok = t >= T_BADGE;
    const clign = ok ? 1 : (Math.floor(t * 6) % 2 ? 1 : 0.35);
    matBadge.color.setHex(ok ? 0x3ddc84 : 0xff4d4f).multiplyScalar(clign);
    haloBadge.material.color.setHex(ok ? 0x3ddc84 : 0xff4d4f);
    haloBadge.material.opacity = 0.55 * clign;

    // Portes
    const o = easeInOut(borne((t - T_PORTE) / D_PORTE));
    porteG.position.x = refletG.position.x = -0.45 - 0.93 * o;
    porteD.position.x = refletD.position.x = 0.45 + 0.93 * o;

    // Vague d'allumage
    const vague = (t - T_VAGUE) * V_VAGUE;
    uniformsLed.uVague.value = vague;
    uniformsLed.uTemps.value = t;
    zNeons.forEach((z, i) => {
      const dtOn = t - neonsOn[i];
      let k = 0.025;
      if (dtOn > 0.32) k = 1;
      else if (dtOn > 0) k = (Math.sin(dtOn * 90 + i) > 0.1 ? 1 : 0.15);
      neons.setColorAt(i, couleurNeon.setRGB(0.72 * k + 0.02, 0.84 * k + 0.02, 0.95 * k + 0.03));
    });
    neons.instanceColor.needsUpdate = true;
    lampes.forEach(({ l, z }) => { l.intensity = 9 * lisse(0, 0.45, t - (T_VAGUE + (Z_PORTE - z) / V_VAGUE)); });
    const tension = lisse(T_VAGUE, T_VAGUE + 2.6, t);
    matsFace.forEach((m) => { m.emissiveIntensity = 0.04 + 0.3 * tension; });
    ambiance.intensity = 0.35 + 0.35 * tension;
    lumiereEcran.intensity = 4 * lisse(T_VAGUE + 2.2, T_VAGUE + 3, t);
    matP.opacity = 0.45 * tension;
    ecran.dessiner(t);

    // Poussière
    for (let i = 0; i < nPoussiere; i++) {
      const k = i * 3 + 1;
      posP[k] += Math.sin(t * 0.6 + i) * 0.0009 - 0.0004;
      if (posP[k] < 0.1) posP[k] = 3;
    }
    geoP.attributes.position.needsUpdate = true;

    // Caméra
    const z = zCam(t);
    const vitesse = borne(Math.abs(z - zPrec) / Math.max(dt, 1e-3) / vMax);
    zPrec = z;
    pfx += (cibleX - pfx) * 0.04; pfy += (cibleY - pfy) * 0.04;
    const milieu = lisse(4, 0, z) * lisse(Z_FIN + 4, Z_FIN + 9, z);
    const x = Math.sin(t * 0.8) * 0.12 * milieu + pfx * 0.14 * (1 - lisse(Z_FIN + 3, Z_FIN, z));
    const y = 1.6 + Math.sin(t * 1.4) * 0.012 * milieu - pfy * 0.07;
    camera.position.set(x, y, z);
    const w = lisse(-12, Z_FIN + 2, z);
    devant.set(x * 0.4, 1.5, z - 7);
    regard.copy(devant).lerp(cibleEcran, w);
    camera.lookAt(regard);
    camera.rotation.z += Math.sin(t * 0.7) * 0.006 * milieu;
    camera.fov = fovBase + 7 * vitesse - 8 * lisse(Z_FIN + 5, Z_FIN, z);
    camera.updateProjectionMatrix();

    // Interface
    ui.barre.style.width = (borne(t / 7.2) * 100).toFixed(1) + "%";
    // Fin : le HUD s'efface, puis l'image se fond dans la couleur de fond du site (identique à l'écran)
    const fondu = lisse(Z_FIN + 1.1, Z_FIN + 0.2, z);
    ui.hud.style.opacity = (1 - lisse(Z_FIN + 3.5, Z_FIN + 1.2, z)).toFixed(3);
    ui.voile.style.opacity = fondu.toFixed(3);
    if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) latence = (0.3 + Math.random() * 0.25).toFixed(2).replace(".", ",");
    const baie = Math.min(N, Math.max(1, Math.round((Z0 - z) / PAS) + 1));
    ui.stat.textContent = z > Z_PORTE ? "DC-01 · sas d'entrée" : `allée B · baie B-${String(baie).padStart(2, "0")} · ${latence} ms`;

    renderer.render(scene, camera);
    if (premier) { premier = false; ui.overlay.classList.add("pret"); }
    if (!sortie && (fondu >= 0.995 || t > T_ARR)) { sortie = true; ui.terminer(false); }
  }
  raf = requestAnimationFrame(image);

  return function arreter() {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", pointeur);
    window.removeEventListener("resize", redimensionner);
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    });
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
