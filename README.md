# たしひきファンタジーバトル

小学1年生くらいのたし算・ひき算を、モンスターとのバトル・特訓・図鑑集めとして練習できるWeb教材です。

## 公開ページ

https://tt-sensei.github.io/tashi-hiki/

## 学習レベル

- レベル1：5までのたし算・ひき算
- レベル2：10までのたし算・ひき算
- レベル3：20までのたし算・ひき算
- レベル4：20まで・たし算とひき算のランダム

たし算は答えが各レベルの範囲内になるように、ひき算は答えが1以上になるように問題を作ります。

## バトル

通常バトルは5問正解でモンスターを撃破。
バトル前に「たし算」「ひき算」「どっちも！」から計算の種類を選べます。

正解を重ねるとATTACK、5・10・15…コンボでSPECIAL。
間違えた問題は自動で記録され、特訓につながります。

## 特訓

HP・敵・タイマーなしの10問セット。
おまかせ特訓、レベル特訓、まちがい特訓を用意しています。

間違えた問題はあとでもう一度出題され、2回連続で正解すると苦手から外れます。

## 図鑑・コレクション

モンスター図鑑とコレクションを用意しています。
学習の進み具合とは別に、モンスターやバッジを集めていけます。

## 技術

HTML / CSS / Vanilla JavaScript、GitHub Pages、localStorage。
外部API・APIキー・DB・BGMは使用しません。

edu-kitに合わせ、edu-components、edu-effects、sounds-recipe-、edu-assets、navi-character-の実在する素材を参照しています。

## 構成

tashi-hiki/
├─ index.html
├─ style.css
├─ app.js
├─ data.js
├─ logic.js
├─ tests.mjs
├─ package.json
├─ sticker-effects.css
├─ LICENSE
└─ README.md
