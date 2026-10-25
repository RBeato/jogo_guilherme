# Futebol 26 — constrói o corpo dos jogadores a partir do MakeHuman (1.ª parte, em Python)
#
# Uso:  python3 ferramentas/makehuman_corpo.py <pasta do pacote npm makehuman-data-v1> <saída.json>
#
# O que faz:
#  1. lê o corpo base do MakeHuman e dá-lhe a forma de um futebolista
#     (homem, jovem, musculado, proporções ideais), numa variante por cada pele (clara, escura, asiática);
#  2. junta os 139 ossos do MakeHuman em 13 ossos que as animações do jogo sabem mexer;
#  3. marca cada face com a parte do equipamento que a cobre (pele, camisola, calções, meias, botas, mãos);
#  4. ajusta o cabelo, as sobrancelhas e os olhos à forma de cada variante.
# A 2.ª parte (ferramentas/makehuman_jogo.js) simplifica as malhas e escreve o ficheiro para o jogo.

import json
import sys
from pathlib import Path

import numpy as np

PASTA = Path(sys.argv[1]) / 'public' / 'data'
LISTA = Path(sys.argv[1]) / 'src' / 'json' / 'targets' / 'target-list.json'
SAIDA = Path(sys.argv[2])

base = json.loads((PASTA / 'models' / 'human_full_size.json').read_text())
N = len(base['vertices']) // 3
verts0 = np.array(base['vertices'], dtype=np.float64).reshape(-1, 3)

# ---------- Formas (targets) ----------
nomes_alvos = sorted(json.loads(LISTA.read_text())['targets'].keys())
alvos = np.memmap(PASTA / 'targets' / 'targets.bin', dtype=np.int16, mode='r', shape=(len(nomes_alvos), N * 3))


def alvo(nome):
    return nomes_alvos.index(f'data/targets/macrodetails/{nome}.target')


def forma(raca):
    """Homem jovem, musculado (75%), peso médio, proporções ideais, um pouco mais alto do que a média."""
    pesos = {
        'universal-male-young-averagemuscle-averageweight': 0.5,
        'universal-male-young-maxmuscle-averageweight': 0.5,
        f'{raca}-male-young': 1.0,
        'proportions/male-young-averagemuscle-averageweight-idealproportions': 0.5,
        'proportions/male-young-maxmuscle-averageweight-idealproportions': 0.5,
        'height/male-young-averagemuscle-averageweight-maxheight': 0.1,
        'height/male-young-maxmuscle-averageweight-maxheight': 0.1,
    }
    delta = np.zeros(N * 3)
    for nome, w in pesos.items():
        delta += w * alvos[alvo(nome)].astype(np.float64)
    return verts0 + delta.reshape(-1, 3) * 1e-3


# ---------- Faces (formato JSON 3 do three.js) ----------
materiais = [m['DbgName'] for m in base['materials']]
uvs = np.array(base['uvs'][0], dtype=np.float64).reshape(-1, 2)
faces = []          # (vértices, uvs, material)
f = base['faces']
i = 0
while i < len(f):
    tipo = f[i]; i += 1
    quad = tipo & 1
    nv = 4 if quad else 3
    vs = f[i:i + nv]; i += nv
    mat = 0
    if tipo & 2: mat = f[i]; i += 1
    if tipo & 4: i += 1
    fuv = None
    if tipo & 8: fuv = f[i:i + nv]; i += nv
    if tipo & 16: i += 1
    if tipo & 32: i += nv
    if tipo & 64: i += 1
    if tipo & 128: i += nv
    faces.append((vs, fuv, mat))
print('faces', len(faces), 'corpo', sum(1 for x in faces if materiais[x[2]] == 'body'))

# ---------- Ossos ----------
ossos_mh = base['bones']
nome_mh = lambda n: n.replace('____head', '')
pai_mh = {}
for b in ossos_mh:
    if b['name'].endswith('____head') and b['parent'] >= 0:
        pai_mh[nome_mh(b['name'])] = nome_mh(ossos_mh[b['parent']]['name'])

