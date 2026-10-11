// Futebol 26 — lógica do jogo (regras, jogadores, bola)
// O desenho 3D está em render3d.js, o placar/textos em hud.js e os sons em audio.js.

// ---------- Medidas do campo (em "unidades de jogo") ----------
const W = 1000;          // comprimento do campo
const H = 640;           // largura do campo
const GOAL_W = 150;      // largura da baliza
const GOAL_D = 35;       // profundidade da baliza
const BALL_R = 5;
const PLAYER_R = 11;
const GOAL_H = 50;       // altura da baliza
const GRAVIDADE = 900;
const GOLS_PARA_GANHAR = 5;

// ---------- Teclas ----------
// Só 2 botões por jogador. O que fazem depende de teres a bola:
//   botão 1: com bola = passar,  sem bola = mudar de jogador
//   botão 2: com bola = rematar (segurar = mais força),  sem bola = carrinho
const TECLAS = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', b1: 'KeyF', b2: 'KeyG', b3: 'KeyH' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', b1: 'KeyK', b2: 'KeyL', b3: 'Semicolon' },
];

const down = new Set();
const pressed = new Set();
const released = new Set();

addEventListener('keydown', e => {
  const code = e.code === 'NumpadEnter' ? 'Enter' : e.code;
  e.preventDefault();
  Som.iniciar();
  if (!e.repeat) pressed.add(code);
  down.add(code);
});
addEventListener('keyup', e => {
  const code = e.code === 'NumpadEnter' ? 'Enter' : e.code;
  e.preventDefault();
  down.delete(code);
  released.add(code);
});
// Se a janela perder o foco, larga todas as teclas
addEventListener('blur', () => down.clear());

// ---------- Equipas ----------
// ---------- Modo de jogo ----------
// '2j' = dois jogadores no mesmo teclado; 'cpu' = J1 contra o computador (que joga com a equipa do J2)
let modoJogo = '2j';
let nivel = 1;
const NIVEIS = [
  { nome: 'Fácil', vel: 0.86, reacao: 0.45, mira: 0.55, carrinho: 0.15, remataDe: 220 },
  { nome: 'Médio', vel: 0.97, reacao: 0.25, mira: 0.75, carrinho: 0.35, remataDe: 270 },
  { nome: 'Difícil', vel: 1.05, reacao: 0.1, mira: 0.95, carrinho: 0.6, remataDe: 320 },
];
const cpu = { decisao: 0, trocar: 0, espera: 0 };
const eCPU = t => modoJogo === 'cpu' && t === 1;

// As duas equipas em jogo (escolhidas no ecrã inicial; as listas estão em equipas.js)
const escolhaEquipa = [0, 1];
const EQUIPAS = [TODAS_EQUIPAS[0], TODAS_EQUIPAS[1]];

// Se as camisolas forem parecidas, a segunda equipa veste o equipamento alternativo
function corParecida(a, b) {
  const n = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 150;
}
function vestirEquipas() {
  const casa = TODAS_EQUIPAS[escolhaEquipa[0]];
  const fora = TODAS_EQUIPAS[escolhaEquipa[1]];
  EQUIPAS[0] = casa;
  EQUIPAS[1] = corParecida(casa.camisola, fora.camisola) ? { ...fora, ...fora.alt, alternativo: true } : fora;
}
function mudarEquipa(t, d) {
  escolhaEquipa[t] = (escolhaEquipa[t] + d + TODAS_EQUIPAS.length) % TODAS_EQUIPAS.length;
  vestirEquipas();
  Render.mudarEstadio(0);   // a bancada muda de cores e de bandeiras
}

// O que cada PlayStyle faz no jogo
const PLAYSTYLES = {
  'Rápido': 'Corre mais depressa',
  'Remate Potente': 'Remates mais fortes',
  'Remate Colocado': 'Remates colocados enganam mais o GR',
  'Passe Incisivo': 'Passes mais rápidos',
  'Muralha': 'Difícil de lhe tirar a bola',
  'Carrinho': 'Carrinhos chegam mais longe e dão menos cartões',
  'Intercetor': 'Corta passes rápidos',
  'Reflexos': 'Defende um pouco mais',
};

// Posições base para a equipa que ataca para a direita (x e y entre 0 e 1)
const FORMACAO_5 = [
  { pos: 'Guarda-redes', num: 1, x: 0.03, y: 0.5 },
  { pos: 'Defesa', num: 4, x: 0.2, y: 0.3 },
  { pos: 'Defesa', num: 5, x: 0.2, y: 0.7 },
  { pos: 'Médio', num: 8, x: 0.33, y: 0.5 },
  { pos: 'Avançado', num: 9, x: 0.46, y: 0.5 },
];

// 11 contra 11 em 4-3-3. Os primeiros 5 lugares são os mesmos do 5 contra 5
// (GR, central, lateral esquerdo, médio, ponta de lança); depois vêm os outros 6.
const FORMACAO_11 = [
  { pos: 'Guarda-redes', x: 0.03, y: 0.5 },
  { pos: 'Defesa central', x: 0.17, y: 0.4 },
  { pos: 'Defesa esquerdo', x: 0.21, y: 0.12 },
  { pos: 'Médio', x: 0.31, y: 0.5 },
  { pos: 'Avançado', x: 0.46, y: 0.5 },
  { pos: 'Defesa direito', x: 0.21, y: 0.88 },
  { pos: 'Defesa central', x: 0.17, y: 0.6 },
  { pos: 'Médio', x: 0.3, y: 0.28 },
  { pos: 'Médio', x: 0.3, y: 0.72 },
  { pos: 'Extremo direito', x: 0.42, y: 0.84 },
  { pos: 'Extremo esquerdo', x: 0.42, y: 0.16 },
];
let numJogadores = 5;           // 5 contra 5 ou 11 contra 11 (escolhe-se no menu)
const formacao = () => (numJogadores === 11 ? FORMACAO_11 : FORMACAO_5);

// ---------- Utilitários ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Atributo do jogador (ritmo, remate, passe, drible, defesa, físico, reflexos), 75 se não tiver
const atr = (p, k) => (p && p.at && p.at[k]) || 75;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// Roda o ângulo `a` em direção a `b`, no máximo `max` radianos
const rodarPara = (a, b, max) => {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + clamp(d, -max, max);
};
const angDiff = (a, b) => {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
};

// ---------- Estado do jogo ----------
let players = [];
let ball;
let score = [0, 0];
let human = [null, null];     // jogador controlado por J1 e J2
let state = 'titulo';          // titulo | inicio | jogo | golo | fim
let stateTimer = 0;
let kickoffTeam = 0;
let lastScorer = -1;
let marcador = '';              // nome de quem marcou o último golo
let fimDepois = false;         // o último golo acabou o jogo
const arbitros = [];           // árbitro e dois fiscais de linha
const GRAVACAO = [];           // últimos segundos de jogo, para a repetição
const replay = { i: 0, t: 0 };
const popups = [];             // emblemas dourados de PlayStyle a aparecer por cima dos jogadores
let primeiroApito = true;

// Um PlayStyle entrou em ação: mostra o emblema dourado por cima do jogador
function psAtivo(p) {
  if (!p || !p.ps || p.psCd > 0) return;
  p.psCd = 3;
  popups.push({ p, ps: p.ps, t: 1.6 });
}
let charge = [0, 0];           // força do remate (0 a 1)
let charging = [false, false];
let cargaPasse = [0, 0];       // tempo a segurar o botão de passe (segurar = passe alto)
let aPassar = [false, false];
let shotId = 0;
let setPiece = null;           // bola parada: { tipo, team, x, y, taker }
let aviso = null;              // mensagem do árbitro: { texto, sub, cartao, t }

const NOMES_PARADA = {
  lateral: 'LANÇAMENTO LATERAL', canto: 'CANTO', baliza: 'PONTAPÉ DE BALIZA',
  livre: 'LIVRE', penalti: 'PENÁLTI!',
};

function attackDir(team) { return team === 0 ? 1 : -1; }

function basePos(team, slot) {
  const f = formacao()[slot];
  return { x: team === 0 ? f.x * W : W - f.x * W, y: f.y * H };
}

function createPlayers() {
  players = [];
  for (let team = 0; team < 2; team++) {
    const plantel = numJogadores === 11 ? EQUIPAS[team].plantel11 : EQUIPAS[team].plantel;
    formacao().forEach((f, slot) => {
      const b = basePos(team, slot);
      const j = plantel[slot];
      players.push({
        team, slot, num: j.num, nome: j.nome, chamado: j.chamado || j.nome.split(' ').slice(-1)[0],
        ps: j.ps, pos: f.pos, gk: slot === 0, ovr: j.ovr, posicao: j.posicao, at: j.at || {},
        aspeto: { pele: j.pele, cabelo: j.cabelo, estilo: j.estilo, barba: j.barba },
        x: b.x, y: b.y, vx: 0, vy: 0,
        facing: team === 0 ? 0 : Math.PI,
        cooldown: 0,      // tempo sem poder tocar na bola depois de chutar
        stun: 0,          // tempo atordoado depois de perder a bola
        holdTime: 0,      // há quanto tempo tem a bola
        gkShot: -1,
        slide: 0,         // tempo a deslizar no carrinho
        slideDir: 0,
        slideDone: false, // o carrinho já acertou em alguma coisa
        chao: 0,          // tempo no chão depois do carrinho
        amarelos: 0,
        perdeuBola: 0,    // acabou de perder a bola (não faz carrinho sem querer)
        tentativa: 0,     // espera entre tentativas de roubar a bola
        pendente: null,   // remate carregado à espera que a bola chegue
        mira: team === 0 ? 0 : Math.PI,   // direção das teclas (para onde remata/passa)
        toque: 0,         // fase dos toques na bola ao correr
        mergulho: 0, mergulhoDir: 0,      // mergulho do guarda-redes
        cabeceou: 0,      // animação de cabeceamento
        finta: 0, fintaLado: 1,   // finta (roleta) em curso
        psCd: 0,          // espera até o PlayStyle poder voltar a aparecer
        corrida: 0,       // tempo a correr com a bola em velocidade máxima
      });
    });
  }
}

