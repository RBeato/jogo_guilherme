// Futebol 26 — comandos (gamepads)
// O 1.º comando é o J1, o 2.º comando é o J2. Os botões são os do FC 26 na Nintendo Switch
// (esquema clássico; na PlayStation é igual nas mesmas posições: B=✕, A=○, Y=□, X=△):
//
//   Analógico esquerdo / cruz ... andar (no menu: escolher equipa ↑↓ e estádio ←→)
//   B (baixo) .................... passe rasteiro · sem bola: mudar de jogador
//   A (direita) .................. rematar (segurar = força) · sem bola: desarme em pé
//   Y (esquerda) ................. passe alto / cruzamento (segurar = força) · sem bola: carrinho
//   X (cima) ..................... passe em profundidade
//   L ............................ mudar de jogador
//   R (segurar) + A .............. remate colocado (em arco)
//   ZR (segurar) ................. sprint
//   Analógico direito ............ fintas (na direção para onde se empurra); R3 = roleta
//   + / OPTIONS .................. começar o jogo, saltar a repetição
//   No menu: L · R · ZL · ZR ..... contra o computador · 2 jogadores · 5v5 · 11v11
//
// Os botões "carregam" em teclas (as do teclado ou teclas especiais "Pad0…" só do comando).

const Comando = (() => {
  const memoria = [{}, {}];      // que "teclas" cada comando está a carregar
  const fintaPedida = [null, null];   // finta pedida com o analógico direito
  let estadoAntes = null;
  let aviso = null;              // { texto, t } — mensagem quando se liga um comando
  let nomes = [];

  addEventListener('gamepadconnected', e => {
    const nome = (e.gamepad.id || 'Comando').split('(')[0].trim() || 'Comando';
    aviso = { texto: `Comando ligado: ${nome} → J${Math.min(2, e.gamepad.index + 1)}`, t: 4 };
  });
  addEventListener('gamepaddisconnected', () => { aviso = { texto: 'Comando desligado', t: 3 }; });

  function carregar(mem, codigo, ativo) {
    if (ativo && !mem[codigo]) { pressed.add(codigo); down.add(codigo); }
    if (!ativo && mem[codigo]) { down.delete(codigo); released.add(codigo); }
    mem[codigo] = ativo;
  }

  // Larga todas as teclas que o comando estava a carregar (ao mudar entre menu e jogo)
  function largarTudo(mem) {
    for (const c of Object.keys(mem)) if (mem[c]) { down.delete(c); released.add(c); mem[c] = false; }
  }

  function ler(dt) {
    if (aviso) { aviso.t -= dt; if (aviso.t <= 0) aviso = null; }
    let pads = [];
    try { pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean); }
    catch (e) { return; }   // o browser não deixa usar comandos aqui
    nomes = pads.map(p => p.id);
    const noMenu = state === 'titulo';
    if (estadoAntes !== null && (estadoAntes === 'titulo') !== noMenu) memoria.forEach(largarTudo);
    estadoAntes = state;

    pads.slice(0, 2).forEach((gp, i) => {
      const mem = memoria[i];
      const k = TECLAS[i];
      const b = n => !!(gp.buttons[n] && (gp.buttons[n].pressed || gp.buttons[n].value > 0.5));
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      const esq = b(14) || ax < -0.45, dir = b(15) || ax > 0.45;
      const cima = b(12) || ay < -0.45, baixo = b(13) || ay > 0.45;

      if (noMenu) {
        // Menu: ↑↓ muda a equipa deste jogador, ←→ muda o estádio
        carregar(mem, k.up, cima);
        carregar(mem, k.down, baixo);
        carregar(mem, 'ArrowLeft', esq);
        carregar(mem, 'ArrowRight', dir);
        carregar(mem, 'Space', b(9) || b(1));
        carregar(mem, 'Digit1', b(4));
        carregar(mem, 'Digit2', b(5));
        carregar(mem, 'Digit3', b(6));
        carregar(mem, 'Digit4', b(7));
      } else {
        const pad = `Pad${i}`;
        const j = human[i];
        const temBola = !!(j && (ball.owner === j || canTouchBall(j)));
        carregar(mem, k.left, esq);
        carregar(mem, k.right, dir);
        carregar(mem, k.up, cima);
        carregar(mem, k.down, baixo);
        // B: passe rasteiro (com bola) ou mudar de jogador (sem bola)
        carregar(mem, pad + 'Passe', b(0));
        // A: rematar (com bola, usa o botão de remate do teclado) ou desarme em pé (sem bola)
        const a = b(1);
        if (a && !mem[k.b2] && !mem[pad + 'Desarme']) mem.aComBola = temBola;
        carregar(mem, k.b2, a && mem.aComBola);
        carregar(mem, pad + 'Desarme', a && !mem.aComBola);
        // Y: passe alto (com bola) ou carrinho (sem bola)
        const y = b(2);
        if (y && !mem[pad + 'Alto'] && !mem[pad + 'Carrinho']) mem.yComBola = temBola;
        carregar(mem, pad + 'Alto', y && mem.yComBola);
        carregar(mem, pad + 'Carrinho', y && !mem.yComBola);
        carregar(mem, pad + 'Profundidade', b(3));
        carregar(mem, pad + 'Mudar', b(4));
        carregar(mem, pad + 'Colocado', b(5));
        carregar(mem, pad + 'Sprint', b(7));
        carregar(mem, 'Space', b(9));
        // Analógico direito: finta na direção para onde se empurra; R3 = roleta
        const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
        const forte = Math.hypot(rx, ry) > 0.7;
        if (forte && !mem.direitoAntes) fintaPedida[i] = { dx: rx, dy: ry };
        mem.direitoAntes = forte;
        if (b(11) && !mem.r3Antes) fintaPedida[i] = { dx: 0, dy: 0 };
        mem.r3Antes = b(11);
      }
    });
  }

  // Faz o comando de um jogador vibrar (se o comando e o browser deixarem)
  function vibrar(t, forte = 0.8, ms = 350) {
    try {
      const pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean);
      const gp = pads[t];
      if (gp && gp.vibrationActuator) {
        gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: forte, weakMagnitude: forte * 0.6 });
      }
    } catch (e) { /* sem vibração */ }
  }

  // O jogo vai buscar a finta pedida (e esquece-a)
  function finta(t) { const f = fintaPedida[t]; fintaPedida[t] = null; return f; }

  return {
    ler, vibrar, finta,
    get aviso() { return aviso; },
    get ligados() { return nomes.length; },
  };
})();
