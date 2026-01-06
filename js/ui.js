class UI {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.gravityArrow = document.getElementById('gravity-arrow');
        this.gameOverEl = document.getElementById('game-over');
        this.finalScoreEl = document.getElementById('final-score');
        this.restartBtn = document.getElementById('restart-btn');
        this.pauseOverlay = document.getElementById('pause-overlay');
    }

    updateScore(score) {
        this.scoreEl.textContent = `Score: ${score}`;
    }

    updateGravityIndicator(direction) {
        if (!direction) return;

        let rotation = 0;
        switch (direction) {
            case 'up': rotation = 0; break;
            case 'right': rotation = 90; break;
            case 'down': rotation = 180; break;
            case 'left': rotation = 270; break;
        }

        this.gravityArrow.style.transform = `rotate(${rotation}deg)`;
    }

    showGameOver(score, onRestart) {
        this.finalScoreEl.textContent = `Score: ${score}`;
        this.gameOverEl.classList.remove('hidden');
        this.restartBtn.onclick = onRestart;
    }

    hideGameOver() {
        this.gameOverEl.classList.add('hidden');
    }

    showPause(paused) {
        if (paused) {
            this.pauseOverlay.classList.remove('hidden');
        } else {
            this.pauseOverlay.classList.add('hidden');
        }
    }
}