function resetKickoff() {
  for (const p of players) {
    const b = basePos(p.team, p.slot);
    p.x = b.x; p.y = b.y; p.vx = p.vy = 0;
    p.facing = p.team === 0 ? 0 : Math.PI;
    p.cooldown = p.stun = p.holdTime = p.slide = p.chao = p.mergulho = p.perdeuBola = 0;
    p.pendente = null;
    p.mira = p.facing;
  }
  // O avançado da equipa que dá o pontapé de saída fica no centro
  const striker = frontPlayer(kickoffTeam);
  striker.x = W / 2 - attackDir(kickoffTeam) * 14;
  striker.y = H / 2;
  // A outra equipa tem de ficar fora do círculo central
  const other = frontPlayer(1 - kickoffTeam);
  other.x = W / 2 + attackDir(kickoffTeam) * 85;
  other.y = H / 2;
  ball = { x: W / 2, y: H / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: null, lastTouch: null };
  for (let t = 0; t < 2; t++) human[t] = frontPlayer(t);
  setPiece = null;
  charge = [0, 0];
  charging = [false, false];
  cargaPasse = [0, 0];
  aPassar = [false, false];
  GRAVACAO.length = 0;
  state = 'inicio';
  stateTimer = 1.2;
}

// Jogador de campo mais avançado da equipa (o avançado, ou quem estiver no lugar dele)
function frontPlayer(team) {
  const field = players.filter(p => p.team === team && !p.gk);
  const frente = p => formacao()[p.slot].x;
  return field.reduce((a, b) => (frente(b) > frente(a) ? b : a));
}

function newGame() {
  score = [0, 0];
  kickoffTeam = 0;
  createPlayers();
  criarArbitros();
  primeiroApito = true;
  popups.length = 0;
  resetKickoff();
  aviso = null;
}

// ---------- Chutar, passar, mudar de jogador ----------
function kick(p, angle, speed, lift = 0) {
  ball.owner = null;
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
  ball.vz = lift;
  ball.curva = 0;
  ball.dip = 0;
  ball.ps = p.ps;
  Som.chuto(speed);
  ball.lastTouch = p;
  p.cooldown = 0.3;
  p.holdTime = 0;
  ball.potente = ball.colocado = ball.remate = false;
  shotId++;
  if (state === 'parada') { state = 'jogo'; setPiece = null; }
}

function cabecear(p) {
  const goalX = p.team === 0 ? W : 0;
  const perto = Math.abs(goalX - p.x) < 300 && Math.abs(p.y - H / 2) < 200;
  let ang, vel, lift;
  if (perto) {
    // Perto da baliza: cabeceia para a baliza, para baixo
    const ty = H / 2 + (Math.random() - 0.5) * (GOAL_W - 30);
    ang = Math.atan2(ty - p.y, goalX - p.x);
    vel = 360 + Math.random() * 100;
    lift = -60;
  } else {
    ang = direcao(p);
    vel = 260;
    lift = 140;
  }
  kick(p, ang, vel, lift);
  if (perto) {
    ball.remate = true;
    ball.colocado = Math.random() < 0.5;
    ball.potente = vel > 430;
  }
  p.cabeceou = 0.45;
  p.cooldown = 0.35;
  Narrador.cabeca(p.chamado);
}

function canTouchBall(p) {
  if (ball.owner === p) return true;
  return !ball.owner && dist(p, ball) < PLAYER_R + BALL_R + 10 && p.cooldown <= 0;
}

function direcao(p) {
  return human.includes(p) ? p.mira : p.facing;
}

function shoot(p, power) {
  const deLivre = state === 'parada' && setPiece && setPiece.tipo === 'livre';
  const f = direcao(p);
  let angle = f, colocado = false, curva = 0;
  const goalX = p.team === 0 ? W : 0;
  const toGoal = Math.atan2(H / 2 - p.y, goalX - p.x);
  const finesse = p.ps === 'Remate Colocado';
  const potentePS = p.ps === 'Remate Potente';
  // Força do remate (o Guilherme achou que estava forte demais: o máximo passou de ~1000 para ~650)
  let velocidade = (300 + power * 330) * (potentePS ? 1.1 : 1) * (0.9 + atr(p, 'rem') / 100 * 0.12);
  // Distância à baliza: de longe a bola chega fraca (ou nem chega); de perto, força a mais pode ir por cima
  const dBaliza = Math.hypot(goalX - ball.x, H / 2 - ball.y);
  velocidade *= clamp(1.1 - Math.max(0, dBaliza - 300) / 900, 0.6, 1);
  // Virado para a baliza: na diagonal remata para um canto, a direito remata ao meio
  if (angDiff(f, toGoal) < Math.PI / 3 && Math.abs(goalX - p.x) < 450) {
    const vert = Math.sin(f);
    colocado = Math.abs(vert) > 0.3;
    const lado = Math.sign(vert);
    const ty = H / 2 + (colocado ? lado * (GOAL_W / 2 - (finesse ? 16 : 22)) : 0);
    const dx = goalX - ball.x, dy = ty - ball.y;
    const d = Math.hypot(dx, dy);
    angle = Math.atan2(dy, dx);
    if (colocado && !(power > 0.85 && !finesse)) {
      // Remate em arco: sai por fora do poste e a curva traz a bola para dentro
      const acel = finesse ? 600 : 350;
      const T = d / (velocidade * 0.9);
      const desvio = 0.5 * acel * T * T * 0.7;
      const sinal = -lado * Math.sign(Math.cos(angle) || 1);
      curva = sinal * acel;
      angle -= sinal * Math.atan2(desvio, d);
    }
  }
  // Pontaria: remates no máximo da força falham mais (o Remate Potente não)
  const erro = potentePS ? 0.03 : finesse && colocado ? 0.02 : power > 0.85 ? 0.1 : 0.05;
  angle += (Math.random() - 0.5) * erro * (1.6 - atr(p, 'rem') / 100);
  if (deLivre && dBaliza < 420) {
    // Livre direto: altura certa para passar por cima das cabeças da barreira
    // (que alcançam a bola a uns 55 de distância) e efeito para baixo (cai a pique)
    const tBarreira = 55 / velocidade;
    let vz = (33 + 750 * tBarreira * tBarreira) / tBarreira;
    // Às vezes sai baixo e bate na barreira (mais vezes com força a mais)
    if (Math.random() < (power > 0.85 ? 0.4 : 0.2)) vz *= 0.8;
    kick(p, angle, velocidade, vz);
    ball.dip = 600;
  } else {
    let lift = (potentePS ? 35 + power * 90 : curva ? 90 + power * 100 : 60 + power * 150) + Math.random() * 25;
    if (dBaliza < 220 && power > 0.75) {
      // Muito perto e com força a mais: às vezes vai por cima da trave
      const chancePorCima = (power - 0.75) * 1.6 * (potentePS ? 0.5 : 1);
      if (Math.random() < chancePorCima) {
        const t = dBaliza / velocidade;
        lift = (GOAL_H + 20 + Math.random() * 30 + (GRAVIDADE / 2) * t * t) / t;
      }
    }
    kick(p, angle, velocidade, lift);
  }
  ball.curva = curva;
  ball.ps = p.ps;
  ball.potente = power > (potentePS ? 0.5 : 0.7);
  ball.remate = true;
  ball.colocado = colocado;
  if ((potentePS && power > 0.5) || (finesse && colocado)) psAtivo(p);
  Narrador.remate(p.chamado);
}

