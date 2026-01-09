class InputHandler {
    constructor(element, onSwipe, onPause) {
        this.element = element;
        this.onSwipe = onSwipe;
        this.onPause = onPause;
        this.startX = 0;
        this.startY = 0;
        this.minSwipeDistance = 30;

        this.setupEvents();
    }

    setupEvents() {
        // 터치 이벤트
        this.element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startX = touch.clientX;
            this.startY = touch.clientY;
        });

        this.element.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            this.detectSwipe(endX, endY);
        });

        // 마우스 이벤트
        this.element.addEventListener('mousedown', (e) => {
            this.startX = e.clientX;
            this.startY = e.clientY;
        });

        this.element.addEventListener('mouseup', (e) => {
            const endX = e.clientX;
            const endY = e.clientY;
            this.detectSwipe(endX, endY);
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }

    handleKeyboard(e) {
        // ESC: 일시정지
        if (e.key === 'Escape') {
            if (this.onPause) this.onPause();
            return;
        }

        let direction = null;

        // WASD
        if (e.key === 'w' || e.key === 'W') direction = 'up';
        else if (e.key === 's' || e.key === 'S') direction = 'down';
        else if (e.key === 'a' || e.key === 'A') direction = 'left';
        else if (e.key === 'd' || e.key === 'D') direction = 'right';

        // 방향키
        else if (e.key === 'ArrowUp') direction = 'up';
        else if (e.key === 'ArrowDown') direction = 'down';
        else if (e.key === 'ArrowLeft') direction = 'left';
        else if (e.key === 'ArrowRight') direction = 'right';

        if (direction) {
            e.preventDefault();
            this.onSwipe(direction);
        }
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
