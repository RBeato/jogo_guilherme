// Futebol 26 — sons (todos criados pelo código, sem ficheiros de som)
// Público, apito, chuto na bola, defesa e grito de golo.

const Som = (() => {
  let ac = null;
  let publico = null;    // ganho do barulho do público
  let grito = null;      // ganho do grito de golo
  let ruido = null;

  function criarRuido() {
    // "Ruído castanho": parece o murmúrio de muita gente ao longe
    const len = ac.sampleRate * 3;
    const buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3.5;
      }
    }
    return buf;
  }

  function camada(freq, q, vol) {
    const src = ac.createBufferSource();
    src.buffer = ruido;
    src.loop = true;
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(ac.destination);
    src.start();
    return g;
  }

  function iniciar() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    ruido = criarRuido();
    publico = camada(500, 0.6, 0.35);
    grito = camada(900, 0.8, 0);
  }

  function apito(longo) {
    if (!ac) return;
    const t = ac.currentTime;
    const toques = longo ? [0, 0.35, 0.7] : [0];
    for (const dt of toques) {
      const o = ac.createOscillator();
      o.type = 'square';
      o.frequency.value = 2900;
      // O "trrrr" do apito
      const lfo = ac.createOscillator();
      lfo.frequency.value = 32;
      const lfoG = ac.createGain();
      lfoG.gain.value = 120;
      lfo.connect(lfoG).connect(o.frequency);
      const f = ac.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 3;
      const g = ac.createGain();
      const dur = longo && dt === 0.7 ? 0.8 : 0.28;
      g.gain.setValueAtTime(0, t + dt);
      g.gain.linearRampToValueAtTime(0.12, t + dt + 0.02);
      g.gain.setValueAtTime(0.12, t + dt + dur - 0.05);
      g.gain.linearRampToValueAtTime(0, t + dt + dur);
      o.connect(f).connect(g).connect(ac.destination);
      o.start(t + dt); lfo.start(t + dt);
      o.stop(t + dt + dur + 0.05); lfo.stop(t + dt + dur + 0.05);
    }
  }

  function chuto(velocidade) {
    if (!ac) return;
    const t = ac.currentTime;
    const vol = Math.min(0.6, 0.15 + velocidade / 1500);
    const o = ac.createOscillator();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.16);
  }

  function animar(ganho, pico, dur) {
    if (!ac) return;
    const t = ac.currentTime;
    ganho.gain.cancelScheduledValues(t);
    ganho.gain.setValueAtTime(ganho.gain.value, t);
    ganho.gain.linearRampToValueAtTime(pico, t + 0.25);
    ganho.gain.linearRampToValueAtTime(pico * 0.7, t + dur * 0.6);
    ganho.gain.linearRampToValueAtTime(0, t + dur);
  }

  function golo() { if (grito) { animar(grito, 1.6, 4.5); } }
  function defesa() { if (grito) animar(grito, 0.5, 1.5); }

  // "Uuuuh!" do público quando a bola passa perto do poste
  function uh() {
    if (!ac) return;
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = ruido; src.loop = true;
    const f = ac.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 4;
    f.frequency.setValueAtTime(380, t);
    f.frequency.linearRampToValueAtTime(260, t + 1.4);   // a voz desce, como um "uuuh"
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(2.2, t + 0.2);
    g.gain.linearRampToValueAtTime(0, t + 1.5);
    src.connect(f).connect(g).connect(ac.destination);
    src.start(t); src.stop(t + 1.6);
  }

  // Palmas ritmadas da bancada: "palma, palma, palma-palma-palma"
  function palma(quando, vol) {
    const src = ac.createBufferSource();
    src.buffer = ruido;
    const f = ac.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 1200;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, quando);
    g.gain.exponentialRampToValueAtTime(0.001, quando + 0.09);
    src.connect(f).connect(g).connect(ac.destination);
    src.start(quando, Math.random() * 2, 0.1);
  }
  function palmas() {
    if (!ac) return;
    const t = ac.currentTime + 0.05;
    for (let rep = 0; rep < 3; rep++) {
      const b = t + rep * 1.6;
      for (const dt of [0, 0.4, 0.8, 1.0, 1.2]) palma(b + dt, 1.2);
    }
  }
  setInterval(() => { if (ac && Math.random() < 0.5) palmas(); }, 14000);

  return { iniciar, apito, chuto, golo, defesa, uh };
})();
