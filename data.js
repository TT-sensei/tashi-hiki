const NAVI='https://tt-sensei.github.io/navi-character-/assets/web/fantasy';
const ASSETS='https://tt-sensei.github.io/edu-assets/assets/web/collections/fantasy';

export const CHARACTERS={
  sora:{role:'剣士',stand:NAVI+'/sora-swordsman.webp',attack:NAVI+'/attack/sora-swordsman-attack.webp',damage:NAVI+'/damage/sora-swordsman-damage.webp',special:NAVI+'/special/sora-swordsman-special.webp'},
  riku:{role:'忍者',stand:NAVI+'/riku-ninja.webp',attack:NAVI+'/attack/riku-ninja-attack.webp',damage:NAVI+'/damage/riku-ninja-damage.webp',special:NAVI+'/special/riku-ninja-special.webp'},
  kai:{role:'魔導士',stand:NAVI+'/kai-mage.webp',attack:NAVI+'/attack/kai-mage-attack.webp',damage:NAVI+'/damage/kai-mage-damage.webp',special:NAVI+'/special/kai-mage-special.webp'},
  tsuki:{role:'アーチャー',stand:NAVI+'/tsuki-archer.webp',attack:NAVI+'/attack/tsuki-archer-attack.webp',damage:NAVI+'/damage/tsuki-archer-damage.webp',special:NAVI+'/special/tsuki-archer-special.webp'},
  nami:{role:'騎士',stand:NAVI+'/nami-guardian-knight.webp',attack:NAVI+'/attack/nami-knight-attack.webp',damage:NAVI+'/damage/nami-knight-damage.webp',special:NAVI+'/special/nami-knight-special.webp'},
  saku:{role:'ヒーラー',stand:NAVI+'/saku-cleric-healer.webp',attack:NAVI+'/attack/saku-cleric-attack.webp',damage:NAVI+'/damage/saku-cleric-damage.webp',special:NAVI+'/special/saku-cleric-special.webp'}
};

const MON=NAVI+'/monsters';
export const NORMAL_MONSTERS=[
  ['forest-puru','もりのプルン',MON+'/zako/forest-puru.webp'],
  ['acorn-leafy','どんぐりリーフィ',MON+'/zako/acorn-leafy.webp'],
  ['little-bat','こもりん',MON+'/zako/komorin-little-night-bat.webp'],
  ['pebble-golem','ころゴーレム',MON+'/zako/koro-golem-pebble-golem.webp'],
  ['ember-newt','ひのこイモリ',MON+'/zako/hinoko-ember-newt.webp'],
  ['frost-pup','モフウルフ',MON+'/zako/mofu-wolf-frost-pup.webp'],
  ['apple-mushroom','りんごキノコ',MON+'/zako/kinoko-apple-mushroom.webp'],
  ['snow-puff','ゆきまる',MON+'/zako/yukimaru-snow-puff.webp'],
  ['star-bat','スターコウモリ',MON+'/zako/star-bat.webp'],
  ['purun-little-magic-slime','ちびマジックスライム',MON+'/zako/purun-little-magic-slime.webp'],
  ['berry-leafy','ベリリーフ',MON+'/zako/berry-leafy.webp'],
  ['autumn-mushroom','あきいろキノコ',MON+'/zako/autumn-mushroom.webp'],
  ['spring-moss-pup','はるもすウルフ',MON+'/zako/spring-moss-pup.webp'],
  ['rainy-bat','あめふりコウモリ',MON+'/zako/rainy-bat.webp'],
  ['moss-pebble-golem','こけいわゴーレム',MON+'/zako/moss-pebble-golem.webp'],
  ['sunstone-golem','たいようせきゴーレム',MON+'/zako/sunstone-golem.webp'],
  ['sand-ember-newt','すなひのこイモリ',MON+'/zako/sand-ember-newt.webp'],
  ['tidal-newt','うみしおイモリ',MON+'/zako/tidal-newt.webp'],
  ['ember-frost-pup','ひえひえモフウルフ',MON+'/zako/ember-frost-pup.webp'],
  ['night-snow-puff','よるゆきまる',MON+'/zako/night-snow-puff.webp'],
  ['sakura-snow-puff','さくらゆきまる',MON+'/zako/sakura-snow-puff.webp'],
  ['sunset-puru','ゆうやけプルン',MON+'/zako/sunset-puru.webp'],
  ['snow-mushroom','ゆきキノコ',MON+'/zako/snow-mushroom.webp'],
  ['happa-squirrel-leafy','はっぱリスリーフィ',MON+'/zako/happa-squirrel-leafy.webp']
].map(([id,name,image])=>({id,name,image,kind:'normal'}));

export const NORMAL_MONSTER_GROUPS=[
  NORMAL_MONSTERS.slice(0,6),
  NORMAL_MONSTERS.slice(3,12),
  NORMAL_MONSTERS.slice(6,18),
  NORMAL_MONSTERS
];

