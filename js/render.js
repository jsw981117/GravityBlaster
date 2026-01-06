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
                    this.drawCell(x, y, cell.color, cell.isBomb);
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
    drawCell(x, y, color, isBomb = false) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const padding = 2;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            px + padding,
            py + padding,
            this.cellSize - padding * 2,
            this.cellSize - padding * 2
        );

        // 폭탄 표시
        if (isBomb) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(
                px + this.cellSize / 2,
                py + this.cellSize / 2,
                this.cellSize / 6,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
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
