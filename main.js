// Futebol 26 — ciclo principal: atualiza o jogo e desenha 60 vezes por segundo

let ultimo = performance.now();
function ciclo(agora) {
  const dt = Math.min(0.033, (agora - ultimo) / 1000);
  ultimo = agora;
  update(dt);
  Render.desenhar(dt);
  Hud.desenhar();
  pressed.clear();
  released.clear();
  requestAnimationFrame(ciclo);
}
requestAnimationFrame(ciclo);
