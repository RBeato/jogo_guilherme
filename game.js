// Futebol 26 — Fase 1
// Campo visto de cima, 5 contra 5, 2 jogadores no mesmo teclado.

// ---------- Medidas do campo (em "unidades de jogo") ----------
const W = 1000;          // comprimento do campo
const H = 640;           // largura do campo
const GOAL_W = 150;      // largura da baliza
const GOAL_D = 35;       // profundidade da baliza
const BALL_R = 5;
const PLAYER_R = 11;
const GOLS_PARA_GANHAR = 5;

// ---------- Teclas ----------
const TECLAS = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
    shoot: 'KeyF', pass: 'KeyG', sprint: 'ShiftLeft',
    tackle: 'KeyQ', skill: 'KeyE', switch: 'KeyR' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
    shoot: 'Enter', pass: 'ShiftRight', sprint: 'ControlRight',
    tackle: 'Period', skill: 'Comma', switch: 'Slash' },
];

const down = new Set();
const pressed = new Set();
const released = new Set();

addEventListener('keydown', e => {
  const code = e.code === 'NumpadEnter' ? 'Enter' : e.code;
  e.preventDefault();
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
  { nome: 'VERMELHOS', camisola: '#d62828', calcoes: '#ffffff', numero: '#ffffff', gr: '#2b9348' },
  { nome: 'AZUIS', camisola: '#1d4ed8', calcoes: '#0f172a', numero: '#ffffff', gr: '#f4a261' },
];

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
let charge = [0, 0];           // força do remate (0 a 1)
let charging = [false, false];
let shotId = 0;
const cam = { x: W / 2, y: H / 2 };
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
      players.push({
        team, slot, num: f.num, pos: f.pos, gk: slot === 0,
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
  ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, owner: null, lastTouch: null };
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
  cam.x = W / 2; cam.y = H / 2;
}

// ---------- Chutar, passar, mudar de jogador ----------
function kick(p, angle, speed) {
  ball.owner = null;
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
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
  kick(p, angle, 380 + power * 520);
  ball.potente = power > 0.7;
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
  const speed = clamp(d * 1.5 + 160, 260, 650);
  const t = d / speed;
  const tx = best.x + best.vx * t, ty = best.y + best.vy * t;
  kick(p, Math.atan2(ty - p.y, tx - p.x), speed);
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
  moveTowards(p, target.x, target.y, 140, dt);
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
    const lateral = setPiece.tipo === 'lateral';
    if (pressed.has(k.shoot)) { charging[t] = true; charge[t] = 0; }
    if (charging[t]) charge[t] = Math.min(1, charge[t] + dt / 0.9);
    if (released.has(k.shoot) && charging[t]) {
      if (lateral) kick(p, p.facing, 300 + charge[t] * 150);
      else shoot(p, charge[t]);
      charging[t] = false; charge[t] = 0;
    }
    if (pressed.has(k.pass)) pass(p);
    return;
  }

  if (p.slide > 0 || p.chao > 0) return;   // a meio do carrinho ou no chão
  if (pressed.has(k.tackle) && ball.owner !== p) {
    p.slide = 0.35; p.slideDir = len ? Math.atan2(dy, dx) : p.facing;
    p.facing = p.slideDir; p.slideDone = false;
    charging[t] = false; charge[t] = 0;
    return;
  }

  let speed = ball.owner === p ? 150 : 165;
  if (p.stun > 0) speed *= 0.4;
  const wantVx = len ? dx / len * speed : 0;
  const wantVy = len ? dy / len * speed : 0;
  p.vx += (wantVx - p.vx) * Math.min(1, dt * 10);
  p.vy += (wantVy - p.vy) * Math.min(1, dt * 10);
  if (len) p.facing = Math.atan2(dy, dx);

  // Remate: segura para carregar a força, larga para rematar
  if (pressed.has(k.shoot)) { charging[t] = true; charge[t] = 0; }
  if (charging[t]) charge[t] = Math.min(1, charge[t] + dt / 0.9);
  if (released.has(k.shoot) && charging[t]) {
    if (canTouchBall(p)) shoot(p, charge[t]);
    charging[t] = false; charge[t] = 0;
  }
  if (pressed.has(k.pass) && canTouchBall(p)) pass(p);
  if (pressed.has(k.switch)) switchPlayer(t);
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
  if (owner && owner.team !== p.team && dist(p, owner) < PLAYER_R * 2 + 2) {
    const porTras = angDiff(p.slideDir, owner.facing) < 1.0;
    const tocaBola = dist(p, ball) < PLAYER_R + BALL_R + 6;
    p.slideDone = true;
    if (porTras || !tocaBola) return foul(p, owner, porTras);
    // Carrinho limpo: a bola sai disparada
    owner.stun = 0.6; owner.holdTime = 0;
    kick(p, p.slideDir + (Math.random() - 0.5) * 0.6, 230);
    return;
  }
  // Bola solta: o carrinho afasta a bola
  if (!owner && dist(p, ball) < PLAYER_R + BALL_R + 6) {
    p.slideDone = true;
    kick(p, p.slideDir + (Math.random() - 0.5) * 0.4, 260);
  }
}

