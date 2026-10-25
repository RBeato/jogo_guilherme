// Futebol 26 — constrói o corpo dos jogadores a partir do MakeHuman (2.ª parte, em Node)
//
// Uso:  node ferramentas/makehuman_jogo.js <corpo.json da 1.ª parte> <pasta do makehuman-data-v1> modelo_humano.js
//
// Simplifica as malhas (para 22 jogadores não pesarem), prepara as texturas (pele, cabelo, olhos)
// e escreve um ficheiro .js que o jogo carrega com <script> (funciona também a abrir o index.html no PC).
// Precisa de: npm install meshoptimizer@0.21.0   e do Python com Pillow (para as imagens).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { MeshoptSimplifier } = require('meshoptimizer');

const [, , ENTRADA, PASTA_MH, SAIDA] = process.argv;
const dados = JSON.parse(fs.readFileSync(ENTRADA, 'utf8'));
const DADOS_MH = path.join(PASTA_MH, 'public', 'data');

// Quanto fica de cada parte depois de simplificar (a cara fica com mais detalhe)
const FICA = { rosto: 0.6, pele: 0.28, camisola: 0.3, calcoes: 0.3, meias: 0.3, botas: 0.35, maos: 0.3 };
// Afastar o equipamento da pele, para parecer pano e não pintura (em unidades do MakeHuman, ~dm)
const FOLGA = { camisola: 0.1, calcoes: 0.2, meias: 0.05, botas: 0.08 };

const b64 = (arr) => Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString('base64');

function normaisPorVertice(pos, idx) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const [a, b, c] = [idx[i] * 3, idx[i + 1] * 3, idx[i + 2] * 3];
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const k of [a, b, c]) { n[k] += nx; n[k + 1] += ny; n[k + 2] += nz; }
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
  }
  return n;
}

// Uma parte (grupo de faces) vira uma malha própria: vértices únicos por (vértice, uv), triangulada e simplificada
function construirGrupo(vertsBase, normBase, uvsBase, faces, fica, folga, pesosIdx, pesos) {
  const mapa = new Map();
  const pos = [], uv = [], si = [], sw = [], tri = [];
  const vert = (v, t) => {
    const k = v * 100000 + t;
    if (mapa.has(k)) return mapa.get(k);
    const id = pos.length / 3;
    mapa.set(k, id);
    pos.push(vertsBase[v * 3] + normBase[v * 3] * folga, vertsBase[v * 3 + 1] + normBase[v * 3 + 1] * folga,
      vertsBase[v * 3 + 2] + normBase[v * 3 + 2] * folga);
    uv.push(uvsBase[t * 2], uvsBase[t * 2 + 1]);
    for (let j = 0; j < 4; j++) { si.push(pesosIdx[v * 4 + j]); sw.push(pesos[v * 4 + j]); }
    return id;
  };
  for (const [vs, ts] of faces) {
    const ids = vs.map((v, i) => vert(v, ts[i]));
    tri.push(ids[0], ids[1], ids[2]);
    if (ids.length === 4) tri.push(ids[0], ids[2], ids[3]);
  }
  let idx = new Uint32Array(tri);
  const p = new Float32Array(pos);
  if (fica < 1) {
    const alvo = Math.floor(idx.length * fica / 3) * 3;
    const [novo] = MeshoptSimplifier.simplify(idx, p, 3, alvo, 0.02, ['LockBorder']);
    idx = novo;
  }
  return { pos: p, uv: new Float32Array(uv), si: new Uint8Array(si), sw: new Float32Array(sw), idx };
}

// Junta os grupos num só conjunto de buffers (com a lista de grupos para os materiais)
function juntar(grupos) {
  const total = grupos.reduce((s, g) => s + g.dados.pos.length / 3, 0);
  const pos = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  const si = new Uint8Array(total * 4), sw = new Uint8Array(total * 4);
  const idxs = [];
  const lista = [];
  let base = 0, inicio = 0;
  for (const { nome, dados: d } of grupos) {
    // compactar: só os vértices usados
    const usado = new Int32Array(d.pos.length / 3).fill(-1);
    let n = 0;
    for (const i of d.idx) if (usado[i] < 0) usado[i] = n++;
    for (let i = 0; i < usado.length; i++) {
      const j = usado[i];
      if (j < 0) continue;
      const o = base + j;
      pos.set(d.pos.subarray(i * 3, i * 3 + 3), o * 3);
      uv.set(d.uv.subarray(i * 2, i * 2 + 2), o * 2);
      si.set(d.si.subarray(i * 4, i * 4 + 4), o * 4);
      for (let k = 0; k < 4; k++) sw[o * 4 + k] = Math.round(d.sw[i * 4 + k] * 255);
    }
    for (const i of d.idx) idxs.push(base + usado[i]);
    lista.push({ nome, inicio, total: d.idx.length });
    inicio += d.idx.length;
    base += n;
  }
  return {
    pos: pos.slice(0, base * 3), uv: uv.slice(0, base * 2), si: si.slice(0, base * 4), sw: sw.slice(0, base * 4),
    idx: base < 65536 ? new Uint16Array(idxs) : new Uint32Array(idxs), grupos: lista,
  };
}

