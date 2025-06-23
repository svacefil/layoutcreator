# LayoutVibe Editor

LayoutVibe is a simple 2D layout editor designed for creating and manipulating rectangular areas. It functions as a Progressive Web App (PWA), enabling offline use. The editor provides an intuitive interface for drawing, modifying, and managing layouts, which can be saved, loaded, and exported.

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