function foul(culpado, vitima, porTras) {
  let cartao = null;
  if (porTras || Math.random() < 0.15) {
    culpado.amarelos++;
    cartao = culpado.amarelos >= 2 ? 'vermelho' : 'amarelo';
    if (cartao === 'vermelho') culpado.expulso = true;
  }
  const team = vitima.team;
  const tipo = inPenaltyBox(culpado.team, vitima.x, vitima.y) ? 'penalti' : 'livre';
  let x = clamp(vitima.x, 20, W - 20), y = clamp(vitima.y, 20, H - 20);
  if (tipo === 'penalti') { x = culpado.team === 0 ? 110 : W - 110; y = H / 2; }
  const eq = EQUIPAS[culpado.team].nome;
  const sub = cartao === 'vermelho' ? `CARTÃO VERMELHO! #${culpado.num} ${eq} expulso`
    : cartao === 'amarelo' ? `Cartão amarelo para #${culpado.num} ${eq}` : `Falta de #${culpado.num} ${eq}`;
  startSetPiece(tipo, team, x, y, 'FALTA! ' + NOMES_PARADA[tipo], sub, cartao);
}

// ---------- Bolas paradas ----------
function startSetPiece(tipo, team, x, y, texto, sub, cartao) {
  ball.owner = null;
  ball.vx = ball.vy = 0;
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

  ball.x = sp.x; ball.y = sp.y; ball.vx = ball.vy = 0;
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
  } else {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    const f = Math.pow(0.42, dt);   // atrito da relva
    ball.vx *= f; ball.vy *= f;
  }

  // A bola só sai quando passa toda a linha
  if (ball.owner) {
    // Quem tem a bola não a pode levar para fora
    ball.y = clamp(ball.y, 1, H - 1);
    ball.x = clamp(ball.x, 1, W - 1);
    return;
  }
  const inMouth = Math.abs(ball.y - H / 2) < GOAL_W / 2 - BALL_R;
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

    if (p.gk && !ball.owner && d < PLAYER_R + 30 && p.gkShot !== shotId) {
      // Regra do Guilherme: o GR defende se o remate não for potente nem colocado
      p.gkShot = shotId;
      let chance;
      if (ballSpeed < 350) chance = 1;
      else if (ball.potente && ball.colocado) chance = 0.1;
      else if (ball.potente || ball.colocado) chance = 0.35;
      else chance = 0.95;
      const r = Math.random();
      if (r < chance) { ball.owner = p; p.holdTime = 0; }
      else if (r < chance + 0.2 && d < PLAYER_R + 12) {
        // Toca na bola mas não a agarra
        ball.vx *= -0.3; ball.vy = (Math.random() - 0.5) * 350; ball.lastTouch = p;
      }
      continue;
    }

    if (!ball.owner && d < PLAYER_R + BALL_R + 4 && ballSpeed < 520) {
      ball.owner = p; p.holdTime = 0; ball.lastTouch = p;
    } else if (ball.owner && ball.owner.team !== p.team && !ball.owner.gk &&
               d < PLAYER_R + BALL_R + 3 && ball.owner.holdTime > 0.35) {
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
  score[team]++;
  lastScorer = team;
  kickoffTeam = 1 - team;
  ball.owner = null;
  state = score[team] >= GOLS_PARA_GANHAR ? 'fim' : 'golo';
  stateTimer = 2.5;
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

// ---------- Desenho ----------
const canvas = document.getElementById('jogo');
const ctx = canvas.getContext('2d');
let zoom = 1, viewW = W, viewH = H;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
}
addEventListener('resize', resize);
resize();

