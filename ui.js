document.addEventListener("DOMContentLoaded", () => {
    const state = startGame();
    render(state);
});


document.addEventListener("keydown", (event) => {
    let direction = null;

    if (event.key === "ArrowLeft") {
        direction = "left";
    } else if (event.key === "ArrowRight") {
        direction = "right";
    } else if (event.key === "ArrowUp") {
        direction = "up";
    } else if (event.key === "ArrowDown") {
        direction = "down";
    }

    if (direction === null) {
        return;
    }

    const state = move(direction);

    render(state);

    if (state.isWin) {
        showOverlay("win", state.score);
    }

    if (state.isGameOver) {
        showOverlay("gameover", state.score);
    }
});


function render(state) {
    // game.jsから受け取った盤面を描画
}


function showOverlay(type, score) {
    // 勝利 / ゲームオーバー画面
}