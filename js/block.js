// 블록 ID 생성기
let blockIdCounter = 0;

class Block {
    constructor(type, shape, startY, startX, bombChance = 5) {
        this.id = ++blockIdCounter;
        this.type = type; // 'normal' | 'steel'
        this.shape = []; // [[y, x], [y, x], ...]
        this.color = BLOCK_COLORS[type];
        this.isBomb = false;

        // shape을 절대 좌표로 변환
        for (let [dy, dx] of shape) {
            this.shape.push([startY + dy, startX + dx]);
        }

        // 폭탄 블록인 경우 랜덤 칸 하나를 폭탄으로
        if (isBombBlock(bombChance) && this.shape.length > 0) {
            const bombIndex = Math.floor(Math.random() * this.shape.length);
            this.bombCell = this.shape[bombIndex]; // [y, x]
        }
    }

    // 블록의 특정 칸 제거
    removeCell(y, x) {
        this.shape = this.shape.filter(([cy, cx]) => !(cy === y && cx === x));
    }

    // 블록이 완전히 제거되었는지
    isEmpty() {
        return this.shape.length === 0;
    }

    // 특정 칸이 폭탄인지
    isBombCell(y, x) {
        if (!this.bombCell) return false;
        return this.bombCell[0] === y && this.bombCell[1] === x;
    }

    // 블록이 특정 좌표를 포함하는지
    hasCell(y, x) {
        return this.shape.some(([cy, cx]) => cy === y && cx === x);
    }
}
