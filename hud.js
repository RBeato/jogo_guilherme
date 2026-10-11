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
    // PlayStyle+: dourado com brilho e um "+"; PlayStyle normal: prateado
    const ouro = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    if (plus) {
      ouro.addColorStop(0, '#fff1a8');
      ouro.addColorStop(0.45, '#e6b422');
      ouro.addColorStop(1, '#8a5a00');
    } else {
      ouro.addColorStop(0, '#ffffff');
      ouro.addColorStop(0.5, '#c4ccd8');
      ouro.addColorStop(1, '#6d7686');
    }
    ctx.save();
    ctx.shadowColor = plus ? 'rgba(255,200,40,0.7)' : 'rgba(200,215,235,0.4)';
    ctx.shadowBlur = (plus ? 12 : 5) * s;
    ctx.fillStyle = ouro;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + i * Math.PI / 4;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = plus ? '#fff6c8' : '#eef2f7';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
    if (plus) {
      // O "+" dos PlayStyle+
      ctx.save();
      ctx.fillStyle = '#2b1d00';
      ctx.beginPath(); ctx.arc(cx + r * 0.72, cy - r * 0.72, r * 0.34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe680';
      ctx.fillRect(cx + r * 0.72 - r * 0.2, cy - r * 0.72 - r * 0.06, r * 0.4, r * 0.12);
      ctx.fillRect(cx + r * 0.72 - r * 0.06, cy - r * 0.72 - r * 0.2, r * 0.12, r * 0.4);
      ctx.restore();
    }

    // Desenho de dentro
    const k = r / 20;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    ctx.fillStyle = plus ? '#2b1d00' : '#1c2230';
    ctx.strokeStyle = plus ? '#2b1d00' : '#1c2230';
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
      case 'Remate Rasteiro':   // bola com seta rasteira
        ctx.arc(-6, 6, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-12, 12); ctx.lineTo(12, 12); ctx.moveTo(2, 4); ctx.lineTo(12, 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(14, 4); ctx.lineTo(8, 0); ctx.lineTo(8, 8); ctx.closePath(); ctx.fill();
        break;
      case 'Chapéu':   // bola em arco por cima de uma barra
        ctx.moveTo(-12, 8); ctx.quadraticCurveTo(0, -18, 12, 8); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-2, 2, 4, 10);
        break;
      case 'Bola Parada':   // bola parada e arco tracejado
        ctx.arc(-7, 8, 5, 0, Math.PI * 2); ctx.fill();
        ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(-2, 4); ctx.quadraticCurveTo(8, -16, 13, -2); ctx.stroke(); ctx.setLineDash([]);
        break;
      case 'Trivela':   // seta em curva para fora
        ctx.moveTo(-12, 10); ctx.bezierCurveTo(-10, -10, 10, -10, 8, 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, 12); ctx.lineTo(3, 3); ctx.lineTo(13, 4); ctx.closePath(); ctx.fill();
        break;
      case 'Acrobático':   // pontapé de bicicleta (círculo com seta)
        ctx.arc(0, 0, 9, 0.6, Math.PI * 1.8); ctx.stroke();
        ctx.beginPath(); ctx.arc(9, -5, 3.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'Cabeceamento Potente': case 'Cabeceamento Preciso':   // cabeça e bola
        ctx.arc(-4, 2, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(9, -8, 4, 0, Math.PI * 2); ctx.fill();
        if (nome === 'Cabeceamento Potente') { ctx.beginPath(); ctx.moveTo(6, 2); ctx.lineTo(13, 2); ctx.moveTo(5, 7); ctx.lineTo(12, 9); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(9, -8, 8, 0, Math.PI * 2); ctx.lineWidth = 1.5; ctx.stroke(); }
        break;
      case 'Gamechanger':   // estrela
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 5 : 12;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill();
        break;
      case 'Passe Tenso':   // duas setas rápidas
        for (const y of [-5, 5]) {
          ctx.beginPath(); ctx.moveTo(-12, y); ctx.lineTo(6, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(5, y - 5); ctx.lineTo(5, y + 5); ctx.closePath(); ctx.fill();
        }
        break;
      case 'Passe Longo':   // arco comprido
        ctx.moveTo(-13, 10); ctx.quadraticCurveTo(0, -20, 13, 10); ctx.stroke();
        ctx.beginPath(); ctx.arc(13, 10, 3.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'Tiki-Taka':   // triângulo de passes
        ctx.moveTo(0, -10); ctx.lineTo(10, 8); ctx.lineTo(-10, 8); ctx.closePath(); ctx.stroke();
        for (const [x, y] of [[0, -10], [10, 8], [-10, 8]]) { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'Cruzamento Tenso':   // curva a descer para a área
        ctx.moveTo(-13, -8); ctx.quadraticCurveTo(6, -14, 10, 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, 13); ctx.lineTo(5, 4); ctx.lineTo(14, 4); ctx.closePath(); ctx.fill();
        break;
      case 'Inventivo':   // lâmpada
        ctx.arc(0, -3, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-4, 6, 8, 6);
        break;
      case 'Bloqueio':   // mão aberta
        ctx.roundRect(-7, -4, 14, 14, 3); ctx.fill();
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.roundRect(-7 + i * 3.8, -12, 3, 9, 1.5); ctx.fill(); }
        break;
      case 'Antecipação':   // olho
        ctx.moveTo(-13, 0); ctx.quadraticCurveTo(0, -12, 13, 0); ctx.quadraticCurveTo(0, 12, -13, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'Marcação':   // duas linhas paralelas (acompanhar)
        ctx.moveTo(-10, -8); ctx.lineTo(10, -8); ctx.moveTo(-10, 8); ctx.lineTo(10, 8); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'Fortaleza Aérea':   // torre
        ctx.fillRect(-6, -6, 12, 18);
        for (const x of [-8, -2, 4]) ctx.fillRect(x, -12, 4, 6);
        break;
      case 'Técnico':   // bola com remoinho
        ctx.arc(0, 0, 10, 0, Math.PI * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'Arranque Rápido':   // duas setas em V
        for (const x of [-7, 3]) { ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x + 8, 0); ctx.lineTo(x, 10); ctx.stroke(); }
        break;
      case 'Primeiro Toque':   // pé e bola
        ctx.moveTo(-12, 4); ctx.lineTo(0, 4); ctx.lineTo(4, 10); ctx.lineTo(-12, 10); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(7, -5, 5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'Habilidoso': case 'Flair':   // raios de magia
        ctx.moveTo(0, -12); ctx.lineTo(3, -3); ctx.lineTo(12, 0); ctx.lineTo(3, 3); ctx.lineTo(0, 12);
        ctx.lineTo(-3, 3); ctx.lineTo(-12, 0); ctx.lineTo(-3, -3); ctx.closePath(); ctx.fill();
        if (nome === 'Flair') { ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.lineWidth = 1.5; ctx.stroke(); }
        break;
      case 'Resistente à Pressão': case 'Intimidador':   // escudo com bola
        ctx.moveTo(0, -12); ctx.lineTo(10, -7); ctx.lineTo(8, 5); ctx.lineTo(0, 12); ctx.lineTo(-8, 5); ctx.lineTo(-10, -7); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'Incansável':   // infinito
        ctx.moveTo(0, 0); ctx.bezierCurveTo(5, -8, 13, -8, 13, 0); ctx.bezierCurveTo(13, 8, 5, 8, 0, 0);
        ctx.bezierCurveTo(-5, -8, -13, -8, -13, 0); ctx.bezierCurveTo(-13, 8, -5, 8, 0, 0); ctx.stroke();
        break;
      case 'Lançamento Longo': case 'Lançamento Longo GR':   // mãos por cima da cabeça e arco
        ctx.moveTo(-12, 10); ctx.quadraticCurveTo(-2, -16, 12, 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(-10, 10, 3.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'Alcance':   // luva com setas para os lados
        ctx.roundRect(-5, -5, 10, 11, 3); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-8, -4); ctx.lineTo(-8, 4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(8, -4); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill();
        break;
      case 'Corta Cruzamentos':   // luva por cima, bola a cair
        ctx.roundRect(-6, -2, 12, 12, 3); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -10, 4, 0, Math.PI * 2); ctx.fill();
        break;
      case 'Sai aos Pés':   // seta a sair
        ctx.moveTo(-12, 0); ctx.lineTo(6, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(5, -6); ctx.lineTo(5, 6); ctx.closePath(); ctx.fill();
        ctx.fillRect(-14, -10, 3, 20);
        break;
      case 'Jogo de Pés':   // pé
        ctx.moveTo(-10, -4); ctx.lineTo(4, -4); ctx.lineTo(10, 6); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill();
        break;
      case 'Defletor':   // bola desviada
        ctx.moveTo(-12, 10); ctx.lineTo(0, 0); ctx.lineTo(12, 8); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -6, 4, 0, Math.PI * 2); ctx.fill();
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
      for (let i = 0; i < 26; i++) {
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
      ctx.fillStyle = '#ffe600';
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

  return { desenhar };
})();
