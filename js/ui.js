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
        this.settingsOverlay = document.getElementById('settings-overlay');
        this.debugOverlay = document.getElementById('debug-overlay');

        this.setupMenuEvents();
        this.setupSettingsEvents();
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

    setupSettingsEvents() {
        // 설정 버튼
        document.getElementById('settings-btn').onclick = () => {
            this.showSettings();
        };

        // 디버그 메뉴 버튼
        document.getElementById('debug-menu-btn').onclick = () => {
            this.hideSettings();
            this.showDebug();
        };

        // 설정 닫기
        document.getElementById('close-settings-btn').onclick = () => {
            this.hideSettings();
        };

        // 디버그 적용
        document.getElementById('apply-debug-btn').onclick = () => {
            if (this.onApplyDebug) this.onApplyDebug();
        };

        // 디버그 닫기
        document.getElementById('close-debug-btn').onclick = () => {
            this.hideDebug();
        };

        // 오버레이 클릭 시 닫기
        this.settingsOverlay.onclick = (e) => {
            if (e.target === this.settingsOverlay) this.hideSettings();
        };

        this.debugOverlay.onclick = (e) => {
            if (e.target === this.debugOverlay) this.hideDebug();
        };
    }

    showSettings() {
        this.settingsOverlay.classList.remove('hidden');
    }

    hideSettings() {
        this.settingsOverlay.classList.add('hidden');
    }

    showDebug() {
        this.debugOverlay.classList.remove('hidden');
    }

    hideDebug() {
        this.debugOverlay.classList.add('hidden');
    }

    getDebugConfig() {
        return {
            blockCount: parseInt(document.getElementById('block-count').value),
            bombChance: parseInt(document.getElementById('bomb-chance').value),
            bombRange: parseInt(document.getElementById('bomb-range').value),
            boardSize: parseInt(document.getElementById('board-size').value),
            animationSpeed: parseFloat(document.getElementById('animation-speed').value),
            minCells: parseInt(document.getElementById('min-cells').value),
            maxCells: parseInt(document.getElementById('max-cells').value),
            gameOverMode: parseInt(document.getElementById('gameover-mode').value),
            cellThreshold: parseInt(document.getElementById('cell-threshold').value),
            turnsAfterThreshold: parseInt(document.getElementById('turns-after-threshold').value)
        };
    }

    setDebugConfig(config) {
        document.getElementById('block-count').value = config.blockCount;
        document.getElementById('bomb-chance').value = config.bombChance;
        document.getElementById('bomb-range').value = config.bombRange;
        document.getElementById('board-size').value = config.boardSize;
        document.getElementById('animation-speed').value = config.animationSpeed;
        document.getElementById('min-cells').value = config.minCells;
        document.getElementById('max-cells').value = config.maxCells;
        document.getElementById('gameover-mode').value = config.gameOverMode;
        document.getElementById('cell-threshold').value = config.cellThreshold;
        document.getElementById('turns-after-threshold').value = config.turnsAfterThreshold;
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
