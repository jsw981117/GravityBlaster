// 블록 ID 생성기
let blockIdCounter = 0;

class Block {
    constructor(colors, shape, startY, startX, isBomb = false) {
        this.id = ++blockIdCounter;
        this.colors = isBomb ? [BOMB_COLOR] : colors; // 각 셀의 색상 배열
        this.isBomb = isBomb;
        this.shape = []; // [[y, x], [y, x], ...]

        // shape을 절대 좌표로 변환
        for (let [dy, dx] of shape) {
            this.shape.push([startY + dy, startX + dx]);
        }
    }

    // 특정 셀의 색상 가져오기
    getColorAt(index) {
        if (this.isBomb) return BOMB_COLOR;
        return this.colors[index] || this.colors[0];
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
