import { BaseShape } from './baseshape.js';

export class Rectangle extends BaseShape {
    static minShapeSize = 2;
    static handleSizeOnScreen = 8;

    constructor(id, x, y, w, h, type = 'active') {
        super(id, x, y, type);

        this.w = Math.max(Rectangle.minShapeSize, w);
        this.h = Math.max(Rectangle.minShapeSize, h);
    }

    getHandles(currentScale) {
        const handleRadiusWorld = (Rectangle.handleSizeOnScreen / currentScale) / 2;
        return [
            { name: 'tl', x: this.x, y: this.y + this.h, cursor: 'nwse-resize' },
            { name: 'tm', x: this.x + this.w / 2, y: this.y + this.h, cursor: 'ns-resize' },
            { name: 'tr', x: this.x + this.w, y: this.y + this.h, cursor: 'nesw-resize' },
            { name: 'ml', x: this.x, y: this.y + this.h / 2, cursor: 'ew-resize' },
            { name: 'mr', x: this.x + this.w, y: this.y + this.h / 2, cursor: 'ew-resize' },
            { name: 'bl', x: this.x, y: this.y, cursor: 'nesw-resize' },
            { name: 'bm', x: this.x + this.w / 2, y: this.y, cursor: 'ns-resize' },
            { name: 'br', x: this.x + this.w, y: this.y, cursor: 'nwse-resize' }
        ];
    }

    getHandleAtPoint(worldPx, worldPy, currentScale) {
        const hitRadiusWorld = (Rectangle.handleSizeOnScreen / currentScale) / 1.5;
        for (const handle of this.getHandles(currentScale)) {
            if (Math.abs(worldPx - handle.x) <= hitRadiusWorld &&
                Math.abs(worldPy - handle.y) <= hitRadiusWorld) {
                return handle;
            }
        }
        return null;
    }

    draw(context, isSelected = false, currentScale, canvasHeight, axisMargin) {
        const screenX = this.x * currentScale + axisMargin;
        const screenY = (canvasHeight - axisMargin) - (this.y + this.h) * currentScale;
        const screenWidth = this.w * currentScale;
        const screenHeight = this.h * currentScale;

        if (screenX + screenWidth < axisMargin || screenX > context.canvas.width ||
            screenY + screenHeight < 0 || screenY > context.canvas.height - axisMargin) {
            return;
        }

        context.fillStyle = this.type === 'active'
            ? 'rgba(74, 222, 128, 0.5)'
            : 'rgba(248, 113, 113, 0.5)';
        context.beginPath();
        context.rect(screenX, screenY, screenWidth, screenHeight);
        context.fill();

        if (this.type === 'dead') {
            context.save();
            context.beginPath();
            context.rect(screenX, screenY, screenWidth, screenHeight);
            context.clip();
            context.beginPath();
            context.strokeStyle = 'rgba(100, 100, 100, 0.7)';
            context.lineWidth = 1;
            const step = 8;
            for (let d = -screenHeight; d < screenWidth + screenHeight; d += step) {
                context.moveTo(screenX + d - screenHeight, screenY);
                context.lineTo(screenX + d, screenY + screenHeight);
            }
            context.stroke();
            context.restore();
        }

        context.beginPath();
        context.rect(screenX, screenY, screenWidth, screenHeight);
        context.strokeStyle = this.type === 'active' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
        context.lineWidth = 1;
        context.stroke();

        if (isSelected) {
            context.strokeStyle = '#007bff';
            context.lineWidth = 2;
            context.strokeRect(screenX - 1, screenY - 1, screenWidth + 2, screenHeight + 2);

            context.fillStyle = '#007bff';
            this.getHandles(currentScale).forEach(handle => {
                const handleScreenX = handle.x * currentScale + axisMargin;
                const handleScreenY = (canvasHeight - axisMargin) - (handle.y * currentScale);
                context.fillRect(
                    handleScreenX - Rectangle.handleSizeOnScreen / 2,
                    handleScreenY - Rectangle.handleSizeOnScreen / 2,
                    Rectangle.handleSizeOnScreen,
                    Rectangle.handleSizeOnScreen
                );
            });
        }
    }

    isPointInside(worldPx, worldPy) {
        return worldPx >= this.x && worldPx <= this.x + this.w &&
            worldPy >= this.y && worldPy <= this.y + this.h;
    }

    toJSON() {
        const baseJson = super.toJSON();
        return {
            ...baseJson,
            shape: {
                type: 'rectangle',
                coords: [
                    parseFloat(this.x.toFixed(2)),
                    parseFloat(this.y.toFixed(2)),
                    parseFloat(this.w.toFixed(2)),
                    parseFloat(this.h.toFixed(2))
                ]
            }
        };
    }
}