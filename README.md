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
| Com bola: passar (segurar = passe alto) · Sem bola: mudar de jogador | F | K |
| Com bola: rematar (segurar = força) · Sem bola: carrinho | G | L |
| Fintas: sozinho roleta · ↑ lambreta · ← → elástico · ↓ arrastar · 2× bicicleta · 2× + ↑ cueca | H | Ç |

No ecrã inicial: **1** joga contra o computador (carregar outra vez muda o nível), **2** joga a dois,
**3** 5 contra 5, **4** 11 contra 11.
**W/S** muda a equipa do J1, **↑/↓** a equipa do J2, **← →** o estádio. Durante o jogo, **N** liga/desliga o narrador
e **ESPAÇO** salta a repetição do golo.

### Com comando (como no FC 26 na Nintendo Switch)

Liga o comando ao computador (cabo ou Bluetooth) e carrega num botão. O 1.º comando é o J1, o 2.º é o J2.

| Botão | Com bola | Sem bola |
|-------|----------|----------|
| B | passe rasteiro | mudar de jogador |
| A | rematar (segurar = força) | desarme em pé |
| Y | passe alto / cruzamento (segurar = força) | carrinho |
| X | passe em profundidade | — |
| L | mudar de jogador | mudar de jogador |
| R (segurar) + A | remate colocado | — |
| ZR (segurar) | sprint | sprint |
| Analógico direito | fintas na direção para onde empurras (R3 = roleta) | — |
| + | começar / saltar a repetição | — |

No menu: L contra o computador · R 2 jogadores · ZL 5v5 · ZR 11v11 · cruz ↑↓ equipa · ←→ estádio.
Num comando de PlayStation é igual nas mesmas posições (B=✕, A=○, Y=□, X=△).

Nas bolas paradas quem marca não anda: usa as teclas de andar para apontar
(aparece uma seta no relvado) e depois passa ou remata.

## Ficheiros

- `game.js` — regras e lógica do jogo
- `render3d.js` — estádio, jogadores e câmara em 3D
- `hud.js` — placar, painéis dos jogadores e textos
- `audio.js` — sons
- `narrador.js` — narrador (voz do computador)
- `comando.js` — comandos (controlos do FC 26 na Switch)
- `equipas.js` — equipas, jogadores, classificações e PlayStyles
- `lib/three.min.js` — biblioteca three.js (r160, licença MIT em `lib/three-LICENSE`)

Ver [ESPECIFICACAO.md](ESPECIFICACAO.md) para tudo o que o jogo vai ter.