function pass(p) {
  const f = direcao(p);
  let best = null, bestScore = Infinity;
  for (const m of players) {
    if (m.team !== p.team || m === p) continue;
    const d = dist(p, m);
    const a = Math.atan2(m.y - p.y, m.x - p.x);
    const diff = angDiff(a, f);
    if (diff > Math.PI * 0.42 || d < 30) continue;
    const s = diff * 300 + d * 0.4 + (m.gk ? 400 : 0);
    if (s < bestScore) { bestScore = s; best = m; }
  }
  if (!best) { kick(p, f, 330); return; }
  // Passa para onde o colega vai estar
  const incisivo = p.ps === 'Passe Incisivo';
  const d = dist(p, best);
  const speed = clamp(d * 1.3 + 150, 240, 520) * (incisivo ? 1.15 : 1);
  const t = d / speed;
  // Passe Incisivo: põe a bola no espaço à frente do colega, a caminho da baliza
  const frente = incisivo && !best.gk && d > 120 ? 60 : 0;
  const tx = clamp(best.x + best.vx * t + attackDir(p.team) * frente, 10, W - 10);
  const ty = clamp(best.y + best.vy * t, 10, H - 10);
  // Passes longos vão pelo ar, por cima dos adversários; os normais falham um bocadinho mais
  const lift = d > 220 ? clamp((d - 150) * 0.9, 0, 300) : 0;
  const erro = (incisivo ? 0.01 : 0.03 + d / 6000) * (1.7 - atr(p, 'pas') / 100);
  kick(p, Math.atan2(ty - p.y, tx - p.x) + (Math.random() - 0.5) * erro, speed, lift);
  if (frente) psAtivo(p);
}

// Passe alto: a bola sobe em arco e cai no colega (ou à frente, se não houver ninguém)
function passeAlto(p, forca) {
  const f = direcao(p);
  let best = null, bestScore = Infinity;
  for (const m of players) {
    if (m.team !== p.team || m === p || m.gk) continue;
    const d = dist(p, m);
    const diff = angDiff(Math.atan2(m.y - p.y, m.x - p.x), f);
    if (diff > Math.PI * 0.35 || d < 60) continue;
    // Com mais força prefere colegas mais longe
    const s = diff * 500 + Math.abs(d - (120 + forca * 380)) * 0.3;
    if (s < bestScore) { bestScore = s; best = m; }
  }
  let tx, ty;
  if (best) {
    const d = dist(p, best);
    const t0 = d / 380;
    // Cai um pouco à frente do colega, para ele ir ao encontro da bola
    tx = best.x + best.vx * t0 + attackDir(p.team) * 15;
    ty = best.y + best.vy * t0;
  } else {
    const d = 140 + forca * 320;
    tx = p.x + Math.cos(f) * d;
    ty = p.y + Math.sin(f) * d;
  }
  tx = clamp(tx, 5, W - 5); ty = clamp(ty, 5, H - 5);
  const d = Math.hypot(tx - ball.x, ty - ball.y);
  // Tempo de voo (mais longo quanto mais longe) e velocidade para a bola cair no sítio certo
  const T = clamp(0.45 + d / 900, 0.6, 1.3);
  const v = (d / T) * 1.06;
  const erro = (Math.random() - 0.5) * 0.06 * (1.7 - atr(p, 'pas') / 100);
  kick(p, Math.atan2(ty - ball.y, tx - ball.x) + erro, v, (GRAVIDADE * T) / 2);
}

// Chuto longo do guarda-redes: a bola vai alta para o meio-campo, por cima de toda a gente
function chutoLongo(p) {
  const tx = clamp(p.x + attackDir(p.team) * (400 + Math.random() * 120), 20, W - 20);
  const ty = H / 2 + (Math.random() - 0.5) * 260;
  const d = Math.hypot(tx - ball.x, ty - ball.y);
  const T = 1.4;
  kick(p, Math.atan2(ty - ball.y, tx - ball.x), (d / T) * 1.08, (GRAVIDADE * T) / 2);
}

function switchPlayer(team) {
  const cur = human[team];
  let best = null, bestD = Infinity;
  for (const p of players) {
    if (p.team !== team || p.gk || p === cur) continue;
    const d = dist(p, ball);
    if (d < bestD) { bestD = d; best = p; }
  }
  if (best) human[team] = best;
}

// ---------- Inteligência dos jogadores sem controlo ----------
function teamWithBall() {
  return ball.owner ? ball.owner.team : -1;
}

function aiTarget(p) {
  const b = basePos(p.team, p.slot);
  const dir = attackDir(p.team);
  const hasBall = teamWithBall() === p.team;
  // No canto, atacantes e defesas vão todos para a área
  if (setPiece && setPiece.tipo === 'canto') {
    const goalX = setPiece.team === 0 ? W : 0;
    const atk = p.team === setPiece.team;
    const fundo = (atk ? 75 : 45) + (p.slot % 2) * 45;
    return { x: goalX - attackDir(setPiece.team) * fundo, y: H / 2 + ((p.slot % 6) - 2.5) * 42 + (atk ? 15 : -15) };
  }
  // A equipa sobe quando ataca e desce quando defende, e segue a bola
  let x = b.x + (ball.x - W / 2) * 0.55 + (hasBall ? 90 : -40) * dir;
  let y = b.y + (ball.y - H / 2) * 0.35;
  return { x: clamp(x, 40, W - 40), y: clamp(y, 30, H - 30) };
}

