class Game {
    constructor() {
        this.board = new Board();
        this.gravity = new Gravity(this.board);
        this.renderer = new Renderer(
            document.getElementById('game-canvas'),
            document.getElementById('preview-canvas')
        );
        this.ui = new UI();
        this.inputHandler = new InputHandler(
            document.getElementById('game-canvas'),
            (dir) => this.onSwipe(dir),
            () => this.togglePause()
        );

        this.state = 'waiting'; // waiting | animating | gameover | paused
        this.paused = false;
        this.score = 0;
        this.previewBlocks = []; // 다음에 생성될 블록들
        this.currentPreview = []; // 현재 보드에 표시할 예고
        this.inputQueue = []; // 입력 큐

        this.init();
    }

    init() {
        // 첫 블록 2개 생성
        const firstBlocks = this.generateBlocks(2);
        for (let preview of firstBlocks) {
            const block = new Block(
                preview.type,
                preview.shape,
                preview.position.y,
                preview.position.x
            );
            this.board.addBlock(block);
        }

        // 다음 예고 생성
        this.previewBlocks = this.generateBlocks(2);
        this.updatePreviewDisplay();

        if (!this.previewBlocks) {
            this.gameOver();
            return;
        }

        this.render();
    }

    // 블록 생성
    generateBlocks(count) {
        const newBlocks = [];
        const occupiedCells = new Set(); // 예약된 칸

        for (let i = 0; i < count; i++) {
            const type = getRandomType();
            const shape = getRandomShape();
            const position = this.findPreviewPosition(shape, occupiedCells);

            if (!position) {
                return null; // 게임 오버
            }

            // 선택된 위치를 occupiedCells에 추가
            for (let [dy, dx] of shape) {
                const y = position.y + dy;
                const x = position.x + dx;
                occupiedCells.add(`${y},${x}`);
            }

            newBlocks.push({ type, shape, position });
        }

        return newBlocks;
    }