// Imagens (com Python + Pillow): pele em JPEG, cabelo em tons de cinzento com transparência
function imagem(ficheiro, modo, tamanho) {
  const py = `
import sys, io, base64
from PIL import Image, ImageOps
im = Image.open(sys.argv[1]); modo = sys.argv[2]; t = int(sys.argv[3])
im = im.convert('RGBA'); im.thumbnail((t, t), Image.LANCZOS)
buf = io.BytesIO()
if modo == 'jpg':
    im.convert('RGB').save(buf, 'JPEG', quality=86); tipo = 'jpeg'
else:
    a = im.getchannel('A')
    g = ImageOps.autocontrast(im.convert('L'), cutoff=1)
    g = g.point(lambda v: int(90 + v * 0.65))
    Image.merge('LA', (g, a)).save(buf, 'PNG', optimize=True); tipo = 'png'
print('data:image/%s;base64,' % tipo + base64.b64encode(buf.getvalue()).decode())
`;
  return execFileSync('python3', ['-c', py, ficheiro, modo, String(tamanho)], { maxBuffer: 64 << 20 }).toString().trim();
}

(async () => {
  await MeshoptSimplifier.ready;
  const saida = { ossos: dados.ossos, variantes: {}, texturas: {} };
  const ordemOssos = dados.ossos;
  for (const [nome, v] of Object.entries(dados.variantes)) {
    const vertsBase = v.vertices;
    // normais do corpo inteiro (para afastar o equipamento da pele)
    const triTodos = [];
    for (const [vs] of v.faces) { triTodos.push(vs[0], vs[1], vs[2]); if (vs.length === 4) triTodos.push(vs[0], vs[2], vs[3]); }
    const normBase = normaisPorVertice(Float32Array.from(vertsBase), triTodos);
    // a cara (vértices da cabeça) fica com mais detalhe
    const iCab = ordemOssos.indexOf('cabeca');
    const porGrupo = {};
    for (const [vs, ts, g] of v.faces) {
      let grupo = g;
      if (g === 'pele' && vs.every(x => dados.pesosIdx[x * 4] === iCab && dados.pesos[x * 4] > 0.5)) grupo = 'rosto';
      (porGrupo[grupo] = porGrupo[grupo] || []).push([vs, ts]);
    }
    const grupos = Object.entries(porGrupo).map(([g, fsg]) => ({
      nome: g,
      dados: construirGrupo(vertsBase, normBase, dados.uvs, fsg, FICA[g] || 0.3, FOLGA[g] || 0, dados.pesosIdx, dados.pesos),
    }));
    const m = juntar(grupos);
    // Peças: cabelos, barba, sobrancelhas, olhos (todas presas à cabeça)
    const pecas = {};
    for (const [k, p] of Object.entries(v.pecas)) {
      const pv = p.vertices;
      const faces = p.faces;
      const fica = { olhos: 1, sobrancelhas: 1 }[k] || 0.35;
      const nV = pv.length / 3;
      const pesosIdx = new Array(nV * 4).fill(0).map((_, i) => (i % 4 === 0 ? iCab : 0));
      const pesos = new Array(nV * 4).fill(0).map((_, i) => (i % 4 === 0 ? 1 : 0));
      const g = construirGrupo(pv, new Float32Array(pv.length), p.uvs, faces, fica, 0, pesosIdx, pesos);
      const j = juntar([{ nome: k, dados: g }]);
      pecas[k] = { pos: b64(j.pos), uv: b64(j.uv), idx: b64(j.idx), idx32: j.idx instanceof Uint32Array };
      if (!saida.texturas[k] && p.textura) {
        const ficheiro = k === 'olhos' ? path.join(path.dirname(p.textura), 'brown_eye.png') : p.textura;
        saida.texturas[k] = imagem(ficheiro, k === 'olhos' ? 'jpg' : 'cinza', k === 'olhos' ? 128 : 256);
      }
    }
    saida.variantes[nome] = {
      pos: b64(m.pos), uv: b64(m.uv), si: b64(m.si), sw: b64(m.sw), idx: b64(m.idx), idx32: m.idx instanceof Uint32Array,
      grupos: m.grupos, ossos: v.ossos, pecas,
    };
    console.log(nome, 'vértices', m.pos.length / 3, 'triângulos', m.idx.length / 3,
      m.grupos.map(g => `${g.nome}:${g.total / 3}`).join(' '));
  }
  const peles = {
    clara: 'skins/young_caucasian_male/textures/young_lightskinned_male_diffuse.png',
    escura: 'skins/young_african_male/textures/young_darkskinned_male_diffuse.png',
    asiatica: 'skins/young_asian_male/textures/young_lightskinned_male_diffuse3.png',
  };
  for (const [k, f] of Object.entries(peles)) saida.texturas['pele_' + k] = imagem(path.join(DADOS_MH, f), 'jpg', 1024);
  const js = '// Gerado por ferramentas/makehuman_jogo.js a partir do MakeHuman (makehuman.org). Não editar à mão.\n' +
    'window.MODELO_HUMANO = ' + JSON.stringify(saida) + ';\n';
  fs.writeFileSync(SAIDA, js);
  console.log('escrito', SAIDA, (js.length / 1e6).toFixed(2), 'MB');
})();
