class Game {
    constructor() {
        this.board = new Board();
        this.gravity = new Gravity(this.board);
        this.renderer = new Renderer(document.getElementById('game-canvas'));
        this.ui = new UI();
        this.inputHandler = new InputHandler(
            document.getElementById('game-canvas'),
            (dir) => this.onSwipe(dir),
            () => this.togglePause()
        );

        this.state = 'waiting'; // waiting | animating | gameover | paused
        this.paused = false;
        this.score = 0;

        // 디버그 설정
        this.config = {
            blockCount: 1,
            bombChance: 5,
            bombRange: 2
        };

        // UI 이벤트 연결
        this.ui.onStartGame = () => this.startGame();
        this.ui.onApplyDebug = () => this.applyDebugConfig();

        // 설정 초기화
        this.ui.setDebugConfig(this.config);

        // 메인화면 표시
        this.ui.showMainMenu();
    }

    applyDebugConfig() {
        const newConfig = this.ui.getDebugConfig();
        Object.assign(this.config, newConfig);
        this.ui.hideDebug();
        alert('설정이 적용되었습니다.');
    }

    startGame() {
        // 메인화면 숨기고 게임 시작
        this.ui.hideMainMenu();

        // canvas가 보이는 상태에서 크기 재계산
        this.renderer.resize();

        this.init();
    }

    init() {
        // 보드 초기화
        this.board.clear();
        this.score = 0;
        this.state = 'waiting';
        this.paused = false;
        this.ui.updateScore(0);

        // 첫 블록 즉시 생성
        if (!this.spawnBlocks()) {
            this.gameOver();
            return;
        }

        this.render();
    }

    // 블록 즉시 생성
    spawnBlocks() {
        const count = this.config.blockCount;

        for (let i = 0; i < count; i++) {
            // 폭탄 확률 체크
            const isBomb = isBombBlock(this.config.bombChance);
            const shape = getRandomShape();

            // 최적 생성 위치 찾기
            const position = this.findBestSpawnPosition(shape);

            if (!position) {
                return false; // 게임 오버
            }

            // 주변 색상과 겹치지 않는 색 선택
            const color = isBomb ? null : this.getSafeColor(shape, position.y, position.x);

            // 블록 생성
            const block = new Block(color, shape, position.y, position.x, isBomb);
            this.board.addBlock(block);
        }

        return true;
    }

    // 주변과 겹치지 않는 색상 선택
    getSafeColor(shape, startY, startX) {
        const colors = Object.values(GAME_COLORS);
        const usedColors = new Set();

        // 블록이 차지할 모든 셀의 인접 셀 색상 수집
        for (let [dy, dx] of shape) {
            const y = startY + dy;
            const x = startX + dx;

            // 상하좌우 인접 셀 체크
            const neighbors = [
                [y - 1, x], [y + 1, x],
                [y, x - 1], [y, x + 1]
            ];

            for (let [ny, nx] of neighbors) {
                if (!isInBounds(ny, nx)) continue;
                const cell = this.board.grid[ny][nx];
                if (cell && !cell.isBomb) {
                    usedColors.add(cell.color);
                }
            }
        }

        // 사용되지 않은 색상 중 랜덤 선택
        const availableColors = colors.filter(c => !usedColors.has(c));

        if (availableColors.length > 0) {
            return availableColors[Math.floor(Math.random() * availableColors.length)];
        }

        // 모든 색이 사용 중이면 그냥 랜덤 (4색이므로 거의 없음)
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 최적 생성 위치 찾기 (빈 공간 중앙 선호, 기존 블록+보드 끝에서 멀게)
    findBestSpawnPosition(shape) {
        const candidates = [];

        // 보드 전체 스캔
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (!this.board.canPlace(shape, y, x)) continue;

                let score = 0;

                // 보드 중앙에 가까울수록 높은 점수
                const centerDist = Math.abs(y - 3.5) + Math.abs(x - 3.5);
                score += (7 - centerDist) * 10;

                // 기존 블록과 거리 계산 (멀수록 높은 점수)
                let minBlockDist = 99;
                for (let by = 0; by < 8; by++) {
                    for (let bx = 0; bx < 8; bx++) {
                        if (!this.board.isEmpty(by, bx)) {
                            const dist = Math.abs(by - y) + Math.abs(bx - x);
                            minBlockDist = Math.min(minBlockDist, dist);
                        }
                    }
                }
                score += minBlockDist * 5;

                // 가장자리 페널티
                if (this.board.isEdge(shape, y, x)) {
                    score -= 20;
                }

                candidates.push({ y, x, score });
            }
        }

        if (candidates.length === 0) return null;

        // 점수 높은 순 정렬
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0];
    }

    // 스와이프 입력 처리
    onSwipe(direction) {
        if (this.state !== 'waiting' || this.paused) return;

        this.state = 'animating';

        try {
            // 턴 처리
            const matchInfo = this.processTurn(direction);

            // 점수 계산
            this.addScore(matchInfo);

            // 다음 블록 생성
            if (!this.spawnBlocks()) {
                this.gameOver();
            }

            this.render();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            // state 복구
            if (this.state !== 'gameover') {
                this.state = 'waiting';
            }
        }
    }

    // 턴 처리 (중력 + 연쇄)
    processTurn(direction) {
        let totalMatches = [];
        let chain = 0;

        while (true) {
            // 중력 적용
            this.applyGravity(direction);

            // 매치 판정
            const matches = this.board.findMatches();
            if (matches.length === 0) break;

            // 매치 정보 저장
            for (let match of matches) {
                totalMatches.push({ ...match, chain });
            }

            // 매치 제거
            this.board.removeMatches(matches, this.config.bombRange);
            chain++;
        }

        // UI 업데이트
        this.ui.updateGravityIndicator(direction);

        return totalMatches;
    }

    // 중력 적용
    applyGravity(direction) {
        // 좌표 정수화
        for (let block of this.board.blocks) {
            block.shape = block.shape.map(([y, x]) => [Math.round(y), Math.round(x)]);
        }
        this.board.updateGrid();

        // 블록 분해 (모든 블록 → 1x1)
        this.gravity.splitBlocks();

        // 중력 적용
        this.gravity.apply(direction);

        // 최종 위치 확정
        this.board.updateGrid();
        this.render();
    }

    // 점수 추가 (매치 기반)
    addScore(matches) {
        if (matches.length === 0) return;

        let totalScore = 0;

        for (let match of matches) {
            const count = match.cells.length;
            // 3개 = 기본 점수
            let score = 100;
            // 4개부터 개당 보너스
            if (count >= 4) {
                score += (count - 3) * 50;
            }
            // 연쇄 보너스
            if (match.chain > 0) {
                score += match.chain * 100;
            }
            totalScore += score;
        }

        this.score += totalScore;
        this.ui.updateScore(this.score);
    }

    // 렌더링
    render() {
        this.renderer.renderBoard(this.board);
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
        this.ui.hideGameOver();
        this.init();
    }
}

// 게임 시작
window.addEventListener('load', () => {
    new Game();
});
