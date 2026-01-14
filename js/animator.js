class Animator {
    constructor(renderer) {
        this.renderer = renderer;
        this.activeAnimations = [];
        this.explosions = [];
        this.isRunning = false;
        this.animationFrameId = null;

        // 개별 애니메이션 설정
        this.removeAnimDuration = 150;
        this.moveAnimDuration = 200;
        this.spawnAnimDuration = 150;
        this.scoreAnimDuration = 300;
        this.scorePopupDistance = 30;

        // 폭발 애니메이션 설정
        this.explosionDuration = 200;
        this.explosionRadius = 1.5;
        this.explosionStyle = 'both';
        this.explosionEmojiScale = 2.0;
    }

    // 애니메이션 설정
    setConfig(config) {
        if (config.removeAnimDuration !== undefined) this.removeAnimDuration = config.removeAnimDuration;
        if (config.moveAnimDuration !== undefined) this.moveAnimDuration = config.moveAnimDuration;
        if (config.spawnAnimDuration !== undefined) this.spawnAnimDuration = config.spawnAnimDuration;
        if (config.scoreAnimDuration !== undefined) this.scoreAnimDuration = config.scoreAnimDuration;
        if (config.scorePopupDistance !== undefined) this.scorePopupDistance = config.scorePopupDistance;
        if (config.explosionDuration !== undefined) this.explosionDuration = config.explosionDuration;
        if (config.explosionRadius !== undefined) this.explosionRadius = config.explosionRadius;
        if (config.explosionStyle !== undefined) this.explosionStyle = config.explosionStyle;
        if (config.explosionEmojiScale !== undefined) this.explosionEmojiScale = config.explosionEmojiScale;
    }

    // 애니메이션 루프 시작
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop();
    }

    // 애니메이션 루프 정지
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    // 메인 애니메이션 루프
    loop() {
        if (!this.isRunning) return;

        const now = performance.now();

        // 모든 활성 애니메이션 업데이트
        this.activeAnimations = this.activeAnimations.filter(anim => {
            const elapsed = now - anim.startTime;
            anim.progress = Math.min(elapsed / anim.duration, 1.0);

            if (anim.progress >= 1.0) {
                if (anim.resolve) anim.resolve();
                return false;
            }
            return true;
        });

        // 폭발 애니메이션 업데이트
        this.explosions = this.explosions.filter(exp => {
            const elapsed = now - exp.startTime;
            exp.progress = Math.min(elapsed / exp.duration, 1.0);
            return exp.progress < 1.0;
        });

        // 활성 애니메이션이 있으면 계속 실행
        if (this.activeAnimations.length > 0 || this.explosions.length > 0) {
            this.animationFrameId = requestAnimationFrame(() => this.loop());
        } else {
            this.isRunning = false;
        }
    }

    // 제거 애니메이션 (scale 1.0 → 0.0)
    playRemove(cells) {
        if (!cells || cells.length === 0) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const anim = {
                type: 'remove',
                cells: cells,
                startTime: performance.now(),
                duration: this.removeAnimDuration,
                progress: 0,
                resolve: resolve
            };

            this.activeAnimations.push(anim);
            this.start();
        });
    }

    // 이동 애니메이션 (position lerp)
    playMove(moveData) {
        if (!moveData || moveData.length === 0) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const anim = {
                type: 'move',
                cells: moveData,
                startTime: performance.now(),
                duration: this.moveAnimDuration,
                progress: 0,
                resolve: resolve
            };

            this.activeAnimations.push(anim);
            this.start();
        });
    }

    // 생성 애니메이션 (scale 0.0 → 1.2 → 1.0, bounce)
    playSpawn(cells) {
        if (!cells || cells.length === 0) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const anim = {
                type: 'spawn',
                cells: cells,
                startTime: performance.now(),
                duration: this.spawnAnimDuration,
                progress: 0,
                resolve: resolve
            };

            this.activeAnimations.push(anim);
            this.start();
        });
    }

    // 점수 팝업 애니메이션
    playScorePopup(x, y, score) {
        return new Promise(resolve => {
            const anim = {
                type: 'score',
                x: x,
                y: y,
                score: score,
                startTime: performance.now(),
                duration: this.scoreAnimDuration,
                progress: 0,
                resolve: resolve
            };

            this.activeAnimations.push(anim);
            this.start();
        });
    }

    // 폭발 애니메이션
    playExplosion(cells) {
        if (!cells || cells.length === 0) return;

        for (let cell of cells) {
            this.explosions.push({
                x: cell.x,
                y: cell.y,
                progress: 0,
                duration: this.explosionDuration,
                startTime: performance.now()
            });
        }

        this.start();
    }

    // 현재 애니메이션 상태 가져오기
    getAnimationState() {
        const state = {
            removingCells: [],
            movingCells: [],
            spawnCells: [],
            scorePopups: [],
            explosions: this.explosions
        };

        for (let anim of this.activeAnimations) {
            switch (anim.type) {
                case 'remove':
                    // scale: 1.0 → 0.0
                    const removeScale = 1.0 - anim.progress;
                    state.removingCells = anim.cells.map(cell => ({
                        ...cell,
                        scale: removeScale
                    }));
                    break;

                case 'move':
                    // position lerp + squash & stretch
                    state.movingCells = anim.cells.map(cell => {
                        const y = cell.fromY + (cell.toY - cell.fromY) * anim.progress;
                        const x = cell.fromX + (cell.toX - cell.fromX) * anim.progress;

                        // 착지 애니메이션 (마지막 20%에서 찌그러지고 튕김)
                        let scaleX = 1.0;
                        let scaleY = 1.0;
                        if (anim.progress > 0.8) {
                            const landProgress = (anim.progress - 0.8) / 0.2;
                            if (landProgress < 0.5) {
                                // 찌그러짐 (0.5까지)
                                const t = landProgress / 0.5;
                                scaleY = 1.0 - t * 0.3; // 0.7까지 감소
                                scaleX = 1.0 + t * 0.3; // 1.3까지 증가
                            } else {
                                // 튕김 (0.5~1.0)
                                const t = (landProgress - 0.5) / 0.5;
                                scaleY = 0.7 + t * 0.3; // 0.7 → 1.0
                                scaleX = 1.3 - t * 0.3; // 1.3 → 1.0
                            }
                        }

                        return {
                            y: y,
                            x: x,
                            toY: cell.toY,
                            toX: cell.toX,
                            color: cell.color,
                            scaleX: scaleX,
                            scaleY: scaleY
                        };
                    });
                    break;

                case 'spawn':
                    // bounce: 0.0 → 1.2 → 1.0
                    let spawnScale;
                    if (anim.progress < 0.6) {
                        // 0.0 → 1.2 (첫 60%)
                        spawnScale = (anim.progress / 0.6) * 1.2;
                    } else {
                        // 1.2 → 1.0 (남은 40%)
                        const t = (anim.progress - 0.6) / 0.4;
                        spawnScale = 1.2 - t * 0.2;
                    }
                    state.spawnCells = anim.cells.map(cell => ({
                        ...cell,
                        scale: spawnScale
                    }));
                    break;

                case 'score':
                    // 위로 이동 + fade
                    const offsetY = -this.scorePopupDistance * anim.progress;
                    const alpha = 1.0 - anim.progress;
                    state.scorePopups.push({
                        x: anim.x,
                        y: anim.y + offsetY,
                        score: anim.score,
                        alpha: alpha
                    });
                    break;
            }
        }

        return state;
    }

    // 애니메이션 실행 중인지
    isPlaying() {
        return this.activeAnimations.length > 0;
    }
}
