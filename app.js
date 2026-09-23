import { EDU_EVENTS, StorageManager, ScreenManager, NumberInput, CountdownTimer, ScoreManager, ComboManager } from 'https://tt-sensei.github.io/edu-components/index.js';
import { soundList } from 'https://tt-sensei.github.io/sounds-recipe-/sounds.js';
import { CHARACTERS, NORMAL_MONSTERS, NORMAL_MONSTER_GROUPS, BOSS_CANDIDATES, BOSSES, BACKGROUNDS, ALL_COLLECTIONS, ENCOURAGEMENT } from './data.js';
import { LEVELS, LEVEL_IDS, QuestionBag, TrainingScheduler, addExp, getStageRewardExp, bossQuestions, comboAnimation, defaultState, isMaster, levelSummary, migrateState, parseKey, recommendedKeys, recordAttempt, stageQuestions, trainingSeed } from './logic.js';

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const storage=new StorageManager('tashi-hiki-fantasy-battle');
let state=migrateState(storage.load('state',defaultState()));
const screenManager=new ScreenManager({screens:$$('.screen')});
let pendingBattle=null;
let battle=null;
let training=null;
let audioContext=null;

const BOSS_CONFIG={
  mid1:{title:'中ボス・たしひきの森',rule:'レベル1・2',hp:8,time:90,levels:[1,2],monster:BOSSES.mid1},
  mid2:{title:'中ボス・20ひきの空',rule:'レベル3',hp:10,time:100,levels:[3],monster:BOSSES.mid2},
  final:{title:'大ボス・たしひきマスター',rule:'レベル4・まぜまぜ',hp:12,time:120,levels:[1,2,3,4],monster:BOSSES.final}
};

