class Gravity {
    constructor(board) {
        this.board = board;
        this.direction = null; // 'up' | 'down' | 'left' | 'right'
    }

    // 중력 적용
    apply(direction) {
        this.direction = direction;

        // 일반 블록을 1x1 블록으로 분해
        this.splitNormalBlocks();

        let moved = false;

        do {
            moved = false;

            // 일반 블록만 이동 (강철은 고정)
            const normalBlocks = this.board.blocks.filter(b => b.type === 'normal');

            for (let block of normalBlocks) {
                // 블록의 각 칸을 이동 시도 (일반 블록은 1x1이므로 1칸만)
                const [y, x] = block.shape[0];
                const [ny, nx] = this.getNextPosition(y, x, direction);

                // 이동 가능한지 체크
                if (this.canMove(y, x, ny, nx, block.id)) {
                    block.shape[0] = [ny, nx];
                    moved = true;
                }
            }

            // 이동 후 그리드 업데이트
            this.board.updateGrid();

        } while (moved);
    }

    // 일반 블록을 1x1로 분해
    splitNormalBlocks() {
        const newBlocks = [];

        for (let block of this.board.blocks) {
            if (block.type === 'normal' && block.shape.length > 1) {
                // 각 칸을 별도 블록으로 분리
                for (let [y, x] of block.shape) {
                    const newBlock = new Block('normal', [[0, 0]], y, x);
                    newBlock.shape = [[y, x]]; // 절대 좌표로 직접 설정
                    newBlocks.push(newBlock);
                }
                // 원본 블록 제거 표시
                block.shape = [];
            } else {
                newBlocks.push(block);
            }
        }

        // 빈 블록 제거 및 새 블록 적용
        this.board.blocks = newBlocks.filter(b => b.shape.length > 0);
        this.board.updateGrid();
    }

    // 다음 위치 계산
    getNextPosition(y, x, direction) {
        switch (direction) {
            case 'up': return [y - 1, x];
            case 'down': return [y + 1, x];
            case 'left': return [y, x - 1];
            case 'right': return [y, x + 1];
        }
    }

    // 이동 가능한지 체크
    canMove(fromY, fromX, toY, toX, blockId) {
        // 보드 밖인지
        if (!isInBounds(toY, toX)) return false;

        // 목적지가 비어있는지
        const targetCell = this.board.grid[toY][toX];
        if (targetCell === null) return true;

        // 같은 블록의 다른 칸인지
        if (targetCell.blockId === blockId) return true;

        return false;
    }
}
