class UI {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.gravityArrow = document.getElementById('gravity-arrow');
        this.gameOverEl = document.getElementById('game-over');
        this.finalScoreEl = document.getElementById('final-score');
        this.restartBtn = document.getElementById('restart-btn');
        this.pauseOverlay = document.getElementById('pause-overlay');

        this.mainMenu = document.getElementById('main-menu');
        this.tutorialOverlay = document.getElementById('tutorial-overlay');
        this.gameContainer = document.getElementById('game-container');

        this.setupMenuEvents();
    }

    setupMenuEvents() {
        // 게임 시작 버튼
        document.getElementById('start-btn').onclick = () => {
            if (this.onStartGame) this.onStartGame();
        };

        // 튜토리얼 버튼
        document.getElementById('tutorial-btn').onclick = () => {
            this.showTutorial();
        };

        // 튜토리얼 내 게임 시작 버튼
        document.getElementById('tutorial-start-btn').onclick = () => {
            this.hideTutorial();
            if (this.onStartGame) this.onStartGame();
        };

        // 튜토리얼 오버레이 클릭 시 닫기
        this.tutorialOverlay.onclick = (e) => {
            if (e.target === this.tutorialOverlay) {
                this.hideTutorial();
            }
        };
    }

    showMainMenu() {
        this.mainMenu.classList.remove('hidden');
        this.gameContainer.classList.add('hidden');
    }

    hideMainMenu() {
        this.mainMenu.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
    }

    showTutorial() {
        this.tutorialOverlay.classList.remove('hidden');
    }

    hideTutorial() {
        this.tutorialOverlay.classList.add('hidden');
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
