export const SCHEMA_VERSION = 2;
export const LEVEL_IDS = Object.freeze([1, 2, 3, 4]);

export const LEVELS = Object.freeze({
  1: Object.freeze({id:1,title:'レベル1',label:'20までのたし算',description:'20までのたし算',operation:'add'}),
  2: Object.freeze({id:2,title:'レベル2',label:'くりさがりなしのひき算',description:'くりさがりなしのひき算',operation:'sub'}),
  3: Object.freeze({id:3,title:'レベル3',label:'20−一けた',description:'20から一けたをひくひき算',operation:'sub'}),
  4: Object.freeze({id:4,title:'レベル4',label:'たしひき・まぜまぜ',description:'これまでの問題をまぜて、少しむずかしい問題にも挑戦',operation:'both'})
});

export function shuffle(items, random=Math.random){
  const copy=[...items];
  for(let i=copy.length-1;i>0;i-=1){
    const j=Math.floor(random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

export function mathQuestion(operation,a,b){
  const op=operation==='sub'?'sub':'add';
  const left=Number(a), right=Number(b);
  return {operation:op,left,right,answer:op==='add'?left+right:left-right,key:op+':'+left+':'+right};
}

export const question=mathQuestion;

function buildLevel1(){
  const rows=[];
  for(let a=1;a<=19;a+=1) for(let b=1;b<=20-a;b+=1) rows.push(mathQuestion('add',a,b));
  return rows;
}

function buildLevel2(){
  const rows=[];
  for(let a=2;a<=9;a+=1) for(let b=1;b<a;b+=1) rows.push(mathQuestion('sub',a,b));
  for(let a=11;a<=19;a+=1){
    const ones=a%10;
    for(let b=1;b<=ones;b+=1) rows.push(mathQuestion('sub',a,b));
  }
  return rows;
}

function buildLevel3(){
  const rows=[];
  for(let b=1;b<=9;b+=1) rows.push(mathQuestion('sub',20,b));
  return rows;
}

function buildLevel4(){
  const map=new Map();
  [...buildLevel1(),...buildLevel2(),...buildLevel3()].forEach(q=>map.set(q.key,q));
  for(let a=11;a<=20;a+=1){
    for(let b=1;b<=9;b+=1){
      if(a-b>=1){
        const q=mathQuestion('sub',a,b);
        map.set(q.key,q);
      }
    }
  }
  for(let a=1;a<=9;a+=1){
    for(let b=1;b<=9;b+=1){
      if(a+b>=11&&a+b<=20) {
        const q=mathQuestion('add',a,b);
        map.set(q.key,q);
      }
    }
  }
  return [...map.values()];
}

export function levelQuestions(level,random=Math.random){
  const n=Number(level);
  const rows=n===1?buildLevel1():n===2?buildLevel2():n===3?buildLevel3():n===4?buildLevel4():[];
  return shuffle(rows,random);
}

export function stageQuestions(level,random=Math.random){return levelQuestions(level,random);}

export function bossQuestions(levels,random=Math.random){
  const requested=Array.isArray(levels)?levels:[levels];
  const unique=new Map();
  requested.forEach(level=>levelQuestions(Number(level),random).forEach(q=>unique.set(q.key,q)));
  return shuffle([...unique.values()],random);
}

export class QuestionBag{
  constructor(factory){this.factory=factory;this.items=[];this.lastKey='';}
  next(){
    if(!this.items.length)this.items=this.factory();
    if(!this.items.length)return null;
    if(this.items.length>1&&this.items[0].key===this.lastKey){
      const swapAt=this.items.findIndex(item=>item.key!==this.lastKey);
      if(swapAt>0)[this.items[0],this.items[swapAt]]=[this.items[swapAt],this.items[0]];
    }
    const item=this.items.shift();
    this.lastKey=item.key;
    return item;
  }
}

export function comboAnimation(combo){return combo>=5&&combo%5===0?'special':'attack';}

export function emptyStat(){return {attempts:0,correct:0,wrong:0,recentResults:[],lastAskedAt:null,lastWrongAt:null,reviewActive:false,reviewCorrectStreak:0};}

export function recordAttempt(state,q,isCorrect,now=new Date().toISOString()){
  const stat=state.mathStats[q.key]||emptyStat();
  stat.attempts+=1;
  stat.correct+=isCorrect?1:0;
  stat.wrong+=isCorrect?0:1;
  stat.recentResults=[...stat.recentResults,Boolean(isCorrect)].slice(-10);
  stat.lastAskedAt=now;
  if(!isCorrect){
    stat.lastWrongAt=now;
    stat.reviewActive=true;
    stat.reviewCorrectStreak=0;
    if(!state.reviewQueue.includes(q.key))state.reviewQueue.push(q.key);
  }else if(stat.reviewActive){
    stat.reviewCorrectStreak+=1;
    if(stat.reviewCorrectStreak>=2){
      stat.reviewActive=false;
      state.reviewQueue=state.reviewQueue.filter(key=>key!==q.key);
    }
  }
  state.mathStats[q.key]=stat;
  state.recentAttempts=[...(state.recentAttempts||[]),{key:q.key,correct:Boolean(isCorrect),at:now}].slice(-250);
  return stat;
}

export function parseKey(key){
  const [op,a,b]=String(key).split(':');
  return mathQuestion(op,Number(a),Number(b));
}

function keysForLevel(level){return new Set(levelQuestions(level,()=>0.5).map(q=>q.key));}

export function levelSummary(state,level){
  const keys=keysForLevel(level);
  const stats=[...keys].map(key=>state.mathStats[key]).filter(Boolean);
  const attempts=stats.reduce((sum,s)=>sum+s.attempts,0);
  const correct=stats.reduce((sum,s)=>sum+s.correct,0);
  const recent=(state.recentAttempts||[]).filter(item=>keys.has(item.key)).slice(-30).map(item=>item.correct);
  const currentRate=recent.length?Math.round(recent.filter(Boolean).length/recent.length*100):0;
  const weakCount=stats.filter(s=>s.reviewActive).length;
  let grade={mark:'－',label:'まだデータ不足'};
  if(attempts>=10){
    if(currentRate<70||weakCount>=3)grade={mark:'△',label:'特訓おすすめ'};
    else if(currentRate>=90&&weakCount===0)grade={mark:'◎',label:'とくい'};
    else grade={mark:'○',label:'もう少し'};
  }
  return {attempts,accuracy:attempts?Math.round(correct/attempts*100):0,recentRate:currentRate,weakCount,...grade};
}

export const factorSummary=levelSummary;

export function recommendedKeys(state,limit=5){
  return Object.entries(state.mathStats)
    .filter(([,stat])=>stat.reviewActive)
    .sort(([,a],[,b])=>b.wrong-a.wrong||new Date(b.lastWrongAt||0)-new Date(a.lastWrongAt||0))
    .slice(0,limit).map(([key])=>key);
}

export function isMaster(state,level){return Boolean(state.stageProgress[level]?.cleared&&state.stageProgress[level]?.noMiss);}

export function defaultState(){
  const stageProgress={};
  LEVEL_IDS.forEach(level=>stageProgress[level]={cleared:false,noMiss:false});
  return {
    schemaVersion:SCHEMA_VERSION,selectedCharacter:'sora',trainingPartner:'kai',playerLevel:1,exp:0,supportMode:false,
    selectedOperation:'both',stageProgress,bossProgress:{mid1:{defeated:false},mid2:{defeated:false},final:{defeated:false}},
    mathStats:{},recentAttempts:[],reviewQueue:[],mastery:{1:false,2:false,3:false,4:false},bestTimes:{normal:{},support:{}},maxCombos:{},
    monsterBook:{},monsterDefeatCounts:{},collections:[],settings:{muted:false,volume:0.24},adventureReward:{date:'',byLevel:{}},trainingExp:{date:'',earned:0}
  };
}

export function migrateState(saved){
  const base=defaultState();
  if(!saved||typeof saved!=='object')return base;
  const merged={...base,...saved};
  merged.schemaVersion=SCHEMA_VERSION;
  merged.stageProgress={...base.stageProgress,...(saved.stageProgress||{})};
  merged.bossProgress={
    mid1:{...base.bossProgress.mid1,...(saved.bossProgress?.mid1||{})},
    mid2:{...base.bossProgress.mid2,...(saved.bossProgress?.mid2||{})},
    final:{...base.bossProgress.final,...(saved.bossProgress?.final||{})}
  };
  merged.settings={...base.settings,...(saved.settings||{})};
  merged.adventureReward={...base.adventureReward,...(saved.adventureReward||{}),byLevel:{...(saved.adventureReward?.byLevel||{})}};
  merged.mathStats=saved.mathStats&&typeof saved.mathStats==='object'?saved.mathStats:{};
  merged.recentAttempts=Array.isArray(saved.recentAttempts)?saved.recentAttempts.slice(-250):[];
  merged.reviewQueue=[...new Set((saved.reviewQueue||[]).filter(key=>/^(add|sub):\d+:\d+$/.test(key)))];
  merged.collections=Array.isArray(saved.collections)?[...new Set(saved.collections)]:[];
  merged.monsterBook=saved.monsterBook&&typeof saved.monsterBook==='object'?saved.monsterBook:{};
  merged.monsterDefeatCounts=saved.monsterDefeatCounts&&typeof saved.monsterDefeatCounts==='object'?saved.monsterDefeatCounts:{};
  return merged;
}

export function getStageRewardExp(state,level,baseAmount,today=new Date().toISOString().slice(0,10)){
  if(state.adventureReward.date!==today)state.adventureReward={date:today,byLevel:{}};
  const count=Number(state.adventureReward.byLevel[level]||0);
  const multiplier=[1,0.75,0.5,0.25][Math.min(count,3)];
  state.adventureReward.byLevel[level]=count+1;
  return Math.max(3,Math.round(baseAmount*multiplier));
}

export function addExp(state,amount){
  state.exp=Math.max(0,state.exp+Math.max(0,Number(amount)||0));
  state.playerLevel=Math.min(100,Math.floor(state.exp/100)+1);
  return state.playerLevel;
}

export function trainingSeed(state,type,level=null,preferredKeys=[],operation='both',random=Math.random){
  let pool=[];
  if(type==='stage')pool=levelQuestions(Number(level),random);
  else{
    const keys=preferredKeys.length?preferredKeys:state.reviewQueue;
    pool=keys.map(parseKey);
    if(type==='auto')pool.push(...recommendedKeys(state,9).map(parseKey));
  }
  if(!pool.length)pool=bossQuestions([1,2,3,4],random);
  const bag=shuffle([...new Map(pool.map(q=>[q.key,q])).values()],random);
  const result=[];
  while(result.length<10)result.push(...shuffle(bag,random));
  return result.slice(0,10);
}

export class TrainingScheduler{
  constructor(seed,limit=10){this.queue=[...seed].slice(0,limit);this.limit=limit;this.index=0;}
  current(){return this.queue[this.index]||null;}
  advance(needsReview=false){
    const current=this.current();
    this.index+=1;
    if(needsReview&&current&&this.index<this.limit){
      const insertAt=Math.min(this.index+3,this.limit-1);
      this.queue.splice(insertAt,0,current);
      this.queue=this.queue.slice(0,this.limit);
    }
    return this.current();
  }
}
