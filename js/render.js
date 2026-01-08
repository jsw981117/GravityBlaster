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
                    this.drawCell(x, y, cell.color, cell.isBomb);
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
            this.drawCell(cell.x, cell.y, cell.color, cell.isBomb, scale);
        }
    }
}
