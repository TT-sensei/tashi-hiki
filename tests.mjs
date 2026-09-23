import assert from 'node:assert/strict';
import {defaultState,stageQuestions,getStageRewardExp,comboAnimation,mathQuestion,recordAttempt,TrainingScheduler,migrateState,isMaster,parseKey} from './logic.js';
import {NORMAL_MONSTERS} from './data.js';

const l1=stageQuestions(1,()=>0.5);
assert.equal(l1.length,190);
assert.ok(l1.every(q=>q.operation==='add'&&q.answer>=2&&q.answer<=20));

const l2=stageQuestions(2,()=>0.5);
assert.ok(l2.length>0);
assert.ok(l2.every(q=>q.operation==='sub'&&q.answer>=1));
assert.ok(l2.every(q=>q.left<10 || q.right<=q.left%10));

const l3=stageQuestions(3,()=>0.5);
assert.equal(l3.length,9);
assert.ok(l3.every(q=>q.operation==='sub'&&q.left===20&&q.right>=1&&q.right<=9&&q.answer>=11&&q.answer<=19));

const l4=stageQuestions(4,()=>0.5);
assert.ok(l4.some(q=>q.operation==='add'));
assert.ok(l4.some(q=>q.operation==='sub'));
assert.ok(l4.every(q=>q.answer>=1&&q.answer<=20));

assert.equal(mathQuestion('add',12,8).answer,20);
assert.equal(mathQuestion('sub',18,7).answer,11);
assert.equal(parseKey('add:12:8').answer,20);

for(const n of [5,10,15,20,25,30])assert.equal(comboAnimation(n),'special');
for(const n of [1,2,3,4,6,7,8,9,11,12,13,14,16,17,18,19])assert.equal(comboAnimation(n),'attack');
assert.equal(NORMAL_MONSTERS.length,24);

const rewardState=defaultState();
assert.equal(getStageRewardExp(rewardState,1,20,'2026-08-25'),20);
assert.equal(getStageRewardExp(rewardState,1,20,'2026-08-25'),15);
assert.equal(getStageRewardExp(rewardState,1,20,'2026-08-25'),10);
assert.equal(getStageRewardExp(rewardState,1,20,'2026-08-25'),5);

const state=defaultState();
const q=mathQuestion('add',3,4);
recordAttempt(state,q,false,'2026-01-01T00:00:00Z');
assert.deepEqual(state.reviewQueue,['add:3:4']);
const filler=[
  mathQuestion('sub',8,3),mathQuestion('add',1,2),mathQuestion('sub',7,2),
  mathQuestion('add',2,5),mathQuestion('sub',9,4),mathQuestion('add',4,3),
  mathQuestion('sub',6,1),mathQuestion('add',2,2),mathQuestion('sub',5,2)
];
const scheduler=new TrainingScheduler([q,...filler]);
assert.equal(scheduler.current().key,'add:3:4');
scheduler.advance(true);
assert.notEqual(scheduler.current().key,'add:3:4');
scheduler.advance();scheduler.advance();scheduler.advance();
assert.equal(scheduler.current().key,'add:3:4');
recordAttempt(state,q,true,'2026-01-01T00:01:00Z');
assert.equal(state.mathStats['add:3:4'].reviewActive,true);
recordAttempt(state,q,true,'2026-01-01T00:02:00Z');
assert.equal(state.mathStats['add:3:4'].reviewActive,false);
assert.deepEqual(state.reviewQueue,[]);

state.stageProgress[1].cleared=true;
state.stageProgress[1].noMiss=true;
assert.equal(isMaster(state,1),true);
const restored=migrateState(JSON.parse(JSON.stringify({...state,playerLevel:12,collections:['dragon']})));
assert.equal(restored.playerLevel,12);
assert.deepEqual(restored.collections,['dragon']);
console.log('All tashi-hiki level and persistence tests passed.');
