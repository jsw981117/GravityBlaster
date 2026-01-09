class Board {
    constructor() {
        this.size = BOARD_SIZE;
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
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
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(null));

        // 모든 블록을 그리드에 반영
        for (let block of this.blocks) {
            for (let i = 0; i < block.shape.length; i++) {
                const [y, x] = block.shape[i];
                if (isInBounds(y, x)) {
                    this.grid[y][x] = {
                        blockId: block.id,
                        color: block.getColorAt(i)
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

    // 블록이 격리된 위치에 배치 가능한지 (기존 블록과 인접 금지)
    canPlaceIsolated(shape, startY, startX) {
        return this.canPlace(shape, startY, startX) && !this.hasAdjacentBlock(shape, startY, startX);
    }

    // 가장자리인지 체크
    isEdge(shape, startY, startX) {
        for (let [dy, dx] of shape) {
            const y = startY + dy;
            const x = startX + dx;
            if (y === 0 || y === this.size - 1 || x === 0 || x === this.size - 1) {
                return true;
            }
        }
        return false;
    }

    // 매치-3 찾기 (같은 색 3개 이상 인접)
    findMatches() {
        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        const matches = [];

        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (visited[y][x] || !this.grid[y][x] || this.grid[y][x].color === BOMB_COLOR) continue;

                const color = this.grid[y][x].color;
                const group = [];
                const queue = [[y, x]];
                visited[y][x] = true;

                // BFS로 같은 색 연결된 셀 찾기
                while (queue.length > 0) {
                    const [cy, cx] = queue.shift();
                    group.push([cy, cx]);

                    // 상하좌우 체크
                    const neighbors = [
                        [cy - 1, cx], [cy + 1, cx],
                        [cy, cx - 1], [cy, cx + 1]
                    ];

                    for (let [ny, nx] of neighbors) {
                        if (!isInBounds(ny, nx) || visited[ny][nx]) continue;
                        if (!this.grid[ny][nx] || this.grid[ny][nx].color === BOMB_COLOR) continue;
                        if (this.grid[ny][nx].color !== color) continue;

                        visited[ny][nx] = true;
                        queue.push([ny, nx]);
                    }
                }

                // 3개 이상이면 매치
                if (group.length >= 3) {
                    matches.push({ color, cells: group });
                }
            }
        }

        return matches;
    }

    // 제거될 셀 정보 가져오기 (애니메이션용)
    getMatchCells(matches, bombRange = 2) {
        const toRemove = new Set();
        const cellData = [];
        const matchCells = new Set();

        // 매치된 칸 수집
        for (let match of matches) {
            for (let [y, x] of match.cells) {
                toRemove.add(`${y},${x}`);
                matchCells.add(`${y},${x}`);
            }
        }

        // 폭탄 폭발 체크 (매치 인접 폭탄)
        for (let match of matches) {
            for (let [y, x] of match.cells) {
                // 상하좌우 인접 셀 체크
                const neighbors = [
                    [y - 1, x], [y + 1, x],
                    [y, x - 1], [y, x + 1]
                ];

                for (let [ny, nx] of neighbors) {
                    if (!isInBounds(ny, nx) || !this.grid[ny][nx]) continue;
                    if (this.grid[ny][nx].color === BOMB_COLOR) {
                        // 폭탄 주변 8칸 제거
                        const explosionCells = getNeighborsInRange(ny, nx, bombRange);
                        for (let [ey, ex] of explosionCells) {
                            toRemove.add(`${ey},${ex}`);
                        }
                        toRemove.add(`${ny},${nx}`); // 폭탄 자체도 제거
                    }
                }
            }
        }

        // Set을 배열로 변환하고 셀 정보 추가
        for (let key of toRemove) {
            const [y, x] = key.split(',').map(Number);
            if (this.grid[y] && this.grid[y][x]) {
                cellData.push({
                    y, x,
                    color: this.grid[y][x].color
                });
            }
        }

        return cellData;
    }

    // 매치 제거
    removeMatches(matches, bombRange = 2) {
        const toRemove = new Set();

        // 매치된 칸 수집
        for (let match of matches) {
            for (let [y, x] of match.cells) {
                toRemove.add(`${y},${x}`);
            }
        }

        // 폭탄 폭발 체크 (매치 인접 폭탄)
        for (let match of matches) {
            for (let [y, x] of match.cells) {
                // 상하좌우 인접 셀 체크
                const neighbors = [
                    [y - 1, x], [y + 1, x],
                    [y, x - 1], [y, x + 1]
                ];

                for (let [ny, nx] of neighbors) {
                    if (!isInBounds(ny, nx) || !this.grid[ny][nx]) continue;
                    if (this.grid[ny][nx].color === BOMB_COLOR) {
                        // 폭탄 주변 제거
                        const explosionCells = getNeighborsInRange(ny, nx, bombRange);
                        for (let [ey, ex] of explosionCells) {
                            toRemove.add(`${ey},${ex}`);
                        }
                        toRemove.add(`${ny},${nx}`); // 폭탄 자체도 제거
                    }
                }
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

        return { removed: toRemove.size > 0, count: toRemove.size };
    }

    // 보드 비우기
    clear() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
        this.blocks = [];
    }

    // 보드 내 셀 개수 반환
    getCellCount() {
        let count = 0;
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.grid[y][x] !== null) {
                    count++;
                }
            }
        }
        return count;
    }
}