function updateCamera(dt) {
  zoom = Math.min(canvas.height / 470, canvas.width / 720);
  viewW = canvas.width / zoom;
  viewH = canvas.height / zoom;
  const tx = clamp(ball.x, viewW / 2 - 80, W - viewW / 2 + 80);
  const ty = clamp(ball.y, viewH / 2 - 60, H - viewH / 2 + 60);
  cam.x += ((viewW > W + 160 ? W / 2 : tx) - cam.x) * Math.min(1, dt * 4);
  cam.y += ((viewH > H + 120 ? H / 2 : ty) - cam.y) * Math.min(1, dt * 4);
}

function drawField() {
  // Relva com riscas
  const stripe = 80;
  for (let x = -200; x < W + 200; x += stripe) {
    ctx.fillStyle = (Math.floor(x / stripe) % 2 === 0) ? '#2f8f3a' : '#34a043';
    ctx.fillRect(x, -200, stripe, H + 400);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, W, H);
  // Linha do meio e círculo central
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 70, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 4, 0, Math.PI * 2); ctx.fill();
  for (const side of [0, 1]) {
    const x0 = side === 0 ? 0 : W;
    const d = side === 0 ? 1 : -1;
    // Grande área, pequena área, marca de penálti, meia-lua
    ctx.strokeRect(Math.min(x0, x0 + d * 160), H / 2 - 190, 160, 380);
    ctx.strokeRect(Math.min(x0, x0 + d * 55), H / 2 - 90, 55, 180);
    ctx.beginPath(); ctx.arc(x0 + d * 110, H / 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.arc(x0 + d * 110, H / 2, 70, side === 0 ? -0.775 : Math.PI - 0.775, side === 0 ? 0.775 : Math.PI + 0.775);
    ctx.stroke();
    // Balizas com rede
    const gx = side === 0 ? -GOAL_D : W;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(gx, H / 2 - GOAL_W / 2, GOAL_D, GOAL_W);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    for (let i = 6; i < GOAL_D; i += 7) {
      ctx.beginPath(); ctx.moveTo(gx + i, H / 2 - GOAL_W / 2); ctx.lineTo(gx + i, H / 2 + GOAL_W / 2); ctx.stroke();
    }
    for (let j = 7; j < GOAL_W; j += 7) {
      ctx.beginPath(); ctx.moveTo(gx, H / 2 - GOAL_W / 2 + j); ctx.lineTo(gx + GOAL_D, H / 2 - GOAL_W / 2 + j); ctx.stroke();
    }
    ctx.restore();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(gx, H / 2 - GOAL_W / 2, GOAL_D, GOAL_W);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.fillStyle = '#fff';
  }
  // Cantos
  for (const [cx, cy, a0] of [[0, 0, 0], [W, 0, Math.PI / 2], [W, H, Math.PI], [0, H, -Math.PI / 2]]) {
    ctx.beginPath(); ctx.arc(cx, cy, 12, a0, a0 + Math.PI / 2); ctx.stroke();
  }
}