function chaser(team) {
  // Jogador sem controlo humano mais perto da bola
  let best = null, bestD = Infinity;
  for (const p of players) {
    if (p.team !== team || p.gk || p === human[team]) continue;
    const d = dist(p, ball);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

function moveTowards(p, tx, ty, speed, dt) {
  const dx = tx - p.x, dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  let wantVx = 0, wantVy = 0;
  if (d > 4) {
    const s = Math.min(speed, d * 4);
    wantVx = dx / d * s; wantVy = dy / d * s;
  }
  p.vx += (wantVx - p.vx) * Math.min(1, dt * 8);
  p.vy += (wantVy - p.vy) * Math.min(1, dt * 8);
}

function updateGoalkeeper(p, dt) {
  const goalX = p.team === 0 ? 0 : W;
  const dir = attackDir(p.team);
  if (p.mergulho > 0) {
    p.mergulho -= dt;
    p.vx *= 0.9; p.vy *= 0.9;
    return;
  }
  if (ball.owner === p) {
    // Segura a bola um bocadinho e depois passa
    p.vx *= 0.8; p.vy *= 0.8;
    p.facing = p.team === 0 ? 0 : Math.PI;
    if (p.holdTime > 0.8) {
      // Com adversários perto, chuta para longe pelo ar; sem ninguém perto, passa rasteiro
      const apertado = players.some(q => q.team !== p.team && dist(q, p) < 150);
      if (apertado) chutoLongo(p);
      else pass(p);
    }
    return;
  }
  const ballNear = Math.abs(ball.x - goalX) < 150 && !ball.owner &&
    Math.hypot(ball.vx, ball.vy) < 200;
  let tx, ty;
  if (ballNear && Math.abs(ball.y - H / 2) < 140) {
    tx = ball.x; ty = ball.y;          // sai da baliza para apanhar a bola
  } else {
    tx = goalX + dir * 22;
    ty = clamp(H / 2 + (ball.y - H / 2) * 0.4, H / 2 - GOAL_W / 2 + 12, H / 2 + GOAL_W / 2 - 12);
  }
  moveTowards(p, tx, ty, 150, dt);
  p.facing = Math.atan2(ball.y - p.y, ball.x - p.x);
}

function updateAI(p, dt) {
  if (p.gk) return updateGoalkeeper(p, dt);
  if (state === 'parada' && setPiece && setPiece.taker === p) { p.vx = p.vy = 0; return; }
  if (state === 'parada' && p.barreira) {
    moveTowards(p, p.barreira.x, p.barreira.y, 60, dt);
    p.facing = Math.atan2(ball.y - p.y, ball.x - p.x);
    return;
  }
  p.barreira = null;
  let target = aiTarget(p);
  // Um colega ajuda a pressionar se o adversário tem a bola no nosso meio-campo
  const inOwnHalf = p.team === 0 ? ball.x < W * 0.55 : ball.x > W * 0.45;
  if (state !== 'parada' && teamWithBall() !== p.team && chaser(p.team) === p && inOwnHalf &&
      dist(p, ball) < dist(human[p.team], ball)) {
    target = { x: ball.x, y: ball.y };
  }
  if (p.ps === 'Intercetor' && !ball.owner && ball.lastTouch && ball.lastTouch.team !== p.team &&
      dist(p, ball) < 160 && Math.hypot(ball.vx, ball.vy) > 150) {
    // Lê o passe e vai cortá-lo onde a bola vai passar
    target = { x: ball.x + ball.vx * 0.35, y: ball.y + ball.vy * 0.35 };
  }
  moveTowards(p, target.x, target.y, 140 * (0.86 + atr(p, 'rit') / 100 * 0.25) * (p.ps === 'Rápido' ? 1.06 : 1), dt);
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > 20) p.facing = Math.atan2(p.vy, p.vx);
}

function updateHuman(p, t, dt) {
  const k = TECLAS[t];
  let dx = 0, dy = 0;
  if (down.has(k.left)) dx -= 1;
  if (down.has(k.right)) dx += 1;
  if (down.has(k.up)) dy -= 1;
  if (down.has(k.down)) dy += 1;
  const len = Math.hypot(dx, dy);

  // Quem marca a bola parada não anda: só escolhe a direção
  if (state === 'parada' && setPiece && setPiece.taker === p) {
    p.vx = p.vy = 0;
    if (len) p.facing = p.mira = Math.atan2(dy, dx);
    if (setPiece.tipo === 'saida') {
      if (pressed.has(k.b1) || pressed.has(k.b2)) pass(p);
      return;
    }
    if (pressed.has(k.b2)) { charging[t] = true; charge[t] = 0; }
    if (charging[t]) charge[t] = Math.min(1, charge[t] + dt / 1.1);
    if (released.has(k.b2) && charging[t]) {
      if (setPiece.tipo === 'lateral') kick(p, p.facing, 260 + charge[t] * 120, 150);
      else shoot(p, charge[t]);
      charging[t] = false; charge[t] = 0;
    }
    if (pressed.has(k.b1)) { aPassar[t] = true; cargaPasse[t] = 0; }
    if (aPassar[t]) cargaPasse[t] += dt;
    if (released.has(k.b1) && aPassar[t]) {
      if (cargaPasse[t] > 0.22) passeAlto(p, Math.min(1, (cargaPasse[t] - 0.22) / 0.8));
      else pass(p);
      aPassar[t] = false; cargaPasse[t] = 0;
    }
    return;
  }

  if (p.slide > 0 || p.chao > 0) return;   // a meio do carrinho ou no chão
  const temBola = canTouchBall(p);

  // Botão 2: carrinho só se for o adversário a ter a bola; senão carrega o remate
  // (assim dá para rematar de primeira quando a bola está a chegar)
  if (pressed.has(k.b2)) {
    const adversario = ball.owner && ball.owner.team !== p.team;
    if (!temBola && adversario && p.perdeuBola <= 0 && !ball.owner.gk) {
      p.slide = 0.35; p.slideDir = len ? Math.atan2(dy, dx) : p.facing;
      p.facing = p.mira = p.slideDir; p.slideDone = false;
      return;
    }
    charging[t] = true; charge[t] = 0;
  }

  let speed = (ball.owner === p ? 160 : 175) * (0.86 + atr(p, 'rit') / 100 * 0.25);
  if (p.ps === 'Rápido') speed *= 1.06;
  if (p.stun > 0) speed *= 0.6;
  if (len) {
    p.mira = Math.atan2(dy, dx);
    // Vira-se aos poucos (com bola vira mais devagar), como um jogador a sério
    p.facing = rodarPara(p.facing, p.mira, (ball.owner === p ? 9 * (0.75 + atr(p, 'dri') / 100 * 0.35) : 14) * dt);
  }
  // Corre para onde está virado; ao travar e arrancar há um bocadinho de inércia
  const wantVx = len ? Math.cos(p.facing) * speed : 0;
  const wantVy = len ? Math.sin(p.facing) * speed : 0;
  const arranque = p.ps === 'Rápido' ? 10 : 7;
  p.vx += (wantVx - p.vx) * Math.min(1, dt * arranque);
  p.vy += (wantVy - p.vy) * Math.min(1, dt * arranque);
  if (p.ps === 'Rápido' && ball.owner === p && Math.hypot(p.vx, p.vy) > 175) {
    p.corrida += dt;
    if (p.corrida > 1) psAtivo(p);
  } else p.corrida = 0;

  // Botão 3: finta
  if (pressed.has(k.b3)) fazerFinta(p, dx, dy);
  if (p.finta > 0.15) {
    const lx = -Math.sin(p.facing) * p.fintaLado, ly = Math.cos(p.facing) * p.fintaLado;
    p.vx += lx * 260 * dt * 6; p.vy += ly * 260 * dt * 6;
    const v = Math.hypot(p.vx, p.vy), max = speed * 1.05;
    if (v > max) { p.vx *= max / v; p.vy *= max / v; }
  }

  // Larga o botão 2 para rematar
  if (charging[t]) charge[t] = Math.min(1, charge[t] + dt / 1.1);
  if (released.has(k.b2) && charging[t]) {
    if (canTouchBall(p)) shoot(p, charge[t]);
    else p.pendente = { forca: charge[t], t: 0.4 };   // remata quando a bola chegar
    charging[t] = false; charge[t] = 0;
  }
  if (p.pendente) {
    p.pendente.t -= dt;
    if (canTouchBall(p)) { shoot(p, p.pendente.forca); p.pendente = null; }
    else if (p.pendente.t <= 0 || (ball.owner && ball.owner !== p)) p.pendente = null;
  }
  // Botão 1: com bola = passar (toque = rasteiro, segurar = alto); sem bola = mudar de jogador
  if (pressed.has(k.b1)) {
    if (temBola) { aPassar[t] = true; cargaPasse[t] = 0; }
    else switchPlayer(t);
  }
  if (aPassar[t]) cargaPasse[t] += dt;
  if (released.has(k.b1) && aPassar[t]) {
    if (canTouchBall(p)) {
      if (cargaPasse[t] > 0.22) passeAlto(p, Math.min(1, (cargaPasse[t] - 0.22) / 0.8));
      else pass(p);
    }
    aPassar[t] = false; cargaPasse[t] = 0;
  }
}

// ---------- Finta (roleta) ----------
// O jogador roda com a bola e sai para o lado; quem o marca pode ficar desequilibrado.
// Durante a finta não lhe tiram a bola (nem com carrinho).
function fazerFinta(p, dx, dy) {
  if (ball.owner !== p || p.finta > 0) return;
  let lado;
  if (dx || dy) lado = Math.sin(Math.atan2(dy, dx) - p.facing) >= 0 ? 1 : -1;
  else lado = p.fintaLado = -p.fintaLado;
  p.finta = 0.4;
  p.fintaLado = lado;
  let enganou = false;
  for (const q of players) {
    if (q.team === p.team || q.gk || dist(q, p) > 50) continue;
    if (Math.random() < 0.3 + atr(p, 'dri') / 100 * 0.5) { q.stun = 0.7; q.tentativa = 0.7; enganou = true; }
  }
  if (enganou && Math.random() < 0.5) Narrador.passe(`Que finta de ${p.chamado}!`);
}

// ---------- Computador (controla o jogador ativo da equipa do J2) ----------
function velocidadeCPU(p) {
  let v = (ball.owner === p ? 160 : 175) * (0.86 + atr(p, 'rit') / 100 * 0.25) * NIVEIS[nivel].vel;
  if (p.ps === 'Rápido') v *= 1.06;
  if (p.stun > 0) v *= 0.6;
  return v;
}

// Corre numa direção (vira-se aos poucos, como os humanos)
function correrPara(p, ang, vel, dt) {
  p.mira = ang;
  p.facing = rodarPara(p.facing, ang, (ball.owner === p ? 8 : 13) * dt);
  p.vx += (Math.cos(p.facing) * vel - p.vx) * Math.min(1, dt * 7);
  p.vy += (Math.sin(p.facing) * vel - p.vy) * Math.min(1, dt * 7);
}

// Escolhe o colega mais bem colocado (mais à frente e sem adversários no caminho) e passa-lhe
function passeCPU(p) {
  const goalX = p.team === 0 ? W : 0;
  let melhor = null, nota = -Infinity;
  for (const m of players) {
    if (m.team !== p.team || m === p || m.gk) continue;
    const d = dist(p, m);
    if (d < 50 || d > 420) continue;
    let livre = 1;
    for (const a of players) {
      if (a.team === p.team) continue;
      // distância do adversário à linha do passe
      const t = clamp(((a.x - p.x) * (m.x - p.x) + (a.y - p.y) * (m.y - p.y)) / (d * d), 0, 1);
      const px = p.x + (m.x - p.x) * t, py = p.y + (m.y - p.y) * t;
      if (Math.hypot(a.x - px, a.y - py) < 26) livre = 0.2;
    }
    const avanco = (Math.abs(goalX - p.x) - Math.abs(goalX - m.x)) / 100;
    const n = livre * 3 + avanco - d / 400 + Math.random() * 0.5;
    if (n > nota) { nota = n; melhor = m; }
  }
  if (!melhor) return false;
  p.mira = Math.atan2(melhor.y - p.y, melhor.x - p.x);
  pass(p);
  return true;
}

// Remata para o canto mais longe do guarda-redes
function remateCPU(p, forcaBase) {
  const nv = NIVEIS[nivel];
  const goalX = p.team === 0 ? W : 0;
  const gr = players.find(q => q.gk && q.team !== p.team);
  const lado = gr && gr.y > H / 2 ? -1 : 1;
  const colocado = Math.random() < nv.mira;
  const base = goalX > p.x ? 0 : Math.PI;
  p.mira = colocado ? base + (base === 0 ? lado * 0.6 : -lado * 0.6) : Math.atan2(H / 2 - p.y, goalX - p.x);
  const forca = forcaBase !== undefined ? forcaBase
    : colocado ? 0.35 + Math.random() * 0.5 * nv.mira : 0.55 + Math.random() * 0.45;
  shoot(p, forca);
}

function updateCPU(p, dt) {
  const nv = NIVEIS[nivel];
  const goalX = p.team === 0 ? W : 0;
  const nossaBaliza = W - goalX;

  // Bolas paradas: espera um bocadinho e bate
  if (state === 'parada' && setPiece && setPiece.taker === p) {
    p.vx = p.vy = 0;
    cpu.espera += dt;
    if (cpu.espera < 1.0 + nv.reacao) return;
    cpu.espera = 0;
    const perto = Math.hypot(goalX - ball.x, H / 2 - ball.y) < 400;
    if (setPiece.tipo === 'penalti') return remateCPU(p, 0.45 + Math.random() * 0.4 * nv.mira);
    if (setPiece.tipo === 'livre' && perto) return remateCPU(p, 0.4 + Math.random() * 0.35);
    if (setPiece.tipo === 'canto') {
      // Cruza para o colega mais perto da marca de penálti
      const marca = { x: goalX - attackDir(p.team) * 110, y: H / 2 };
      const alvo = players.filter(q => q.team === p.team && !q.gk && q !== p)
        .reduce((a, b) => (dist(b, marca) < dist(a, marca) ? b : a));
      const d = dist(p, alvo);
      p.mira = Math.atan2(alvo.y - p.y, alvo.x - p.x);
      return passeAlto(p, clamp((d - 120) / 380, 0, 1));
    }
    if (!passeCPU(p)) { p.mira = Math.atan2(H / 2 - ball.y, goalX - ball.x); pass(p); }
    return;
  }
  if (p.slide > 0 || p.chao > 0) return;
  const vel = velocidadeCPU(p);

  // Com a bola: avança para a baliza, foge de quem está à frente, passa ou remata
  if (ball.owner === p) {
    const paraGolo = Math.atan2(H / 2 - p.y, goalX - p.x);
    let ang = paraGolo;
    let perto = null, dmin = Infinity;
    for (const a of players) {
      if (a.team === p.team) continue;
      const d = dist(a, p);
      if (d < dmin) { dmin = d; perto = a; }
    }
    if (perto && dmin < 75) {
      const angAdv = Math.atan2(perto.y - p.y, perto.x - p.x);
      if (angDiff(angAdv, ang) < 1.1) ang += (Math.sin(ang - angAdv) >= 0 ? 1 : -1) * 0.9;
    }
    // Não fugir pela linha lateral
    if (p.y < 50) ang = rodarPara(ang, Math.PI / 2, 0.6);
    if (p.y > H - 50) ang = rodarPara(ang, -Math.PI / 2, 0.6);
    correrPara(p, ang, vel, dt);
    cpu.decisao -= dt;
    if (cpu.decisao <= 0) {
      cpu.decisao = nv.reacao + 0.15;
      const dGolo = Math.hypot(goalX - p.x, H / 2 - p.y);
      if (dGolo < nv.remataDe && angDiff(p.facing, paraGolo) < 1.1) return remateCPU(p);
      if (dmin < 45 && p.finta <= 0 && Math.random() < 0.15 + nv.mira * 0.3) { fazerFinta(p, 0, 0); return; }
      if (dmin < 38 && Math.random() < 0.65 && passeCPU(p)) return;
      if (Math.random() < 0.06) passeCPU(p);
    }
    return;
  }

  // Sem a bola: passa o controlo para o jogador mais perto da bola
  cpu.trocar -= dt;
  if (cpu.trocar <= 0 && (!ball.owner || ball.owner.team !== p.team)) {
    cpu.trocar = 0.4 + nv.reacao;
    let novo = p, dmin = dist(p, ball);
    for (const q of players) {
      if (q.team !== p.team || q.gk) continue;
      if (dist(q, ball) < dmin - 15) { dmin = dist(q, ball); novo = q; }
    }
    if (novo !== p) { human[p.team] = novo; return; }
  }

  // Um colega (o guarda-redes) tem a bola: ir para o seu lugar
  if (ball.owner && ball.owner.team === p.team) {
    const t = aiTarget(p);
    moveTowards(p, t.x, t.y, vel, dt);
    if (Math.hypot(p.vx, p.vy) > 20) p.facing = Math.atan2(p.vy, p.vx);
    return;
  }

  // Bola solta: vai onde a bola vai estar. Adversário com a bola: fica entre ele e a baliza
  let alvo = { x: ball.x + ball.vx * 0.3, y: ball.y + ball.vy * 0.3 };
  const dono = ball.owner;
  // Longe: corta o caminho para a baliza; perto: vai mesmo à bola para a roubar
  if (dono && dist(p, ball) > 70) alvo = { x: ball.x + (nossaBaliza - ball.x) * 0.06, y: ball.y + (H / 2 - ball.y) * 0.06 };
  else if (dono) alvo = { x: ball.x, y: ball.y };
  correrPara(p, Math.atan2(alvo.y - p.y, alvo.x - p.x), dist(p, alvo) < 6 ? 0 : vel, dt);

  // Carrinho: só de frente ou de lado (por trás é falta), e não dentro da própria área
  if (dono && dono.team !== p.team && dist(p, dono) < 34 && p.perdeuBola <= 0 &&
      !inPenaltyBox(p.team, p.x, p.y) && Math.random() < nv.carrinho * dt * 3) {
    const paraDono = Math.atan2(dono.y - p.y, dono.x - p.x);
    if (angDiff(paraDono, dono.facing) > 1.4) {
      p.slide = 0.35; p.slideDir = paraDono;
      p.facing = p.mira = paraDono; p.slideDone = false;
    }
  }
}

// ---------- Carrinhos e faltas ----------
function inPenaltyBox(team, x, y) {
  // Grande área que a equipa `team` defende
  const inX = team === 0 ? x < 160 : x > W - 160;
  return inX && Math.abs(y - H / 2) < 190;
}

function updateSlide(p, dt) {
  if (p.chao > 0) {
    p.chao -= dt;
    p.vx *= 0.8; p.vy *= 0.8;
    return;
  }
  const sp = 330 * (0.4 + 0.6 * p.slide / 0.35);
  p.vx = Math.cos(p.slideDir) * sp;
  p.vy = Math.sin(p.slideDir) * sp;
  p.slide -= dt;
  if (p.slide <= 0) { p.slide = 0; p.chao = 0.45; }
  if (p.slideDone) return;

  const owner = ball.owner;
  // Acertou no adversário que tem a bola?
  if (owner && owner.gk) return;   // ninguém pode ir ao guarda-redes com a bola nas mãos
  if (owner && owner.team !== p.team && owner.finta > 0 && dist(p, owner) < PLAYER_R * 2 + 2) {
    p.slideDone = true;   // fintado: o carrinho passa ao lado
    return;
  }
  if (owner && owner.team !== p.team && dist(p, owner) < PLAYER_R * 2 + 2 && ball.z < 10) {
    const porTras = angDiff(p.slideDir, owner.facing) < 1.0;
    const tocaBola = dist(p, ball) < PLAYER_R + BALL_R + (p.ps === 'Carrinho' ? 11 : 6);
    p.slideDone = true;
    if (porTras || !tocaBola) return foul(p, owner, porTras);
    // Carrinho limpo: a bola sai disparada
    owner.stun = 0.6; owner.holdTime = 0; owner.perdeuBola = 0.6;
    if (p.ps === 'Carrinho') psAtivo(p);
    kick(p, p.slideDir + (Math.random() - 0.5) * 0.6, 230);
    return;
  }
  // Bola solta: o carrinho afasta a bola
  if (!owner && ball.z < 10 && dist(p, ball) < PLAYER_R + BALL_R + 6) {
    p.slideDone = true;
    kick(p, p.slideDir + (Math.random() - 0.5) * 0.4, 260);
  }
}

function foul(culpado, vitima, porTras) {
  let cartao = null;
  if (porTras || (culpado.ps !== 'Carrinho' && Math.random() < 0.15)) {
    culpado.amarelos++;
    cartao = culpado.amarelos >= 2 ? 'vermelho' : 'amarelo';
    if (cartao === 'vermelho') culpado.expulso = true;
  }
  const team = vitima.team;
  const tipo = inPenaltyBox(culpado.team, vitima.x, vitima.y) ? 'penalti' : 'livre';
  const arb = arbitros[0];
  if (arb) { arb.apito = 1.2; arb.cartao = cartao; arb.cartaoT = cartao ? 2.2 : 0; }
  if (tipo === 'penalti') Narrador.penalti();
  else if (cartao) Narrador.cartao(culpado.chamado, cartao);
  else Narrador.falta(culpado.chamado);
  let x = clamp(vitima.x, 20, W - 20), y = clamp(vitima.y, 20, H - 20);
  if (tipo === 'penalti') { x = culpado.team === 0 ? 110 : W - 110; y = H / 2; }
  const quem = culpado.nome;
  const sub = cartao === 'vermelho' ? `CARTÃO VERMELHO! ${quem} é expulso`
    : cartao === 'amarelo' ? `Cartão amarelo para ${quem}` : `Falta de ${quem}`;
  startSetPiece(tipo, team, x, y, 'FALTA! ' + NOMES_PARADA[tipo], sub, cartao);
}

// ---------- Bolas paradas ----------
function startSetPiece(tipo, team, x, y, texto, sub, cartao) {
  ball.owner = null;
  ball.vx = ball.vy = ball.vz = 0;
  Som.apito(false);
  setPiece = { tipo, team, x, y, taker: null };
  aviso = { texto: texto || NOMES_PARADA[tipo], sub: sub || `${EQUIPAS[team].nome}`, cartao: cartao || null, t: 2.2 };
  charging = [false, false]; charge = [0, 0];
  state = 'apito';
  stateTimer = 1.1;
}

function placeSetPiece() {
  const sp = setPiece;
  // Expulsos saem do campo
  players = players.filter(p => !p.expulso);
  for (let t = 0; t < 2; t++) if (!players.includes(human[t])) human[t] = frontPlayer(t);
  for (const p of players) { p.slide = p.chao = p.stun = 0; p.vx = p.vy = 0; p.barreira = null; }

  ball.x = sp.x; ball.y = sp.y; ball.z = 0; ball.vx = ball.vy = ball.vz = 0;
  const goalX = sp.team === 0 ? W : 0;
  let facing;
  if (sp.tipo === 'lateral') facing = Math.atan2((H / 2 - sp.y) * 0.6, (goalX - sp.x) * 0.4);
  else if (sp.tipo === 'baliza') facing = sp.team === 0 ? 0 : Math.PI;
  else facing = Math.atan2(H / 2 - sp.y, goalX - sp.x);

  let taker;
  if (sp.tipo === 'baliza') taker = players.find(p => p.team === sp.team && p.gk);
  else {
    const field = players.filter(p => p.team === sp.team && !p.gk);
    taker = field.reduce((a, b) => (dist(b, ball) < dist(a, ball) ? b : a));
  }
  const back = PLAYER_R + BALL_R + 2;
  taker.x = ball.x - Math.cos(facing) * back;
  taker.y = ball.y - Math.sin(facing) * back;
  taker.facing = facing;
  sp.taker = taker;
  ball.owner = taker;
  taker.holdTime = 0;
  if (!taker.gk) human[sp.team] = taker;

  if (sp.tipo === 'penalti') {
    // Todos fora da área, só o marcador e o guarda-redes
    const def = 1 - sp.team;
    const box = def === 0 ? 175 : W - 175;
    for (const p of players) {
      if (p === taker) continue;
      if (p.gk && p.team === def) { p.x = def === 0 ? 8 : W - 8; p.y = H / 2; p.facing = def === 0 ? 0 : Math.PI; continue; }
      if (p.gk) continue;
      // Fora da área e afastados do meio, para não taparem a câmara atrás de quem bate
      p.x = box;
      p.y = clamp(p.y, 40, H - 40);
      if (Math.abs(p.y - H / 2) < 85) p.y = H / 2 + (p.y < H / 2 ? -85 : 85) + (Math.random() - 0.5) * 30;
    }
  }
  sp.barreira = [];
  if (sp.tipo === 'livre') {
    const goalX = sp.team === 0 ? W : 0;
    const dx = goalX - ball.x, dy = H / 2 - ball.y;
    const dGolo = Math.hypot(dx, dy);
    if (dGolo < 400) {
      // Barreira: 3 defesas a 70 da bola, na linha entre a bola e a baliza
      const ux = dx / dGolo, uy = dy / dGolo;
      const defensores = players.filter(p => p.team !== sp.team && !p.gk)
        .sort((a, b) => dist(a, ball) - dist(b, ball)).slice(0, 3);
      defensores.forEach((p, i) => {
        const lado = (i - (defensores.length - 1) / 2) * (PLAYER_R * 2 + 1);
        p.x = ball.x + ux * 72 - uy * lado;
        p.y = ball.y + uy * 72 + ux * lado;
        p.facing = Math.atan2(-uy, -ux);
        p.barreira = { x: p.x, y: p.y };
        sp.barreira.push(p);
      });
    }
  }
  if (sp.tipo === 'canto') {
    // Todos já na área quando o canto vai ser batido
    for (const p of players) {
      if (p === taker || p.gk) continue;
      const t = aiTarget(p);
      p.x = t.x; p.y = t.y;
    }
  }
  if (human[1 - sp.team] && human[1 - sp.team].gk) human[1 - sp.team] = frontPlayer(1 - sp.team);
  keepAway();
  state = 'parada';
  cpu.espera = 0;
}

// Pontapé de saída: quem está no meio-campo é obrigado a passar (não pode rematar nem fugir com a bola)
function comecarSaida() {
  const taker = human[kickoffTeam];
  ball.owner = taker;
  ball.z = ball.vz = 0;
  // Começa virado para o colega mais perto, para o passe sair fácil
  const colegas = players.filter(p => p.team === kickoffTeam && p !== taker && !p.gk);
  const perto = colegas.reduce((a, b) => (dist(b, taker) < dist(a, taker) ? b : a), colegas[0]);
  if (perto) taker.facing = taker.mira = Math.atan2(perto.y - taker.y, perto.x - taker.x);
  setPiece = { tipo: 'saida', team: kickoffTeam, x: W / 2, y: H / 2, taker, barreira: [] };
  state = 'parada';
  cpu.espera = 0;
}

// Os adversários têm de ficar longe da bola até ela ser batida
// (e do guarda-redes quando ele tem a bola nas mãos: não se pode atacar o GR)
function keepAway() {
  const gr = ball.owner && ball.owner.gk ? ball.owner : null;
  if (gr) {
    for (const p of players) {
      if (p.team === gr.team) continue;
      const d = dist(p, gr);
      if (d < 80 && d > 0) {
        p.x = gr.x + (p.x - gr.x) / d * 80;
        p.y = gr.y + (p.y - gr.y) / d * 80;
      }
    }
  }
  if (!setPiece) return;
  // Livres, lançamentos e cantos: ninguém mesmo à frente da bola nem colado a ela
  const t = setPiece.taker;
  if (state === 'parada' && t && ['livre', 'lateral', 'canto'].includes(setPiece.tipo)) {
    const fx = Math.cos(t.facing), fy = Math.sin(t.facing);
    for (const p of players) {
      if (p === t || p.gk || (setPiece.barreira && setPiece.barreira.includes(p))) continue;
      let rx = p.x - ball.x, ry = p.y - ball.y;
      const frente = rx * fx + ry * fy;          // distância para a frente da bola
      const lado = -rx * fy + ry * fx;           // distância para o lado
      if (frente > -5 && frente < 70 && Math.abs(lado) < 24) {
        const s = lado >= 0 ? 1 : -1;
        p.x = ball.x + fx * frente - fy * 24 * s;
        p.y = ball.y + fy * frente + fx * 24 * s;
        rx = p.x - ball.x; ry = p.y - ball.y;
      }
      const d = Math.hypot(rx, ry);
      if (d < 40 && d > 0) { p.x = ball.x + rx / d * 40; p.y = ball.y + ry / d * 40; }
    }
  }
  const min = setPiece.tipo === 'penalti' ? 0 : 70;
  for (const p of players) {
    if (p.team === setPiece.team || p.gk) continue;
    const d = dist(p, ball);
    if (d < min) {
      const a = d > 0 ? Math.atan2(p.y - ball.y, p.x - ball.x) : Math.PI / 2;
      p.x = clamp(ball.x + Math.cos(a) * min, -15, W + 15);
      p.y = clamp(ball.y + Math.sin(a) * min, -15, H + 15);
    }
  }
}

function ballOut() {
  const last = ball.lastTouch ? ball.lastTouch.team : 0;
  if (ball.remate && (ball.x < 0 || ball.x > W) && Math.abs(ball.y - H / 2) < GOAL_W) { Som.uh(); Narrador.uh(); }
  const fiscal = arbitros.filter(a => a.tipo === 'fiscal')
    .reduce((a, b) => (dist(b, ball) < dist(a, ball) ? b : a), arbitros[1]);
  if (fiscal) fiscal.bandeira = 1.6;
  if (ball.y < 0 || ball.y > H) {
    const y = ball.y < 0 ? 2 : H - 2;
    return startSetPiece('lateral', 1 - last, clamp(ball.x, 10, W - 10), y);
  }
  // Saiu pela linha de fundo
  const defende = ball.x < 0 ? 0 : 1;
  if (last === defende) {
    const x = defende === 0 ? 4 : W - 4;
    const y = ball.y < H / 2 ? 4 : H - 4;
    Narrador.canto();
    return startSetPiece('canto', 1 - defende, x, y);
  }
  startSetPiece('baliza', defende, defende === 0 ? 45 : W - 45, H / 2);
}

// ---------- Física ----------
function updateBall(dt) {
  if (ball.owner) {
    const p = ball.owner;
    // A correr, o jogador vai empurrando a bola em pequenos toques
    const vel = Math.hypot(p.vx, p.vy);
    p.toque += vel * dt * 0.05;
    const longe = PLAYER_R + BALL_R + 2 + (vel / 175) * 7 * (0.5 + 0.5 * Math.sin(p.toque));
    const tx = p.x + Math.cos(p.facing) * longe;
    const ty = p.y + Math.sin(p.facing) * longe;
    ball.x += (tx - ball.x) * Math.min(1, dt * 20);
    ball.y += (ty - ball.y) * Math.min(1, dt * 20);
    ball.vx = p.vx; ball.vy = p.vy;
    ball.z = 0; ball.vz = 0;
  } else {
    // Efeito (curva): a bola desvia-se para o lado enquanto voa
    if (ball.curva) {
      const v = Math.hypot(ball.vx, ball.vy);
      if (v > 50) {
        const nx = -ball.vy / v, ny = ball.vx / v;
        ball.vx += nx * ball.curva * dt;
        ball.vy += ny * ball.curva * dt;
      }
      ball.curva *= Math.pow(0.6, dt);
      if (Math.abs(ball.curva) < 5) ball.curva = 0;
    }
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.z += ball.vz * dt;
    ball.vz -= (GRAVIDADE + (ball.dip || 0)) * dt;
    if (ball.z <= 0) {
      // Quando cai, a bola salta e perde um pouco de velocidade
      ball.z = 0;
      ball.dip = 0;
      if (ball.vz < -80) { ball.vz = -ball.vz * 0.5; ball.vx *= 0.9; ball.vy *= 0.9; }
      else ball.vz = 0;
    }
    if (ball.z > 1) {
      const f = Math.pow(0.85, dt);       // resistência do ar
      ball.vx *= f; ball.vy *= f;
    } else {
      // A rolar na relva trava cada vez mais devagar
      const v = Math.hypot(ball.vx, ball.vy);
      if (v > 0) {
        const nv = Math.max(0, v - (35 + v * 0.8) * dt);
        ball.vx *= nv / v; ball.vy *= nv / v;
      }
    }
  }

  // A bola só sai quando passa toda a linha
  if (ball.owner) {
    // Quem tem a bola não a pode levar para fora
    ball.y = clamp(ball.y, 1, H - 1);
    ball.x = clamp(ball.x, 1, W - 1);
    return;
  }
  const inMouth = Math.abs(ball.y - H / 2) < GOAL_W / 2 - BALL_R && ball.z < GOAL_H - BALL_R;
  if (ball.x < -BALL_R && inMouth) return goal(1);
  if (ball.x > W + BALL_R && inMouth) return goal(0);
  if (ball.y < -BALL_R || ball.y > H + BALL_R || ball.x < -BALL_R || ball.x > W + BALL_R) ballOut();
}

function handlePossession() {
  if (state === 'parada') return;
  const ballSpeed = Math.hypot(ball.vx, ball.vy);
  for (const p of players) {
    if (p.cooldown > 0 || p.stun > 0 || p.slide > 0 || p.chao > 0 || ball.owner === p) continue;
    const d = dist(p, ball);
    // Bola alta à altura da cabeça: cabeceamento
    if (!ball.owner && !p.gk && ball.z > 12 && ball.z < 30 && d < PLAYER_R + 9 && ball.lastTouch !== p) {
      const passeDeColega = ball.lastTouch && ball.lastTouch.team === p.team && !ball.remate;
      const pertoDaBaliza = Math.abs((p.team === 0 ? W : 0) - p.x) < 300 && Math.abs(p.y - H / 2) < 200;
      if (passeDeColega && !pertoDaBaliza && ballSpeed < 520 && p.cooldown <= 0) {
        // Domina a bola com o peito
        ball.owner = p; p.holdTime = 0; ball.lastTouch = p; ball.curva = 0; ball.z = 0; ball.vz = 0;
        Narrador.passe(p.chamado);
        continue;
      }
      cabecear(p);
      continue;
    }
    if (ball.z > (p.gk ? 45 : 14)) continue;
    // Bola muito rápida bate no corpo do jogador e ressalta
    if (!ball.owner && !p.gk && ballSpeed >= 420 && d < PLAYER_R + BALL_R && ball.lastTouch !== p) {
      const nx = (ball.x - p.x) / (d || 1), ny = (ball.y - p.y) / (d || 1);
      const vn = ball.vx * nx + ball.vy * ny;
      if (vn < 0) {
        ball.vx = (ball.vx - 2 * vn * nx) * 0.4 + (Math.random() - 0.5) * 80;
        ball.vy = (ball.vy - 2 * vn * ny) * 0.4 + (Math.random() - 0.5) * 80;
        ball.vz = 50 + Math.random() * 120;
        ball.curva = 0;
        ball.lastTouch = p;
        ball.remate = ball.potente = false;
        p.cooldown = 0.25;
        shotId++;
        Som.chuto(250);
      }
      continue;
    }

    // O GR tenta defender a bola que lhe passa perto OU um remate à baliza ao alcance do mergulho
    const linhaGolo = p.team === 0 ? 0 : W;
    const vaiParaBaliza = (linhaGolo - ball.x) * ball.vx > 0;
    // O mergulho é só para remates; cruzamentos e passes o GR só agarra se lhe passarem perto
    const alcanceMergulho = ball.remate && vaiParaBaliza && ballSpeed >= 220 &&
      Math.abs(ball.x - p.x) < 22 && Math.abs(ball.y - p.y) < (p.ps === 'Reflexos' ? 92 : 85);
    const alcanceMaos = ball.remate ? PLAYER_R + 30 : PLAYER_R + 18;   // cruzamentos: só os que passam perto
    if (p.gk && !ball.owner && p.gkShot !== shotId && (d < alcanceMaos || alcanceMergulho)) {
      // Regra do Guilherme: o GR defende se o remate não for potente nem colocado
      p.gkShot = shotId;
      const lado = ball.y - p.y;
      if (ball.remate && ballSpeed > 250 && Math.abs(lado) > 8) {
        // Atira-se para o lado da bola
        p.mergulho = 0.7; p.mergulhoDir = Math.sign(lado);
        p.vy = Math.sign(lado) * (p.ps === 'Reflexos' ? 280 : 230); p.vx = 0;
      }
      let chance;
      if (ballSpeed < (ball.remate ? 200 : 350)) chance = 1;
      if (!ball.remate) chance = ball.z > 20 ? 0.8 : 1;   // cruzamento alto às vezes escapa das mãos
      else if (ball.potente && ball.colocado) chance = 0.1;
      else if (ball.potente || ball.colocado) chance = 0.35;
      else chance = 0.95;
      if (ball.colocado && ball.ps === 'Remate Colocado') chance *= 0.6;
      if (p.ps === 'Reflexos' && ballSpeed >= 350) chance = Math.min(1, chance + 0.05);
      if (ballSpeed >= 200) chance = clamp(chance + (atr(p, 'ref') - 86) / 100, 0, 1);
      const r = Math.random();
      if (r < chance && ball.remate && Math.abs(lado) > 34 && ballSpeed >= 250) {
        // Defesa a mergulhar: longe do corpo não dá para agarrar, desvia a bola para fora
        ball.vx = -Math.sign(ball.vx) * (60 + Math.random() * 90);
        ball.vy = Math.sign(lado) * (220 + Math.random() * 160);
        ball.vz = 60 + Math.random() * 80;
        ball.curva = 0;
        ball.lastTouch = p;
        ball.remate = ball.potente = false;
        shotId++;
        p.gkShot = shotId;
        Som.defesa();
        Narrador.defesa(p.chamado);
        if (p.ps === 'Reflexos') psAtivo(p);
      } else if (r < chance) {
        ball.owner = p; p.holdTime = 0; ball.curva = 0;
        if (ballSpeed > 350) {
          Som.defesa();
          Narrador.defesa(p.chamado);
          if (p.ps === 'Reflexos') psAtivo(p);
        }
      }
      else if (r < chance + 0.1 && d < PLAYER_R + 12) {
        // Toca na bola mas não a agarra
        ball.vx *= -0.3; ball.vy = (Math.random() - 0.5) * 350; ball.lastTouch = p;
      }
      continue;
    }

    const corta = p.ps === 'Intercetor';
    if (!ball.owner && d < PLAYER_R + BALL_R + (corta ? 8 : 4) && ballSpeed < (corta ? 750 : 520)) {
      const deQuem = ball.lastTouch;
      ball.owner = p; p.holdTime = 0; ball.lastTouch = p; ball.curva = 0;
      if (corta && deQuem && deQuem.team !== p.team && ballSpeed > 380) psAtivo(p);
      if (deQuem && deQuem !== p && deQuem.team === p.team && !p.gk) Narrador.passe(p.chamado);
    } else if (ball.owner && ball.owner.team !== p.team && !ball.owner.gk && ball.owner.finta <= 0 &&
               d < PLAYER_R + BALL_R + 3 && p.tentativa <= 0) {
      // Tentativa de roubar a bola encostando: nem sempre resulta
      p.tentativa = 0.5;
      // Muralha: ganha os duelos de ombro e é difícil tirar-lhe a bola
      const dono = ball.owner;
      let chance = 0.4 * (0.5 + atr(p, 'def') / 100 * 0.7) * (1.5 - atr(dono, 'dri') / 100) *
        (1 + (atr(p, 'fis') - atr(dono, 'fis')) / 120);
      if (dono.ps === 'Muralha') chance *= 0.5;
      if (p.ps === 'Muralha') chance *= 1.6;
      chance = clamp(chance, 0.08, 0.85);
      const ganhou = ball.owner.holdTime > 0.5 && Math.random() < chance;
      if (!ganhou && ball.owner.ps === 'Muralha') psAtivo(ball.owner);
      if (ganhou && p.ps === 'Muralha') psAtivo(p);
      if (ganhou) {
        ball.owner.stun = 0.3;
        ball.owner.perdeuBola = 0.6;
        ball.owner.holdTime = 0;
        ball.owner = p; p.holdTime = 0; ball.lastTouch = p;
      }
    }
  }
  // Quem recebe a bola passa a ser controlado pelo humano dessa equipa
  if (ball.owner && !ball.owner.gk) human[ball.owner.team] = ball.owner;
}

function separatePlayers() {
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i], b = players[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const min = PLAYER_R * 2;
      if (d > 0 && d < min) {
        const push = (min - d) / 2;
        a.x -= dx / d * push; a.y -= dy / d * push;
        b.x += dx / d * push; b.y += dy / d * push;
      }
    }
  }
}

