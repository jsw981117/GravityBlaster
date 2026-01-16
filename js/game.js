class Game {
    constructor() {
        this.board = new Board();
        this.gravity = new Gravity(this.board);
        this.renderer = new Renderer(
            document.getElementById('game-canvas'),
            document.getElementById('preview-canvas')
        );
        this.animator = new Animator(this.renderer);
        this.ui = new UI();
        this.inputHandler = new InputHandler(
            document.getElementById('game-container'),
            (dir) => this.onSwipe(dir),
            () => this.togglePause()
        );

        this.state = 'waiting'; // waiting | animating | gameover | paused
        this.paused = false;
        this.score = 0;

        // 게임 오버 조건 2 추적 변수
        this.thresholdExceeded = false;
        this.turnsAfterThreshold = 0;

        // 타겟 시스템
        this.targets = {}; // {color: count}
        this.currentTargetCount = 2; // 현재 단계의 타겟 총 개수
        this.removedCells = {}; // {color: count} - 제거된 셀 추적

        // 턴 시스템
        this.remainingTurns = 10;

        // 콤보 시스템
        this.currentCombo = 0;

        // 미리보기 블록 (shape, colors만 저장, 위치는 나중)
        this.previewBlocks = [];

        // 디버그 설정
        this.config = {
            blockCount: 1,
            specialCellChance: 5,      // 특수 셀 전체 확률
            boomRange: 1,               // 봄 셀 폭발 범위
            boomCellWeight: 50,         // 봄 셀 가중치
            timeCellWeight: 50,         // 타임 셀 가중치
            timeCellTurnBonus: 5,       // 타임 셀 턴 증가량
            boardSize: 6,
            removeAnimDuration: 150,
            moveAnimDuration: 200,
            spawnAnimDuration: 150,
            scoreAnimDuration: 300,
            scorePopupDistance: 30,
            minCells: 2,
            maxCells: 4,
            gameOverMode: 3,
            cellThreshold: 70,
            turnsAfterThreshold: 5,
            turnRecovery: 5,
            targetTextSize: 16,
            targetCompleteTextSize: 1.0,  // 타겟 완료 텍스트 크기 (cellSize 배수)
            targetCompleteDuration: 1200, // 타겟 완료 표시 시간 (ms)
            boardBgAlpha: 0.3,
            previewBgAlpha: 0.3,
            explosionStyle: 'both',     // 폭발 효과 스타일
            explosionDuration: 200,     // 폭발 지속시간
            explosionRadius: 1.5,       // 폭발 최대 반경
            explosionEmojiScale: 2.0,   // 이모지 최대 배율
            specialCellIconScale: 0.7,  // 특수 셀 아이콘 크기
            targetHelper: true,         // 타겟 헬퍼 모드
            // 하위 호환성
            bombChance: 5,
            bombRange: 1
        };

        // UI 이벤트 연결
        this.ui.onStartGame = () => this.startGame();
        this.ui.onApplyDebug = () => this.applyDebugConfig();
        this.ui.onResetDebug = () => this.resetDebugConfig();
        this.ui.onGridToggle = () => {
            this.renderer.setShowGrid(this.ui.getShowGrid());
            this.render();
        };

        // 설정 초기화
        BOARD_SIZE = this.config.boardSize; // 전역 변수 업데이트
        this.ui.setDebugConfig(this.config);
        this.renderer.setShowGrid(this.ui.getShowGrid());
        this.renderer.setBgAlpha(this.config.boardBgAlpha, this.config.previewBgAlpha);
        this.renderer.setSpecialCellIconScale(this.config.specialCellIconScale);
        this.ui.setTargetTextSize(this.config.targetTextSize);

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

        // 애니메이션 설정 적용
        this.animator.setConfig({
            removeAnimDuration: this.config.removeAnimDuration,
            moveAnimDuration: this.config.moveAnimDuration,
            spawnAnimDuration: this.config.spawnAnimDuration,
            scoreAnimDuration: this.config.scoreAnimDuration,
            scorePopupDistance: this.config.scorePopupDistance
        });

        // 배경 알파값 적용
        this.renderer.setBgAlpha(this.config.boardBgAlpha, this.config.previewBgAlpha);

        // 특수 셀 아이콘 크기 적용
        this.renderer.setSpecialCellIconScale(this.config.specialCellIconScale);

        // 타겟 텍스트 크기 적용
        this.ui.setTargetTextSize(this.config.targetTextSize);

        this.render();

        this.ui.hideDebug();
        alert('설정이 적용되었습니다.');
    }

    resetDebugConfig() {
        // 기본값으로 재설정
        Object.assign(this.config, {
            blockCount: 1,
            specialCellChance: 5,
            boomRange: 1,
            boomCellWeight: 50,
            timeCellWeight: 50,
            timeCellTurnBonus: 5,
            boardSize: 6,
            removeAnimDuration: 150,
            moveAnimDuration: 200,
            spawnAnimDuration: 150,
            scoreAnimDuration: 300,
            scorePopupDistance: 30,
            minCells: 2,
            maxCells: 4,
            gameOverMode: 3,
            cellThreshold: 70,
            turnsAfterThreshold: 5,
            turnRecovery: 5,
            targetTextSize: 16,
            targetCompleteTextSize: 1.0,
            targetCompleteDuration: 1200,
            boardBgAlpha: 0.3,
            previewBgAlpha: 0.3,
            explosionStyle: 'both',
            explosionDuration: 200,
            explosionRadius: 1.5,
            explosionEmojiScale: 2.0,
            specialCellIconScale: 0.7,
            targetHelper: true
        });

        this.ui.setDebugConfig(this.config);
        alert('기본값으로 되돌렸습니다.');
    }

    startGame() {
        // 메인화면 숨기고 게임 시작
        this.ui.hideMainMenu();

        // canvas가 보이는 상태에서 크기 재계산
        this.renderer.resize();

        // 렌더링 루프 시작 (게임 종료까지 계속 실행)
        this.startAnimationLoop();

        this.init();
    }

    async init() {
        // 보드 초기화
        this.board.clear();
        this.score = 0;
        this.state = 'animating';
        this.paused = false;
        this.ui.updateScore(0);

        // 게임 오버 조건 2 변수 초기화
        this.thresholdExceeded = false;
        this.turnsAfterThreshold = 0;

        // 타겟 시스템 초기화
        this.currentTargetCount = 2;
        this.generateTargets();
        this.removedCells = {};

        // 턴 시스템 초기화
        this.remainingTurns = 10;
        this.ui.updateTurns(this.remainingTurns);

        // 콤보 시스템 초기화
        this.currentCombo = 0;

        // 첫 미리보기 생성
        this.previewBlocks = this.generateNextBlocks();

        // 첫 블록 생성
        const spawnData = this.spawnBlocksWithData();
        if (!spawnData) {
            this.gameOver();
            return;
        }

        // 생성 애니메이션
        await this.animator.playSpawn(spawnData);

        this.state = 'waiting';
        this.render();
    }

    // 타겟 생성
    generateTargets() {
        this.targets = {};
        const colors = Object.values(GAME_COLORS);
        if (colors.length === 0) return;

        let remaining = Math.max(1, this.currentTargetCount);

        // 최소 1개씩 색상 할당 (최대 4색)
        const numColors = Math.min(Math.max(1, colors.length), remaining);
        const selectedColors = [];
        for (let i = 0; i < numColors; i++) {
            selectedColors.push(colors[i]);
            this.targets[colors[i]] = 1;
            remaining--;
        }

        // 나머지 랜덤 배분
        while (remaining > 0 && selectedColors.length > 0) {
            const color = selectedColors[Math.floor(Math.random() * selectedColors.length)];
            this.targets[color]++;
            remaining--;
        }

        this.ui.renderTargets(this.targets);
    }

    // 타겟 완료 체크
    checkTargetsCompleted() {
        for (let color in this.targets) {
            if ((this.removedCells[color] || 0) < this.targets[color]) {
                return false;
            }
        }
        return true;
    }

    // 타겟 진행 상황 업데이트
    updateTargetProgress() {
        this.ui.renderTargets(this.targets, this.removedCells);
    }

    // 특수 셀 타입 선택 (가중치 기반)
    getSpecialCellType() {
        const total = this.config.boomCellWeight + this.config.timeCellWeight;
        const rand = Math.random() * total;

        if (rand < this.config.boomCellWeight) {
            return BOOM_COLOR;
        } else {
            return TIME_COLOR;
        }
    }

    // 블록 즉시 생성
    spawnBlocks() {
        const count = this.config.blockCount;

        for (let i = 0; i < count; i++) {
            const shape = getRandomShape(this.config.minCells, this.config.maxCells);

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

    // 블록 생성 + 애니메이션 데이터 반환 (미리보기 소비)
    spawnBlocksWithData() {
        const spawnData = [];

        for (let i = 0; i < this.previewBlocks.length; i++) {
            const preview = this.previewBlocks[i];
            const shape = preview.shape;
            const colors = preview.colors;

            // 최적 생성 위치 찾기
            const position = this.findBestSpawnPosition(shape);

            if (!position) {
                return null; // 게임 오버
            }

            // 블록 생성
            const block = new Block(colors, shape, position.y, position.x);
            this.board.addBlock(block);

            // 각 셀의 위치와 색상 정보 수집
            for (let j = 0; j < block.shape.length; j++) {
                const [y, x] = block.shape[j];
                spawnData.push({
                    y: y,
                    x: x,
                    color: block.getColorAt(j)
                });
            }
        }

        // 미리보기 소비 후 새로 생성
        this.previewBlocks = this.generateNextBlocks();

        return spawnData;
    }

    // 다음 블록 미리보기 생성 (shape, colors만)
    generateNextBlocks() {
        const count = this.config.blockCount;
        const blocks = [];

        for (let i = 0; i < count; i++) {
            const shape = getRandomShape(this.config.minCells, this.config.maxCells);
            const colors = [];
            const cellCount = shape.length;
            const colorCount = {}; // 색상별 사용 횟수

            // 각 셀에 색상 할당 (블록당 특수 셀 1개까지, 같은 색 최대 2개)
            let specialCellCount = 0;
            for (let j = 0; j < cellCount; j++) {
                if (specialCellCount === 0 && Math.random() * 100 < this.config.specialCellChance) {
                    colors.push(this.getSpecialCellType());
                    specialCellCount++;
                } else {
                    const availableColors = Object.values(GAME_COLORS);
                    // 2개 미만인 색상만 선택
                    const validColors = availableColors.filter(c => (colorCount[c] || 0) < 2);

                    if (validColors.length > 0) {
                        const selectedColor = validColors[Math.floor(Math.random() * validColors.length)];
                        colors.push(selectedColor);
                        colorCount[selectedColor] = (colorCount[selectedColor] || 0) + 1;
                    } else {
                        // 모든 색이 2개씩 사용되었으면 랜덤 선택
                        const selectedColor = availableColors[Math.floor(Math.random() * availableColors.length)];
                        colors.push(selectedColor);
                        colorCount[selectedColor] = (colorCount[selectedColor] || 0) + 1;
                    }
                }
            }

            // 타겟 헬퍼: 미리보기에 타겟 색상 최소 1개 포함
            if (this.config.targetHelper && this.targets && Object.keys(this.targets).length > 0) {
                const targetColors = Object.keys(this.targets);
                const hasTargetColor = colors.some(color =>
                    targetColors.includes(color) && color !== BOOM_COLOR && color !== TIME_COLOR
                );

                if (!hasTargetColor) {
                    // 특수 셀이 아닌 인덱스 찾기
                    const normalIndices = [];
                    for (let j = 0; j < colors.length; j++) {
                        if (colors[j] !== BOOM_COLOR && colors[j] !== TIME_COLOR) {
                            normalIndices.push(j);
                        }
                    }

                    // 특수 셀이 아닌 셀이 있으면 하나를 타겟 색상으로 교체
                    if (normalIndices.length > 0) {
                        const randomIdx = normalIndices[Math.floor(Math.random() * normalIndices.length)];
                        const randomTargetColor = targetColors[Math.floor(Math.random() * targetColors.length)];
                        colors[randomIdx] = randomTargetColor;
                    }
                }
            }

            blocks.push({ shape, colors });
        }

        return blocks;
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
                if (cell && cell.color !== BOOM_COLOR && cell.color !== TIME_COLOR) {
                    usedColors.add(cell.color);
                }
            }
        }

        // 각 셀에 색상 할당
        let specialCellCount = 0;
        for (let i = 0; i < cellCount; i++) {
            // 특수 셀 확률 체크 (블록당 1개까지만)
            if (specialCellCount === 0 && Math.random() * 100 < this.config.specialCellChance) {
                colors.push(this.getSpecialCellType());
                specialCellCount++;
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
                if (cell && cell.color !== BOOM_COLOR && cell.color !== TIME_COLOR) {
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

    // 최적 생성 위치 찾기 (가장 큰 빈 영역 중심 우선, 격리 우선)
    findBestSpawnPosition(shape) {
        const regions = this.findEmptyRegions();

        // 크기 순 정렬
        regions.sort((a, b) => b.cells.length - a.cells.length);

        // 1단계: 격리된 위치 우선 탐색
        for (let region of regions) {
            const candidates = [];

            for (let y = 0; y < this.board.size; y++) {
                for (let x = 0; x < this.board.size; x++) {
                    if (!this.board.canPlaceIsolated(shape, y, x)) continue;

                    const dist = Math.abs(y - region.center.y) + Math.abs(x - region.center.x);
                    candidates.push({ y, x, dist });
                }
            }

            if (candidates.length > 0) {
                candidates.sort((a, b) => a.dist - b.dist);
                return candidates[0];
            }
        }

        // 2단계: 격리 불가 시 일반 배치 허용
        for (let region of regions) {
            const candidates = [];

            for (let y = 0; y < this.board.size; y++) {
                for (let x = 0; x < this.board.size; x++) {
                    if (!this.board.canPlace(shape, y, x)) continue;

                    const dist = Math.abs(y - region.center.y) + Math.abs(x - region.center.x);
                    candidates.push({ y, x, dist });
                }
            }

            if (candidates.length > 0) {
                candidates.sort((a, b) => a.dist - b.dist);
                return candidates[0];
            }
        }

        return null;
    }

    // 스와이프 입력 처리
    async onSwipe(direction) {
        if (this.state !== 'waiting' || this.paused) return;

        this.state = 'animating';

        try {
            // 턴 처리 (비동기)
            const matchInfo = await this.processTurn(direction);

            // 점수 계산
            this.addScore(matchInfo);

            // 콤보 종료 체크 (매치 없을 때)
            const hadMatches = matchInfo.length > 0;
            if (!hadMatches) {
                // 콤보 종료
                const wasInCombo = this.currentCombo > 0;
                this.currentCombo = 0;

                // 콤보 종료 시 턴 0이면 게임 오버
                if (wasInCombo && this.remainingTurns === 0) {
                    this.gameOver();
                    return;
                }
            }

            // 다음 블록 생성 + 애니메이션
            const spawnData = this.spawnBlocksWithData();
            if (!spawnData) {
                // 조건 1인 경우만 게임 오버
                if (this.config.gameOverMode === 1) {
                    this.gameOver();
                    return;
                }
                // 조건 2,3인 경우 생성 실패해도 계속 진행
            }

            if (spawnData) {
                await this.animator.playSpawn(spawnData);
            }

            // 타겟 완료 체크 (조건 3, 턴 감소 전)
            if (this.config.gameOverMode === 3) {
                if (this.checkTargetsCompleted()) {
                    // TARGET COMPLETE 애니메이션 (병렬 실행)
                    this.animator.playTargetComplete(this.config.targetCompleteDuration);

                    // 턴 회복 (최대 20), 타겟 개수 +1, 새 타겟 생성
                    this.remainingTurns = Math.min(20, this.remainingTurns + this.config.turnRecovery);
                    this.currentTargetCount = Math.min(10, this.currentTargetCount + 1);
                    this.generateTargets();
                    this.removedCells = {};
                    this.ui.updateTurns(this.remainingTurns, this.currentCombo > 0);
                }
            }

            // 턴 감소 (콤보 중일 때는 0 미만으로 가지 않음)
            this.remainingTurns = Math.max(0, this.remainingTurns - 1);
            this.ui.updateTurns(this.remainingTurns, this.currentCombo > 0);

            // 게임 오버 조건 체크 (조건 2: 임계값+N턴)
            if (this.config.gameOverMode === 2) {
                const cellCount = this.board.getCellCount();
                const totalCells = this.board.size * this.board.size;
                const percentage = (cellCount / totalCells) * 100;

                if (percentage >= this.config.cellThreshold) {
                    if (!this.thresholdExceeded) {
                        this.thresholdExceeded = true;
                        this.turnsAfterThreshold = 0;
                    }
                }

                if (this.thresholdExceeded) {
                    this.turnsAfterThreshold++;
                    if (this.turnsAfterThreshold >= this.config.turnsAfterThreshold) {
                        this.gameOver();
                        return;
                    }
                }
            }

            // 게임 오버 조건 체크 (조건 3: 타겟 기반)
            if (this.config.gameOverMode === 3) {
                if (this.remainingTurns <= 0 && this.currentCombo === 0) {
                    // 턴 0 + 콤보 아님 = 게임 오버
                    this.gameOver();
                    return;
                }
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
    async processTurn(direction) {
        let totalMatches = [];

        while (true) {
            // 중력 적용 + 이동 애니메이션
            const moveData = this.applyGravity(direction);
            if (moveData.length > 0) {
                await this.animator.playMove(moveData);
            }

            // 매치 판정
            const matches = this.board.findMatches();
            if (matches.length === 0) break;

            // 콤보 증가 (매치 1개당 1콤보)
            this.currentCombo += matches.length;

            // 매치 정보 저장
            for (let match of matches) {
                totalMatches.push(match);
            }

            // 제거 애니메이션
            const removeCells = this.board.getMatchCells(matches, this.config.bombRange);
            await this.animator.playRemove(removeCells);

            // 봄 셀 폭발 애니메이션
            const boomCells = removeCells.filter(cell => cell.color === BOOM_COLOR);
            if (boomCells.length > 0) {
                this.animator.playExplosion(boomCells);
            }

            // 각 매치별로 점수 팝업 애니메이션 (병렬 실행)
            for (let match of matches) {
                const matchCells = match.cells;
                const centerY = matchCells.reduce((sum, c) => sum + c[0], 0) / matchCells.length;
                const centerX = matchCells.reduce((sum, c) => sum + c[1], 0) / matchCells.length;
                const score = this.calculateScore(matchCells.length);
                this.animator.playScorePopup(centerX, centerY, score, this.currentCombo);
            }

            // 제거된 셀 색상 추적 (타겟 시스템용)
            if (this.config.gameOverMode === 3) {
                for (let cell of removeCells) {
                    // 특수 셀은 타겟 카운트에서 제외
                    if (cell.color !== BOOM_COLOR && cell.color !== TIME_COLOR) {
                        this.removedCells[cell.color] = (this.removedCells[cell.color] || 0) + 1;
                    }
                }
            }

            // 타임 셀 효과: 턴 증가 (최대 20)
            const timeCells = removeCells.filter(cell => cell.color === TIME_COLOR);
            if (timeCells.length > 0) {
                const turnBonus = timeCells.length * this.config.timeCellTurnBonus;
                this.remainingTurns = Math.min(20, this.remainingTurns + turnBonus);
                this.ui.updateTurns(this.remainingTurns, this.currentCombo > 0);

                // 턴 증가 팝업 애니메이션
                const centerY = timeCells.reduce((sum, c) => sum + c.y, 0) / timeCells.length;
                const centerX = timeCells.reduce((sum, c) => sum + c.x, 0) / timeCells.length;
                this.animator.playTurnPopup(centerX, centerY, turnBonus);
            }

            // 매치 제거
            this.board.removeMatches(matches, this.config.bombRange);
        }

        // UI 업데이트
        this.ui.updateGravityIndicator(direction);

        // 타겟 진행 상황 업데이트
        if (this.config.gameOverMode === 3) {
            this.updateTargetProgress();
        }

        return totalMatches;
    }

    // 중력 적용 (이동 데이터 반환)
    applyGravity(direction) {
        // 좌표 정수화
        for (let block of this.board.blocks) {
            block.shape = block.shape.map(([y, x]) => [Math.round(y), Math.round(x)]);
        }
        this.board.updateGrid();

        // 블록 분해 (모든 블록 → 1x1)
        this.gravity.splitBlocks();

        // 중력 적용 + 이동 데이터 반환
        const moveData = this.gravity.apply(direction);

        // 최종 위치 확정
        this.board.updateGrid();

        return moveData;
    }

    // 점수 계산 (셀 개수만)
    calculateScore(cellCount) {
        let score = 100; // 기본 3셀
        if (cellCount > 3) {
            score += (cellCount - 3) * 50;
        }
        return score;
    }

    // 점수 추가 (매치 기반)
    addScore(matches) {
        if (matches.length === 0) return;

        let totalScore = 0;

        for (let match of matches) {
            const count = match.cells.length;
            // 3개 = 기본 점수, 4개부터 개당 +50
            const score = this.calculateScore(count);
            totalScore += score;
        }

        this.score += totalScore;
        this.ui.updateScore(this.score);
    }

    // 렌더링
    render() {
        this.renderer.renderBoard(this.board);
        this.renderer.renderPreview(this.previewBlocks);
    }

    // 애니메이션 루프 시작
    startAnimationLoop() {
        if (this.animationLoopId) return;

        const loop = () => {
            // 애니메이션 상태 가져오기
            const animState = this.animator.getAnimationState();

            // 보드 + 애니메이션 렌더링
            this.renderer.renderWithAnimation(this.board, animState, this.config);

            this.animationLoopId = requestAnimationFrame(loop);
        };

        loop();
    }

    // 애니메이션 루프 정지
    stopAnimationLoop() {
        if (this.animationLoopId) {
            cancelAnimationFrame(this.animationLoopId);
            this.animationLoopId = null;
        }
    }

    // 게임 오버
    gameOver() {
        this.state = 'gameover';
        this.stopAnimationLoop();
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