function drawPlayer(p) {
  const eq = EQUIPAS[p.team];
  const ht = human.indexOf(p);
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + 4, PLAYER_R + 1, PLAYER_R - 2, 0, 0, Math.PI * 2); ctx.fill();
  // Marcador do jogador controlado
  if (ht >= 0) {
    ctx.strokeStyle = ht === 0 ? '#ffd60a' : '#4cc9f0';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, PLAYER_R + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = ht === 0 ? '#ffd60a' : '#4cc9f0';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ht === 0 ? 'J1' : 'J2', p.x, p.y - PLAYER_R - 12);
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.facing);
  const noChao = p.slide > 0 || p.chao > 0;
  if (noChao) {
    // Pernas esticadas no carrinho
    ctx.fillStyle = eq.calcoes;
    ctx.fillRect(2, -5, 14, 10);
    ctx.fillStyle = '#111';
    ctx.fillRect(14, -5, 5, 4); ctx.fillRect(14, 1, 5, 4);
  }
  // Ombros / camisola
  ctx.fillStyle = p.gk ? eq.gr : eq.camisola;
  ctx.beginPath(); ctx.ellipse(noChao ? -4 : 0, 0, noChao ? PLAYER_R + 2 : PLAYER_R - 3, PLAYER_R, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Cabeça
  ctx.fillStyle = '#e0ac69';
  ctx.beginPath(); ctx.arc(1, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3b2412';
  ctx.beginPath(); ctx.arc(-0.5, 0, 4.5, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
  ctx.restore();
  // Número
  ctx.fillStyle = eq.numero;
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.num, p.x, p.y + PLAYER_R + 10);
  if (p.amarelos > 0) {
    ctx.fillStyle = '#ffd60a';
    ctx.fillRect(p.x + 7, p.y + PLAYER_R + 2, 5, 7);
  }
  // Barra de força do remate
  if (ht >= 0 && charging[ht]) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(p.x - 18, p.y + PLAYER_R + 14, 36, 6);
    ctx.fillStyle = charge[ht] > 0.85 ? '#ef233c' : '#ffd60a';
    ctx.fillRect(p.x - 17, p.y + PLAYER_R + 15, 34 * charge[ht], 4);
  }
}

function drawAimArrow() {
  if (state !== 'parada' || !setPiece || !setPiece.taker) return;
  const p = setPiece.taker;
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(p.facing);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(70, 0); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(78, 0); ctx.lineTo(68, -6); ctx.lineTo(68, 6); ctx.fill();
  ctx.restore();
}

