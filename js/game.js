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
            bombRange: 2,
            boardSize: 8
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
        const oldBoardSize = this.config.boardSize;
        Object.assign(this.config, newConfig);

        // 보드 크기 변경 시 전역 변수 업데이트 및 재시작
        if (this.config.boardSize !== oldBoardSize) {
            BOARD_SIZE = this.config.boardSize;
            this.renderer.resize();
            if (this.state !== 'waiting') {
                this.init();
            }
        }

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
            const shape = getRandomShape();

            // 최적 생성 위치 찾기
            const position = this.findBestSpawnPosition(shape);

            if (!position) {
                return false; // 게임 오버
            }

            // 각 셀에 색상 할당 (셀별 폭탄 확률, 같은 색 최대 2개)
            const colors = this.assignBlockColors(shape.length, position.y, position.x, shape);

            // 블록 생성
            const block = new Block(colors, shape, position.y, position.x);
            this.board.addBlock(block);
        }

        return true;
    }

    // 블록 각 셀에 색상 할당 (셀별 폭탄 확률, 같은 색 최대 2개)
    assignBlockColors(cellCount, startY, startX, shape) {
        const colors = [];
        const colorCount = {}; // 각 색상별 사용 횟수
        const availableColors = Object.values(GAME_COLORS);

        // 주변 셀 색상 수집 (회피용)
        const usedColors = new Set();
        for (let [dy, dx] of shape) {
            const y = startY + dy;
            const x = startX + dx;
            const neighbors = [
                [y - 1, x], [y + 1, x],
                [y, x - 1], [y, x + 1]
            ];
            for (let [ny, nx] of neighbors) {
                if (!isInBounds(ny, nx)) continue;
                const cell = this.board.grid[ny][nx];
                if (cell && cell.color !== BOMB_COLOR) {
                    usedColors.add(cell.color);
                }
            }
        }

        // 각 셀에 색상 할당
        for (let i = 0; i < cellCount; i++) {
            // 폭탄 확률 체크
            if (Math.random() * 100 < this.config.bombChance) {
                colors.push(BOMB_COLOR);
                continue;
            }

            // 2개 미만인 색상들만 선택 가능
            const validColors = availableColors.filter(c => {
                const count = colorCount[c] || 0;
                return count < 2 && !usedColors.has(c);
            });

            // 유효한 색상이 없으면 주변 색상 무시하고 재시도
            let selectedColor;
            if (validColors.length > 0) {
                selectedColor = validColors[Math.floor(Math.random() * validColors.length)];
            } else {
                const fallbackColors = availableColors.filter(c => (colorCount[c] || 0) < 2);
                selectedColor = fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
            }

            colors.push(selectedColor);
            colorCount[selectedColor] = (colorCount[selectedColor] || 0) + 1;
        }

        return colors;
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
                if (cell && cell.color !== BOMB_COLOR) {
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

    // 빈 영역 그룹핑
    findEmptyRegions() {
        const visited = Array(this.board.size).fill(null).map(() => Array(this.board.size).fill(false));
        const regions = [];

        for (let y = 0; y < this.board.size; y++) {
            for (let x = 0; x < this.board.size; x++) {
                if (visited[y][x] || !this.board.isEmpty(y, x)) continue;

                const cells = [];
                const queue = [[y, x]];
                visited[y][x] = true;

                // BFS로 연결된 빈 공간 찾기
                while (queue.length > 0) {
                    const [cy, cx] = queue.shift();
                    cells.push([cy, cx]);

                    const neighbors = [
                        [cy - 1, cx], [cy + 1, cx],
                        [cy, cx - 1], [cy, cx + 1]
                    ];

                    for (let [ny, nx] of neighbors) {
                        if (!isInBounds(ny, nx) || visited[ny][nx]) continue;
                        if (!this.board.isEmpty(ny, nx)) continue;

                        visited[ny][nx] = true;
                        queue.push([ny, nx]);
                    }
                }

                regions.push({ cells, center: this.calculateRegionCenter(cells) });
            }
        }

        return regions;
    }

    // 영역 중심 계산
    calculateRegionCenter(cells) {
        let sumY = 0, sumX = 0;
        for (let [y, x] of cells) {
            sumY += y;
            sumX += x;
        }
        return {
            y: Math.round(sumY / cells.length),
            x: Math.round(sumX / cells.length)
        };
    }

    // 최적 생성 위치 찾기 (가장 큰 빈 영역 중심 우선, 격리 필수)
    findBestSpawnPosition(shape) {
        const regions = this.findEmptyRegions();

        // 크기 순 정렬
        regions.sort((a, b) => b.cells.length - a.cells.length);

        // 가장 큰 영역부터 시도
        for (let region of regions) {
            const candidates = [];

            // 격리된 위치 찾기
            for (let y = 0; y < this.board.size; y++) {
                for (let x = 0; x < this.board.size; x++) {
                    if (!this.board.canPlaceIsolated(shape, y, x)) continue;

                    // 영역 중심과의 거리
                    const dist = Math.abs(y - region.center.y) + Math.abs(x - region.center.x);
                    candidates.push({ y, x, dist });
                }
            }

            if (candidates.length > 0) {
                // 중심에 가장 가까운 위치 선택
                candidates.sort((a, b) => a.dist - b.dist);
                return candidates[0];
            }
        }

        return null;
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
