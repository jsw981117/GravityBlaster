// 블록 ID 생성기
let blockIdCounter = 0;

class Block {
    constructor(color, shape, startY, startX, isBomb = false) {
        this.id = ++blockIdCounter;
        this.color = isBomb ? BOMB_COLOR : color;
        this.isBomb = isBomb;
        this.shape = []; // [[y, x], [y, x], ...]

        // shape을 절대 좌표로 변환
        for (let [dy, dx] of shape) {
            this.shape.push([startY + dy, startX + dx]);
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

    // 블록이 특정 좌표를 포함하는지
    hasCell(y, x) {
        return this.shape.some(([cy, cx]) => cy === y && cx === x);
    }
}
