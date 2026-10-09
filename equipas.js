// Futebol 26 — equipas e jogadores
//
// Os nomes dos jogadores têm um "i" no fim do apelido (decisão do Guilherme),
// como nos jogos de futebol antigos sem licença. Classificações e atributos são
// estimativas nossas, não são os números oficiais do FC 26. Os plantéis mudam
// todas as épocas: alguns jogadores podem já ter mudado de clube.

const PELE = { c: '#ecc19c', t: '#d9a273', m: '#c68642', e: '#6b4226', n: '#4a2c1a' };
const CAB = { p: '#0d0d0d', e: '#1b1209', c: '#3b2412', l: '#c9a15b', r: '#9c4a1a', g: '#8a8a8a' };

// j(nome, número, posição, classificação, atributos, PlayStyle, aspeto, nome curto para o narrador)
//   atributos: [ritmo, remate, passe, drible, defesa, físico]  ou  um número = reflexos (guarda-redes)
//   aspeto: 'pele cabelo estilo barba [cor das botas]', ex.: 'e p rapado 0 #ff6b00'
function j(nome, num, posicao, ovr, at, ps, aspeto, chamado) {
  const [pele, cab, estilo, barba, botas] = aspeto.split(' ');
  const atributos = typeof at === 'number' ? { ref: at }
    : { rit: at[0], rem: at[1], pas: at[2], dri: at[3], def: at[4], fis: at[5] };
  return {
    nome, num, posicao, ovr, at: atributos, ps, chamado,
    pele: PELE[pele], cabelo: CAB[cab], estilo, barba: barba === '1', botas,
  };
}

// equipa(nome, sigla, grupo, cores do equipamento, equipamento alternativo, bandeira, plantel)
// A ordem do plantel é: guarda-redes, defesa, defesa, médio, avançado.
function equipa(nome, curto, grupo, kit, alt, bandeira, plantel) {
  return { nome, curto, grupo, ...kit, alt, bandeira, plantel };
}

