class InputHandler {
    constructor(canvas, onSwipe) {
        this.canvas = canvas;
        this.onSwipe = onSwipe;
        this.startX = 0;
        this.startY = 0;
        this.minSwipeDistance = 30;

        this.setupEvents();
    }

    setupEvents() {
        // 터치 이벤트
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startX = touch.clientX;
            this.startY = touch.clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            this.detectSwipe(endX, endY);
        });

        // 마우스 이벤트 (PC 테스트용)
        this.canvas.addEventListener('mousedown', (e) => {
            this.startX = e.clientX;
            this.startY = e.clientY;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            const endX = e.clientX;
            const endY = e.clientY;
            this.detectSwipe(endX, endY);
        });
    }

    detectSwipe(endX, endY) {
        const dx = endX - this.startX;
        const dy = endY - this.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 최소 거리 체크
        if (distance < this.minSwipeDistance) return;

        // 각도로 방향 판정
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        let direction;
        if (angle >= -45 && angle < 45) {
            direction = 'right';
        } else if (angle >= 45 && angle < 135) {
            direction = 'down';
        } else if (angle >= -135 && angle < -45) {
            direction = 'up';
        } else {
            direction = 'left';
        }

        this.onSwipe(direction);
    }
}
