// ==============================
// 2048 Game Logic
// ==============================

// 現在の盤面
let board = [];

// 現在のスコア
let score = 0;

// 2048到達済みか
let hasWon = false;

// ===== 外部から呼ぶ関数 =====

/**
 * ゲームを初期化する
 */
function startGame() {
    // TODO:
    // 4x4の0埋め盤面を作る
    // タイルを2枚配置する
    // score = 0
    // hasWon = false

    return getState();
}


/**
 * 指定方向へ盤面を動かす
 *
 * direction:
 * "left" / "right" / "up" / "down"
 */
function move(direction) {
    // TODO:
    // 1. 現在の盤面を保存
    // 2. direction に応じて移動
    // 3. moved を判定
    // 4. 動いていれば新しいタイルを生成
    // 5. ゲームオーバー判定
    // 6. 勝利判定

    return getState();
}


/**
 * 現在のゲーム状態を取得する
 */
function getState() {
    return {
        board: board,
        score: score,
        gainedScore: 0,
        moved: false,
        newTiles: [],
        mergedTiles: [],
        isGameOver: false,
        isWin: false
    };
}

// ===== 内部処理 =====

function createEmptyBoard() {

}

function moveRowLeft(row) {

}

function moveLeft() {

}

function moveRight() {

}

function moveUp() {

}

function moveDown() {

}

function addRandomTile() {

}

function getEmptyCells() {

}

function checkGameOver() {

}

function checkWin() {

}

function cloneBoard(board) {

}