class Gravity {
    constructor(board) {
        this.board = board;
        this.direction = null; // 'up' | 'down' | 'left' | 'right'
    }

    // 중력 적용 (splitBlocks는 호출자가 먼저 실행해야 함)
    apply(direction) {
        this.direction = direction;

        // 이동 데이터 추적
        const moveData = new Map(); // blockId -> {fromY, fromX, toY, toX, color}

        // 초기 위치 저장
        for (let block of this.board.blocks) {
            const [y, x] = block.shape[0];
            moveData.set(block.id, {
                fromY: y,
                fromX: x,
                toY: y,
                toX: x,
                color: block.colors[0],
                isNewlySpawned: block.isNewlySpawned || false
            });
        }

        let moved = false;

        do {
            moved = false;

            // 모든 블록 개별 이동 (1x1)
            for (let block of this.board.blocks) {
                const [y, x] = block.shape[0];
                const [ny, nx] = this.getNextPosition(y, x, direction);

                if (this.canMove(y, x, ny, nx, block.id)) {
                    block.shape[0] = [ny, nx];
                    // 최종 위치 업데이트
                    moveData.get(block.id).toY = ny;
                    moveData.get(block.id).toX = nx;
                    moved = true;
                }
            }

            // 이동 후 그리드 업데이트
            this.board.updateGrid();

        } while (moved);

        // 실제로 이동한 셀만 필터링
        const movedCells = [];
        for (let data of moveData.values()) {
            if (data.fromY !== data.toY || data.fromX !== data.toX) {
                movedCells.push(data);
            }
        }

        // 첫 이동 완료 후 모든 블록의 isNewlySpawned 플래그 제거
        for (let block of this.board.blocks) {
            block.isNewlySpawned = false;
        }

        return movedCells;
    }

    // 블록 전체가 이동 가능한지 체크 (사용 안 함, 호환성 유지)
    canMoveBlock(block, direction) {
        // 모든 칸이 이동 가능해야 함
        for (let [y, x] of block.shape) {
            const [ny, nx] = this.getNextPosition(y, x, direction);
            if (!this.canMove(y, x, ny, nx, block.id)) {
                return false;
            }
        }
        return true;
    }

    // 모든 블록을 1x1로 분해
    splitBlocks() {
        const newBlocks = [];

        for (let block of this.board.blocks) {
            if (block.shape.length > 1) {
                // 각 칸을 별도 블록으로 분리
                for (let i = 0; i < block.shape.length; i++) {
                    const [y, x] = block.shape[i];
                    const cellColor = block.getColorAt(i);
                    const newBlock = new Block([cellColor], [[0, 0]], y, x);
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
