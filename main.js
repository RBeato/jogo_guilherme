// Futebol 26 — ciclo principal: atualiza o jogo e desenha 60 vezes por segundo

let ultimo = performance.now();
// Mede a velocidade nos primeiros segundos de jogo; se estiver lento, baixa a qualidade
const medida = { t: 0, frames: 0, feita: false };
function ciclo(agora) {
  const real = (agora - ultimo) / 1000;
  const dt = Math.min(0.033, real);
  ultimo = agora;
  if (!medida.feita && state === 'jogo') {
    medida.t += real; medida.frames++;
    if (medida.t > 4) {
      medida.feita = true;
      if (medida.frames / medida.t < 35) Render.baixarQualidade();
    }
  }
  update(dt);
  Render.desenhar(dt);
  Hud.desenhar();
  pressed.clear();
  released.clear();
  requestAnimationFrame(ciclo);
}
requestAnimationFrame(ciclo);
