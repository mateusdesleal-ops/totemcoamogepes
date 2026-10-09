/* =========================================================
   COAMO GAMES — V59 · FALAS DO TONINHO E DO AROLDINHO
   Edite à vontade: cada item é uma conversa curta.
   ["t", "texto"] = Toninho (experiente, calmo, encorajador)
   ["a", "texto"] = Aroldinho (animado, brincalhão, energia lá em cima)
   {chaves} são trocadas por informações do jogo.
   ========================================================= */
window.COAMO_FALAS = {

  /* ---------- curiosidades usadas na Memória (mesmas informações das cartas) ---------- */
  curiosidades: {
    u:     [["t", "Unicoamo! É a universidade corporativa da Coamo, que cuida do desenvolvimento de quem trabalha aqui."]],
    f:     [["t", "FUPS é o Fundo de Proteção à Saúde: um plano de autogestão criado em 1993 para os funcionários do grupo Coamo."]],
    s:     [["a", "Coamo + Saúde! Atendimento digital de saúde para funcionários e aprendizes."]],
    a:     [["a", "ARCAM! Esporte, cultura, saúde e lazer para quem faz parte da Coamo."]],
    func:  [["t", "Mais de 12 mil funcionários fazem a Coamo acontecer todos os dias."], ["a", "E você pode ser o próximo!"]],
    coop:  [["a", "Mais de 32 mil cooperados!"], ["t", "Gente do campo que é dona da cooperativa."]],
    pr:    [["t", "A Coamo é a maior empresa do Paraná."]],
    latam: [["a", "A maior cooperativa agrícola da América Latina!"], ["t", "E tudo começou em Campo Mourão, em 1970."]]
  },

  /* ---------- Quiz: Descubra sua área ---------- */
  profile: {
    start: [
      [["t", "Vou te fazer algumas perguntas. Responda com o coração!"], ["a", "Não tem resposta errada. Bora descobrir sua área!"]],
      [["a", "Pronto para descobrir onde você brilha na Coamo?"], ["t", "Escolha o que mais combina com você no dia a dia."]]
    ],
    answer: {
      campo:      [[["a", "Pé no campo! Gostei!"]], [["t", "O campo é onde tudo começa."]]],
      operacoes:  [[["a", "Ritmo de operação! Silos, recebimento, movimento!"]], [["t", "Organização faz a safra andar."]]],
      industria:  [[["t", "Indústria e qualidade. Boa escolha."]], [["a", "Transformar grão em produto é demais!"]]],
      tecnologia: [[["a", "Tecnologia! Dados e sistemas, adoro!"]], [["t", "A tecnologia está em toda a cooperativa."]]],
      gestao:     [[["t", "Planejar bem é meio caminho andado."]], [["a", "Estratégia! Você pensa longe."]]],
      pessoas:    [[["a", "Gente que gosta de gente!"]], [["t", "Pessoas são a base de tudo aqui."]]]
    },
    half: [[["t", "Metade do caminho. Estou gostando das suas escolhas."]], [["a", "Já dá pra ver um perfil aparecendo!"]]],
    last: [[["a", "Última pergunta! Capricha!"]]],
    finish: [
      [["a", "Uhuu! Deu {area}!"], ["t", "Combina com você. Que tal dar uma olhada nas vagas?"]],
      [["t", "Seu perfil tem muito de {area}."], ["a", "Agora é só procurar sua vaga!"]]
    ],
    idle: [
      [["t", "Fique à vontade. Escolha a opção que mais parece com você."]],
      [["a", "Toca em uma das opções! Pode confiar no instinto."]]
    ]
  },

  /* ---------- Jogo da Memória ---------- */
  memory: {
    start: [
      [["a", "Valendo! Encontre os pares!"], ["t", "Cada par revela algo sobre a Coamo."]],
      [["t", "Comece com calma e guarde onde está cada carta."], ["a", "Eu vou torcer daqui!"]]
    ],
    flip: [],
    miss: [
      [["a", "Quase!"]], [["t", "Guarde essas duas na memória."]], [["a", "Ops! Essa não era."]],
      [["t", "Sem pressa. Agora você já sabe onde elas estão."]]
    ],
    missStreak: [[["t", "Respira. Tente lembrar das cartas que já apareceram."], ["a", "Você consegue!"]]],
    streak: [[["a", "Dois seguidos! Que memória!"]], [["a", "Combo x{streak}! Tá voando!"]]],
    half: [[["t", "Metade dos pares! Ótimo trabalho."]]],
    lastPair: [[["a", "Falta só um par!"]]],
    finish: [
      [["a", "Encontrou todos os pares!"], ["t", "{moves} tentativas em {time}. Excelente!"]],
      [["t", "Parabéns! Agora você conhece mais da Coamo."], ["a", "Bora de novo pra bater o tempo?"]]
    ],
    idle: [
      [["t", "Dica: comece pelos cantos e vá memorizando."]],
      [["a", "Toca numa carta! Eu quero ver a próxima curiosidade!"]],
      [["t", "Lembra das cartas que já viu? Tente achar o par delas."]]
    ]
  },

  /* ---------- Monte a cadeia Coamo ---------- */
  chain: {
    start: [
      [["t", "Vamos montar a jornada do campo até o mercado."], ["a", "Seis etapas! Qual vem primeiro?"]]
    ],
    correct: [
      [["t", "{title}: {text}"]]
    ],
    correctFirst: [[["a", "Isso! Tudo começa no campo!"]]],
    wrong: [
      [["a", "Opa, essa ainda não!"], ["t", "Pense no que vem depois de {prev}."]],
      [["t", "Essa etapa vem mais adiante."], ["a", "Tenta outra!"]]
    ],
    wrongFirst: [[["t", "Essa vem mais adiante. Onde a produção nasce?"]]],
    lastLife: [[["t", "Última vida. Pense com calma."]]],
    gameover: [[["a", "Ah, as vidas acabaram!"], ["t", "Faz parte. Na próxima você completa!"]]],
    finish: [
      [["a", "Cadeia completa!"], ["t", "Do campo ao mercado. É assim que a Coamo funciona!"]]
    ],
    idle: [
      [["t", "Pense no caminho do grão: depois de {prev}, para onde ele vai?"]],
      [["a", "Olha as cartas com calma. Uma delas é a próxima etapa!"]]
    ],
    idleFirst: [[["t", "Toda a jornada começa em um lugar. Onde a produção nasce?"]]]
  },

  /* ---------- Desafio da Classificação ---------- */
  grain: {
    start: [
      [["t", "Qualidade começa na classificação."], ["a", "Arrasta cada item pra caixa certa. Valendo!"]]
    ],
    hit: [[["a", "Isso!"]], [["t", "Boa."]], [["a", "Certinho!"]], [["t", "Classificado."]]],
    combo3:  [[["a", "Combo x3!"]]],
    combo6:  [[["a", "Combo x{combo}! Que mão rápida!"]]],
    combo10: [[["t", "Combo x{combo}. Isso é qualidade de verdade."], ["a", "Tá impossível!"]]],
    combo15: [[["a", "Combo x{combo}!!! Alguém para essa pessoa!"]]],
    miss: [
      [["t", "{label} não vai aí."]], [["a", "Opa! Era {label}!"]], [["t", "Atenção ao destino."]]
    ],
    escape: [[["a", "Ih, passou um!"]], [["t", "Um item escapou. Foco na esteira."]]],
    lastLife: [[["t", "Última vida! Concentração total."], ["a", "Vai que dá!"]]],
    phase: [[["t", "Fase {phase}: {name}. A esteira acelerou."]]],
    phase5: [[["a", "Fase 5! Agora é nível extremo!"], ["t", "Respira e confia no olho."]]],
    finish: {
      gold:   [[["a", "Ouro! Que classificação!"], ["t", "Fase {reached} com {accuracy}% de precisão. Impressionante."]]],
      silver: [[["t", "Prata! Muito bom resultado."], ["a", "Mais uma e vira ouro!"]]],
      bronze: [[["a", "Bronze conquistado!"], ["t", "Treinando, você vai longe."]]]
    }
  },

  /* ---------- Silo em Equilíbrio ---------- */
  silo: {
    start: [
      [["t", "A primeira carga em cada silo define o produto dele."], ["a", "Memoriza e cuida da capacidade!"]]
    ],
    assign: [
      [["t", "Silo {silo} agora é de {product}."], ["a", "Guarda isso!"]],
      [["a", "{product} no Silo {silo}. Anotado!"]]
    ],
    correct: [[["a", "Certo!"]], [["t", "Carga recebida."]], [["a", "Boa!"]]],
    combo3: [[["a", "Combo x{combo}! Memória de elefante!"]]],
    combo6: [[["t", "Combo x{combo}. Você domina os destinos."]]],
    wrong: [
      [["a", "Esse silo já tem dono!"], ["t", "Cada silo recebe um único produto."]],
      [["t", "Esse não é o silo do produto. Lembra das primeiras cargas?"]]
    ],
    capacity: [[["t", "Esse silo estava cheio demais."], ["a", "Olha o nível antes!"]]],
    timeout: [[["a", "A carga esperou demais!"], ["t", "Decida um pouco mais rápido."]]],
    expedition: [[["a", "Expedição! Liberou espaço no Silo {silo}."]]],
    known: [[["t", "Lembra onde ficou a carga de {product}?"]], [["a", "{product} de novo! Você já sabe o caminho."]]],
    time30: [[["a", "30 segundos!"]]],
    time10: [[["t", "Reta final. Dez segundos!"], ["a", "Vaaai!"]]],
    lastLife: [[["t", "Última vida. Calma e memória."]]],
    finish: {
      win:  [[["a", "Operação concluída!"], ["t", "Silos em equilíbrio. {precision}% de precisão!"]]],
      lose: [[["t", "As vidas acabaram, mas você aprendeu os silos."], ["a", "Bora de novo?"]]]
    }
  },

  /* ---------- quando ninguém está jogando ---------- */
  ambient: [
    [["a", "Psiu! Toca aqui pra jogar!"]],
    [["t", "Estamos esperando você."]]
  ]
};
