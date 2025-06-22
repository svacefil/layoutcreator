import { Rectangle } from './rectangle.js';

export class DataManager {
    constructor(uuidGen) {
        this.uuidGen = uuidGen;
        this.storageKey = 'layoutVibeData';
    }

    createSvgSummary(shapes) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100");
        svg.setAttribute("viewBox", "0 0 280 100");

        const counts = shapes.reduce((acc, shape) => {
            acc[shape.type] = (acc[shape.type] || 0) + 1;
            return acc;
        }, {});

        const typeColors = {
            'active': 'rgba(59, 130, 246, 0.7)',
            'passive': 'rgba(107, 114, 128, 0.7)',
            'wall': 'rgba(55, 65, 81, 0.7)'
        };

        let yOffset = 20;

        for (const [type, count] of Object.entries(counts)) {
            // Skupina pro řádek, aby byl celý klikatelný
            const group = document.createElementNS(svgNS, 'g');
            group.dataset.shapeType = type; // Uložíme si typ pro pozdější identifikaci
            group.style.cursor = "pointer";

            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', 10);
            rect.setAttribute('y', yOffset - 12);
            rect.setAttribute('width', 15);
            rect.setAttribute('height', 15);
            rect.setAttribute('fill', typeColors[type] || '#ccc');
            rect.setAttribute('rx', 3);
            group.appendChild(rect);

            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', 35);
            text.setAttribute('y', yOffset);
            text.textContent = `Typ '${type}': ${count}x`;
            group.appendChild(text);

            svg.appendChild(group);
            yOffset += 25;
        }

        if (Object.keys(counts).length === 0) {
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', '50%');
            text.setAttribute('y', '50%');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = 'Žádné objekty k zobrazení.';
            svg.appendChild(text);
        }

        return svg;
    }

    exportJSON(shapes) {
        if (shapes.length === 0) {
            alert("Není co exportovat.");
            return { success: false, message: "No shapes to export." };
        }
        const exportData = {
            areas: shapes.map(shape => shape.toJSON())
        };
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'layout.json';
        downloadLink.click();
        URL.revokeObjectURL(url);
        return { success: true, message: "Data exportována jako layout.json." };
    }

    saveToLocalStorage(appState) {
        try {
            const dataToSave = {
                shapes: appState.shapes.map(shape => shape.toJSON()),
                view: { scale: appState.scale }
            };
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            return { success: true, message: "Data uložena do LocalStorage." };
        } catch (e) {
            console.error(e);
            if (e.name === 'QuotaExceededError') {
                alert("Místní úložiště prohlížeče je plné.");
            }
            return { success: false, message: "Chyba při ukládání dat." };
        }
    }

    loadFromLocalStorage() {
        const savedJson = localStorage.getItem(this.storageKey);
        if (!savedJson) {
            return null;
        }
        try {
            const loadedData = JSON.parse(savedJson);
            if (!loadedData || !Array.isArray(loadedData.shapes)) {
                throw new Error("Uložená data nemají platný formát shapes.");
            }

            const shapes = this.parseShapes(loadedData.shapes);
            const view = loadedData.view || { scale: 1.0 };

            return { shapes, view };

        } catch (e) {
            console.error("Error loading from LocalStorage:", e);
            localStorage.removeItem(this.storageKey);
            alert("Chyba při načítání dat. Uložená data byla možná poškozena a smazána.");
            return null;
        }
    }

    importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (readEvent) => {
                try {
                    const importedData = JSON.parse(readEvent.target.result);
                    if (!importedData || !Array.isArray(importedData.areas)) {
                        throw new Error("Chybný JSON formát: očekává pole 'areas'.");
                    }
                    const shapes = this.parseShapes(importedData.areas);
                    resolve({ shapes, view: { scale: 1.0 } });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => {
                reject(new Error("Chyba při čtení souboru."));
            };
            reader.readAsText(file);
        });
    }

    parseShapes(shapeDataArray) {
        if (!Array.isArray(shapeDataArray)) return [];

        return shapeDataArray.map(area => {
            try {
                const shapeInfo = area.shape || area;
                const coords = shapeInfo.coords;

                if (shapeInfo.type === 'rectangle' && Array.isArray(coords) && coords.length === 4) {
                    const [x, y, w, h] = coords.map(Number);
                    if ([x, y, w, h].some(isNaN) || w <= 0 || h <= 0) return null;
                    return new Rectangle(area.id || this.uuidGen.generate(), x, y, w, h, area.type || 'active');
                }
                return null;
            } catch {
                return null;
            }
        }).filter(shape => shape !== null);
    }
}