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
      // Lendas (cartas ICON) a acompanhar o Guilherme.B; o Romeu também é ICON
      j('Lev Yashini', 1, 'GR', 91, 92, 'Reflexos', 'c p curto 0', 'Yashini'),
      j('Franz Beckenbaueri', 5, 'DC', 91, [76, 62, 84, 82, 92, 84], 'Antecipação', 'c c curto 0', 'Beckenbaueri'),
      j('Paolo Maldinii', 3, 'DE', 91, [85, 50, 76, 78, 93, 84], 'Carrinho', 'c e volume 0', 'Maldinii'),
      j('Romeu', 8, 'MC', 90, [80, 82, 92, 88, 72, 78], 'Passe Incisivo', 'c c curto 1'),
      j('Guilherme.B', 10, 'PL', 99, [99, 99, 95, 99, 45, 90], 'Remate Potente', 'c c topete 0 #ffd60a', 'Guilherme B'),
    ]),
  equipa('GONÇALO FC', 'GON', 'Equipa inventada',
    { camisola: '#38b6ff', calcoes: '#0b1f4d', meias: '#38b6ff', numero: '#ffffff', gola: '#ffffff', gr: '#ff7b00' },
    { camisola: '#ffffff', calcoes: '#ffffff', meias: '#ffffff', numero: '#38b6ff', gola: '#0b1f4d' },
    { tipo: 'h', cores: ['#38b6ff', '#ffffff', '#38b6ff'] }, [
      // Lendas (cartas ICON) a acompanhar o Gonçalo.B
      j('Gianluigi Buffoni', 1, 'GR', 91, 92, 'Reflexos', 'c c curto 0', 'Buffoni'),
      j('Fabio Cannavaroi', 5, 'DC', 90, [82, 45, 70, 74, 92, 86], 'Bloqueio', 'c p curto 0', 'Cannavaroi'),
      j('Roberto Carlosi', 3, 'DE', 90, [92, 82, 80, 84, 82, 84], 'Remate Potente', 'm p rapado 0', 'Roberto Carlosi'),
      j('Kakái', 8, 'MC', 90, [91, 86, 86, 90, 48, 78], 'Arranque Rápido', 'c c curto 0', 'Kakái'),
      j('Gonçalo.B', 10, 'PL', 99, [98, 99, 94, 99, 46, 89], 'Remate Colocado', 'c e volume 0 #38b6ff', 'Gonçalo B'),
    ]),
];

// ---------- Cartas especiais coloridas (só estes dois, a pedido do Guilherme) ----------
const CARTAS_ESPECIAIS = {
  // Estilo FUTTIES: cor-de-rosa forte e roxo, com confettis coloridos
  'Guilherme.B': { tipo: 'FUTTIES', cores: ['#ff4fd8', '#e0129a', '#8a1fd1', '#3d0a7a'], texto: '#ffffff', borda: '#ffd1f4',
    confetti: ['#ffe600', '#00e5ff', '#7dff6a', '#ffffff'] },
  'Gonçalo.B': { tipo: 'FUTTIES', cores: ['#ff6ad5', '#c2189b', '#6b2bd9', '#24125e'], texto: '#ffffff', borda: '#d9f6ff',
    confetti: ['#00e5ff', '#ffe600', '#ff9f1c', '#ffffff'] },
}

// Cartas ICON (lendas): branco-pérola com contorno dourado
const CARTA_ICON = { tipo: 'ICON', cores: ['#fffdf6', '#f4ecd6', '#e6d6a8', '#cdb57c'], texto: '#3a2a05', borda: '#d4af37' };

