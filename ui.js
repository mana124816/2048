// ==============================
// 2048 UI
// 盤面の描画、入力の受け付け、結果画面。
// game.js から受け取った state を描くだけで、盤面の計算はしない。
// ==============================

const SIZE = 4;
const BEST_KEY = "2048-best";

// これ未満の動きはスワイプではなくタップとして無視する（px）
const SWIPE_THRESHOLD = 24;

// スコア加算の「+8」を消すまでの保険の時間（ms）
const GAIN_LIFETIME = 900;

// よく使う要素は最初に一度だけ取っておく
let boardEl = null;
let scoreEl = null;
let bestEl = null;
let overlayEl = null;
let overlayTitleEl = null;
let overlayScoreEl = null;
let overlayButtonEl = null;
let restartEl = null;
let boardWrapEl = null;
let gainsEl = null;

// スワイプ中の指（またはマウス）を覚えておく
let activePointerId = null;
let pointerStartX = 0;
let pointerStartY = 0;


document.addEventListener("DOMContentLoaded", () => {
    boardEl = document.querySelector("#board");
    scoreEl = document.querySelector("#score");
    bestEl = document.querySelector("#best");
    overlayEl = document.querySelector("#overlay");
    overlayTitleEl = overlayEl.querySelector(".overlay__title");
    overlayScoreEl = overlayEl.querySelector(".overlay__score-value");
    overlayButtonEl = overlayEl.querySelector(".overlay__button");
    restartEl = document.querySelector("#restart");
    boardWrapEl = document.querySelector(".board-wrap");
    gainsEl = document.querySelector(".score-box__gains");

    restartEl.addEventListener("click", restart);

    // スワイプ（スマホの指、マウスのドラッグ、トラックパッドを同じ扱いにする）
    boardWrapEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    overlayButtonEl.addEventListener("click", () => {
        // クリア画面なら閉じて続行、ゲームオーバーなら最初から
        if (overlayEl.dataset.type === "win") {
            hideOverlay();
        } else {
            restart();
        }
    });

    bestEl.textContent = String(loadBest());

    const state = startGame();
    render(state);
});


document.addEventListener("keydown", (event) => {
    const direction = directionFromKey(event.key);

    if (direction === null) {
        return;
    }

    // 矢印キーでページがスクロールしないようにする
    event.preventDefault();

    handleInput(direction);
});


/**
 * 移動の入り口
 *
 * 矢印キーとスワイプの両方がここを通る。
 * 入力の取り方が増えても、game.js の呼び方は 1 か所のままにしておく。
 */
function handleInput(direction) {
    // ゲームオーバー画面が出ている間は操作を受け付けない
    if (isOverlayVisible() && overlayEl.dataset.type === "gameover") {
        return;
    }

    // クリア画面は次の操作で閉じて続けられる（SPEC 5-⑥）
    hideOverlay();

    const state = move(direction);

    render(state);

    if (state.isWin) {
        showOverlay("win", state.score);
    }

    if (state.isGameOver) {
        showOverlay("gameover", state.score);
    }
}


/**
 * state を受け取って、盤面とスコアを描き直す
 *
 * 毎回 16 マスをまるごと作り直す（SPEC 6 章の方針 A）。
 * newTiles / mergedTiles に入っている位置だけ、CSS のアニメ用クラスを付ける。
 */
function render(state) {
    const board = normalizeBoard(state.board);
    const newTiles = state.newTiles || [];
    const mergedTiles = state.mergedTiles || [];

    const fragment = document.createDocumentFragment();

    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";

            const value = board[row][col];

            if (value !== 0) {
                cell.appendChild(createTile(value, row, col, newTiles, mergedTiles));
            }

            fragment.appendChild(cell);
        }
    }

    boardEl.replaceChildren(fragment);

    const score = toNumber(state.score);
    scoreEl.textContent = String(score);
    bestEl.textContent = String(saveBest(score));

    showGain(toNumber(state.gainedScore));
}


/**
 * 結果画面を出す
 *
 * type は "gameover" または "win"
 */
function showOverlay(type, score) {
    const isWin = (type === "win");

    overlayEl.dataset.type = type;
    overlayEl.classList.toggle("overlay--win", isWin);

    overlayTitleEl.textContent = isWin ? "2048 達成" : "Game Over";
    overlayScoreEl.textContent = String(toNumber(score));
    overlayButtonEl.textContent = isWin ? "続ける" : "もう一度";

    overlayEl.hidden = false;
}


// ===== スワイプ操作 =====

/**
 * 指が触れた（マウスが押された）位置を覚える
 */
function onPointerDown(event) {
    // 2 本目以降の指は無視する
    if (activePointerId !== null) {
        return;
    }

    activePointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
}


/**
 * 離した位置との差を見て、方向を決める
 *
 * 盤面の外で離されても拾えるよう、pointerup は window で受けている。
 */
