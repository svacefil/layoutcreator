export class CanvasDrawingUtils {
    constructor(canvas, ctx, axisMargin) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.axisMargin = axisMargin;
    }

    screenToWorld(screenX, screenY, scale) {
        const worldX = (screenX - this.axisMargin) / scale;
        const worldY = ((this.canvas.height - this.axisMargin) - screenY) / scale;
        return { x: worldX, y: worldY };
    }

    worldToScreen(worldX, worldY, scale) {
        const screenX = worldX * scale + this.axisMargin;
        const screenY = (this.canvas.height - this.axisMargin) - (worldY * scale);
        return { x: screenX, y: screenY };
    }

    _getNiceTickStep(range, numTicksApprox) {
        if (range <= 0 || numTicksApprox <= 0) return 1;
        const roughStep = range / numTicksApprox;
        const exponent = Math.floor(Math.log10(roughStep));
        const magnitude = Math.pow(10, exponent);
        const fraction = roughStep / magnitude;
        if (fraction > 5) return 10 * magnitude;
        if (fraction > 2.5) return 5 * magnitude;
        if (fraction > 1.5) return 2 * magnitude;
        return magnitude;
    }

    drawAxes(scale) {
        this.ctx.save();
        const tickLength = 5;
        const axisColor = '#555';
        const textColor = '#333';
        const axisLineWidth = 1;
        const fontSize = 10;
        this.ctx.strokeStyle = axisColor;
        this.ctx.fillStyle = textColor;
        this.ctx.lineWidth = axisLineWidth;
        this.ctx.font = `${fontSize}px Arial`;
        const yAxisScreenX = this.axisMargin;
        this.ctx.beginPath();
        this.ctx.moveTo(yAxisScreenX, 0);
        this.ctx.lineTo(yAxisScreenX, this.canvas.height - this.axisMargin + axisLineWidth);
        this.ctx.stroke();
        const worldY_top_of_drawing_area = (this.canvas.height - this.axisMargin) / scale;
        const yTickStepWorld = this._getNiceTickStep(worldY_top_of_drawing_area, Math.floor((this.canvas.height - this.axisMargin) / (fontSize * 3.5)));
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        if (yTickStepWorld > 0) {
            for (let currentWorldY = 0; currentWorldY <= worldY_top_of_drawing_area + yTickStepWorld / 2; currentWorldY += yTickStepWorld) {
                const tickScreenY = this.worldToScreen(0, currentWorldY, scale).y;
                if (tickScreenY >= 0 && tickScreenY <= this.canvas.height - this.axisMargin + 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(yAxisScreenX - tickLength, tickScreenY);
                    this.ctx.lineTo(yAxisScreenX, tickScreenY);
                    this.ctx.stroke();
                    if (Math.abs(currentWorldY) > 1e-6 || yTickStepWorld === 0) {
                        this.ctx.fillText(currentWorldY.toFixed(0), yAxisScreenX - tickLength - 3, tickScreenY);
                    }
                }
            }
        }
        const xAxisScreenY = this.canvas.height - this.axisMargin;
        this.ctx.beginPath();
        this.ctx.moveTo(this.axisMargin - axisLineWidth, xAxisScreenY);
        this.ctx.lineTo(this.canvas.width, xAxisScreenY);
        this.ctx.stroke();
        const worldX_right_of_drawing_area = (this.canvas.width - this.axisMargin) / scale;
        const xTickStepWorld = this._getNiceTickStep(worldX_right_of_drawing_area, Math.floor((this.canvas.width - this.axisMargin) / (fontSize * 4.5)));
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        if (xTickStepWorld > 0) {
            for (let currentWorldX = 0; currentWorldX <= worldX_right_of_drawing_area + xTickStepWorld / 2; currentWorldX += xTickStepWorld) {
                const tickScreenX = this.worldToScreen(currentWorldX, 0, scale).x;
                if (tickScreenX >= this.axisMargin - 1 && tickScreenX <= this.canvas.width) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(tickScreenX, xAxisScreenY);
                    this.ctx.lineTo(tickScreenX, xAxisScreenY + tickLength);
                    this.ctx.stroke();
                    this.ctx.fillText(currentWorldX.toFixed(0), tickScreenX, xAxisScreenY + tickLength + 3);
                }
            }
        }
        this.ctx.restore();
    }

    drawGrid(scale) {
        const gridScreenOffsetX = this.axisMargin;
        const gridScreenOffsetY = 0;
        const gridScreenWidth = this.canvas.width - gridScreenOffsetX;
        const gridScreenHeight = this.canvas.height - this.axisMargin;
        const worldXViewableRange = gridScreenWidth / scale;
        const worldYViewableRange = gridScreenHeight / scale;
        const approxLinesPer200px = 20;
        const stepWorldX = this._getNiceTickStep(worldXViewableRange, approxLinesPer200px);
        const stepWorldY = this._getNiceTickStep(worldYViewableRange, approxLinesPer200px);
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e8e8e8';
        this.ctx.lineWidth = 0.5;
        if (stepWorldX > 0) {
            for (let currentWorldX = 0; currentWorldX <= worldXViewableRange + stepWorldX / 2; currentWorldX += stepWorldX) {
                const screenX = this.worldToScreen(currentWorldX, 0, scale).x;
                if (screenX >= gridScreenOffsetX && screenX <= gridScreenOffsetX + gridScreenWidth) {
                    this.ctx.moveTo(screenX, gridScreenOffsetY);
                    this.ctx.lineTo(screenX, gridScreenOffsetY + gridScreenHeight);
                }
            }
        }
        if (stepWorldY > 0) {
            for (let currentWorldY = 0; currentWorldY <= worldYViewableRange + stepWorldY / 2; currentWorldY += stepWorldY) {
                const screenY = this.worldToScreen(0, currentWorldY, scale).y;
                if (screenY >= gridScreenOffsetY && screenY <= gridScreenOffsetY + gridScreenHeight) {
                    this.ctx.moveTo(gridScreenOffsetX, screenY);
                    this.ctx.lineTo(gridScreenOffsetX + gridScreenWidth, screenY);
                }
            }
        }
        this.ctx.stroke();
    }

    drawAll(state) {
        const { shapes, selectedShape, scale, currentOperation, currentRect } = state;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid(scale);

        shapes.forEach(shape => shape.draw(this.ctx, shape === selectedShape, scale, this.canvas.height, this.axisMargin));

        this.drawAxes(scale);

        if (currentOperation === 'draw' && currentRect.w_world !== undefined && currentRect.h_world !== undefined) {
            const screenRectPos = this.worldToScreen(currentRect.x_world, currentRect.y_world + currentRect.h_world, scale);
            const screenRectWidth = currentRect.w_world * scale;
            const screenRectHeight = currentRect.h_world * scale;

            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.rect(screenRectPos.x, screenRectPos.y, screenRectWidth, screenRectHeight);
            this.ctx.stroke();
        }
    }
}