// ---------- Mais 6 jogadores por equipa, para o 11 contra 11 ----------
// Ordem: defesa direito, defesa central, médio, médio, extremo direito, extremo esquerdo.
// Os atributos destes vêm da posição e da classificação (são mais simples do que os dos 5 principais).
const MODELO_POSICAO = {
  DD: { at: [86, 60, 74, 78, 78, 74], ps: 'Rápido' },
  DE: { at: [86, 60, 74, 78, 78, 74], ps: 'Rápido' },
  DC: { at: [70, 40, 66, 64, 84, 82], ps: 'Muralha' },
  MC: { at: [72, 74, 84, 82, 70, 72], ps: 'Passe Incisivo' },
  ED: { at: [88, 78, 76, 86, 38, 66], ps: 'Rápido' },
  EE: { at: [88, 78, 76, 86, 38, 66], ps: 'Remate Colocado' },
};
// x(nome, número, posição, classificação, aspeto, PlayStyle opcional)
function x(nome, num, posicao, ovr, aspeto, ps) {
  const m = MODELO_POSICAO[posicao];
  const at = m.at.map(v => Math.max(20, Math.min(99, v + (ovr - 82))));
  return j(nome, num, posicao, ovr, at, ps || m.ps, aspeto);
}

const EXTRA_11 = {
  'PORTUGAL': [x('João Canceloi', 20, 'DD', 84, 't e curto 1'), x('Gonçalo Inácioi', 14, 'DC', 83, 'c c curto 0'),
    x('Vitinhai', 23, 'MC', 88, 't e curto 0'), x('João Nevesi', 15, 'MC', 85, 'c c curto 0', 'Intercetor'),
    x('Bernardo Silvai', 10, 'ED', 86, 'c c curto 1', 'Passe Incisivo'), x('Rafael Leãoi', 17, 'EE', 85, 'e p curto 0')],
  'FRANÇA': [x('Jules Koundéi', 5, 'DD', 85, 'e p curto 0'), x('Ibrahima Konatéi', 24, 'DC', 84, 'n p rapado 0'),
    x('Adrien Rabioti', 14, 'MC', 84, 'c c volume 1'), x('Manu Konéi', 6, 'MC', 83, 'n p curto 0', 'Intercetor'),
    x('Ousmane Dembéléi', 7, 'ED', 90, 'n p curto 0', 'Remate Colocado'), x('Bradley Barcolai', 11, 'EE', 84, 'n p curto 0', 'Rápido')],
  'BRASIL': [x('Daniloi', 2, 'DD', 80, 'm p rapado 1'), x('Gabriel Magalhãesi', 6, 'DC', 86, 'm p curto 1'),
    x('Casemiroi', 8, 'MC', 82, 'm p rapado 1', 'Intercetor'), x('Lucas Paquetái', 10, 'MC', 83, 'm p volume 0'),
    x('Raphinhai', 11, 'ED', 88, 'm p curto 0', 'Remate Potente'), x('Rodrygoi', 21, 'EE', 85, 'e p curto 0')],
  'ARGENTINA': [x('Nahuel Molinai', 26, 'DD', 82, 'm e curto 1'), x('Nicolás Otamendii', 19, 'DC', 80, 'c e curto 1', 'Carrinho'),
    x('Alexis Mac Allisteri', 20, 'MC', 86, 'c r curto 0'), x('Rodrigo De Pauli', 7, 'MC', 83, 'c e curto 1', 'Intercetor'),
    x('Julián Álvarezi', 9, 'ED', 86, 'c c curto 0', 'Remate Potente'), x('Lautaro Martínezi', 22, 'EE', 87, 'm p curto 1', 'Remate Potente')],
  'ESPANHA': [x('Pedro Porroi', 12, 'DD', 83, 'c e curto 0'), x('Robin Le Normandi', 3, 'DC', 83, 'c l curto 1'),
    x('Rodrii', 16, 'MC', 89, 'c c curto 1', 'Intercetor'), x('Fabián Ruizi', 8, 'MC', 85, 'c e curto 1'),
    x('Dani Olmoi', 10, 'ED', 84, 'c c curto 0', 'Remate Colocado'), x('Nico Williamsi', 17, 'EE', 86, 'n p curto 0', 'Rápido')],
  'INGLATERRA': [x('Reece Jamesi', 2, 'DD', 84, 'n p curto 1'), x('John Stonesi', 5, 'DC', 84, 'c c curto 0'),
    x('Cole Palmeri', 20, 'MC', 87, 'c r curto 0', 'Remate Colocado'), x('Elliot Andersoni', 8, 'MC', 82, 'c c curto 0'),
    x('Bukayo Sakai', 7, 'ED', 88, 'n p curto 0', 'Rápido'), x('Anthony Gordoni', 11, 'EE', 84, 'c c curto 0')],
  'ALEMANHA': [x('Waldemar Antoni', 3, 'DD', 81, 'c c curto 1'), x('Jonathan Tahi', 4, 'DC', 85, 'n p rapado 0'),
    x('Leon Goretzkai', 8, 'MC', 84, 'c c curto 1'), x('Aleksandar Pavlovići', 16, 'MC', 83, 'c c curto 0', 'Intercetor'),
    x('Leroy Sanéi', 19, 'ED', 84, 'n p curto 0'), x('Serge Gnabryi', 7, 'EE', 82, 'n p curto 1')],
  'BENFICA': [x('Amar Dedići', 17, 'DD', 79, 'c c curto 0'), x('Tomás Araújoi', 44, 'DC', 79, 'c c curto 0'),
    x('Fredrik Aursnesi', 8, 'MC', 81, 'c l curto 0', 'Intercetor'), x('Richard Ríosi', 20, 'MC', 80, 'm p curto 0'),
    x('Andreas Schjelderupi', 21, 'ED', 79, 'c l curto 0'), x('Gianluca Prestiannii', 25, 'EE', 77, 'c e curto 0')],
  'FC PORTO': [x('Alberto Costai', 2, 'DD', 76, 'c e curto 0'), x('Jakub Kiwiori', 4, 'DC', 80, 'c c curto 0'),
    x('Pablo Rosarioi', 13, 'MC', 78, 'n p curto 0', 'Intercetor'), x('Victor Froholdti', 8, 'MC', 78, 'c l curto 0'),
    x('William Gomesi', 11, 'ED', 77, 'n p curto 0'), x('Borja Sainzi', 7, 'EE', 77, 'c e curto 1')],
  'SPORTING': [x('Iván Fresnedai', 22, 'DD', 76, 'c c curto 0'), x('Gonçalo Inácioi', 25, 'DC', 83, 'c c curto 0'),
    x('Pedro Gonçalvesi', 8, 'MC', 82, 'c e curto 1', 'Remate Colocado'), x('Daniel Bragançai', 23, 'MC', 78, 'c c curto 0'),
    x('Geovany Quendai', 57, 'ED', 80, 'e p curto 0'), x('Francisco Trincãoi', 17, 'EE', 82, 'c e curto 0')],
  'SC BRAGA': [x('Víctor Gómezi', 2, 'DD', 75, 'c e curto 1'), x('Sikou Niakatéi', 4, 'DC', 76, 'n p rapado 0'),
    x('João Moutinhoi', 8, 'MC', 77, 'c c curto 1'), x('Jean-Baptiste Gorbyi', 14, 'MC', 76, 'n p curto 0', 'Intercetor'),
    x('Roger Fernandesi', 20, 'ED', 77, 'n p curto 0'), x('Fran Navarroi', 39, 'EE', 77, 'c c curto 0', 'Remate Potente')],
  'REAL MADRID': [x('Trent Alexander-Arnoldi', 12, 'DD', 86, 'c c curto 0', 'Passe Incisivo'), x('Dean Huijseni', 24, 'DC', 82, 'c c curto 0'),
    x('Aurélien Tchouaménii', 14, 'MC', 85, 'n p volume 0', 'Intercetor'), x('Arda Güleri', 15, 'MC', 84, 'c e curto 0', 'Remate Colocado'),
    x('Rodrygoi', 11, 'ED', 85, 'e p curto 0'), x('Vinícius Júniori', 7, 'EE', 90, 'n p volume 0 #ff2d55', 'Rápido')],
  'BARCELONA': [x('Eric Garcíai', 24, 'DD', 80, 'c c curto 0'), x('Ronald Araújoi', 4, 'DC', 84, 'm p curto 0'),
    x('Frenkie de Jongi', 21, 'MC', 86, 'c l curto 0'), x('Gavii', 6, 'MC', 83, 'c e curto 0', 'Intercetor'),
    x('Raphinhai', 11, 'ED', 88, 'm p curto 0', 'Remate Potente'), x('Marcus Rashfordi', 14, 'EE', 83, 'n p curto 0')],
  'MANCHESTER CITY': [x('Matheus Nunesi', 27, 'DD', 81, 'm p curto 0'), x('John Stonesi', 5, 'DC', 84, 'c c curto 0'),
    x('Tijjani Reijndersi', 4, 'MC', 84, 'm p curto 0'), x('Phil Fodeni', 47, 'MC', 86, 'c c rapado 0', 'Remate Colocado'),
    x('Omar Marmoushi', 7, 'ED', 84, 'm p curto 1'), x('Jérémy Dokui', 11, 'EE', 84, 'n p curto 0', 'Rápido')],
  'BAYERN': [x('Konrad Laimeri', 27, 'DD', 81, 'c c curto 0'), x('Jonathan Tahi', 4, 'DC', 85, 'n p rapado 0'),
    x('Aleksandar Pavlovići', 45, 'MC', 83, 'c c curto 0', 'Intercetor'), x('Jamal Musialai', 42, 'MC', 88, 'm p curto 0', 'Rápido'),
    x('Michael Olisei', 17, 'ED', 87, 'n p curto 0', 'Remate Colocado'), x('Luis Díazi', 14, 'EE', 86, 'm p volume 0')],
  'LIVERPOOL': [x('Jeremie Frimpongi', 30, 'DD', 83, 'n p curto 0'), x('Milos Kerkezi', 6, 'DC', 80, 'c c curto 0'),
    x('Alexis Mac Allisteri', 10, 'MC', 86, 'c r curto 0'), x('Dominik Szoboszlaii', 8, 'MC', 84, 'c l curto 0', 'Remate Potente'),
    x('Hugo Ekitikéi', 22, 'ED', 84, 'n p curto 0'), x('Cody Gakpoi', 18, 'EE', 84, 'e p curto 0')],
  'PARIS SG': [x('Nuno Mendesi', 25, 'DD', 86, 'e p volume 0'), x('Willian Pachoi', 51, 'DC', 83, 'm p curto 1'),
    x('João Nevesi', 87, 'MC', 85, 'c c curto 0', 'Intercetor'), x('Fabián Ruizi', 8, 'MC', 85, 'c e curto 1'),
    x('Désiré Douéi', 14, 'ED', 85, 'n p curto 0'), x('Khvicha Kvaratskheliai', 7, 'EE', 87, 'c c curto 0', 'Rápido')],
  'GUILHERME FC': [x('Cafui', 2, 'DD', 90, 'n p rapado 0'), x('Carles Puyoli', 4, 'DC', 90, 'c c volume 0', 'Muralha'),
    x('Zinedine Zidanei', 6, 'MC', 91, 'c c rapado 0', 'Técnico'), x('Andrea Pirloi', 21, 'MC', 90, 'c e volume 1', 'Passe Longo'),
    x('Luís Figoi', 7, 'ED', 91, 'c c curto 0', 'Cruzamento Tenso'), x('Ronaldinhoi', 11, 'EE', 91, 'm p volume 0', 'Habilidoso')],
  'GONÇALO FC': [x('Philipp Lahmi', 2, 'DD', 90, 'c l curto 0'), x('Rio Ferdinandi', 4, 'DC', 90, 'n p rapado 0', 'Fortaleza Aérea'),
    x('Xavii', 6, 'MC', 91, 'c e curto 1', 'Tiki-Taka'), x('Andrés Iniestai', 14, 'MC', 91, 'c c rapado 0', 'Resistente à Pressão'),
    x('Eusébioi', 13, 'ED', 91, 'n p curto 0', 'Remate Potente'), x('Thierry Henryi', 12, 'EE', 91, 'n p rapado 0', 'Remate Colocado')],
};
for (const eq of TODAS_EQUIPAS) eq.plantel11 = eq.plantel.concat(EXTRA_11[eq.nome] || []);
// No Guilherme FC e no Gonçalo FC, todos menos o jogador de 99 são lendas com carta ICON
for (const nome of ['GUILHERME FC', 'GONÇALO FC']) {
  const eq = TODAS_EQUIPAS.find(e => e.nome === nome);
  for (const p of eq.plantel11) if (!CARTAS_ESPECIAIS[p.nome]) CARTAS_ESPECIAIS[p.nome] = CARTA_ICON;
}