# Os 13 ossos do jogo: (nome, pai, osso do MakeHuman onde fica o pivô)
OSSOS = [
    ('quadril', None, 'root'),
    ('tronco', 'quadril', 'spine04'),
    ('pescoco', 'tronco', 'neck01'),
    ('cabeca', 'pescoco', 'head'),
    ('braco.L', 'tronco', 'upperarm01.L'), ('antebraco.L', 'braco.L', 'lowerarm01.L'),
    ('braco.R', 'tronco', 'upperarm01.R'), ('antebraco.R', 'braco.R', 'lowerarm01.R'),
    ('coxa.L', 'quadril', 'upperleg01.L'), ('canela.L', 'coxa.L', 'lowerleg01.L'),
    ('coxa.R', 'quadril', 'upperleg01.R'), ('canela.R', 'coxa.R', 'lowerleg01.R'),
]
DIRETOS = {
    'root': 'quadril', 'spine05': 'quadril', 'pelvis.L': 'quadril', 'pelvis.R': 'quadril',
    'spine04': 'tronco', 'neck01': 'pescoco', 'head': 'cabeca',
    'upperarm01.L': 'braco.L', 'lowerarm01.L': 'antebraco.L', 'upperarm01.R': 'braco.R', 'lowerarm01.R': 'antebraco.R',
    'upperleg01.L': 'coxa.L', 'lowerleg01.L': 'canela.L', 'upperleg01.R': 'coxa.R', 'lowerleg01.R': 'canela.R',
}


def osso_jogo(n):
    """Sobe na hierarquia do MakeHuman até encontrar um osso que o jogo usa."""
    while n not in DIRETOS:
        n = pai_mh[n]
    return DIRETOS[n]


# Pesos: cada vértice fica com no máximo 4 ossos do jogo
idx_osso = {o[0]: k for k, o in enumerate(OSSOS)}
si = base['skinIndices']; sw = base['skinWeights']
pesos = np.zeros((N, len(OSSOS)))
dominante_mh = [''] * N
for v in range(N):
    melhor = 0
    for k in range(4):
        w = sw[v * 4 + k]
        if w <= 0: continue
        n = nome_mh(ossos_mh[si[v * 4 + k]]['name'])
        pesos[v, idx_osso[osso_jogo(n)]] += w
        if w > melhor: melhor, dominante_mh[v] = w, n
ordem = np.argsort(-pesos, axis=1)[:, :4]
p4 = np.take_along_axis(pesos, ordem, axis=1)
p4 = p4 / np.maximum(p4.sum(1, keepdims=True), 1e-9)

juntas = base['metadata']['joint_pos_idxs']


def junta(vs, nome):
    return vs[juntas[nome + '____head']].mean(0)


# ---------- Equipamento: que parte do corpo cada vértice tem ----------
def regiao(n, v, vs, j):
    if n.startswith(('wrist', 'finger', 'metacarpal')): return 'maos'
    if n.startswith(('foot', 'toe')): return 'botas'
    if n.startswith(('lowerleg')):
        # meias desde um pouco abaixo do joelho; botas abaixo do tornozelo
        lado = n[-1]
        joelho, tornozelo = j['joelho' + lado][1], j['tornozelo' + lado][1]
        y = vs[v, 1]
        if y < tornozelo + 0.25: return 'botas'
        if y < joelho - 0.55: return 'meias'
        return 'pele'
    if n.startswith('upperleg01') or n in ('root', 'spine05', 'pelvis.L', 'pelvis.R'): return 'calcoes'
    if n.startswith('upperleg02'):
        lado = n[-1]
        return 'calcoes' if vs[v, 1] > j['coxameio' + lado] else 'pele'
    if n.startswith(('spine', 'breast', 'clavicle', 'shoulder')): return 'camisola'
    if n.startswith('upperarm01'): return 'camisola'
    return 'pele'