    // 예고 위치 찾기
    findPreviewPosition(shape, occupiedCells = new Set()) {
        const candidates = [];

        // 보드 전체 스캔
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (this.canPlacePreview(shape, y, x, occupiedCells)) {
                    let score = 100;

                    // 기존 블록 인접 시 -30
                    if (this.board.hasAdjacentBlock(shape, y, x)) {
                        score -= 30;
                    }

                    // 가장자리 시 -20
                    if (this.board.isEdge(shape, y, x)) {
                        score -= 20;
                    }

                    candidates.push({ y, x, score });
                }
            }
        }

        if (candidates.length === 0) {
            // 가장 빈 공간 찾기
            return this.findMostEmptyArea(shape);
        }

        // 점수 높은 순 정렬
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0];
    }

    // 예고 배치 가능 여부 (occupiedCells 포함)
    canPlacePreview(shape, startY, startX, occupiedCells) {
        for (let [dy, dx] of shape) {
            const y = startY + dy;
            const x = startX + dx;

            if (!isInBounds(y, x)) return false;
            if (!this.board.isEmpty(y, x)) return false;
            if (occupiedCells.has(`${y},${x}`)) return false;
        }
        return true;
    }

    // 가장 빈 공간 찾기
    findMostEmptyArea(shape) {
        let maxEmpty = -1;
        let bestPos = null;

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                // 3x3 영역의 빈 칸 수 계산
                let emptyCount = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (isInBounds(ny, nx) && this.board.isEmpty(ny, nx)) {
                            emptyCount++;
                        }
                    }
                }

                if (emptyCount > maxEmpty) {
                    maxEmpty = emptyCount;
                    bestPos = { y, x };
                }
            }
        }

        return bestPos;
    }

    // 스와이프 입력 처리
    async onSwipe(direction) {
        console.log('[onSwipe] direction:', direction, 'state:', this.state, 'paused:', this.paused);

        // 애니메이션 중이면 마지막 입력만 저장
        if (this.state === 'animating') {
            this.inputQueue = [direction];  // 덮어쓰기
            console.log('[onSwipe] queued input');
            return;
        }

        if (this.state !== 'waiting' || this.paused) {
            console.log('[onSwipe] blocked - state:', this.state, 'paused:', this.paused);
            return;
        }

        this.state = 'animating';
        console.log('[onSwipe] start processing');

        try {
            // 턴 처리 (애니메이션 포함)
            const chain = await this.processTurn(direction);
            console.log('[onSwipe] processTurn done, chain:', chain);

            // 점수 계산
            this.addScore(chain);

            // 다음 턴 준비
            this.spawnPreview();
            this.previewBlocks = this.generateBlocks(2);

            if (!this.previewBlocks) {
                this.gameOver();
            } else {
                this.updatePreviewDisplay();
            }

            this.render();
            console.log('[onSwipe] render done');
        } catch (error) {
            console.error('[onSwipe] Animation error:', error);
        } finally {
            // 에러 발생 여부와 관계없이 state 복구
            if (this.state !== 'gameover') {
                this.state = 'waiting';
                console.log('[onSwipe] state restored to waiting');
            }

            // 큐에 대기 중인 입력 처리
            if (this.inputQueue.length > 0) {
                const nextDirection = this.inputQueue.shift();
                console.log('[onSwipe] processing queued input:', nextDirection);
                this.onSwipe(nextDirection);
            }
        }
    }

    // 턴 처리 (중력 + 연쇄) - 애니메이션 포함
    async processTurn(direction) {
        let chain = 0;

        while (true) {
            // 중력 적용
            await this.applyGravityWithAnimation(direction);

            // 라인 판정
            const lines = this.board.findCompletedLines();
            if (lines.length === 0) break;

            // 라인 제거 애니메이션
            await this.removeLinesWithAnimation(lines);
            chain++;
        }

        // UI 업데이트
        this.ui.updateGravityIndicator(direction);

        return chain;
    }

    // 중력을 애니메이션과 함께 적용
    async applyGravityWithAnimation(direction) {
        // 1. 일반 블록 분해 (ID 변경되므로 먼저 실행)
        this.gravity.splitNormalBlocks();

        // 2. 시작 위치 저장
        const startPositions = this.saveBlockPositions();

        // 3. 최종 위치 즉시 계산
        this.gravity.apply(direction);
        const endPositions = this.saveBlockPositions();

        // 4. 0.2초 동안 보간 애니메이션
        const duration = 200;
        const startTime = Date.now();

        while (Date.now() - startTime < duration) {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.interpolatePositions(startPositions, endPositions, progress);
            this.board.updateGrid();
            this.render();

            if (progress < 1) {
                await this.nextFrame();
            }
        }

        // 4. 최종 위치 확정
        this.restoreBlockPositions(endPositions);
        this.board.updateGrid();
    }

    // 블록 위치 저장
    saveBlockPositions() {
        return this.board.blocks.map(block => ({
            id: block.id,
            type: block.type,
            shape: block.shape.map(([y, x]) => [y, x])
        }));
    }

    // 블록 위치 복원
    restoreBlockPositions(positions) {
        for (let pos of positions) {
            const block = this.board.blocks.find(b => b.id === pos.id);
            if (block) {
                block.shape = pos.shape.map(([y, x]) => [y, x]);
            }
        }
    }

    // 위치 보간
    interpolatePositions(startPos, endPos, progress) {
        for (let i = 0; i < this.board.blocks.length; i++) {
            const block = this.board.blocks[i];
            const start = startPos.find(p => p.id === block.id);
            const end = endPos.find(p => p.id === block.id);

            if (start && end) {
                block.shape = start.shape.map((startCell, idx) => {
                    const [sy, sx] = startCell;
                    const [ey, ex] = end.shape[idx];
                    const y = sy + (ey - sy) * progress;
                    const x = sx + (ex - sx) * progress;
                    return [y, x];
                });
            }
        }
    }

    // 라인 제거 애니메이션
    async removeLinesWithAnimation(lines) {
        console.log('[removeLines] lines:', lines.length);
        if (lines.length === 0) return;

        // 제거될 셀 정보 가져오기
        const cellsToRemove = this.board.getLineCells(lines);
        console.log('[removeLines] cells to remove:', cellsToRemove.length, cellsToRemove);

        // 0.2초 동안 축소 애니메이션
        const duration = 200;
        const startTime = Date.now();

        while (Date.now() - startTime < duration) {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const scale = 1.0 - progress; // 1.0 -> 0.0

            // 보드 먼저 그리고, 제거될 셀은 스케일로 덮어그리기
            this.renderer.renderBoard(this.board, this.currentPreview);
            this.renderer.drawScaledCells(cellsToRemove, scale);

            if (progress < 1) {
                await this.nextFrame();
            }
        }

        console.log('[removeLines] animation done, removing');
        // 실제 제거
        this.board.removeLines(lines);
        console.log('[removeLines] removed');
    }

    // 다음 프레임 대기
    nextFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    // 딜레이 헬퍼
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 예고 블록 실제 생성
    spawnPreview() {
        // 1. 먼저 모든 예고가 생성 가능한지 체크
        for (let preview of this.currentPreview) {
            if (!this.board.canPlace(preview.shape, preview.position.y, preview.position.x)) {
                this.gameOver();
                return;
            }
        }

        // 2. 모두 가능하면 생성
        for (let preview of this.currentPreview) {
            const block = new Block(
                preview.type,
                preview.shape,
                preview.position.y,
                preview.position.x
            );
            this.board.addBlock(block);
        }
    }

    // 예고 표시 업데이트
    updatePreviewDisplay() {
        this.currentPreview = this.previewBlocks;
        this.renderer.renderPreviewCanvas(this.previewBlocks);
    }

    // 점수 추가
    addScore(chain) {
        if (chain > 0) {
            const baseScore = 100;
            const chainBonus = chain > 1 ? (chain - 1) * 200 : 0;
            this.score += baseScore + chainBonus;
            this.ui.updateScore(this.score);
        }
    }

    // 렌더링
    render() {
        this.renderer.renderBoard(this.board, this.currentPreview);
    }

    // 게임 오버
    gameOver() {
        this.state = 'gameover';
        this.ui.showGameOver(this.score, () => this.restart());
    }

    // 일시정지 토글
    togglePause() {
        if (this.state === 'gameover') return;

        this.paused = !this.paused;
        this.ui.showPause(this.paused);
    }

    // 재시작
    restart() {
        this.board.clear();
        this.score = 0;
        this.state = 'waiting';
        this.ui.hideGameOver();
        this.ui.updateScore(0);
        this.init();
    }
}

// 게임 시작
window.addEventListener('load', () => {
    new Game();
});
