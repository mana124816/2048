# Python → JavaScript 対応メモ

最終更新: 2026-09-19

---

## 0. このメモは何か

Python は書けるが JavaScript は初めて、という人向けの変換表です。
2026-09-20 の 2 人ゲーム開発（作業時間 5 時間）で、ロジック担当が最初に読む想定です。

**結論を先に:** 文法の差は小さく、慣れるのに 30 分〜1 時間程度です。
ブラウザ特有の難所（DOM 操作・イベント）は担当外なので、触らずに済みます。

---

## 1. 前提：担当分け

| 担当 | 役割 | 触るファイル |
|---|---|---|
| デザイン／UI | 見た目、画面の書き換え、イベント処理 | `index.html` / `style.css` / `ui.js` |
| ロジック（このメモの読者） | ゲームのルール、勝敗判定、スコア計算 | `game.js` |

**ルール: 担当外のファイルは編集しない。** 直したい箇所があれば口頭で依頼する。
（同じファイルを 2 人で触ると Git でコンフリクトが起きて、復旧に時間を取られるため）

---

## 2. あなたが書くのは「Python に近い側」

`game.js` に書くのは、画面と無関係な純粋な計算です。

- カードをシャッフルする
- クリックされたマスの番号を受け取って、盤面を更新する
- 勝敗を判定する
- スコアを計算する

これらは Python の関数とほぼ同じ感覚で書けます。
`document.~` や `addEventListener` といったブラウザ固有のものは、原則として `ui.js` 側の仕事です。

---

## 3. 文法対応表

### 基本

| Python | JavaScript | 補足 |
|---|---|---|
| `x = 5` | `let x = 5;` | 後で変える変数 |
| `X = 5`（定数のつもり） | `const X = 5;` | 変えないなら常に `const` を使う |
| `# コメント` | `// コメント` | |
| `print(x)` | `console.log(x)` | 出力先はブラウザの F12 → Console |
| インデントでブロック | `{ }` でブロック | インデントは見た目だけ |
| 行末なにもなし | 行末に `;` | 無くても動くが付ける |

### 条件分岐・ループ

| Python | JavaScript |
|---|---|
| `if x == 1:` | `if (x === 1) { }` |
| `elif` | `else if` |
| `else:` | `else { }` |
| `and` / `or` / `not` | `&&` / `\|\|` / `!` |
| `True` / `False` | `true` / `false`（小文字） |
| `None` | `null`（未代入は `undefined`） |
| `for i in range(10):` | `for (let i = 0; i < 10; i++) { }` |
| `for v in lst:` | `for (const v of lst) { }` |
| `for i, v in enumerate(lst):` | `lst.forEach((v, i) => { })` |
| `while cond:` | `while (cond) { }` |

### 関数

```python
# Python
def add(a, b):
    return a + b
```

```js
// JavaScript（どちらでも良い。下が今風）
function add(a, b) {
  return a + b;
}

const add = (a, b) => a + b;
```

### 文字列

| Python | JavaScript |
|---|---|
| `f"score: {s}"` | `` `score: ${s}` ``（バッククォート） |
| `"a" + "b"` | `"a" + "b"`（同じ） |
| `len(s)` | `s.length` |
| `s.upper()` | `s.toUpperCase()` |
| `str(5)` | `String(5)` |
| `int("5")` | `Number("5")` |

### リスト / 配列

| Python | JavaScript |
|---|---|
| `lst = [1, 2, 3]` | `const lst = [1, 2, 3];` |
| `len(lst)` | `lst.length` |
| `lst.append(x)` | `lst.push(x)` |
| `lst.pop()` | `lst.pop()`（同じ） |
| `lst[0]` | `lst[0]`（同じ） |
| `lst[-1]` | `lst[lst.length - 1]` ← **負の添字は使えない** |
| `lst[1:3]` | `lst.slice(1, 3)` |
| `x in lst` | `lst.includes(x)` |
| `[f(v) for v in lst]` | `lst.map(v => f(v))` |
| `[v for v in lst if cond]` | `lst.filter(v => cond)` |
| `sorted(lst)` | `[...lst].sort((a, b) => a - b)` ← **数値は比較関数が必須** |