function drawBall() {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(ball.x + 2, ball.y + 3, BALL_R, BALL_R - 1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(ball.x - 1, ball.y - 1, 1.8, 0, Math.PI * 2); ctx.fill();
}

// Seta na borda do ecrã quando o jogador controlado não aparece
function drawOffscreenArrows() {
  for (let t = 0; t < 2; t++) {
    const p = human[t];
    if (!p) continue;
    const sx = (p.x - cam.x) * zoom + canvas.width / 2;
    const sy = (p.y - cam.y) * zoom + canvas.height / 2;
    const m = 30 * (window.devicePixelRatio || 1);
    if (sx > 0 && sx < canvas.width && sy > 0 && sy < canvas.height) continue;
    const x = clamp(sx, m, canvas.width - m), y = clamp(sy, m, canvas.height - m);
    const a = Math.atan2(sy - y, sx - x);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = t === 0 ? '#ffd60a' : '#4cc9f0';
    ctx.beginPath(); ctx.moveTo(m * 0.7, 0); ctx.lineTo(-m * 0.4, -m * 0.5); ctx.lineTo(-m * 0.4, m * 0.5); ctx.fill();
    ctx.restore();
  }
}

function drawMinimap(s) {
  const mw = 180 * s, mh = mw * H / W;
  const x0 = canvas.width / 2 - mw / 2, y0 = canvas.height - mh - 12 * s;
  ctx.fillStyle = 'rgba(20,80,30,0.8)';
  ctx.fillRect(x0, y0, mw, mh);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, mw, mh);
  ctx.beginPath(); ctx.moveTo(x0 + mw / 2, y0); ctx.lineTo(x0 + mw / 2, y0 + mh); ctx.stroke();
  for (const p of players) {
    const ht = human.indexOf(p);
    ctx.fillStyle = ht === 0 ? '#ffd60a' : ht === 1 ? '#4cc9f0' : EQUIPAS[p.team].camisola;
    ctx.beginPath(); ctx.arc(x0 + p.x / W * mw, y0 + p.y / H * mh, (ht >= 0 ? 3.5 : 2.5) * s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x0 + clamp(ball.x, 0, W) / W * mw, y0 + ball.y / H * mh, 2 * s, 0, Math.PI * 2); ctx.fill();
}

function drawHUD() {
  const s = window.devicePixelRatio || 1;
  // Placar
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(10,15,30,0.85)';
  const sw = 360 * s, sh = 40 * s;
  ctx.fillRect(canvas.width / 2 - sw / 2, 10 * s, sw, sh);
  ctx.fillStyle = EQUIPAS[0].camisola;
  ctx.fillRect(canvas.width / 2 - sw / 2, 10 * s, 8 * s, sh);
  ctx.fillStyle = EQUIPAS[1].camisola;
  ctx.fillRect(canvas.width / 2 + sw / 2 - 8 * s, 10 * s, 8 * s, sh);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${18 * s}px sans-serif`;
  ctx.fillText(`${EQUIPAS[0].nome}  ${score[0]} - ${score[1]}  ${EQUIPAS[1].nome}`, canvas.width / 2, 36 * s);
  ctx.font = `${12 * s}px sans-serif`;
  ctx.fillStyle = '#ccc';
  ctx.fillText(`Primeiro a ${GOLS_PARA_GANHAR} golos ganha`, canvas.width / 2, 66 * s);

  // Painel do jogador selecionado (em baixo)
  for (let t = 0; t < 2; t++) {
    const p = human[t];
    if (!p) continue;
    const bw = 230 * s, bh = 46 * s;
    const x = t === 0 ? 12 * s : canvas.width - bw - 12 * s;
    const y = canvas.height - bh - 12 * s;
    ctx.fillStyle = 'rgba(10,15,30,0.85)';
    ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = t === 0 ? '#ffd60a' : '#4cc9f0';
    ctx.fillRect(x, y, 6 * s, bh);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${15 * s}px sans-serif`;
    ctx.fillText(`J${t + 1}  #${p.num}  ${p.pos}`, x + 16 * s, y + 20 * s);
    ctx.fillStyle = '#9aa';
    ctx.font = `${12 * s}px sans-serif`;
    ctx.fillText('PlayStyle: (chega na fase 4)', x + 16 * s, y + 38 * s);
  }
  drawMinimap(s);

  if (aviso) {
    const aw = 520 * s, ah = 62 * s, ay = 80 * s;
    ctx.fillStyle = 'rgba(10,15,30,0.9)';
    ctx.fillRect(canvas.width / 2 - aw / 2, ay, aw, ah);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${22 * s}px sans-serif`;
    ctx.fillText(aviso.texto, canvas.width / 2, ay + 26 * s);
    ctx.font = `${15 * s}px sans-serif`;
    ctx.fillStyle = '#ccc';
    ctx.fillText(aviso.sub, canvas.width / 2, ay + 50 * s);
    if (aviso.cartao) {
      ctx.fillStyle = aviso.cartao === 'vermelho' ? '#ef233c' : '#ffd60a';
      ctx.save();
      ctx.translate(canvas.width / 2 - aw / 2 + 36 * s, ay + ah / 2);
      ctx.rotate(-0.2);
      ctx.fillRect(-11 * s, -16 * s, 22 * s, 32 * s);
      ctx.restore();
    }
  }
  if (state === 'parada' && setPiece && setPiece.taker && !setPiece.taker.gk) {
    const t = setPiece.team;
    const k = t === 0 ? 'W A S D para apontar · G passar · F rematar' : 'setas para apontar · Shift dir. passar · Enter rematar';
    ctx.textAlign = 'center';
    ctx.font = `${14 * s}px sans-serif`;
    ctx.fillStyle = t === 0 ? '#ffd60a' : '#4cc9f0';
    ctx.fillText(`J${t + 1}: ${k}`, canvas.width / 2, canvas.height - 150 * s);
  }
}

function centerText(lines, s) {
  ctx.textAlign = 'center';
  let y = canvas.height / 2 - (lines.length - 1) * 22 * s;
  for (const [text, size, color] of lines) {
    ctx.font = `bold ${size * s}px sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(text, canvas.width / 2 + 3 * s, y + 3 * s);
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width / 2, y);
    y += size * 1.3 * s;
  }
}