export const BOSS_CANDIDATES={
  mid1:[
    {id:'forest-horn-king',name:'森角王グランリーフ',image:MON+'/boss/forest-horn-king.webp',kind:'midboss'},
    {id:'autumn-horn-king',name:'秋彩角王オータムリーフ',image:MON+'/boss/autumn-horn-king.webp',kind:'midboss'},
    {id:'moss-ruin-horn-king',name:'苔岩角王モスルイン',image:MON+'/boss/moss-ruin-horn-king.webp',kind:'midboss'}
  ],
  mid2:[
    {id:'thunder-griffon',name:'雷翼グリフォン',image:MON+'/boss/thunder-griffon.webp',kind:'midboss'},
    {id:'sky-ruin-griffon',name:'空遺跡グリフォン',image:MON+'/boss/sky-ruin-griffon.webp',kind:'midboss'},
    {id:'solar-griffon-king',name:'太陽翼王ソルグリフォン',image:MON+'/boss/solar-griffon-king.webp',kind:'midboss'}
  ],
  final:[
    {id:'crimson-inferno-dragon',name:'紅炎竜インフェルノ',image:MON+'/boss/crimson-inferno-dragon.webp',kind:'boss'},
    {id:'azure-sky-dragon',name:'蒼天竜アズール',image:MON+'/boss/azure-sky-dragon.webp',kind:'boss'},
    {id:'eclipse-shadow-phoenix',name:'蝕影鳥エクリプス',image:MON+'/boss/eclipse-shadow-phoenix.webp',kind:'boss'},
    {id:'noxstella-star-eater',name:'星喰いノクステラ',image:MON+'/boss/noxstella-star-eater.webp',kind:'boss'},
    {id:'lumina-moon-phoenix',name:'月光鳥ルミナ',image:MON+'/boss/lumina-moon-phoenix.webp',kind:'boss'},
    {id:'flare-leo',name:'炎獅子フレア',image:MON+'/boss/flare-leo.webp',kind:'boss'},
    {id:'prism-crystal-golem',name:'虹晶ゴーレム',image:MON+'/boss/prism-crystal-golem.webp',kind:'boss'},
    {id:'volcano-boar-king',name:'火山猪王ボルケーノ',image:MON+'/boss/volcano-boar-king.webp',kind:'boss'}
  ]
};

export const BOSSES=Object.fromEntries(Object.entries(BOSS_CANDIDATES).map(([id,candidates])=>[id,candidates[0]]));
export const BACKGROUNDS={
  home:NAVI+'/backgrounds/town.webp',
  training:NAVI+'/backgrounds/training-ground.webp',
  normal:NAVI+'/backgrounds/grassland.webp',
  mid1:NAVI+'/backgrounds/forest.webp',
  mid2:NAVI+'/backgrounds/sky-island.webp',
  final:NAVI+'/backgrounds/volcano.webp'
};

export const COLLECTIONS=[
  ['dragon','ドラゴン','common'],['fairy','フェアリー','common'],['golem','ゴーレム','common'],['griffin','グリフォン','common'],
  ['phoenix','フェニックス','common'],['slime','スライム','common'],['unicorn','ユニコーン','common'],['wizard-cat','まほうネコ','common'],
  ['kitsune-spirit','キツネの精霊','rare'],['mermaid','マーメイド','rare'],['pegasus','ペガサス','rare'],['treasure-mimic','ミミック','rare'],
  ['celestial-dragon','天空竜','super-rare'],['moon-unicorn','月のユニコーン','super-rare'],['ancient-guardian','古代の守護者','secret']
].map(([id,name,rarity])=>({id,name,rarity,image:ASSETS+'/'+rarity+'/'+id+'/badge.webp'}));

const MATH_ASSETS='https://tt-sensei.github.io/edu-assets/assets/web/badges/math';
export const MATH_BADGES=[
  ['calculation','計算マスター'],['mental-math','暗算マスター'],['number-sense','数感覚マスター'],
  ['number-line','数直線マスター'],['strategy','作戦マスター'],['verification','確かめマスター'],
  ['logical-thinking','論理思考マスター'],['math-discovery','算数発見マスター'],['math-evidence','根拠説明マスター'],
  ['math-explainer','算数説明マスター'],['math-prediction','予想マスター'],['reverse-thinking','逆思考マスター'],
  ['representation-link','表現つなぎマスター'],['visualize','見える化マスター'],
  ['another-way','別解発見マスター'],['classification','なかま分けマスター'],
  ['fraction-sense','分数感覚マスター'],['generalization','きまり発見マスター'],
  ['geometry','形の見方マスター'],['math-compare','比べ方マスター'],
  ['measurement','はかり方マスター'],['pattern','パターン発見マスター'],
  ['relationship','つながり発見マスター'],['simplify','かんたん整理マスター'],
  ['spatial-sense','空間感覚マスター']
].map(([id,name])=>({id:'math-'+id,name,rarity:'common',category:'math',image:MATH_ASSETS+'/'+id+'/badge.webp'}));

export const ALL_COLLECTIONS=[...COLLECTIONS,...MATH_BADGES];

export const ENCOURAGEMENT={
  correct:['いいね！','そのちょうし！','ばっちり！','できてるよ！'],
  wrong:['ここをもう一回！','いっしょに覚えよう！','次はできそう！','もう一度やってみよう！']
};
