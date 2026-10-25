// Futebol 26 — placar, painéis e textos desenhados por cima do 3D

const Hud = (() => {
  const canvas = document.getElementById('hud');
  const ctx = canvas.getContext('2d');
  const COR_J = ['#ff3b3b', '#4cc9f0'];   // J1 vermelho, J2 azul
  const etiqueta = t => (eCPU(t) ? 'CPU' : `J${t + 1}`);
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

  function texto(t, x, y, tam, cor, alinhar = 'left', peso = 'bold', largura) {
    ctx.font = `${peso} ${tam * s}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = alinhar;
    ctx.fillStyle = cor;
    if (largura) ctx.fillText(t, x, y, largura); else ctx.fillText(t, x, y);
  }

  // ---------- Emblemas dourados dos PlayStyles ----------
  // Nome oficial do PlayStyle no FC (em inglês, como aparece no jogo)
  const nomeFC = nome => (PLAYSTYLES_FC[nome] ? PLAYSTYLES_FC[nome].en : nome);

  function iconePS(nome, cx, cy, r, plus = true) {
    // Estilo FC: losango de cantos arredondados, escuro por dentro, desenho em linhas finas.
    // PlayStyle+: contorno e desenho dourados com brilho; PlayStyle normal: contorno cinzento, desenho branco.
    // Forma de diamante de joia: em cima plano e largo, em baixo acaba em bico
    const losango = (raio) => {
      ctx.beginPath();
      ctx.moveTo(cx - raio * 0.5, cy - raio * 0.78);
      ctx.lineTo(cx + raio * 0.5, cy - raio * 0.78);
      ctx.lineTo(cx + raio * 1.0, cy - raio * 0.3);
      ctx.lineTo(cx, cy + raio * 1.0);
      ctx.lineTo(cx - raio * 1.0, cy - raio * 0.3);
      ctx.closePath();
    };
    const aro = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    if (plus) {
      aro.addColorStop(0, '#8a5d05'); aro.addColorStop(0.5, '#5e3f02'); aro.addColorStop(1, '#a8740a');
    } else {
      aro.addColorStop(0, '#6b7486'); aro.addColorStop(0.5, '#454d5c'); aro.addColorStop(1, '#7c8597');
    }
    // Por dentro: metal (dourado nos PlayStyle+, prateado nos normais), mais claro em cima
    const fundo = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    if (plus) { fundo.addColorStop(0, '#fff2b8'); fundo.addColorStop(0.45, '#f0c445'); fundo.addColorStop(1, '#b07e12'); }
    else { fundo.addColorStop(0, '#ffffff'); fundo.addColorStop(0.45, '#d5dbe4'); fundo.addColorStop(1, '#8e98a8'); }
    ctx.save();
    ctx.shadowColor = plus ? 'rgba(255,196,40,0.75)' : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = (plus ? 10 : 4) * s;
    losango(r);
    ctx.fillStyle = aro;
    ctx.fill();
    ctx.restore();
    losango(r * (plus ? 0.84 : 0.88));
    ctx.fillStyle = fundo;
    ctx.fill();
    // Brilho em cima (como metal polido)
    ctx.save();
    losango(r * (plus ? 0.84 : 0.88));
    ctx.clip();
    const brilho = ctx.createLinearGradient(cx, cy - r, cx, cy);
    brilho.addColorStop(0, 'rgba(255,255,255,0.35)');
    brilho.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = brilho;
    ctx.fillRect(cx - r, cy - r, r * 2, r);
    ctx.restore();

    // Faces do diamante (riscas finas a brilhar)
    ctx.save();
    losango(r * (plus ? 0.84 : 0.88));
    ctx.clip();
    ctx.strokeStyle = plus ? 'rgba(120,80,0,0.25)' : 'rgba(60,70,90,0.2)';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r * 0.3); ctx.lineTo(cx + r, cy - r * 0.3);
    for (const [x0, x1] of [[-0.5, -0.25], [0.5, 0.25], [-0.5, -0.75], [0.5, 0.75]]) {
      ctx.moveTo(cx + r * x0, cy - r * 0.78); ctx.lineTo(cx + r * x1, cy - r * 0.3);
    }
    for (const x0 of [-0.75, -0.25, 0.25, 0.75]) { ctx.moveTo(cx + r * x0, cy - r * 0.3); ctx.lineTo(cx, cy + r); }
    ctx.stroke();
    ctx.restore();

    // Desenho de dentro (um pouco mais pequeno, para caber no diamante)
    const k = r / 20 * 0.72;
    ctx.save();
    losango(r * (plus ? 0.84 : 0.88));
    ctx.clip();               // o desenho nunca sai do diamante
    ctx.translate(cx, cy - r * 0.1);
    ctx.scale(k, k);
    const corDesenho = plus ? '#2b1c00' : '#1b2230';
    ctx.fillStyle = corDesenho;
    ctx.strokeStyle = corDesenho;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // (sem brilho à volta do desenho: num fundo claro fica mais nítido)
    ctx.beginPath();
    // Peças para os desenhos: bola de futebol, baliza com rede, setas, jogadores, luvas e botas
    const escuro = plus ? '#f3cf5c' : '#e3e8ef';   // cor dos gomos/pormenores (o fundo do diamante)
    const L = (w) => { ctx.lineWidth = w; };
    const bola = (x, y, r) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      // pentágono no meio e gomos à volta, como uma bola a sério
      ctx.save(); ctx.fillStyle = escuro; ctx.shadowBlur = 0;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        ctx.lineTo(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4);
      }
      ctx.closePath(); ctx.fill();
      // costuras: do pentágono até à borda
      ctx.strokeStyle = escuro; ctx.lineWidth = Math.max(0.6, r * 0.13);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        ctx.moveTo(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4);
        ctx.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92);
      }
      ctx.stroke();
      ctx.restore();
    };
    const baliza = (x0, y0, x1, y1) => {
      ctx.save();
      L(0.7); ctx.globalAlpha = 0.55; ctx.beginPath();
      for (let x = x0 + 2.2; x < x1; x += 2.2) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
      for (let y = y0 + 2.2; y < y1; y += 2.2) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
      ctx.stroke(); ctx.restore();
      L(1.8); ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.stroke();
    };
    const seta = (pts, tracejado = false, ponta = true) => {
      ctx.save(); L(1.6);
      if (tracejado) ctx.setLineDash([2.2, 2]);
      ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
      if (pts.length === 4) ctx.lineTo(pts[2], pts[3]);
      else ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
      ctx.stroke(); ctx.setLineDash([]);
      if (ponta) {
        const n = pts.length, ex = pts[n - 2], ey = pts[n - 1], px = pts[n - 4], py = pts[n - 3];
        const a = Math.atan2(ey - py, ex - px);
        ctx.beginPath(); ctx.moveTo(ex, ey);
        ctx.lineTo(ex - Math.cos(a - 0.5) * 4, ey - Math.sin(a - 0.5) * 4);
        ctx.lineTo(ex - Math.cos(a + 0.5) * 4, ey - Math.sin(a + 0.5) * 4);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    };
    const velocidade = (x, y, n = 3, comp = 7) => {
      ctx.save(); L(1.4); ctx.beginPath();
      for (let i = 0; i < n; i++) { const dy = (i - (n - 1) / 2) * 3; ctx.moveTo(x, y + dy); ctx.lineTo(x - comp + Math.abs(dy) * 0.6, y + dy); }
      ctx.stroke(); ctx.restore();
    };
    // Jogador: cabeça + corpo em linhas (ângulos em radianos: tronco, braços, pernas)
    const jogador = (x, y, e, tr = 0, bE = 0.5, bD = -0.5, pE = 0.35, pD = -0.35) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(e, e); L(2.2 / e * Math.min(1, e));
      const ox = Math.sin(tr) * 6, oy = -Math.cos(tr) * 6;
      ctx.beginPath(); ctx.arc(ox * 1.45, oy * 1.45, 2.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ox, oy);
      for (const a of [bE, bD]) { ctx.moveTo(ox * 0.85, oy * 0.85); ctx.lineTo(ox * 0.85 + Math.sin(a + tr + Math.PI) * 5, oy * 0.85 - Math.cos(a + tr + Math.PI) * 5); }
      for (const a of [pE, pD]) { ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a + tr + Math.PI) * 6.5, -Math.cos(a + tr + Math.PI) * 6.5); }
      ctx.stroke(); ctx.restore();
    };
    const luva = (x, y, e = 1, rot = 0) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(e, e);
      ctx.beginPath();
      ctx.moveTo(-4, 6); ctx.lineTo(-4.5, -1);
      for (let i = 0; i < 4; i++) { const fx = -4 + i * 2.6; ctx.lineTo(fx, -6.5 + Math.abs(i - 1.5) * 0.8); ctx.lineTo(fx + 2, -6.5 + Math.abs(i - 1.5) * 0.8); }
      ctx.lineTo(4.6, 0); ctx.lineTo(6.5, -2.5); ctx.lineTo(7, 0); ctx.lineTo(4.5, 4); ctx.lineTo(4, 6); ctx.closePath(); ctx.fill();
      ctx.restore();
    };
    const bota = (x, y, e = 1, rot = 0) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(e, e);
      ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-1, -6); ctx.lineTo(0, -1); ctx.lineTo(6, 0);
      ctx.quadraticCurveTo(8, 1.5, 7, 3); ctx.lineTo(-5, 3); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.fillStyle = escuro; ctx.shadowBlur = 0;
      for (const sx of [-3.5, 0, 3.5]) ctx.fillRect(sx, 3, 1.2, 1.4);
      ctx.restore(); ctx.restore();
    };
    const cabecaPerfil = (x, y, e = 1) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(e, e);
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(-2.5, 9); ctx.lineTo(2.5, 9); ctx.lineTo(2, 4); ctx.fill();
      ctx.restore();
    };
    switch (nome) {
      // ----- Remate -----
      case 'Remate Colocado':   // Finesse Shot: bola em arco para o canto da baliza
        baliza(1, -12, 13, -2); bola(-8, 8, 4.2); seta([-6, 3, -8, -12, 5, -9]); break;
      case 'Remate Potente':    // Power Shot: bola com rasto de velocidade a entrar na baliza
        baliza(5, -8, 14, 8); bola(0, 1, 5); velocidade(-6, 1, 3, 8); break;
      case 'Remate Rasteiro':   // Low Driven Shot: bola rente à relva até ao fundo da baliza
        baliza(3, -7, 14, 9); L(1.6); ctx.beginPath(); ctx.moveTo(-14, 9.5); ctx.lineTo(14, 9.5); ctx.stroke();
        bola(-9, 5.5, 3.6); seta([-5, 6, 10, 6]); break;
      case 'Chapéu':            // Chip Shot: bola por cima do guarda-redes
        baliza(4, -2, 14, 9); jogador(8, 8, 0.75, 0, 2.6, -2.6); bola(-10, 7, 3.2); seta([-8, 3, 0, -16, 9, -3], true); break;
      case 'Bola Parada':       // Dead Ball: bola por cima da barreira
        baliza(4, -12, 14, -3); for (const bx of [-3, 0, 3]) jogador(bx, 4, 0.5, 0, 0.2, -0.2, 0.1, -0.1);
        bola(-10, 10, 3.2); seta([-8, 6, -4, -14, 7, -6], true); break;
      case 'Trivela':           // Trivela: bota a bater com a parte de fora, bola em curva
        bota(-5, 6, 0.9, 0.3); bola(5, 4, 3.6); seta([7, 0, 14, -8, 4, -12]); break;
      case 'Acrobático':        // Acrobatic: pontapé de bicicleta
        jogador(-1, 2, 1, Math.PI * 0.85, 1.4, -1.4, 0.9, -0.2); bola(9, -9, 3.6); break;
      case 'Cabeceamento Potente':   // Power Header
        cabecaPerfil(-6, -1); bola(7, -4, 4.2); velocidade(1, -4, 3, 0.1); seta([11, -4, 15, -4]); break;
      case 'Cabeceamento Preciso':   // Precision Header: cabeça + bola para o canto
        cabecaPerfil(-8, 3, 0.9); baliza(3, -12, 14, -3); bola(-3, -5, 3.2); seta([0, -6, 6, -11, 11, -10]); break;
      case 'Gamechanger':       // Gamechanger: bola a brilhar
        bola(0, 2, 6); for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4; L(1.5); ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 9, 2 + Math.sin(a) * 9); ctx.lineTo(Math.cos(a) * 13, 2 + Math.sin(a) * 13); ctx.stroke();
        } break;
      // ----- Passe -----
      case 'Passe Incisivo':    // Incisive Pass: passe a passar entre dois defesas
        jogador(-1, -5, 0.55); jogador(-1, 9, 0.55); bola(-11, 2, 3); seta([-7, 2, 13, 2]); break;
      case 'Passe Tenso':       // Pinged Pass: passe forte e direito
        bola(-7, 0, 4); velocidade(-12, 0, 3, 4); seta([-2, -3, 13, -3]); seta([-2, 3, 13, 3]); break;
      case 'Passe Longo':       // Long Ball Pass: passe longo pelo ar
        bola(-11, 9, 3); seta([-9, 5, 0, -18, 12, 8], true); jogador(12, 10, 0.5); break;
      case 'Tiki-Taka':         // Tiki Taka: passes curtos entre três jogadores
        jogador(-10, 9, 0.5); jogador(10, 9, 0.5); jogador(0, -6, 0.5);
        seta([-7, 4, -2, -3]); seta([3, -3, 8, 4]); bola(0, 9, 2.6); break;
      case 'Cruzamento Tenso':  // Whipped Pass: cruzamento da ala para a área
        baliza(-4, -13, 6, -6); bola(-12, 10, 3); seta([-9, 7, 14, 2, 1, -4]); break;
      case 'Inventivo':         // Inventive: passe de calcanhar / lâmpada
        ctx.arc(-3, -5, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-5.5, 1, 5, 3); bola(8, 7, 3.6); break;
      // ----- Defesa -----
      case 'Intercetor':        // Intercept: passe cortado
        bola(-11, 0, 3); seta([-7, 0, 3, 0], true, false);
        L(2.4); ctx.beginPath(); ctx.moveTo(6, -10); ctx.lineTo(6, 10); ctx.stroke(); jogador(11, 8, 0.5); break;
      case 'Bloqueio':          // Block: perna esticada a bloquear o remate
        jogador(4, 9, 0.85, -0.2, 0.6, -0.8, 1.3, -0.3); bola(-10, 3, 3.6); velocidade(-14, 3, 2, 3); break;
      case 'Antecipação':       // Anticipate: olho atento à bola
        ctx.moveTo(-12, -2); ctx.quadraticCurveTo(-2, -12, 8, -2); ctx.quadraticCurveTo(-2, 8, -12, -2); ctx.fill();
        ctx.save(); ctx.fillStyle = escuro; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(-2, -2, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        bola(10, 8, 3.4); break;
      case 'Carrinho':          // Slide Tackle: jogador a deslizar para a bola
        L(1.4); ctx.moveTo(-14, 11); ctx.lineTo(14, 11); ctx.stroke();
        jogador(-2, 9, 0.9, -1.25, 0.4, -1.2, 0.5, 0.1); bola(10, 7.5, 3.2); break;
      case 'Marcação':          // Jockey: defesa de lado, a acompanhar
        jogador(-4, 8, 0.9, 0.15, 1.2, -1.2, 0.6, -0.6); bola(9, 8, 3.2);
        seta([-12, -10, -4, -10]); seta([4, -10, 12, -10]); break;
      case 'Fortaleza Aérea':   // Aerial Fortress: salta mais alto pela bola
        jogador(0, 10, 0.9, 0, 2.7, -2.7, 0.25, -0.25); bola(0, -11, 3.4); break;
      case 'Muralha':           // Bruiser: escudo com uma bola
        ctx.moveTo(0, -13); ctx.lineTo(11, -8); ctx.lineTo(9, 5); ctx.lineTo(0, 13);
        ctx.lineTo(-9, 5); ctx.lineTo(-11, -8); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.fillStyle = escuro; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(0, -1, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        bola(0, -1, 3.8); break;
      // ----- Bola no pé / físico -----
      case 'Técnico':           // Technical: bola com setas a rodar à volta (drible apertado)
        bola(0, 0, 5); seta([-9, 4, -11, -9, 1, -10]); seta([9, -4, 11, 9, -1, 10]); break;
      case 'Rápido':            // Rapid: raio com bola
        ctx.moveTo(1, -14); ctx.lineTo(-8, 1); ctx.lineTo(-1, 1); ctx.lineTo(-4, 13); ctx.lineTo(6, -3); ctx.lineTo(0, -3); ctx.closePath(); ctx.fill();
        bola(9, 9, 3.4); break;
      case 'Arranque Rápido':   // Quick Step: jogador a arrancar
        jogador(2, 8, 1, 0.45, 1.1, -0.9, 0.9, -0.7); velocidade(-6, -1, 3, 7); break;
      case 'Primeiro Toque':    // First Touch: bota a amortecer a bola
        bota(-3, 8, 0.9); bola(4, -3, 4); seta([4, -14, 4, -9]); break;
      case 'Habilidoso':        // Trickster: pé por cima da bola (bicicleta)
        bola(0, 6, 4.5); seta([-11, 4, 0, -14, 11, 4], true); break;
      case 'Flair':             // Flair: bola com estrelinhas
        bola(-3, 4, 5.5);
        for (const [sx, sy, sr] of [[8, -7, 4.5], [-9, -9, 2.8], [11, 7, 2.4]]) {
          ctx.beginPath();
          for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? sr * 0.35 : sr; ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); }
          ctx.closePath(); ctx.fill();
        } break;
      case 'Resistente à Pressão':   // Press Proven: bola protegida com setas a apertar
        bola(0, 0, 4.8); L(1.6); ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
        seta([-14, -9, -9, -5]); seta([14, -9, 9, -5]); seta([0, 14, 0, 9.5]); break;
      case 'Intimidador':       // Enforcer: ombro contra ombro
        jogador(-4, 9, 0.9, 0.35); jogador(5, 9, 0.9, -0.35); bola(0, 11, 2.4); break;
      case 'Incansável':        // Relentless: infinito
        L(2.6); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-4, -7, -13, -7, -13, 0); ctx.bezierCurveTo(-13, 7, -4, 7, 0, 0);
        ctx.bezierCurveTo(4, -7, 13, -7, 13, 0); ctx.bezierCurveTo(13, 7, 4, 7, 0, 0); ctx.stroke(); break;
      case 'Lançamento Longo':  // Long Throw: lançamento lateral com a bola por cima da cabeça
        jogador(-3, 10, 0.9, -0.15, 2.9, -2.9, 0.3, -0.3); bola(-4, -12, 3); seta([1, -12, 12, -14, 13, -2], true); break;
      // ----- Guarda-redes -----
      case 'Reflexos':          // Quick Reflexes: luva rápida à frente da bola
        luva(-3, 2, 1.05); bola(9, -6, 3.6); velocidade(15, -6, 2, -4); break;
      case 'Alcance':           // Far Reach: mergulho até ao canto
        baliza(-14, -12, 14, 10); jogador(-2, 6, 0.85, 1.15, 0.2, 0.1, 0.2, 0.0); luva(9, -5, 0.55, 1.2); bola(12, -8, 2.6); break;
      case 'Corta Cruzamentos': // Cross Claimer: duas luvas a agarrar a bola no ar
        bola(0, -7, 4.5); luva(-7, 5, 0.75, -0.4); luva(7, 5, 0.75, 0.4); break;
      case 'Sai aos Pés':       // Rush Out: GR sai da baliza para a bola
        baliza(-14, -10, -6, 8); jogador(0, 8, 0.85, 0.5, 1.4, -0.8, 0.9, -0.6); bola(11, 8, 3); velocidade(-4, -2, 2, 5); break;
      case 'Lançamento Longo GR':   // Far Throw: luva a lançar longe
        luva(-8, 6, 0.8, -0.5); bola(-2, -4, 3); seta([1, -6, 7, -14, 14, -5], true); break;
      case 'Jogo de Pés':       // Footwork: bota do GR a jogar a bola
        bota(-4, 6, 1); bola(8, 4, 4); luva(-7, -8, 0.5); break;
      case 'Defletor':          // Deflector: luva desvia a bola para fora da baliza
        baliza(-14, -12, -2, 10); luva(0, 0, 0.8, 0.3); bola(10, -7, 3.4); seta([4, -3, 13, -12]); break;
      default:
        bola(0, 0, 7);
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
    if (desempate) { bolinhasPenaltis(x, y + h + 13 * s); return; }
    const seg = Math.ceil(tempoRestante);
    const relogioTxt = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
    // Nos últimos 10 segundos o relógio fica vermelho
    texto(relogioTxt, x + 10 * s, y + h + 18 * s, 14, seg <= 10 ? '#ff4d4d' : '#ffffff', 'left', '800');
    texto(`ou primeiro a ${GOLS_PARA_GANHAR} golos`, x + 150 * s, y + h + 17 * s, 12, '#c8d0e0', 'center', '600');
  }

  // Desempate: uma bolinha por penálti (verde = golo, vermelho = falhou, vazio = ainda não bateu)
  function bolinhasPenaltis(x, cy) {
    const d = desempate;
    const total = Math.max(PENALTIS_CADA, d.batidos[0], d.batidos[1]);
    const ini = Math.max(0, total - PENALTIS_CADA);   // na morte súbita mostra os últimos 5
    for (let t = 0; t < 2; t++) {
      for (let i = 0; i < PENALTIS_CADA; i++) {
        const r = d.hist[t][ini + i];
        const cx = t === 0 ? x + (12 + i * 12) * s : x + (238 - i * 12) * s;
        ctx.beginPath(); ctx.arc(cx, cy, 4.2 * s, 0, Math.PI * 2);
        if (r === undefined) { ctx.strokeStyle = '#8a93a8'; ctx.lineWidth = 1.5 * s; ctx.stroke(); }
        else { ctx.fillStyle = r ? '#2ecc71' : '#ef233c'; ctx.fill(); }
      }
    }
    texto(`PENÁLTIS ${d.golos[0]}-${d.golos[1]}`, x + 125 * s, cy + 4.5 * s, 12, '#ffd60a', 'center', '800');
  }

  // ---------- Carta dourada ao estilo do FC ----------
  function cartaFC(x, y, w, h, p, mostrarNome = true) {
    const especial = CARTAS_ESPECIAIS[p.nome];
    const fundo = ctx.createLinearGradient(x, y, x + w, y + h);
    if (especial) especial.cores.forEach((cor, i) => fundo.addColorStop(i / (especial.cores.length - 1), cor));
    else {
      fundo.addColorStop(0, '#fff0b3');
      fundo.addColorStop(0.45, '#e2b04a');
      fundo.addColorStop(1, '#9c6b12');
    }
    const c = Math.min(w, h) * 0.18;
    const forma = () => {
      ctx.beginPath();
      ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c);
      ctx.lineTo(x + w, y + h - c * 0.6); ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x, y + h - c * 0.6);
      ctx.lineTo(x, y + c); ctx.closePath();
    };
    ctx.save();
    ctx.shadowColor = especial ? especial.cores[1] : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = (especial ? 14 : 8) * s;
    ctx.fillStyle = fundo;
    forma();
    ctx.fill();
    ctx.restore();
    if (especial) {
      ctx.save();
      forma();
      ctx.clip();
      // Confettis (sempre nos mesmos sítios, para não tremerem)
      let semente = 7;
      const rnd = () => { semente = (semente * 9301 + 49297) % 233280; return semente / 233280; };
      for (let i = 0; i < (especial.confetti ? 26 : 0); i++) {
        ctx.fillStyle = especial.confetti[i % especial.confetti.length];
        ctx.globalAlpha = 0.85;
        ctx.save();
        ctx.translate(x + rnd() * w, y + rnd() * h);
        ctx.rotate(rnd() * Math.PI);
        ctx.fillRect(-w * 0.025, -w * 0.01, w * 0.05, w * 0.02);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      // Brilho a passar pela carta, de vez em quando
      const fase = (performance.now() / 1800) % 1.6 - 0.3;
      const bx = x + fase * w * 1.6;
      const brilho = ctx.createLinearGradient(bx - w * 0.3, y, bx + w * 0.3, y + h);
      brilho.addColorStop(0, 'rgba(255,255,255,0)');
      brilho.addColorStop(0.5, 'rgba(255,255,255,0.55)');
      brilho.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = brilho;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
      forma();
    }
    ctx.strokeStyle = especial ? especial.borda : 'rgba(255,248,210,0.9)';
    ctx.lineWidth = (especial ? 2 : 1.2) * s;
    ctx.stroke();
    const k = w / 50;
    ctx.fillStyle = especial ? especial.texto : '#3a2a05';
    ctx.textAlign = 'left';
    ctx.font = `900 ${17 * k}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillText(String(p.ovr || 75), x + 6 * k, y + 19 * k);
    ctx.font = `800 ${9 * k}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillText(p.posicao || '', x + 7 * k, y + 30 * k);
    // Cor da equipa no canto
    ctx.fillStyle = EQUIPAS[p.team].camisola;
    ctx.fillRect(x + w - 15 * k, y + 8 * k, 9 * k, 6 * k);
    if (especial && mostrarNome) {
      ctx.fillStyle = especial.tipo === 'ICON' ? '#9c7a1c' : '#ffe600';
      ctx.textAlign = 'center';
      ctx.font = `900 ${6 * k}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillText(especial.tipo, x + w / 2, y + h - 3.5 * k);
    }
    if (mostrarNome) {
      ctx.fillStyle = especial ? especial.texto : '#3a2a05';
      ctx.textAlign = 'center';
      ctx.font = `800 ${7.5 * k}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillText((especial ? p.nome : p.chamado.split(' ').slice(-1)[0]).toUpperCase(), x + w / 2, y + h - 12 * k, w - 6 * k);
    }
  }

  // ---------- Painel do jogador selecionado (em baixo) ----------
  function painelJogador(t) {
    const p = human[t];
    if (!p) return;
    const w = 420 * s, h = 70 * s;
    const x = t === 0 ? 16 * s : canvas.width - w - 16 * s;
    const y = canvas.height - h - 16 * s;
    caixa(x, y, w, h, 'rgba(8,12,28,0.9)', 8);
    ctx.fillStyle = COR_J[t];
    ctx.fillRect(x, y, 6 * s, h);
    texto(etiqueta(t), x + 14 * s, y + 18 * s, 12, COR_J[t], 'left', '900');
    // Carta dourada com a classificação
    cartaFC(x + 14 * s, y + 22 * s, 34 * s, 44 * s, p, false);
    // Nome em destaque (encolhe se for comprido)
    const zonaNome = w - 60 * s - 140 * s;
    ctx.save();
    ctx.shadowColor = COR_J[t];
    ctx.shadowBlur = 10 * s;
    ctx.font = `900 ${19 * s}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(p.nome.toUpperCase(), x + 60 * s, y + 32 * s, zonaNome);
    ctx.restore();
    const stats = p.gk ? `REF ${atr(p, 'ref')}` : `RIT ${atr(p, 'rit')} · REM ${atr(p, 'rem')} · PAS ${atr(p, 'pas')}`;
    ctx.font = `700 ${11 * s}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = '#9aa6bf';
    ctx.fillText(`#${p.num} · ${stats}`, x + 60 * s, y + 54 * s, zonaNome);
    // PlayStyles à direita: o primeiro PlayStyle+ grande, os outros pequenos (dourados ou prateados)
    const lista = p.pss || [{ nome: p.ps, plus: true }];
    const ix = x + w - 112 * s;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(ix - 24 * s, y + 6 * s, 1 * s, h - 12 * s);
    iconePS(lista[0].nome, ix, y + 26 * s, 15 * s, lista[0].plus);
    texto(nomeFC(lista[0].nome), ix, y + 56 * s, 9, '#f4c542', 'center', '800', 70 * s);
    texto(lista[0].plus ? 'PLAYSTYLE+' : 'PLAYSTYLE', ix, y + 66 * s, 7, '#c9a227', 'center', '800');
    lista.slice(1, 5).forEach((e, i) => {
      const cx = x + w - 66 * s + (i % 2) * 26 * s, cy = y + 20 * s + Math.floor(i / 2) * 28 * s;
      iconePS(e.nome, cx, cy, 10 * s, e.plus);
    });
  }

  // Emblema dourado por cima do jogador quando o PlayStyle entra em ação (como no FC)
  function popupsPS() {
    for (const pp of popups) {
      if (!players.includes(pp.p)) continue;
      const c = Render.noEcra(pp.p.x, pp.p.y, 40, canvas.width, canvas.height);
      if (!c.visivel) continue;
      const vida = (pp.finta ? 1.2 : 1.6) - pp.t;
      const escala = Math.min(1, vida / 0.15) * (1 + Math.max(0, 0.15 - vida) * 2);
      const alfa = Math.min(1, pp.t / 0.4);
      ctx.save();
      ctx.globalAlpha = alfa;
      if (pp.finta) {
        // Nome da finta (ex.: LAMBRETA!)
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8 * s;
        texto(pp.finta, c.x, c.y - 18 * s - vida * 18 * s, 18 * escala, '#ffffff', 'center', '900');
        ctx.restore();
      } else {
        const yy = c.y - 10 * s - vida * 14 * s;
        iconePS(pp.ps, c.x, yy, 17 * s * escala, pp.plus !== false);
        const nome = nomeFC(pp.ps).toUpperCase() + (pp.plus !== false ? '+' : '');
        ctx.font = `900 ${10 * s}px "Segoe UI", system-ui, sans-serif`;
        const lw = ctx.measureText(nome).width + 16 * s;
        caixa(c.x - lw / 2, yy + 22 * s, lw, 18 * s, 'rgba(20,14,0,0.85)', 9);
        texto(nome, c.x, yy + 35 * s, 10, pp.plus !== false ? '#f4c542' : '#dfe6f0', 'center', '900');
      }
      ctx.restore();
    }
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
    // Na câmara atrás do jogador (livres e penáltis) as etiquetas atrapalham
    if (state === 'parada' && setPiece && (setPiece.tipo === 'livre' || setPiece.tipo === 'penalti')) return;
    for (let t = 0; t < 2; t++) {
      const p = human[t];
      if (!p || state === 'golo' || state === 'fim') continue;
      const c = Render.noEcra(p.x, p.y, 46, canvas.width, canvas.height);   // por cima da seta e da barra do cartão
      if (c.visivel) {
        texto(etiqueta(t), c.x, c.y, 14, COR_J[t], 'center', '900');
        if (aPassar[t] && cargaPasse[t] > 0.12) {
          // Barra azul: passe alto (quanto mais cheia, mais longe)
          const pe = Render.noEcra(p.x, p.y, 0, canvas.width, canvas.height);
          const bw = 46 * s, bh = 8 * s;
          caixa(pe.x - bw / 2, pe.y + 12 * s, bw, bh, 'rgba(0,0,0,0.7)', 3);
          ctx.fillStyle = '#4cc9f0';
          ctx.fillRect(pe.x - bw / 2 + 2 * s, pe.y + 14 * s, (bw - 4 * s) * Math.min(1, (cargaPasse[t] - 0.12) / 0.9), bh - 4 * s);
        }
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
    if (state !== 'parada' || !setPiece || !setPiece.taker || setPiece.taker.gk || eCPU(setPiece.team)) return;
    const t = setPiece.team;
    const saida = setPiece.tipo === 'saida';
    const k = saida
      ? (t === 0 ? 'Pontapé de saída: W A S D apontar · F passar' : 'Pontapé de saída: Setas apontar · K passar')
      : (t === 0 ? 'W A S D apontar · F passar (segura = alto) · G rematar' : 'Setas apontar · K passar (segura = alto) · L rematar');
    // Dica em cima (por baixo do aviso do árbitro), para não tapar a jogada
    caixa(canvas.width / 2 - 200 * s, 164 * s, 400 * s, 30 * s, 'rgba(8,12,28,0.8)', 6);
    texto(`J${t + 1}: ${k}`, canvas.width / 2, 184 * s, 14, COR_J[t], 'center', '700');
    if (livreDiretoPossivel()) {
      const botao = t === 0 ? 'H' : 'Ç';
      caixa(canvas.width / 2 - 200 * s, 198 * s, 400 * s, 28 * s, 'rgba(8,12,28,0.8)', 6);
      texto(`${botao} (ou analógico direito) muda o efeito: ${NOMES_EFEITO[setPiece.efeito || 0].toUpperCase()}`,
        canvas.width / 2, 217 * s, 13, '#ffd60a', 'center', '800');
    }
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
    const w = 360 * s, h = 228 * s;
    caixa(x, y, w, h, 'rgba(8,12,28,0.85)', 12);
    ctx.fillStyle = COR_J[t]; ctx.fillRect(x, y, w, 6 * s);
    // Equipa escolhida (W/S para o J1, ↑/↓ para o J2)
    const eq = EQUIPAS[t];
    ctx.fillStyle = eq.camisola;
    ctx.fillRect(x + 20 * s, y + 20 * s, 14 * s, 20 * s);
    ctx.fillStyle = eq.calcoes;
    ctx.fillRect(x + 20 * s, y + 34 * s, 14 * s, 6 * s);
    ctx.font = `900 ${18 * s}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = COR_J[t];
    ctx.fillText(`${etiqueta(t)} · ${eq.nome}`, x + 42 * s, y + 36 * s, w - 150 * s);
    texto(t === 0 ? '▲ W  ▼ S' : '▲ ↑  ▼ ↓', x + w - 18 * s, y + 30 * s, 12, '#ffd60a', 'right', '900');
    texto(eq.alternativo ? `${eq.grupo} · equip. alternativo` : eq.grupo, x + w - 18 * s, y + 44 * s, 9, '#9aa6bf', 'right', '600');
    if (eCPU(t)) {
      // Contra o computador: este lado não tem teclas, mostra o nível
      const nv = NIVEIS[nivel];
      texto('Joga o computador', x + 20 * s, y + 84 * s, 20, '#ffffff', 'left', '900');
      texto(`Nível: ${nv.nome}`, x + 20 * s, y + 116 * s, 16, COR_J[t], 'left', '800');
      NIVEIS.forEach((n, i) => {
        caixa(x + 20 * s + i * 34 * s, y + 130 * s, 26 * s, 10 * s, i <= nivel ? COR_J[t] : 'rgba(255,255,255,0.15)', 3);
      });
      texto('Carrega 1 outra vez para mudar o nível', x + 20 * s, y + 172 * s, 13, '#9aa6bf', 'left', '600');
      return;
    }
    const k = TECLAS[t];
    const nome = c => c.replace('Semicolon', 'Ç').replace('Key', '').replace('Arrow', '').replace('Up', '↑').replace('Down', '↓').replace('Left', '←').replace('Right', '→');
    let cx = x + 20 * s;
    for (const c of [k.up, k.left, k.down, k.right]) cx += tecla(cx, y + 56 * s, nome(c)) + 6 * s;
    texto('andar', cx + 6 * s, y + 78 * s, 14, '#c8d0e0', 'left', '600');
    tecla(x + 20 * s, y + 96 * s, nome(k.b1), '#111');
    texto('com bola: passar (segura = passe alto)', x + 66 * s, y + 110 * s, 14, '#fff', 'left', '700');
    texto('sem bola: mudar de jogador', x + 66 * s, y + 126 * s, 12, '#9aa6bf', 'left', '600');
    tecla(x + 20 * s, y + 140 * s, nome(k.b2), '#111');
    texto('com bola: rematar (segura = força)', x + 66 * s, y + 154 * s, 14, '#fff', 'left', '700');
    texto('sem bola: carrinho', x + 66 * s, y + 170 * s, 12, '#9aa6bf', 'left', '600');
    tecla(x + 20 * s, y + 184 * s, nome(k.b3), '#111');
    texto('fintas: ↑ lambreta · ← → elástico · ↓ arrastar', x + 66 * s, y + 198 * s, 12, '#fff', 'left', '700');
    texto('sozinho: roleta · 2× bicicleta (2× + ↑ cueca)', x + 66 * s, y + 214 * s, 11, '#9aa6bf', 'left', '600');
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
    texto(`${EQUIPAS[0].nome}  vs  ${EQUIPAS[1].nome}  ·  ${modoJogo === 'cpu' ? 'contra o computador' : '2 jogadores'}  ·  ${numJogadores} contra ${numJogadores}  ·  2 minutos ou primeiro a ${GOLS_PARA_GANHAR} golos`,
      canvas.width / 2, canvas.height * 0.2 + 42 * s, 17, '#9fe0a6', 'center', '700');
    // Escolha do estádio
    const est = Render.estadio;
    const ey = canvas.height * 0.2 + 62 * s;
    caixa(canvas.width / 2 - 230 * s, ey, 460 * s, 40 * s, 'rgba(8,12,28,0.85)', 8);
    texto('◀', canvas.width / 2 - 210 * s, ey + 27 * s, 18, '#ffd60a', 'center', '900');
    texto('▶', canvas.width / 2 + 210 * s, ey + 27 * s, 18, '#ffd60a', 'center', '900');
    texto(`${est.nome.toUpperCase()}`, canvas.width / 2, ey + 22 * s, 18, '#ffffff', 'center', '900');
    texto(`${est.cidade} · ${est.dia ? 'de dia' : 'à noite'} · setas para mudar`, canvas.width / 2, ey + 35 * s, 10, '#9aa6bf', 'center', '600');
    const y = canvas.height * 0.33;
    cartaoControlos(canvas.width / 2 - 380 * s, y, 0);
    cartaoControlos(canvas.width / 2 + 20 * s, y, 1);
    // Escalações em cartas douradas
    for (let t = 0; t < 2; t++) {
      const x0 = canvas.width / 2 + (t === 0 ? -380 : 20) * s;
      EQUIPAS[t].plantel.forEach((j, i) => {
        const p = { ...j, team: t, chamado: j.chamado || j.nome.split(' ').slice(-1)[0] };
        cartaFC(x0 + i * 72 * s, y + 236 * s, 64 * s, 86 * s, p);
        iconePS(j.ps, x0 + i * 72 * s + 50 * s, y + 236 * s + 52 * s, 9 * s);
      });
    }
    // Modo de jogo (teclas 1 e 2) e número de jogadores (teclas 3 e 4)
    const my = y + 330 * s;
    const opcoes = [
      ['1', `CONTRA O COMPUTADOR · ${NIVEIS[nivel].nome.toUpperCase()}`, modoJogo === 'cpu', 0, 0],
      ['2', '2 JOGADORES', modoJogo === '2j', 1, 0],
      ['3', '5 CONTRA 5', numJogadores === 5, 0, 1],
      ['4', '11 CONTRA 11', numJogadores === 11, 1, 1],
    ];
    opcoes.forEach(([tec, txt, ativo, i, fila]) => {
      const bw = 330 * s, bx = canvas.width / 2 + (i === 0 ? -bw - 10 * s : 10 * s);
      const my = y + 330 * s + fila * 44 * s;
      caixa(bx, my, bw, 40 * s, ativo ? 'rgba(255,214,10,0.95)' : 'rgba(8,12,28,0.85)', 8);
      if (!ativo) { ctx.strokeStyle = 'rgba(255,214,10,0.5)'; ctx.lineWidth = 1.5 * s; ctx.stroke(); }
      caixa(bx + 10 * s, my + 8 * s, 24 * s, 24 * s, ativo ? '#0b1020' : '#f1f3f8', 5);
      texto(tec, bx + 22 * s, my + 26 * s, 15, ativo ? '#ffd60a' : '#111', 'center', '900');
      texto(txt, bx + 44 * s, my + 26 * s, 15, ativo ? '#0b1020' : '#ffffff', 'left', '900');
    });
    if (Comando.ligados) {
      texto(`🎮 Comando (como no FC 26 na Switch): B passe · A remate/desarme · Y passe alto/carrinho · X profundidade · L mudar · R+A colocado · ZR sprint · analógico direito fintas`,
        canvas.width / 2, canvas.height - 30 * s, 12, '#c8d0e0', 'center', '700');
      texto(`No menu: L contra o computador · R 2 jogadores · ZL 5v5 · ZR 11v11 · + começar`,
        canvas.width / 2, canvas.height - 12 * s, 12, '#9aa6bf', 'center', '600');
    } else {
      texto('🎮 Tens um comando? Liga-o e carrega num botão.', canvas.width / 2, canvas.height - 14 * s, 12, '#9aa6bf', 'center', '600');
    }
    texto(Narrador.disponivel ? `Narrador: ${Narrador.ligado ? 'ligado' : 'desligado'} (tecla N) · voz ${Narrador.nomeVoz}${Narrador.masculina ? '' : ' (não há voz de homem neste computador)'}` :
      'Narrador: este computador não tem voz em português', canvas.width - 16 * s, 24 * s, 12, '#9aa6bf', 'right', '600');
    if (Math.floor(performance.now() / 500) % 2 === 0) {
      texto('Carrega ESPAÇO para começar', canvas.width / 2, my + 116 * s, 24, '#ffd60a', 'center', '900');
    }
  }

  // Mensagem quando se liga/desliga um comando
  function avisoComando() {
    const a = Comando.aviso;
    if (!a) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, a.t);
    ctx.font = `800 ${15 * s}px "Segoe UI", system-ui, sans-serif`;
    const w = ctx.measureText(a.texto).width + 40 * s;
    caixa(canvas.width / 2 - w / 2, canvas.height - 128 * s, w, 34 * s, 'rgba(8,12,28,0.92)', 8);
    texto('🎮', canvas.width / 2 - w / 2 + 18 * s, canvas.height - 105 * s, 15, '#fff', 'center', '800');
    texto(a.texto, canvas.width / 2 + 8 * s, canvas.height - 105 * s, 15, '#ffd60a', 'center', '800');
    ctx.restore();
  }

  // Cantos do ecrã um pouco mais escuros, como numa câmara de televisão
  let vinhetaCache = null;
  function vinheta() {
    const w = canvas.width, h = canvas.height;
    if (!vinhetaCache || vinhetaCache.w !== w || vinhetaCache.h !== h) {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.hypot(w, h) * 0.6);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.38)');
      vinhetaCache = { w, h, g };
    }
    ctx.fillStyle = vinhetaCache.g;
    ctx.fillRect(0, 0, w, h);
  }

  function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state === 'titulo' || !ball) { titulo(); avisoComando(); return; }
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
    vinheta();
    etiquetas();
    popupsPS();
    placar();
    aviso_();
    painelJogador(0);
    painelJogador(1);
    // Nos livres e penáltis a câmara está atrás do jogador: o minimapa tapava a jogada
    if (state !== 'golo' && !(state === 'parada' && setPiece && (setPiece.tipo === 'livre' || setPiece.tipo === 'penalti'))) minimapa();
    dicaBolaParada();
    avisoComando();
    if (state === 'inicio') textoGrande([['PRONTOS?', 52, '#fff']]);
    if (state === 'golo') {
      if (festejo && festejo.t > 0.9) {
        // Durante a celebração, o texto vai para baixo para se ver o jogador
        const siu = festejo.tipo === 'siu';
        if (siu && festejo.t > 1.75) {
          ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 16 * s;
          texto('SIIIIUUUUU!', canvas.width / 2, canvas.height * 0.2, 80, '#ffd60a', 'center', '900');
          ctx.restore();
        }
        texto(marcador, canvas.width / 2, canvas.height - 150 * s, 30, '#ffffff', 'center', '900');
        if (!siu) texto(`Celebração: ${NOMES_CELEBRACAO[festejo.tipo]}`, canvas.width / 2, canvas.height - 120 * s, 18, '#ffd60a', 'center', '800');
      } else textoGrande([['GOLO!', 110, '#ffd60a'], [marcador, 30, '#fff'], [EQUIPAS[lastScorer].nome, 20, '#c8d0e0']]);
    }
    if (state === 'fim') {
      const l = [[`${EQUIPAS[vencedor].nome} GANHA!`, 66, '#ffd60a'], [`${score[0]} - ${score[1]}`, 44, '#fff']];
      if (desempate) l.push([`${desempate.golos[0]} - ${desempate.golos[1]} nos penáltis`, 26, '#ffd60a']);
      if (stateTimer < 0) l.push(['Carrega ESPAÇO para voltar ao início', 20, '#c8d0e0']);
      textoGrande(l);
    }
  }

  return { desenhar, iconePS };
})();
