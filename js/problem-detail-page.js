/**
 * Bouldering Problems Tracker - Problem Detail Page Logic
 * Handles initialization and event listeners specific to problem-detail.html.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Ensure the global app object exists
    window.BoulderingApp = window.BoulderingApp || {};

    // Get access to the app modules (excluding elements)
    const {
        config,
        state,
        // elements, // Removed
        utils,
        dataManager,
        map,
        uiRenderer
    } = window.BoulderingApp;

    let currentCircuitId = null;
    let currentProblemId = null;
    let currentProblem = null;
    let currentCircuit = null;
    let tempLocation = null; // For storing location picked on the map before confirming

    // DOM Elements specific to this page (assuming IDs match the HTML)
    const problemTitle = document.getElementById('problem-title');
    const problemNumberSpan = document.getElementById('problem-number');
    const circuitNameSpan = document.getElementById('circuit-name');
    const statusSelect = document.getElementById('problem-status-select');
    const colorBox = document.getElementById('problem-color-box');
    const colorLabel = document.getElementById('problem-color-label');
    const notesTextarea = document.getElementById('problem-notes-textarea');
    const mapContainer = document.getElementById('problem-map-container');
    const mapImage = document.getElementById('problem-map-image');
    const pinIndicator = document.getElementById('problem-pin-indicator');
    const locationCoordsP = document.getElementById('location-coordinates');
    const setLocationBtn = document.getElementById('set-location-btn');
    const saveDetailsBtn = document.getElementById('save-details-btn');
    const backToProblemsBtn = document.getElementById('back-to-problems-btn');

    // Location Setting Map Elements
    const locationSettingView = document.getElementById('location-setting-map-view');
    const locationSettingMapImage = document.getElementById('location-setting-map-image');
    const confirmLocationBtn = document.getElementById('confirm-location-btn');
    const cancelLocationBtn = document.getElementById('cancel-location-btn');


    /**
     * Get circuit and problem IDs from URL query parameters.
     * @returns {{circuitId: string|null, problemId: string|null}}
     */
    function getIdsFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return {
            circuitId: params.get('circuitId'),
            problemId: params.get('problemId')
        };
    }

    /**
     * Navigate back to the problems list page for the current circuit.
     */
    function navigateToProblemsList() {
        if (currentCircuitId) {
            window.location.href = `problems.html?circuitId=${currentCircuitId}`;
        } else {
            // Fallback if circuitId is somehow lost
            window.location.href = 'circuits.html';
        }
    }

    /**
     * Populates the page with the details of the current problem.
     */
    function populateProblemDetails() {
        if (!currentProblem || !currentCircuit) {
            console.error("Problem or circuit data not loaded.");
            // Maybe display an error message on the page
            if (problemTitle) problemTitle.textContent = "Error loading problem details.";
            return;
        }

        if (problemNumberSpan) problemNumberSpan.textContent = currentProblem.number;
        if (circuitNameSpan) circuitNameSpan.textContent = currentCircuit.name;
        if (statusSelect) statusSelect.value = currentProblem.status;
        if (notesTextarea) notesTextarea.value = currentProblem.note || '';

        // Display color
        const colorInfo = config.COLOR_OPTIONS[currentCircuit.colorKey] || { name: 'Unknown', color: '#ccc' };
         if (colorBox) colorBox.style.backgroundColor = colorInfo.color;
         if (colorLabel) colorLabel.textContent = colorInfo.name;


        // Display location pin and coordinates
        displayProblemLocation();

        // Update title dynamically
        document.title = `Problem ${currentProblem.number} - ${currentCircuit.name}`;
    }

    /**
     * Displays the problem's location pin and coordinates text.
     */
    function displayProblemLocation() {
        if (!currentProblem || !pinIndicator || !locationCoordsP || !mapImage) return;

        pinIndicator.innerHTML = ''; // Clear previous pin

        if (currentProblem.location) {
            const pin = document.createElement('div');
            pin.className = `problem-pin ${currentProblem.status}`;
            pin.style.left = `${currentProblem.location.x}%`;
            pin.style.top = `${currentProblem.location.y}%`;
            pin.style.backgroundColor = config.STATUS_COLORS[currentProblem.status] || '#888';
            pin.title = `Problem ${currentProblem.number}`; // Tooltip
            pinIndicator.appendChild(pin);

            locationCoordsP.textContent = `Location: X: ${currentProblem.location.x.toFixed(1)}%, Y: ${currentProblem.location.y.toFixed(1)}%`;
        } else {
            locationCoordsP.textContent = 'Location not set.';
        }
    }

    /**
     * Shows the map view for setting the problem's location.
     */
    function showLocationSettingMap() {
        if (!locationSettingView || !mapContainer) return;
        tempLocation = null; // Reset temporary location
        locationSettingView.style.display = 'block';
        mapContainer.style.display = 'none'; // Hide the static map display
        // Potentially render other pins for context if needed
    }

    /**
     * Hides the map view for setting the problem's location.
     */
    function hideLocationSettingMap() {
        if (!locationSettingView || !mapContainer) return;
        locationSettingView.style.display = 'none';
        mapContainer.style.display = 'block'; // Show the static map display again
    }

    /**
     * Handles clicks on the location setting map.
     * @param {Event} event
     */
    function handleLocationMapClick(event) {
        if (!locationSettingMapImage) return;
        const rect = locationSettingMapImage.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        tempLocation = { x, y };

        // Optionally, show a temporary marker on the setting map
        console.log("Temporary location set:", tempLocation);
        // You could add a visual indicator here if desired
        alert(`Location selected: X=${x.toFixed(1)}%, Y=${y.toFixed(1)}%. Click Confirm to save.`);
    }

    /**
     * Confirms the selected temporary location and updates the problem data.
     */
    function confirmLocation() {
        if (!currentProblem || !tempLocation) {
            alert("No location selected on the map.");
            return;
        }
        currentProblem.location = { ...tempLocation }; // Update problem object
        displayProblemLocation(); // Update the static map display
        hideLocationSettingMap();
        alert("Location updated. Remember to click 'Save Changes'.");
    }


    /**
     * Saves all changes made on the detail page (status, notes, location).
     */
    function saveChanges() {
        if (!currentCircuitId || !currentProblemId || !currentProblem || !statusSelect || !notesTextarea) {
            console.error("Missing data or elements to save changes.");
            alert("Error: Could not save changes.");
            return;
        }

        const newStatus = statusSelect.value;
        const newNotes = notesTextarea.value;
        // Location is already updated in currentProblem object by confirmLocation()

        dataManager.updateProblemDetails(currentCircuitId, currentProblemId, {
            status: newStatus,
            note: newNotes,
            location: currentProblem.location // Pass the potentially updated location
        });

        // Optionally provide feedback
        alert("Problem details saved successfully!");

        // Update the pin color based on the new status immediately
        displayProblemLocation();
    }

    // Initialize event listeners for the problem detail page
    function initEventListeners() {
        if (backToProblemsBtn) {
            backToProblemsBtn.addEventListener('click', navigateToProblemsList);
        }
        if (saveDetailsBtn) {
            saveDetailsBtn.addEventListener('click', saveChanges);
        }
        if (setLocationBtn) {
            setLocationBtn.addEventListener('click', showLocationSettingMap);
        }

        // Location Setting Map Listeners
        if (locationSettingMapImage) {
            locationSettingMapImage.addEventListener('click', handleLocationMapClick);
        }
        if (confirmLocationBtn) {
            confirmLocationBtn.addEventListener('click', confirmLocation);
        }
        if (cancelLocationBtn) {
            cancelLocationBtn.addEventListener('click', hideLocationSettingMap);
        }
    }

    // Initialize the problem detail page
    function init() {
        const ids = getIdsFromUrl();
        currentCircuitId = ids.circuitId;
        currentProblemId = ids.problemId;

        if (!currentCircuitId || !currentProblemId) {
            console.error("Circuit ID or Problem ID not found in URL.");
            if (problemTitle) problemTitle.textContent = "Error: Missing Circuit or Problem ID.";
            // Optionally redirect back
            // navigateToProblemsList();
            return;
        }

        // Load all circuit data first
        dataManager.loadCircuits();

        // Get the specific circuit and problem
        currentCircuit = dataManager.getCircuitById(currentCircuitId);
        currentProblem = dataManager.getProblemById(currentCircuitId, currentProblemId);

        if (!currentCircuit || !currentProblem) {
            console.error(`Circuit (${currentCircuitId}) or Problem (${currentProblemId}) not found.`);
             if (problemTitle) problemTitle.textContent = "Error: Circuit or Problem not found.";
            // Optionally redirect back
            // navigateToProblemsList();
            return;
        }

        // Populate the page elements
        populateProblemDetails();

        // Set up event listeners
        initEventListeners();
    }

    // Run initialization when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);

})();
