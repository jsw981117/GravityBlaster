class Renderer {
    constructor(canvas, previewCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.previewCanvas = previewCanvas;
        this.previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;

        this.cellSize = 0;
        this.showGrid = false;
        this.boardBgAlpha = 0.3;
        this.previewBgAlpha = 0.3;
        this.resize();
    }

    setShowGrid(showGrid) {
        this.showGrid = showGrid;
    }

    setBgAlpha(boardBgAlpha, previewBgAlpha) {
        this.boardBgAlpha = boardBgAlpha;
        this.previewBgAlpha = previewBgAlpha;
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

        // 배경
        this.ctx.fillStyle = `rgba(255, 255, 255, ${this.boardBgAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드 라인 (설정에 따라)
        if (this.showGrid) {
            this.drawGrid();
        }

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
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
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

    // 셀 그리기 (젤리 스타일)
    drawCell(x, y, color, isBomb = false, scale = 1.0, scaleX = 1.0, scaleY = 1.0) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const padding = 2;

        const centerX = px + this.cellSize / 2;
        const centerY = py + this.cellSize / 2;
        const baseSize = (this.cellSize - padding * 2) * scale;
        const width = baseSize * scaleX;
        const height = baseSize * scaleY;

        const x0 = centerX - width / 2;
        const y0 = centerY - height / 2;
        const cornerRadius = Math.min(width, height) * 0.2;

        this.ctx.save();

        // 둥근 모서리 사각형
        this.ctx.beginPath();
        this.ctx.moveTo(x0 + cornerRadius, y0);
        this.ctx.lineTo(x0 + width - cornerRadius, y0);
        this.ctx.quadraticCurveTo(x0 + width, y0, x0 + width, y0 + cornerRadius);
        this.ctx.lineTo(x0 + width, y0 + height - cornerRadius);
        this.ctx.quadraticCurveTo(x0 + width, y0 + height, x0 + width - cornerRadius, y0 + height);
        this.ctx.lineTo(x0 + cornerRadius, y0 + height);
        this.ctx.quadraticCurveTo(x0, y0 + height, x0, y0 + height - cornerRadius);
        this.ctx.lineTo(x0, y0 + cornerRadius);
        this.ctx.quadraticCurveTo(x0, y0, x0 + cornerRadius, y0);
        this.ctx.closePath();

        // 그라디언트 (위쪽 밝게, 아래 어둡게)
        const gradient = this.ctx.createLinearGradient(centerX, y0, centerX, y0 + height);
        gradient.addColorStop(0, this.lightenColor(color, 20));
        gradient.addColorStop(1, this.darkenColor(color, 20));
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // 하이라이트 (왼쪽 위 반짝임)
        const highlightSize = Math.min(width, height) * 0.3;
        const highlightGradient = this.ctx.createRadialGradient(
            x0 + width * 0.3, y0 + height * 0.3, 0,
            x0 + width * 0.3, y0 + height * 0.3, highlightSize
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fill();

        this.ctx.restore();

        // 폭탄 표시 (💣 이모지)
        if (isBomb) {
            this.ctx.font = `${this.cellSize * 0.5 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('💣', centerX, centerY);
        }
    }

    // 색상 밝게
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    // 색상 어둡게
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
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

        // 배경
        this.ctx.fillStyle = `rgba(255, 255, 255, ${this.boardBgAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드 라인 (설정에 따라)
        if (this.showGrid) {
            this.drawGrid();
        }

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

        // 이동 중인 셀 렌더링 (squash & stretch 적용)
        for (let cell of animState.movingCells) {
            const scaleX = cell.scaleX !== undefined ? cell.scaleX : 1.0;
            const scaleY = cell.scaleY !== undefined ? cell.scaleY : 1.0;
            this.drawCell(cell.x, cell.y, cell.color, cell.color === BOMB_COLOR, 1.0, scaleX, scaleY);
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

    // 미리보기 블록 렌더링 (고정 셀 크기 20px)
    renderPreview(previewBlocks) {
        if (!this.previewCtx || previewBlocks.length === 0) return;

        // 고정 셀 크기
        const cellSize = 20;
        const padding = 10;
        const blockSpacing = 15;

        // 전체 크기 계산
        let totalWidth = padding;
        let maxHeight = 0;

        for (let block of previewBlocks) {
            const minX = Math.min(...block.shape.map(([dy, dx]) => dx));
            const minY = Math.min(...block.shape.map(([dy, dx]) => dy));
            const maxX = Math.max(...block.shape.map(([dy, dx]) => dx));
            const maxY = Math.max(...block.shape.map(([dy, dx]) => dy));

            const blockWidth = (maxX - minX + 1) * cellSize;
            const blockHeight = (maxY - minY + 1) * cellSize;

            totalWidth += blockWidth + blockSpacing;
            maxHeight = Math.max(maxHeight, blockHeight);
        }
        totalWidth += padding - blockSpacing;

        this.previewCanvas.width = totalWidth;
        this.previewCanvas.height = maxHeight + padding * 2;

        // 배경
        this.previewCtx.fillStyle = `rgba(255, 255, 255, ${this.previewBgAlpha})`;
        this.previewCtx.fillRect(0, 0, totalWidth, this.previewCanvas.height);

        // 각 블록 렌더링
        let offsetX = padding;
        for (let block of previewBlocks) {
            const minX = Math.min(...block.shape.map(([dy, dx]) => dx));
            const minY = Math.min(...block.shape.map(([dy, dx]) => dy));

            // 블록 셀 렌더링
            for (let i = 0; i < block.shape.length; i++) {
                const [dy, dx] = block.shape[i];
                const color = block.colors[i];
                const isBomb = color === BOMB_COLOR;

                const x = offsetX + (dx - minX) * cellSize;
                const y = padding + (dy - minY) * cellSize;

                // 셀 그리기
                this.previewCtx.fillStyle = color;
                this.previewCtx.fillRect(x, y, cellSize - 1, cellSize - 1);

                // 폭탄 표시
                if (isBomb) {
                    this.previewCtx.fillStyle = '#fff';
                    this.previewCtx.font = `${cellSize * 0.6}px Arial`;
                    this.previewCtx.textAlign = 'center';
                    this.previewCtx.textBaseline = 'middle';
                    this.previewCtx.fillText('💣', x + cellSize / 2, y + cellSize / 2);
                }
            }

            const maxX = Math.max(...block.shape.map(([dy, dx]) => dx));
            const blockWidth = (maxX - minX + 1) * cellSize;
            offsetX += blockWidth + blockSpacing;
        }
    }
}
