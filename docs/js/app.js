import { UUIDGenerator } from './uuid.js';
import { Rectangle } from './rectangle.js';
import { CanvasDrawingUtils } from './canvasDrawingUtils.js';
import { InteractionManager } from './interactionManager.js';
import { DataManager } from './dataManager.js';

const keyboardMoveStep_world = 1;
const minScale = 0.1;
const maxScale = 10.0;
const zoomFactor = 1.1;

export class App {
    constructor() {
        this.dom = this._getDOMElements();
        this.ctx = this.dom.canvas.getContext('2d');

        this.appState = {
            shapes: [],
            selectedShape: null,
            scale: 1.0,
            currentRect: {}
        };
        this.copiedShapeData = null;
        this.currentlyHighlightedSvgType = null;

        const uuidGen = new UUIDGenerator();
        this.dataManager = new DataManager(uuidGen);
        this.drawingUtils = new CanvasDrawingUtils(this.dom.canvas, this.ctx, 30);
        this.interactionManager = new InteractionManager({
            canvas: this.dom.canvas,
            drawingUtils: this.drawingUtils,
            appState: this.appState,
            callbacks: {
                drawAll: this.drawAll.bind(this),
                updatePropertyInspector: this._updatePropertyInspector.bind(this),
                saveHistoryState: this._saveHistoryState.bind(this),
                updateCoordsDisplay: (worldPointer) => {
                    this.dom.coordsMessage.textContent = `X:${worldPointer.x.toFixed(1)}, Y:${worldPointer.y.toFixed(1)}`;
                }
            }
        });
    }

    init() {
        this._createSvgButton();
        this._bindEventListeners();

        const initialData = this.dataManager.loadFromLocalStorage();
        if (initialData) {
            this._applyLoadedData(initialData, "Data automaticky načtena.");
        } else {
            this._setStatusMessage("Aplikace připravena. Začněte kreslit!");
        }

        this._updateOnlineStatus();
        if(!initialData) {
            this._saveHistoryState('replace');
        }

        this._resizeCanvas();
        this.drawAll();
        this.interactionManager.updateCanvasCursor({ x: -1, y: -1 });
    }

    _createSvgButton() {
        const button = document.createElement('button');
        button.id = 'showSvgSummaryBtn';
        button.textContent = 'Zobrazit SVG Souhrn';
        button.className = 'w-full bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded mt-4 transition-colors duration-200';

        const inspectorContainer = this.dom.propertyInspectorContent.parentElement;
        inspectorContainer.appendChild(button);
    }

    _getDOMElements() {
        return {
            canvas: document.getElementById('drawingCanvas'),
            propertyInspectorContent: document.getElementById('propertyInspectorContent'),
            selectedShapeForm: document.getElementById('selectedShapeForm'),
            shapeIdInput: document.getElementById('shapeId'),
            shapeTypeSelect: document.getElementById('shapeType'),
            shapeDimensionsP: document.getElementById('shapeDimensions'),
            statusMessage: document.getElementById('statusMessage'),
            coordsMessage: document.getElementById('coordsMessage'),
            zoomLevelDisplay: document.getElementById('zoomLevelDisplay'),
            undoBtn: document.getElementById('undoBtn'),
            redoBtn: document.getElementById('redoBtn'),
            newLayoutBtn: document.getElementById('newLayoutBtn'),
            deleteShapeBtn: document.getElementById('deleteShapeBtn'),
            resetViewBtn: document.getElementById('resetViewBtn'),
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            exportJsonBtn: document.getElementById('exportJsonBtn'),
            importJsonFile: document.getElementById('importJsonFile'),
            saveBtn: document.getElementById('saveBtn'),
            loadBtn: document.getElementById('loadBtn'),
            helpModal: document.getElementById('helpModal'),
            helpVideo: document.getElementById('helpVideo'),
            helpBtn: document.getElementById('helpBtn'),
            closeHelpModal: document.getElementById('closeHelpModal'),
            onlineStatus: document.getElementById('onlineStatus')
        };
    }

