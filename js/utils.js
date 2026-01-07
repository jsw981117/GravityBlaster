// 블록 형태 정의
const BLOCK_SHAPES = {
    '1x1': [[0, 0]],
    '1x2': [[0, 0], [0, 1]],
    '2x1': [[0, 0], [1, 0]],
    '2x2': [[0, 0], [0, 1], [1, 0], [1, 1]],
    'L': [[0, 0], [1, 0], [1, 1]],
    'T': [[0, 0], [0, 1], [0, 2], [1, 1]],
    '1x3': [[0, 0], [0, 1], [0, 2]],
    '3x1': [[0, 0], [1, 0], [2, 0]]
};

// 블록 타입별 색상
const BLOCK_COLORS = {
    normal: '#00ffcc',  // 청록색
    steel: '#888888'    // 은색
};

// 랜덤 블록 형태 선택
function getRandomShape() {
    const keys = Object.keys(BLOCK_SHAPES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return BLOCK_SHAPES[key];
}

// 랜덤 블록 타입 (설정 기반)
function getRandomType(normalRatio, steelRatio) {
    const rand = Math.random();
    if (rand < normalRatio) return 'normal';
    return 'steel';
}

// 폭탄 여부 (설정 기반)
function isBombBlock(bombChance) {
    return Math.random() * 100 < bombChance;
}

// 배열 깊은 복사
function deepCopy(arr) {
    return JSON.parse(JSON.stringify(arr));
}

// 좌표가 보드 내부인지 체크
function isInBounds(y, x) {
    return y >= 0 && y < 8 && x >= 0 && x < 8;
}

// 두 좌표가 인접한지 체크 (상하좌우)
function isAdjacent(y1, x1, y2, x2) {
    const dy = Math.abs(y1 - y2);
    const dx = Math.abs(x1 - x2);
    return (dy === 1 && dx === 0) || (dy === 0 && dx === 1);
}

// 8방향 주변 좌표 (폭탄용)
function getNeighbors8(y, x) {
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            const ny = y + dy;
            const nx = x + dx;
            if (isInBounds(ny, nx)) {
                neighbors.push([ny, nx]);
            }
        }
    }
    return neighbors;
}

// 범위 내 주변 좌표 (폭탄 범위 설정용)
function getNeighborsInRange(y, x, range) {
    const neighbors = [];
    for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            if (dy === 0 && dx === 0) continue;
            const ny = y + dy;
            const nx = x + dx;
            if (isInBounds(ny, nx)) {
                neighbors.push([ny, nx]);
            }
        }
    }
    return neighbors;
}
