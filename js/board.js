class Board {
    constructor() {
        this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
        this.blocks = []; // Block 객체 배열
    }

    // 블록 추가
    addBlock(block) {
        this.blocks.push(block);
        this.updateGrid();
    }

    // 그리드 업데이트 (블록 정보 반영)
    updateGrid() {
        // 그리드 초기화
        this.grid = Array(8).fill(null).map(() => Array(8).fill(null));

        // 모든 블록을 그리드에 반영
        for (let block of this.blocks) {
            for (let [y, x] of block.shape) {
                if (isInBounds(y, x)) {
                    this.grid[y][x] = {
                        blockId: block.id,
                        type: block.type,
                        color: block.color,
                        isBomb: block.isBombCell(y, x)
                    };
                }
            }
        }
    }

    // 특정 위치가 비어있는지
    isEmpty(y, x) {
        if (!isInBounds(y, x)) return false;
        return this.grid[y][x] === null;
    }

    // 특정 위치의 블록 ID 가져오기
    getBlockId(y, x) {
        if (!isInBounds(y, x)) return null;
        return this.grid[y][x]?.blockId || null;
    }

    // ID로 블록 찾기
    getBlockById(id) {
        return this.blocks.find(b => b.id === id);
    }

    // 블록이 배치 가능한지 체크
    canPlace(shape, startY, startX) {
        for (let [dy, dx] of shape) {
            const y = startY + dy;
            const x = startX + dx;
            if (!isInBounds(y, x)) return false;
            if (!this.isEmpty(y, x)) return false;
        }
        return true;
    }

    // 블록과 인접한 칸이 있는지
    hasAdjacentBlock(shape, startY, startX) {
        for (let [dy, dx] of shape) {
            const y = startY + dy;
            const x = startX + dx;

            // 상하좌우 체크
            const neighbors = [
                [y - 1, x], [y + 1, x],
                [y, x - 1], [y, x + 1]
            ];

            for (let [ny, nx] of neighbors) {
                if (isInBounds(ny, nx) && !this.isEmpty(ny, nx)) {
                    return true;
                }
            }
        }
        return false;
    }

    // 가장자리인지 체크
    isEdge(shape, startY, startX) {
        for (let [dy, dx] of shape) {
            const y = startY + dy;
            const x = startX + dx;
            if (y === 0 || y === 7 || x === 0 || x === 7) {
                return true;
            }
        }
        return false;
    }

    // 완성된 라인 찾기 (행/열)
    findCompletedLines() {
        const lines = [];

        // 행 검사
        for (let y = 0; y < 8; y++) {
            if (this.grid[y].every(cell => cell !== null)) {
                lines.push({ type: 'row', index: y });
            }
        }

        // 열 검사
        for (let x = 0; x < 8; x++) {
            const column = this.grid.map(row => row[x]);
            if (column.every(cell => cell !== null)) {
                lines.push({ type: 'col', index: x });
            }
        }

        return lines;
    }

    // 라인 제거
    removeLines(lines) {
        const toRemove = new Set(); // [y, x] 문자열 형태로 저장
        const bombsToExplode = [];

        // 제거할 칸 수집
        for (let line of lines) {
            if (line.type === 'row') {
                for (let x = 0; x < 8; x++) {
                    toRemove.add(`${line.index},${x}`);
                    if (this.grid[line.index][x]?.isBomb) {
                        bombsToExplode.push([line.index, x]);
                    }
                }
            } else {
                for (let y = 0; y < 8; y++) {
                    toRemove.add(`${y},${line.index}`);
                    if (this.grid[y][line.index]?.isBomb) {
                        bombsToExplode.push([y, line.index]);
                    }
                }
            }
        }

        // 폭탄 폭발 처리 (주변 8칸)
        for (let [by, bx] of bombsToExplode) {
            const neighbors = getNeighbors8(by, bx);
            for (let [ny, nx] of neighbors) {
                toRemove.add(`${ny},${nx}`);
            }
        }

        // 블록에서 해당 칸 제거
        for (let block of this.blocks) {
            for (let [y, x] of block.shape.slice()) {
                if (toRemove.has(`${y},${x}`)) {
                    block.removeCell(y, x);
                }
            }
        }

        // 빈 블록 제거
        this.blocks = this.blocks.filter(b => !b.isEmpty());

        // 그리드 업데이트
        this.updateGrid();

        return toRemove.size > 0;
    }

    // 보드 비우기
    clear() {
        this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
        this.blocks = [];
    }
}