function drawTitle() {
  const s = window.devicePixelRatio || 1;
  ctx.fillStyle = '#0b1d10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${72 * s}px sans-serif`;
  ctx.fillText('FUTEBOL 26', canvas.width / 2, canvas.height * 0.25);
  ctx.font = `${16 * s}px sans-serif`;
  ctx.fillStyle = '#8fd694';
  ctx.fillText('2 jogadores · 5 contra 5 · primeiro a ' + GOLS_PARA_GANHAR + ' golos', canvas.width / 2, canvas.height * 0.25 + 36 * s);

  const rows = [
    ['', 'J1 (VERMELHOS)', 'J2 (AZUIS)'],
    ['Andar', 'W A S D', 'Setas'],
    ['Rematar (segurar = força)', 'F', 'Enter'],
    ['Passar', 'G', 'Shift direito'],
    ['Carrinho', 'Q', '. (ponto)'],
    ['Mudar de jogador', 'R', '/'],
  ];
  const cols = [-200, 30, 200];
  let y = canvas.height * 0.45;
  rows.forEach((r, i) => {
    r.forEach((c, j) => {
      ctx.font = `${i === 0 ? 'bold ' : ''}${16 * s}px sans-serif`;
      ctx.fillStyle = i === 0 ? (j === 1 ? '#ffd60a' : '#4cc9f0') : (j === 0 ? '#bbb' : '#fff');
      ctx.textAlign = j === 0 ? 'left' : 'center';
      ctx.fillText(c, canvas.width / 2 + (cols[j] - (j === 0 ? 80 : 0)) * s, y);
    });
    y += 30 * s;
  });
  if (Math.floor(performance.now() / 500) % 2 === 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd60a';
    ctx.font = `bold ${22 * s}px sans-serif`;
    ctx.fillText('Carrega ESPAÇO para começar', canvas.width / 2, canvas.height * 0.85);
  }
}

function draw() {
  if (state === 'titulo') return drawTitle();
  ctx.fillStyle = '#1f5f28';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cam.x, -cam.y);
  drawField();
  const sorted = [...players].sort((a, b) => a.y - b.y);
  for (const p of sorted) drawPlayer(p);
  drawBall();
  drawAimArrow();
  ctx.restore();
  drawOffscreenArrows();
  drawHUD();

  const s = window.devicePixelRatio || 1;
  if (state === 'inicio') centerText([['PRONTOS?', 48, '#fff']], s);
  if (state === 'golo') centerText([['GOLO!', 96, '#ffd60a'], [EQUIPAS[lastScorer].nome, 32, '#fff']], s);
  if (state === 'fim') {
    const lines = [[`${EQUIPAS[lastScorer].nome} GANHAM!`, 64, '#ffd60a'], [`${score[0]} - ${score[1]}`, 40, '#fff']];
    if (stateTimer < 0) lines.push(['Carrega ESPAÇO para voltar ao início', 20, '#ccc']);
    centerText(lines, s);
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  if (ball) updateCamera(dt);
  draw();
  pressed.clear();
  released.clear();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