    _bindEventListeners() {
        window.addEventListener('resize', this._resizeCanvas.bind(this));
        window.addEventListener('popstate', (e) => this._restoreShapesFromState(e.state));
        window.addEventListener('online', this._updateOnlineStatus.bind(this));
        window.addEventListener('offline', this._updateOnlineStatus.bind(this));

        document.addEventListener('keydown', this._handleKeyDown.bind(this));

        this.dom.canvas.addEventListener('pointerdown', (e) => this.interactionManager.handlePointerDown(e));
        this.dom.canvas.addEventListener('pointermove', (e) => this.interactionManager.handlePointerMove(e));
        this.dom.canvas.addEventListener('pointerup', (e) => this.interactionManager.handlePointerUp(e));
        this.dom.canvas.addEventListener('mouseleave', () => { this.dom.coordsMessage.textContent = 'X:--, Y:--'; });
        this.dom.canvas.addEventListener('wheel', this._handleWheel.bind(this));
        this.dom.canvas.addEventListener('contextmenu', e => e.preventDefault());

        this.dom.shapeIdInput.addEventListener('change', this._handleShapeIdChange.bind(this));
        this.dom.shapeTypeSelect.addEventListener('change', this._handleShapeTypeChange.bind(this));

        this.dom.deleteShapeBtn.addEventListener('click', this._handleDeleteShape.bind(this));
        this.dom.undoBtn.addEventListener('click', () => window.history.back());
        this.dom.redoBtn.addEventListener('click', () => window.history.forward());
        this.dom.newLayoutBtn.addEventListener('click', this._handleNewLayout.bind(this));
        this.dom.resetViewBtn.addEventListener('click', this._handleResetView.bind(this));
        this.dom.zoomInBtn.addEventListener('click', this._handleZoomIn.bind(this));
        this.dom.zoomOutBtn.addEventListener('click', this._handleZoomOut.bind(this));

        this.dom.exportJsonBtn.addEventListener('click', this._handleExport.bind(this));
        this.dom.importJsonFile.addEventListener('change', this._handleImport.bind(this));
        this.dom.saveBtn.addEventListener('click', this._handleSave.bind(this));
        this.dom.loadBtn.addEventListener('click', this._handleLoad.bind(this));

        this.dom.helpBtn.addEventListener('click', () => this.dom.helpModal.classList.remove('hidden'));
        this.dom.closeHelpModal.addEventListener('click', this._closeHelpModal.bind(this));
        this.dom.helpModal.addEventListener('click', (e) => {
            if (e.target === this.dom.helpModal) this._closeHelpModal();
        });

        document.getElementById('showSvgSummaryBtn').addEventListener('click', this._handleShowSvgSummary.bind(this));
    }

