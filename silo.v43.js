(() => {

  "use strict";

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];


  const intro = $("#siloIntro");
  const game = $("#siloGame");
  const result = $("#siloResult");

  const startButton = $("#siloStart");
  const playAgainButton = $("#siloPlayAgain");

  if (
    !intro ||
    !game ||
    !result ||
    !startButton
  ) {
    return;
  }


  const SESSION_TIME = 75;
  const LOAD_TIME = 6;


  let running = false;

  let time = SESSION_TIME;

  let score = 0;

  let lives = 3;

  let combo = 0;

  let bestCombo = 0;

  let loads = 0;

  let idealTime = 0;

  let currentLoad = null;

  let loadCountdown = LOAD_TIME;

  let gameTimer = null;

  let loadTimer = null;

  let resetTimer = null;


  let silos = [];


  const crops = [

    {
      name: "Soja",
      icon: "🫘"
    },

    {
      name: "Milho",
      icon: "🌽"
    },

    {
      name: "Trigo",
      icon: "🌾"
    }

  ];


  const timerEl = $("#siloTimer");
  const scoreEl = $("#siloScore");
  const comboEl = $("#siloCombo");
  const livesEl = $("#siloLives");

  const eventEl = $("#siloEvent");

  const loadEl = $("#siloLoad");
  const loadIcon = $("#siloLoadIcon");
  const loadName = $("#siloLoadName");
  const loadAmount = $("#siloLoadAmount");
  const loadTime = $("#siloLoadTime");

  const toninhoSpeech = $("#siloToninho");
  const aroldinhoSpeech = $("#siloAroldinho");

  const siloButtons = $$(".silo-unit");


  function clamp(value) {

    return Math.max(
      0,
      Math.min(
        100,
        value
      )
    );

  }


  function formatTime(seconds) {

    const minutes =
      Math.floor(seconds / 60);

    const secs =
      seconds % 60;

    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );

  }


  function spread() {

    const values =
      silos.map(
        silo => silo.level
      );

    return (
      Math.max(...values) -
      Math.min(...values)
    );

  }


  function allIdeal() {

    return silos.every(
      silo =>
        silo.level >= 30 &&
        silo.level <= 82
    );

  }


  function setSpeech(
    toninho,
    aroldinho
  ) {

    if (toninho) {
      toninhoSpeech.textContent =
        toninho;
    }

    if (aroldinho) {
      aroldinhoSpeech.textContent =
        aroldinho;
    }

  }


  function updateHud() {

    timerEl.textContent =
      formatTime(time);

    scoreEl.textContent =
      score;

    comboEl.textContent =
      "x" + combo;

    livesEl.textContent =
      lives > 0
        ? "❤".repeat(lives)
        : "0";


    siloButtons.forEach(
      (button, index) => {

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
          button.querySelector(":scope > span");


        value.textContent =
          Math.round(silo.level) + "%";


        fill.style.height =
          clamp(silo.level) + "%";


        button.classList.remove(
          "is-good",
          "is-warning",
          "is-danger",
          "is-low",
          "is-maintenance"
        );


        if (silo.maintenance) {

          button.classList.add(
            "is-maintenance"
          );

          status.textContent =
            "MANUTENÇÃO";

          button.disabled = true;

          return;

        }


        button.disabled =
          !running;


        if (
          silo.level >= 30 &&
          silo.level <= 82
        ) {

          button.classList.add(
            "is-good"
          );

          status.textContent =
            "FAIXA IDEAL";

        }

        else if (
          silo.level > 82 &&
          silo.level <= 94
        ) {

          button.classList.add(
            "is-warning"
          );

          status.textContent =
            "ATENÇÃO";

        }

        else if (
          silo.level > 94
        ) {

          button.classList.add(
            "is-danger"
          );

          status.textContent =
            "RISCO DE TRANSBORDO";

        }

        else {

          button.classList.add(
            "is-low"
          );

          status.textContent =
            "NÍVEL BAIXO";

        }

      }
    );

  }


  function updateLoad() {

    if (!currentLoad) {
      return;
    }


    loadIcon.textContent =
      currentLoad.crop.icon;


    loadName.textContent =
      currentLoad.crop.name;


    loadAmount.textContent =
      "+" +
      currentLoad.amount +
      "%";


    loadTime.style.width =
      (
        loadCountdown /
        LOAD_TIME *
        100
      ) +
      "%";


    loadEl.classList.toggle(
      "is-urgent",
      loadCountdown <= 2
    );

  }


  function clearLoadTimer() {

    if (loadTimer) {

      clearInterval(
        loadTimer
      );

      loadTimer = null;

    }

  }


  function loseLife(message) {

    lives--;

    combo = 0;


    eventEl.textContent =
      message;


    setSpeech(
      "Atenção ao fluxo.",
      "Ainda dá para recuperar!"
    );


    updateHud();


    if (lives <= 0) {

      finishGame(false);

    }

  }


  function generateLoad() {

    if (!running) {
      return;
    }


    clearLoadTimer();


    const crop =
      crops[
        Math.floor(
          Math.random() *
          crops.length
        )
      ];


    let amount =
      10 +
      Math.floor(
        Math.random() * 9
      );


    if (time < 40) {
      amount += 3;
    }


    if (time < 20) {
      amount += 4;
    }


    currentLoad = {
      crop,
      amount
    };


    loadCountdown =
      LOAD_TIME;


    updateLoad();


    loadTimer =
      setInterval(
        () => {

          if (
            !running ||
            !currentLoad
          ) {
            return;
          }


          loadCountdown--;


          updateLoad();


          if (
            loadCountdown <= 0
          ) {

            clearLoadTimer();


            currentLoad = null;


            loseLife(
              "A carga ficou aguardando tempo demais."
            );


            if (running) {

              setTimeout(
                generateLoad,
                450
              );

            }

          }

        },
        1000
      );

  }


  function sendToSilo(index) {

    if (
      !running ||
      !currentLoad
    ) {
      return;
    }


    const silo =
      silos[index];


    if (
      !silo ||
      silo.maintenance
    ) {

      setSpeech(
        "Esse silo não está disponível.",
        "Escolha outro destino."
      );

      return;

    }


    const previousSpread =
      spread();


    const futureLevel =
      silo.level +
      currentLoad.amount;


    loads++;


    clearLoadTimer();


    if (
      futureLevel > 100
    ) {

      silo.level = 98;


      currentLoad = null;


      loseLife(
        "Capacidade ultrapassada no Silo " +
        String.fromCharCode(
          65 + index
        ) +
        "."
      );


      if (running) {

        setTimeout(
          generateLoad,
          500
        );

      }


      return;

    }


    silo.level =
      futureLevel;


    const newSpread =
      spread();


    const goodLevel =
      silo.level >= 30 &&
      silo.level <= 82;


    const balanceImproved =
      newSpread <=
      previousSpread + 3;


    if (
      goodLevel &&
      balanceImproved
    ) {

      combo++;


      bestCombo =
        Math.max(
          bestCombo,
          combo
        );


      score +=
        150 +
        Math.min(
          combo,
          8
        ) * 20;


      setSpeech(
        "Boa distribuição!",
        "Combo x" + combo +
        "! Continue equilibrando."
      );

    }

    else if (
      silo.level <= 92
    ) {

      combo = 0;

      score += 70;


      setSpeech(
        "Carga recebida.",
        "Observe os outros níveis agora."
      );

    }

    else {

      combo = 0;

      score += 30;


      setSpeech(
        "Esse silo ficou muito cheio.",
        "A próxima carga precisa ir para outro."
      );

    }


    currentLoad = null;


    updateHud();


    setTimeout(
      generateLoad,
      time < 25
        ? 350
        : 520
    );

  }


  function maintenanceEvent() {

    const available =
      silos
        .map(
          (_, index) => index
        )
        .filter(
          index =>
            !silos[index]
              .maintenance
        );


    if (
      !available.length
    ) {
      return;
    }


    const index =
      available[
        Math.floor(
          Math.random() *
          available.length
        )
      ];


    const letter =
      String.fromCharCode(
        65 + index
      );


    silos[index]
      .maintenance = true;


    eventEl.textContent =
      "🔧 Silo " +
      letter +
      " em manutenção.";


    setSpeech(
      "Mudança na operação!",
      "Redirecione as próximas cargas."
    );


    updateHud();


    setTimeout(
      () => {

        if (
          !silos[index]
        ) {
          return;
        }


        silos[index]
          .maintenance = false;


        eventEl.textContent =
          "✓ Silo " +
          letter +
          " voltou à operação.";


        updateHud();

      },
      6500
    );

  }


  function expeditionEvent() {

    const index =
      Math.floor(
        Math.random() *
        silos.length
      );


    const letter =
      String.fromCharCode(
        65 + index
      );


    silos[index]
      .boost = 3;


    eventEl.textContent =
      "🚚 Expedição acelerada no Silo " +
      letter +
      ".";


    setSpeech(
      "A expedição mudou os níveis.",
      "Aproveite para redistribuir o fluxo."
    );


    setTimeout(
      () => {

        if (
          silos[index]
        ) {

          silos[index]
            .boost = 0;

        }

      },
      6500
    );

  }


  function randomEvent() {

    if (!running) {
      return;
    }


    if (
      Math.random() <
      0.5
    ) {

      maintenanceEvent();

    }

    else {

      expeditionEvent();

    }

  }


  function tick() {

    if (!running) {
      return;
    }


    time--;


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


        if (
          silo.level >= 30 &&
          silo.level <= 82
        ) {

          score += 2;

        }

      }
    );


    if (
      allIdeal()
    ) {

      idealTime++;

      score += 12;

    }


    if (
      time > 0 &&
      time % 13 === 0
    ) {

      randomEvent();

    }


    updateHud();


    if (
      time <= 0
    ) {

      finishGame(true);

    }

  }


  function finishGame(
    survived
  ) {

    if (!running) {
      return;
    }


    running = false;


    clearInterval(
      gameTimer
    );


    clearLoadTimer();


    game.hidden = true;

    result.hidden = false;


    const levels =
      silos.map(
        silo => silo.level
      );


    const finalSpread =
      Math.max(...levels) -
      Math.min(...levels);


    const balance =
      Math.max(
        0,
        Math.round(
          100 -
          finalSpread
        )
      );


    let title =
      "Operação em Ajuste";


    let badge =
      "🥉";


    let message =
      "Você manteve a operação funcionando. Tente distribuir as próximas cargas com ainda mais equilíbrio.";


    if (
      balance >= 82 &&
      score >= 2200 &&
      lives >= 2
    ) {

      title =
        "Equilíbrio Ouro";


      badge =
        "🏆";


      message =
        "Excelente controle de capacidade. Os quatro silos trabalharam de forma equilibrada.";

    }

    else if (
      balance >= 68 &&
      score >= 1400
    ) {

      title =
        "Equilíbrio Prata";


      badge =
        "🥈";


      message =
        "Ótima gestão do fluxo. Você reagiu bem às mudanças da operação.";

    }

    else if (
      !survived
    ) {

      message =
        "A capacidade chegou ao limite. Antecipe os silos que estão próximos do transbordo.";

    }


    $("#siloResultBadge")
      .textContent =
      badge;


    $("#siloResultTitle")
      .textContent =
      title;


    $("#siloResultText")
      .textContent =
      message;


    $("#siloFinalScore")
      .textContent =
      score;


    $("#siloBalance")
      .textContent =
      balance + "%";


    $("#siloBestCombo")
      .textContent =
      "x" + bestCombo;


    $("#siloLoads")
      .textContent =
      loads;


    $("#siloIdealTime")
      .textContent =
      idealTime + "s";


    let countdown =
      20;


    const resetLabel =
      $("#siloReset");


    const paintCountdown =
      () => {

        resetLabel.textContent =
          "Nova partida automática em " +
          countdown +
          "s.";

      };


    paintCountdown();


    resetTimer =
      setInterval(
        () => {

          countdown--;

          paintCountdown();


          if (
            countdown <= 0
          ) {

            resetToIntro();

          }

        },
        1000
      );

  }


  function resetToIntro() {

    running = false;


    clearInterval(
      gameTimer
    );


    clearLoadTimer();


    clearInterval(
      resetTimer
    );


    game.hidden = true;

    result.hidden = true;

    intro.hidden = false;


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  function startGame() {

    clearInterval(
      gameTimer
    );


    clearLoadTimer();


    clearInterval(
      resetTimer
    );


    time =
      SESSION_TIME;


    score = 0;

    lives = 3;

    combo = 0;

    bestCombo = 0;

    loads = 0;

    idealTime = 0;


    silos = [

      {
        level:
          44 +
          Math.random() * 10,
        drain:
          0.45 +
          Math.random() * 0.30,
        maintenance: false,
        boost: 0
      },

      {
        level:
          40 +
          Math.random() * 14,
        drain:
          0.45 +
          Math.random() * 0.30,
        maintenance: false,
        boost: 0
      },

      {
        level:
          46 +
          Math.random() * 10,
        drain:
          0.45 +
          Math.random() * 0.30,
        maintenance: false,
        boost: 0
      },

      {
        level:
          42 +
          Math.random() * 12,
        drain:
          0.45 +
          Math.random() * 0.30,
        maintenance: false,
        boost: 0
      }

    ];


    intro.hidden = true;

    result.hidden = true;

    game.hidden = false;


    running = true;


    eventEl.textContent =
      "Operação estável";


    setSpeech(
      "Observe todos os níveis.",
      "Vamos manter tudo equilibrado!"
    );


    updateHud();


    generateLoad();


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


  siloButtons.forEach(
    (button, index) => {

      button.addEventListener(
        "click",
        () => {

          sendToSilo(
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


  playAgainButton.addEventListener(
    "click",
    startGame
  );

})();