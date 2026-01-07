class Renderer {
    constructor(canvas, previewCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.previewCanvas = previewCanvas;
        this.previewCtx = previewCanvas.getContext('2d');

        this.cellSize = 0;
        this.resize();
    }

    resize() {
        const size = this.canvas.clientWidth;
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / 8;

        this.previewCanvas.width = this.previewCanvas.clientWidth;
        this.previewCanvas.height = this.previewCanvas.clientHeight;
    }

    // 보드 렌더링
    renderBoard(board, preview = null) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드 라인
        this.drawGrid();

        // 예고 블록 (반투명)
        if (preview) {
            this.drawPreview(preview);
        }

        // 블록 렌더링
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = board.grid[y][x];
                if (cell) {
                    this.drawCell(x, y, cell.color, cell.isBomb, 1.0, board, cell.blockId);
                }
            }
        }
    }

    // 그리드 라인
    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= 8; i++) {
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
    drawCell(x, y, color, isBomb = false, scale = 1.0, board = null, blockId = null) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const padding = 2;

        // 인접 셀이 같은 블록인지 확인
        let extendTop = false, extendBottom = false, extendLeft = false, extendRight = false;

        if (board && blockId) {
            const topCell = y > 0 ? board.grid[y - 1][x] : null;
            const bottomCell = y < 7 ? board.grid[y + 1][x] : null;
            const leftCell = x > 0 ? board.grid[y][x - 1] : null;
            const rightCell = x < 7 ? board.grid[y][x + 1] : null;

            extendTop = topCell && topCell.blockId === blockId;
            extendBottom = bottomCell && bottomCell.blockId === blockId;
            extendLeft = leftCell && leftCell.blockId === blockId;
            extendRight = rightCell && rightCell.blockId === blockId;
        }

        // 경계선 확장 계산
        const topPadding = extendTop ? 0 : padding;
        const bottomPadding = extendBottom ? 0 : padding;
        const leftPadding = extendLeft ? 0 : padding;
        const rightPadding = extendRight ? 0 : padding;

        const rectX = px + leftPadding;
        const rectY = py + topPadding;
        const rectWidth = this.cellSize - leftPadding - rightPadding;
        const rectHeight = this.cellSize - topPadding - bottomPadding;

        // 스케일 적용 (애니메이션용, 중앙 기준)
        const centerX = px + this.cellSize / 2;
        const centerY = py + this.cellSize / 2;
        const scaledWidth = rectWidth * scale;
        const scaledHeight = rectHeight * scale;
        const scaledX = centerX - scaledWidth / 2;
        const scaledY = centerY - scaledHeight / 2;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

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
            this.drawCell(cell.x, cell.y, cell.color, cell.isBomb, scale);
        }
    }

    // 예고 블록 (반투명 빨간색)
    drawPreview(previewBlocks) {
        this.ctx.globalAlpha = 0.4;

        for (let preview of previewBlocks) {
            const { position } = preview;

            for (let [dy, dx] of preview.shape) {
                const y = position.y + dy;
                const x = position.x + dx;
                if (isInBounds(y, x)) {
                    this.drawCell(x, y, '#ff0000');
                }
            }
        }

        this.ctx.globalAlpha = 1.0;
    }

    // 예고 캔버스 렌더링 (빨간색)
    renderPreviewCanvas(previewBlocks) {
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        if (!previewBlocks || previewBlocks.length === 0) return;

        const blockWidth = this.previewCanvas.width / previewBlocks.length;
        const cellSize = Math.min(blockWidth / 3, 20);

        for (let i = 0; i < previewBlocks.length; i++) {
            const preview = previewBlocks[i];
            const offsetX = i * blockWidth + blockWidth / 2;
            const offsetY = this.previewCanvas.height / 2;

            this.previewCtx.fillStyle = '#ff0000';  // 빨간색

            for (let [dy, dx] of preview.shape) {
                const px = offsetX + dx * cellSize - cellSize;
                const py = offsetY + dy * cellSize - cellSize;

                this.previewCtx.fillRect(px, py, cellSize - 2, cellSize - 2);
            }
        }
    }
}
