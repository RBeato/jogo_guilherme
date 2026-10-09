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
  let sombrasBonecos = true;
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

  // ---------- Estádios (inspirados nos verdadeiros; não são cópias exatas) ----------
  const ESTADIOS = [
    { nome: 'Estádio da Luz', cidade: 'Lisboa', assentos: ['#c8102e', '#a50d26'], telhado: '#eef1f5', filas: 18, filasTopo: 15,
      telhadoTopos: true, dia: false },
    { nome: 'Estádio do Dragão', cidade: 'Porto', assentos: ['#1c4fa0', '#163f82'], telhado: '#d9dee6', filas: 17, filasTopo: 15,
      telhadoTopos: true, dia: false },
    { nome: 'Estádio José Alvalade', cidade: 'Lisboa', assentos: ['#f2c500', '#0b8a4b', '#ffffff', '#1c4fa0', '#e4572e'],
      telhado: '#c9ced6', filas: 17, filasTopo: 15, telhadoTopos: true, dia: false },
    { nome: 'Santiago Bernabéu', cidade: 'Madrid', assentos: ['#e9e9ee', '#c9cad3'], telhado: '#b9bec8', filas: 24, filasTopo: 20,
      telhadoTopos: true, dia: false, faixa: '#7fb7ff' },
    { nome: 'Wembley', cidade: 'Londres', assentos: ['#c8102e', '#a50d26'], telhado: '#e6e9ee', filas: 20, filasTopo: 18,
      telhadoTopos: true, dia: true, arco: true },
    { nome: 'Allianz Arena', cidade: 'Munique', assentos: ['#8d939e', '#6e747f'], telhado: '#f2f2f2', filas: 19, filasTopo: 17,
      telhadoTopos: true, dia: false, faixa: '#ff2a2a' },
    { nome: 'Maracanã', cidade: 'Rio de Janeiro', assentos: ['#1c4fa0', '#f2c500', '#ffffff'], telhado: '#f4f4f4', filas: 18,
      filasTopo: 18, telhadoTopos: true, dia: true },
  ];
  const ceuNoite = canvasTex(4, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#050a1c');
    grad.addColorStop(0.6, '#13224a');
    grad.addColorStop(1, '#2b3d6b');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
  const ceuDia = canvasTex(4, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#3d7fd6');
    grad.addColorStop(0.65, '#8fbdf0');
    grad.addColorStop(1, '#dcebfb');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });

  // ---------- Luzes (holofotes à noite, sol de dia) ----------
  const hemi = new THREE.HemisphereLight('#c8d8ff', '#2d5a2d', 1.1);
  scene.add(hemi);
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

  function aplicarCeu(tema) {
    if (tema.dia) {
      scene.background = ceuDia;
      scene.fog = new THREE.Fog('#bcd6f2', 1800, 4500);
      hemi.color.set('#dbe9ff'); hemi.intensity = 1.4;
      luz.color.set('#fff1d6'); luz.intensity = 3.2;
      luz.position.set(-420, 620, 260);     // sol mais baixo, sombras mais compridas
      luz2.intensity = 0.6;
    } else {
      scene.background = ceuNoite;
      scene.fog = new THREE.Fog('#1a2850', 1800, 4200);
      hemi.color.set('#c8d8ff'); hemi.intensity = 1.1;
      luz.color.set('#fff4e0'); luz.intensity = 2.6;
      luz.position.set(-260, 700, 380);
      luz2.intensity = 0.9;
    }
  }

  // ---------- Relva com riscas e linhas ----------
  const M = 90;   // relva à volta das linhas
  const texRelva = canvasTex((W + 2 * M) * 2.5, (H + 2 * M) * 2.5, (g) => {
    g.scale(2.5, 2.5);
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
    // Riscas mais finas no sentido contrário (corte em xadrez, como nos grandes estádios)
    for (let y = 0; y < H; y += 64) {
      g.fillStyle = Math.floor(y / 64) % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)';
      g.fillRect(-M, y, W + 2 * M, 64);
    }
    // Relva gasta à frente das balizas e no meio-campo
    const gasto = (x, y, r, a) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(120,110,60,${a})`);
      gr.addColorStop(1, 'rgba(120,110,60,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2); g.fill();
    };
    gasto(22, H / 2, 45, 0.35); gasto(W - 22, H / 2, 45, 0.35);
    gasto(110, H / 2, 14, 0.4); gasto(W - 110, H / 2, 14, 0.4);
    gasto(W / 2, H / 2, 30, 0.18);
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

  // ---------- Estádio: bancadas, adeptos, bandeiras e torres ----------
  // Construído por uma função para se poder trocar de estádio.
  const PELES = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
  let bracosAdeptos = [];
  let estadioAtual = null;
  let estadioIdx = 0;
  function construirEstadio(tema) {
    const estadio = new THREE.Group();
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
    const matsAssento = tema.assentos.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }));
    const matTelhado = new THREE.MeshStandardMaterial({ color: tema.telhado, roughness: 0.6 });
    // Junta várias geometrias numa só (para desenhar milhares de adeptos de uma vez)
    function juntar(geos) {
      const pos = [], nor = [], idx = [];
      let base = 0;
      for (const g0 of geos) {
        const g = g0.index ? g0 : g0;
        const p = g.attributes.position, n = g.attributes.normal;
        for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); }
        if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base);
        base += p.count;
      }
      const r = new THREE.BufferGeometry();
      r.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      r.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      r.setIndex(idx);
      return r;
    }
    // Adepto: tronco arredondado + cabeça; braços no ar só aparecem nos golos.
    // Todas as peças usam a mesma posição, para saltarem juntas.
    const geoCorpo = new THREE.CapsuleGeometry(1.55, 2.4, 2, 6).translate(0, 3.0, 0);
    geoCorpo.scale(1, 1, 0.8);
    const geoCabeca = new THREE.SphereGeometry(1.15, 7, 5).translate(0, 6.6, 0);
    const geoBracos = juntar([
      new THREE.BoxGeometry(0.7, 3.6, 0.7).rotateX(0.25).translate(0, 8.4, 1.6),
      new THREE.BoxGeometry(0.7, 3.6, 0.7).rotateX(-0.25).translate(0, 8.4, -1.6),
    ]);
    const matBracos = materialAdepto(new THREE.MeshLambertMaterial({ color: '#ffffff' }));
    bracosAdeptos = [];

    function bancada(comp, filas, px, pz, rotY, cores, telhado, paredeAlta = true) {
      const g = new THREE.Group();
      const prof = 9, sobe = 5.5, base = 8;
      // Muro da frente
      const muro = new THREE.Mesh(new THREE.BoxGeometry(comp, base, 3), matBetao);
      muro.position.set(0, base / 2, 1.5);
      g.add(muro);
      for (let i = 0; i < filas; i++) {
        const alt = base + i * sobe;
        // Degraus com as cores das cadeiras do estádio (vêem-se nos lugares vazios)
        const deg = new THREE.Mesh(new THREE.BoxGeometry(comp, alt, prof), matsAssento[i % matsAssento.length]);
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
        const t = new THREE.Mesh(new THREE.BoxGeometry(comp + 20, 3, filas * prof * 0.75), matTelhado);
        t.position.set(0, altT, -filas * prof * 0.62);
        t.rotation.x = -0.08;
        g.add(t);
        // Fila de luzes debaixo do telhado
        const luzes = new THREE.Mesh(new THREE.BoxGeometry(comp, 1.2, 1.2),
          new THREE.MeshBasicMaterial({ color: '#fffbe6' }));
        luzes.position.set(0, altT - 2.5, -filas * prof * 0.27);
        g.add(luzes);
        if (tema.faixa) {
          // Faixa de luz à volta do estádio (Allianz Arena vermelha, Bernabéu azul)
          const f = new THREE.Mesh(new THREE.BoxGeometry(comp + 20, 6, 1.5), new THREE.MeshBasicMaterial({ color: tema.faixa }));
          f.position.set(0, altT - 8, -filas * prof - 4.5);
          g.add(f);
        }
      }

      // Adeptos
      const passo = 5.2;
      const porFila = Math.floor(comp / passo);
      const total = porFila * filas;
      const corpos = new THREE.InstancedMesh(geoCorpo, matCorpo, total);
      const cabecas = new THREE.InstancedMesh(geoCabeca, matCabeca, total);
      const bracos = new THREE.InstancedMesh(geoBracos, matBracos, total);
      let nb = 0;
      const m = new THREE.Matrix4();
      const cor = new THREE.Color();
      let n = 0;
      for (let i = 0; i < filas; i++) {
        for (let j = 0; j < porFila; j++) {
          if (Math.random() < 0.06) continue;   // lugares vazios
          const x = -comp / 2 + passo / 2 + j * passo + (Math.random() - 0.5) * 1.2;
          const y = base + i * sobe;
          const z = -i * prof - prof / 2 + (Math.random() - 0.5) * 2;
          m.makeTranslation(x, y, z);
          corpos.setMatrixAt(n, m);
          cabecas.setMatrixAt(n, m);
          const camisola = cores[Math.floor(Math.random() * cores.length)];
          cor.set(camisola);
          corpos.setColorAt(n, cor);
          cor.set(PELES[Math.floor(Math.random() * PELES.length)]);
          cabecas.setColorAt(n, cor);
          if (Math.random() < 0.6) {
            bracos.setMatrixAt(nb, m);
            bracos.setColorAt(nb, cor);
            nb++;
          }
          n++;
        }
      }
      corpos.count = cabecas.count = n;
      bracos.count = nb;
      bracos.visible = false;
      bracosAdeptos.push(bracos);
      g.add(corpos, cabecas, bracos);
      g.position.set(px, 0, pz);
      g.rotation.y = rotY;
      estadio.add(g);
    }
    // Adeptos vestidos com as cores das duas equipas
    const adeptos = e => [e.camisola, e.camisola, e.camisola, e.calcoes, '#ffffff'];
    const vermelhos = adeptos(EQUIPAS[0]);
    const azuis = adeptos(EQUIPAS[1]);
    const mistos = [...vermelhos, ...azuis, '#ffd60a', '#222222'];
    const DB = 50;   // distância das bancadas às linhas
    // As bancadas compridas vão até aos cantos, para o estádio ficar fechado
    bancada(W + 2 * DB + 330, tema.filas, 0, Z(0) - DB, 0, mistos, true);
    // Bancada do lado da câmara: mais baixa e sem telhado, para não tapar o campo
    bancada(W + 2 * DB + 330, 7, 0, Z(H) + DB, Math.PI, mistos, false, false);
    bancada(H + 2 * DB, tema.filasTopo, X(0) - DB - 30, 0, Math.PI / 2, vermelhos, tema.telhadoTopos);
    bancada(H + 2 * DB, tema.filasTopo, X(W) + DB + 30, 0, -Math.PI / 2, azuis, tema.telhadoTopos);
    if (tema.arco) {
      // O arco branco de Wembley, por cima do estádio
      const arco = new THREE.Mesh(new THREE.TorusGeometry(640, 7, 8, 64, Math.PI), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }));
      arco.position.set(0, 0, Z(0) - DB - 60);
      arco.rotation.y = 0.12;
      arco.rotation.x = -0.35;
      estadio.add(arco);
    }

    // ---------- Bandeiras a esvoaçar na bancada ----------
    // Bandeira de cada equipa (país ou cores do clube)
    function texBandeira(eq) {
      const b = eq.bandeira || { tipo: 'v', cores: [eq.camisola, eq.calcoes] };
      return canvasTex(120, 80, (g, w, h) => {
        if (b.tipo === 'pt') {
          g.fillStyle = '#046a38'; g.fillRect(0, 0, w * 0.4, h);
          g.fillStyle = '#da291c'; g.fillRect(w * 0.4, 0, w * 0.6, h);
          g.fillStyle = '#ffe900'; g.beginPath(); g.arc(w * 0.4, h / 2, h * 0.24, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#da291c'; g.fillRect(w * 0.4 - 8, h / 2 - 10, 16, 18);
          g.fillStyle = '#ffffff'; g.fillRect(w * 0.4 - 5, h / 2 - 6, 10, 11);
        } else if (b.tipo === 'br') {
          g.fillStyle = '#009c3b'; g.fillRect(0, 0, w, h);
          g.fillStyle = '#ffdf00'; g.beginPath();
          g.moveTo(w / 2, 8); g.lineTo(w - 10, h / 2); g.lineTo(w / 2, h - 8); g.lineTo(10, h / 2); g.fill();
          g.fillStyle = '#002776'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.22, 0, Math.PI * 2); g.fill();
        } else if (b.tipo === 'cruz') {
          g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
          g.fillStyle = '#ce1124'; g.fillRect(w / 2 - 8, 0, 16, h); g.fillRect(0, h / 2 - 8, w, 16);
        } else if (b.tipo === 'h') {
          b.cores.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * h / b.cores.length, w, h / b.cores.length + 1); });
          if (b.sol) { g.fillStyle = '#f6b40e'; g.beginPath(); g.arc(w / 2, h / 2, 8, 0, Math.PI * 2); g.fill(); }
        } else {
          b.cores.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * w / b.cores.length, 0, w / b.cores.length + 1, h); });
        }
      });
    }
    const texPOR = texBandeira(EQUIPAS[0]);
    const texFRA = texBandeira(EQUIPAS[1]);
    function matBandeira(tex) {
      const m = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 });
      m.onBeforeCompile = sh => {
        sh.uniforms.uTempo = tempo;
        sh.vertexShader = 'uniform float uTempo;\n' + sh.vertexShader.replace('#include <begin_vertex>',
          `#include <begin_vertex>
          float solto = (position.x + 13.0) / 26.0;
          transformed.z += sin(position.x * 0.35 - uTempo * 5.0 + position.y * 0.2) * 2.2 * solto;
          transformed.y += sin(position.x * 0.25 - uTempo * 4.0) * 0.6 * solto;`);
      };
      return m;
    }
    const geoBand = new THREE.PlaneGeometry(26, 17, 14, 6).translate(13, 0, 0);
    const matPOR = matBandeira(texPOR), matFRA = matBandeira(texFRA);
    const geoMastro = new THREE.CylinderGeometry(0.35, 0.35, 34, 5);
    const matMastro = new THREE.MeshStandardMaterial({ color: '#cccccc' });
    function bandeira(x, z, y, rot, portugal) {
      const g = new THREE.Group();
      const pau = new THREE.Mesh(geoMastro, matMastro);
      pau.position.y = 17;
      const b = new THREE.Mesh(geoBand, portugal ? matPOR : matFRA);
      b.position.y = 25;
      g.add(pau, b);
      g.position.set(x, y, z);
      g.rotation.y = rot;
      estadio.add(g);
    }
    for (let i = 0; i < 9; i++) {
      const x = -W / 2 + 60 + i * 115;
      bandeira(x, Z(0) - DB - 40 - (i % 3) * 30, 20 + (i % 3) * 16, Math.random() * 0.6, i % 2 === 0);
    }
    for (let i = 0; i < 5; i++) {
      bandeira(X(0) - DB - 70 - (i % 2) * 30, -H / 2 + 80 + i * 120, 24 + (i % 2) * 10, Math.PI / 2, true);
      bandeira(X(W) + DB + 70 + (i % 2) * 30, -H / 2 + 80 + i * 120, 24 + (i % 2) * 10, -Math.PI / 2, false);
    }

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
      brilho.visible = !tema.dia;
      estadio.add(torre, painel, brilho);
    }
    scene.add(estadio);
    return estadio;
  }

  function mudarEstadio(i) {
    estadioIdx = (i + ESTADIOS.length) % ESTADIOS.length;
    if (estadioAtual) {
      scene.remove(estadioAtual);
      estadioAtual.traverse(o => {
        if (o.userData.partilhado) return;   // geometrias/materiais dos bonecos são partilhados
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach(m => { if (m.map && m.map !== texPlacas) m.map.dispose(); m.dispose(); });
      });
    }
    const tema = ESTADIOS[estadioIdx];
    aplicarCeu(tema);
    estadioAtual = construirEstadio(tema);
    bancoSuplentes(estadioAtual, 0, -110);
    bancoSuplentes(estadioAtual, 1, 110);
    ecraTexto = '';
  }

  // ---------- Jogadores e árbitros ----------
  // Bonecos com corpo arredondado, joelhos e cotovelos que dobram.
  const capsula = (r, l) => new THREE.CapsuleGeometry(r, l, 3, 10);
  const geo = {
    peito: capsula(2.8, 1.8),
    barriga: capsula(2.5, 1.4),
    calcao: new THREE.CylinderGeometry(2.85, 3.25, 3.8, 14),
    pescoco: new THREE.CylinderGeometry(0.75, 0.9, 1.8, 8),
    cabeca: new THREE.SphereGeometry(1.85, 18, 14),
    queixo: new THREE.SphereGeometry(1.3, 12, 8),
    cabelo: new THREE.SphereGeometry(2.06, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.47),
    rapado: new THREE.SphereGeometry(1.9, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.46),
    volume: new THREE.SphereGeometry(2.25, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
    topete: new THREE.SphereGeometry(1.2, 10, 6),
    barba: new THREE.SphereGeometry(1.95, 16, 8, Math.PI / 2, Math.PI, Math.PI * 0.52, Math.PI * 0.32),
    nariz: new THREE.SphereGeometry(0.36, 6, 4),
    olho: new THREE.SphereGeometry(0.36, 8, 6),
    pupila: new THREE.SphereGeometry(0.19, 6, 4),
    sobrancelha: new THREE.BoxGeometry(0.24, 0.22, 0.8),
    boca: new THREE.BoxGeometry(0.2, 0.2, 0.85),
    orelha: new THREE.SphereGeometry(0.44, 6, 4),
    coxa: capsula(1.3, 3.9),
    canela: capsula(1.0, 4.0),
    bota: capsula(0.8, 2.0),
    manga: capsula(0.95, 1.2),
    braco: capsula(0.72, 2.6),
    antebraco: capsula(0.66, 2.8),
    mao: new THREE.SphereGeometry(0.75, 8, 6),
    luva: new THREE.SphereGeometry(1.25, 8, 6),
    numero: new THREE.PlaneGeometry(4.4, 4.4),
    gola: new THREE.TorusGeometry(0.95, 0.24, 6, 14),
    faixa: new THREE.CylinderGeometry(1.08, 1.08, 0.6, 10),
    pau: new THREE.CylinderGeometry(0.2, 0.2, 7, 5),
    bandeira: new THREE.PlaneGeometry(3.6, 2.8),
    cartao: new THREE.BoxGeometry(0.3, 3.0, 2.0),
  };
  const mat = {};
  const matDe = (cor) => mat[cor] || (mat[cor] = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.72 }));
  const texNum = {};
  function matNumero(num, cor, nome) {
    const k = num + cor + (nome || '');
    if (!texNum[k]) {
      const t = canvasTex(128, 128, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = cor;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        if (nome) {
          g.font = 'bold 19px sans-serif';
          g.fillText(nome.toUpperCase(), w / 2, 16, w - 6);
        }
        g.font = 'bold 84px "Arial Black", sans-serif';
        g.fillText(String(num), w / 2, nome ? 76 : 66);
      });
      texNum[k] = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false });
    }
    return texNum[k];
  }
  const CABELOS = ['#1b1209', '#3b2412', '#6b4423', '#c9a15b', '#0d0d0d'];
  const matCartao = { amarelo: new THREE.MeshBasicMaterial({ color: '#ffd60a' }), vermelho: new THREE.MeshBasicMaterial({ color: '#ef233c' }) };

  // Boneco com proporções de pessoa (cerca de 25 unidades de altura, pernas ~ metade).
  // kit: { camisola, calcoes, meias, pele, cabelo, estilo, barba, numero, corNumero, luvas }
  function criarBoneco(kit) {
    const raiz = new THREE.Group();
    const corpo = new THREE.Group();
    raiz.add(corpo);
    const mesh = (g, cor, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(g, typeof cor === 'string' ? matDe(cor) : cor);
      m.position.set(x, y, z);
      m.userData.partilhado = true;
      return m;
    };
    const calcao = mesh(geo.calcao, kit.calcoes, 0, 12.4, 0);
    calcao.scale.set(0.74, 1, 1.05);
    const barriga = mesh(geo.barriga, kit.camisola, 0, 15.2, 0);
    barriga.scale.set(0.66, 1, 1.0);
    const peito = mesh(geo.peito, kit.camisola, 0, 17.9, 0);
    peito.scale.set(0.64, 0.9, 1.2);              // peito mais largo do que a cintura
    corpo.add(calcao, barriga, peito, mesh(geo.pescoco, kit.pele, 0, 21.4, 0));
    const gola = mesh(geo.gola, kit.gola || kit.calcoes, 0, 20.75, 0);
    gola.rotation.x = Math.PI / 2;
    gola.scale.set(1, 1.15, 1);
    corpo.add(gola);
    if (kit.numero !== undefined) {
      // Costas: nome e número; frente: número pequeno
      const n = mesh(geo.numero, matNumero(kit.numero, kit.corNumero, kit.nomeCostas), -1.86, 17.5, 0);
      n.rotation.y = -Math.PI / 2;
      const f = mesh(geo.numero, matNumero(kit.numero, kit.corNumero), 1.86, 18.6, -0.9);
      f.scale.set(0.35, 0.35, 1);
      f.rotation.y = Math.PI / 2;
      corpo.add(n, f);
    }

    // Cabeça (num grupo próprio, para poder olhar para a bola)
    const cabeca = new THREE.Group();
    cabeca.position.set(0.1, 23.2, 0);
    const queixo = mesh(geo.queixo, kit.pele, 0.45, -0.75, 0);
    queixo.scale.set(1, 0.9, 1.05);
    cabeca.add(mesh(geo.cabeca, kit.pele), queixo,
      mesh(geo.nariz, kit.pele, 1.85, -0.15, 0),
      mesh(geo.boca, '#7a2e2e', 1.68, -0.85, 0));
    for (const s of [-1, 1]) {
      const olho = mesh(geo.olho, '#ffffff', 1.5, 0.35, s * 0.66);
      olho.scale.set(0.55, 1, 1);
      cabeca.add(olho,
        mesh(geo.pupila, '#1a120b', 1.72, 0.35, s * 0.66),
        mesh(geo.sobrancelha, kit.cabelo, 1.66, 0.85, s * 0.66),
        mesh(geo.orelha, kit.pele, 0, 0.05, s * 1.82));
    }
    // Cabelo: a linha do cabelo fica acima da testa e desce atrás da cabeça
    const estilo = kit.estilo || 'curto';
    const cabelo = mesh(geo[estilo === 'topete' ? 'cabelo' : estilo], kit.cabelo);
    cabelo.rotation.z = 0.36;
    if (estilo === 'curto' || estilo === 'topete') cabelo.scale.set(1, 1.12, 1);   // cabelo com volume em cima
    cabeca.add(cabelo);
    if (estilo === 'topete') {
      const t = mesh(geo.topete, kit.cabelo, 1.0, 1.65, 0);
      t.scale.set(1.1, 0.7, 1.4);
      cabeca.add(t);
    }
    if (kit.barba) cabeca.add(mesh(geo.barba, kit.cabelo));
    corpo.add(cabeca);

    const ancas = [], joelhos = [], ombros = [], cotovelos = [];
    for (const s of [-1, 1]) {
      const anca = new THREE.Group();
      anca.position.set(0, 12.6, s * 1.6);
      anca.add(mesh(geo.coxa, kit.pele, 0, -3.0, 0));
      const joelho = new THREE.Group();
      joelho.position.y = -6.0;
      joelho.add(mesh(geo.canela, kit.meias, 0, -3.0, 0));
      const faixa = mesh(geo.faixa, kit.gola || kit.calcoes, 0, -0.9, 0);
      joelho.add(faixa);
      const bota = mesh(geo.bota, kit.botas || '#111111', 0.7, -5.95, 0);
      bota.rotation.z = Math.PI / 2;
      joelho.add(bota);
      anca.add(joelho);
      corpo.add(anca);
      ancas.push(anca); joelhos.push(joelho);

      const ombro = new THREE.Group();
      ombro.position.set(0, 20.4, s * 3.5);
      ombro.add(mesh(geo.manga, kit.camisola, 0, -1.0, 0), mesh(geo.braco, kit.pele, 0, -2.4, 0));
      const cotovelo = new THREE.Group();
      cotovelo.position.y = -4.4;
      cotovelo.add(mesh(geo.antebraco, kit.pele, 0, -2.0, 0));
      cotovelo.add(kit.luvas ? mesh(geo.luva, kit.luvas, 0, -4.4, 0) : mesh(geo.mao, kit.pele, 0, -4.2, 0));
      ombro.add(cotovelo);
      corpo.add(ombro);
      ombros.push(ombro); cotovelos.push(cotovelo);
    }
    raiz.traverse(o => { if (o.isMesh) o.castShadow = sombrasBonecos; });
    scene.add(raiz);
    return { raiz, corpo, cabeca, ancas, joelhos, ombros, cotovelos, fase: Math.random() * 6 };
  }

  function criarModeloJogador(p) {
    const eq = EQUIPAS[p.team];
    const camisola = p.gk ? eq.gr : eq.camisola;
    return criarBoneco({
      camisola, calcoes: p.gk ? '#222222' : eq.calcoes, meias: p.gk ? camisola : (eq.meias || camisola),
      pele: (p.aspeto && p.aspeto.pele) || PELES[(p.num * 7 + p.team * 3) % PELES.length],
      cabelo: (p.aspeto && p.aspeto.cabelo) || CABELOS[(p.num + p.team) % CABELOS.length],
      estilo: p.aspeto && p.aspeto.estilo, barba: p.aspeto && p.aspeto.barba,
      numero: p.num, corNumero: eq.numero, luvas: p.gk ? '#f8f9fa' : null,
      nomeCostas: p.nome.split(' ').slice(-1)[0], gola: eq.gola,
      botas: (p.aspeto && p.aspeto.botas) || ['#111111', '#00b4d8', '#e63946', '#f5f5f5', '#ffd60a'][(p.num * 3 + p.team) % 5],
    });
  }

  function criarModeloArbitro(a) {
    const m = criarBoneco({ camisola: '#111111', calcoes: '#111111', meias: '#111111', pele: '#e0ac69', cabelo: '#1b1209',
      estilo: a.tipo === 'arbitro' ? 'rapado' : 'curto', barba: a.tipo === 'arbitro' });
    // Mão direita: cartão (árbitro) ou bandeira (fiscal)
    const mao = m.cotovelos[1];
    if (a.tipo === 'arbitro') {
      m.cartao = new THREE.Mesh(geo.cartao, matCartao.amarelo);
      m.cartao.position.set(0, -5.2, 0);
      m.cartao.visible = false;
      mao.add(m.cartao);
    } else {
      const pau = new THREE.Mesh(geo.pau, matDe('#dddddd'));
      pau.position.set(0.6, -6.0, 0);
      const band = new THREE.Mesh(geo.bandeira, new THREE.MeshStandardMaterial({ color: '#ffd60a', side: THREE.DoubleSide }));
      band.position.set(0.6, -7.8, 1.8);
      band.rotation.y = Math.PI / 2;
      mao.add(pau, band);
    }
    return m;
  }

  // Põe o boneco na pose certa: correr, parado, guarda-redes à espera, carrinho, mergulho, festa...
  function animarBoneco(m, d, dt, pose, olharPara) {
    const vel = Math.hypot(d.vx, d.vy);
    m.fase += vel * dt * 0.09;
    const amp = Math.min(1, vel / 150);
    const s = Math.sin(m.fase);
    m.raiz.position.set(X(d.x), 0, Z(d.y));
    m.raiz.rotation.y = -d.facing;
    m.corpo.rotation.set(0, 0, 0);
    m.corpo.position.set(0, 0, 0);
    // Respirar quando está parado
    const resp = Math.sin(tempo.value * 2.2 + m.fase) * 0.06 * (1 - amp);
    for (let i = 0; i < 2; i++) {
      const fase = m.fase + i * Math.PI;
      const lado = i === 0 ? -1 : 1;
      m.ancas[i].rotation.set(0, 0, Math.sin(fase) * amp * 0.9 + 0.05);
      m.joelhos[i].rotation.z = -0.1 - amp * (0.15 + 1.2 * Math.max(0, Math.cos(fase)));
      m.ombros[i].rotation.set(lado * 0.1, 0, -Math.sin(fase) * amp * 0.8 + resp);
      m.cotovelos[i].rotation.z = 0.25 + amp * 0.9;
    }
    m.corpo.rotation.z = -amp * 0.16;                        // inclina-se para a frente a correr
    // Inclina-se para dentro das curvas
    let viragem = d.facing - (m.ultimaDir === undefined ? d.facing : m.ultimaDir);
    while (viragem > Math.PI) viragem -= 2 * Math.PI;
    while (viragem < -Math.PI) viragem += 2 * Math.PI;
    m.ultimaDir = d.facing;
    m.inclina = (m.inclina || 0) + (clamp(-viragem / Math.max(dt, 0.001) * 0.05 * amp, -0.3, 0.3) - (m.inclina || 0)) * Math.min(1, dt * 8);
    m.corpo.rotation.x = m.inclina;
    m.corpo.position.y = Math.abs(s) * amp * 0.9 - (1 - Math.cos(m.joelhos[0].rotation.z)) * 0.5;

    // A cabeça segue a bola
    m.cabeca.rotation.set(0, 0, 0);
    if (olharPara !== undefined) {
      let rel = olharPara - d.facing;
      while (rel > Math.PI) rel -= 2 * Math.PI;
      while (rel < -Math.PI) rel += 2 * Math.PI;
      m.cabeca.rotation.y = -clamp(rel, -1.1, 1.1);
    }

    if (pose === 'carrinho') {
      m.corpo.rotation.z = 1.2;
      m.corpo.position.set(-4, 3, 0);
      m.ancas[0].rotation.z = 0.15; m.ancas[1].rotation.z = 0.45;
      m.joelhos[0].rotation.z = -0.9; m.joelhos[1].rotation.z = 0;
      m.ombros[0].rotation.z = m.ombros[1].rotation.z = -0.9;
    } else if (pose === 'guarda') {
      // Guarda-redes à espera: agachado, braços abertos
      m.corpo.position.y = -2.2;
      m.corpo.rotation.z = -0.3;
      for (let i = 0; i < 2; i++) {
        const lado = i === 0 ? -1 : 1;
        m.ancas[i].rotation.z = 0.7 + Math.sin(m.fase) * amp * 0.3;
        m.ancas[i].rotation.x = lado * 0.15;
        m.joelhos[i].rotation.z = -1.0;
        m.ombros[i].rotation.set(lado * 0.7, 0, 0.6);
        m.cotovelos[i].rotation.z = 0.5;
      }
    } else if (pose === 'mergulho') {
      const lado = Math.sign(Math.cos(d.facing) || 1) * d.mergulhoDir;
      const k = Math.min(1, (0.7 - d.mergulho) / 0.15);
      m.corpo.rotation.x = lado * 1.35 * k;
      m.corpo.position.set(0, 4 * k, 0);
      m.ombros[0].rotation.set(lado * 0.3, 0, Math.PI * 0.95);
      m.ombros[1].rotation.set(lado * 0.3, 0, Math.PI * 0.95);
      m.cotovelos[0].rotation.z = m.cotovelos[1].rotation.z = 0;
      m.joelhos[0].rotation.z = -0.3; m.joelhos[1].rotation.z = -0.1;
    } else if (pose === 'festa') {
      const salto = Math.abs(Math.sin(tempo.value * 8 + m.fase));
      m.corpo.rotation.z = 0;
      m.corpo.position.set(0, salto * 4, 0);
      m.ancas[0].rotation.z = m.ancas[1].rotation.z = 0;
      m.joelhos[0].rotation.z = m.joelhos[1].rotation.z = -salto * 0.6;
      m.ombros[0].rotation.set(0.35, 0, Math.PI * 0.92);
      m.ombros[1].rotation.set(-0.35, 0, Math.PI * 0.92);
      m.cotovelos[0].rotation.z = m.cotovelos[1].rotation.z = 0.1;
      m.cabeca.rotation.set(0, 0, 0.4);
    } else if (pose === 'chuto') {
      m.ancas[1].rotation.z = 1.3;
      m.joelhos[1].rotation.z = -0.1;
      m.ancas[0].rotation.z = -0.25;
      m.joelhos[0].rotation.z = -0.3;
      m.ombros[0].rotation.set(-0.6, 0, 0.7); m.ombros[1].rotation.set(0.6, 0, -0.6);
      m.corpo.rotation.z = 0.1;
    } else if (pose === 'cabeca') {
      m.corpo.position.y = 3;
      m.corpo.rotation.z = -0.35;
      m.ombros[0].rotation.set(-0.8, 0, 0.3); m.ombros[1].rotation.set(0.8, 0, 0.3);
      m.joelhos[0].rotation.z = m.joelhos[1].rotation.z = -0.8;
    } else if (pose === 'sentado') {
      m.corpo.position.y = -5.6;
      for (let i = 0; i < 2; i++) {
        m.ancas[i].rotation.z = 1.5;
        m.joelhos[i].rotation.z = -1.5;
        m.ombros[i].rotation.z = 0.35;
        m.cotovelos[i].rotation.z = 1.1;
      }
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
      const b = v.bola;
      if (d.slide > 0 || d.chao > 0) pose = 'carrinho';
      else if (d.mergulho > 0) pose = 'mergulho';
      else if (!v.replay && (state === 'golo' || state === 'fim') && p.team === lastScorer) pose = 'festa';
      else if (d.cabeceou > 0) pose = 'cabeca';
      else if (d.cooldown > 0.12) pose = 'chuto';
      else if (p.gk && (p.team === 0 ? b.x < 330 : b.x > W - 330) && Math.hypot(d.vx, d.vy) < 90 &&
               !(ball.owner === p)) pose = 'guarda';
      animarBoneco(m, d, dt, pose, Math.atan2(b.y - d.y, b.x - d.x));
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
      animarBoneco(m, d, dt, pose, Math.atan2(v.bola.y - d.y, v.bola.x - d.x));
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
  // Textura da bola como uma bola a sério: 12 pentágonos e 20 hexágonos com costuras.
  // Os centros dos gomos são os vértices de um icosaedro (pentágonos) e de um dodecaedro (hexágonos).
  const texBola = (() => {
    const fi = (1 + Math.sqrt(5)) / 2;
    const pent = [], hexa = [];
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      pent.push([0, a, b * fi], [a, b * fi, 0], [b * fi, 0, a]);
    }
    for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) hexa.push([a, b, c]);
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      hexa.push([0, a / fi, b * fi], [a / fi, b * fi, 0], [b * fi, 0, a / fi]);
    }
    const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
    const centros = [...pent.map(v => ({ v: norm(v), p: true })), ...hexa.map(v => ({ v: norm(v), p: false }))];
    const w = 1024, h = 512;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    for (let j = 0; j < h; j++) {
      const lat = Math.PI * (0.5 - (j + 0.5) / h);
      for (let i = 0; i < w; i++) {
        const lon = 2 * Math.PI * ((i + 0.5) / w) - Math.PI;
        const d = [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
        let m1 = -2, m2 = -2, c1 = null;
        for (const ce of centros) {
          // Os pentágonos são mais pequenos do que os hexágonos
          const dot = d[0] * ce.v[0] + d[1] * ce.v[1] + d[2] * ce.v[2] - (ce.p ? 0.03 : 0);
          if (dot > m1) { m2 = m1; m1 = dot; c1 = ce; } else if (dot > m2) m2 = dot;
        }
        let r, gg, b;
        if (m1 - m2 < 0.012) { r = gg = b = 70; }                 // costura
        else if (c1.p) { r = 22; gg = 24; b = 30; }               // pentágono preto
        else {                                                     // hexágono branco
          const brilho = 238 + (m1 - m2) * 60;
          r = gg = b = Math.min(255, brilho);
        }
        const k = (j * w + i) * 4;
        img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  })();
  const bola = new THREE.Mesh(new THREE.SphereGeometry(RB, 40, 28),
    new THREE.MeshPhysicalMaterial({ map: texBola, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25 }));
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
  const pilar = new THREE.Mesh(new THREE.BoxGeometry(6, 140, 6), new THREE.MeshStandardMaterial({ color: '#5b6070' }));
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
      g.fillText(state === 'replay' ? 'REPETIÇÃO' : ESTADIOS[estadioIdx].nome.toUpperCase(), 256, 215);
    }
    ecraTex.needsUpdate = true;
  }

  // ---------- Câmaras ----------
  const cam = { x: 0, z: 0, fov: 26 };
  const alvoPos = new THREE.Vector3(), alvoOlhar = new THREE.Vector3();
  const camPos = new THREE.Vector3(0, 250, 600), camOlhar = new THREE.Vector3();
  let modoCamara = 'tv', transicao = 1;
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
    if (window.CAMARA_TESTE) {   // só para testes: câmara fixa
      const c = window.CAMARA_TESTE;
      camera.position.set(...c.pos); camera.lookAt(...c.alvo);
      camera.fov = c.fov || 30; camera.updateProjectionMatrix();
      return;
    }
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
    // Câmara de TV (de lado), que vai um bocadinho à frente da jogada
    const k = Math.min(1, dt * 2.5);
    let tx = clamp(X(b.x) + b.vx * 0.25, -W / 2 + 190, W / 2 - 190);
    let tz = Z(b.y) * 0.55;
    let fov = 28;
    if (state === 'golo' || state === 'fim') {
      tx = X(b.x) * 0.9; tz = Z(b.y) * 0.6; fov = 19;
    }
    cam.x += (tx - cam.x) * k;
    cam.z += (tz - cam.z) * k;
    cam.fov += (fov - cam.fov) * Math.min(1, dt * 1.5);
    alvoPos.set(cam.x * 0.8, 250, 600);
    alvoOlhar.set(cam.x, 0, cam.z + 20);
    let alvoFov = cam.fov;
    let modo = 'tv';

    // Livres e penáltis: câmara atrás de quem vai bater, a olhar para a baliza (como no FC)
    if (state === 'parada' && setPiece && setPiece.taker && (setPiece.tipo === 'livre' || setPiece.tipo === 'penalti')) {
      modo = 'livre';
      const goalX = setPiece.team === 0 ? W : 0;
      const a = Math.atan2(H / 2 - b.y, goalX - b.x);
      const bx = X(b.x), bz = Z(b.y);
      // Um pouco atrás, por cima e ao lado de quem bate, para se ver a bola, a barreira e a baliza
      const px = -Math.sin(a), pz = Math.cos(a);
      alvoPos.set(bx - Math.cos(a) * 105 + px * 24, 46, bz - Math.sin(a) * 105 + pz * 24);
      alvoOlhar.set(bx + Math.cos(a) * 170, 14, bz + Math.sin(a) * 170);
      alvoFov = 50;
    }
    // Ao trocar de câmara, desliza suavemente em vez de saltar
    if (modo !== modoCamara) { modoCamara = modo; transicao = 0; }
    transicao = Math.min(1, transicao + dt * 1.2);
    const suave = transicao >= 1 ? 1 : Math.min(1, dt * 3.5);
    camPos.lerp(alvoPos, suave);
    camOlhar.lerp(alvoOlhar, suave);
    camera.fov += (alvoFov - camera.fov) * suave;
    camera.updateProjectionMatrix();
    camera.position.copy(camPos);
    camera.lookAt(camOlhar);
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
    for (const b of bracosAdeptos) b.visible = excitacao.value > 0.5;
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
      g.visible = !!(emJogo && p && !v.replay && state !== 'golo' && state !== 'fim' && modoCamara !== 'livre');
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

  // ---------- Bancos de suplentes com treinadores ----------
  function bancoSuplentes(pai, team, xCentro) {
    const eq = EQUIPAS[team];
    const zBanco = Z(H) + 22;
    const vidro = new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.3, roughness: 0.1 });
    const estrutura = new THREE.MeshStandardMaterial({ color: '#2b2f38', roughness: 0.6 });
    const g = new THREE.Group();
    const fundo = new THREE.Mesh(new THREE.BoxGeometry(60, 16, 1), estrutura);
    fundo.position.set(0, 8, 5);
    const teto = new THREE.Mesh(new THREE.BoxGeometry(62, 1, 12), vidro);
    teto.position.set(0, 16, 0);
    const banco = new THREE.Mesh(new THREE.BoxGeometry(56, 5, 4), matDe(eq.camisola));
    banco.position.set(0, 2.5, 2.5);
    g.add(fundo, teto, banco);
    g.position.set(xCentro, 0, zBanco);
    pai.add(g);
    // Suplentes sentados
    [12, 14, 23, 18].forEach((num, i) => {
      const m = criarBoneco({
        camisola: eq.camisola, calcoes: eq.calcoes, meias: eq.meias || eq.camisola, pele: PELES[(num + i + team) % PELES.length],
        cabelo: CABELOS[(num + team) % CABELOS.length], estilo: ['curto', 'rapado', 'volume', 'curto'][i],
        numero: num, corNumero: eq.numero, gola: eq.gola,
      });
      pai.add(m.raiz);
      animarBoneco(m, { x: xCentro - 21 + i * 14 + W / 2, y: H + 22 + 1.5, facing: -Math.PI / 2, vx: 0, vy: 0 }, 0, 'sentado');
    });
    // Treinador de pé à frente do banco, a olhar para o jogo
    const t = criarBoneco({ camisola: '#1d1f24', calcoes: '#1d1f24', meias: '#1d1f24', pele: '#e3b083', cabelo: '#555555',
      estilo: 'curto', barba: team === 1 });
    pai.add(t.raiz);
    animarBoneco(t, { x: xCentro + W / 2 + 36, y: H + 12, facing: -Math.PI / 2, vx: 0, vy: 0 }, 0, null);
  }

  // Qualidade mais baixa para computadores lentos
  function baixarQualidade() {
    renderer.setPixelRatio(1);
    luz.shadow.mapSize.set(1024, 1024);
    if (luz.shadow.map) { luz.shadow.map.dispose(); luz.shadow.map = null; }
    redimensionar();
  }

  mudarEstadio(0);

  return {
    desenhar, noEcra,
    mudarEstadio: d => mudarEstadio(estadioIdx + d),
    baixarQualidade,
    get estadio() { return ESTADIOS[estadioIdx]; },
  };
})();
