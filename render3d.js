// Futebol 26 — desenho 3D (estádio, adeptos, jogadores, bola, câmara de TV)
// Usa three.js (lib/three.min.js). A lógica do jogo está em game.js.
//
// Coordenadas: o jogo usa x (comprimento, 0..W) e y (largura, 0..H) no chão.
// No 3D: X = x - W/2, Z = y - H/2, e Y é a altura.

const Render = (() => {
  const canvas3d = document.getElementById('jogo3d');
  const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 5, 6000);
  const X = x => x - W / 2;
  const Z = y => y - H / 2;
  const tempo = { value: 0 };
  const excitacao = { value: 0 };

  function canvasTex(w, h, desenhar) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    desenhar(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  // ---------- Céu de noite ----------
  scene.background = canvasTex(4, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#050a1c');
    grad.addColorStop(0.6, '#13224a');
    grad.addColorStop(1, '#2b3d6b');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
  scene.fog = new THREE.Fog('#1a2850', 1800, 4200);

  // ---------- Luzes dos holofotes ----------
  scene.add(new THREE.HemisphereLight('#c8d8ff', '#2d5a2d', 1.1));
  const luz = new THREE.DirectionalLight('#fff4e0', 2.6);
  luz.position.set(-260, 700, 380);
  luz.castShadow = true;
  luz.shadow.mapSize.set(2048, 2048);
  Object.assign(luz.shadow.camera, { left: -620, right: 620, top: 420, bottom: -420, near: 100, far: 1800 });
  luz.shadow.bias = -0.0006;
  luz.shadow.normalBias = 0.6;
  scene.add(luz, luz.target);
  const luz2 = new THREE.DirectionalLight('#dfe8ff', 0.9);
  luz2.position.set(300, 500, -400);
  scene.add(luz2);

  // ---------- Relva com riscas e linhas ----------
  const M = 90;   // relva à volta das linhas
  const texRelva = canvasTex((W + 2 * M) * 2, (H + 2 * M) * 2, (g) => {
    g.scale(2, 2);
    g.translate(M, M);
    const faixa = 50;
    for (let x = -M; x < W + M; x += faixa) {
      g.fillStyle = Math.floor((x + M) / faixa) % 2 ? '#3f9442' : '#36863a';
      g.fillRect(x, -M, faixa, H + 2 * M);
    }
    // Pequenas manchas para a relva não parecer plástico
    for (let i = 0; i < 60000; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(0,30,0,0.06)' : 'rgba(180,255,150,0.04)';
      g.fillRect(Math.random() * (W + 2 * M) - M, Math.random() * (H + 2 * M) - M, 1.2, 1.2);
    }
    g.strokeStyle = 'rgba(255,255,255,0.92)';
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.lineWidth = 2;
    g.strokeRect(0, 0, W, H);
    g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
    g.beginPath(); g.arc(W / 2, H / 2, 70, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(W / 2, H / 2, 3, 0, Math.PI * 2); g.fill();
    for (const lado of [0, 1]) {
      const x0 = lado === 0 ? 0 : W;
      const d = lado === 0 ? 1 : -1;
      g.strokeRect(Math.min(x0, x0 + d * 160), H / 2 - 190, 160, 380);
      g.strokeRect(Math.min(x0, x0 + d * 55), H / 2 - 90, 55, 180);
      g.beginPath(); g.arc(x0 + d * 110, H / 2, 3, 0, Math.PI * 2); g.fill();
      g.beginPath();
      if (lado === 0) g.arc(110, H / 2, 70, -0.775, 0.775);
      else g.arc(W - 110, H / 2, 70, Math.PI - 0.775, Math.PI + 0.775);
      g.stroke();
    }
    for (const [cx, cy, a0] of [[0, 0, 0], [W, 0, Math.PI / 2], [W, H, Math.PI], [0, H, -Math.PI / 2]]) {
      g.beginPath(); g.arc(cx, cy, 10, a0, a0 + Math.PI / 2); g.stroke();
    }
  });
  const relva = new THREE.Mesh(
    new THREE.PlaneGeometry(W + 2 * M, H + 2 * M),
    new THREE.MeshStandardMaterial({ map: texRelva, roughness: 0.95 }));
  relva.rotation.x = -Math.PI / 2;
  relva.receiveShadow = true;
  scene.add(relva);
  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(W + 900, H + 900),
    new THREE.MeshStandardMaterial({ color: '#2b5e2e', roughness: 1 }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = -0.2;
  chao.receiveShadow = true;
  scene.add(chao);

  // ---------- Balizas com rede ----------
  const texRede = canvasTex(64, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 3;
    g.strokeRect(0, 0, w, h);
  });
  texRede.wrapS = texRede.wrapT = THREE.RepeatWrapping;
  const matRede = new THREE.MeshStandardMaterial({
    map: texRede, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 1 });
  const matPoste = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 });

  // Quadrilátero de rede com a textura repetida a cada 5 unidades
  function rede(a, b, c, d) {
    const geo = new THREE.BufferGeometry();
    const u = a.distanceTo(b) / 5, v = a.distanceTo(d) / 5;
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...a.toArray(), ...b.toArray(), ...c.toArray(), ...d.toArray()], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, v], 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, matRede);
  }

  function baliza(lado) {
    const g = new THREE.Group();
    const r = 1.6, hw = GOAL_W / 2, hb = GOAL_H * 0.75;
    const barra = (comp) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, comp, 12), matPoste);
    for (const s of [-1, 1]) {
      const poste = barra(GOAL_H);
      poste.position.set(0, GOAL_H / 2, s * hw);
      g.add(poste);
      const tras = barra(hb);
      tras.scale.set(0.5, 1, 0.5);
      tras.position.set(-GOAL_D, hb / 2, s * hw);
      g.add(tras);
    }
    const trave = barra(GOAL_W + 2 * r);
    trave.rotation.x = Math.PI / 2;
    trave.position.set(0, GOAL_H, 0);
    g.add(trave);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    g.add(rede(V(-GOAL_D, 0, -hw), V(-GOAL_D, 0, hw), V(-GOAL_D, hb, hw), V(-GOAL_D, hb, -hw)));  // fundo
    g.add(rede(V(0, GOAL_H, -hw), V(0, GOAL_H, hw), V(-GOAL_D, hb, hw), V(-GOAL_D, hb, -hw)));    // cima
    for (const s of [-1, 1]) {
      g.add(rede(V(0, 0, s * hw), V(-GOAL_D, 0, s * hw), V(-GOAL_D, hb, s * hw), V(0, GOAL_H, s * hw)));
    }
    g.traverse(o => { if (o.isMesh && o.material === matPoste) o.castShadow = true; });
    g.position.x = lado === 0 ? X(0) : X(W);
    g.rotation.y = lado === 0 ? 0 : Math.PI;
    scene.add(g);
  }
  baliza(0); baliza(1);

  // Bandeirolas de canto
  for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) {
    const pau = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 16, 6), matPoste);
    pau.position.set(X(x), 8, Z(y));
    const band = new THREE.Mesh(new THREE.PlaneGeometry(6, 4),
      new THREE.MeshStandardMaterial({ color: '#ffd60a', side: THREE.DoubleSide }));
    band.position.set(X(x) + 3, 14, Z(y));
    scene.add(pau, band);
  }

  // ---------- Placas de publicidade (LED) ----------
  const anuncios = [
    ['FUTEBOL 26', '#c1121f', '#ffffff'], ['GUILHERME', '#003f88', '#ffd60a'],
    ['GOLO!', '#111111', '#4cc9f0'], ['ROMEU', '#2b9348', '#ffffff'],
    ['SIUUU', '#ffd60a', '#111111'], ['CAMPEÕES', '#6a00f4', '#ffffff'],
  ];
  const texPlacas = canvasTex(2048, 64, (g, w, h) => {
    const larg = w / anuncios.length;
    anuncios.forEach(([txt, fundo, cor], i) => {
      g.fillStyle = fundo; g.fillRect(i * larg, 0, larg, h);
      g.fillStyle = cor;
      g.font = 'bold 40px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(txt, i * larg + larg / 2, h / 2 + 2);
    });
  });
  texPlacas.wrapS = THREE.RepeatWrapping;
  const placasTex = [];
  function placa(comp, x, z, rotY) {
    const t = texPlacas.clone();
    t.needsUpdate = true;
    t.repeat.set(comp / 340, 1);
    placasTex.push(t);
    const m = new THREE.Mesh(new THREE.BoxGeometry(comp, 8, 1.5), [
      new THREE.MeshStandardMaterial({ color: '#111' }), new THREE.MeshStandardMaterial({ color: '#111' }),
      new THREE.MeshStandardMaterial({ color: '#111' }), new THREE.MeshStandardMaterial({ color: '#111' }),
      new THREE.MeshBasicMaterial({ map: t }), new THREE.MeshStandardMaterial({ color: '#111' }),
    ]);
    m.position.set(x, 4, z);
    m.rotation.y = rotY;
    m.castShadow = true;
    scene.add(m);
  }
  const DP = 30;   // distância das placas às linhas
  placa(W + 2 * DP, 0, Z(0) - DP, 0);
  placa(W + 2 * DP, 0, Z(H) + DP, Math.PI);
  placa(H + 2 * DP, X(0) - DP - 25, 0, Math.PI / 2);
  placa(H + 2 * DP, X(W) + DP + 25, 0, -Math.PI / 2);

  // ---------- Bancadas com adeptos ----------
  // Os adeptos saltam: o shader mexe cada boneco para cima e para baixo.
  function materialAdepto(mat) {
    mat.onBeforeCompile = sh => {
      sh.uniforms.uTempo = tempo;
      sh.uniforms.uExc = excitacao;
      sh.vertexShader = 'uniform float uTempo;\nuniform float uExc;\n' + sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float seed = instanceMatrix[3].x * 0.731 + instanceMatrix[3].z * 1.37 + instanceMatrix[3].y * 0.31;
        float salto = max(0.0, sin(uTempo * (6.0 + fract(seed) * 5.0) + seed * 6.2831));
        float quer = step(0.55 - uExc * 0.6, fract(seed * 3.17));
        transformed.y += salto * quer * (0.5 + uExc * 4.5);`);
    };
    return mat;
  }
  const matCorpo = materialAdepto(new THREE.MeshLambertMaterial({ color: '#ffffff' }));
  const matCabeca = materialAdepto(new THREE.MeshLambertMaterial({ color: '#ffffff' }));
  const matBetao = new THREE.MeshStandardMaterial({ color: '#5b6070', roughness: 0.9 });
  const matBanco = new THREE.MeshStandardMaterial({ color: '#30343f', roughness: 0.8 });
  const geoCorpo = new THREE.BoxGeometry(3.4, 5.6, 2.8);
  const geoCabeca = new THREE.BoxGeometry(2.3, 2.3, 2.3);
  const PELES = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];

  function bancada(comp, filas, px, pz, rotY, cores, telhado, paredeAlta = true) {
    const g = new THREE.Group();
    const prof = 9, sobe = 5.5, base = 8;
    // Muro da frente
    const muro = new THREE.Mesh(new THREE.BoxGeometry(comp, base, 3), matBetao);
    muro.position.set(0, base / 2, 1.5);
    g.add(muro);
    for (let i = 0; i < filas; i++) {
      const alt = base + i * sobe;
      const deg = new THREE.Mesh(new THREE.BoxGeometry(comp, alt, prof), i % 2 ? matBetao : matBanco);
      deg.position.set(0, alt / 2, -i * prof - prof / 2);
      g.add(deg);
    }
    // Parede de trás
    const altFundo = base + filas * sobe + (paredeAlta ? 40 : 4);
    const fundo = new THREE.Mesh(new THREE.BoxGeometry(comp, altFundo, 4), matBetao);
    fundo.position.set(0, altFundo / 2, -filas * prof - 2);
    g.add(fundo);
    if (telhado) {
      const altT = base + filas * sobe + 40;
      const t = new THREE.Mesh(new THREE.BoxGeometry(comp + 20, 3, filas * prof * 0.75),
        new THREE.MeshStandardMaterial({ color: '#2a2f3a', roughness: 0.7 }));
      t.position.set(0, altT, -filas * prof * 0.62);
      t.rotation.x = -0.08;
      g.add(t);
      // Fila de luzes debaixo do telhado
      const luzes = new THREE.Mesh(new THREE.BoxGeometry(comp, 1.2, 1.2),
        new THREE.MeshBasicMaterial({ color: '#fffbe6' }));
      luzes.position.set(0, altT - 2.5, -filas * prof * 0.27);
      g.add(luzes);
    }

    // Adeptos
    const passo = 5.2;
    const porFila = Math.floor(comp / passo);
    const total = porFila * filas;
    const corpos = new THREE.InstancedMesh(geoCorpo, matCorpo, total);
    const cabecas = new THREE.InstancedMesh(geoCabeca, matCabeca, total);
    const m = new THREE.Matrix4();
    const cor = new THREE.Color();
    let n = 0;
    for (let i = 0; i < filas; i++) {
      for (let j = 0; j < porFila; j++) {
        if (Math.random() < 0.06) continue;   // lugares vazios
        const x = -comp / 2 + passo / 2 + j * passo + (Math.random() - 0.5) * 1.2;
        const y = base + i * sobe;
        const z = -i * prof - prof / 2 + (Math.random() - 0.5) * 2;
        m.makeTranslation(x, y + 2.8, z);
        corpos.setMatrixAt(n, m);
        cor.set(cores[Math.floor(Math.random() * cores.length)]);
        corpos.setColorAt(n, cor);
        m.makeTranslation(x, y + 6.8, z);
        cabecas.setMatrixAt(n, m);
        cor.set(PELES[Math.floor(Math.random() * PELES.length)]);
        cabecas.setColorAt(n, cor);
        n++;
      }
    }
    corpos.count = cabecas.count = n;
    g.add(corpos, cabecas);
    g.position.set(px, 0, pz);
    g.rotation.y = rotY;
    scene.add(g);
  }
  const vermelhos = ['#d62828', '#d62828', '#d62828', '#ffffff', '#9d0208'];
  const azuis = ['#1d4ed8', '#1d4ed8', '#1d4ed8', '#ffffff', '#0b2a6f'];
  const mistos = [...vermelhos, ...azuis, '#ffd60a', '#222222'];
  const DB = 50;   // distância das bancadas às linhas
  bancada(W + 2 * DB, 16, 0, Z(0) - DB, 0, mistos, true);
  // Bancada do lado da câmara: mais baixa e sem telhado, para não tapar o campo
  bancada(W + 2 * DB, 7, 0, Z(H) + DB, Math.PI, mistos, false, false);
  bancada(H + 2 * DB, 14, X(0) - DB - 30, 0, Math.PI / 2, vermelhos, false);
  bancada(H + 2 * DB, 14, X(W) + DB + 30, 0, -Math.PI / 2, azuis, false);

  // ---------- Torres de iluminação ----------
  const texBrilho = canvasTex(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,240,1)');
    r.addColorStop(0.2, 'rgba(255,250,220,0.6)');
    r.addColorStop(1, 'rgba(255,250,220,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = sx * (W / 2 + 200), z = sz * (H / 2 + 230);
    const torre = new THREE.Mesh(new THREE.CylinderGeometry(3, 5, 380, 8), matBetao);
    torre.position.set(x, 190, z);
    const painel = new THREE.Mesh(new THREE.BoxGeometry(50, 28, 4), new THREE.MeshBasicMaterial({ color: '#fffbe6' }));
    painel.position.set(x, 390, z);
    painel.lookAt(0, 0, 0);
    const brilho = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texBrilho, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    brilho.scale.set(260, 260, 1);
    brilho.position.set(x, 390, z);
    scene.add(torre, painel, brilho);
  }

  // ---------- Jogadores ----------
  const geoTronco = new THREE.BoxGeometry(4.2, 7.5, 7.2);
  const geoCabecaJ = new THREE.SphereGeometry(2.6, 16, 12);
  const geoCabelo = new THREE.SphereGeometry(2.8, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const geoCalcao = new THREE.BoxGeometry(3.4, 4, 3.3);
  const geoPerna = new THREE.BoxGeometry(2.2, 3.6, 2.2);
  const geoMeia = new THREE.BoxGeometry(2.4, 3.2, 2.4);
  const geoBota = new THREE.BoxGeometry(3.8, 1.4, 2.5);
  const geoManga = new THREE.BoxGeometry(2.3, 3, 2.3);
  const geoBraco = new THREE.BoxGeometry(1.9, 4.2, 1.9);
  const geoNumero = new THREE.PlaneGeometry(4.6, 4.6);
  const mat = {};
  const matDe = (cor) => mat[cor] || (mat[cor] = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.75 }));
  const texNum = {};
  function matNumero(num, cor) {
    const k = num + cor;
    if (!texNum[k]) {
      const t = canvasTex(64, 64, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = cor;
        g.font = 'bold 48px sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(num), w / 2, h / 2 + 3);
      });
      texNum[k] = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8 });
    }
    return texNum[k];
  }
  const CABELOS = ['#1b1209', '#3b2412', '#6b4423', '#c9a15b', '#0d0d0d'];

  function criarModelo(p) {
    const eq = EQUIPAS[p.team];
    const camisola = p.gk ? eq.gr : eq.camisola;
    const pele = PELES[(p.num * 7 + p.team * 3) % PELES.length];
    const raiz = new THREE.Group();
    const corpo = new THREE.Group();
    raiz.add(corpo);

    const tronco = new THREE.Mesh(geoTronco, matDe(camisola));
    tronco.position.y = 14.4;
    corpo.add(tronco);
    const num = new THREE.Mesh(geoNumero, matNumero(p.num, eq.numero));
    num.position.set(-2.15, 14.8, 0);
    num.rotation.y = -Math.PI / 2;
    corpo.add(num);
    const cabeca = new THREE.Mesh(geoCabecaJ, matDe(pele));
    cabeca.position.y = 20.8;
    corpo.add(cabeca);
    const cabelo = new THREE.Mesh(geoCabelo, matDe(CABELOS[(p.num + p.team) % CABELOS.length]));
    cabelo.position.set(-0.3, 21.1, 0);
    corpo.add(cabelo);

    const pernas = [], bracos = [];
    for (const s of [-1, 1]) {
      const perna = new THREE.Group();
      perna.position.set(0, 10.6, s * 1.9);
      const calcao = new THREE.Mesh(geoCalcao, matDe(eq.calcoes));
      calcao.position.y = -1.8;
      const canela = new THREE.Mesh(geoPerna, matDe(pele));
      canela.position.y = -5.4;
      const meia = new THREE.Mesh(geoMeia, matDe(camisola));
      meia.position.y = -8.4;
      const bota = new THREE.Mesh(geoBota, matDe('#111111'));
      bota.position.set(0.6, -9.9, 0);
      perna.add(calcao, canela, meia, bota);
      corpo.add(perna);
      pernas.push(perna);

      const braco = new THREE.Group();
      braco.position.set(0, 17.4, s * 4.6);
      const manga = new THREE.Mesh(geoManga, matDe(camisola));
      manga.position.y = -1.3;
      const ante = new THREE.Mesh(geoBraco, matDe(p.gk ? '#f8f9fa' : pele));
      ante.position.y = -4.8;
      braco.add(manga, ante);
      corpo.add(braco);
      bracos.push(braco);
    }
    raiz.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(raiz);
    return { raiz, corpo, pernas, bracos, fase: Math.random() * 6 };
  }

  const modelos = new Map();

  function atualizarJogadores(dt) {
    for (const [p, m] of modelos) {
      if (!players.includes(p)) { scene.remove(m.raiz); modelos.delete(p); }
    }
    for (const p of players) {
      let m = modelos.get(p);
      if (!m) { m = criarModelo(p); modelos.set(p, m); }
      const vel = Math.hypot(p.vx, p.vy);
      m.fase += vel * dt * 0.11;
      const amp = Math.min(1, vel / 140) * 0.9;
      const s = Math.sin(m.fase);
      m.raiz.position.set(X(p.x), 0, Z(p.y));
      m.raiz.rotation.y = -p.facing;

      const festa = (state === 'golo' || state === 'fim') && p.team === lastScorer;
      if (p.slide > 0 || p.chao > 0) {
        // Carrinho: deitado para trás, pernas para a frente
        m.corpo.rotation.z = 1.15;
        m.corpo.position.set(-3, 3, 0);
        m.pernas[0].rotation.z = m.pernas[1].rotation.z = 0.25;
        m.bracos[0].rotation.z = m.bracos[1].rotation.z = -0.6;
      } else if (festa) {
        // Festejo: saltos com os braços no ar
        m.corpo.rotation.z = 0;
        const salto = Math.abs(Math.sin(tempo.value * 8 + p.num));
        m.corpo.position.set(0, salto * 4, 0);
        m.pernas[0].rotation.z = m.pernas[1].rotation.z = 0;
        m.bracos[0].rotation.z = m.bracos[1].rotation.z = Math.PI * 0.9;
        m.bracos[0].rotation.x = 0.4; m.bracos[1].rotation.x = -0.4;
      } else {
        m.corpo.rotation.z = 0;
        m.corpo.position.set(0, Math.abs(s) * amp * 0.9, 0);
        m.bracos[0].rotation.x = m.bracos[1].rotation.x = 0;
        m.pernas[0].rotation.z = s * amp;
        m.pernas[1].rotation.z = -s * amp;
        m.bracos[0].rotation.z = -s * amp * 0.8;
        m.bracos[1].rotation.z = s * amp * 0.8;
        // Acabou de chutar: perna direita esticada para a frente
        if (p.cooldown > 0.12) m.pernas[1].rotation.z = 1.1;
      }
    }
  }

  // Marcadores dos jogadores controlados (anel no chão + seta por cima)
  const marcadores = ['#ffd60a', '#4cc9f0'].map(cor => {
    const g = new THREE.Group();
    const anel = new THREE.Mesh(new THREE.RingGeometry(11, 13.5, 32),
      new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9, depthWrite: false }));
    anel.rotation.x = -Math.PI / 2;
    anel.position.y = 0.4;
    const seta = new THREE.Mesh(new THREE.ConeGeometry(2.6, 5, 4), new THREE.MeshBasicMaterial({ color: cor }));
    seta.rotation.x = Math.PI;
    seta.position.y = 30;
    g.add(anel, seta);
    g.userData.seta = seta;
    scene.add(g);
    return g;
  });

  // Seta para apontar nas bolas paradas
  const formaSeta = new THREE.Shape();
  formaSeta.moveTo(10, -1.5); formaSeta.lineTo(60, -1.5); formaSeta.lineTo(60, -5);
  formaSeta.lineTo(72, 0); formaSeta.lineTo(60, 5); formaSeta.lineTo(60, 1.5); formaSeta.lineTo(10, 1.5);
  const setaMira = new THREE.Group();
  const setaMesh = new THREE.Mesh(new THREE.ShapeGeometry(formaSeta),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.75, depthWrite: false }));
  setaMesh.rotation.x = -Math.PI / 2;
  setaMesh.position.y = 0.5;
  setaMira.add(setaMesh);
  scene.add(setaMira);

  // ---------- Bola ----------
  const RB = 3.2;
  const texBola = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#111111';
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        const cx = (i + (j % 2) * 0.5) * w / 6, cy = (j + 0.5) * h / 3;
        g.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = k / 5 * Math.PI * 2 - Math.PI / 2;
          g.lineTo(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13);
        }
        g.fill();
      }
    }
  });
  const bola = new THREE.Mesh(new THREE.SphereGeometry(RB, 24, 16),
    new THREE.MeshStandardMaterial({ map: texBola, roughness: 0.4 }));
  bola.castShadow = true;
  scene.add(bola);
  const eixo = new THREE.Vector3();
  const rodar = new THREE.Quaternion();

  function atualizarBola(dt) {
    bola.position.set(X(ball.x), ball.z + RB, Z(ball.y));
    const v = Math.hypot(ball.vx, ball.vy);
    if (v > 1) {
      eixo.set(ball.vy, 0, -ball.vx).normalize();
      rodar.setFromAxisAngle(eixo, v * dt / RB);
      bola.quaternion.premultiply(rodar);
    }
  }

  // ---------- Câmara de TV ----------
  const cam = { x: 0, z: 0, fov: 26 };
  function atualizarCamara(dt) {
    if (state === 'titulo' || !ball) {
      const t = tempo.value * 0.06;
      camera.position.set(Math.cos(t) * 820, 300, Math.sin(t) * 620);
      camera.lookAt(0, 20, 0);
      if (camera.fov !== 40) { camera.fov = 40; camera.updateProjectionMatrix(); }
      return;
    }
    const k = Math.min(1, dt * 2.5);
    let tx = clamp(X(ball.x), -W / 2 + 190, W / 2 - 190);
    let tz = Z(ball.y) * 0.55;
    let fov = 28;
    if (state === 'golo' || state === 'fim') {
      // Depois do golo a câmara aproxima-se da baliza
      tx = X(ball.x) * 0.9; tz = Z(ball.y) * 0.6; fov = 19;
    }
    cam.x += (tx - cam.x) * k;
    cam.z += (tz - cam.z) * k;
    cam.fov += (fov - cam.fov) * Math.min(1, dt * 1.5);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
    camera.position.set(cam.x * 0.8, 250, 600);
    camera.lookAt(cam.x, 0, cam.z + 20);
  }

  // ---------- Ecrã ----------
  function redimensionar() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', redimensionar);
  redimensionar();

  // Converte uma posição do jogo para pixels no ecrã (para o placar desenhar por cima)
  const v3 = new THREE.Vector3();
  function noEcra(x, y, z, largura, altura) {
    v3.set(X(x), z, Z(y)).project(camera);
    return {
      x: (v3.x * 0.5 + 0.5) * largura,
      y: (-v3.y * 0.5 + 0.5) * altura,
      visivel: v3.z < 1 && Math.abs(v3.x) <= 1 && Math.abs(v3.y) <= 1,
    };
  }

  function desenhar(dt) {
    tempo.value += dt;
    let alvo = 0.08;
    if (state === 'golo' || state === 'fim') alvo = 1;
    else if (ball && (ball.x < 170 || ball.x > W - 170)) alvo = 0.3;
    excitacao.value += (alvo - excitacao.value) * Math.min(1, dt * 3);
    for (const t of placasTex) t.offset.x += dt * 0.03;

    const emJogo = state !== 'titulo' && ball;
    bola.visible = !!emJogo;
    if (emJogo) {
      atualizarJogadores(dt);
      atualizarBola(dt);
    } else {
      for (const [, m] of modelos) scene.remove(m.raiz);
      modelos.clear();
    }
    marcadores.forEach((g, t) => {
      const p = human[t];
      g.visible = !!(emJogo && p && state !== 'golo' && state !== 'fim');
      if (g.visible) {
        g.position.set(X(p.x), 0, Z(p.y));
        g.userData.seta.position.y = 30 + Math.sin(tempo.value * 6) * 1.5;
      }
    });
    const sp = state === 'parada' && setPiece && setPiece.taker;
    setaMira.visible = !!(emJogo && sp && !setPiece.taker.gk);
    if (setaMira.visible) {
      setaMira.position.set(X(ball.x), 0, Z(ball.y));
      setaMira.rotation.y = -setPiece.taker.facing;
    }
    atualizarCamara(dt);
    renderer.render(scene, camera);
  }

  return { desenhar, noEcra };
})();
