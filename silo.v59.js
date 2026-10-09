(() => {
  "use strict";

  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];

  const intro=$("#siloIntro"), game=$("#siloGame"), result=$("#siloResult");
  const startBtn=$("#siloStart"), againBtn=$("#siloPlayAgain");
  const buttons=$$(".silo-unit");
  if(!intro || !game || !result || !startBtn || buttons.length!==4) return;

  const PRODUCTS=[
    {id:"soja",name:"Soja",icon:`<svg class="silo-soy-icon" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><path d="M18 66C29 77 54 82 72 66c14-13 13-34 3-45-3-3-8-3-11 0-5 5-10 8-17 10-10 3-21 6-28 14-7 8-7 15-1 21Z" fill="#6da843" stroke="#285d38" stroke-width="4" stroke-linejoin="round"/><path d="M22 64c13 5 31 4 44-5 9-6 14-16 13-27" fill="none" stroke="#3c743e" stroke-width="3" stroke-linecap="round" opacity=".75"/><ellipse cx="35" cy="57" rx="10" ry="9" fill="#e4df78" stroke="#557b3e" stroke-width="2"/><ellipse cx="51" cy="49" rx="10" ry="9" fill="#e4df78" stroke="#557b3e" stroke-width="2"/><ellipse cx="65" cy="39" rx="9" ry="8" fill="#e4df78" stroke="#557b3e" stroke-width="2"/><path d="M72 22c4-6 8-9 14-11" fill="none" stroke="#285d38" stroke-width="5" stroke-linecap="round"/><path d="M83 12c-7 0-12 2-15 7 6 1 11 0 15-7Z" fill="#79b84d" stroke="#285d38" stroke-width="2" stroke-linejoin="round"/></svg>`},
    {id:"milho",name:"Milho",icon:"<svg class=\"grain-corn-icon\" viewBox=\"0 0 96 96\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M48 12c13 0 18 14 18 32s-5 36-18 36-18-18-18-36 5-32 18-32Z\" fill=\"#f2c230\" stroke=\"#9a6a10\" stroke-width=\"3.5\"/><ellipse cx=\"36\" cy=\"24\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"46\" cy=\"24\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"56\" cy=\"24\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"41\" cy=\"33\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"51\" cy=\"33\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"36\" cy=\"42\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"46\" cy=\"42\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"56\" cy=\"42\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"41\" cy=\"51\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"51\" cy=\"51\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"36\" cy=\"60\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"46\" cy=\"60\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"56\" cy=\"60\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"41\" cy=\"69\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><ellipse cx=\"51\" cy=\"69\" rx=\"4.6\" ry=\"4\" fill=\"#f9d64a\" stroke=\"#c98d12\" stroke-width=\"1.4\"/><path d=\"M47 86C30 82 20 66 22 40c8 10 14 22 25 46Z\" fill=\"#7cb24a\" stroke=\"#285d38\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/><path d=\"M49 86c17-4 27-20 25-46-8 10-14 22-25 46Z\" fill=\"#5f9c3c\" stroke=\"#285d38\" stroke-width=\"3.5\" stroke-linejoin=\"round\"/></svg>"},
    {id:"trigo",name:"Trigo",icon:"<svg class=\"grain-wheat-icon\" viewBox=\"0 0 96 96\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M48 90V20\" stroke=\"#8a5a1c\" stroke-width=\"4\" stroke-linecap=\"round\"/><ellipse cx=\"41\" cy=\"22\" rx=\"6\" ry=\"9.5\" transform=\"rotate(-28 41 22)\" fill=\"#e6b85a\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/><ellipse cx=\"55\" cy=\"27\" rx=\"6\" ry=\"9.5\" transform=\"rotate(28 55 27)\" fill=\"#d9a447\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/><path d=\"M37 14l-9 -9M59 19l9 -9\" stroke=\"#b9853a\" stroke-width=\"2\" stroke-linecap=\"round\"/><ellipse cx=\"41\" cy=\"33\" rx=\"6\" ry=\"9.5\" transform=\"rotate(-28 41 33)\" fill=\"#e6b85a\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/><ellipse cx=\"55\" cy=\"38\" rx=\"6\" ry=\"9.5\" transform=\"rotate(28 55 38)\" fill=\"#d9a447\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/><path d=\"M37 25l-9 -9M59 30l9 -9\" stroke=\"#b9853a\" stroke-width=\"2\" stroke-linecap=\"round\"/><ellipse cx=\"41\" cy=\"44\" rx=\"6\" ry=\"9.5\" transform=\"rotate(-28 41 44)\" fill=\"#e6b85a\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/><ellipse cx=\"55\" cy=\"49\" rx=\"6\" ry=\"9.5\" transform=\"rotate(28 55 49)\" fill=\"#d9a447\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/><path d=\"M37 36l-9 -9M59 41l9 -9\" stroke=\"#b9853a\" stroke-width=\"2\" stroke-linecap=\"round\"/><ellipse cx=\"41\" cy=\"55\" rx=\"6\" ry=\"9.5\" transform=\"rotate(-28 41 55)\" fill=\"#e6b85a\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/><ellipse cx=\"55\" cy=\"60\" rx=\"6\" ry=\"9.5\" transform=\"rotate(28 55 60)\" fill=\"#d9a447\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/><path d=\"M37 47l-9 -9M59 52l9 -9\" stroke=\"#b9853a\" stroke-width=\"2\" stroke-linecap=\"round\"/><ellipse cx=\"41\" cy=\"66\" rx=\"6\" ry=\"9.5\" transform=\"rotate(-28 41 66)\" fill=\"#e6b85a\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/><ellipse cx=\"55\" cy=\"71\" rx=\"6\" ry=\"9.5\" transform=\"rotate(28 55 71)\" fill=\"#d9a447\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/><path d=\"M37 58l-9 -9M59 63l9 -9\" stroke=\"#b9853a\" stroke-width=\"2\" stroke-linecap=\"round\"/><ellipse cx=\"48\" cy=\"14\" rx=\"5.5\" ry=\"8.5\" fill=\"#e6b85a\" stroke=\"#8a5a1c\" stroke-width=\"2.4\"/></svg>"}
  ];
  const SESSION=75, MAX_LIVES=5, IDEAL_MIN=28, IDEAL_MAX=82;

  let running=false, seconds=SESSION, score=0, lives=MAX_LIVES, combo=0, bestCombo=0;
  let correct=0, errors=0, attempts=0, current=null, loadSeconds=6;
  let gameTimer=null, loadTimer=null, resetTimer=null, silos=[];

  const timerEl=$("#siloTimer"), scoreEl=$("#siloScore"), comboEl=$("#siloCombo"), livesEl=$("#siloLives");
  const eventEl=$("#siloEvent"), loadEl=$("#siloLoad"), iconEl=$("#siloLoadIcon"), nameEl=$("#siloLoadName"), amountEl=$("#siloLoadAmount"), barEl=$("#siloLoadTime");
  const toninho=$("#siloToninho"), aroldinho=$("#siloAroldinho");

  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
  const format=n=>`${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;
  const letter=i=>String.fromCharCode(65+i);

  const gameEmit=(type,data={})=>{ try{ document.dispatchEvent(new CustomEvent("coamo:game",{detail:Object.assign({game:"silo",type},data)})); }catch(_){} };
  function say(t,a){ if(window.CoamoMascots && window.CoamoMascots.speaks) return; if(t && toninho) toninho.textContent=t; if(a && aroldinho) aroldinho.textContent=a; }
  function clearLoad(){ if(loadTimer){ clearInterval(loadTimer); loadTimer=null; } }

  function buildSilos(){
    silos = Array.from({length:4}, (_,i)=>({
      index:i,
      productId:null,
      level:34+Math.random()*22,
      drain:.28+Math.random()*.18,
    }));
  }

  function assignedProducts(){
    return new Set(silos.filter(s=>s.productId).map(s=>s.productId));
  }

  function eligibleSilosFor(productId){
    return silos.filter(s=>!s.productId || s.productId===productId);
  }

  function paint(){
    timerEl.textContent=format(seconds);
    scoreEl.textContent=String(Math.max(0,Math.round(score)));
    comboEl.textContent=`x${combo}`;
    livesEl.textContent=lives>0?"❤".repeat(lives):"0";

    buttons.forEach((b,i)=>{
      const s=silos[i]; if(!s) return;
      const v=$(".silo-unit__title b",b), f=$(".silo-unit__fill",b), st=b.querySelector(":scope > span");
      if(v) v.textContent=`${Math.round(s.level)}%`;
      if(f) f.style.height=`${clamp(s.level)}%`;
      b.classList.remove("is-good","is-warning","is-danger","is-low");
      let status = s.productId ? "EM USO" : "LIVRE";
      if(s.level<IDEAL_MIN){ b.classList.add("is-low"); status = s.productId ? "BAIXO" : "LIVRE"; }
      else if(s.level<=IDEAL_MAX){ b.classList.add("is-good"); }
      else if(s.level<=94){ b.classList.add("is-warning"); status = "ATENÇÃO"; }
      else { b.classList.add("is-danger"); status = "QUASE CHEIO"; }
      if(st) st.textContent=status;
      b.disabled=!running;
    });
  }

  function decisionTime(){
    if(seconds<=15) return 3;
    if(seconds<=35) return 4;
    if(seconds<=55) return 5;
    return 6;
  }

  function paintLoad(){
    if(!current) return;
    iconEl.innerHTML=current.product.icon;
    nameEl.textContent=current.product.name;
    amountEl.textContent=`+${current.amount}%`;
    barEl.style.width=`${clamp((loadSeconds/current.deadline)*100)}%`;
    loadEl.classList.toggle("is-urgent",loadSeconds<=2);
  }

  function chooseNextProduct(){
    const assigned = assignedProducts();
    const unassigned = PRODUCTS.filter(p=>!assigned.has(p.id));
    const openSilos = silos.filter(s=>!s.productId).length;
    if(openSilos>0 && unassigned.length){
      return unassigned[Math.floor(Math.random()*unassigned.length)];
    }
    return PRODUCTS[Math.floor(Math.random()*PRODUCTS.length)];
  }

  function nextLoad(){
    if(!running) return;
    clearLoad();

    // free some space if needed
    if(silos.every(s=>s.level>=94)){
      silos.forEach(s=>s.level=clamp(s.level-16));
      eventEl.textContent="🚚 Expedição liberou espaço em todos os silos.";
      paint();
    }

    const product=chooseNextProduct();
    let amount=8+Math.floor(Math.random()*9);
    if(seconds<=30) amount+=2;
    if(seconds<=15) amount+=2;

    // if every eligible silo would estourar, relieve compatible or free silos a bit
    let eligible = eligibleSilosFor(product.id);
    if(!eligible.some(s=>s.level+amount<=100)){
      eligible.forEach(s=>s.level=clamp(s.level-12));
      paint();
    }

    const deadline=decisionTime();
    current={product,amount,deadline};
    gameEmit("load",{product:product.name,assigned:silos.map((s,i)=>s.productId?{silo:letter(i),product:(PRODUCTS.find(p=>p.id===s.productId)||{}).name}:null).filter(Boolean),known:!!silos.find(s=>s.productId===product.id)});
    loadSeconds=deadline;
    paintLoad();

    loadTimer=setInterval(()=>{
      if(!running || !current) return;
      loadSeconds--;
      paintLoad();
      if(loadSeconds<=0){
        clearLoad();
        current=null;
        lastButton=null;
        gameEmit("timeout",{});
        loseLife("A carga ficou aguardando tempo demais.");
        if(running) setTimeout(nextLoad,450);
      }
    },1000);
  }

  function loseLife(msg){
    lives--; errors++; combo=0; score=Math.max(0,score-120);
    eventEl.textContent=`⚠ ${msg}`;
    gameEmit("wrong",{msg,lives,el:lastButton});
    say("Atenção à armazenagem!","Memorize cada silo e tente novamente.");
    paint();
    if(lives<=0) finish(false);
  }

  let lastButton=null;
  function choose(index){
    if(!running || !current) return;
    lastButton=buttons[index]||null;
    const silo=silos[index]; if(!silo) return;
    attempts++;
    const expected=current.product.id;

    // Silo already dedicated to another product -> lose life.
    if(silo.productId && silo.productId!==expected){
      clearLoad();
      const b=buttons[index];
      b.classList.add("is-wrong-destination");
      setTimeout(()=>b.classList.remove("is-wrong-destination"),700);
      current=null;
      loseLife(`O Silo ${letter(index)} já foi destinado a outro produto.`);
      if(running) setTimeout(nextLoad,900);
      return;
    }

    // Capacity check
    if(silo.level+current.amount>100){
      clearLoad();
      current=null;
      gameEmit("capacity",{silo:letter(index),el:buttons[index]});
      loseLife(`O Silo ${letter(index)} não comportava essa carga.`);
      say("Observe o nível antes de armazenar.","Acertar o silo também exige cuidar da capacidade!");
      if(running) setTimeout(nextLoad,900);
      return;
    }

    const firstAssignment = !silo.productId;
    clearLoad();
    if(firstAssignment) silo.productId = expected;
    silo.level=clamp(silo.level+current.amount);
    correct++; combo++; bestCombo=Math.max(bestCombo,combo);
    const comboBonus=Math.min(combo,10)*18;
    const speedBonus=loadSeconds*12;
    const balanceBonus=silo.level<=75?80:(silo.level<=88?40:0);
    score+=120+comboBonus+speedBonus+balanceBonus+(firstAssignment?40:0);

    if(firstAssignment){
      eventEl.textContent=`✓ O Silo ${letter(index)} agora recebe ${current.product.name}.`;
      say(`Boa! A primeira carga definiu o Silo ${letter(index)}.`,`Memorize: agora esse silo recebe somente ${current.product.name}.`);
    } else {
      eventEl.textContent="✓ Carga recebida com sucesso.";
      if(combo>=6) say("Excelente memória!",`Combo x${combo}! Você domina os destinos.`);
      else if(combo>=3) say("Muito bem!","Continue memorizando para manter o combo.");
      else say("Destino correto!","Agora guarde esse silo na memória.");
    }

    gameEmit(firstAssignment?"assign":"correct",{silo:letter(index),product:current.product.name,combo,gain:120+comboBonus+speedBonus+balanceBonus+(firstAssignment?40:0),level:silo.level,el:buttons[index]});
    current=null; paint();
    setTimeout(nextLoad,seconds<=25?280:480);
  }

  function expedition(){
    if(!running || !silos.length) return;
    const i=Math.floor(Math.random()*silos.length);
    const reduction=10+Math.floor(Math.random()*10);
    silos[i].level=clamp(silos[i].level-reduction);
    eventEl.textContent=`🚚 Expedição liberou espaço no Silo ${letter(i)}.`;
    gameEmit("expedition",{silo:letter(i),el:buttons[i]});
    say("A expedição alterou os níveis.","Observe a capacidade antes da próxima carga.");
    paint();
  }

  function tick(){
    if(!running) return;
    seconds--;
    silos.forEach(s=>s.level=clamp(s.level-s.drain));
    if(silos.every(s=>s.level<=90)) score+=3;
    if([57,39,21].includes(seconds)) expedition();
    if(seconds===30||seconds===10) gameEmit("time",{seconds});
    paint();
    if(seconds<=0) finish(true);
  }

  async function finish(survived){
    if(!running) return;
    running=false;
    clearInterval(gameTimer); gameTimer=null;
    clearLoad(); current=null;
    game.hidden=true; result.hidden=false;

    const precision=attempts?Math.round((correct/attempts)*100):0;
    let title="Operação em Desenvolvimento",badge="🥉",
        desc="Você começou bem. Na próxima rodada, memorize os silos mais rápido para aumentar a precisão.";
    if(survived && precision>=90 && bestCombo>=6){
      title="Memória Operacional Ouro"; badge="🏆";
      desc="Excelente! Você definiu os silos, memorizou os destinos e manteve a operação sob controle.";
    } else if(survived && precision>=75){
      title="Memória Operacional Prata"; badge="🥈";
      desc="Muito bom! Você dominou boa parte dos silos e conduziu a operação com segurança.";
    } else if(survived && precision>=55){
      title="Memória Operacional Bronze"; badge="🥉";
      desc="Boa tentativa. Continue praticando para memorizar os silos e aumentar a sequência de acertos.";
    } else if(!survived){
      title="Operação Encerrada"; badge="⚠️";
      desc="As cinco vidas terminaram. Tente novamente e memorize melhor os destinos dos silos.";
    }

    gameEmit("finish",{survived,title,precision,score:Math.round(score),bestCombo});
    $("#siloResultBadge").textContent=badge;
    $("#siloResultTitle").textContent=title;
    $("#siloResultText").textContent=desc;
    $("#siloFinalScore").textContent=Math.round(score);
    $("#siloAccuracy").textContent=`${precision}%`;
    $("#siloBestCombo").textContent=`x${bestCombo}`;
    $("#siloLoads").textContent=correct;
    $("#siloErrors").textContent=errors;
    window.CoamoLeaderboard?.render?.("silo");

    const duration=Math.max(0,SESSION-seconds);
    try{
      if(window.CoamoLeaderboard?.maybeCapture){
        await window.CoamoLeaderboard.maybeCapture("silo",{
          score:Math.round(score),
          duration,
          accuracy:precision,
          combo:bestCombo,
          loads:correct,
          errors,
        });
      }
    }catch(_){ }
    window.CoamoLeaderboard?.render?.("silo");

    let countdown=25; const reset=$("#siloReset");
    const draw=()=>{reset.textContent=`Nova partida automática em ${countdown}s.`;};
    draw();
    resetTimer=setInterval(()=>{countdown--;draw();if(countdown<=0) resetIntro();},1000);
  }

  function clearTimers(){
    clearInterval(gameTimer);clearInterval(loadTimer);clearInterval(resetTimer);
    gameTimer=loadTimer=resetTimer=null;
  }

  function resetIntro(){
    clearTimers();running=false;current=null;
    result.hidden=true;game.hidden=true;intro.hidden=false;
    loadEl.classList.remove("is-urgent");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function start(){
    clearTimers();
    seconds=SESSION;score=0;lives=MAX_LIVES;combo=0;bestCombo=0;correct=0;errors=0;attempts=0;current=null;
    buildSilos();
    intro.hidden=true;result.hidden=true;game.hidden=false;running=true;
    eventEl.textContent="A primeira carga colocada em um silo define o produto daquele silo.";
    say("A primeira carga define cada silo.","Memorize seus acertos e cuide da capacidade!");
    buttons.forEach(b=>b.classList.remove("is-wrong-destination","is-correct-hint"));
    paint();nextLoad();
    gameEmit("start",{lives:MAX_LIVES,seconds:SESSION});
    gameTimer=setInterval(tick,1000);
    window.CoamoLeaderboard?.render?.("silo");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  buttons.forEach((b,i)=>b.addEventListener("click",()=>choose(i)));
  startBtn.addEventListener("click",start);
  againBtn?.addEventListener("click",start);
  window.CoamoLeaderboard?.render?.("silo");
})();
