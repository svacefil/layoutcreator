import { Rectangle } from './rectangle.js';

const dragStartThreshold = 5;
const minShapeSize = 2;
const snapThreshold_world = 5;

export class InteractionManager {
    constructor(config) {
        this.canvas = config.canvas;
        this.drawingUtils = config.drawingUtils;
        this.appState = config.appState;
        this.callbacks = config.callbacks;

        this.currentOperation = 'none';
        this.activeHandle = null;
        this.dragOffsetX_world = 0;
        this.dragOffsetY_world = 0;
        this.currentRect = {};
        this.dragStartPoint_screen = null;
    }

    handlePointerDown(e) {
        const screenPos = this.getScreenPos(e);
        this.dragStartPoint_screen = { x: screenPos.x, y: screenPos.y };

        if (e.button !== 0) return;

        const worldPointer = this.drawingUtils.screenToWorld(screenPos.x, screenPos.y, this.appState.scale);
        const isInsideDrawingArea = this.isInsideDrawingArea(screenPos);

        if (this.appState.selectedShape && isInsideDrawingArea) {
            const handle = this.appState.selectedShape.getHandleAtPoint(worldPointer.x, worldPointer.y, this.appState.scale);
            if (handle) {
                this.currentOperation = 'resize';
                this.activeHandle = handle.name;
                this.canvas.style.cursor = handle.cursor;
                return;
            }
        }

        if (isInsideDrawingArea) {
            const clickedShape = this.getShapeAtPoint(worldPointer.x, worldPointer.y);
            if (clickedShape) {
                this.appState.selectedShape = clickedShape;
                this.currentOperation = 'drag';
                this.appState.selectedShape.isBeingDragged = false;
                this.dragOffsetX_world = worldPointer.x - this.appState.selectedShape.x;
                this.dragOffsetY_world = worldPointer.y - this.appState.selectedShape.y;
            } else {
                this.appState.selectedShape = null;
                this.currentOperation = 'draw';
                this.currentRect = {
                    x_world: Math.max(0, worldPointer.x),
                    y_world: Math.max(0, worldPointer.y),
                    w_world: 0,
                    h_world: 0
                };
                this.appState.currentRect = this.currentRect;
            }
        } else {
            this.currentOperation = 'none';
            this.appState.selectedShape = null;
        }

        this.callbacks.updatePropertyInspector();
        this.callbacks.drawAll();
    }

    handlePointerMove(e) {
        const screenPos = this.getScreenPos(e);
        const worldPointer = this.drawingUtils.screenToWorld(screenPos.x, screenPos.y, this.appState.scale);

        this.callbacks.updateCoordsDisplay(worldPointer);

        const isInitialClickInsideDrawingArea = this.dragStartPoint_screen && this.isInsideDrawingArea(this.dragStartPoint_screen);
        if (!isInitialClickInsideDrawingArea && this.currentOperation !== 'none') {
            return;
        }

        switch (this.currentOperation) {
            case 'resize':
                this.performResize(worldPointer);
                break;
            case 'drag':
                this.performDrag(worldPointer);
                break;
            case 'draw':
                this.performDraw(worldPointer);
                break;
            default:
                this.updateCanvasCursor(screenPos);
                break;
        }
    }

    handlePointerUp(e) {
        const screenPos = this.getScreenPos(e);
        const upPointIsInside = this.isInsideDrawingArea(screenPos);

        if (this.currentOperation === 'draw' && this.dragStartPoint_screen) {
            this.finalizeDrawing(screenPos);
        } else if (this.currentOperation === 'drag' && this.appState.selectedShape) {
            if (this.appState.selectedShape.isBeingDragged) {
                this.callbacks.saveHistoryState();
            }
            this.appState.selectedShape.isBeingDragged = false;
        } else if (this.currentOperation === 'resize' && this.appState.selectedShape) {
            this.appState.selectedShape.w = Math.max(minShapeSize, this.appState.selectedShape.w);
            this.appState.selectedShape.h = Math.max(minShapeSize, this.appState.selectedShape.h);
            this.appState.selectedShape.x = Math.max(0, this.appState.selectedShape.x);
            this.appState.selectedShape.y = Math.max(0, this.appState.selectedShape.y);
            this.callbacks.saveHistoryState();
        }

        this.currentOperation = 'none';
        this.activeHandle = null;
        this.dragStartPoint_screen = null;
        this.currentRect = {};
        this.appState.currentRect = this.currentRect;

        this.updateCanvasCursor(screenPos);
        this.callbacks.drawAll();
    }