function save(){storage.save('state',state);}
function pick(list){return list[Math.floor(Math.random()*list.length)];}
function normalMonsterForLevel(level){return pick(NORMAL_MONSTER_GROUPS[Math.max(0,Math.min(3,Number(level)-1))]);}
function setImage(img,src){
  if(!img)return;
  img.src=src;
  img.onerror=()=>{img.hidden=true;};
  img.onload=()=>{img.hidden=false;};
}
function formatFormula(q){
  return String(q.left)+' '+(q.operation==='add'?'＋':'−')+' '+String(q.right)+' ＝ '+String(q.answer);
}
function formatTime(seconds){
  const s=Math.max(0,Math.round(seconds));
  return s>=60?String(Math.floor(s/60))+'分'+String(s%60)+'秒':String(s)+'秒';
}
async function playSound(id){
  if(state.settings.muted)return;
  try{
    audioContext ||= new(window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')await audioContext.resume();
    soundList.find(item=>item.id===id)?.play(audioContext,state.settings.volume);
  }catch{}
}
function show(id){
  if(battle?.timer?.isRunning&&id!=='battle')battle.timer.pause();
  screenManager.show(id);
  if(id==='home')renderHome();
  if(id==='adventure')renderAdventure();
  if(id==='training-menu')renderTrainingMenu();
  if(id==='map')renderMap();
  if(id==='book')renderBook();
  if(id==='collection')renderCollection();
  if(id==='settings')renderSettings();
  if(id==='characters')renderCharacters(false);
  if(id==='partner-select')renderCharacters(true);
}
function renderHome(){
  const hero=CHARACTERS[state.selectedCharacter];
  $('#home').style.backgroundImage='linear-gradient(rgba(255,253,248,.55),rgba(255,253,248,.62)),url("'+BACKGROUNDS.home+'")';
  $('#home').style.backgroundSize='cover';
  $('#home').style.backgroundPosition='center';
  $('#home-level').textContent=state.playerLevel;
  $('#home-role').textContent=hero.role;
  setImage($('#home-character'),hero.stand);
  $('#home-review').textContent=state.reviewQueue.length?'特訓おすすめが '+state.reviewQueue.length+'問 あります':'特訓おすすめはまだありません';
}
function renderCharacters(partnerMode){
  const grid=$(partnerMode?'#partner-grid':'#character-grid');
  grid.innerHTML='';
  Object.entries(CHARACTERS).forEach(([id,char])=>{
    if(partnerMode&&id===state.selectedCharacter)return;
    const button=document.createElement('button');
    const selected=(partnerMode?state.trainingPartner:state.selectedCharacter)===id;
    button.className='character-card'+(selected?' selected':'');
    button.innerHTML='<img src="'+char.stand+'" alt=""><strong>'+char.role+'</strong>';
    button.addEventListener('click',()=>{
      if(partnerMode)state.trainingPartner=id;
      else{
        state.selectedCharacter=id;
        if(state.trainingPartner===id)state.trainingPartner=Object.keys(CHARACTERS).find(key=>key!==id);
      }
      save();
      show(partnerMode?'training-menu':'home');
    });
    grid.append(button);
  });
}
function renderAdventure(){
  const adventure=$('#adventure');
  adventure.style.backgroundImage='linear-gradient(180deg,rgba(232,246,235,.68),rgba(255,253,248,.9) 88%),url("'+BACKGROUNDS.normal+'")';
  adventure.style.backgroundSize='cover';
  adventure.style.backgroundPosition='center';
  const stages=$('#stage-grid');
  stages.innerHTML='';
  LEVEL_IDS.forEach(level=>{
    const config=LEVELS[level];
    const summary=levelSummary(state,level);
    const button=document.createElement('button');
    button.className='stage-card'+(isMaster(state,level)?' master':'');
    button.innerHTML='<strong>Lv.'+level+'</strong><small>'+config.label+'</small><span class="stage-progress">'+(isMaster(state,level)?'MASTER 👑':summary.mark+' '+summary.label)+'</span>';
    button.addEventListener('click',()=>prepareBattle({kind:'normal',level}));
    stages.append(button);
  });
  const bosses=$('#boss-grid');
  bosses.innerHTML='';
  Object.entries(BOSS_CONFIG).forEach(([id,config])=>{
    const button=document.createElement('button');
    button.className='boss-card';
    button.innerHTML='<img src="'+config.monster.image+'" alt=""><span><strong>'+config.title+'</strong><small>'+(state.bossProgress[id].defeated?'撃破済み・もう一度挑戦できるよ':'いつでも挑戦できるよ！')+'</small></span>';
    button.addEventListener('click',()=>prepareBattle({kind:'boss',bossId:id}));
    bosses.append(button);
  });
}
function operationLabel(operation){
  return operation==='add'?'たし算':operation==='sub'?'ひき算':'どっちも！';
}
function prepareBattle(config){
  pendingBattle={...config};
  const normal=config.kind==='normal';
  const monster=normal?normalMonsterForLevel(config.level):BOSS_CONFIG[config.bossId].monster;
  const maxHp=normal?5:BOSS_CONFIG[config.bossId].hp;
  const baseTime=normal?90:BOSS_CONFIG[config.bossId].time;
  const rule=normal?LEVELS[config.level].description:BOSS_CONFIG[config.bossId].rule;
  $('#prep-title').textContent=normal?LEVELS[config.level].title+'・'+LEVELS[config.level].label:BOSS_CONFIG[config.bossId].title;
  $('#prep-enemy-name').textContent=monster.name;
  $('#prep-rule').textContent='HP '+maxHp+'｜'+baseTime+'秒｜'+rule+'｜'+maxHp+'問正解で撃破';
  $('#prep-support').checked=state.supportMode;
  $('#support-detail').textContent='HP7・時間'+(baseTime+30)+'秒';
  setImage($('#prep-player'),CHARACTERS[state.selectedCharacter].stand);
  setImage($('#prep-enemy'),monster.image);
  pendingBattle.monster=monster;
  show('battle-prep');
}
function setupKeypad(container,session,onSubmit,onChange){
  container.innerHTML='';
  ['1','2','3','4','5','6','7','8','9','delete','0','enter'].forEach(key=>{
    const button=document.createElement('button');
    button.type='button';
    button.dataset.key=key;
    button.textContent=key==='delete'?'×':key==='enter'?'決定':key;
    button.addEventListener('click',()=>{
      if(key==='enter')onSubmit();
      else{
        session.input.press(key);
        onChange();
      }
    });
    container.append(button);
  });
}
function battleConfig(){
  const support=$('#prep-support').checked;
  state.supportMode=support;
  save();
  if(pendingBattle.kind==='normal'){
    return {...pendingBattle,support,playerMaxHp:support?7:5,enemyMaxHp:5,time:support?120:90,monster:pendingBattle.monster,background:BACKGROUNDS.normal};
  }
  const boss=BOSS_CONFIG[pendingBattle.bossId];
  return {...pendingBattle,support,playerMaxHp:support?7:5,enemyMaxHp:boss.hp,time:boss.time+(support?30:0),monster:pendingBattle.monster,background:BACKGROUNDS[pendingBattle.bossId],levels:boss.levels};
}
function startBattle(){
  const config=battleConfig();
  const eventTarget=new EventTarget();
  const input=new NumberInput({answer:0},{eventTarget:document});
  const score=new ScoreManager();
  const combo=new ComboManager({eventTarget:document});
  const bag=config.kind==='normal'
    ?new QuestionBag(()=>stageQuestions(config.level))
    :new QuestionBag(()=>bossQuestions(config.levels));
  battle={config,input,score,combo,bag,playerHp:config.playerMaxHp,enemyHp:config.enemyMaxHp,current:null,wrongKeys:new Set(),asked:0,locked:false,ended:false,startedAt:Date.now(),timer:null};
  battle.timer=new CountdownTimer(config.time,{eventTarget,onTick:remaining=>$('#battle-time').textContent=remaining,warningAt:[10]});
  eventTarget.addEventListener(EDU_EVENTS.TIMEUP,()=>finishBattle(false,'time'));
  setImage($('#battle-player'),CHARACTERS[state.selectedCharacter].stand);
  setImage($('#battle-enemy'),config.monster.image);
  $('#battle-enemy-name').textContent=config.monster.name;
  $('#battle-field').style.backgroundImage='linear-gradient(rgba(235,245,240,.12),rgba(25,50,74,.12)),url("'+config.background+'")';
  setupKeypad($('#battle-keypad'),battle,submitBattleAnswer,()=>updateAnswerDisplay('battle',battle));
  updateBattleHud();
  nextBattleQuestion();
  show('battle');
  battle.timer.start();
}
function renderQuestion(prefix,q,session){
  $('#'+prefix+'-question').innerHTML=String(q.left)+' <span class="question-op">'+(q.operation==='add'?'＋':'−')+'</span> '+String(q.right)+' ＝ <span id="'+prefix+'-answer" class="answer-slot">?</span>';
  updateAnswerDisplay(prefix,session);
}
function updateAnswerDisplay(prefix,session){
  const el=$('#'+prefix+'-answer');
  if(el)el.textContent=session.input.value||'?';
}
function nextBattleQuestion(){
  if(!battle||battle.ended)return;
  battle.current=battle.bag.next();
  battle.asked+=1;
  battle.input.reset({answer:battle.current.answer});
  renderQuestion('battle',battle.current,battle);
  $('#battle-feedback').textContent='';
  $('#battle-progress').textContent=String(battle.asked)+'問目｜あと'+String(battle.enemyHp)+'回 正解で撃破';
  battle.locked=false;
}
function updateBattleHud(){
  $('#player-hearts').textContent='♥'.repeat(battle.playerHp)+'♡'.repeat(Math.max(0,battle.config.playerMaxHp-battle.playerHp));
  $('#enemy-hp-text').textContent=String(battle.enemyHp)+'/'+String(battle.config.enemyMaxHp);
  $('#enemy-hp-bar').style.width=String(battle.enemyHp/battle.config.enemyMaxHp*100)+'%';
  $('#combo-label').textContent=String(battle.combo.getCurrent())+' COMBO';
}
function swapPlayerPose(type,duration){
  const img=$('#battle-player');
  const char=CHARACTERS[state.selectedCharacter];
  setImage(img,type==='normal'?char.stand:char[type]);
  img.classList.remove('pose-attack','pose-special','pose-damage');
  if(type!=='normal')img.classList.add('pose-'+type);
  if(type!=='normal')setTimeout(()=>{if(battle&&!battle.ended){setImage(img,char.stand);img.classList.remove('pose-'+type);}},duration);
}
function submitBattleAnswer(){
  if(!battle||battle.locked||battle.ended)return;
  if(!battle.input.value)return;
  battle.locked=true;
  const q=battle.current;
  const ok=Number(battle.input.value)===q.answer;
  const stat=recordAttempt(state,q,ok);
  save();
  if(ok){
    battle.score.correct();
    const combo=battle.combo.correct();
    battle.enemyHp-=1;
    const pose=comboAnimation(combo);
    const delay=pose==='special'?1100:pose==='attack'?600:350;
    $('#battle-feedback').textContent=pose==='special'?'SPECIAL！ '+formatFormula(q):pose==='attack'?'ATTACK！ '+formatFormula(q):'正解！ '+formatFormula(q);
    swapPlayerPose(pose,delay);
    $('#battle-enemy').classList.add('enemy-hit');
    setTimeout(()=>$('#battle-enemy').classList.remove('enemy-hit'),300);
    playSound(pose==='special'?'combo10':pose==='attack'?'combo5':'correct');
    updateBattleHud();
    if(battle.enemyHp<=0)setTimeout(()=>finishBattle(true,'defeat-enemy'),delay);
    else setTimeout(nextBattleQuestion,delay);
  }else{
    battle.score.wrong();
    battle.combo.wrong();
    battle.playerHp-=1;
    battle.wrongKeys.add(q.key);
    $('#battle-feedback').textContent=formatFormula(q)+'　ここを特訓しよう！ 正解は '+q.answer;
    swapPlayerPose('damage',650);
    playSound('wrong');
    updateBattleHud();
    if(battle.playerHp<=0)setTimeout(()=>finishBattle(false,'hp'),550);
    else setTimeout(nextBattleQuestion,700);
  }
}
function markBattleProgress(config,misses){
  let firstClear=false;
  if(config.kind==='normal'){
    const progress=state.stageProgress[config.level];
    firstClear=!progress.cleared;
    progress.cleared=true;
    if(misses===0)progress.noMiss=true;
    state.mastery[config.level]=isMaster(state,config.level);
  }else{
    firstClear=!state.bossProgress[config.bossId].defeated;
    state.bossProgress[config.bossId].defeated=true;
  }
  return firstClear;
}
function awardCollection(firstClear){
  const owned=new Set(state.collections);
  if(!firstClear&&Math.random()>.45)return null;
  let candidates=ALL_COLLECTIONS.filter(item=>!owned.has(item.id));
  if(firstClear){
    const common=candidates.filter(item=>item.rarity==='common');
    if(common.length)candidates=common;
  }else{
    const roll=Math.random();
    const rarity=roll<.7?'common':roll<.9?'rare':roll<.98?'super-rare':'secret';
    const same=candidates.filter(item=>item.rarity===rarity);
    if(same.length)candidates=same;
  }
  if(!candidates.length)return null;
  const item=pick(candidates);
  state.collections.push(item.id);
  return item;
}
function finishBattle(win,reason){
  if(!battle||battle.ended)return;
  battle.ended=true;
  battle.timer.pause();
  const elapsed=Math.max(1,Math.round((Date.now()-battle.startedAt)/1000));
  const result=battle.score.getResult();
  const config=battle.config;
  const previousLevel=state.playerLevel;
  let reward=null,earnedExp=0,firstClear=false;
  if(win){
    firstClear=markBattleProgress(config,result.wrong);
    const base=config.kind==='normal'?15:config.bossId==='final'?80:40;
    const rawExp=base+Math.min(10,result.correct);
    earnedExp=config.kind==='normal'?getStageRewardExp(state,config.level,rawExp):rawExp;
    addExp(state,earnedExp);
    reward=awardCollection(firstClear);
    const key=config.kind==='normal'?'level-'+config.level:config.bossId;
    const category=config.support?'support':'normal';
    if(!state.bestTimes[category][key]||elapsed<state.bestTimes[category][key])state.bestTimes[category][key]=elapsed;
    state.maxCombos[key]=Math.max(state.maxCombos[key]||0,battle.combo.getMax());
    state.monsterBook[config.monster.id]=true;
    state.monsterDefeatCounts[config.monster.id]=(state.monsterDefeatCounts[config.monster.id]||0)+1;
  }else{
    earnedExp=Math.min(3,result.correct);
    addExp(state,earnedExp);
  }
  save();
  if(state.playerLevel>previousLevel)playSound('levelup');
  else if(reward)playSound(reward.rarity==='common'?'badge':'rareBadge');
  else playSound(win?'allclear':'wrong');
  renderBattleResult({win,reason,elapsed,result,config,reward,firstClear,earnedExp,wrongKeys:[...battle.wrongKeys],remainingHp:battle.playerHp,maxCombo:battle.combo.getMax()});
  show('result');
}
function statChip(label,value){return '<div class="stat-chip"><strong>'+value+'</strong><span>'+label+'</span></div>';}
function actionButton(label,handler,primary=false){
  const button=document.createElement('button');
  button.textContent=label;
  button.className=primary?'primary':'';
  button.addEventListener('click',handler);
  return button;
}
function renderBattleResult(data){
  const {win,reason,result,elapsed,config,reward,wrongKeys,remainingHp,maxCombo,earnedExp}=data;
  $('#result-mark').textContent=win?'🏆':'🌱';
  $('#result-kicker').textContent='バトル終了';
  $('#result-title').textContent=win?'クリア！':reason==='time'?'タイムアップ':'あと少し！';
  $('#result-message').textContent=win?'モンスターを撃破！ 次の冒険か、苦手の特訓へ進もう。':'特訓すれば、次はきっと強くなれるよ。';
  $('#result-stats').innerHTML=statChip('正解',result.correct)+statChip('ミス',result.wrong)+statChip('最大コンボ',maxCombo)+statChip('クリア時間',formatTime(elapsed))+statChip('残りHP',remainingHp)+statChip('今回EXP','+'+earnedExp)+statChip('EXP累計',state.exp)+statChip('冒険レベル','Lv.'+state.playerLevel);
  const rewardBox=$('#result-reward');
  rewardBox.hidden=!reward;
  if(reward)rewardBox.innerHTML='<img src="'+reward.image+'" alt=""><div><strong>宝箱から「'+reward.name+'」！</strong><p>コレクションに追加されました。</p></div>';
  const weak=$('#result-weak');
  weak.hidden=!wrongKeys.length;
  if(wrongKeys.length){
    weak.innerHTML='<strong>特訓する問題</strong><div>'+wrongKeys.map(key=>'<button data-key="'+key+'">'+formatFormula(parseKey(key))+'</button>').join('')+'</div>';
    $$('[data-key]',weak).forEach(button=>button.addEventListener('click',()=>startTraining('battle',null,[button.dataset.key],config)));
  }
  const actions=$('#result-actions');
  actions.innerHTML='';
  if(wrongKeys.length)actions.append(actionButton('まちがえた問題を特訓する',()=>startTraining('battle',null,wrongKeys,config),true));
  if(win){
    actions.append(actionButton('もう一度バトル！',()=>prepareBattle({...config})));
    actions.append(actionButton('ぼうけんマップへ',()=>show('adventure')));
  }else{
    actions.append(actionButton('もう一度',()=>prepareBattle({...config})));
    actions.append(actionButton('特訓する',()=>startTraining('battle',null,wrongKeys.length?wrongKeys:state.reviewQueue,config),!wrongKeys.length));
    if(!config.support)actions.append(actionButton('サポートONでもう一度',()=>{state.supportMode=true;save();prepareBattle({...config});}));
    actions.append(actionButton('マップへ',()=>show('adventure')));
  }
}
function renderTrainingMenu(){
  $('#training-menu').style.backgroundImage='url("'+BACKGROUNDS.training+'")';
  $('#training-menu').style.backgroundSize='cover';
  $('#training-menu').style.backgroundPosition='center';
  setImage($('#training-menu-player'),CHARACTERS[state.selectedCharacter].stand);
  if(state.trainingPartner===state.selectedCharacter)state.trainingPartner=Object.keys(CHARACTERS).find(key=>key!==state.selectedCharacter);
  setImage($('#training-menu-partner'),CHARACTERS[state.trainingPartner].stand);
  $('#wrong-count').textContent='未克服 '+state.reviewQueue.length+'問';
  const picker=$('#training-level-picker');
  picker.innerHTML='';
  LEVEL_IDS.forEach(level=>{
    const button=document.createElement('button');
    button.textContent='レベル'+level;
    button.addEventListener('click',()=>startTraining('stage',level));
    picker.append(button);
  });
}
function startTraining(type,level=null,preferredKeys=[],returnBattle=null){
  const seed=trainingSeed(state,type,level,preferredKeys);
  const input=new NumberInput({answer:0},{eventTarget:document});
  training={type,level,preferredKeys,returnBattle,input,scheduler:new TrainingScheduler(seed),score:new ScoreManager(),locked:false,beforeQueue:new Set(state.reviewQueue)};
  $('#training').style.backgroundImage='url("'+BACKGROUNDS.training+'")';
  $('#training').style.backgroundSize='cover';
  $('#training').style.backgroundPosition='center';
  $('#training-title').textContent=type==='stage'?'レベル'+String(level)+' 特訓':type==='wrong'?'まちがい特訓':type==='battle'?'バトルのまちがい特訓':'おまかせ特訓';
  setImage($('#training-player'),CHARACTERS[state.selectedCharacter].stand);
  setImage($('#training-partner'),CHARACTERS[state.trainingPartner].stand);
  $('#partner-speech').textContent='いっしょにやろう！';
  setupKeypad($('#training-keypad'),training,submitTrainingAnswer,()=>updateAnswerDisplay('training',training));
  show('training');
  renderTrainingQuestion();
}
function renderTrainingQuestion(){
  if(!training)return;
  const q=training.scheduler.current();
  if(!q){finishTraining();return;}
  training.current=q;
  training.input.reset({answer:q.answer});
  training.locked=false;
  renderQuestion('training',q,training);
  $('#training-feedback').textContent='';
  $('#training-remaining').textContent=String(10-training.scheduler.index);
}
function submitTrainingAnswer(){
  if(!training||training.locked)return;
  if(!training.input.value)return;
  training.locked=true;
  const q=training.current;
  const ok=Number(training.input.value)===q.answer;
  const stat=recordAttempt(state,q,ok);
  ok?training.score.correct():training.score.wrong();
  save();
  const message=pick(ENCOURAGEMENT[ok?'correct':'wrong']);
  $('#partner-speech').textContent=message;
  $('#training-feedback').textContent=ok?'正解！ '+formatFormula(q):formatFormula(q)+'　'+message+' 正解は '+q.answer;
  playSound(ok?'correct':'wrong');
  const needsReview=stat.reviewActive;
  setTimeout(()=>{if(!training)return;training.scheduler.advance(needsReview);renderTrainingQuestion();},ok?350:700);
}
function trainingExpAward(correct){
  const today=new Date().toISOString().slice(0,10);
  if(state.trainingExp.date!==today)state.trainingExp={date:today,earned:0};
  const wanted=Math.min(5,1+Math.floor(correct/3));
  const allowed=Math.max(0,20-state.trainingExp.earned);
  const earned=Math.min(wanted,allowed);
  state.trainingExp.earned+=earned;
  addExp(state,earned);
  return earned;
}
function finishTraining(){
  if(!training)return;
  const session=training;
  const result=session.score.getResult();
  const overcome=[...session.beforeQueue].filter(key=>!state.reviewQueue.includes(key));
  const exp=trainingExpAward(result.correct);
  save();
  $('#result-mark').textContent='📖';
  $('#result-kicker').textContent='特訓終了';
  $('#result-title').textContent='10問おつかれさま！';
  $('#result-message').textContent=overcome.length?'苦手を '+overcome.length+'つ 克服！':'練習した記録がマップに反映されました。';
  $('#result-stats').innerHTML=statChip('正解',result.correct)+statChip('もう一度',result.wrong)+statChip('克服',overcome.length)+statChip('EXP','+'+exp);
  $('#result-reward').hidden=true;
  $('#result-weak').hidden=!state.reviewQueue.length;
  if(state.reviewQueue.length)$('#result-weak').innerHTML='<strong>これからも練習する問題</strong><div>'+recommendedKeys(state,5).map(key=>'<button>'+formatFormula(parseKey(key))+'</button>').join('')+'</div>';
  const actions=$('#result-actions');
  actions.innerHTML='';
  if(session.returnBattle)actions.append(actionButton('もう一度バトル！',()=>prepareBattle({...session.returnBattle}),true));
  actions.append(actionButton('続けて特訓',()=>startTraining(session.type,session.level,session.preferredKeys,session.returnBattle),!session.returnBattle));
  actions.append(actionButton('たしひきマップを見る',()=>show('map')));
  actions.append(actionButton('ホームへ',()=>show('home')));
  playSound(overcome.length?'allclear':'correct');
  training=null;
  show('result');
}
function renderMap(){
  const grid=$('#map-grid');
  grid.innerHTML='';
  LEVEL_IDS.forEach(level=>{
    const config=LEVELS[level],summary=levelSummary(state,level),progress=state.stageProgress[level];
    const card=document.createElement('article');
    card.className='map-card';
    card.innerHTML='<div class="map-card-head"><h3>レベル'+level+'</h3>'+(isMaster(state,level)?'<span class="master-label">MASTER 👑</span>':'')+'</div><p class="level-note">'+config.description+'</p><div class="map-modes"><span class="'+(progress.cleared?'done':'')+'">クリア '+(progress.cleared?'✓':'－')+'</span><span class="'+(progress.noMiss?'done':'')+'">ノーミス '+(progress.noMiss?'✓':'－')+'</span></div><div class="map-metrics"><span><b>'+summary.accuracy+'%</b>正答率</span><span><b>'+summary.recentRate+'%</b>最近</span><span><b>'+summary.weakCount+'</b>苦手</span></div><div class="grade">'+summary.mark+' '+summary.label+'</div>';
    grid.append(card);
  });
  const list=$('#recommend-list'),keys=recommendedKeys(state,5);
  list.innerHTML=keys.length?keys.map(key=>'<button data-train-key="'+key+'">'+formatFormula(parseKey(key))+'を特訓</button>').join(''):'いまは特訓おすすめがありません。';
  $$('[data-train-key]',list).forEach(button=>button.addEventListener('click',()=>startTraining('wrong',null,[button.dataset.trainKey])));
}
function allMonsters(){return [...NORMAL_MONSTERS,...Object.values(BOSS_CANDIDATES).flat()];}
const STICKER_EFFECTS=['holo','rainbow','glitter','neon','aurora','prism'];
function stickerEffect(){return pick(STICKER_EFFECTS);}
function renderBook(){
  const grid=$('#book-grid');
  grid.innerHTML='';
  allMonsters().forEach(monster=>{
    const got=state.monsterBook[monster.id];
    const card=document.createElement('article');
    card.className='book-card'+(got?' sticker-monster-card effect-'+stickerEffect():'');
    card.innerHTML='<img class="'+(got?'sticker-monster-image':'locked-image')+'" src="'+monster.image+'" alt=""><strong>'+(got?monster.name:'？')+'</strong><span>'+(got?'撃破 '+(state.monsterDefeatCounts[monster.id]||0)+'回':'まだ出会っていません')+'</span>';
    grid.append(card);
  });
}
function renderCollection(){
  const owned=new Set(state.collections);
  $('#collection-count').textContent=owned.size+' / '+ALL_COLLECTIONS.length+' 集まったよ';
  const grid=$('#collection-grid');
  grid.innerHTML='';
  ALL_COLLECTIONS.forEach(item=>{
    const got=owned.has(item.id),card=document.createElement('article');
    card.className='collection-card rarity-'+item.rarity+(got?'':' locked');
    card.innerHTML='<img class="'+(got?'':'locked-image')+'" src="'+item.image+'" alt=""><strong>'+(got?item.name:'？')+'</strong><span>'+(got?(item.category==='math'?'算数バッジ':item.rarity.toUpperCase().replace('-',' ')):'未獲得')+'</span>';
    grid.append(card);
  });
}
function renderSettings(){
  $('#setting-sound').checked=!state.settings.muted;
  $('#setting-support').checked=state.supportMode;
}

$$('[data-go]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.go)));
$$('[data-training]').forEach(button=>{
  button.addEventListener('click',()=>{
    const type=button.dataset.training;
    if(type==='stage')$('#training-level-picker').hidden=!$('#training-level-picker').hidden;
    else startTraining(type);
  });
});
$('#change-partner').addEventListener('click',()=>show('partner-select'));
$('#start-battle').addEventListener('click',startBattle);
$('#battle-exit').addEventListener('click',()=>{if(confirm('バトルをやめてマップへ戻りますか？')){battle?.timer.pause();battle=null;show('adventure');}});
$('#training-exit').addEventListener('click',()=>{if(confirm('特訓をやめてホームへ戻りますか？')){training=null;show('training-menu');}});
$('#setting-sound').addEventListener('change',event=>{state.settings.muted=!event.target.checked;save();if(event.target.checked)playSound('correct');});
$('#setting-support').addEventListener('change',event=>{state.supportMode=event.target.checked;save();});
$('#prep-support').addEventListener('change',event=>{state.supportMode=event.target.checked;save();});
document.addEventListener('keydown',event=>{
  const current=screenManager.getCurrent();
  const session=current==='battle'?battle:current==='training'?training:null;
  if(!session||session.locked)return;
  if(/^\d$/.test(event.key)){
    session.input.press(event.key);updateAnswerDisplay(current,session);
  }else if(event.key==='Backspace'){
    event.preventDefault();session.input.press('delete');updateAnswerDisplay(current,session);
  }else if(event.key==='Enter'){
    event.preventDefault();
    current==='battle'?submitBattleAnswer():submitTrainingAnswer();
  }
});
window.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement)event.target.hidden=true;},true);
renderHome();
screenManager.show('home',{scroll:false});
