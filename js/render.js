class Renderer {
    constructor(canvas, previewCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.previewCanvas = previewCanvas;
        this.previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;

        this.cellSize = 0;
        this.showGrid = false;
        this.boardBgAlpha = 0.3;
        this.previewBgAlpha = 0.3;
        this.specialCellIconScale = 0.7;
        this.resize();
    }

    setShowGrid(showGrid) {
        this.showGrid = showGrid;
    }

    setBgAlpha(boardBgAlpha, previewBgAlpha) {
        this.boardBgAlpha = boardBgAlpha;
        this.previewBgAlpha = previewBgAlpha;
    }

    setSpecialCellIconScale(scale) {
        this.specialCellIconScale = scale;
    }

    resize() {
        const size = this.canvas.clientWidth;
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / BOARD_SIZE;
    }

    // 보드 렌더링
    renderBoard(board) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 배경
        this.ctx.fillStyle = `rgba(255, 255, 255, ${this.boardBgAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드 라인 (설정에 따라)
        if (this.showGrid) {
            this.drawGrid();
        }

        // 블록 렌더링
        for (let y = 0; y < board.size; y++) {
            for (let x = 0; x < board.size; x++) {
                const cell = board.grid[y][x];
                if (cell) {
                    this.drawCell(x, y, cell.color, cell.color === BOOM_COLOR);
                }
            }
        }
    }

    // 그리드 라인
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= BOARD_SIZE; i++) {
            const pos = i * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
    }

    // 셀 그리기 (젤리 스타일)
    drawCell(x, y, color, isBomb = false, scale = 1.0, scaleX = 1.0, scaleY = 1.0) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const padding = 2;

        const centerX = px + this.cellSize / 2;
        const centerY = py + this.cellSize / 2;

        const baseSize = (this.cellSize - padding * 2) * scale;
        const width = baseSize * scaleX;
        const height = baseSize * scaleY;

        const x0 = centerX - width / 2;
        const y0 = centerY - height / 2;
        const cornerRadius = Math.min(width, height) * 0.2;

        this.ctx.save();

        // 둥근 모서리 사각형
        this.ctx.beginPath();
        this.ctx.moveTo(x0 + cornerRadius, y0);
        this.ctx.lineTo(x0 + width - cornerRadius, y0);
        this.ctx.quadraticCurveTo(x0 + width, y0, x0 + width, y0 + cornerRadius);
        this.ctx.lineTo(x0 + width, y0 + height - cornerRadius);
        this.ctx.quadraticCurveTo(x0 + width, y0 + height, x0 + width - cornerRadius, y0 + height);
        this.ctx.lineTo(x0 + cornerRadius, y0 + height);
        this.ctx.quadraticCurveTo(x0, y0 + height, x0, y0 + height - cornerRadius);
        this.ctx.lineTo(x0, y0 + cornerRadius);
        this.ctx.quadraticCurveTo(x0, y0, x0 + cornerRadius, y0);
        this.ctx.closePath();

        // 그라디언트 (위쪽 밝게, 아래 어둡게)
        const gradient = this.ctx.createLinearGradient(centerX, y0, centerX, y0 + height);
        gradient.addColorStop(0, this.lightenColor(color, 20));
        gradient.addColorStop(1, this.darkenColor(color, 20));
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // 하이라이트 (왼쪽 위 반짝임)
        const highlightSize = Math.min(width, height) * 0.3;
        const highlightGradient = this.ctx.createRadialGradient(
            x0 + width * 0.3, y0 + height * 0.3, 0,
            x0 + width * 0.3, y0 + height * 0.3, highlightSize
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = highlightGradient;
        this.ctx.fill();

        this.ctx.restore();

        // 특수 셀 아이콘 렌더링
        if (color === BOOM_COLOR || color === TIME_COLOR) {
            const icon = (color === BOOM_COLOR) ? '💣' : '⏰';
            this.ctx.save();
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = 'rgba(0,0,0,1.0)';
            this.ctx.font = `${this.cellSize * this.specialCellIconScale * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(icon, centerX, centerY);
            this.ctx.restore();
        }
    }

    // 색상 밝게
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    // 색상 어둡게
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    // 폭발 효과 그리기
    drawExplosion(explosion, config) {
        const centerX = explosion.x * this.cellSize + this.cellSize / 2;
        const centerY = explosion.y * this.cellSize + this.cellSize / 2;
        const progress = explosion.progress;
        const maxRadius = this.cellSize * config.explosionRadius;
        const currentRadius = maxRadius * progress;

        this.ctx.save();

        // 그라디언트 스타일
        if (config.explosionStyle === 'gradient' || config.explosionStyle === 'both') {
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, currentRadius
            );

            // 오렌지 → 노랑 → 투명
            gradient.addColorStop(0, `rgba(255, 140, 0, ${1.0 - progress})`);   // 오렌지
            gradient.addColorStop(0.5, `rgba(255, 220, 0, ${0.8 - progress * 0.8})`); // 노랑
            gradient.addColorStop(1, 'rgba(255, 220, 0, 0)'); // 투명

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 이모지 스타일
        if (config.explosionStyle === 'emoji' || config.explosionStyle === 'both') {
            const emojiScale = 1.0 + (config.explosionEmojiScale - 1.0) * progress;
            const alpha = 1.0 - progress;

            this.ctx.globalAlpha = alpha;
            this.ctx.font = `${this.cellSize * emojiScale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('💥', centerX, centerY);
        }

        this.ctx.restore();
    }

    // 스케일된 셀들 렌더링 (제거 애니메이션용)
    drawScaledCells(cells, scale) {
        for (let cell of cells) {
            // cell: {y: 행, x: 열}이지만 drawCell(x, y)이므로 순서 맞춤
            this.drawCell(cell.x, cell.y, cell.color, cell.color === BOOM_COLOR, scale);
        }
    }

    // 애니메이션과 함께 렌더링
    renderWithAnimation(board, animState, explosionConfig = null) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 배경
        this.ctx.fillStyle = `rgba(255, 255, 255, ${this.boardBgAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드 라인 (설정에 따라)
        if (this.showGrid) {
            this.drawGrid();
        }

        // 제거 중인 셀 ID 수집
        const removingIds = new Set();
        for (let cell of animState.removingCells) {
            removingIds.add(`${Math.round(cell.y)},${Math.round(cell.x)}`);
        }

        // 이동 중인 셀의 최종 위치 숨기기 (board에 이미 최종 위치로 업데이트됨)
        const movingToIds = new Set();
        for (let cell of animState.movingCells) {
            movingToIds.add(`${cell.toY},${cell.toX}`);
        }

        // 생성 중인 셀 ID 수집
        const spawnIds = new Set();
        for (let cell of animState.spawnCells) {
            spawnIds.add(`${cell.y},${cell.x}`);
        }

        // 보드 기본 렌더링 (애니메이션 중인 셀 제외)
        for (let y = 0; y < board.size; y++) {
            for (let x = 0; x < board.size; x++) {
                const key = `${y},${x}`;
                if (removingIds.has(key) || spawnIds.has(key) || movingToIds.has(key)) {
                    continue; // 애니메이션 중인 셀은 별도 렌더링
                }

                const cell = board.grid[y][x];
                if (cell) {
                    this.drawCell(x, y, cell.color, cell.color === BOOM_COLOR);
                }
            }
        }

        // 이동 중인 셀 렌더링 (squash & stretch 적용)
        for (let cell of animState.movingCells) {
            const scaleX = cell.scaleX !== undefined ? cell.scaleX : 1.0;
            const scaleY = cell.scaleY !== undefined ? cell.scaleY : 1.0;
            this.drawCell(cell.x, cell.y, cell.color, cell.color === BOOM_COLOR, 1.0, scaleX, scaleY);
        }

        // 제거 중인 셀 렌더링 (축소)
        for (let cell of animState.removingCells) {
            this.drawCell(cell.x, cell.y, cell.color, cell.color === BOOM_COLOR, cell.scale);
        }

        // 생성 중인 셀 렌더링 (확대)
        for (let cell of animState.spawnCells) {
            this.drawCell(cell.x, cell.y, cell.color, cell.color === BOOM_COLOR, cell.scale);
        }

        // 점수 팝업 렌더링
        for (let popup of animState.scorePopups) {
            const px = popup.x * this.cellSize + this.cellSize / 2;
            const py = popup.y * this.cellSize + this.cellSize / 2 + (popup.offsetY || 0);

            this.ctx.save();
            this.ctx.globalAlpha = popup.alpha;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // 콤보 표시 (2 이상일 때)
            if (popup.combo >= 2) {
                const comboY = py - this.cellSize * 0.25;
                this.ctx.font = `bold ${this.cellSize * 0.3}px Arial`;
                this.ctx.fillStyle = '#FF6B6B'; // 빨간색
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText(`COMBO ${popup.combo}`, px, comboY);
                this.ctx.fillText(`COMBO ${popup.combo}`, px, comboY);
            }

            // 점수 표시
            const scoreY = (popup.combo >= 2) ? py + this.cellSize * 0.15 : py;
            this.ctx.font = `bold ${this.cellSize * 0.4}px Arial`;
            this.ctx.fillStyle = '#FFD700'; // 금색
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(`+${popup.score}`, px, scoreY);
            this.ctx.fillText(`+${popup.score}`, px, scoreY);

            this.ctx.restore();
        }

        // 턴 증가 팝업 렌더링
        for (let popup of animState.turnPopups) {
            const px = popup.x * this.cellSize + this.cellSize / 2;
            const py = popup.y * this.cellSize + this.cellSize / 2 + (popup.offsetY || 0);

            this.ctx.save();
            this.ctx.globalAlpha = popup.alpha;
            this.ctx.font = `bold ${this.cellSize * 0.4}px Arial`;
            this.ctx.fillStyle = '#4ECDC4'; // 청록색
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.strokeText(`+${popup.turnBonus} TURN`, px, py);
            this.ctx.fillText(`+${popup.turnBonus} TURN`, px, py);
            this.ctx.restore();
        }

        // 타겟 완료 팝업 렌더링
        for (let popup of animState.targetCompletePopups) {
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const textSize = this.cellSize * (explosionConfig?.targetCompleteTextSize || 1.0);

            this.ctx.save();
            this.ctx.globalAlpha = popup.alpha;
            this.ctx.font = `bold ${textSize}px Arial`;
            this.ctx.fillStyle = '#FFD700'; // 금색
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 4;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // TARGET (위)
            const targetY = centerY - textSize * 0.6;
            this.ctx.strokeText('TARGET', centerX, targetY);
            this.ctx.fillText('TARGET', centerX, targetY);

            // COMPLETE (아래)
            const completeY = centerY + textSize * 0.6;
            this.ctx.strokeText('COMPLETE', centerX, completeY);
            this.ctx.fillText('COMPLETE', centerX, completeY);

            this.ctx.restore();
        }

        // 폭발 효과 렌더링
        if (explosionConfig && animState.explosions) {
            for (let explosion of animState.explosions) {
                this.drawExplosion(explosion, explosionConfig);
            }
        }
    }

    // 미리보기 블록 렌더링 (고정 박스, 동일 셀 크기)
    renderPreview(previewBlocks) {
        if (!this.previewCtx || previewBlocks.length === 0) return;

        // 고정 박스 크기
        const boxSize = 100;
        const padding = 10;

        // 최대 5칸이 들어갈 수 있도록 셀 크기 계산
        const cellSize = (boxSize - padding * 2) / 5;

        this.previewCanvas.width = boxSize;
        this.previewCanvas.height = boxSize;

        // 배경
        this.previewCtx.fillStyle = `rgba(255, 255, 255, ${this.previewBgAlpha})`;
        this.previewCtx.fillRect(0, 0, boxSize, boxSize);

        // 블록 렌더링 (중앙 정렬)
        for (let block of previewBlocks) {
            const minX = Math.min(...block.shape.map(([dy, dx]) => dx));
            const minY = Math.min(...block.shape.map(([dy, dx]) => dy));
            const maxX = Math.max(...block.shape.map(([dy, dx]) => dx));
            const maxY = Math.max(...block.shape.map(([dy, dx]) => dy));

            const blockWidth = (maxX - minX + 1) * cellSize;
            const blockHeight = (maxY - minY + 1) * cellSize;

            // 중앙 정렬 오프셋
            const offsetX = (boxSize - blockWidth) / 2;
            const offsetY = (boxSize - blockHeight) / 2;

            // 블록 셀 렌더링
            for (let i = 0; i < block.shape.length; i++) {
                const [dy, dx] = block.shape[i];
                const color = block.colors[i];

                const x = offsetX + (dx - minX) * cellSize;
                const y = offsetY + (dy - minY) * cellSize;

                // 셀 배경 렌더링
                this.previewCtx.fillStyle = color;
                this.previewCtx.fillRect(x, y, cellSize - 1, cellSize - 1);

                // 특수 셀 아이콘 렌더링
                if (color === BOOM_COLOR || color === TIME_COLOR) {
                    const icon = (color === BOOM_COLOR) ? '💣' : '⏰';
                    this.previewCtx.save();
                    this.previewCtx.globalAlpha = 1.0;
                    this.previewCtx.fillStyle = 'rgba(0,0,0,1.0)';
                    this.previewCtx.font = `${cellSize * this.specialCellIconScale}px Arial`;
                    this.previewCtx.textAlign = 'center';
                    this.previewCtx.textBaseline = 'middle';
                    this.previewCtx.fillText(icon, x + cellSize / 2, y + cellSize / 2);
                    this.previewCtx.restore();
                }
            }
        }
    }
}