// ---------- PlayStyles ao estilo do FC 26 ----------
// Cada jogador tem 1 ou 2 PlayStyle+ (dourados, mais fortes) e alguns PlayStyles normais (prateados).
// Entre parênteses: o nome em inglês, como aparece no FC.
const PLAYSTYLES_FC = {
  // Remate
  'Remate Colocado': { en: 'Finesse Shot', grupo: 'Remate', faz: 'Remate em arco para o canto' },
  'Remate Potente': { en: 'Power Shot', grupo: 'Remate', faz: 'Remates mais fortes e certeiros' },
  'Remate Rasteiro': { en: 'Low Driven Shot', grupo: 'Remate', faz: 'Remates rasteiros que não vão por cima' },
  'Chapéu': { en: 'Chip Shot', grupo: 'Remate', faz: 'Remata por cima do GR quando ele sai' },
  'Bola Parada': { en: 'Dead Ball', grupo: 'Remate', faz: 'Livres mais certeiros, menos bolas na barreira' },
  'Trivela': { en: 'Trivela', grupo: 'Remate', faz: 'Remate com a parte de fora do pé, com mais curva' },
  'Acrobático': { en: 'Acrobatic', grupo: 'Remate', faz: 'Cabeceamentos e remates difíceis mais certeiros' },
  'Cabeceamento Potente': { en: 'Power Header', grupo: 'Remate', faz: 'Cabeceamentos muito fortes' },
  'Cabeceamento Preciso': { en: 'Precision Header', grupo: 'Remate', faz: 'Cabeceamentos para os cantos da baliza' },
  'Gamechanger': { en: 'Gamechanger', grupo: 'Remate', faz: 'Remates com efeito especial, difíceis para o GR' },
  // Passe
  'Passe Incisivo': { en: 'Incisive Pass', grupo: 'Passe', faz: 'Passe em profundidade para o espaço' },
  'Passe Tenso': { en: 'Pinged Pass', grupo: 'Passe', faz: 'Passes rasteiros mais rápidos' },
  'Passe Longo': { en: 'Long Ball Pass', grupo: 'Passe', faz: 'Passes altos e longos mais certeiros' },
  'Tiki-Taka': { en: 'Tiki Taka', grupo: 'Passe', faz: 'Passes curtos rápidos e certeiros' },
  'Cruzamento Tenso': { en: 'Whipped Pass', grupo: 'Passe', faz: 'Cruzamentos mais rápidos e baixos' },
  'Inventivo': { en: 'Inventive', grupo: 'Passe', faz: 'Passes difíceis muito certeiros' },
  // Defesa
  'Intercetor': { en: 'Intercept', grupo: 'Defesa', faz: 'Lê e corta os passes' },
  'Bloqueio': { en: 'Block', grupo: 'Defesa', faz: 'Bloqueia mais remates com o corpo' },
  'Antecipação': { en: 'Anticipate', grupo: 'Defesa', faz: 'Rouba mais vezes a bola encostando' },
  'Carrinho': { en: 'Slide Tackle', grupo: 'Defesa', faz: 'Carrinhos mais longos e com menos cartões' },
  'Marcação': { en: 'Jockey', grupo: 'Defesa', faz: 'Difícil de enganar com fintas' },
  'Fortaleza Aérea': { en: 'Aerial Fortress', grupo: 'Defesa', faz: 'Ganha os lances pelo ar' },
  'Muralha': { en: 'Bruiser', grupo: 'Físico', faz: 'Ganha os duelos de ombro' },
  // Controlo
  'Técnico': { en: 'Technical', grupo: 'Controlo', faz: 'Vira-se mais depressa com a bola' },
  'Rápido': { en: 'Rapid', grupo: 'Controlo', faz: 'Corre mais depressa' },
  'Arranque Rápido': { en: 'Quick Step', grupo: 'Controlo', faz: 'Acelera mais depressa' },
  'Primeiro Toque': { en: 'First Touch', grupo: 'Controlo', faz: 'Domina bolas rápidas' },
  'Habilidoso': { en: 'Trickster', grupo: 'Controlo', faz: 'Fintas que enganam mais' },
  'Flair': { en: 'Flair', grupo: 'Controlo', faz: 'Depois de uma finta, remata e passa melhor' },
  'Resistente à Pressão': { en: 'Press Proven', grupo: 'Controlo', faz: 'Difícil de lhe tirar a bola quando é pressionado' },
  'Intimidador': { en: 'Enforcer', grupo: 'Físico', faz: 'Protege a bola com o corpo' },
  'Incansável': { en: 'Relentless', grupo: 'Físico', faz: 'Não fica lento depois de perder a bola' },
  'Lançamento Longo': { en: 'Long Throw', grupo: 'Físico', faz: 'Lançamentos laterais mais longos' },
  // Guarda-redes
  'Reflexos': { en: 'Quick Reflexes', grupo: 'Guarda-redes', faz: 'Defende mais e mergulha mais depressa' },
  'Alcance': { en: 'Far Reach', grupo: 'Guarda-redes', faz: 'Mergulha mais longe' },
  'Corta Cruzamentos': { en: 'Cross Claimer', grupo: 'Guarda-redes', faz: 'Agarra os cruzamentos' },
  'Sai aos Pés': { en: 'Rush Out', grupo: 'Guarda-redes', faz: 'Sai da baliza para apanhar a bola' },
  'Lançamento Longo GR': { en: 'Far Throw', grupo: 'Guarda-redes', faz: 'Repõe a bola mais longe' },
  'Jogo de Pés': { en: 'Footwork', grupo: 'Guarda-redes', faz: 'Defende melhor os remates rasteiros' },
  'Defletor': { en: 'Deflector', grupo: 'Guarda-redes', faz: 'Desvia as bolas para longe da área' },
};

