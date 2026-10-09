// Futebol 26 — narrador (fala em português com a voz do próprio browser)
// Carrega N durante o jogo para ligar/desligar.

const Narrador = (() => {
  const temVoz = 'speechSynthesis' in window;
  let voz = null;
  let ligado = true;
  let ultimo = 0;

  function escolherVoz() {
    const vozes = speechSynthesis.getVoices();
    voz = vozes.find(v => v.lang === 'pt-PT') || vozes.find(v => v.lang && v.lang.startsWith('pt')) || null;
  }
  if (temVoz) {
    escolherVoz();
    speechSynthesis.onvoiceschanged = escolherVoz;
  }

  // prioridade: 0 = só se estiver calado há algum tempo, 1 = normal, 2 = importante, 3 = interrompe tudo
  function dizer(texto, prioridade = 1) {
    if (!temVoz || !ligado || !voz) return;   // sem voz portuguesa, fica calado (melhor do que sotaque inglês)
    const agora = performance.now();
    const ocupado = speechSynthesis.speaking || speechSynthesis.pending;
    if (prioridade === 0 && (ocupado || agora - ultimo < 3500)) return;
    if (prioridade === 1 && (ocupado || agora - ultimo < 1500)) return;
    if (prioridade === 2 && ocupado) speechSynthesis.cancel();
    if (prioridade >= 3) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.voice = voz;
    u.lang = voz.lang;
    u.rate = prioridade >= 3 ? 1.2 : 1.08;
    u.pitch = prioridade >= 3 ? 1.15 : 1;
    speechSynthesis.speak(u);
    ultimo = agora;
  }
  const umDe = lista => lista[Math.floor(Math.random() * lista.length)];

  return {
    alternar() {
      ligado = !ligado;
      if (!ligado && temVoz) speechSynthesis.cancel();
    },
    get ligado() { return ligado && !!voz; },
    get disponivel() { return !!voz; },
    inicio: () => dizer(umDe(['Apita o árbitro, começa o jogo!', 'Bola ao centro, vamos a isto!']), 2),
    golo: n => dizer(umDe([`Golo! Golo de ${n}!`, `Goooolo! ${n} não perdoa!`, `Que golo de ${n}!`, `${n}! Golo!`]), 3),
    autogolo: n => dizer(umDe([`Autogolo! Que azar de ${n}!`, 'Autogolo!']), 3),
    defesa: n => dizer(umDe([`Grande defesa de ${n}!`, `${n} defende!`, 'Que defesa!']), 2),
    remate: n => dizer(umDe([`${n} remata!`, `Remate de ${n}!`, `${n}!`]), 1),
    cabeca: n => dizer(umDe([`Cabeceia ${n}!`, `${n} de cabeça!`]), 1),
    passe: n => dizer(n, 0),
    falta: n => dizer(umDe([`Falta de ${n}.`, `O árbitro marca falta de ${n}.`]), 2),
    cartao: (n, cor) => dizer(cor === 'vermelho' ? `Cartão vermelho! ${n} vai para a rua!` : `Cartão amarelo para ${n}.`, 2),
    penalti: () => dizer('Penálti! O árbitro aponta para a marca!', 3),
    uh: () => dizer(umDe(['Uuuh, por pouco!', 'Ao lado! Quase golo!', 'Passou muito perto do poste!']), 2),
    canto: () => dizer('Canto.', 1),
    fim: eq => dizer(`Apita o árbitro, fim do jogo! Vitória de ${eq}!`, 3),
  };
})();
