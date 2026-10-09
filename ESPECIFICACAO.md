# Jogo de Futebol do Guilherme — Especificação

Jogo de futebol 2D, inspirado no FC 26, para 1 ou 2 jogadores no mesmo teclado.
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

## 2. Controlos

| Ação            | Jogador 1        | Jogador 2         |
|-----------------|------------------|-------------------|
| Andar           | W A S D          | Setas             |
| Rematar         | F (segurar = mais força) | Enter (segurar = mais força) |
| Passar          | G                | Shift direito     |
| Correr (sprint) | Shift esquerdo   | Ctrl direito      |
| Carrinho        | Q                | . (ponto)         |
| Finta           | E                | , (vírgula)       |
| Mudar jogador   | R                | / (barra)         |

- O **guarda-redes é sempre controlado pelo computador**.
- O remate tem **barra de força**: quanto mais tempo se segura a tecla, mais forte.
- O sprint tem **barra de energia** que gasta e recupera.

## 3. Câmara e visual

- Vista **de cima**, a **câmara segue a bola**.
- Estilo **realista-simples**: relva com riscas, linhas do campo, balizas com rede,
  jogadores vistos de cima com camisola, calções e número.
- **No fundo do ecrã**: nome do jogador selecionado + o seu **PlayStyle**
  (um para cada jogador, para J1 à esquerda e J2 à direita).
- Placar no topo: equipas, golos, e quantos golos faltam para ganhar.

## 4. Equipas

Nomes reais e cores das camisolas (sem emblemas oficiais nem fotografias):

- **Clubes portugueses** (Benfica, Porto, Sporting, Braga, ...)
- **Grandes clubes europeus** (Real Madrid, Barcelona, Man City, Bayern, ...)
- **Seleções** (Portugal, Brasil, França, Argentina, ...)
- **Equipas inventadas** — o Guilherme escolhe nome e cores

Os jogadores têm **nomes reais**. Cada jogador tem um PlayStyle.

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
