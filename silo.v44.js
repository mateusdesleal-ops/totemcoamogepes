(() => {

  "use strict";


  /* =========================================================
     SILO EM EQUILÍBRIO — V44
     Coamo Games
     ========================================================= */


  const $ = (selector, root = document) =>
    root.querySelector(selector);


  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];



  /* =========================================================
     ELEMENTOS
     ========================================================= */


  const intro =
    $("#siloIntro");


  const game =
    $("#siloGame");


  const result =
    $("#siloResult");


  const startButton =
    $("#siloStart");


  const playAgainButton =
    $("#siloPlayAgain");


  const timerEl =
    $("#siloTimer");


  const scoreEl =
    $("#siloScore");


  const comboEl =
    $("#siloCombo");


  const livesEl =
    $("#siloLives");


  const eventEl =
    $("#siloEvent");


  const loadEl =
    $("#siloLoad");


  const loadIcon =
    $("#siloLoadIcon");


  const loadName =
    $("#siloLoadName");


  const loadAmount =
    $("#siloLoadAmount");


  const loadTimeBar =
    $("#siloLoadTime");


  const toninhoSpeech =
    $("#siloToninho");


  const aroldinhoSpeech =
    $("#siloAroldinho");


  const siloButtons =
    $$(".silo-unit");



  if (
    !intro ||
    !game ||
    !result ||
    !startButton ||
    siloButtons.length !== 4
  ) {

    return;

  }



  /* =========================================================
     CONFIGURAÇÕES
     ========================================================= */


  const SESSION_SECONDS =
    75;


  const INITIAL_LOAD_SECONDS =
    6;


  const MAX_LIVES =
    5;


  const IDEAL_MIN =
    28;


  const IDEAL_MAX =
    82;



  /* =========================================================
     PRODUTOS
     ========================================================= */


  const PRODUCTS = [

    {
      id: "soja",
      name: "Soja",
      icon: "🫘"
    },

    {
      id: "milho",
      name: "Milho",
      icon: "🌽"
    },

    {
      id: "trigo",
      name: "Trigo",
      icon: "🌾"
    }

  ];



  /* =========================================================
     ESTADO DA PARTIDA
     ========================================================= */


  let running =
    false;


  let secondsLeft =
    SESSION_SECONDS;


  let score =
    0;


  let lives =
    MAX_LIVES;


  let combo =
    0;


  let bestCombo =
    0;


  let correctLoads =
    0;


  let errors =
    0;


  let attempts =
    0;


  let currentLoad =
    null;


  let currentLoadSeconds =
    INITIAL_LOAD_SECONDS;


  let gameTimer =
    null;


  let loadTimer =
    null;


  let resetTimer =
    null;


  let silos =
    [];



  /* =========================================================
     UTILITÁRIOS
     ========================================================= */


  function clamp(
    value,
    min = 0,
    max = 100
  ) {

    return Math.max(
      min,
      Math.min(
        max,
        value
      )
    );

  }



  function shuffle(
    array
  ) {

    const copy =
      [...array];


    for (
      let i =
        copy.length - 1;
      i > 0;
      i--
    ) {

      const j =
        Math.floor(
          Math.random() *
          (i + 1)
        );


      [
        copy[i],
        copy[j]
      ] =
      [
        copy[j],
        copy[i]
      ];

    }


    return copy;

  }



  function formatTime(
    totalSeconds
  ) {

    const minutes =
      Math.floor(
        totalSeconds / 60
      );


    const seconds =
      totalSeconds % 60;


    return (
      String(minutes)
        .padStart(
          2,
          "0"
        )
      +
      ":"
      +
      String(seconds)
        .padStart(
          2,
          "0"
        )
    );

  }



  function siloLetter(
    index
  ) {

    return String.fromCharCode(
      65 + index
    );

  }



  /* =========================================================
     SONS SIMPLES
     ========================================================= */


  function tone(
    type = "tap"
  ) {

    try {

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


      if (!AudioContext) {
        return;
      }


      const ctx =
        new AudioContext();


      const oscillator =
        ctx.createOscillator();


      const gain =
        ctx.createGain();


      oscillator.connect(
        gain
      );


      gain.connect(
        ctx.destination
      );


      if (
        type === "success"
      ) {

        oscillator.frequency.value =
          720;

      }

      else if (
        type === "error"
      ) {

        oscillator.frequency.value =
          180;

      }

      else {

        oscillator.frequency.value =
          420;

      }


      gain.gain.setValueAtTime(
        0.06,
        ctx.currentTime
      );


      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.16
      );


      oscillator.start();


      oscillator.stop(
        ctx.currentTime + 0.17
      );


    }

    catch (
      error
    ) {

      /* som é opcional */

    }

  }



  /* =========================================================
     FALAS DOS MASCOTES
     ========================================================= */


  function speak(
    toninho,
    aroldinho
  ) {

    if (
      toninho &&
      toninhoSpeech
    ) {

      toninhoSpeech.textContent =
        toninho;

    }


    if (
      aroldinho &&
      aroldinhoSpeech
    ) {

      aroldinhoSpeech.textContent =
        aroldinho;

    }

  }



  /* =========================================================
     DESTINOS SECRETOS
     ========================================================= */


  function createSecretSilos() {

    /*
      Sempre teremos:

      SOJA
      MILHO
      TRIGO

      + um produto repetido aleatoriamente.

      Exemplo:

      A = milho
      B = soja
      C = trigo
      D = soja

      A posição muda em toda partida.
    */


    const repeatedProduct =
      PRODUCTS[
        Math.floor(
          Math.random() *
          PRODUCTS.length
        )
      ];


    const productDistribution =
      shuffle([

        PRODUCTS[0],

        PRODUCTS[1],

        PRODUCTS[2],

        repeatedProduct

      ]);


    silos =
      productDistribution.map(
        (
          product,
          index
        ) => {

          return {

            index,

            productId:
              product.id,

            level:
              34 +
              Math.random() *
              22,

            drain:
              0.28 +
              Math.random() *
              0.20,

            boost:
              0,

            available:
              true

          };

        }
      );


    /*
      IMPORTANTE:

      Em nenhum momento
      productId será exibido
      na tela.
    */

  }



  /* =========================================================
     HUD E SILOS
     ========================================================= */


  function updateHud() {

    timerEl.textContent =
      formatTime(
        secondsLeft
      );


    scoreEl.textContent =
      String(
        Math.max(
          0,
          Math.round(
            score
          )
        )
      );


    comboEl.textContent =
      "x" +
      combo;


    livesEl.textContent =
      lives > 0
        ?
        "❤".repeat(
          lives
        )
        :
        "0";


    siloButtons.forEach(
      (
        button,
        index
      ) => {

        const silo =
          silos[index];


        if (!silo) {
          return;
        }


        const value =
          $(".silo-unit__title b", button);


        const fill =
          $(".silo-unit__fill", button);


        const status =
          button.querySelector(
            ":scope > span"
          );


        if (value) {

          value.textContent =
            Math.round(
              silo.level
            )
            +
            "%";

        }


        if (fill) {

          fill.style.height =
            clamp(
              silo.level
            )
            +
            "%";

        }


        button.classList.remove(
          "is-good",
          "is-warning",
          "is-danger",
          "is-low"
        );


        /*
          Os estilos indicam
          apenas CAPACIDADE.

          Nunca produto.
        */


        if (
          silo.level <
          IDEAL_MIN
        ) {

          button.classList.add(
            "is-low"
          );


          if (status) {

            status.textContent =
              "NÍVEL BAIXO";

          }

        }


        else if (
          silo.level <=
          IDEAL_MAX
        ) {

          button.classList.add(
            "is-good"
          );


          if (status) {

            status.textContent =
              "DISPONÍVEL";

          }

        }


        else if (
          silo.level <= 94
        ) {

          button.classList.add(
            "is-warning"
          );


          if (status) {

            status.textContent =
              "ATENÇÃO";

          }

        }


        else {

          button.classList.add(
            "is-danger"
          );


          if (status) {

            status.textContent =
              "QUASE CHEIO";

          }

        }


        button.disabled =
          !running;

      }
    );

  }



  /* =========================================================
     TEMPO DA CARGA
     ========================================================= */


  function loadDeadline() {

    /*
      Conforme a partida avança,
      o tempo para decidir diminui.
    */


    if (
      secondsLeft <= 15
    ) {

      return 3;

    }


    if (
      secondsLeft <= 35
    ) {

      return 4;

    }


    if (
      secondsLeft <= 55
    ) {

      return 5;

    }


    return 6;

  }



  function updateLoadCard() {

    if (
      !currentLoad
    ) {

      return;

    }


    loadIcon.textContent =
      currentLoad.product.icon;


    loadName.textContent =
      currentLoad.product.name;


    loadAmount.textContent =
      "+"
      +
      currentLoad.amount
      +
      "%";


    const deadline =
      currentLoad.deadline;


    const percent =
      clamp(
        (
          currentLoadSeconds /
          deadline
        )
        *
        100
      );


    loadTimeBar.style.width =
      percent
      +
      "%";


    loadEl.classList.toggle(
      "is-urgent",
      currentLoadSeconds <= 2
    );

  }



  function clearLoadTimer() {

    if (
      loadTimer
    ) {

      clearInterval(
        loadTimer
      );


      loadTimer =
        null;

    }

  }



  /* =========================================================
     SILOS COMPATÍVEIS
     ========================================================= */


  function compatibleSilos(
    productId
  ) {

    return silos.filter(
      silo =>
        silo.productId ===
        productId
    );

  }



  function usableCompatibleSilos(
    productId,
    amount
  ) {

    return silos.filter(
      silo =>
        silo.productId ===
          productId
        &&
        (
          silo.level +
          amount
        )
        <=
        100
    );

  }



  /* =========================================================
     GERAÇÃO DE CARGA
     ========================================================= */


  function createNextLoad() {

    if (
      !running
    ) {

      return;

    }


    clearLoadTimer();


    let candidates =
      [...PRODUCTS];


    /*
      Não gera uma carga impossível.

      Se todos os silos compatíveis
      com determinado produto
      estiverem praticamente cheios,
      aquele produto sai temporariamente
      do sorteio.
    */


    candidates =
      candidates.filter(
        product => {

          return silos.some(
            silo =>
              silo.productId ===
                product.id
              &&
              silo.level <= 86
          );

        }
      );


    if (
      !candidates.length
    ) {

      /*
        Se todos estiverem muito cheios,
        força uma pequena expedição.
      */


      silos.forEach(
        silo => {

          silo.level =
            clamp(
              silo.level - 14
            );

        }
      );


      candidates =
        [...PRODUCTS];


      eventEl.textContent =
        "🚚 Expedição liberou espaço nos silos.";


      updateHud();

    }


    const product =
      candidates[
        Math.floor(
          Math.random() *
          candidates.length
        )
      ];


    let amount =
      8 +
      Math.floor(
        Math.random() *
        9
      );


    /*
      Fim da rodada =
      cargas ligeiramente maiores.
    */


    if (
      secondsLeft <= 30
    ) {

      amount += 2;

    }


    if (
      secondsLeft <= 15
    ) {

      amount += 2;

    }


    /*
      Evita carga impossível.
    */


    let possible =
      usableCompatibleSilos(
        product.id,
        amount
      );


    if (
      !possible.length
    ) {

      const compatibles =
        compatibleSilos(
          product.id
        );


      compatibles.forEach(
        silo => {

          silo.level =
            clamp(
              silo.level - 12
            );

        }
      );

    }


    const deadline =
      loadDeadline();


    currentLoad = {

      product,

      amount,

      deadline

    };


    currentLoadSeconds =
      deadline;


    updateLoadCard();


    loadTimer =
      setInterval(
        () => {

          if (
            !running ||
            !currentLoad
          ) {

            return;

          }


          currentLoadSeconds--;


          updateLoadCard();


          if (
            currentLoadSeconds <= 0
          ) {

            clearLoadTimer();


            currentLoad =
              null;


            loseLife(
              "A carga ficou aguardando tempo demais."
            );


            if (
              running
            ) {

              setTimeout(
                createNextLoad,
                450
              );

            }

          }

        },
        1000
      );

  }



  /* =========================================================
     PISTA VISUAL
     ========================================================= */


  function showCorrectHint(
    productId
  ) {

    siloButtons.forEach(
      (
        button,
        index
      ) => {

        if (
          silos[index]
            .productId !==
          productId
        ) {

          return;

        }


        button.classList.add(
          "is-correct-hint"
        );


        setTimeout(
          () => {

            button.classList.remove(
              "is-correct-hint"
            );

          },
          1750
        );

      }
    );

  }



  /* =========================================================
     PERDA DE VIDA
     ========================================================= */


  function loseLife(
    message
  ) {

    lives--;


    errors++;


    combo =
      0;


    score =
      Math.max(
        0,
        score - 120
      );


    eventEl.textContent =
      "⚠ "
      +
      message;


    tone(
      "error"
    );


    speak(
      "Atenção! Esse destino não estava correto.",
      "Memorize a pista e tente novamente!"
    );


    updateHud();


    if (
      lives <= 0
    ) {

      finishGame(
        false
      );

    }

  }



  /* =========================================================
     ESCOLHA DO SILO
     ========================================================= */


  function chooseSilo(
    index
  ) {

    if (
      !running ||
      !currentLoad
    ) {

      return;

    }


    const selectedSilo =
      silos[index];


    if (
      !selectedSilo
    ) {

      return;

    }


    attempts++;


    const expectedProduct =
      currentLoad
        .product
        .id;


    /*
      ==========================================
      ERRO DE PRODUTO
      ==========================================
    */


    if (
      selectedSilo.productId !==
      expectedProduct
    ) {

      clearLoadTimer();


      const wrongButton =
        siloButtons[index];


      wrongButton.classList.add(
        "is-wrong-destination"
      );


      setTimeout(
        () => {

          wrongButton.classList.remove(
            "is-wrong-destination"
          );

        },
        700
      );


      /*
        Depois do erro,
        o silo correto pisca.

        Não aparece produto nem texto.
      */


      showCorrectHint(
        expectedProduct
      );


      currentLoad =
        null;


      loseLife(
        "Produto enviado para o silo errado."
      );


      if (
        running
      ) {

        setTimeout(
          createNextLoad,
          1150
        );

      }


      return;

    }



    /*
      ==========================================
      PRODUTO CORRETO, MAS SEM CAPACIDADE
      ==========================================
    */


    if (
      selectedSilo.level +
      currentLoad.amount >
      100
    ) {

      clearLoadTimer();


      currentLoad =
        null;


      const wrongButton =
        siloButtons[index];


      wrongButton.classList.add(
        "is-wrong-destination"
      );


      setTimeout(
        () => {

          wrongButton.classList.remove(
            "is-wrong-destination"
          );

        },
        700
      );


      loseLife(
        "O destino era compatível, mas o silo estava cheio."
      );


      speak(
        "Você acertou o produto, mas faltou observar a capacidade.",
        "Quando houver dois destinos compatíveis, escolha o mais vazio!"
      );


      if (
        running
      ) {

        setTimeout(
          createNextLoad,
          1050
        );

      }


      return;

    }



    /*
      ==========================================
      ACERTO
      ==========================================
    */


    clearLoadTimer();


    selectedSilo.level +=
      currentLoad.amount;


    selectedSilo.level =
      clamp(
        selectedSilo.level
      );


    correctLoads++;


    combo++;


    bestCombo =
      Math.max(
        bestCombo,
        combo
      );


    /*
      Quanto maior o combo,
      maior o bônus.
    */


    const comboBonus =
      Math.min(
        combo,
        10
      )
      *
      18;


    /*
      Bônus por decidir rapidamente.
    */


    const speedBonus =
      currentLoadSeconds
      *
      12;


    /*
      Bônus de equilíbrio:
      quanto menos cheio,
      melhor a escolha.
    */


    let balanceBonus =
      0;


    if (
      selectedSilo.level <= 75
    ) {

      balanceBonus =
        80;

    }

    else if (
      selectedSilo.level <= 88
    ) {

      balanceBonus =
        40;

    }


    score +=
      120
      +
      comboBonus
      +
      speedBonus
      +
      balanceBonus;


    tone(
      "success"
    );


    eventEl.textContent =
      "✓ Carga recebida com sucesso.";


    if (
      combo >= 6
    ) {

      speak(
        "Excelente memória!",
        "Combo x"
        +
        combo
        +
        "! Você já conhece bem os destinos."
      );

    }

    else if (
      combo >= 3
    ) {

      speak(
        "Boa! Você está memorizando os silos.",
        "Continue assim para aumentar o combo."
      );

    }

    else {

      speak(
        "Destino correto!",
        "Guarde esse silo na memória."
      );

    }


    currentLoad =
      null;


    updateHud();


    setTimeout(
      createNextLoad,
      secondsLeft <= 25
        ?
        280
        :
        480
    );

  }



  /* =========================================================
     EXPEDIÇÃO
     ========================================================= */


  function expeditionEvent() {

    if (
      !running ||
      !silos.length
    ) {

      return;

    }


    const index =
      Math.floor(
        Math.random() *
        silos.length
      );


    const silo =
      silos[index];


    const reduction =
      10 +
      Math.floor(
        Math.random() *
        10
      );


    silo.level =
      clamp(
        silo.level -
        reduction
      );


    eventEl.textContent =
      "🚚 Expedição liberou espaço no Silo "
      +
      siloLetter(
        index
      )
      +
      ".";


    speak(
      "A expedição alterou os níveis.",
      "Observe a capacidade antes da próxima carga."
    );


    updateHud();

  }



  /* =========================================================
     PASSAGEM DO TEMPO
     ========================================================= */


  function tick() {

    if (
      !running
    ) {

      return;

    }


    secondsLeft--;


    /*
      Pequena saída contínua
      de produto dos silos.
    */


    silos.forEach(
      silo => {

        const drain =
          silo.drain +
          (
            silo.boost ||
            0
          );


        silo.level =
          clamp(
            silo.level -
            drain
          );

      }
    );


    /*
      Pequeno bônus por manter
      todos abaixo da zona crítica.
    */


    const safe =
      silos.every(
        silo =>
          silo.level <= 90
      );


    if (
      safe
    ) {

      score += 3;

    }


    /*
      Eventos de expedição.
    */


    if (
      secondsLeft === 57 ||
      secondsLeft === 39 ||
      secondsLeft === 21
    ) {

      expeditionEvent();

    }


    updateHud();


    if (
      secondsLeft <= 0
    ) {

      finishGame(
        true
      );

    }

  }



  /* =========================================================
     RESULTADO
     ========================================================= */


  function finishGame(
    survived
  ) {

    if (
      !running
    ) {

      return;

    }


    running =
      false;


    clearInterval(
      gameTimer
    );


    clearLoadTimer();


    currentLoad =
      null;


    game.hidden =
      true;


    result.hidden =
      false;



    const precision =
      attempts > 0
        ?
        Math.round(
          (
            correctLoads /
            attempts
          )
          *
          100
        )
        :
        0;



    let title =
      "Operação em Desenvolvimento";


    let badge =
      "🥉";


    let description =
      "Você começou a identificar os destinos. Tente novamente e use a memória para aumentar a precisão.";



    if (
      survived &&
      precision >= 90 &&
      bestCombo >= 6
    ) {

      title =
        "Memória Operacional Ouro";


      badge =
        "🏆";


      description =
        "Excelente! Você memorizou os destinos, manteve a capacidade sob controle e conduziu a operação com alta precisão.";

    }


    else if (
      survived &&
      precision >= 75
    ) {

      title =
        "Memória Operacional Prata";


      badge =
        "🥈";


      description =
        "Muito bom! Você identificou a maior parte dos destinos e reagiu bem ao ritmo da operação.";

    }


    else if (
      precision >= 55
    ) {

      title =
        "Memória Operacional Bronze";


      badge =
        "🥉";


      description =
        "Boa tentativa. Agora que você já descobriu alguns destinos, tente novamente e busque uma sequência maior.";

    }


    if (
      !survived
    ) {

      title =
        "Operação Encerrada";


      badge =
        "⚠️";


      description =
        "As cinco vidas terminaram. Memorize as pistas dos silos e tente novamente.";

    }



    $("#siloResultBadge")
      .textContent =
      badge;


    $("#siloResultTitle")
      .textContent =
      title;


    $("#siloResultText")
      .textContent =
      description;


    $("#siloFinalScore")
      .textContent =
      Math.round(
        score
      );


    $("#siloAccuracy")
      .textContent =
      precision
      +
      "%";


    $("#siloBestCombo")
      .textContent =
      "x"
      +
      bestCombo;


    $("#siloLoads")
      .textContent =
      correctLoads;


    $("#siloErrors")
      .textContent =
      errors;



    /*
      Reset automático para
      próximo visitante.
    */


    let countdown =
      20;


    const resetLabel =
      $("#siloReset");


    const renderCountdown =
      () => {

        resetLabel.textContent =
          "Nova partida automática em "
          +
          countdown
          +
          "s.";

      };


    renderCountdown();


    resetTimer =
      setInterval(
        () => {

          countdown--;


          renderCountdown();


          if (
            countdown <= 0
          ) {

            resetToIntro();

          }

        },
        1000
      );

  }



  /* =========================================================
     RESET
     ========================================================= */


  function clearAllTimers() {

    clearInterval(
      gameTimer
    );


    clearInterval(
      loadTimer
    );


    clearInterval(
      resetTimer
    );


    gameTimer =
      null;


    loadTimer =
      null;


    resetTimer =
      null;

  }



  function resetToIntro() {

    clearAllTimers();


    running =
      false;


    currentLoad =
      null;


    result.hidden =
      true;


    game.hidden =
      true;


    intro.hidden =
      false;


    loadEl.classList.remove(
      "is-urgent"
    );


    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  }



  /* =========================================================
     INÍCIO DA PARTIDA
     ========================================================= */


  function startGame() {

    clearAllTimers();


    secondsLeft =
      SESSION_SECONDS;


    score =
      0;


    lives =
      MAX_LIVES;


    combo =
      0;


    bestCombo =
      0;


    correctLoads =
      0;


    errors =
      0;


    attempts =
      0;


    currentLoad =
      null;


    createSecretSilos();


    intro.hidden =
      true;


    result.hidden =
      true;


    game.hidden =
      false;


    running =
      true;


    eventEl.textContent =
      "Descubra os destinos dos quatro silos.";


    speak(
      "Cada silo recebe apenas um produto.",
      "Memorize seus acertos e cuide da capacidade!"
    );


    /*
      Limpa possíveis animações
      da rodada anterior.
    */


    siloButtons.forEach(
      button => {

        button.classList.remove(
          "is-wrong-destination",
          "is-correct-hint"
        );

      }
    );


    updateHud();


    createNextLoad();


    gameTimer =
      setInterval(
        tick,
        1000
      );


    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  }



  /* =========================================================
     EVENTOS DOS BOTÕES
     ========================================================= */


  siloButtons.forEach(
    (
      button,
      index
    ) => {

      button.addEventListener(
        "click",
        () => {

          chooseSilo(
            index
          );

        }
      );

    }
  );



  startButton.addEventListener(
    "click",
    startGame
  );



  if (
    playAgainButton
  ) {

    playAgainButton.addEventListener(
      "click",
      startGame
    );

  }



})();