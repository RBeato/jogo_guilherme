// Futebol 26 — narrador (fala em português com a voz do próprio browser)
// Carrega N durante o jogo para ligar/desligar.
// O Guilherme pediu um comentador homem e animado: procuramos uma voz masculina em português.
// As vozes dependem do computador; se só houver voz de mulher, usamos essa com o tom mais grave.

const Narrador = (() => {
  const temVoz = 'speechSynthesis' in window;
  let voz = null;
  let masculina = false;
  let ligado = true;
  let ultimo = 0;

  // Nomes de vozes masculinas em português (Windows, Edge, Mac, Android, Chrome)
  const NOMES_HOMEM = /duarte|cristiano|ant[oó]nio|daniel|donato|f[aá]bio|felipe|humberto|j[uú]lio|nicolau|valerio|thiago|macerio|rui|male|mascul/i;

  function escolherVoz() {
    const vozes = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('pt'));
    const pt = v => v.lang.toLowerCase() === 'pt-pt';
    const homem = v => NOMES_HOMEM.test(v.name);
    // Preferência: homem de Portugal → homem do Brasil → qualquer voz de Portugal → qualquer voz portuguesa
    voz = vozes.find(v => pt(v) && homem(v)) || vozes.find(homem) || vozes.find(pt) || vozes[0] || null;
    masculina = !!(voz && homem(voz));
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
    // Animado: fala depressa e com mais energia nos momentos grandes
    u.rate = prioridade >= 3 ? 1.3 : prioridade === 2 ? 1.2 : 1.15;
    const base = masculina ? 1 : 0.7;          // voz de mulher: tom mais grave
    u.pitch = base + (prioridade >= 3 ? 0.2 : prioridade === 2 ? 0.1 : 0);
    u.volume = 1;
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
    get nomeVoz() { return voz ? voz.name : ''; },
    get masculina() { return masculina; },
    inicio: () => dizer(umDe([
      'Apita o árbitro, começa o jogo! Vamos a isto!',
      'Bola ao centro! Que jogo que aí vem, meus amigos!',
      'Está a começar! Estádio cheio, ambiente fantástico!',
    ]), 2),
    golo: n => dizer(umDe([
      `Goooooooolo! Golo de ${n}!`,
      `Golo, golo, golo! ${n}! Que golaço!`,
      `Goooolo! ${n} não perdoa! Que maravilha!`,
      `É golo! ${n}! O estádio vem abaixo!`,
      `Inacreditável! ${n}! Goooolo!`,
    ]), 3),
    autogolo: n => dizer(umDe([`Autogolo! Que azar de ${n}!`, 'Oh não! Autogolo! Que infelicidade!']), 3),
    siu: () => dizer('Siiiiiiuuuuuuu!', 3),
    defesa: n => dizer(umDe([`Que defesa! ${n}!`, `Grande defesa de ${n}!`, `${n} voa e defende! Espetacular!`, 'Uau! Que defesa!']), 2),
    remate: n => dizer(umDe([`${n} remata!`, `Remate de ${n}!`, `${n}, atenção!`, `${n} tenta!`]), 1),
    cabeca: n => dizer(umDe([`Cabeceia ${n}!`, `${n} de cabeça!`, `Sobe ${n}!`]), 1),
    passe: n => dizer(n, 0),
    falta: n => dizer(umDe([`Falta de ${n}!`, `O árbitro apita! Falta de ${n}.`, `Ui, entrada dura de ${n}!`]), 2),
    cartao: (n, cor) => dizer(cor === 'vermelho' ? `Cartão vermelho! ${n} vai para a rua!` : `Cartão amarelo para ${n}! Cuidado!`, 2),
    penalti: () => dizer('Penálti! Penálti! O árbitro aponta para a marca!', 3),
    uh: () => dizer(umDe(['Uuuuh! Por pouco!', 'Ao lado! Quase, quase!', 'Ai! Passou a raspar o poste!', 'Uiii! Que perigo!']), 2),
    canto: () => dizer(umDe(['Canto!', 'É canto!']), 1),
    penaltis: () => dizer('Fim do tempo! Está tudo empatado! Vamos para os penáltis! Que emoção!', 3),
    fim: eq => dizer(`Apita o árbitro! Acabou! Vitória de ${eq}! Que jogo fantástico!`, 3),
  };
})();
