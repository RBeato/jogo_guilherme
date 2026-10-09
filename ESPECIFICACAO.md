# Jogo de Futebol do Guilherme — Especificação

Jogo de futebol 3D, inspirado no FC 26, para 1 ou 2 jogadores no mesmo teclado.
Corre no browser (Chrome, Edge, Firefox) — basta abrir o ficheiro, não é preciso instalar nada.

## 1. Ecrã inicial (menu)

- **1 Jogador — contra o computador** (nível: fácil / médio / difícil)
- **1 Jogador — treino** (sem adversário, só contra o guarda-redes)
- **2 Jogadores** (um contra o outro no mesmo teclado)
- **Modo Penáltis** (desempate só de penáltis)
- Antes de cada jogo escolhe-se:
  - as equipas
  - o número de jogadores: **5v5, 7v7 ou 11v11**
  - quantos golos para ganhar (**primeiro a 3, 5 ou 7**)
  - fora de jogo: **ligado / desligado**

## 2. Controlos (só 2 botões — decidido pelo Guilherme)

| Ação                         | Jogador 1 | Jogador 2 |
|------------------------------|-----------|-----------|
| Andar                        | W A S D   | Setas     |
| Botão 1: com bola **passar** · sem bola **mudar de jogador** | F | K |
| Botão 2: com bola **rematar** (segurar = força) · sem bola **carrinho** | G | L |

- Correr é automático (não há tecla de sprint).
- O botão 2 só faz carrinho quando é o **adversário** que tem a bola. Com a bola solta ou com
  um colega, carrega o remate — dá para **rematar de primeira** quando a bola chega.
- O **guarda-redes é sempre controlado pelo computador**.
- Fintas: ainda por decidir como fazer sem acrescentar teclas.

## 3. Câmara e visual

- **3D**, com **câmara de TV**: vista de lado, da bancada, a seguir a bola.
- Estádio à noite com holofotes, bancadas cheias de adeptos que saltam nos golos,
  placas de publicidade LED, balizas com rede, relva com riscas.
- Jogadores 3D simples (sem cara), com camisola, número nas costas, calções e meias.
- **No fundo do ecrã**: **nome do jogador em destaque** + **emblema dourado do PlayStyle**
  (J1 à esquerda, J2 à direita).
- Sons: público, palmas ritmadas, "uuuh" quando a bola passa perto, apito, chuto, grito de golo.
- Árbitro (mostra os cartões) e dois fiscais de linha (levantam a bandeira quando a bola sai).
- Depois de cada golo: festejo e **repetição em câmara lenta** com a câmara atrás da baliza
  (ESPAÇO para saltar). A rede abana quando a bola entra.
- O guarda-redes atira-se para o lado nos remates.
- Ecrã gigante no estádio com o resultado.
- O jogador vira-se aos poucos e vai dando toques na bola quando corre com ela.

## 4. Equipas

Nomes reais e cores das camisolas (sem emblemas oficiais nem fotografias):

- **Clubes portugueses** (Benfica, Porto, Sporting, Braga, ...)
- **Grandes clubes europeus** (Real Madrid, Barcelona, Man City, Bayern, ...)
- **Seleções** (Portugal, Brasil, França, Argentina, ...)
- **Equipas inventadas** — o Guilherme escolhe nome e cores

Os jogadores têm **nomes reais**. Cada jogador tem um PlayStyle.
Por agora o jogo é sempre **Portugal vs França** (5 jogadores cada).

## 5. Regras

- Ganha quem chegar primeiro ao número de golos escolhido.
- **Faltas e cartões** (carrinho por trás ou falhado = falta; amarelo / vermelho)
- **Cantos e lançamentos laterais**
- **Fora de jogo** (pode ser desligado no menu)
- **Penáltis** — modo próprio no menu

## 6. PlayStyles (inspirados no FC 26)

Cada PlayStyle tem de mudar alguma coisa no jogo de verdade. Exemplos:

| PlayStyle       | Efeito no jogo |
|-----------------|----------------|
| Remate Potente  | Remate mais rápido |
| Remate Colocado | Remate em curva, mais difícil para o GR |
| Trivela         | Remate com a parte de fora do pé, curva ao contrário |
| Chapéu          | Remate por cima do guarda-redes |
| Rápido          | Velocidade máxima maior |
| Incansável      | Barra de sprint dura mais |
| Técnico         | Fintas mais eficazes |
| Passe Preciso   | Passes mais certeiros |
| Passe Longo     | Passes longos mais rápidos e precisos |
| Tiki-Taka       | Passes curtos de primeira mais rápidos |
| Carrinho        | Carrinhos roubam mais a bola e fazem menos faltas |
| Muralha         | Mais difícil tirar-lhe a bola |
| Intercetor      | Corta mais passes |
| Primeiro Toque  | Controla a bola melhor ao receber |

PlayStyles que dependem de cabeceamentos e bolas altas (ex: Cabeceamento Potente,
Fortaleza Aérea) só entram se o jogo tiver bola no ar — ver secção 8.

## 7. Extras

- **Sons**: apito, chuto, público, "GOLO!"
- **Repetição do golo**
- **Celebrações** depois de marcar
- **Estatísticas no fim**: remates, posse de bola, marcadores

## 8. Decisões técnicas e riscos

- Feito em **HTML + JavaScript** (canvas), sem instalar programas.
- **11v11 contra o computador** é a parte mais difícil: 21 jogadores controlados
  pelo computador precisam de saber onde se posicionar. Começamos por 5v5.
- **Plantéis reais mudam** todos os verões: os nomes vão ficar desatualizados
  com o tempo. Ficam num ficheiro à parte para ser fácil atualizar.
- **Bola no ar**: em vista de cima, a altura da bola é mostrada com uma sombra.
  Precisa disto para chapéus, cruzamentos e cabeceamentos.

## 9. Regra do guarda-redes (decidida pelo Guilherme)

O guarda-redes **defende se o remate não for potente nem colocado**:

| Remate                     | O GR defende |
|----------------------------|--------------|
| Fraco e ao meio            | quase sempre |
| Potente **ou** colocado    | às vezes (35%) |
| Potente **e** colocado     | raramente (10%) |

- **Potente** = segurar a tecla de rematar até a barra passar dos 70%.
- **Colocado** = rematar na diagonal (ex: D+W ou D+S) virado para a baliza → vai para o canto.

## 10. Plano por fases

1. **Fase 1** ✅ — campo, bola, 5v5, andar/passar/rematar, golos, placar, 2 jogadores
   - ✅ adiantado: carrinho, faltas, cartões amarelo/vermelho, livres, penáltis,
     cantos, lançamentos laterais, pontapés de baliza
2. **Fase 2** — computador a jogar (fácil/médio/difícil), menu
3. **Fase 3** — sprint, fintas
4. **Fase 4** — equipas reais, nomes, PlayStyles com efeito, painel no fundo do ecrã
5. **Fase 5** — 7v7 e 11v11, fora de jogo, modo penáltis, modo treino
6. **Fase 6** — sons, repetição, celebrações, estatísticas