    performResize(worldPointer) {
        if (!this.appState.selectedShape || !this.activeHandle) return;

        let { x, y, w, h } = this.appState.selectedShape;
        const clampedWorldPointerX = Math.max(0, worldPointer.x);
        const clampedWorldPointerY = Math.max(0, worldPointer.y);

        let potentialNewX = x, potentialNewY = y, potentialNewW = w, potentialNewH = h;

        switch (this.activeHandle) {
            case 'tl':
                potentialNewW = Math.max(minShapeSize, x + w - clampedWorldPointerX);
                potentialNewH = Math.max(minShapeSize, y + h - clampedWorldPointerY);
                potentialNewX = x + w - potentialNewW;
                potentialNewY = y + h - potentialNewH;
                break;
            case 'tm':
                potentialNewH = Math.max(minShapeSize, y + h - clampedWorldPointerY);
                potentialNewY = y + h - potentialNewH;
                break;
            case 'tr':
                potentialNewW = Math.max(minShapeSize, clampedWorldPointerX - x);
                potentialNewH = Math.max(minShapeSize, y + h - clampedWorldPointerY);
                potentialNewY = y + h - potentialNewH;
                break;
            case 'ml':
                potentialNewW = Math.max(minShapeSize, x + w - clampedWorldPointerX);
                potentialNewX = x + w - potentialNewW;
                break;
            case 'mr':
                potentialNewW = Math.max(minShapeSize, clampedWorldPointerX - x);
                break;
            case 'bl':
                potentialNewW = Math.max(minShapeSize, x + w - clampedWorldPointerX);
                potentialNewH = Math.max(minShapeSize, clampedWorldPointerY - y);
                potentialNewX = x + w - potentialNewW;
                potentialNewY = y;
                break;
            case 'bm':
                potentialNewH = Math.max(minShapeSize, clampedWorldPointerY - y);
                potentialNewY = y;
                break;
            case 'br':
                potentialNewW = Math.max(minShapeSize, clampedWorldPointerX - x);
                potentialNewH = Math.max(minShapeSize, clampedWorldPointerY - y);
                potentialNewY = y;
                break;
        }

        const snappedDims = this.applySnapping(this.appState.selectedShape, potentialNewX, potentialNewY, potentialNewW, potentialNewH, true, this.activeHandle);

        this.appState.selectedShape.x = Math.max(0, snappedDims.x);
        this.appState.selectedShape.y = Math.max(0, snappedDims.y);
        this.appState.selectedShape.w = Math.max(minShapeSize, snappedDims.w);
        this.appState.selectedShape.h = Math.max(minShapeSize, snappedDims.h);

        this.callbacks.updatePropertyInspector();
        this.callbacks.drawAll();
    }

    performDrag(worldPointer) {
        if (!this.appState.selectedShape) return;
        this.appState.selectedShape.isBeingDragged = true;
        const targetX = worldPointer.x - this.dragOffsetX_world;
        const targetY = worldPointer.y - this.dragOffsetY_world;
        const snappedPos = this.applySnapping(this.appState.selectedShape, targetX, targetY, this.appState.selectedShape.w, this.appState.selectedShape.h);
        this.appState.selectedShape.x = Math.max(0, snappedPos.x);
        this.appState.selectedShape.y = Math.max(0, snappedPos.y);
        this.callbacks.updatePropertyInspector();
        this.callbacks.drawAll();
    }

    performDraw(worldPointer) {
        const clampedWorldPointerX = Math.max(0, worldPointer.x);
        const clampedWorldPointerY = Math.max(0, worldPointer.y);
        this.currentRect.w_world = clampedWorldPointerX - this.currentRect.x_world;
        this.currentRect.h_world = clampedWorldPointerY - this.currentRect.y_world;
        this.callbacks.drawAll();
    }

    finalizeDrawing(upScreenPos) {
        const dx_screen = Math.abs(upScreenPos.x - this.dragStartPoint_screen.x);
        const dy_screen = Math.abs(upScreenPos.y - this.dragStartPoint_screen.y);

        if (dx_screen > dragStartThreshold || dy_screen > dragStartThreshold) {
            const { x_world: x1, y_world: y1, w_world, h_world } = this.currentRect;
            const x2 = x1 + w_world;
            const y2 = y1 + h_world;

            let finalWorldX = Math.max(0, Math.min(x1, x2));
            let finalWorldY = Math.max(0, Math.min(y1, y2));
            let finalWorldW = Math.abs(x2 - x1);
            let finalWorldH = Math.abs(y2 - y1);

            const snappedFinalDims = this.applySnapping(null, finalWorldX, finalWorldY, finalWorldW, finalWorldH);

            finalWorldX = Math.max(0, snappedFinalDims.x);
            finalWorldY = Math.max(0, snappedFinalDims.y);
            finalWorldW = Math.max(minShapeSize, snappedFinalDims.w);
            finalWorldH = Math.max(minShapeSize, snappedFinalDims.h);

            if (finalWorldW >= minShapeSize && finalWorldH >= minShapeSize) {
                const newShape = new Rectangle(null, finalWorldX, finalWorldY, finalWorldW, finalWorldH);
                this.appState.shapes.push(newShape);
                this.appState.selectedShape = newShape;
                this.callbacks.saveHistoryState();
                this.callbacks.updatePropertyInspector();
            }
        }
    }

