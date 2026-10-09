# Futebol 26

Jogo de futebol 3D para 2 jogadores no mesmo teclado, inspirado no FC 26.
Portugal contra França, câmara de TV, estádio com adeptos.

## Como jogar

1. Descarrega o repositório (no GitHub: escolhe o ramo certo, depois **Code → Download ZIP**) e descompacta.
2. Abre o ficheiro `index.html` no Chrome ou Edge (duplo clique). Não precisa de internet.
3. Carrega **ESPAÇO** para começar.

| Ação | J1 (Portugal) | J2 (França) |
|------|---------------|-------------|
| Andar | W A S D | Setas |
| Com bola: passar · Sem bola: mudar de jogador | F | K |
| Com bola: rematar (segurar = força) · Sem bola: carrinho | G | L |

Nas bolas paradas quem marca não anda: usa as teclas de andar para apontar
(aparece uma seta no relvado) e depois passa ou remata.

## Ficheiros

- `game.js` — regras e lógica do jogo
- `render3d.js` — estádio, jogadores e câmara em 3D
- `hud.js` — placar, painéis dos jogadores e textos
- `audio.js` — sons
- `lib/three.min.js` — biblioteca three.js (r160, licença MIT em `lib/three-LICENSE`)

Ver [ESPECIFICACAO.md](ESPECIFICACAO.md) para tudo o que o jogo vai ter.