function onPointerUp(event) {
    if (event.pointerId !== activePointerId) {
        return;
    }

    activePointerId = null;

    const direction = directionFromSwipe(
        event.clientX - pointerStartX,
        event.clientY - pointerStartY
    );

    if (direction === null) {
        return;
    }

    handleInput(direction);
}


function onPointerCancel(event) {
    if (event.pointerId === activePointerId) {
        activePointerId = null;
    }
}


/**
 * 動いた距離から方向を決める
 * 短すぎる動きはタップなので null（ボタンを押しただけのときに動かないようにする）
 */
function directionFromSwipe(dx, dy) {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < SWIPE_THRESHOLD) {
        return null;
    }

    // 動きが大きい軸を採用する（斜めのスワイプでも 1 方向に決まる）
    if (absX > absY) {
        return dx > 0 ? "right" : "left";
    }

    return dy > 0 ? "down" : "up";
}


// ===== 内部処理 =====

/**
 * タイル 1 枚の要素を作る
 */
function createTile(value, row, col, newTiles, mergedTiles) {
    const tile = document.createElement("div");

    tile.className = "tile " + tileColorClass(value);

    if (containsCell(newTiles, row, col)) {
        tile.classList.add("tile--new");
    }

    if (containsCell(mergedTiles, row, col)) {
        tile.classList.add("tile--merged");
    }

    tile.textContent = String(value);

    return tile;
}


/**
 * 数字から色のクラス名を決める
 * 2048 より上は tile-super でまとめる（色切れで真っ白にならないための保険）
 */
function tileColorClass(value) {
    if (value > 2048) {
        return "tile-super";
    }

    return "tile-" + value;
}


/**
 * [[row, col], ...] の中に、その位置が入っているか
 */
function containsCell(cells, row, col) {
    if (!Array.isArray(cells)) {
        return false;
    }

    return cells.some((cell) => {
        return Array.isArray(cell) && cell[0] === row && cell[1] === col;
    });
}


/**
 * 盤面を必ず 4x4 の数値配列にして返す
 *
 * game.js が未実装のうちは board が空で届くので、
 * ここで受け止めて空の盤面として描く（画面が真っ白にならないようにする）。
 */
function normalizeBoard(board) {
    const result = [];

    for (let row = 0; row < SIZE; row++) {
        const source = Array.isArray(board) && Array.isArray(board[row]) ? board[row] : [];
        const line = [];

        for (let col = 0; col < SIZE; col++) {
            line.push(toNumber(source[col]));
        }

        result.push(line);
    }

    return result;
}


function directionFromKey(key) {
    if (key === "ArrowLeft") {
        return "left";
    } else if (key === "ArrowRight") {
        return "right";
    } else if (key === "ArrowUp") {
        return "up";
    } else if (key === "ArrowDown") {
        return "down";
    }

    return null;
}


function restart() {
    hideOverlay();

    const state = startGame();

    render(state);
}


function hideOverlay() {
    overlayEl.hidden = true;
    overlayEl.dataset.type = "";
}


function isOverlayVisible() {
    return overlayEl.hidden === false;
}


/**
 * 増えたスコアを「+8」として浮かせる（state.gainedScore）
 *
 * 増えていないときは何も出さない。
 */
function showGain(gained) {
    if (gained <= 0) {
        return;
    }

    const gain = document.createElement("span");
    gain.className = "gain";
    gain.textContent = "+" + gained;

    // アニメが終わったら自分で消える。
    // 動きを切っている環境でも残り続けないよう、時間切れの保険も付ける
    gain.addEventListener("animationend", () => gain.remove());
    setTimeout(() => gain.remove(), GAIN_LIFETIME);

    // 常に最新の 1 つだけ出す。
    // 素早く連続で合体したとき、同じ位置に重なって数字が読めなくなるのを防ぐ
    gainsEl.replaceChildren(gain);

    bumpScore();
}


/**
 * スコアの数字を一瞬だけ跳ねさせる
 */
function bumpScore() {
    scoreEl.classList.remove("is-bumped");

    // クラスを付け直すだけではアニメが再生されないので、
    // 一度レイアウトを読んでブラウザに変化を認識させる
    void scoreEl.offsetWidth;

    scoreEl.classList.add("is-bumped");
}


/**
 * ベストスコアの読み書き
 * localStorage が使えない環境でも落ちないようにしておく
 */
function loadBest() {
    try {
        return toNumber(localStorage.getItem(BEST_KEY));
    } catch (error) {
        return 0;
    }
}


function saveBest(score) {
    const best = Math.max(loadBest(), score);

    try {
        localStorage.setItem(BEST_KEY, String(best));
    } catch (error) {
        // 保存できなくても表示だけ続ける
    }

    return best;
}


function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}
