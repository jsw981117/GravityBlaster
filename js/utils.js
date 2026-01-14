// 보드 크기 (동적 설정 가능)
let BOARD_SIZE = 6;

// 블록 형태 정의 (2~5칸)
const BLOCK_SHAPES = {
    '1x2': [[0, 0], [0, 1]],
    '2x1': [[0, 0], [1, 0]],
    '1x3': [[0, 0], [0, 1], [0, 2]],
    '3x1': [[0, 0], [1, 0], [2, 0]],
    'L': [[0, 0], [1, 0], [1, 1]],
    '1x4': [[0, 0], [0, 1], [0, 2], [0, 3]],
    '4x1': [[0, 0], [1, 0], [2, 0], [3, 0]],
    'T': [[0, 0], [0, 1], [0, 2], [1, 1]],
    '1x5': [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
    '5x1': [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]
};

// 게임 색상 (4가지)
const GAME_COLORS = {
    blue: '#4A90E2',
    red: '#E74C3C',
    yellow: '#F1C40F',
    green: '#2ECC71'
};

// 특수 셀 색상
const BOOM_COLOR = '#555555';   // 봄 셀 (기존 폭탄)
const TIME_COLOR = '#FFD700';   // 타임 셀 (금색)

// 특수 셀 타입
const SPECIAL_CELL_TYPES = {
    BOOM: 'boom',
    TIME: 'time'
};

// 하위 호환성 (기존 코드 지원)
const BOMB_COLOR = BOOM_COLOR;

// 랜덤 블록 형태 선택 (셀 개수 범위 필터링)
function getRandomShape(minCells = 2, maxCells = 5) {
    const validShapes = Object.entries(BLOCK_SHAPES).filter(([key, shape]) => {
        const cellCount = shape.length;
        return cellCount >= minCells && cellCount <= maxCells;
    });

    if (validShapes.length === 0) {
        return BLOCK_SHAPES['1x2']; // 기본값
    }

    const randomIndex = Math.floor(Math.random() * validShapes.length);
    return validShapes[randomIndex][1];
}

// 랜덤 색상 선택
function getRandomColor() {
    const colors = Object.values(GAME_COLORS);
    return colors[Math.floor(Math.random() * colors.length)];
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
    return y >= 0 && y < BOARD_SIZE && x >= 0 && x < BOARD_SIZE;
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