def variante(raca):
    vs = forma(raca)
    j = {}
    for lado in 'LR':
        j['joelho' + lado] = junta(vs, 'lowerleg01.' + lado)
        j['tornozelo' + lado] = junta(vs, 'foot.' + lado)
        anca = junta(vs, 'upperleg01.' + lado)
        j['coxameio' + lado] = anca[1] * 0.55 + j['joelho' + lado][1] * 0.45
    reg = [regiao(dominante_mh[v], v, vs, j) for v in range(N)]
    # Faces do corpo, com a parte do equipamento da maioria dos vértices
    PRIORIDADE = ['camisola', 'calcoes', 'meias', 'botas', 'maos', 'pele']
    fs = []
    for vs_f, fuv, mat in faces:
        if materiais[mat] != 'body': continue
        cont = {}
        for v in vs_f: cont[reg[v]] = cont.get(reg[v], 0) + 1
        g = max(cont, key=lambda r: (cont[r], -PRIORIDADE.index(r)))
        fs.append([list(vs_f), list(fuv), g])
    ossos = [{'nome': o[0], 'pai': o[1], 'pos': junta(vs, o[2]).round(5).tolist()} for o in OSSOS]
    return {'vertices': vs.round(5).ravel().tolist(), 'faces': fs, 'ossos': ossos}, vs


def proxy(caminho, vs):
    """Ajusta uma peça (cabelo, sobrancelhas, olhos) à forma do corpo: cada vértice é a média pesada
    de 3 vértices do corpo mais um pequeno desvio."""
    d = json.loads(caminho.read_text())
    ref = np.array(d['ref_vIdxs']); w = np.array(d['weights']); off = np.array(d['offsets'])
    pos = (vs[ref] * w[:, :, None]).sum(1) + off
    fs = []
    f = d['faces']; i = 0
    while i < len(f):
        tipo = f[i]; i += 1
        nv = 4 if tipo & 1 else 3
        vv = f[i:i + nv]; i += nv
        if tipo & 2: i += 1
        if tipo & 4: i += 1
        fuv = None
        if tipo & 8: fuv = f[i:i + nv]; i += nv
        if tipo & 16: i += 1
        if tipo & 32: i += nv
        if tipo & 64: i += 1
        if tipo & 128: i += nv
        fs.append([list(vv), list(fuv)])
    mat = d['materials'][0]
    return {'vertices': pos.round(5).ravel().tolist(), 'uvs': [round(x, 5) for x in d['uvs'][0]], 'faces': fs,
            'textura': str(caminho.parent / mat.get('mapDiffuse', '')) if mat.get('mapDiffuse') else None}


PROXIES = {
    'curto': 'hair/short02/short02.json', 'rapado': 'hair/short01/short01.json',
    'topete': 'hair/short03/short03.json', 'volume': 'hair/afro01/afro01.json',
    'barba': 'hair/Full_beard/Full_beard.json',
    'sobrancelhas': 'eyebrows/eyebrow001/eyebrow001.json', 'olhos': 'eyes/Low-Poly/Low-Poly.json',
}

saida = {'uvs': uvs.round(5).ravel().tolist(), 'pesosIdx': ordem.ravel().tolist(),
         'pesos': p4.round(4).ravel().tolist(), 'ossos': [o[0] for o in OSSOS], 'variantes': {}}
for nome, raca in [('clara', 'caucasian'), ('escura', 'african'), ('asiatica', 'asian')]:
    var, vs = variante(raca)
    var['pecas'] = {}
    for k, cam in PROXIES.items():
        p = PASTA / 'proxies' / cam
        if not p.exists():
            print('falta', p); continue
        var['pecas'][k] = proxy(p, vs)
    saida['variantes'][nome] = var
    alt = vs[:, 1].max() - vs[:, 1].min()
    print(nome, 'altura', round(alt, 3), 'faces corpo', len(var['faces']))
SAIDA.write_text(json.dumps(saida))
print('escrito', SAIDA, round(SAIDA.stat().st_size / 1e6, 1), 'MB')