const TODAS_EQUIPAS = [
  // ---------- Seleções ----------
  equipa('PORTUGAL', 'POR', 'Seleções',
    { camisola: '#c8102e', calcoes: '#00573f', meias: '#c8102e', numero: '#ffd60a', gola: '#ffd60a', gr: '#2b9348' },
    { camisola: '#f2f2f2', calcoes: '#f2f2f2', meias: '#f2f2f2', numero: '#c8102e', gola: '#00573f' },
    { tipo: 'pt' }, [
      j('Diogo Costai', 22, 'GR', 84, 86, 'Reflexos', 't e curto 1', 'Diogo Costai'),
      j('Rúben Diasi', 4, 'DC', 88, [63, 39, 66, 68, 89, 88], 'Muralha', 't e curto 1', 'Rúben Diasi'),
      j('Nuno Mendesi', 19, 'DE', 86, [91, 65, 77, 84, 80, 79], 'Rápido', 'e p volume 0', 'Nuno Mendesi'),
      j('Bruno Fernandesi', 8, 'MCO', 87, [74, 86, 89, 83, 69, 77], 'Passe Incisivo', 't c curto 1', 'Bruno Fernandesi'),
      j('Cristiano Ronaldoi', 7, 'PL', 85, [77, 88, 75, 79, 34, 77], 'Remate Potente', 't e topete 0 #f5f5f5'),
    ]),
  equipa('FRANÇA', 'FRA', 'Seleções',
    { camisola: '#1d3f8f', calcoes: '#ffffff', meias: '#c8102e', numero: '#ffffff', gola: '#ffffff', gr: '#c5e13a' },
    { camisola: '#f2f2f2', calcoes: '#1d3f8f', meias: '#f2f2f2', numero: '#1d3f8f', gola: '#c8102e' },
    { tipo: 'v', cores: ['#002654', '#ffffff', '#ce1126'] }, [
      j('Mike Maignani', 16, 'GR', 87, 89, 'Reflexos', 'e p rapado 1'),
      j('William Salibai', 17, 'DC', 87, [81, 40, 70, 73, 88, 84], 'Muralha', 'n p rapado 0'),
      j('Theo Hernándezi', 22, 'DE', 84, [89, 72, 76, 80, 77, 82], 'Carrinho', 't e curto 1', 'Theoi'),
      j('Aurélien Tchouaménii', 8, 'MDC', 85, [72, 73, 80, 78, 84, 85], 'Intercetor', 'n p volume 0'),
      j('Kylian Mbappéi', 10, 'PL', 91, [97, 90, 80, 92, 36, 78], 'Remate Colocado', 'e p rapado 0 #ff6b00'),
    ]),
  equipa('BRASIL', 'BRA', 'Seleções',
    { camisola: '#ffdf00', calcoes: '#0b3d91', meias: '#ffffff', numero: '#0b3d91', gola: '#009c3b', gr: '#111111' },
    { camisola: '#0b3d91', calcoes: '#ffffff', meias: '#0b3d91', numero: '#ffffff', gola: '#ffdf00' },
    { tipo: 'br' }, [
      j('Alisson Beckeri', 1, 'GR', 89, 88, 'Reflexos', 'c c curto 1', 'Alissoni'),
      j('Marquinhosi', 4, 'DC', 86, [72, 50, 74, 72, 87, 80], 'Intercetor', 'm c curto 1'),
      j('Éder Militãoi', 3, 'DC', 85, [82, 50, 68, 70, 85, 84], 'Muralha', 'e p rapado 0'),
      j('Bruno Guimarãesi', 5, 'MC', 86, [70, 78, 85, 84, 78, 82], 'Passe Incisivo', 'c p curto 1', 'Bruno Guimarãesi'),
      j('Vinícius Júniori', 7, 'PL', 90, [95, 83, 81, 92, 29, 68], 'Rápido', 'n p volume 0 #ff2d55', 'Viníciusi'),
    ]),
  equipa('ARGENTINA', 'ARG', 'Seleções',
    { camisola: '#75aadb', calcoes: '#111111', meias: '#ffffff', numero: '#111111', gola: '#ffffff', gr: '#e9ff70' },
    { camisola: '#1d2b5a', calcoes: '#1d2b5a', meias: '#1d2b5a', numero: '#75aadb', gola: '#75aadb' },
    { tipo: 'h', cores: ['#75aadb', '#ffffff', '#75aadb'], sol: true }, [
      j('Emiliano Martínezi', 23, 'GR', 87, 87, 'Reflexos', 'c e curto 1', 'Dibui'),
      j('Cristian Romeroi', 13, 'DC', 86, [74, 45, 64, 68, 87, 84], 'Carrinho', 'c e curto 1', 'Romeroi'),
      j('Lisandro Martínezi', 25, 'DC', 84, [72, 50, 74, 72, 85, 80], 'Muralha', 'c e curto 1', 'Lisandroi'),
      j('Enzo Fernándezi', 24, 'MC', 85, [72, 77, 86, 82, 74, 78], 'Passe Incisivo', 'c c volume 0', 'Enzoi'),
      j('Lionel Messii', 10, 'PL', 88, [78, 88, 90, 92, 33, 64], 'Remate Colocado', 'c c curto 1', 'Messii'),
    ]),
  equipa('ESPANHA', 'ESP', 'Seleções',
    { camisola: '#c60b1e', calcoes: '#0b2a6f', meias: '#0b2a6f', numero: '#ffd60a', gola: '#ffd60a', gr: '#2b9348' },
    { camisola: '#f2f2f2', calcoes: '#f2f2f2', meias: '#f2f2f2', numero: '#c60b1e', gola: '#ffd60a' },
    { tipo: 'h', cores: ['#c60b1e', '#ffc400', '#ffc400', '#c60b1e'] }, [
      j('Unai Simóni', 23, 'GR', 84, 85, 'Reflexos', 'c e curto 1', 'Unai Simóni'),
      j('Pau Cubarsíi', 5, 'DC', 84, [70, 40, 78, 72, 85, 78], 'Intercetor', 'c c curto 0', 'Cubarsíi'),
      j('Marc Cucurellai', 24, 'DE', 84, [80, 58, 76, 80, 82, 78], 'Carrinho', 't c volume 0', 'Cucurellai'),
      j('Pedrii', 26, 'MC', 88, [76, 74, 89, 90, 68, 70], 'Passe Incisivo', 'c c curto 0'),
      j('Lamine Yamali', 19, 'PL', 90, [89, 80, 86, 92, 32, 64], 'Remate Colocado', 'e p curto 0 #ffd60a', 'Yamali'),
    ]),
  equipa('INGLATERRA', 'ING', 'Seleções',
    { camisola: '#f5f5f5', calcoes: '#0b2a6f', meias: '#f5f5f5', numero: '#0b2a6f', gola: '#0b2a6f', gr: '#f4d03f' },
    { camisola: '#c8102e', calcoes: '#c8102e', meias: '#c8102e', numero: '#ffffff', gola: '#0b2a6f' },
    { tipo: 'cruz' }, [
      j('Jordan Pickfordi', 1, 'GR', 83, 84, 'Reflexos', 'c l curto 1', 'Pickfordi'),
      j('Marc Guéhii', 6, 'DC', 83, [74, 40, 70, 70, 84, 82], 'Muralha', 'n p rapado 0', 'Guéhii'),
      j('Declan Ricei', 4, 'MDC', 87, [75, 72, 84, 80, 84, 85], 'Intercetor', 'c c curto 0', 'Ricei'),
      j('Jude Bellinghami', 10, 'MCO', 89, [80, 84, 85, 88, 75, 84], 'Passe Incisivo', 'e p curto 0', 'Bellinghami'),
      j('Harry Kanei', 9, 'PL', 90, [68, 93, 84, 82, 47, 82], 'Remate Potente', 'c c curto 0', 'Kanei'),
    ]),
  equipa('ALEMANHA', 'ALE', 'Seleções',
    { camisola: '#f5f5f5', calcoes: '#111111', meias: '#f5f5f5', numero: '#111111', gola: '#111111', gr: '#2b9348' },
    { camisola: '#1a1a1a', calcoes: '#1a1a1a', meias: '#1a1a1a', numero: '#ffce00', gola: '#dd0000' },
    { tipo: 'h', cores: ['#111111', '#dd0000', '#ffce00'] }, [
      j('Oliver Baumanni', 1, 'GR', 82, 83, 'Reflexos', 'c c curto 0', 'Baumanni'),
      j('Antonio Rüdigeri', 2, 'DC', 86, [80, 50, 70, 68, 86, 87], 'Muralha', 'n p rapado 1', 'Rüdigeri'),
      j('Joshua Kimmichi', 6, 'DE', 86, [70, 72, 89, 82, 80, 76], 'Passe Incisivo', 'c l curto 0', 'Kimmichi'),
      j('Florian Wirtzi', 17, 'MCO', 88, [80, 82, 87, 90, 50, 66], 'Remate Colocado', 'c c curto 0', 'Wirtzi'),
      j('Jamal Musialai', 10, 'PL', 88, [83, 80, 82, 92, 40, 64], 'Rápido', 'm p curto 0', 'Musialai'),
    ]),

  // ---------- Clubes portugueses ----------
  equipa('BENFICA', 'SLB', 'Clubes portugueses',
    { camisola: '#e30613', calcoes: '#ffffff', meias: '#e30613', numero: '#ffffff', gola: '#ffffff', gr: '#ffd60a' },
    { camisola: '#1a1a1a', calcoes: '#1a1a1a', meias: '#1a1a1a', numero: '#e30613', gola: '#e30613' },
    { tipo: 'v', cores: ['#e30613', '#ffffff'] }, [
      j('Anatoliy Trubini', 1, 'GR', 82, 83, 'Reflexos', 'c l curto 0', 'Trubini'),
      j('António Silvai', 4, 'DC', 80, [72, 40, 68, 66, 81, 80], 'Muralha', 'c c curto 0', 'António Silvai'),
      j('Nicolás Otamendii', 30, 'DC', 80, [55, 50, 66, 62, 81, 82], 'Carrinho', 'c e curto 1', 'Otamendii'),
      j('Orkun Kökçüi', 10, 'MC', 81, [70, 78, 84, 82, 62, 68], 'Passe Incisivo', 'c e curto 1', 'Kökçüi'),
      j('Vangelis Pavlidisi', 14, 'PL', 80, [76, 82, 70, 76, 40, 78], 'Remate Potente', 'c e curto 1', 'Pavlidisi'),
    ]),
  equipa('FC PORTO', 'FCP', 'Clubes portugueses',
    { camisola: '#0055a4', calcoes: '#0055a4', meias: '#0055a4', numero: '#ffffff', gola: '#ffffff', gr: '#ffd60a' },
    { camisola: '#f7941d', calcoes: '#1a1a1a', meias: '#f7941d', numero: '#1a1a1a', gola: '#1a1a1a' },
    { tipo: 'v', cores: ['#0055a4', '#ffffff'] }, [
      j('Diogo Costai', 99, 'GR', 84, 86, 'Reflexos', 't e curto 1', 'Diogo Costai'),
      j('Nehuén Pérezi', 3, 'DC', 78, [70, 40, 62, 62, 79, 80], 'Muralha', 'c e curto 1', 'Nehuén Pérezi'),
      j('Francisco Mourai', 74, 'DE', 77, [82, 60, 72, 75, 74, 72], 'Rápido', 'c c curto 0', 'Mourai'),
      j('Alan Varelai', 22, 'MDC', 80, [68, 66, 78, 76, 79, 78], 'Intercetor', 'c e curto 1', 'Varelai'),
      j('Samu Aghehowai', 9, 'PL', 80, [82, 80, 62, 74, 38, 85], 'Remate Potente', 'n p curto 0', 'Samui'),
    ]),
  equipa('SPORTING', 'SCP', 'Clubes portugueses',
    { camisola: '#008057', calcoes: '#1a1a1a', meias: '#008057', numero: '#ffffff', gola: '#ffffff', gr: '#ffd60a' },
    { camisola: '#f5f5f5', calcoes: '#f5f5f5', meias: '#f5f5f5', numero: '#008057', gola: '#008057' },
    { tipo: 'h', cores: ['#008057', '#ffffff', '#008057', '#ffffff'] }, [
      j('Rui Silvai', 1, 'GR', 80, 81, 'Reflexos', 'c e curto 1', 'Rui Silvai'),
      j('Ousmane Diomandei', 26, 'DC', 81, [76, 38, 64, 66, 82, 84], 'Muralha', 'n p rapado 0', 'Diomandei'),
      j('Maxi Araújoi', 20, 'DE', 78, [84, 62, 72, 76, 74, 74], 'Rápido', 'c e curto 0', 'Maxi Araújoi'),
      j('Morten Hjulmandi', 42, 'MDC', 81, [64, 66, 78, 74, 80, 80], 'Intercetor', 'c l curto 1', 'Hjulmandi'),
      j('Luis Suárezi', 97, 'PL', 80, [78, 82, 66, 76, 36, 80], 'Remate Potente', 'm p curto 0', 'Suárezi'),
    ]),
  equipa('SC BRAGA', 'SCB', 'Clubes portugueses',
    { camisola: '#d71920', calcoes: '#ffffff', meias: '#ffffff', numero: '#ffffff', gola: '#ffffff', gr: '#2b9348' },
    { camisola: '#f5f5f5', calcoes: '#d71920', meias: '#d71920', numero: '#d71920', gola: '#d71920' },
    { tipo: 'v', cores: ['#d71920', '#ffffff'] }, [
      j('Lukáš Horníčeki', 1, 'GR', 76, 77, 'Reflexos', 'c c curto 0', 'Horníčeki'),
      j('Paulo Oliveirai', 15, 'DC', 74, [58, 40, 60, 58, 76, 78], 'Muralha', 'c e curto 1', 'Paulo Oliveirai'),
      j('Bright Arrey-Mbii', 26, 'DC', 75, [76, 40, 60, 62, 75, 80], 'Carrinho', 'n p rapado 0', 'Arrey-Mbii'),
      j('Rodrigo Zalazari', 10, 'MC', 79, [72, 78, 78, 80, 60, 70], 'Passe Incisivo', 'c c curto 0', 'Zalazari'),
      j('Ricardo Hortai', 21, 'PL', 79, [74, 80, 78, 80, 38, 64], 'Remate Colocado', 'c e curto 1', 'Hortai'),
    ]),

  // ---------- Clubes europeus ----------
  equipa('REAL MADRID', 'RMA', 'Clubes europeus',
    { camisola: '#f5f5f5', calcoes: '#f5f5f5', meias: '#f5f5f5', numero: '#c9a227', gola: '#c9a227', gr: '#1a1a1a' },
    { camisola: '#1a1a1a', calcoes: '#1a1a1a', meias: '#1a1a1a', numero: '#c9a227', gola: '#c9a227' },
    { tipo: 'v', cores: ['#ffffff', '#c9a227', '#ffffff'] }, [
      j('Thibaut Courtoisi', 1, 'GR', 89, 89, 'Reflexos', 'c c curto 1', 'Courtoisi'),
      j('Antonio Rüdigeri', 22, 'DC', 86, [80, 50, 70, 68, 86, 87], 'Muralha', 'n p rapado 1', 'Rüdigeri'),
      j('Federico Valverdei', 8, 'MC', 88, [86, 84, 84, 82, 80, 84], 'Remate Potente', 'c c curto 1', 'Valverdei'),
      j('Jude Bellinghami', 5, 'MCO', 89, [80, 84, 85, 88, 75, 84], 'Passe Incisivo', 'e p curto 0', 'Bellinghami'),
      j('Kylian Mbappéi', 10, 'PL', 91, [97, 90, 80, 92, 36, 78], 'Remate Colocado', 'e p rapado 0 #ff6b00'),
    ]),
  equipa('BARCELONA', 'BAR', 'Clubes europeus',
    { camisola: '#a50044', calcoes: '#004d98', meias: '#004d98', numero: '#ffd60a', gola: '#ffd60a', gr: '#f4d03f' },
    { camisola: '#ffd60a', calcoes: '#ffd60a', meias: '#ffd60a', numero: '#a50044', gola: '#a50044' },
    { tipo: 'v', cores: ['#004d98', '#a50044', '#004d98', '#a50044'] }, [
      j('Joan Garcíai', 13, 'GR', 84, 85, 'Reflexos', 'c c curto 0', 'Joan Garcíai'),
      j('Pau Cubarsíi', 2, 'DC', 84, [70, 40, 78, 72, 85, 78], 'Intercetor', 'c c curto 0', 'Cubarsíi'),
      j('Jules Koundéi', 23, 'DE', 85, [84, 50, 74, 78, 85, 76], 'Carrinho', 'e p curto 0', 'Koundéi'),
      j('Pedrii', 8, 'MC', 88, [76, 74, 89, 90, 68, 70], 'Passe Incisivo', 'c c curto 0'),
      j('Lamine Yamali', 10, 'PL', 90, [89, 80, 86, 92, 32, 64], 'Remate Colocado', 'e p curto 0 #ffd60a', 'Yamali'),
    ]),
  equipa('MANCHESTER CITY', 'MCI', 'Clubes europeus',
    { camisola: '#6cabdd', calcoes: '#ffffff', meias: '#6cabdd', numero: '#ffffff', gola: '#1c2c5b', gr: '#f4d03f' },
    { camisola: '#1c2c5b', calcoes: '#1c2c5b', meias: '#1c2c5b', numero: '#6cabdd', gola: '#6cabdd' },
    { tipo: 'v', cores: ['#6cabdd', '#ffffff', '#6cabdd'] }, [
      j('Gianluigi Donnarummai', 25, 'GR', 88, 89, 'Reflexos', 'c e curto 1', 'Donnarummai'),
      j('Rúben Diasi', 3, 'DC', 88, [63, 39, 66, 68, 89, 88], 'Muralha', 't e curto 1', 'Rúben Diasi'),
      j('Joško Gvardioli', 24, 'DE', 85, [80, 66, 78, 78, 84, 82], 'Rápido', 'c c curto 0', 'Gvardioli'),
      j('Rodrii', 16, 'MDC', 89, [64, 80, 87, 82, 86, 84], 'Intercetor', 'c c curto 1'),
      j('Erling Haalandi', 9, 'PL', 91, [89, 94, 66, 80, 45, 90], 'Remate Potente', 'c l curto 0 #f5f5f5', 'Haalandi'),
    ]),
  equipa('BAYERN', 'BAY', 'Clubes europeus',
    { camisola: '#dc052d', calcoes: '#dc052d', meias: '#dc052d', numero: '#ffffff', gola: '#ffffff', gr: '#2b9348' },
    { camisola: '#f5f5f5', calcoes: '#f5f5f5', meias: '#f5f5f5', numero: '#dc052d', gola: '#dc052d' },
    { tipo: 'v', cores: ['#dc052d', '#ffffff', '#0066b2'] }, [
      j('Manuel Neueri', 1, 'GR', 86, 85, 'Reflexos', 'c l curto 0', 'Neueri'),
      j('Dayot Upamecanoi', 2, 'DC', 84, [80, 40, 66, 66, 85, 86], 'Muralha', 'n p rapado 0', 'Upamecanoi'),
      j('Alphonso Daviesi', 19, 'DE', 83, [95, 62, 74, 82, 76, 74], 'Rápido', 'n p curto 0', 'Daviesi'),
      j('Joshua Kimmichi', 6, 'MC', 87, [70, 72, 89, 82, 80, 76], 'Passe Incisivo', 'c l curto 0', 'Kimmichi'),
      j('Harry Kanei', 9, 'PL', 90, [68, 93, 84, 82, 47, 82], 'Remate Potente', 'c c curto 0', 'Kanei'),
    ]),
  equipa('LIVERPOOL', 'LIV', 'Clubes europeus',
    { camisola: '#c8102e', calcoes: '#c8102e', meias: '#c8102e', numero: '#ffffff', gola: '#ffffff', gr: '#2b9348' },
    { camisola: '#f2f2f2', calcoes: '#f2f2f2', meias: '#f2f2f2', numero: '#c8102e', gola: '#00a398' },
    { tipo: 'v', cores: ['#c8102e', '#ffffff', '#c8102e'] }, [
      j('Alisson Beckeri', 1, 'GR', 89, 88, 'Reflexos', 'c c curto 1', 'Alissoni'),
      j('Virgil van Dijki', 4, 'DC', 89, [76, 60, 72, 72, 90, 88], 'Muralha', 'n p rapado 1', 'Van Dijki'),
      j('Ibrahima Konatéi', 5, 'DC', 85, [82, 40, 62, 64, 86, 87], 'Carrinho', 'n p rapado 0', 'Konatéi'),
      j('Florian Wirtzi', 7, 'MCO', 88, [80, 82, 87, 90, 50, 66], 'Remate Colocado', 'c c curto 0', 'Wirtzi'),
      j('Mohamed Salahi', 11, 'PL', 90, [89, 88, 82, 88, 45, 76], 'Remate Colocado', 'm p volume 1', 'Salahi'),
    ]),
  equipa('PARIS SG', 'PSG', 'Clubes europeus',
    { camisola: '#004170', calcoes: '#004170', meias: '#004170', numero: '#ffffff', gola: '#da291c', gr: '#ffd60a' },
    { camisola: '#f5f5f5', calcoes: '#f5f5f5', meias: '#f5f5f5', numero: '#004170', gola: '#da291c' },
    { tipo: 'v', cores: ['#004170', '#da291c', '#004170'] }, [
      j('Lucas Chevalieri', 30, 'GR', 83, 84, 'Reflexos', 'c c curto 0', 'Chevalieri'),
      j('Marquinhosi', 5, 'DC', 86, [72, 50, 74, 72, 87, 80], 'Intercetor', 'm c curto 1'),
      j('Achraf Hakimii', 2, 'DE', 87, [92, 76, 80, 84, 80, 78], 'Rápido', 'm p curto 0', 'Hakimii'),
      j('Vitinhai', 17, 'MC', 88, [74, 76, 90, 88, 72, 70], 'Passe Incisivo', 't e curto 0'),
      j('Ousmane Dembéléi', 10, 'PL', 90, [92, 86, 82, 90, 40, 66], 'Remate Colocado', 'n p curto 0', 'Dembéléi'),
    ]),

  // ---------- Equipa inventada ----------
  equipa('GUILHERME FC', 'GUI', 'Equipa inventada',
    { camisola: '#ffd60a', calcoes: '#111111', meias: '#ffd60a', numero: '#111111', gola: '#111111', gr: '#6a00f4' },
    { camisola: '#6a00f4', calcoes: '#6a00f4', meias: '#6a00f4', numero: '#ffd60a', gola: '#ffd60a' },
    { tipo: 'v', cores: ['#ffd60a', '#111111', '#ffd60a'] }, [
      j('Tomás Rocha', 1, 'GR', 80, 82, 'Reflexos', 'c c curto 0'),
      j('Rafael Pinto', 4, 'DC', 79, [74, 45, 66, 66, 80, 80], 'Muralha', 'c e curto 0'),
      j('Diogo Lopes', 3, 'DE', 80, [88, 60, 72, 78, 76, 72], 'Rápido', 'm p curto 0'),
      j('Romeu', 8, 'MC', 85, [74, 78, 90, 84, 70, 72], 'Passe Incisivo', 'c c curto 1'),
      j('Guilherme', 10, 'PL', 92, [94, 93, 86, 93, 40, 78], 'Remate Potente', 'c c topete 0 #ffd60a'),
    ]),
];