// PlayStyles escolhidos à mão para os jogadores mais conhecidos ("+" = PlayStyle+ dourado)
const PS_ESPECIAIS = {
  'Cristiano Ronaldoi': ['Cabeceamento Potente+', 'Acrobático', 'Bola Parada', 'Cabeceamento Preciso'],
  'Lionel Messii': ['Bola Parada+', 'Inventivo', 'Técnico', 'Flair'],
  'Kylian Mbappéi': ['Rápido+', 'Arranque Rápido', 'Gamechanger', 'Flair'],
  'Bruno Fernandesi': ['Bola Parada', 'Passe Longo', 'Remate Potente'],
  'Erling Haalandi': ['Acrobático', 'Arranque Rápido', 'Remate Rasteiro'],
  'Lamine Yamali': ['Trivela+', 'Técnico', 'Habilidoso'],
  'Pedrii': ['Tiki-Taka+', 'Técnico', 'Primeiro Toque'],
  'Virgil van Dijki': ['Fortaleza Aérea+', 'Antecipação', 'Passe Longo'],
  'Trent Alexander-Arnoldi': ['Cruzamento Tenso', 'Bola Parada', 'Tiki-Taka'],
  'Joshua Kimmichi': ['Cruzamento Tenso', 'Passe Longo', 'Bola Parada'],
  'Mohamed Salahi': ['Trivela', 'Arranque Rápido', 'Chapéu'],
  'Vinícius Júniori': ['Habilidoso+', 'Arranque Rápido', 'Flair'],
  'Harry Kanei': ['Passe Longo', 'Remate Rasteiro', 'Cabeceamento Potente'],
  'Rodrii': ['Tiki-Taka', 'Passe Longo', 'Antecipação'],
  'Jude Bellinghami': ['Cabeceamento Potente', 'Muralha', 'Primeiro Toque'],
  'Rúben Diasi': ['Bloqueio', 'Fortaleza Aérea', 'Antecipação'],
  'Ousmane Dembéléi': ['Habilidoso', 'Arranque Rápido', 'Trivela'],
  'Florian Wirtzi': ['Técnico', 'Passe Incisivo', 'Primeiro Toque'],
  'Thibaut Courtoisi': ['Alcance+', 'Corta Cruzamentos', 'Defletor'],
  'Guilherme.B': ['Chapéu+', 'Habilidoso', 'Arranque Rápido', 'Trivela'],
  // Lendas
  'Lev Yashini': ['Reflexos+', 'Alcance', 'Corta Cruzamentos'],
  'Franz Beckenbaueri': ['Antecipação+', 'Passe Longo', 'Intercetor'],
  'Paolo Maldinii': ['Carrinho+', 'Marcação', 'Antecipação'],
  'Romeu': ['Passe Incisivo+', 'Tiki-Taka', 'Passe Longo'],
  'Zinedine Zidanei': ['Técnico+', 'Primeiro Toque', 'Resistente à Pressão'],
  'Ronaldinhoi': ['Habilidoso+', 'Flair', 'Trivela'],
  'Luís Figoi': ['Cruzamento Tenso+', 'Habilidoso', 'Técnico'],
  'Andrea Pirloi': ['Passe Longo+', 'Bola Parada', 'Inventivo'],
  'Gianluigi Buffoni': ['Reflexos+', 'Alcance', 'Defletor'],
  'Roberto Carlosi': ['Remate Potente+', 'Rápido', 'Bola Parada'],
  'Kakái': ['Arranque Rápido+', 'Técnico', 'Remate Colocado'],
  'Eusébioi': ['Remate Potente+', 'Arranque Rápido', 'Acrobático'],
  'Thierry Henryi': ['Remate Colocado+', 'Rápido', 'Primeiro Toque'],
  'Xavii': ['Tiki-Taka+', 'Passe Incisivo', 'Resistente à Pressão'],
  'Andrés Iniestai': ['Resistente à Pressão+', 'Técnico', 'Passe Incisivo'],
  'Gonçalo.B': ['Remate Colocado+', 'Arranque Rápido', 'Primeiro Toque', 'Bola Parada'],
};

