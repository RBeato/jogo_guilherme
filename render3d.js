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

  const redesFundo = [];
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
    // Rede do fundo dividida em muitos quadrados, para poder abanar no golo
    const fundo = new THREE.PlaneGeometry(GOAL_W, hb, 24, 10);
    fundo.rotateY(Math.PI / 2);
    fundo.translate(-GOAL_D, hb / 2, 0);
    const uv = fundo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * GOAL_W / 5, uv.getY(i) * hb / 5);
    g.add(new THREE.Mesh(fundo, matRede));
    redesFundo[lado] = { geo: fundo, base: Float32Array.from(fundo.attributes.position.array) };
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

  // ---------- Jogadores e árbitros ----------
  // Bonecos com corpo arredondado, joelhos e cotovelos que dobram.
  const capsula = (r, l) => new THREE.CapsuleGeometry(r, l, 3, 10);
  const geo = {
    tronco: capsula(3.1, 3.0),
    calcao: new THREE.CylinderGeometry(3.2, 3.6, 3.6, 14),
    pescoco: new THREE.CylinderGeometry(0.9, 1.05, 1.8, 8),
    cabeca: new THREE.SphereGeometry(2.35, 16, 12),
    cabelo: new THREE.SphereGeometry(2.5, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    nariz: new THREE.SphereGeometry(0.45, 6, 4),
    coxa: capsula(1.35, 3.0),
    canela: capsula(1.1, 3.0),
    bota: capsula(0.95, 2.3),
    braco: capsula(0.95, 2.3),
    antebraco: capsula(0.8, 2.3),
    mao: new THREE.SphereGeometry(0.95, 8, 6),
    luva: new THREE.SphereGeometry(1.45, 8, 6),
    numero: new THREE.PlaneGeometry(4.2, 4.2),
    pau: new THREE.CylinderGeometry(0.22, 0.22, 7, 5),
    bandeira: new THREE.PlaneGeometry(3.6, 2.8),
    cartao: new THREE.BoxGeometry(0.3, 3.2, 2.2),
  };
  const mat = {};
  const matDe = (cor) => mat[cor] || (mat[cor] = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.72 }));
  const texNum = {};
  function matNumero(num, cor) {
    const k = num + cor;
    if (!texNum[k]) {
      const t = canvasTex(64, 64, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = cor;
        g.font = 'bold 46px sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(num), w / 2, h / 2 + 3);
      });
      texNum[k] = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false });
    }
    return texNum[k];
  }
  const CABELOS = ['#1b1209', '#3b2412', '#6b4423', '#c9a15b', '#0d0d0d'];
  const matCartao = { amarelo: new THREE.MeshBasicMaterial({ color: '#ffd60a' }), vermelho: new THREE.MeshBasicMaterial({ color: '#ef233c' }) };

  // kit: { camisola, calcoes, meias, pele, cabelo, numero, corNumero, luvas }
  function criarBoneco(kit) {
    const raiz = new THREE.Group();
    const corpo = new THREE.Group();
    raiz.add(corpo);
    const mesh = (g, cor, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(g, typeof cor === 'string' ? matDe(cor) : cor);
      m.position.set(x, y, z);
      return m;
    };
    const calcao = mesh(geo.calcao, kit.calcoes, 0, 10.4, 0);
    calcao.scale.set(0.78, 1, 1.05);
    const tronco = mesh(geo.tronco, kit.camisola, 0, 15.2, 0);
    tronco.scale.set(0.62, 1, 1.12);
    corpo.add(calcao, tronco,
      mesh(geo.pescoco, kit.pele, 0, 20.1, 0),
      mesh(geo.cabeca, kit.pele, 0.1, 22.3, 0),
      mesh(geo.cabelo, kit.cabelo, -0.25, 22.6, 0),
      mesh(geo.nariz, kit.pele, 2.3, 22.1, 0));
    if (kit.numero !== undefined) {
      const n = mesh(geo.numero, matNumero(kit.numero, kit.corNumero), -2.0, 15.6, 0);
      n.rotation.y = -Math.PI / 2;
      corpo.add(n);
    }
    const ancas = [], joelhos = [], ombros = [], cotovelos = [];
    for (const s of [-1, 1]) {
      const anca = new THREE.Group();
      anca.position.set(0, 10.0, s * 1.85);
      anca.add(mesh(geo.coxa, kit.pele, 0, -2.4, 0));
      const joelho = new THREE.Group();
      joelho.position.y = -4.8;
      joelho.add(mesh(geo.canela, kit.meias, 0, -2.3, 0));
      const bota = mesh(geo.bota, '#111111', 0.9, -4.6, 0);
      bota.rotation.z = Math.PI / 2;
      joelho.add(bota);
      anca.add(joelho);
      corpo.add(anca);
      ancas.push(anca); joelhos.push(joelho);

      const ombro = new THREE.Group();
      ombro.position.set(0, 18.6, s * 4.0);
      ombro.add(mesh(geo.braco, kit.camisola, 0, -1.5, 0));
      const cotovelo = new THREE.Group();
      cotovelo.position.y = -3.2;
      cotovelo.add(mesh(geo.antebraco, kit.pele, 0, -1.5, 0));
      cotovelo.add(kit.luvas ? mesh(geo.luva, kit.luvas, 0, -3.4, 0) : mesh(geo.mao, kit.pele, 0, -3.2, 0));
      ombro.add(cotovelo);
      corpo.add(ombro);
      ombros.push(ombro); cotovelos.push(cotovelo);
    }
    raiz.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(raiz);
    return { raiz, corpo, ancas, joelhos, ombros, cotovelos, fase: Math.random() * 6 };
  }

  function criarModeloJogador(p) {
    const eq = EQUIPAS[p.team];
    const camisola = p.gk ? eq.gr : eq.camisola;
    return criarBoneco({
      camisola, calcoes: p.gk ? '#222222' : eq.calcoes, meias: p.gk ? camisola : (eq.meias || camisola),
      pele: PELES[(p.num * 7 + p.team * 3) % PELES.length],
      cabelo: CABELOS[(p.num + p.team) % CABELOS.length],
      numero: p.num, corNumero: eq.numero, luvas: p.gk ? '#f8f9fa' : null,
    });
  }

  function criarModeloArbitro(a) {
    const m = criarBoneco({ camisola: '#111111', calcoes: '#111111', meias: '#111111', pele: '#e0ac69', cabelo: '#1b1209' });
    // Mão direita: cartão (árbitro) ou bandeira (fiscal)
    const mao = m.cotovelos[1];
    if (a.tipo === 'arbitro') {
      m.cartao = new THREE.Mesh(geo.cartao, matCartao.amarelo);
      m.cartao.position.set(0, -4.8, 0);
      m.cartao.visible = false;
      mao.add(m.cartao);
    } else {
      const pau = new THREE.Mesh(geo.pau, matDe('#dddddd'));
      pau.position.set(0.6, -5.5, 0);
      const band = new THREE.Mesh(geo.bandeira, new THREE.MeshStandardMaterial({ color: '#ffd60a', side: THREE.DoubleSide }));
      band.position.set(0.6, -7.2, 1.8);
      band.rotation.y = Math.PI / 2;
      mao.add(pau, band);
    }
    return m;
  }

  // Põe o boneco na pose certa: correr, carrinho, mergulho, festa, cartão...
  function animarBoneco(m, d, dt, pose) {
    const vel = Math.hypot(d.vx, d.vy);
    m.fase += vel * dt * 0.11;
    const amp = Math.min(1, vel / 140);
    const s = Math.sin(m.fase);
    m.raiz.position.set(X(d.x), 0, Z(d.y));
    m.raiz.rotation.y = -d.facing;
    m.corpo.rotation.set(0, 0, 0);
    m.corpo.position.set(0, 0, 0);
    for (let i = 0; i < 2; i++) {
      const fase = m.fase + i * Math.PI;
      m.ancas[i].rotation.set(0, 0, Math.sin(fase) * amp * 0.85);
      m.joelhos[i].rotation.z = -amp * (0.2 + 1.0 * Math.max(0, Math.cos(fase)));
      m.ombros[i].rotation.set(0, 0, -Math.sin(fase) * amp * 0.75);
      m.cotovelos[i].rotation.z = 0.35 + amp * 0.75;
    }
    m.corpo.rotation.z = -amp * 0.14;                        // inclina-se para a frente a correr
    m.corpo.position.y = Math.abs(s) * amp * 0.8;

    if (pose === 'carrinho') {
      m.corpo.rotation.z = 1.2;
      m.corpo.position.set(-3, 2.5, 0);
      m.ancas[0].rotation.z = 0.15; m.ancas[1].rotation.z = 0.45;
      m.joelhos[0].rotation.z = -0.9; m.joelhos[1].rotation.z = 0;
      m.ombros[0].rotation.z = m.ombros[1].rotation.z = -0.9;
    } else if (pose === 'mergulho') {
      const lado = Math.sign(Math.cos(d.facing) || 1) * d.mergulhoDir;
      const k = Math.min(1, (0.7 - d.mergulho) / 0.15);
      m.corpo.rotation.x = lado * 1.35 * k;
      m.corpo.position.set(0, 3 * k, 0);
      m.ombros[0].rotation.set(lado * 0.3, 0, Math.PI * 0.95);
      m.ombros[1].rotation.set(lado * 0.3, 0, Math.PI * 0.95);
      m.cotovelos[0].rotation.z = m.cotovelos[1].rotation.z = 0;
    } else if (pose === 'festa') {
      const salto = Math.abs(Math.sin(tempo.value * 8 + m.fase));
      m.corpo.rotation.z = 0;
      m.corpo.position.set(0, salto * 4, 0);
      m.ancas[0].rotation.z = m.ancas[1].rotation.z = 0;
      m.joelhos[0].rotation.z = m.joelhos[1].rotation.z = -salto * 0.6;
      m.ombros[0].rotation.set(0.35, 0, Math.PI * 0.92);
      m.ombros[1].rotation.set(-0.35, 0, Math.PI * 0.92);
      m.cotovelos[0].rotation.z = m.cotovelos[1].rotation.z = 0.1;
    } else if (pose === 'chuto') {
      m.ancas[1].rotation.z = 1.25;
      m.joelhos[1].rotation.z = -0.1;
      m.ancas[0].rotation.z = -0.3;
      m.ombros[0].rotation.z = 0.8; m.ombros[1].rotation.z = -0.6;
    } else if (pose === 'braco') {
      // Árbitro a mostrar o cartão / fiscal com a bandeira no ar
      m.ombros[1].rotation.set(0, 0, Math.PI * 0.97);
      m.cotovelos[1].rotation.z = 0;
    }
  }

  const modelos = new Map();

  function atualizarBonecos(v, dt) {
    const vivos = new Set();
    for (const d of v.jogadores) {
      const p = d.ref || d;
      vivos.add(p);
      let m = modelos.get(p);
      if (!m) { m = criarModeloJogador(p); modelos.set(p, m); }
      let pose = null;
      if (d.slide > 0 || d.chao > 0) pose = 'carrinho';
      else if (d.mergulho > 0) pose = 'mergulho';
      else if (!v.replay && (state === 'golo' || state === 'fim') && p.team === lastScorer) pose = 'festa';
      else if (d.cooldown > 0.12) pose = 'chuto';
      animarBoneco(m, d, dt, pose);
    }
    for (const d of v.arbitros) {
      const a = d.ref || d;
      vivos.add(a);
      let m = modelos.get(a);
      if (!m) { m = criarModeloArbitro(a); modelos.set(a, m); }
      let pose = null;
      if (a.tipo === 'arbitro' && d.cartaoT > 0 && d.cartao) {
        pose = 'braco';
        m.cartao.visible = true;
        m.cartao.material = matCartao[d.cartao];
      } else if (m.cartao) m.cartao.visible = false;
      if (a.tipo === 'fiscal' && d.bandeira > 0) pose = 'braco';
      animarBoneco(m, d, dt, pose);
    }
    for (const [k, m] of modelos) {
      if (!vivos.has(k)) { scene.remove(m.raiz); modelos.delete(k); }
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

  function atualizarBola(b, dt) {
    bola.position.set(X(b.x), b.z + RB, Z(b.y));
    const v = Math.hypot(b.vx, b.vy);
    if (v > 1) {
      eixo.set(b.vy, 0, -b.vx).normalize();
      rodar.setFromAxisAngle(eixo, v * dt / RB);
      bola.quaternion.premultiply(rodar);
    }
  }

  // ---------- Rede a abanar quando entra a bola ----------
  let estadoAntes = state;
  const abanao = { lado: -1, y: 0, z: 0, t: 99 };
  function atualizarRedes(b, dt) {
    if (state === 'golo' && estadoAntes !== 'golo') {
      abanao.lado = b.x < W / 2 ? 0 : 1;
      abanao.z = abanao.lado === 0 ? Z(b.y) : -Z(b.y);
      abanao.y = Math.max(4, b.z);
      abanao.t = 0;
    }
    estadoAntes = state;
    abanao.t += dt;
    for (let lado = 0; lado < 2; lado++) {
      const r = redesFundo[lado];
      const pos = r.geo.attributes.position;
      const ativo = lado === abanao.lado && abanao.t < 3;
      const amp = ativo ? 9 * Math.exp(-abanao.t * 1.6) * (0.6 + 0.4 * Math.cos(abanao.t * 14)) : 0;
      for (let i = 0; i < pos.count; i++) {
        const y = r.base[i * 3 + 1], z = r.base[i * 3 + 2];
        const w = amp ? Math.exp(-((y - abanao.y) ** 2 + (z - abanao.z) ** 2) / (2 * 16 * 16)) : 0;
        pos.setX(i, r.base[i * 3] - amp * w);
      }
      pos.needsUpdate = true;
    }
  }

  // ---------- Ecrã gigante com o resultado ----------
  const ecraCanvas = document.createElement('canvas');
  ecraCanvas.width = 512; ecraCanvas.height = 256;
  const ecraTex = new THREE.CanvasTexture(ecraCanvas);
  ecraTex.colorSpace = THREE.SRGBColorSpace;
  const ecra = new THREE.Group();
  const moldura = new THREE.Mesh(new THREE.BoxGeometry(124, 66, 4), matDe('#15181f'));
  const imagem = new THREE.Mesh(new THREE.PlaneGeometry(116, 58), new THREE.MeshBasicMaterial({ map: ecraTex }));
  imagem.position.z = 2.1;
  const pilar = new THREE.Mesh(new THREE.BoxGeometry(6, 140, 6), matBetao);
  pilar.position.y = -100;
  ecra.add(moldura, imagem, pilar);
  ecra.position.set(X(0) - 200, 175, Z(0) - 190);
  ecra.lookAt(0, 60, 0);
  scene.add(ecra);
  let ecraTexto = '';
  function atualizarEcra() {
    const golo = state === 'golo' && Math.floor(tempo.value * 3) % 2 === 0;
    const txt = `${score[0]}-${score[1]}-${golo}-${state === 'replay'}`;
    if (txt === ecraTexto) return;
    ecraTexto = txt;
    const g = ecraCanvas.getContext('2d');
    g.fillStyle = '#05070d'; g.fillRect(0, 0, 512, 256);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (golo) {
      g.fillStyle = '#ffd60a'; g.font = '900 120px sans-serif';
      g.fillText('GOLO!', 256, 135);
    } else {
      g.fillStyle = EQUIPAS[0].camisola; g.fillRect(20, 60, 14, 120);
      g.fillStyle = EQUIPAS[1].camisola; g.fillRect(478, 60, 14, 120);
      g.fillStyle = '#ffffff'; g.font = '900 64px sans-serif';
      g.fillText(EQUIPAS[0].curto, 110, 120);
      g.fillText(EQUIPAS[1].curto, 402, 120);
      g.font = '900 96px sans-serif';
      g.fillText(`${score[0]}-${score[1]}`, 256, 124);
      g.font = '700 26px sans-serif'; g.fillStyle = '#9fe0a6';
      g.fillText(state === 'replay' ? 'REPETIÇÃO' : 'FUTEBOL 26', 256, 215);
    }
    ecraTex.needsUpdate = true;
  }

  // ---------- Câmaras ----------
  const cam = { x: 0, z: 0, fov: 26 };
  const olhar = new THREE.Vector3();
  function atualizarCamara(v, dt) {
    if (state === 'titulo' || !ball) {
      const t = tempo.value * 0.06;
      camera.position.set(Math.cos(t) * 820, 300, Math.sin(t) * 620);
      camera.lookAt(0, 20, 0);
      if (camera.fov !== 40) { camera.fov = 40; camera.updateProjectionMatrix(); }
      return;
    }
    const b = v.bola;
    if (v.replay) {
      // Repetição: câmara atrás da baliza onde entrou o golo, a seguir a bola
      const lado = lastScorer === 0 ? 1 : -1;
      // Fica entre a baliza e a bancada, um pouco acima da trave
      camera.position.set(lado * (W / 2 + 72), 92, 45 * lado);
      olhar.lerp(new THREE.Vector3(X(b.x), b.z + 8, Z(b.y)), Math.min(1, dt * 6));
      camera.lookAt(olhar);
      const d = camera.position.distanceTo(olhar);
      camera.fov = clamp(2 * Math.atan(120 / d) * 180 / Math.PI, 9, 40);
      camera.updateProjectionMatrix();
      return;
    }
    const k = Math.min(1, dt * 2.5);
    // A câmara de TV vai um bocadinho à frente da jogada
    let tx = clamp(X(b.x) + b.vx * 0.25, -W / 2 + 190, W / 2 - 190);
    let tz = Z(b.y) * 0.55;
    let fov = 28;
    if (state === 'golo' || state === 'fim') {
      tx = X(b.x) * 0.9; tz = Z(b.y) * 0.6; fov = 19;
    }
    cam.x += (tx - cam.x) * k;
    cam.z += (tz - cam.z) * k;
    cam.fov += (fov - cam.fov) * Math.min(1, dt * 1.5);
    camera.fov = cam.fov;
    camera.updateProjectionMatrix();
    camera.position.set(cam.x * 0.8, 250, 600);
    olhar.set(cam.x, 0, cam.z + 20);
    camera.lookAt(olhar);
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
    const emJogo = state !== 'titulo' && ball;
    const v = emJogo ? vista() : null;
    let alvo = 0.08;
    if (state === 'golo' || state === 'fim') alvo = 1;
    else if (state === 'replay') alvo = 0.6;
    else if (ball && (ball.x < 170 || ball.x > W - 170)) alvo = 0.3;
    excitacao.value += (alvo - excitacao.value) * Math.min(1, dt * 3);
    for (const t of placasTex) t.offset.x += dt * 0.03;
    atualizarEcra();

    bola.visible = !!emJogo;
    if (emJogo) {
      atualizarBonecos(v, dt);
      atualizarBola(v.bola, dt);
      atualizarRedes(v.bola, dt);
    } else {
      for (const [, m] of modelos) scene.remove(m.raiz);
      modelos.clear();
    }
    marcadores.forEach((g, t) => {
      const p = human[t];
      g.visible = !!(emJogo && p && !v.replay && state !== 'golo' && state !== 'fim');
      if (g.visible) {
        g.position.set(X(p.x), 0, Z(p.y));
        g.userData.seta.position.y = 32 + Math.sin(tempo.value * 6) * 1.5;
      }
    });
    const sp = state === 'parada' && setPiece && setPiece.taker;
    setaMira.visible = !!(emJogo && sp && !setPiece.taker.gk);
    if (setaMira.visible) {
      setaMira.position.set(X(ball.x), 0, Z(ball.y));
      setaMira.rotation.y = -setPiece.taker.facing;
    }
    atualizarCamara(v, dt);
    renderer.render(scene, camera);
  }

  return { desenhar, noEcra };
})();
