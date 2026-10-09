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
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', b1: 'KeyF', b2: 'KeyG' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', b1: 'KeyK', b2: 'KeyL' },
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
const EQUIPAS = [
  { nome: 'PORTUGAL', curto: 'POR', camisola: '#c8102e', calcoes: '#00573f', numero: '#ffd60a', gr: '#111111',
    plantel: [
      { nome: 'Diogo Costa', num: 22, ps: 'Reflexos' },
      { nome: 'Rúben Dias', num: 4, ps: 'Muralha' },
      { nome: 'Nuno Mendes', num: 19, ps: 'Rápido' },
      { nome: 'Bruno Fernandes', num: 8, ps: 'Passe Incisivo' },
      { nome: 'Cristiano Ronaldo', num: 7, ps: 'Remate Potente' },
    ] },
  { nome: 'FRANÇA', curto: 'FRA', camisola: '#1d3f8f', calcoes: '#ffffff', numero: '#ffffff', gr: '#f4a261',
    plantel: [
      { nome: 'Mike Maignan', num: 16, ps: 'Reflexos' },
      { nome: 'William Saliba', num: 17, ps: 'Muralha' },
      { nome: 'Theo Hernández', num: 22, ps: 'Carrinho' },
      { nome: 'Aurélien Tchouaméni', num: 8, ps: 'Intercetor' },
      { nome: 'Kylian Mbappé', num: 10, ps: 'Remate Colocado' },
    ] },
];

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

// ---------- Utilitários ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
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
let charge = [0, 0];           // força do remate (0 a 1)
let charging = [false, false];
let shotId = 0;
let setPiece = null;           // bola parada: { tipo, team, x, y, taker }
let aviso = null;              // mensagem do árbitro: { texto, sub, cartao, t }

const NOMES_PARADA = {
  lateral: 'LANÇAMENTO LATERAL', canto: 'CANTO', baliza: 'PONTAPÉ DE BALIZA',
  livre: 'LIVRE', penalti: 'PENÁLTI!',
};

function attackDir(team) { return team === 0 ? 1 : -1; }

function basePos(team, slot) {
  const f = FORMACAO_5[slot];
  return { x: team === 0 ? f.x * W : W - f.x * W, y: f.y * H };
}

function createPlayers() {
  players = [];
  for (let team = 0; team < 2; team++) {
    FORMACAO_5.forEach((f, slot) => {
      const b = basePos(team, slot);
      const j = EQUIPAS[team].plantel[slot];
      players.push({
        team, slot, num: j.num, nome: j.nome, ps: j.ps, pos: f.pos, gk: slot === 0,
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
      });
    });
  }
}