// Os outros recebem PlayStyles normais conforme os atributos (como no FC, quem é muito bom numa coisa tem o PlayStyle dessa coisa)
function playstylesPorAtributos(j) {
  const a = j.at, lista = [];
  if (j.posicao === 'GR') {
    if (a.ref >= 88) lista.push('Alcance');
    if (a.ref >= 84) lista.push('Corta Cruzamentos');
    if (j.ovr >= 86) lista.push('Sai aos Pés');
    if (j.ovr >= 83) lista.push('Jogo de Pés');
    lista.push('Lançamento Longo GR');
    return lista;
  }
  if (a.rit >= 90) lista.push('Arranque Rápido');
  if (a.rit >= 93) lista.push('Rápido');
  if (a.rem >= 88) lista.push('Remate Potente');
  else if (a.rem >= 84) lista.push('Remate Colocado');
  if (a.pas >= 88) lista.push('Tiki-Taka');
  else if (a.pas >= 84) lista.push('Passe Tenso');
  if (a.dri >= 91) lista.push('Habilidoso');
  if (a.dri >= 88) lista.push('Técnico');
  else if (a.dri >= 85) lista.push('Primeiro Toque');
  if (a.def >= 86) lista.push('Antecipação');
  else if (a.def >= 83) lista.push('Bloqueio');
  if (a.fis >= 86) lista.push('Fortaleza Aérea');
  if ((j.posicao === 'DD' || j.posicao === 'DE') && a.rit >= 84) lista.push('Cruzamento Tenso');
  if (a.fis >= 84 && a.rit >= 80) lista.push('Incansável');
  if (a.dri >= 86 && a.fis >= 80) lista.push('Resistente à Pressão');
  if (a.fis >= 84 && a.def < 60) lista.push('Intimidador');
  if (a.rem >= 88 && a.dri >= 88) lista.push('Gamechanger');
  return lista;
}

// Junta tudo: pss = [{ nome, plus }]. O PlayStyle principal de cada jogador é sempre PlayStyle+.
for (const eq of TODAS_EQUIPAS) {
  for (const j of eq.plantel11) {
    if (j.pss) continue;   // o mesmo jogador pode estar em duas equipas (seleção e clube)
    const pss = [{ nome: j.ps, plus: true }];
    const extra = PS_ESPECIAIS[j.nome] || playstylesPorAtributos(j);
    for (const e of extra) {
      const plus = e.endsWith('+');
      const nome = plus ? e.slice(0, -1) : e;
      if (pss.some(x => x.nome === nome) || pss.length >= 5) continue;
      pss.push({ nome, plus: plus && pss.filter(x => x.plus).length < 2 });
    }
    // Primeiro os dourados, depois os prateados
    j.pss = pss.sort((a, b) => b.plus - a.plus);
  }
}