function goal(team) {
  Som.golo();
  const t = ball.lastTouch;
  marcador = t ? (t.team === team ? t.nome : `${t.nome} (autogolo)`) : '';
  if (t && t.team === team) Narrador.golo(t.chamado);
  else Narrador.autogolo(t ? t.chamado : '');
  score[team]++;
  lastScorer = team;
  kickoffTeam = 1 - team;
  ball.owner = null;
  fimDepois = score[team] >= GOLS_PARA_GANHAR;
  state = 'golo';
  stateTimer = 3.5;
}

// ---------- Ciclo principal ----------
function update(dt) {
  if (pressed.has('KeyN')) Narrador.alternar();
  if (state === 'titulo') {
    // Setas ← → escolhem o estádio; W/S a equipa do J1; ↑/↓ a equipa do J2
    if (pressed.has('ArrowRight')) Render.mudarEstadio(1);
    if (pressed.has('ArrowLeft')) Render.mudarEstadio(-1);
    if (pressed.has('Digit1') || pressed.has('Numpad1')) {
      if (modoJogo === 'cpu') nivel = (nivel + 1) % NIVEIS.length;
      modoJogo = 'cpu';
    }
    if (pressed.has('Digit2') || pressed.has('Numpad2')) modoJogo = '2j';
    if (pressed.has('Digit3') || pressed.has('Numpad3')) numJogadores = 5;
    if (pressed.has('Digit4') || pressed.has('Numpad4')) numJogadores = 11;
    if (pressed.has('KeyW')) mudarEquipa(0, -1);
    if (pressed.has('KeyS')) mudarEquipa(0, 1);
    if (pressed.has('ArrowUp')) mudarEquipa(1, -1);
    if (pressed.has('ArrowDown')) mudarEquipa(1, 1);
    if (pressed.has('Space')) newGame();
    return;
  }
  if (state === 'fim') {
    stateTimer -= dt;
    if (stateTimer < 0 && pressed.has('Space')) state = 'titulo';
    return;
  }
  if (state === 'golo') {
    stateTimer -= dt;
    // A bola continua a rolar dentro da baliza
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    ball.vx *= 0.9; ball.vy *= 0.9;
    ball.z = Math.max(0, ball.z - 40 * dt);
    ball.x = clamp(ball.x, -GOAL_D + BALL_R, W + GOAL_D - BALL_R);
    if (stateTimer > 2.3) gravar(dt);   // grava a bola a entrar na rede
    if (stateTimer <= 0) comecarReplay();
    return;
  }
  if (state === 'replay') {
    updateReplay(dt);
    return;
  }
  if (aviso) { aviso.t -= dt; if (aviso.t <= 0) aviso = null; }
  for (let i = popups.length - 1; i >= 0; i--) { popups[i].t -= dt; if (popups[i].t <= 0) popups.splice(i, 1); }
  updateArbitros(dt);
  if (state === 'apito') {
    stateTimer -= dt;
    for (const p of players) { p.vx *= 0.85; p.vy *= 0.85; p.x += p.vx * dt; p.y += p.vy * dt; }
    if (stateTimer <= 0) placeSetPiece();
    return;
  }
  if (state === 'inicio') {
    stateTimer -= dt;
    if (stateTimer <= 0) {
      comecarSaida();
      Som.apito(false);
      if (primeiroApito) { Narrador.inicio(); primeiroApito = false; }
    }
    return;
  }

  for (const p of players) {
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.stun = Math.max(0, p.stun - dt);
    p.perdeuBola = Math.max(0, p.perdeuBola - dt);
    p.cabeceou = Math.max(0, p.cabeceou - dt);
    p.psCd = Math.max(0, p.psCd - dt);
    p.finta = Math.max(0, p.finta - dt);
    p.tentativa = Math.max(0, p.tentativa - dt);
    if (ball.owner === p) p.holdTime += dt;
    const t = human.indexOf(p);
    if (p.slide > 0 || p.chao > 0) updateSlide(p, dt);
    else if (t >= 0 && eCPU(t)) updateCPU(p, dt);
    else if (t >= 0) updateHuman(p, t, dt);
    else updateAI(p, dt);
    if (state === 'apito') return;     // houve falta
    p.x = clamp(p.x + p.vx * dt, -20, W + 20);
    p.y = clamp(p.y + p.vy * dt, -20, H + 20);
  }
  separatePlayers();
  keepAway();
  handlePossession();
  updateBall(dt);
  if (state === 'jogo' || state === 'golo') gravar(dt);
}