### 辞書 / オブジェクト

| Python | JavaScript |
|---|---|
| `d = {"a": 1}` | `const d = {a: 1};` |
| `d["a"]` | `d.a` または `d["a"]` |
| `d["b"] = 2` | `d.b = 2;` |
| `"a" in d` | `"a" in d`（同じ） |
| `d.keys()` | `Object.keys(d)` |
| `for k, v in d.items():` | `for (const [k, v] of Object.entries(d)) { }` |

### 乱数（ゲームでよく使う）

| やりたいこと | Python | JavaScript |
|---|---|---|
| 0以上1未満の小数 | `random.random()` | `Math.random()` |
| 0〜n-1 の整数 | `random.randrange(n)` | `Math.floor(Math.random() * n)` |
| 配列をシャッフル | `random.shuffle(lst)` | 下記参照（標準関数が無い） |

```js
// シャッフル（Fisher-Yates法）。JS には shuffle が無いので自分で書く
function shuffle(arr) {
  const a = [...arr];              // 元の配列を壊さないようコピー
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];   // 入れ替え（Pythonと同じ書き方ができる）
  }
  return a;
}
```

---

## 4. 詰まりやすい罠（上から順に頻度が高い）

1. **`print` が無い → `console.log`。しかも出力はブラウザの F12 → Console タブ**
   これを知らないと最初の 10 分が消えます。最優先で確認してください。

2. **`==` ではなく `===` を使う**
   `"5" == 5` は `true` になってしまいます。`===` なら `false`。常に `===` を使ってください。

3. **負の添字が使えない**
   `lst[-1]` は `undefined` になります。エラーも出ないので気づきにくいです。

4. **`sort()` は既定で文字列として並べる**
   `[10, 9, 1].sort()` は `[1, 10, 9]` になります。数値は必ず `sort((a, b) => a - b)`。

5. **エラーが画面に出ない**
   Python のようにターミナルへ赤字で出ません。F12 → Console を**常に開いたまま**作業してください。

---

## 5. 前日に 5 分で試すコード

`test.html` というファイルを作り、以下を貼ってブラウザで開く。
そのあと **F12 を押して Console タブ**を見る。

```html
<button id="btn">押す</button>

<script>
  const nums = [3, 1, 10];
  nums.sort((a, b) => a - b);
  console.log(nums);            // [1, 3, 10] と出れば成功

  const d = {name: "cat", hp: 5};
  console.log(`${d.name} の HP は ${d.hp}`);

  document.querySelector("#btn").addEventListener("click", () => {
    console.log("クリックされた");
  });
</script>
```

**確認したいのは 2 点だけです。**

- 配列やオブジェクトが Python と同じ感覚で動くこと
- `console.log` の出力が F12 の Console に出ること

これが分かれば当日は問題ありません。

---

## 6. AI に書かせるときの指示の型

当日 AI に頼むときは、以下を必ず含めてください。事故が大きく減ります。

> 「まず `game.js` と `SPEC.md` を読んでください。そのうえで `<機能名>` を実装します。
> **編集してよいのは `game.js` だけ**です。`ui.js` と `index.html` は変更しないでください。
> `SPEC.md` に書かれた関数名・引数は変更しないでください。」

**「読んでから」「このファイルだけ」「名前は変えない」** の 3 点が要点です。
これを言わないと、AI が親切心で相方のファイルまで書き換えて、合体時に壊れます。

---

## 7. 参考

- MDN Web Docs（JavaScript 日本語リファレンス）
  https://developer.mozilla.org/ja/docs/Web/JavaScript
- 迷ったら「Python の ○○ は JavaScript で何ですか」と AI に聞くのが最短です。
