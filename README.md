# LayoutVibe Editor

LayoutVibe is a simple 2D layout editor designed for creating and manipulating rectangular areas. It functions as a Progressive Web App (PWA), enabling offline use. The editor provides an intuitive interface for drawing, modifying, and managing layouts, which can be saved, loaded, and exported.

## Project Requirements Fulfillment

| Kategorie | Popis | Splněno | Způsob splnění a odůvodnění |
| :--- | :--- | :---: | :--- |
| **Dokumentace** | Cíl projektu, postup, popis funkčnosti, komentáře ve zdrojovém kódu | Ano | Tento `README.md` soubor popisuje cíl, funkčnost a strukturu projektu. Zdrojové kódy jsou rozděleny do logických modulů a tříd, což usnadňuje orientaci. |
| **HTML 5** | Validní použití HTML5 doctype a fungující v moderních prohlížečích | Ano | Soubor `index.html` začíná deklarací `<!DOCTYPE html>` a aplikace je testována pro moderní prohlížeče. |
| **HTML 5** | Správné použití sémantických značek | Ano | Aplikace používá sémantické značky pro strukturování obsahu, jako jsou `<header>`, `<main>`, `<aside>`, a `<footer>`. |
| **HTML 5** | Grafika - SVG / Canvas | Ano | Aplikace využívá `<canvas>` pro kreslení a interakci s objekty. Dále dynamicky generuje SVG (`createSvgSummary` v `dataManager.js`) pro zobrazení souhrnu objektů. |
| **HTML 5** | Média - Audio/Video | Ano | V nápovědě je použit prvek `<video>` pro přehrání instruktážního videa. |
| **HTML 5** | Formulářové prvky (Validace, typy, placeholder, atd.) | Ano | Využívají se formulářové prvky jako `<input type="text">`, `<input type="file">`, `<select>` a `<button>` pro interakci s uživatelem. Validace je řešena v JS (např. unikátnost ID v `_handleShapeIdChange` v `app.js`). |
| **HTML 5** | Offline aplikace | Ano | Aplikace je navržena jako PWA s `manifest.json` a registruje `service worker` (`main.js`) pro offline funkčnost. |
| **CSS** | Pokročilé selektory | Ano | V `index.html` se prostřednictvím Tailwind CSS používají pseudotřídy a kombinátory jako `:hover` a `active:`. |
| **CSS** | CSS3 transitions/animations | Ano | Tlačítka a další UI prvky využívají CSS přechody a transformace pro plynulé vizuální efekty při interakci (např. `transition-all`, `active:scale-95`). |
| **CSS** | Media queries | Ano | Rozhraní je responzivní díky použití breakpointů Tailwind CSS (např. `md:`, `sm:`, `lg:`), které zajišťují funkčnost na mobilních zařízeních i na desktopu. |
| **Javascript** | OOP přístup (prototypová dědičnost, jmenné prostory) | Ano | Celá aplikace je postavena na objektově orientovaném přístupu s využitím ES6 tříd (`App`, `InteractionManager`, `Rectangle`, `BaseShape`), které fungují na bázi prototypové dědičnosti. |
| **Javascript** | Použití JS frameworku či knihovny | Ano | Projekt využívá knihovnu **Tailwind CSS** pro stylování a **Font Awesome** pro ikony, což je deklarováno v `index.html`. |
| **Javascript** | Použití pokročilých JS API | Ano | Projekt aktivně využívá: **File API** (`FileReader` v `importFromFile` v `dataManager.js`), **Drag & Drop** (implementováno manuálně přes pointer události v `interactionManager.js`), a **LocalStorage API** (`localStorage.setItem` a `getItem` v `dataManager.js`). |
| **Javascript** | Funkční historie (History API) | Ano | Aplikace využívá **History API** (`window.history.pushState`, `replaceState`, a `popstate` event) pro ukládání a obnovování stavu, což umožňuje použití tlačítek zpět/vpřed v prohlížeči pro undo/redo (`_saveHistoryState`, `_restoreShapesFromState` v `app.js`). |
| **Javascript** | Ovládání médií | Ano | Aplikace ovládá přehrávání videa v modálním okně nápovědy – pozastaví video při zavření okna (`_closeHelpModal` v `app.js`). |
| **Javascript** | Offline aplikace (využití JS API pro zjišťování stavu) | Ano | Aplikace detekuje stav online/offline pomocí `navigator.onLine` a posluchačů událostí `online` a `offline` pro aktualizaci UI (`_updateOnlineStatus` v `app.js`). |
| **Javascript** | JS práce se SVG | Ano | Třída `DataManager` dynamicky vytváří a upravuje SVG elementy (`createElementNS`) pro zobrazení souhrnu tvarů a přidává na ně posluchače událostí (`createSvgSummary`, `_handleShowSvgSummary` v `app.js` a `dataManager.js`). |
| **Ostatní** | Kompletnost řešení | Ano | Aplikace je funkční, samostatná a splňuje všechny popsané funkce od kreslení až po export. |
| **Ostatní** | Estetické zpracování | Ano | Použitím Tailwind CSS je dosaženo moderního a responzivního designu s konzistentním vzhledem. |

## Features

