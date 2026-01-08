class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.cellSize = 0;
        this.resize();
    }

    resize() {
        const size = this.canvas.clientWidth;
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / BOARD_SIZE;
    }

    // 보드 렌더링
    renderBoard(board) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드 라인
        this.drawGrid();

        // 블록 렌더링
        for (let y = 0; y < board.size; y++) {
            for (let x = 0; x < board.size; x++) {
                const cell = board.grid[y][x];
                if (cell) {
                    this.drawCell(x, y, cell.color, cell.color === BOMB_COLOR);
                }
            }
        }
    }

    // 그리드 라인
    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= BOARD_SIZE; i++) {
            const pos = i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }

    // 셀 그리기
    drawCell(x, y, color, isBomb = false, scale = 1.0) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const padding = 2;

        const centerX = px + this.cellSize / 2;
        const centerY = py + this.cellSize / 2;
        const size = (this.cellSize - padding * 2) * scale;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            centerX - size / 2,
            centerY - size / 2,
            size,
            size
        );

        // 폭탄 표시 (💣 이모지)
        if (isBomb) {
            this.ctx.font = `${this.cellSize * 0.5 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('💣', centerX, centerY);
        }
    }

    // 스케일된 셀들 렌더링 (제거 애니메이션용)
    drawScaledCells(cells, scale) {
        for (let cell of cells) {
            // cell: {y: 행, x: 열}이지만 drawCell(x, y)이므로 순서 맞춤
            this.drawCell(cell.x, cell.y, cell.color, cell.color === BOMB_COLOR, scale);
        }
    }

    // 애니메이션과 함께 렌더링
    renderWithAnimation(board, animState) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드 라인
        this.drawGrid();

        // 제거 중인 셀 ID 수집
        const removingIds = new Set();
        for (let cell of animState.removingCells) {
            removingIds.add(`${Math.round(cell.y)},${Math.round(cell.x)}`);
        }

        // 이동 중인 셀의 최종 위치 숨기기 (board에 이미 최종 위치로 업데이트됨)
        const movingToIds = new Set();
        for (let cell of animState.movingCells) {
            movingToIds.add(`${cell.toY},${cell.toX}`);
        }

        // 생성 중인 셀 ID 수집
        const spawnIds = new Set();
        for (let cell of animState.spawnCells) {
            spawnIds.add(`${cell.y},${cell.x}`);
        }

        // 보드 기본 렌더링 (애니메이션 중인 셀 제외)
        for (let y = 0; y < board.size; y++) {
            for (let x = 0; x < board.size; x++) {
                const key = `${y},${x}`;
                if (removingIds.has(key) || spawnIds.has(key) || movingToIds.has(key)) {
                    continue; // 애니메이션 중인 셀은 별도 렌더링
                }

                const cell = board.grid[y][x];
                if (cell) {
                    this.drawCell(x, y, cell.color, cell.color === BOMB_COLOR);
                }
            }
        }

        // 이동 중인 셀 렌더링
        for (let cell of animState.movingCells) {
            this.drawCell(cell.x, cell.y, cell.color, cell.color === BOMB_COLOR);
        }

        // 제거 중인 셀 렌더링 (축소)
        for (let cell of animState.removingCells) {
            this.drawCell(cell.x, cell.y, cell.color, cell.color === BOMB_COLOR, cell.scale);
        }

        // 생성 중인 셀 렌더링 (확대)
        for (let cell of animState.spawnCells) {
            this.drawCell(cell.x, cell.y, cell.color, cell.color === BOMB_COLOR, cell.scale);
        }

        // 점수 팝업 렌더링
        for (let popup of animState.scorePopups) {
            const px = popup.x * this.cellSize + this.cellSize / 2;
            const py = popup.y * this.cellSize + this.cellSize / 2;

            this.ctx.save();
            this.ctx.globalAlpha = popup.alpha;
            this.ctx.font = `bold ${this.cellSize * 0.4}px Arial`;
            this.ctx.fillStyle = '#FFD700'; // 금색
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.strokeText(`+${popup.score}`, px, py);
            this.ctx.fillText(`+${popup.score}`, px, py);
            this.ctx.restore();
        }
    }
}
