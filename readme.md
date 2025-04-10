# Bouldering Circuits App

This JavaScript code implements a bouldering circuits application that allows users to create, manage, and track their bouldering circuits.

## Features

*   **Circuit Management:**
    *   Create new circuits with a name, color, and number of problems.
    *   Delete existing circuits.
    *   View a list of all circuits, sorted by last viewed.
*   **Problem Tracking:**
    *   Mark problems as unattempted, flashed, sent, or project.
    *   Add notes to individual problems.
    *   View a grid of problems for the current circuit, filtered by status.
*   **Color Options:**
    *   Circuits can be assigned a color from a predefined set of options, including solid colors and gradients.
*   **Data Persistence:**
    *   Circuits and their associated data are stored in the browser's local storage.
*   **Map Integration:**
    *   Associate problems with locations on a map image.
*   **Import/Export:**
    *   Import circuits from a text file.
    *   Export circuits to a text file.

## Functionality

The code defines several functions to manage the bouldering circuits:

*   **`colorOptions`**: An object containing the available color options for circuits. Each color option has a `color` (hex code) and a `label` (display name). Some color options also have a `type` (solid or gradient) and an array of `colors` for gradients.
*   **`circuits`**: An array to store all circuits.
*   **`currentCircuitId`**: A variable to store the ID of the currently selected circuit.
*   **Modal Elements**: Variables to store references to HTML elements for the new circuit modal.
*   **Circuit Navigation**: Variables to store references to HTML elements for circuit navigation.
*   **Note Modal**: Variables to store references to HTML elements for the note modal.
*   **`selectProblemForLocation(problemId)`**: Function to select a problem for location on the map.
*   **`renderMap()`**: Function to render the map with problem pins.
*   **`toggleView()`**: Function to toggle between problem grid and map view.
*   **`openNoteModal(problemId)`**: Function to open the note modal for a specific problem.
*   **`populateColorDropdown()`**: Function to populate the color dropdown with the available color options.
*   **`loadCircuits()`**: Function to load circuits from local storage.
*   **`saveCircuits()`**: Function to save circuits to local storage.
*   **`renderCircuitsList()`**: Function to render the list of circuits.
*   **`increaseProblemCount()`**: Function to increase the number of problems in the current circuit.
*   **`decreaseProblemCount()`**: Function to decrease the number of problems in the current circuit.
*   **`generateId()`**: Function to generate a unique ID for a new circuit.
*   **`createNewCircuit(name, problemCount, colorKey)`**: Function to create a new circuit.
*   **`generateProblems(count, colorKey)`**: Function to generate problems for a new circuit.
*   **`addNoteToProblem(circuitId, problemId, note)`**: Function to add a note to a specific problem.
*   **`generateDefaultCircuitName(colorKey)`**: Function to generate a default circuit name based on the date and color.
*   **`updateLastViewed(circuitId)`**: Function to update the last viewed timestamp for a circuit.
*   **`loadCircuitDetails()`**: Function to load the details of the current circuit.
*   **`renderProblems()`**: Function to render the problems grid for the current circuit.
*   **`toggleProblem(id)`**: Function to toggle the completion status of a problem.
*   **`updateStats()`**: Function to update the statistics for the current circuit.
*   **Modal handling**: Functions to handle the new circuit modal.
*   **Back to circuits list**: Function to navigate back to the circuits list.
*   **`exportCircuits()`**: Function to export circuits to a text file.
*   **`importCircuits(event)`**: Function to import circuits from a text file.
*   **`parseCircuitData(dataStr)`**: Function to parse circuit data from a text file.
*   **Event Listeners**: Event listeners are added to various HTML elements to handle user interactions.
*   **Initialization**: The `DOMContentLoaded` event listener is used to initialize the app when the page is loaded.

## Usage

1.  Open the `index.html` file in a web browser.
2.  Click the "New Circuit" button to create a new circuit.
3.  Enter a name, problem count, and color for the circuit.
4.  Click the "Create" button to create the circuit.
5.  The new circuit will be added to the list of circuits.
6.  Click the "View" button to view the details of a circuit.
7.  In the circuit details view, you can:
    *   Mark problems as unattempted, flashed, sent, or project by clicking on them.
    *   Add notes to problems by clicking the note icon.
    *   Increase or decrease the number of problems in the circuit.
    *   Toggle between the problem grid and the map view.
    *   Reset the progress for the circuit.
8.  Click the "Back to Circuits" button to return to the list of circuits.
9.  Click the "Delete" button to delete a circuit.
10. Use the "Export" button to export the circuits to a text file.
11. Use the "Import" button to import circuits from a text file.
