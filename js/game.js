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
            (dir) => this.onSwipe(dir)
        );

        this.state = 'waiting'; // waiting | animating | gameover
        this.score = 0;
        this.previewBlocks = []; // 다음에 생성될 블록들
        this.currentPreview = []; // 현재 보드에 표시할 예고

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

        for (let i = 0; i < count; i++) {
            const type = getRandomType();
            const shape = getRandomShape();
            const position = this.findPreviewPosition(shape);

            if (!position) {
                return null; // 게임 오버
            }

            newBlocks.push({ type, shape, position });
        }

        return newBlocks;
    }

    // 예고 위치 찾기
    findPreviewPosition(shape) {
        const candidates = [];

        // 보드 전체 스캔
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (this.board.canPlace(shape, y, x)) {
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
    onSwipe(direction) {
        if (this.state !== 'waiting') return;

        this.state = 'animating';

        // 턴 처리
        const chain = this.processTurn(direction);

        // 점수 계산
        this.addScore(chain);

        // 다음 턴 준비
        this.spawnPreview();
        this.previewBlocks = this.generateBlocks(2);

        if (!this.previewBlocks) {
            this.gameOver();
        } else {
            this.updatePreviewDisplay();
            this.state = 'waiting';
        }

        this.render();
    }

    // 턴 처리 (중력 + 연쇄)
    processTurn(direction) {
        let chain = 0;

        while (true) {
            // 중력 적용
            this.gravity.apply(direction);

            // 라인 판정
            const lines = this.board.findCompletedLines();
            if (lines.length === 0) break;

            // 라인 제거
            this.board.removeLines(lines);
            chain++;
        }

        // UI 업데이트
        this.ui.updateGravityIndicator(direction);

        return chain;
    }

    // 예고 블록 실제 생성
    spawnPreview() {
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