// ---------- Árbitros ----------
function criarArbitros() {
  arbitros.length = 0;
  arbitros.push({ tipo: 'arbitro', x: W / 2 - 60, y: H / 2 + 90, vx: 0, vy: 0, facing: -Math.PI / 2,
    cartao: null, cartaoT: 0, apito: 0 });
  // Fiscais: um em cada linha lateral, cada um numa metade do campo
  arbitros.push({ tipo: 'fiscal', lado: 0, x: W * 0.3, y: -16, vx: 0, vy: 0, facing: Math.PI / 2, bandeira: 0 });
  arbitros.push({ tipo: 'fiscal', lado: 1, x: W * 0.7, y: H + 16, vx: 0, vy: 0, facing: -Math.PI / 2, bandeira: 0 });
}

function updateArbitros(dt) {
  for (const a of arbitros) {
    let tx, ty;
    if (a.tipo === 'arbitro') {
      // Fica na diagonal da jogada, perto mas sem atrapalhar
      tx = clamp(ball.x - 70, 60, W - 60);
      ty = clamp(ball.y + (ball.y < H / 2 ? 95 : -95), 30, H - 30);
      a.apito = Math.max(0, a.apito - dt);
      if (a.cartaoT > 0) { a.cartaoT -= dt; tx = a.x; ty = a.y; }
    } else {
      // O fiscal acompanha a bola ao longo da linha, na sua metade
      tx = a.lado === 0 ? clamp(ball.x, 30, W / 2) : clamp(ball.x, W / 2, W - 30);
      ty = a.y;
      a.bandeira = Math.max(0, a.bandeira - dt);
    }
    moveTowards(a, tx, ty, 150, dt);
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    const paraBola = Math.atan2(ball.y - a.y, ball.x - a.x);
    const vel = Math.hypot(a.vx, a.vy);
    if (a.tipo === 'arbitro' && vel > 40 && a.cartaoT <= 0) a.facing = rodarPara(a.facing, Math.atan2(a.vy, a.vx), dt * 8);
    else a.facing = rodarPara(a.facing, paraBola, dt * 6);
  }
}