    _handleShowSvgSummary() {
        this.appState.selectedShape = null;
        this._updatePropertyInspector();

        const svgSummaryElement = this.dataManager.createSvgSummary(this.appState.shapes);

        svgSummaryElement.querySelectorAll('g[data-shape-type]').forEach(group => {
            group.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.shapeType;

                if (this.currentlyHighlightedSvgType === type) {
                    this.currentlyHighlightedSvgType = null;
                    this.drawAll(); // Zruší zvýraznění překreslením
                } else {
                    this.currentlyHighlightedSvgType = type;
                    this._highlightShapesByType(type);
                }
            });
        });

        this.dom.propertyInspectorContent.innerHTML = '';
        this.dom.propertyInspectorContent.appendChild(svgSummaryElement);
    }

    _highlightShapesByType(type) {
        this.drawAll();

        const shapesToHighlight = this.appState.shapes.filter(s => s.type === type);

        const ctx = this.drawingUtils.ctx;
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 4;

        shapesToHighlight.forEach(shape => {
            const { x: screenX, y: screenY } = this.drawingUtils.worldToScreen(shape.x, shape.y, this.appState.scale);
            const screenW = shape.w * this.appState.scale;
            const screenH = -shape.h * this.appState.scale;
            ctx.strokeRect(screenX, screenY, screenW, screenH);
        });
    }

    drawAll() {
        if (this.currentlyHighlightedSvgType) {
            this.currentlyHighlightedSvgType = null;
        }

        const stateForDrawing = {
            ...this.appState,
            currentOperation: this.interactionManager.currentOperation
        };
        this.drawingUtils.drawAll(stateForDrawing);
        this._updateZoomDisplay();
    }

    _resizeCanvas() {
        const parentContainer = this.dom.canvas.parentElement;
        this.dom.canvas.width = parentContainer.clientWidth;
        this.dom.canvas.height = parentContainer.clientHeight;
        this.drawAll();
    }

    _applyLoadedData(data, sourceMessage) {
        if (!data) return;
        this.appState.shapes = data.shapes;
        this.appState.scale = data.view?.scale || 1.0;
        this.appState.selectedShape = null;
        this.currentlyHighlightedSvgType = null;

        this._saveHistoryState('replace');
        this._updatePropertyInspector();
        this.drawAll();
        this._setStatusMessage(sourceMessage);
        this.interactionManager.updateCanvasCursor({ x: -1, y: -1 });
    }

    _handleKeyDown(e) {
        if (document.activeElement === this.dom.shapeIdInput) {
            if (e.key.startsWith("Arrow")) return;
            const isCtrl = e.ctrlKey || e.metaKey;
            if (isCtrl && ['c', 'v', 'x', 'a', 'z', 'y'].includes(e.key)) {
                return;
            }
        }

        const isCtrl = e.ctrlKey || e.metaKey;

        if (isCtrl && e.key === 'c' && this.appState.selectedShape) {
            e.preventDefault();
            this.copiedShapeData = { ...this.appState.selectedShape };
            this._setStatusMessage(`Objekt "${this.appState.selectedShape.id}" zkopírován.`);
        } else if (isCtrl && e.key === 'v' && this.copiedShapeData) {
            e.preventDefault();
            const { x, y, w, h, type } = this.copiedShapeData;
            const newShape = new Rectangle(null, Math.max(0, x + 10), Math.max(0, y + 10), w, h, type);
            this.appState.shapes.push(newShape);
            this.appState.selectedShape = newShape;
            this._saveHistoryState();
            this._updatePropertyInspector();
            this.drawAll();
            this._setStatusMessage(`Objekt vložen (ID: ${newShape.id}).`);
        } else if (isCtrl && e.key === 'z') {
            e.preventDefault();
            window.history.back();
        } else if (isCtrl && (e.key === 'y' || (e.key === 'Z' && e.shiftKey))) {
            e.preventDefault();
            window.history.forward();
        } else if (['Delete', 'Backspace'].includes(e.key) && this.appState.selectedShape && document.activeElement !== this.dom.shapeIdInput) {
            e.preventDefault();
            this._handleDeleteShape();
        } else if (e.key.startsWith("Arrow") && this.appState.selectedShape && document.activeElement !== this.dom.shapeIdInput) {
            e.preventDefault();
            let dx = 0, dy = 0;
            if (e.key === "ArrowLeft") dx = -keyboardMoveStep_world;
            if (e.key === "ArrowRight") dx = keyboardMoveStep_world;
            if (e.key === "ArrowUp") dy = keyboardMoveStep_world;
            if (e.key === "ArrowDown") dy = -keyboardMoveStep_world;
            this.appState.selectedShape.x = Math.max(0, this.appState.selectedShape.x + dx);
            this.appState.selectedShape.y = Math.max(0, this.appState.selectedShape.y + dy);
            this._saveHistoryState();
            this._updatePropertyInspector();
            this.drawAll();
        }
    }

    _handleWheel(e) {
        e.preventDefault();
        const newScale = e.deltaY < 0 ? this.appState.scale * zoomFactor : this.appState.scale / zoomFactor;
        this.appState.scale = Math.max(minScale, Math.min(maxScale, newScale));
        this.drawAll();
        this.interactionManager.updateCanvasCursor(this.interactionManager.getScreenPos(e));
    }

    _handleDeleteShape() {
        if (!this.appState.selectedShape) return;
        const deletedId = this.appState.selectedShape.id;
        this.appState.shapes = this.appState.shapes.filter(s => s !== this.appState.selectedShape);
        this.appState.selectedShape = null;
        this._saveHistoryState();
        this._updatePropertyInspector();
        this.drawAll();
        this._setStatusMessage(`Objekt ${deletedId} smazán.`);
        this.interactionManager.updateCanvasCursor({ x: -1, y: -1 });
    }

    _handleShapeIdChange(e) {
        if (!this.appState.selectedShape) return;
        const newId = e.target.value.trim();
        if (!newId) {
            alert("ID nesmí být prázdné.");
            e.target.value = this.appState.selectedShape.id;
        } else if (this.appState.shapes.some(s => s.id === newId && s !== this.appState.selectedShape)) {
            alert("ID musí být unikátní.");
            e.target.value = this.appState.selectedShape.id;
        } else {
            this.appState.selectedShape.id = newId;
            this._saveHistoryState();
        }
    }

    _handleShapeTypeChange(e) {
        if (this.appState.selectedShape) {
            this.appState.selectedShape.type = e.target.value;
            this._saveHistoryState();
            this.drawAll();
        }
    }

    _saveHistoryState(actionType = 'push') {
        const state = { shapes: this.appState.shapes.map(shape => shape.toJSON()) };
        if (actionType === 'replace') {
            window.history.replaceState(state, '');
        } else {
            window.history.pushState(state, '');
        }
    }

    _restoreShapesFromState(state) {
        if (!state || !Array.isArray(state.shapes)) return;
        this.appState.shapes = this.dataManager.parseShapes(state.shapes);
        this.appState.selectedShape = null;
        this.currentlyHighlightedSvgType = null;
        this._updatePropertyInspector();
        this.drawAll();
        this._setStatusMessage("Historie načtena (navigace prohlížeče).");
        this.interactionManager.updateCanvasCursor({ x: -1, y: -1 });
    }

    _handleNewLayout() {
        if (this.appState.shapes.length === 0 || confirm("Nový půdorys? Změny budou ztraceny, ale lze se vrátit zpět.")) {
            this._applyLoadedData({ shapes: [], view: { scale: 1.0 } }, "Nový půdorys vytvořen.");
        }
    }

    _handleResetView() {
        this.appState.scale = 1.0;
        this.drawAll();
        this._setStatusMessage("Pohled resetován.");
    }

    _handleZoomIn() {
        this.appState.scale = Math.min(maxScale, this.appState.scale * zoomFactor);
        this.drawAll();
    }

    _handleZoomOut() {
        this.appState.scale = Math.max(minScale, this.appState.scale / zoomFactor);
        this.drawAll();
    }

    _handleExport() {
        const result = this.dataManager.exportJSON(this.appState.shapes);
        if (result.success) this._setStatusMessage(result.message);
    }

    async _handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const data = await this.dataManager.importFromFile(file);
            this._applyLoadedData(data, 'Import úspěšný.');
        } catch (err) {
            alert('Chyba při importu: ' + err.message);
        } finally {
            event.target.value = null;
        }
    }

    _handleSave() {
        const result = this.dataManager.saveToLocalStorage(this.appState);
        this._setStatusMessage(result.message);
    }

    _handleLoad() {
        if (this.appState.shapes.length > 0 && !confirm("Načíst data? Aktuální změny budou ztraceny.")) return;
        const data = this.dataManager.loadFromLocalStorage();
        if (data) {
            this._applyLoadedData(data, "Data načtena z LocalStorage.");
        } else {
            alert("V LocalStorage nejsou žádná data.");
        }
    }

    _closeHelpModal() {
        this.dom.helpModal.classList.add('hidden');
        if (!this.dom.helpVideo.paused) this.dom.helpVideo.pause();
    }

    _updatePropertyInspector() {
        this.currentlyHighlightedSvgType = null;
        if (this.appState.selectedShape) {
            this.dom.propertyInspectorContent.innerHTML = '';
            this.dom.propertyInspectorContent.classList.add('hidden');
            this.dom.selectedShapeForm.classList.remove('hidden');
            const { id, type, x, y, w, h } = this.appState.selectedShape;
            this.dom.shapeIdInput.value = id;
            this.dom.shapeTypeSelect.value = type;
            this.dom.shapeDimensionsP.textContent = `X:${x.toFixed(1)}, Y:${y.toFixed(1)}, Š:${w.toFixed(1)}, V:${h.toFixed(1)}`;
        } else {
            this.dom.propertyInspectorContent.classList.remove('hidden');
            this.dom.selectedShapeForm.classList.add('hidden');
            this.dom.propertyInspectorContent.innerHTML = '<p class="text-gray-600">Není vybrán žádný objekt. Klikněte na objekt nebo nakreslete nový.</p>';
        }
    }

    _updateOnlineStatus() {
        const isOnline = navigator.onLine;
        this.dom.onlineStatus.textContent = isOnline ? "Online" : "Offline";
        this.dom.onlineStatus.className = `ml-1 sm:ml-3 p-1 px-2 rounded-md text-sm ${isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`;
    }

    _updateZoomDisplay() {
        this.dom.zoomLevelDisplay.textContent = `${(this.appState.scale * 100).toFixed(0)}%`;
    }

    _setStatusMessage(message) {
        this.dom.statusMessage.textContent = message;
    }
}