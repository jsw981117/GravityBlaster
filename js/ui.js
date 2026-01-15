class UI {
    constructor() {
        this.scoreEl = document.getElementById('score-value');
        this.turnsEl = document.getElementById('turn-value');
        this.turnContainer = document.getElementById('turn-container');
        this.turnLabel = this.turnContainer ? this.turnContainer.querySelector('.ui-label') : null;
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

        this.showGridCheckbox = document.getElementById('show-grid');
        this.targetHeader = document.getElementById('target-header');

        this.targetTextSize = 16; // 기본값

        this.setupMenuEvents();
        this.setupSettingsEvents();
        this.loadSettings();
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

        // 그리드 토글
        this.showGridCheckbox.onchange = () => {
            this.saveSettings();
            if (this.onGridToggle) this.onGridToggle();
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
            specialCellChance: parseInt(document.getElementById('special-cell-chance').value),
            boomCellWeight: parseInt(document.getElementById('boom-cell-weight').value),
            timeCellWeight: parseInt(document.getElementById('time-cell-weight').value),
            boomRange: parseInt(document.getElementById('boom-range').value),
            timeCellTurnBonus: parseInt(document.getElementById('time-cell-turn-bonus').value),
            explosionStyle: document.getElementById('explosion-style').value,
            explosionDuration: parseInt(document.getElementById('explosion-duration').value),
            explosionRadius: parseFloat(document.getElementById('explosion-radius').value),
            explosionEmojiScale: parseFloat(document.getElementById('explosion-emoji-scale').value),
            specialCellIconScale: parseFloat(document.getElementById('special-cell-icon-scale').value),
            targetHelper: document.getElementById('target-helper').checked,
            boardSize: parseInt(document.getElementById('board-size').value),
            removeAnimDuration: parseInt(document.getElementById('remove-anim-duration').value),
            moveAnimDuration: parseInt(document.getElementById('move-anim-duration').value),
            spawnAnimDuration: parseInt(document.getElementById('spawn-anim-duration').value),
            scoreAnimDuration: parseInt(document.getElementById('score-anim-duration').value),
            scorePopupDistance: parseInt(document.getElementById('score-popup-distance').value),
            minCells: parseInt(document.getElementById('min-cells').value),
            maxCells: parseInt(document.getElementById('max-cells').value),
            gameOverMode: parseInt(document.getElementById('gameover-mode').value),
            cellThreshold: parseInt(document.getElementById('cell-threshold').value),
            turnsAfterThreshold: parseInt(document.getElementById('turns-after-threshold').value),
            boardBgAlpha: parseFloat(document.getElementById('board-bg-alpha').value),
            previewBgAlpha: parseFloat(document.getElementById('preview-bg-alpha').value),
            turnRecovery: parseInt(document.getElementById('turn-recovery').value),
            targetTextSize: parseInt(document.getElementById('target-text-size').value)
        };
    }

    setDebugConfig(config) {
        document.getElementById('block-count').value = config.blockCount;
        document.getElementById('special-cell-chance').value = config.specialCellChance;
        document.getElementById('boom-cell-weight').value = config.boomCellWeight;
        document.getElementById('time-cell-weight').value = config.timeCellWeight;
        document.getElementById('boom-range').value = config.boomRange;
        document.getElementById('time-cell-turn-bonus').value = config.timeCellTurnBonus;
        document.getElementById('explosion-style').value = config.explosionStyle;
        document.getElementById('explosion-duration').value = config.explosionDuration;
        document.getElementById('explosion-radius').value = config.explosionRadius;
        document.getElementById('explosion-emoji-scale').value = config.explosionEmojiScale;
        document.getElementById('special-cell-icon-scale').value = config.specialCellIconScale;
        document.getElementById('target-helper').checked = config.targetHelper;
        document.getElementById('board-size').value = config.boardSize;
        document.getElementById('remove-anim-duration').value = config.removeAnimDuration;
        document.getElementById('move-anim-duration').value = config.moveAnimDuration;
        document.getElementById('spawn-anim-duration').value = config.spawnAnimDuration;
        document.getElementById('score-anim-duration').value = config.scoreAnimDuration;
        document.getElementById('score-popup-distance').value = config.scorePopupDistance;
        document.getElementById('min-cells').value = config.minCells;
        document.getElementById('max-cells').value = config.maxCells;
        document.getElementById('gameover-mode').value = config.gameOverMode;
        document.getElementById('cell-threshold').value = config.cellThreshold;
        document.getElementById('turns-after-threshold').value = config.turnsAfterThreshold;
        document.getElementById('board-bg-alpha').value = config.boardBgAlpha;
        document.getElementById('preview-bg-alpha').value = config.previewBgAlpha;
        document.getElementById('turn-recovery').value = config.turnRecovery;
        document.getElementById('target-text-size').value = config.targetTextSize;
    }

    updateScore(score) {
        this.scoreEl.textContent = score;
    }

    updateTurns(turns, comboMode = false) {
        if (!this.turnsEl || !this.turnLabel) return;

        if (comboMode && turns === 0) {
            // COMBO HIGH 모드
            this.turnLabel.textContent = 'COMBO';
            this.turnsEl.textContent = 'HIGH';
        } else {
            // 일반 TURN 모드
            this.turnLabel.textContent = 'TURN';
            this.turnsEl.textContent = turns;
        }
    }

    setTargetTextSize(size) {
        this.targetTextSize = size;
        if (this.targetHeader) {
            this.targetHeader.style.fontSize = `${size}px`;
        }
    }

    renderTargets(targets, removedCells = {}) {
        const targetList = document.getElementById('target-list');
        if (!targetList) return;

        // 헤더 폰트 크기 적용
        if (this.targetHeader) {
            this.targetHeader.style.fontSize = `${this.targetTextSize}px`;
        }

        targetList.innerHTML = '';

        for (let color in targets) {
            const targetCount = targets[color];
            const removedCount = removedCells[color] || 0;
            const remaining = targetCount - removedCount;

            // 남은 개수가 0이면 표시하지 않음
            if (remaining <= 0) continue;

            const item = document.createElement('div');
            item.className = 'target-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'target-color-box';
            colorBox.style.backgroundColor = color;
            colorBox.textContent = `${remaining}`;

            item.appendChild(colorBox);
            targetList.appendChild(item);
        }
    }

    updateGravityIndicator(direction) {
        if (!direction || !this.gravityArrow) return;

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

    loadSettings() {
        const showGrid = localStorage.getItem('showGrid');
        this.showGridCheckbox.checked = showGrid === 'true';
    }

    saveSettings() {
        localStorage.setItem('showGrid', this.showGridCheckbox.checked);
    }

    getShowGrid() {
        return this.showGridCheckbox.checked;
    }
}
