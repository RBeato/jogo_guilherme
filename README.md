# Futebol 26

Jogo de futebol 3D para 2 jogadores no mesmo teclado, inspirado no FC 26.
18 equipas, 7 estádios, câmara de TV, estádio com adeptos.

## Como jogar

1. Descarrega o repositório (no GitHub: escolhe o ramo certo, depois **Code → Download ZIP**) e descompacta.
2. Abre o ficheiro `index.html` no Chrome ou Edge (duplo clique). Não precisa de internet.
3. Carrega **ESPAÇO** para começar.

| Ação | J1 | J2 |
|------|---------------|-------------|
| Andar | W A S D | Setas |
| Com bola: passar · Sem bola: mudar de jogador | F | K |
| Com bola: rematar (segurar = força) · Sem bola: carrinho | G | L |

No ecrã inicial: **W/S** muda a equipa do J1, **↑/↓** a equipa do J2, **← →** o estádio. Durante o jogo, **N** liga/desliga o narrador
e **ESPAÇO** salta a repetição do golo.

Nas bolas paradas quem marca não anda: usa as teclas de andar para apontar
(aparece uma seta no relvado) e depois passa ou remata.

## Ficheiros

- `game.js` — regras e lógica do jogo
- `render3d.js` — estádio, jogadores e câmara em 3D
- `hud.js` — placar, painéis dos jogadores e textos
- `audio.js` — sons
- `narrador.js` — narrador (voz do computador)
- `equipas.js` — equipas, jogadores, classificações e PlayStyles
- `lib/three.min.js` — biblioteca three.js (r160, licença MIT em `lib/three-LICENSE`)

Ver [ESPECIFICACAO.md](ESPECIFICACAO.md) para tudo o que o jogo vai ter.
