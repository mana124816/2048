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
    // 4x4の0埋め盤面を作る
    board = Array.from({ length: 4 }, () => Array(4).fill(0));

    // ゲーム状態の初期化
    score = 0
    hasWon = false

    // 最初のタイルを2枚置く
    const newTiles = [];

    newTiles.push(addRandomTile());
    newTiles.push(addRandomTile());

    return getState({
        newTiles: newTiles
    });
}


/**
 * 指定方向へ盤面を動かす
 *
 * direction:
 * "left" / "right" / "up" / "down"
 */
function move(direction) {
    // 現在の盤面を保存
    const oldBoard = board.map(row => [...row]);

    let result;

    // direction に応じて移動
    switch (direction) {
        case "left":
            result = moveLeft();
            break;
        
        case "right":
            result = moveRight();
            break;
        
        case "up":
            result = moveUp();
            break;
        
        case "down":
            result = moveDown();
            break;
            
        default:
            return getState();
    }

    // moveLeft() などが返した結果を反映
    board = result.board;

    const gainedScore = result.gainedScore;
    const mergedTiles = result.mergedTiles;

     // スコアを加算
    score += gainedScore;

    // 盤面が変化したか判定
    const moved = !boardsEqual(oldBoard, board);

    const newTiles = [];

    // 実際に動いた場合だけ新しいタイルを追加
    if (moved) {
        const newTile = addRandomTile();

        if (newTile !== null) {
            newTiles.push(newTile);
        }
    }

    // 2048が今回初めてできたか
    let isWin = false;

    if (!hasWon && contains2048()) {
        hasWon = true;
        isWin = true;
    }

    // ゲームオーバー判定
    const isGameOver = checkGameOver();

    return getState({
        gainedScore: gainedScore,
        moved: moved,
        newTiles: newTiles,
        mergedTiles: mergedTiles,
        isGameOver: isGameOver,
        isWin: isWin
    });
}


/**
 * 現在のゲーム状態を取得する
 */
function getState(options = {}) {
    return {
        board: board.map(row => [...row]),
        score: score,
        gainedScore: options.gainedScore ?? 0,
        moved: options.moved ?? false,
        newTiles: options.newTiles ?? [],
        mergedTiles: options.mergedTiles ?? [],
        isGameOver: options.isGameOver ?? false,
        isWin: options.isWin ?? false
    };
}

// ===== 内部処理 =====

/**
 * 1行を左方向へ移動・合体させる
 *
 * 例:
 * [0, 2, 0, 2] → [4, 0, 0, 0]
 * [2, 2, 2, 2] → [4, 4, 0, 0]
 */
function moveRowLeft(row) {
    // 0を取り除く
    const tiles = row.filter(value => value !== 0);

    const newRow = [];
    const mergedCols = [];
    let gainedScore = 0;

    let i = 0;

    while (i < tiles.length) {
        // 隣り合う数字が同じなら合体
        if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
            const mergedValue = tiles[i] * 2;

            // 合体後の位置
            mergedCols.push(newRow.length);

            newRow.push(mergedValue);
            gainedScore += mergedValue;

            // 2つ使ったので次のタイルを飛ばす
            i += 2;
        } else {
            newRow.push(tiles[i]);
            i += 1;
        }
    }

    // 長さ4になるまで0を追加
    while (newRow.length < 4) {
        newRow.push(0);
    }

    return {
        row: newRow,
        gainedScore: gainedScore,
        mergedCols: mergedCols
    };
}

function transpose(board) {
    return board[0].map((_, col) =>
        board.map(row => row[col])
    );
}

function moveLeft(targetBoard = board) {
    const newBoard = [];
    const mergedTiles = [];
    let gainedScore = 0;

    for (let row = 0; row < 4; row++) {
        const result = moveRowLeft(targetBoard[row]);

        newBoard.push(result.row);
        gainedScore += result.gainedScore;

        // 合体したタイルの座標を保存
        for (const col of result.mergedCols) {
            mergedTiles.push([row, col]);
        }
    }

    return {
        board: newBoard,
        gainedScore: gainedScore,
        mergedTiles: mergedTiles
    };
}

function moveRight() {
    // 左右反転
    const reversedBoard = board.map(row => [...row].reverse());

    // 左移動として処理
    const result = moveLeft(reversedBoard);

    // 左右反転を戻す
    return {
        board: result.board.map(row => [...row].reverse()),
        gainedScore: result.gainedScore,
        mergedTiles: result.mergedTiles.map(
            ([row, col]) => [row, 3 - col]
        )
    };
}

function moveUp(targetBoard = board) {
    // 行と列を入れ替える
    const transposedBoard = transpose(targetBoard);

    // 「上移動」を「左移動」として処理
    const result = moveLeft(transposedBoard);

    return {
        board: transpose(result.board),
        gainedScore: result.gainedScore,

        // 転置したので row と col を戻す
        mergedTiles: result.mergedTiles.map(
            ([row, col]) => [col, row]
        )
    };
}

function moveDown() {
    // 上下反転
    const reversedBoard = [...board].reverse();

    // 上移動として処理
    const result = moveUp(reversedBoard);

    // 上下反転を戻す
    return {
        board: [...result.board].reverse(),
        gainedScore: result.gainedScore,
        mergedTiles: result.mergedTiles.map(
            ([row, col]) => [3 - row, col]
        )
    };
}

function addRandomTile() {
    const emptyCells = [];

    // 空いているマスを探す
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] === 0) {
                emptyCells.push([row, col]);
            }
        }
    }

    // 空いているマスがなければ何もしない
    if (emptyCells.length === 0) {
        return null;
    }

    // 空きますからランダムに1つ選ぶ
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const [row, col] = emptyCells[randomIndex];

    // 90%で2, 10%で4
    board[row][col] = Math.random() < 0.9 ? 2 : 4;

    return [row, col];
}

function boardsEqual(board1, board2) {
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (board1[row][col] !== board2[row][col]) {
                return false;
            }
        }
    }

    return true;
}


function contains2048() {
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] === 2048) {
                return true;
            }
        }
    }

    return false;
}

function checkGameOver() {
    // 空きマスがあれば、まだゲームオーバーではない
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] === 0) {
                return false;
            }
        }
    }

    // 横方向に合体できる場所があるか確認
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
            if (board[row][col] === board[row][col + 1]) {
                return false;
            }
        }
    }

    // 縦方向に合体できる場所があるか確認
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] === board[row + 1][col]) {
                return false;
            }
        }
    }

    // 空きマスもなく、合体できる場所もない
    return true;
}