* **Canvas-based Editing**: A fully interactive canvas for all layout operations.
* **Shape Manipulation**:
    * **Drawing**: Create new rectangular shapes by clicking and dragging on the canvas.
    * **Selection**: Select shapes with a simple click.
    * **Dragging**: Move selected shapes across the canvas.
    * **Resizing**: Adjust the width and height of shapes using resize handles on their edges and corners.
    * **Deletion**: Remove selected shapes via a dedicated button or keyboard shortcuts (`Delete`/`Backspace`).
* **Snapping**: Shapes automatically snap to other shapes and the origin axes for precise alignment.
* **Object Properties**:
    * An inspector panel displays and allows editing of the selected shape's ID and type ("Active" or "Dead").
    * Displays real-time coordinates and dimensions of the selected object.
* **Interaction and Navigation**:
    * **Zoom**: Zoom in and out using the mouse wheel or dedicated buttons.
    * **View Reset**: Instantly reset the zoom level and view to the default state.
    * **Keyboard Shortcuts**:
        * Move selected objects using arrow keys.
        * Copy (`Ctrl+C`), paste (`Ctrl+V`), undo (`Ctrl+Z`), and redo (`Ctrl+Y`) operations.
* **Data Management**:
    * **Local Storage**: Save the current layout to the browser's local storage and load it back later. The application automatically loads data from local storage on startup if available.
    * **JSON Export/Import**: Export the layout as a `layout.json` file and import layouts from JSON files.
* **User Experience**:
    * **Undo/Redo History**: Navigate through changes using the browser's history (Back/Forward buttons) or dedicated UI buttons.
    * **PWA Ready**: Installable as a standalone application that works offline.
    * **Help Modal**: An integrated help dialog with a video tutorial explains the editor's controls.
    * **Status & Coordinates Display**: A footer provides status messages, live cursor coordinates, and the current zoom level.
    * **SVG Summary**: The property inspector can show an SVG summary of shape types present in the layout.

## How to Use

1.  **Open the Application**: Launch the `index.html` file in a web browser.
2.  **Drawing a Shape**: Click the left mouse button on the canvas and drag to define the size of the new rectangle. Release the button to finalize its creation.
3.  **Selecting a Shape**: Click on any existing shape. This will highlight it with a blue border and show its resize handles. Its details will appear in the "Vlastnosti Objektu" (Object Properties) panel.
4.  **Moving a Shape**: Click on a selected shape and drag it to a new position. The shape will snap to the axes or other shapes when it gets close. Alternatively, use the **Arrow Keys** to move the selected shape in small increments.
5.  **Resizing a Shape**: Click and drag any of the eight handles on the border of a selected shape to change its dimensions.
6.  **Editing Properties**: With a shape selected, use the form in the right-hand panel to change its ID or its type ("Aktivní" or "Mrtvá Zóna").
7.  **Saving Your Work**: Click the **"Uložit"** (Save) button in the header to save the current layout to your browser's local storage.
8.  **Loading Work**: Click the **"Načíst"** (Load) button to load a previously saved layout from local storage.
9.  **Exporting/Importing**:
    * Use the **"Export"** button to download the layout as a `layout.json` file.
    * Click **"Import"**, select a valid `layout.json` file, and the editor will load the layout from it.
10. **Navigating History**: Use the **"Zpět"** (Undo) and **"Vpřed"** (Redo) buttons, or `Ctrl+Z` / `Ctrl+Y`, to step through your recent changes.

## Project Structure

The project is modular, with responsibilities separated into different JavaScript files.

* `index.html`: The main HTML file that defines the user interface, including the canvas, toolbars, and property inspector.
* `main.js`: The entry point of the application which initializes the `App` class and registers the service worker for PWA functionality.
* `app.js`: The core application class. It manages the application state (shapes, selection), initializes all managers, and handles event listeners for the UI elements outside the canvas.
* `interactionManager.js`: Manages all pointer events on the canvas, including drawing, dragging, and resizing operations. It also handles the logic for snapping shapes.
* `dataManager.js`: Handles all data-related tasks, such as saving to and loading from local storage, as well as importing and exporting JSON files. It also generates the SVG summary view.
* `canvasDrawingUtils.js`: A utility class containing methods for drawing elements on the canvas, such as the grid, axes, and shapes. It also handles coordinate transformations between screen and world space.
* `rectangle.js`: A class representing a rectangle shape. It contains logic for drawing itself, its selection handles, and checking for point intersections.
* `baseshape.js`: A base class from which `Rectangle` inherits, providing common properties like ID, position, and type.
* `uuid.js`: A simple utility class for generating unique identifiers (UUIDs) for new shapes.
* `manifest.json`: The manifest file for the Progressive Web App, defining the app's name, icons, and display properties.
* `sw.js`: The service worker file (its registration in `main.js` indicates its purpose is for PWA offline capabilities).

## Data Structures

### JSON Export/Import Format

The application expects a JSON object with a root key `areas`, which contains an array of shape objects. Each shape object has the following structure:

```json
{
  "id": "c2a9a71a-4ab9-4c57-82d2-5b9c2b9c24b9",
  "type": "active",
  "shape": {
    "type": "rectangle",
    "coords": [110.55, 120.10, 150.00, 75.50]
  }
}