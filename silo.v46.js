(() => {
  "use strict";

  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];

  const intro=$("#siloIntro"), game=$("#siloGame"), result=$("#siloResult");
  const startBtn=$("#siloStart"), againBtn=$("#siloPlayAgain");
  const buttons=$$(".silo-unit");
  if(!intro || !game || !result || !startBtn || buttons.length!==4) return;

  const PRODUCTS=[
    {id:"soja",name:"Soja",icon:"🫘"},
    {id:"milho",name:"Milho",icon:"🌽"},
    {id:"trigo",name:"Trigo",icon:"🌾"}
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

  function shuffle(arr){
    const out=[...arr];
    for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }

  function say(t,a){
    if(t && toninho) toninho.textContent=t;
    if(a && aroldinho) aroldinho.textContent=a;
  }

  function buildSilos(){
    const repeated=PRODUCTS[Math.floor(Math.random()*PRODUCTS.length)];
    const dist=shuffle([PRODUCTS[0],PRODUCTS[1],PRODUCTS[2],repeated]);
    silos=dist.map((p,i)=>({
      index:i, productId:p.id, level:34+Math.random()*22, drain:.28+Math.random()*.20
    }));
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
      if(s.level<IDEAL_MIN){b.classList.add("is-low"); if(st) st.textContent="NÍVEL BAIXO";}
      else if(s.level<=IDEAL_MAX){b.classList.add("is-good"); if(st) st.textContent="DISPONÍVEL";}
      else if(s.level<=94){b.classList.add("is-warning"); if(st) st.textContent="ATENÇÃO";}
      else {b.classList.add("is-danger"); if(st) st.textContent="QUASE CHEIO";}
      b.disabled=!running;
    });
  }

  function decisionTime(){
    if(seconds<=15) return 3;
    if(seconds<=35) return 4;
    if(seconds<=55) return 5;
    return 6;
  }

  function clearLoad(){ if(loadTimer){clearInterval(loadTimer);loadTimer=null;} }

  function paintLoad(){
    if(!current) return;
    iconEl.textContent=current.product.icon;
    nameEl.textContent=current.product.name;
    amountEl.textContent=`+${current.amount}%`;
    barEl.style.width=`${clamp((loadSeconds/current.deadline)*100)}%`;
    loadEl.classList.toggle("is-urgent",loadSeconds<=2);
  }

  function compatible(productId){return silos.filter(s=>s.productId===productId);}

  function nextLoad(){
    if(!running) return;
    clearLoad();

    let candidates=PRODUCTS.filter(p=>silos.some(s=>s.productId===p.id && s.level<=86));
    if(!candidates.length){
      silos.forEach(s=>s.level=clamp(s.level-14));
      candidates=[...PRODUCTS];
      eventEl.textContent="🚚 Expedição liberou espaço nos silos.";
      paint();
    }

    const product=candidates[Math.floor(Math.random()*candidates.length)];
    let amount=8+Math.floor(Math.random()*9);
    if(seconds<=30) amount+=2;
    if(seconds<=15) amount+=2;

    let poss=compatible(product.id).filter(s=>s.level+amount<=100);
    if(!poss.length) compatible(product.id).forEach(s=>s.level=clamp(s.level-12));

    const deadline=decisionTime();
    current={product,amount,deadline};
    loadSeconds=deadline;
    paintLoad();

    loadTimer=setInterval(()=>{
      if(!running || !current) return;
      loadSeconds--;
      paintLoad();
      if(loadSeconds<=0){
        clearLoad();
        current=null;
        loseLife("A carga ficou aguardando tempo demais.");
        if(running) setTimeout(nextLoad,450);
      }
    },1000);
  }

  function hint(productId){
    buttons.forEach((b,i)=>{
      if(silos[i].productId!==productId) return;
      b.classList.add("is-correct-hint");
      setTimeout(()=>b.classList.remove("is-correct-hint"),1750);
    });
  }

  function loseLife(msg){
    lives--; errors++; combo=0; score=Math.max(0,score-120);
    eventEl.textContent=`⚠ ${msg}`;
    say("Atenção! Esse destino não estava correto.","Memorize a pista e tente novamente!");
    paint();
    if(lives<=0) finish(false);
  }

  function choose(index){
    if(!running || !current) return;
    const silo=silos[index]; if(!silo) return;
    attempts++;
    const expected=current.product.id;

    if(silo.productId!==expected){
      clearLoad();
      const b=buttons[index];
      b.classList.add("is-wrong-destination");
      setTimeout(()=>b.classList.remove("is-wrong-destination"),700);
      hint(expected);
      current=null;
      loseLife("Produto enviado para o silo errado.");
      if(running) setTimeout(nextLoad,1150);
      return;
    }

    if(silo.level+current.amount>100){
      clearLoad();
      current=null;
      loseLife(`O Silo ${letter(index)} era compatível, mas estava cheio.`);
      say("Você acertou o produto, mas faltou observar a capacidade.","Quando houver dois destinos compatíveis, escolha o mais vazio!");
      if(running) setTimeout(nextLoad,1050);
      return;
    }

    clearLoad();
    silo.level=clamp(silo.level+current.amount);
    correct++; combo++; bestCombo=Math.max(bestCombo,combo);
    const comboBonus=Math.min(combo,10)*18;
    const speedBonus=loadSeconds*12;
    const balanceBonus=silo.level<=75?80:(silo.level<=88?40:0);
    score+=120+comboBonus+speedBonus+balanceBonus;

    eventEl.textContent="✓ Carga recebida com sucesso.";
    if(combo>=6) say("Excelente memória!",`Combo x${combo}! Você já conhece bem os destinos.`);
    else if(combo>=3) say("Boa! Você está memorizando os silos.","Continue assim para aumentar o combo.");
    else say("Destino correto!","Guarde esse silo na memória.");

    current=null; paint();
    setTimeout(nextLoad,seconds<=25?280:480);
  }

  function expedition(){
    if(!running || !silos.length) return;
    const i=Math.floor(Math.random()*silos.length);
    const reduction=10+Math.floor(Math.random()*10);
    silos[i].level=clamp(silos[i].level-reduction);
    eventEl.textContent=`🚚 Expedição liberou espaço no Silo ${letter(i)}.`;
    say("A expedição alterou os níveis.","Observe a capacidade antes da próxima carga.");
    paint();
  }

  function tick(){
    if(!running) return;
    seconds--;
    silos.forEach(s=>s.level=clamp(s.level-s.drain));
    if(silos.every(s=>s.level<=90)) score+=3;
    if([57,39,21].includes(seconds)) expedition();
    paint();
    if(seconds<=0) finish(true);
  }

  function finish(survived){
    if(!running) return;
    running=false;
    clearInterval(gameTimer); gameTimer=null;
    clearLoad(); current=null;
    game.hidden=true; result.hidden=false;

    const precision=attempts?Math.round((correct/attempts)*100):0;
    let title="Operação em Desenvolvimento",badge="🥉",
        desc="Você começou a identificar os destinos. Tente novamente e use a memória para aumentar a precisão.";
    if(survived && precision>=90 && bestCombo>=6){
      title="Memória Operacional Ouro"; badge="🏆";
      desc="Excelente! Você memorizou os destinos, manteve a capacidade sob controle e conduziu a operação com alta precisão.";
    } else if(survived && precision>=75){
      title="Memória Operacional Prata"; badge="🥈";
      desc="Muito bom! Você identificou a maior parte dos destinos e reagiu bem ao ritmo da operação.";
    } else if(survived && precision>=55){
      title="Memória Operacional Bronze"; badge="🥉";
      desc="Boa tentativa. Agora que você já descobriu alguns destinos, tente novamente e busque uma sequência maior.";
    } else if(!survived){
      title="Operação Encerrada"; badge="⚠️";
      desc="As cinco vidas terminaram. Memorize as pistas dos silos e tente novamente.";
    }

    $("#siloResultBadge").textContent=badge;
    $("#siloResultTitle").textContent=title;
    $("#siloResultText").textContent=desc;
    $("#siloFinalScore").textContent=Math.round(score);
    $("#siloAccuracy").textContent=`${precision}%`;
    $("#siloBestCombo").textContent=`x${bestCombo}`;
    $("#siloLoads").textContent=correct;
    $("#siloErrors").textContent=errors;

    let countdown=20; const reset=$("#siloReset");
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
    eventEl.textContent="Descubra os destinos dos quatro silos.";
    say("Cada silo recebe apenas um produto.","Memorize seus acertos e cuide da capacidade!");
    buttons.forEach(b=>b.classList.remove("is-wrong-destination","is-correct-hint"));
    paint();nextLoad();
    gameTimer=setInterval(tick,1000);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  buttons.forEach((b,i)=>b.addEventListener("click",()=>choose(i)));
  startBtn.addEventListener("click",start);
  againBtn?.addEventListener("click",start);
})();