    getSnapTargets(excludeShape) {
        const targets = [];
        this.appState.shapes.forEach(shape => {
            if (shape === excludeShape) return;
            targets.push({ x: shape.x, type: 'left', shape: shape });
            targets.push({ x: shape.x + shape.w, type: 'right', shape: shape });
            targets.push({ y: shape.y, type: 'bottom', shape: shape });
            targets.push({ y: shape.y + shape.h, type: 'top', shape: shape });
        });
        targets.push({ x: 0, type: 'axisOriginX' });
        targets.push({ y: 0, type: 'axisOriginY' });
        return targets;
    }

    applySnapping(shape, currentX, currentY, currentW, currentH, isResizing = false, handleName = null) {
        let newX = currentX;
        let newY = currentY;
        let newW = currentW;
        let newH = currentH;
        const snapTargets = this.getSnapTargets(shape);
        const xEdges = [
            { original: currentX, snapped: currentX, edgeType: 'left' },
            { original: currentX + currentW, snapped: currentX + currentW, edgeType: 'right' }
        ];
        if (isResizing) {
            if (!handleName.includes('l') && !handleName.includes('r')) {
                xEdges.length = 0;
            } else if (handleName.includes('l')) {
                xEdges.splice(1, 1);
            } else if (handleName.includes('r')) {
                xEdges.splice(0, 1);
            }
        }
        for (const edge of xEdges) {
            for (const target of snapTargets) {
                if (target.x !== undefined && Math.abs(edge.original - target.x) < snapThreshold_world) {
                    edge.snapped = target.x;
                    break;
                }
            }
        }
        if (xEdges.length === 1) {
            if (xEdges[0].edgeType === 'left') {
                const deltaX = xEdges[0].snapped - currentX;
                newX = xEdges[0].snapped;
                newW = Math.max(minShapeSize, currentW - deltaX);
            } else {
                newW = Math.max(minShapeSize, xEdges[0].snapped - currentX);
            }
        } else if (xEdges.length === 2) {
            if (xEdges[0].snapped !== xEdges[0].original) {
                newX = xEdges[0].snapped;
            } else if (xEdges[1].snapped !== xEdges[1].original) {
                newX = xEdges[1].snapped - currentW;
            }
        }
        const yEdges = [
            { original: currentY, snapped: currentY, edgeType: 'bottom' },
            { original: currentY + currentH, snapped: currentY + currentH, edgeType: 'top' }
        ];
        if (isResizing) {
            if (!handleName.includes('t') && !handleName.includes('b')) {
                yEdges.length = 0;
            } else if (handleName.includes('b')) {
                yEdges.splice(1, 1);
            } else if (handleName.includes('t')) {
                yEdges.splice(0, 1);
            }
        }
        for (const edge of yEdges) {
            for (const target of snapTargets) {
                if (target.y !== undefined && Math.abs(edge.original - target.y) < snapThreshold_world) {
                    edge.snapped = target.y;
                    break;
                }
            }
        }
        if (yEdges.length === 1) {
            if (yEdges[0].edgeType === 'bottom') {
                const deltaY = yEdges[0].snapped - currentY;
                newY = yEdges[0].snapped;
                newH = Math.max(minShapeSize, currentH - deltaY);
            } else {
                newH = Math.max(minShapeSize, yEdges[0].snapped - currentY);
            }
        } else if (yEdges.length === 2) {
            if (yEdges[0].snapped !== yEdges[0].original) {
                newY = yEdges[0].snapped;
            } else if (yEdges[1].snapped !== yEdges[1].original) {
                newY = yEdges[1].snapped - currentH;
            }
        }
        return { x: newX, y: newY, w: newW, h: newH };
    }

    isInsideDrawingArea(screenPos) {
        return screenPos.x > this.drawingUtils.axisMargin && screenPos.y < this.canvas.height - this.drawingUtils.axisMargin;
    }

    getScreenPos(event) {
        const canvasRect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - canvasRect.left,
            y: event.clientY - canvasRect.top
        };
    }

    getShapeAtPoint(worldX, worldY) {
        for (let i = this.appState.shapes.length - 1; i >= 0; i--) {
            if (this.appState.shapes[i].isPointInside(worldX, worldY)) {
                return this.appState.shapes[i];
            }
        }
        return null;
    }

    updateCanvasCursor(screenPos) {
        let newCursor = 'default';
        if (this.isInsideDrawingArea(screenPos)) {
            newCursor = 'crosshair';
            if (this.appState.selectedShape) {
                const worldPointer = this.drawingUtils.screenToWorld(screenPos.x, screenPos.y, this.appState.scale);
                const handle = this.appState.selectedShape.getHandleAtPoint(worldPointer.x, worldPointer.y, this.appState.scale);
                if (handle) {
                    newCursor = handle.cursor;
                } else if (this.appState.selectedShape.isPointInside(worldPointer.x, worldPointer.y)) {
                    newCursor = 'move';
                }
            }
        }
        this.canvas.style.cursor = newCursor;
    }
}