function resetKickoff() {
  for (const p of players) {
    const b = basePos(p.team, p.slot);
    p.x = b.x; p.y = b.y; p.vx = p.vy = 0;
    p.facing = p.team === 0 ? 0 : Math.PI;
    p.cooldown = p.stun = p.holdTime = p.slide = p.chao = 0;
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
  state = 'inicio';
  stateTimer = 1.2;
}

// Jogador de campo mais avançado da equipa (o avançado, ou quem estiver no lugar dele)
function frontPlayer(team) {
  const field = players.filter(p => p.team === team && !p.gk);
  return field.reduce((a, b) => (b.slot > a.slot ? b : a));
}

function newGame() {
  score = [0, 0];
  kickoffTeam = 0;
  createPlayers();
  resetKickoff();
  aviso = null;
}

// ---------- Chutar, passar, mudar de jogador ----------
function kick(p, angle, speed, lift = 0) {
  ball.owner = null;
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
  ball.vz = lift;
  ball.ps = p.ps;
  Som.chuto(speed);
  ball.lastTouch = p;
  p.cooldown = 0.3;
  p.holdTime = 0;
  ball.potente = ball.colocado = false;
  shotId++;
  if (state === 'parada') { state = 'jogo'; setPiece = null; }
}

function canTouchBall(p) {
  if (ball.owner === p) return true;
  return !ball.owner && dist(p, ball) < PLAYER_R + BALL_R + 10 && p.cooldown <= 0;
}

function shoot(p, power) {
  let angle = p.facing;
  let colocado = false;
  const goalX = p.team === 0 ? W : 0;
  const toGoal = Math.atan2(H / 2 - p.y, goalX - p.x);
  // Virado para a baliza: na diagonal remata para um canto, a direito remata ao meio
  if (angDiff(p.facing, toGoal) < Math.PI / 3 && Math.abs(goalX - p.x) < 450) {
    const vert = Math.sin(p.facing);
    colocado = Math.abs(vert) > 0.3;
    const ty = H / 2 + (colocado ? Math.sign(vert) * (GOAL_W / 2 - 22) : 0);
    angle = Math.atan2(ty - ball.y, goalX - ball.x);
  }
  angle += (Math.random() - 0.5) * 0.04;
  const forte = p.ps === 'Remate Potente' ? 1.15 : 1;
  kick(p, angle, (380 + power * 520) * forte, 60 + power * 150 + Math.random() * 30);
  ball.ps = p.ps;
  ball.potente = power > (p.ps === 'Remate Potente' ? 0.5 : 0.7);
  ball.colocado = colocado;
}

function pass(p) {
  let best = null, bestScore = Infinity;
  for (const m of players) {
    if (m.team !== p.team || m === p) continue;
    const d = dist(p, m);
    const a = Math.atan2(m.y - p.y, m.x - p.x);
    const diff = angDiff(a, p.facing);
    if (diff > Math.PI * 0.42 || d < 30) continue;
    const s = diff * 300 + d * 0.4 + (m.gk ? 400 : 0);
    if (s < bestScore) { bestScore = s; best = m; }
  }
  if (!best) { kick(p, p.facing, 330); return; }
  // Passa para onde o colega vai estar
  const d = dist(p, best);
  const speed = clamp(d * 1.5 + 160, 260, 650) * (p.ps === 'Passe Incisivo' ? 1.2 : 1);
  const t = d / speed;
  const tx = best.x + best.vx * t, ty = best.y + best.vy * t;
  // Passes longos vão pelo ar, por cima dos adversários
  const lift = d > 220 ? clamp((d - 150) * 0.9, 0, 300) : 0;
  kick(p, Math.atan2(ty - p.y, tx - p.x), speed, lift);
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
    return { x: goalX - attackDir(setPiece.team) * fundo, y: H / 2 + (p.slot - 2.5) * 45 + (atk ? 15 : -15) };
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
  if (ball.owner === p) {
    // Segura a bola um bocadinho e depois passa
    p.vx *= 0.8; p.vy *= 0.8;
    p.facing = p.team === 0 ? 0 : Math.PI;
    if (p.holdTime > 0.8) pass(p);
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
  let target = aiTarget(p);
  // Um colega ajuda a pressionar se o adversário tem a bola no nosso meio-campo
  const inOwnHalf = p.team === 0 ? ball.x < W * 0.55 : ball.x > W * 0.45;
  if (teamWithBall() !== p.team && chaser(p.team) === p && inOwnHalf &&
      dist(p, ball) < dist(human[p.team], ball)) {
    target = { x: ball.x, y: ball.y };
  }
  moveTowards(p, target.x, target.y, p.ps === 'Rápido' ? 157 : 140, dt);
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
    if (len) p.facing = Math.atan2(dy, dx);
    if (pressed.has(k.b2)) { charging[t] = true; charge[t] = 0; }
    if (charging[t]) charge[t] = Math.min(1, charge[t] + dt / 0.9);
    if (released.has(k.b2) && charging[t]) {
      if (setPiece.tipo === 'lateral') kick(p, p.facing, 300 + charge[t] * 150, 150);
      else shoot(p, charge[t]);
      charging[t] = false; charge[t] = 0;
    }
    if (pressed.has(k.b1)) pass(p);
    return;
  }

  if (p.slide > 0 || p.chao > 0) return;   // a meio do carrinho ou no chão
  const temBola = canTouchBall(p);

  // Botão 2: com bola = começar a carregar o remate; sem bola = carrinho
  if (pressed.has(k.b2)) {
    if (temBola) { charging[t] = true; charge[t] = 0; }
    else {
      p.slide = 0.35; p.slideDir = len ? Math.atan2(dy, dx) : p.facing;
      p.facing = p.slideDir; p.slideDone = false;
      return;
    }
  }

  let speed = ball.owner === p ? 160 : 175;
  if (p.ps === 'Rápido') speed *= 1.12;
  if (p.stun > 0) speed *= 0.4;
  const wantVx = len ? dx / len * speed : 0;
  const wantVy = len ? dy / len * speed : 0;
  p.vx += (wantVx - p.vx) * Math.min(1, dt * 10);
  p.vy += (wantVy - p.vy) * Math.min(1, dt * 10);
  if (len) p.facing = Math.atan2(dy, dx);

  // Larga o botão 2 para rematar
  if (charging[t]) charge[t] = Math.min(1, charge[t] + dt / 0.9);
  if (released.has(k.b2) && charging[t]) {
    if (canTouchBall(p)) shoot(p, charge[t]);
    charging[t] = false; charge[t] = 0;
  }
  // Botão 1: com bola = passar; sem bola = mudar de jogador
  if (pressed.has(k.b1)) {
    if (temBola) pass(p);
    else switchPlayer(t);
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
  if (owner && owner.team !== p.team && dist(p, owner) < PLAYER_R * 2 + 2 && ball.z < 10) {
    const porTras = angDiff(p.slideDir, owner.facing) < 1.0;
    const tocaBola = dist(p, ball) < PLAYER_R + BALL_R + (p.ps === 'Carrinho' ? 11 : 6);
    p.slideDone = true;
    if (porTras || !tocaBola) return foul(p, owner, porTras);
    // Carrinho limpo: a bola sai disparada
    owner.stun = 0.6; owner.holdTime = 0;
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
  for (const p of players) { p.slide = p.chao = p.stun = 0; p.vx = p.vy = 0; }

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
      p.x = box; p.y = clamp(p.y, 40, H - 40);
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
}

// Os adversários têm de ficar longe da bola até ela ser batida
function keepAway() {
  if (!setPiece) return;
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
  if (ball.y < 0 || ball.y > H) {
    const y = ball.y < 0 ? 2 : H - 2;
    return startSetPiece('lateral', 1 - last, clamp(ball.x, 10, W - 10), y);
  }
  // Saiu pela linha de fundo
  const defende = ball.x < 0 ? 0 : 1;
  if (last === defende) {
    const x = defende === 0 ? 4 : W - 4;
    const y = ball.y < H / 2 ? 4 : H - 4;
    return startSetPiece('canto', 1 - defende, x, y);
  }
  startSetPiece('baliza', defende, defende === 0 ? 45 : W - 45, H / 2);
}

// ---------- Física ----------
function updateBall(dt) {
  if (ball.owner) {
    const p = ball.owner;
    const tx = p.x + Math.cos(p.facing) * (PLAYER_R + BALL_R + 2);
    const ty = p.y + Math.sin(p.facing) * (PLAYER_R + BALL_R + 2);
    ball.x += (tx - ball.x) * Math.min(1, dt * 20);
    ball.y += (ty - ball.y) * Math.min(1, dt * 20);
    ball.vx = p.vx; ball.vy = p.vy;
    ball.z = 0; ball.vz = 0;
  } else {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.z += ball.vz * dt;
    ball.vz -= GRAVIDADE * dt;
    if (ball.z <= 0) {
      // Quando cai, a bola salta um bocadinho
      ball.z = 0;
      ball.vz = ball.vz < -80 ? -ball.vz * 0.45 : 0;
    }
    const f = Math.pow(ball.z > 1 ? 0.85 : 0.42, dt);   // no ar trava menos que na relva
    ball.vx *= f; ball.vy *= f;
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
    if (ball.z > (p.gk ? 45 : 14)) continue;

    if (p.gk && !ball.owner && d < PLAYER_R + 30 && p.gkShot !== shotId) {
      // Regra do Guilherme: o GR defende se o remate não for potente nem colocado
      p.gkShot = shotId;
      let chance;
      if (ballSpeed < 350) chance = 1;
      else if (ball.potente && ball.colocado) chance = 0.1;
      else if (ball.potente || ball.colocado) chance = 0.35;
      else chance = 0.95;
      if (ball.colocado && ball.ps === 'Remate Colocado') chance *= 0.6;
      if (p.ps === 'Reflexos' && ballSpeed >= 350) chance = Math.min(1, chance + 0.05);
      const r = Math.random();
      if (r < chance) { ball.owner = p; p.holdTime = 0; if (ballSpeed > 350) Som.defesa(); }
      else if (r < chance + 0.2 && d < PLAYER_R + 12) {
        // Toca na bola mas não a agarra
        ball.vx *= -0.3; ball.vy = (Math.random() - 0.5) * 350; ball.lastTouch = p;
      }
      continue;
    }

    const corta = p.ps === 'Intercetor';
    if (!ball.owner && d < PLAYER_R + BALL_R + (corta ? 8 : 4) && ballSpeed < (corta ? 750 : 520)) {
      ball.owner = p; p.holdTime = 0; ball.lastTouch = p;
    } else if (ball.owner && ball.owner.team !== p.team && !ball.owner.gk &&
               d < PLAYER_R + BALL_R + 3 && ball.owner.holdTime > (ball.owner.ps === 'Muralha' ? 0.9 : 0.35)) {
      // Roubar a bola (os carrinhos vêm na fase 3)
      ball.owner.stun = 0.5;
      ball.owner.holdTime = 0;
      ball.owner = p; p.holdTime = 0; ball.lastTouch = p;
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
  score[team]++;
  lastScorer = team;
  kickoffTeam = 1 - team;
  ball.owner = null;
  state = score[team] >= GOLS_PARA_GANHAR ? 'fim' : 'golo';
  stateTimer = state === 'fim' ? 3 : 3.5;
  if (state === 'fim') setTimeout(() => Som.apito(true), 1200);
}

// ---------- Ciclo principal ----------
function update(dt) {
  if (state === 'titulo') {
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
    if (stateTimer <= 0) resetKickoff();
    return;
  }
  if (aviso) { aviso.t -= dt; if (aviso.t <= 0) aviso = null; }
  if (state === 'apito') {
    stateTimer -= dt;
    for (const p of players) { p.vx *= 0.85; p.vy *= 0.85; p.x += p.vx * dt; p.y += p.vy * dt; }
    if (stateTimer <= 0) placeSetPiece();
    return;
  }
  if (state === 'inicio') {
    stateTimer -= dt;
    if (stateTimer <= 0) {
      state = 'jogo';
      ball.owner = human[kickoffTeam];
      Som.apito(false);
    }
    return;
  }

  for (const p of players) {
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.stun = Math.max(0, p.stun - dt);
    if (ball.owner === p) p.holdTime += dt;
    const t = human.indexOf(p);
    if (p.slide > 0 || p.chao > 0) updateSlide(p, dt);
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
}

