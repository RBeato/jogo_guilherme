// Futebol 26 — placar, painéis e textos desenhados por cima do 3D

const Hud = (() => {
  const canvas = document.getElementById('hud');
  const ctx = canvas.getContext('2d');
  const COR_J = ['#ffd60a', '#4cc9f0'];
  let s = 1;   // escala (pixels do ecrã)

  function redimensionar() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    s = dpr * Math.min(1.25, Math.max(0.7, innerHeight / 760));
  }
  addEventListener('resize', redimensionar);
  redimensionar();

  function caixa(x, y, w, h, cor, raio = 6) {
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, raio * s);
    ctx.fill();
  }

  function texto(t, x, y, tam, cor, alinhar = 'left', peso = 'bold') {
    ctx.font = `${peso} ${tam * s}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = alinhar;
    ctx.fillStyle = cor;
    ctx.fillText(t, x, y);
  }

  // ---------- Emblemas dourados dos PlayStyles ----------
  function iconePS(nome, cx, cy, r) {
    // Fundo dourado em forma de octógono (como os PlayStyle+ do FC)
    const ouro = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    ouro.addColorStop(0, '#fff1a8');
    ouro.addColorStop(0.45, '#e6b422');
    ouro.addColorStop(1, '#8a5a00');
    ctx.save();
    ctx.shadowColor = 'rgba(255,200,40,0.7)';
    ctx.shadowBlur = 12 * s;
    ctx.fillStyle = ouro;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + i * Math.PI / 4;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#fff6c8';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    // Desenho de dentro
    const k = r / 20;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    ctx.fillStyle = '#2b1d00';
    ctx.strokeStyle = '#2b1d00';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    switch (nome) {
      case 'Rápido':   // raio
        ctx.moveTo(3, -13); ctx.lineTo(-7, 2); ctx.lineTo(0, 2); ctx.lineTo(-3, 13);
        ctx.lineTo(8, -3); ctx.lineTo(1, -3); ctx.closePath(); ctx.fill();
        break;
      case 'Remate Potente':   // bola com rasto de fogo
        ctx.arc(5, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-3, -5); ctx.lineTo(-13, -8); ctx.moveTo(-3, 0); ctx.lineTo(-15, 0);
        ctx.moveTo(-3, 5); ctx.lineTo(-13, 8); ctx.stroke();
        break;
      case 'Remate Colocado':   // alvo com seta em curva
        ctx.arc(5, 3, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(5, 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-13, 10); ctx.quadraticCurveTo(-12, -12, 3, -10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(-1, -14); ctx.lineTo(-1, -6); ctx.closePath(); ctx.fill();
        break;
      case 'Passe Incisivo':   // seta comprida a atravessar
        ctx.moveTo(-13, 6); ctx.lineTo(8, -5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(13, -8); ctx.lineTo(3, -9); ctx.lineTo(8, 0); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(-10, -6, 2.5, 0, Math.PI * 2); ctx.arc(-2, 10, 2.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'Muralha':   // escudo
        ctx.moveTo(0, -13); ctx.lineTo(11, -8); ctx.lineTo(9, 5); ctx.lineTo(0, 13);
        ctx.lineTo(-9, 5); ctx.lineTo(-11, -8); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#e6b422'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
        break;
      case 'Carrinho':   // bota a deslizar
        ctx.moveTo(-12, 11); ctx.lineTo(13, 11); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, 7); ctx.lineTo(4, -6); ctx.lineTo(9, -2); ctx.lineTo(4, 7); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-13, -2); ctx.lineTo(-6, -2); ctx.moveTo(-13, 3); ctx.lineTo(-9, 3); ctx.stroke();
        break;
      case 'Intercetor':   // seta parada por uma barreira
        ctx.moveTo(-13, 0); ctx.lineTo(2, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-2, -6); ctx.lineTo(-2, 6); ctx.closePath(); ctx.fill();
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(9, -12); ctx.lineTo(9, 12); ctx.stroke();
        break;
      case 'Reflexos':   // luva
        ctx.roundRect(-8, -2, 16, 14, 4); ctx.fill();
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.roundRect(-8 + i * 4.2, -13, 3.4, 12, 1.7); ctx.fill(); }
        break;
      default:
        ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- Placar (em cima à esquerda, estilo TV) ----------
  function placar() {
    const x = 16 * s, y = 14 * s, h = 34 * s;
    const eq = EQUIPAS;
    caixa(x, y, 250 * s, h, 'rgba(8,12,28,0.92)');
    ctx.fillStyle = eq[0].camisola; ctx.fillRect(x + 6 * s, y + 7 * s, 5 * s, h - 14 * s);
    texto(eq[0].curto, x + 18 * s, y + 23 * s, 17, '#fff');
    caixa(x + 82 * s, y + 4 * s, 86 * s, h - 8 * s, '#f5f5f5', 4);
    texto(`${score[0]} - ${score[1]}`, x + 125 * s, y + 23 * s, 18, '#0b1020', 'center');
    texto(eq[1].curto, x + 182 * s, y + 23 * s, 17, '#fff');
    ctx.fillStyle = eq[1].camisola; ctx.fillRect(x + 238 * s, y + 7 * s, 5 * s, h - 14 * s);
    caixa(x, y + h + 3 * s, 250 * s, 20 * s, 'rgba(8,12,28,0.75)');
    texto(`Primeiro a ${GOLS_PARA_GANHAR} golos ganha`, x + 125 * s, y + h + 17 * s, 12, '#c8d0e0', 'center', '600');
  }

  // ---------- Painel do jogador selecionado (em baixo) ----------
  function painelJogador(t) {
    const p = human[t];
    if (!p) return;
    const w = 330 * s, h = 64 * s;
    const x = t === 0 ? 16 * s : canvas.width - w - 16 * s;
    const y = canvas.height - h - 16 * s;
    caixa(x, y, w, h, 'rgba(8,12,28,0.9)', 8);
    ctx.fillStyle = COR_J[t];
    ctx.fillRect(x, y, 7 * s, h);
    // Número e etiqueta J1/J2
    texto(`J${t + 1}`, x + 18 * s, y + 22 * s, 13, COR_J[t]);
    texto(`${p.num}`, x + 18 * s, y + 50 * s, 24, '#fff', 'left', '900');
    // Nome em destaque
    ctx.save();
    ctx.shadowColor = COR_J[t];
    ctx.shadowBlur = 10 * s;
    texto(p.nome.toUpperCase(), x + 62 * s, y + 30 * s, 19, '#ffffff', 'left', '900');
    ctx.restore();
    texto(p.pos, x + 62 * s, y + 50 * s, 12, '#9aa6bf', 'left', '600');
    // PlayStyle dourado a seguir ao nome
    ctx.font = `900 ${19 * s}px "Segoe UI", system-ui, sans-serif`;
    const fimNome = x + 62 * s + ctx.measureText(p.nome.toUpperCase()).width;
    const ix = Math.min(fimNome + 26 * s, x + w - 24 * s);
    iconePS(p.ps, ix, y + 24 * s, 15 * s);
    texto(p.ps, ix, y + 54 * s, 11, '#f4c542', 'center', '700');
  }

  function minimapa() {
    const mw = 190 * s, mh = mw * H / W;
    const x0 = canvas.width / 2 - mw / 2, y0 = canvas.height - mh - 16 * s;
    caixa(x0 - 3 * s, y0 - 3 * s, mw + 6 * s, mh + 6 * s, 'rgba(8,12,28,0.75)', 4);
    ctx.fillStyle = 'rgba(40,120,50,0.85)';
    ctx.fillRect(x0, y0, mw, mh);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, y0, mw, mh);
    ctx.beginPath(); ctx.moveTo(x0 + mw / 2, y0); ctx.lineTo(x0 + mw / 2, y0 + mh); ctx.stroke();
    for (const p of players) {
      const ht = human.indexOf(p);
      ctx.fillStyle = ht >= 0 ? COR_J[ht] : EQUIPAS[p.team].camisola;
      ctx.beginPath();
      ctx.arc(x0 + clamp(p.x, 0, W) / W * mw, y0 + clamp(p.y, 0, H) / H * mh, (ht >= 0 ? 4 : 3) * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x0 + clamp(ball.x, 0, W) / W * mw, y0 + clamp(ball.y, 0, H) / H * mh, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Etiqueta J1/J2 por cima da cabeça, barra de força, e setas se estiver fora do ecrã
  function etiquetas() {
    for (let t = 0; t < 2; t++) {
      const p = human[t];
      if (!p || state === 'golo' || state === 'fim') continue;
      const c = Render.noEcra(p.x, p.y, 36, canvas.width, canvas.height);
      if (c.visivel) {
        texto(`J${t + 1}`, c.x, c.y, 14, COR_J[t], 'center', '900');
        if (charging[t]) {
          const pe = Render.noEcra(p.x, p.y, 0, canvas.width, canvas.height);
          const bw = 46 * s, bh = 8 * s;
          caixa(pe.x - bw / 2, pe.y + 12 * s, bw, bh, 'rgba(0,0,0,0.7)', 3);
          ctx.fillStyle = charge[t] > 0.7 ? '#ef233c' : '#ffd60a';
          ctx.fillRect(pe.x - bw / 2 + 2 * s, pe.y + 14 * s, (bw - 4 * s) * charge[t], bh - 4 * s);
        }
      } else {
        // Seta na borda a apontar para onde ele está
        const m = 34 * s;
        const x = clamp(c.x, m, canvas.width - m), y = clamp(c.y, m + 70 * s, canvas.height - m - 90 * s);
        const a = Math.atan2(c.y - y, c.x - x);
        ctx.save();
        ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = COR_J[t];
        ctx.beginPath(); ctx.moveTo(m * 0.6, 0); ctx.lineTo(-m * 0.4, -m * 0.45); ctx.lineTo(-m * 0.4, m * 0.45); ctx.fill();
        ctx.restore();
      }
    }
  }

  function aviso_() {
    if (!aviso) return;
    const aw = 560 * s, ah = 66 * s, ay = 90 * s, ax = canvas.width / 2 - aw / 2;
    caixa(ax, ay, aw, ah, 'rgba(8,12,28,0.92)', 8);
    texto(aviso.texto, canvas.width / 2, ay + 28 * s, 23, '#fff', 'center', '900');
    texto(aviso.sub, canvas.width / 2, ay + 52 * s, 15, '#c8d0e0', 'center', '600');
    if (aviso.cartao) {
      ctx.save();
      ctx.translate(ax + 38 * s, ay + ah / 2);
      ctx.rotate(-0.2);
      ctx.fillStyle = aviso.cartao === 'vermelho' ? '#ef233c' : '#ffd60a';
      ctx.fillRect(-12 * s, -18 * s, 24 * s, 36 * s);
      ctx.restore();
    }
  }

  function dicaBolaParada() {
    if (state !== 'parada' || !setPiece || !setPiece.taker || setPiece.taker.gk) return;
    const t = setPiece.team;
    const k = t === 0 ? 'W A S D apontar · F passar · G rematar' : 'Setas apontar · K passar · L rematar';
    caixa(canvas.width / 2 - 200 * s, canvas.height - 190 * s, 400 * s, 30 * s, 'rgba(8,12,28,0.8)', 6);
    texto(`J${t + 1}: ${k}`, canvas.width / 2, canvas.height - 170 * s, 14, COR_J[t], 'center', '700');
  }

  function textoGrande(linhas) {
    let y = canvas.height * 0.42;
    for (const [t, tam, cor] of linhas) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 16 * s;
      texto(t, canvas.width / 2, y, tam, cor, 'center', '900');
      ctx.restore();
      y += tam * 1.25 * s;
    }
  }

  // ---------- Ecrã inicial ----------
  function tecla(x, y, t, cor) {
    ctx.font = `800 ${15 * s}px "Segoe UI", system-ui, sans-serif`;
    const w = Math.max(34 * s, ctx.measureText(t).width + 18 * s);
    caixa(x, y, w, 32 * s, '#f1f3f8', 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, y + 28 * s, w, 4 * s);
    texto(t, x + w / 2, y + 22 * s, 15, cor || '#111', 'center', '800');
    return w;
  }

  function cartaoControlos(x, y, t) {
    const w = 360 * s, h = 210 * s;
    caixa(x, y, w, h, 'rgba(8,12,28,0.85)', 12);
    ctx.fillStyle = COR_J[t]; ctx.fillRect(x, y, w, 6 * s);
    texto(`JOGADOR ${t + 1} · ${EQUIPAS[t].nome}`, x + 20 * s, y + 36 * s, 18, COR_J[t], 'left', '900');
    const k = TECLAS[t];
    const nome = c => c.replace('Key', '').replace('Arrow', '').replace('Up', '↑').replace('Down', '↓').replace('Left', '←').replace('Right', '→');
    let cx = x + 20 * s;
    for (const c of [k.up, k.left, k.down, k.right]) cx += tecla(cx, y + 56 * s, nome(c)) + 6 * s;
    texto('andar', cx + 6 * s, y + 78 * s, 14, '#c8d0e0', 'left', '600');
    tecla(x + 20 * s, y + 104 * s, nome(k.b1), '#111');
    texto('com bola: passar', x + 66 * s, y + 118 * s, 14, '#fff', 'left', '700');
    texto('sem bola: mudar de jogador', x + 66 * s, y + 136 * s, 13, '#9aa6bf', 'left', '600');
    tecla(x + 20 * s, y + 156 * s, nome(k.b2), '#111');
    texto('com bola: rematar (segura = força)', x + 66 * s, y + 170 * s, 14, '#fff', 'left', '700');
    texto('sem bola: carrinho', x + 66 * s, y + 188 * s, 13, '#9aa6bf', 'left', '600');
  }

  function titulo() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, 'rgba(5,10,28,0.75)');
    g.addColorStop(0.5, 'rgba(5,10,28,0.35)');
    g.addColorStop(1, 'rgba(5,10,28,0.8)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 24 * s;
    texto('FUTEBOL 26', canvas.width / 2, canvas.height * 0.2, 84, '#ffffff', 'center', '900');
    ctx.restore();
    texto(`${EQUIPAS[0].nome}  vs  ${EQUIPAS[1].nome}  ·  2 jogadores  ·  primeiro a ${GOLS_PARA_GANHAR} golos`,
      canvas.width / 2, canvas.height * 0.2 + 42 * s, 17, '#9fe0a6', 'center', '700');
    const y = canvas.height * 0.38;
    cartaoControlos(canvas.width / 2 - 380 * s, y, 0);
    cartaoControlos(canvas.width / 2 + 20 * s, y, 1);
    if (Math.floor(performance.now() / 500) % 2 === 0) {
      texto('Carrega ESPAÇO para começar', canvas.width / 2, canvas.height * 0.85, 24, '#ffd60a', 'center', '900');
    }
  }

  function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state === 'titulo' || !ball) return titulo();
    if (state === 'replay') {
      placar();
      // Letreiro de repetição, como na TV
      const piscar = Math.floor(performance.now() / 600) % 2 === 0;
      caixa(canvas.width - 250 * s, 16 * s, 234 * s, 40 * s, 'rgba(8,12,28,0.9)', 6);
      ctx.fillStyle = piscar ? '#ef233c' : '#7a1020';
      ctx.beginPath(); ctx.arc(canvas.width - 228 * s, 36 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
      texto('REPETIÇÃO', canvas.width - 210 * s, 44 * s, 22, '#fff', 'left', '900');
      texto(`${marcador}`, canvas.width / 2, canvas.height - 60 * s, 26, '#ffd60a', 'center', '900');
      texto('ESPAÇO para saltar', canvas.width / 2, canvas.height - 30 * s, 14, '#c8d0e0', 'center', '600');
      return;
    }
    etiquetas();
    placar();
    aviso_();
    painelJogador(0);
    painelJogador(1);
    minimapa();
    dicaBolaParada();
    if (state === 'inicio') textoGrande([['PRONTOS?', 52, '#fff']]);
    if (state === 'golo') textoGrande([['GOLO!', 110, '#ffd60a'], [marcador, 30, '#fff'], [EQUIPAS[lastScorer].nome, 20, '#c8d0e0']]);
    if (state === 'fim') {
      const l = [[`${EQUIPAS[lastScorer].nome} GANHA!`, 66, '#ffd60a'], [`${score[0]} - ${score[1]}`, 44, '#fff']];
      if (stateTimer < 0) l.push(['Carrega ESPAÇO para voltar ao início', 20, '#c8d0e0']);
      textoGrande(l);
    }
  }

  return { desenhar };
})();