// ---------- Repetição do golo ----------
function gravar(dt) {
  GRAVACAO.push({
    dt,
    bola: { x: ball.x, y: ball.y, z: ball.z, vx: ball.vx, vy: ball.vy },
    jogadores: players.map(p => ({
      ref: p, x: p.x, y: p.y, facing: p.facing, vx: p.vx, vy: p.vy, slide: p.slide, chao: p.chao,
      cooldown: p.cooldown, mergulho: p.mergulho, mergulhoDir: p.mergulhoDir, team: p.team, cabeceou: p.cabeceou,
      finta: p.finta, fintaLado: p.fintaLado,
    })),
    arbitros: arbitros.map(a => ({ ...a, ref: a })),
  });
  if (GRAVACAO.length > 420) GRAVACAO.shift();
}

function comecarReplay() {
  if (GRAVACAO.length < 30) return acabarReplay();
  // Começa uns 4 segundos antes do golo
  let t = 0, i = GRAVACAO.length - 1;
  while (i > 0 && t < 4.5) { t += GRAVACAO[i].dt; i--; }
  replay.i = i; replay.t = 0;
  state = 'replay';
}

function updateReplay(dt) {
  replay.t += dt * 0.5;   // em câmara lenta
  while (replay.i < GRAVACAO.length - 1 && replay.t >= GRAVACAO[replay.i].dt) {
    replay.t -= GRAVACAO[replay.i].dt;
    replay.i++;
  }
  const saltar = ['Space', 'KeyF', 'KeyG', 'KeyK', 'KeyL'].some(k => pressed.has(k));
  if (replay.i >= GRAVACAO.length - 1 || saltar) acabarReplay();
}

function acabarReplay() {
  if (fimDepois) {
    state = 'fim';
    stateTimer = 1.5;
    Som.apito(true);
    Narrador.fim(EQUIPAS[lastScorer].nome);
  } else resetKickoff();
}

// O que o 3D deve mostrar: o jogo ao vivo ou a repetição
function vista() {
  if (state === 'replay') {
    const f = GRAVACAO[replay.i];
    return { jogadores: f.jogadores, bola: f.bola, arbitros: f.arbitros, replay: true };
  }
  return { jogadores: players, bola: ball, arbitros, replay: false };
}

