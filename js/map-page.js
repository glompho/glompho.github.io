/**
 * Bouldering Problems Tracker - Map Page Logic
 * Handles initialization and event listeners specific to map.html.
 * Supports both global map view and circuit-specific map view.
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
        map, // Core map rendering logic
        noteModal, // For handling pin clicks -> modal
        uiRenderer // Potentially for pin styling/rendering helpers
    } = window.BoulderingApp;

    // Global Map View Elements
    const globalMapView = document.getElementById('global-map-view');
    const globalMapContainer = document.getElementById('global-map-container');
    const globalMapImage = document.getElementById('global-map-image');
    const globalProblemPins = document.getElementById('global-problem-pins');
    const globalShowUnattemptedCheckbox = document.getElementById('global-show-unattempted');
    const globalShowFlashedCheckbox = document.getElementById('global-show-flashed');
    const globalShowSentCheckbox = document.getElementById('global-show-sent');
    const globalShowProjectCheckbox = document.getElementById('global-show-project');
    const backToCircuitsFromGlobalMapBtn = document.getElementById('back-to-circuits-from-global-map');

    // Circuit-specific Map View Elements
    const circuitMapView = document.getElementById('circuit-map-view');
    const circuitNameOnMap = document.getElementById('circuit-name-on-map');
    const circuitMapContainer = document.getElementById('circuit-map-container');
    const circuitMapImage = document.getElementById('circuit-map-image');
    const circuitProblemPins = document.getElementById('circuit-problem-pins');
    const circuitShowUnattemptedCheckbox = document.getElementById('circuit-show-unattempted');
    const circuitShowFlashedCheckbox = document.getElementById('circuit-show-flashed');
    const circuitShowSentCheckbox = document.getElementById('circuit-show-sent');
    const circuitShowProjectCheckbox = document.getElementById('circuit-show-project');
    const backToProblemsBtn = document.getElementById('back-to-problems');
    const doneMappingBtn = document.getElementById('done-mapping');

    // Note Modal elements
    const noteModalElement = document.getElementById('noteModal');
    const noteCloseBtn = document.getElementById('noteClose');
    const noteModalTitle = document.getElementById('noteModalTitle');
    const noteModalCircuitNameSpan = document.getElementById('noteModalCircuitName');
    const noteStatusSelect = document.getElementById('noteStatusSelect');
    const noteInput = document.getElementById('noteInput');
    const saveNoteBtn = document.getElementById('saveNote');
    const viewProblemDetailsBtn = document.getElementById('view-problem-details');

    // State variables
    let currentCircuitId = null; // Track circuit ID for current view or pin click
    let currentProblemId = null; // Track problem ID if a pin is clicked
    let isLocationSettingMode = false; // Track if we're in location setting mode

    /**
     * Get circuit ID from URL query parameters.
     * @returns {string|null} The circuit ID or null if not found.
     */
    function getCircuitIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('circuitId');
    }

    /**
     * Get problem ID from URL query parameters.
     * @returns {string|null} The problem ID or null if not found.
     */
    function getProblemIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('problemId');
    }

    /**
     * Navigate back to the circuits list page.
     */
    function navigateToCircuits() {
        window.location.href = 'index.html';
    }

    /**
     * Navigate back to the problems page for the current circuit.
     */
    function navigateToProblems() {
        if (!currentCircuitId) {
            console.error("No circuit ID available for navigation.");
            navigateToCircuits(); // Fallback to circuits list
            return;
        }
        window.location.href = `problems.html?circuitId=${currentCircuitId}`;
    }

    /**
     * Navigate to the problem detail page.
     * @param {string} circuitId - The ID of the circuit.
     * @param {string} problemId - The ID of the problem to view.
     */
    function navigateToProblemDetail(circuitId, problemId) {
        if (!circuitId || !problemId) {
            console.error("Missing circuit or problem ID for navigation.");
            return;
        }
        window.location.href = `problem-detail.html?circuitId=${circuitId}&problemId=${problemId}`;
    }

    /**
     * Handles clicks on problem pins to open the note modal.
     * @param {Event} event - The click event.
     */
    function handlePinClick(event) {
        if (event.target.classList.contains('problem-pin')) {
            // If in location setting mode, don't open the modal
            if (isLocationSettingMode) return;

            const pinElement = event.target;
            const pinCircuitId = pinElement.dataset.circuitId;
            const pinProblemId = pinElement.dataset.problemId;

            if (pinCircuitId && pinProblemId) {
                const problem = dataManager.getProblemById(pinCircuitId, pinProblemId);
                const circuit = dataManager.getCircuitById(pinCircuitId);
                if (problem && circuit) {
                    currentCircuitId = pinCircuitId;
                    currentProblemId = pinProblemId;
                    // Pass circuit name to the modal opening function
                    noteModal.openModal(currentCircuitId, currentProblemId, circuit.name);
                    if (noteModalCircuitNameSpan) {
                        noteModalCircuitNameSpan.textContent = circuit.name;
                    }
                } else {
                    console.error(`Problem (${pinProblemId}) or Circuit (${pinCircuitId}) not found for pin click.`);
                }
            }
        }
    }

    /**
     * Handles clicks on the map when in location setting mode.
     * @param {Event} event - The click event.
     * @param {HTMLElement} mapElement - The map element that was clicked.
     */
    function handleMapClick(event, mapElement) {
        if (!isLocationSettingMode || !currentCircuitId || !currentProblemId) return;

        const rect = mapElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        // Update the problem's location
        dataManager.updateProblemLocation(currentCircuitId, currentProblemId, { x, y });
        
        // Re-render the circuit map to show the updated pin
        renderCircuitMap();
        
        // Provide feedback
        alert(`Location set for problem ${currentProblemId}. Click 'Done Setting Location' when finished.`);
    }

    /**
     * Gets the current state of the global filter checkboxes.
     * @returns {object} Filter state object.
     */
    function getGlobalFilterState() {
        return {
            unattempted: globalShowUnattemptedCheckbox ? globalShowUnattemptedCheckbox.checked : true,
            flashed: globalShowFlashedCheckbox ? globalShowFlashedCheckbox.checked : true,
            sent: globalShowSentCheckbox ? globalShowSentCheckbox.checked : true,
            project: globalShowProjectCheckbox ? globalShowProjectCheckbox.checked : true,
        };
    }

    /**
     * Gets the current state of the circuit filter checkboxes.
     * @returns {object} Filter state object.
     */
    function getCircuitFilterState() {
        return {
            unattempted: circuitShowUnattemptedCheckbox ? circuitShowUnattemptedCheckbox.checked : true,
            flashed: circuitShowFlashedCheckbox ? circuitShowFlashedCheckbox.checked : true,
            sent: circuitShowSentCheckbox ? circuitShowSentCheckbox.checked : true,
            project: circuitShowProjectCheckbox ? circuitShowProjectCheckbox.checked : true,
        };
    }

    /**
     * Renders the circuit-specific map with problem pins.
     */
    function renderCircuitMap() {
        if (!circuitProblemPins || !currentCircuitId) return;

        // Clear existing pins
        circuitProblemPins.innerHTML = '';

        const circuit = dataManager.getCircuitById(currentCircuitId);
        if (!circuit) {
            console.error(`Circuit with ID ${currentCircuitId} not found.`);
            return;
        }

        // Update circuit name display
        if (circuitNameOnMap) {
            circuitNameOnMap.textContent = circuit.name;
        }

        // Get filter state
        const filterState = getCircuitFilterState();

        // Render pins for this circuit's problems
        const problems = dataManager.getProblemsForCircuit(currentCircuitId);
        problems.forEach(problem => {
            // Skip problems without location
            if (!problem.location) return;

            // Apply filters
            if (!filterState[problem.status]) return;

            // Create pin element
            const pin = document.createElement('div');
            pin.className = `problem-pin ${problem.status}`;
            pin.dataset.problemId = problem.id;
            pin.dataset.circuitId = currentCircuitId;
            pin.style.left = `${problem.location.x}%`;
            pin.style.top = `${problem.location.y}%`;
            pin.style.backgroundColor = config.STATUS_COLORS[problem.status] || '#888';
            pin.title = `Problem ${problem.number}`; // Tooltip
            
            circuitProblemPins.appendChild(pin);
        });
    }

    /**
     * Initializes the map view based on URL parameters.
     */
    function initMapView() {
        // Get circuit ID from URL
        currentCircuitId = getCircuitIdFromUrl();
        currentProblemId = getProblemIdFromUrl();
        
        // Determine which view to show
        if (currentCircuitId) {
            // Circuit-specific view
            if (globalMapView) globalMapView.style.display = 'none';
            if (circuitMapView) circuitMapView.style.display = 'block';
            
            // Check if we're in location setting mode
            isLocationSettingMode = !!currentProblemId;
            
            // Render the circuit map
            renderCircuitMap();
        } else {
            // Global view
            if (globalMapView) globalMapView.style.display = 'block';
            if (circuitMapView) circuitMapView.style.display = 'none';
            
            // Render the global map
            if (globalProblemPins) {
                map.renderGlobalMap(globalProblemPins, getGlobalFilterState());
            }
        }
    }

    // Initialize event listeners for the map page
    function initEventListeners() {
        // Global Map View Listeners
        if (backToCircuitsFromGlobalMapBtn) {
            backToCircuitsFromGlobalMapBtn.addEventListener('click', navigateToCircuits);
        }

        if (globalProblemPins) {
            globalProblemPins.addEventListener('click', handlePinClick);
        }

        // Global filter checkboxes
        const globalFilterCheckboxes = [
            globalShowUnattemptedCheckbox,
            globalShowFlashedCheckbox,
            globalShowSentCheckbox,
            globalShowProjectCheckbox
        ];
        globalFilterCheckboxes.forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    if (globalProblemPins) {
                        map.renderGlobalMap(globalProblemPins, getGlobalFilterState());
                    }
                });
            }
        });

        // Circuit Map View Listeners
        if (backToProblemsBtn) {
            backToProblemsBtn.addEventListener('click', navigateToProblems);
        }

        if (doneMappingBtn) {
            doneMappingBtn.addEventListener('click', () => {
                if (isLocationSettingMode) {
                    // If setting location, go back to problems page
                    navigateToProblems();
                } else {
                    // Otherwise just hide the map view (shouldn't happen in separate page)
                    console.warn("Done mapping clicked but not in location setting mode.");
                }
            });
        }

        if (circuitProblemPins) {
            circuitProblemPins.addEventListener('click', handlePinClick);
        }

        if (circuitMapImage) {
            circuitMapImage.addEventListener('click', (event) => {
                handleMapClick(event, circuitMapImage);
            });
        }

        // Circuit filter checkboxes
        const circuitFilterCheckboxes = [
            circuitShowUnattemptedCheckbox,
            circuitShowFlashedCheckbox,
            circuitShowSentCheckbox,
            circuitShowProjectCheckbox
        ];
        circuitFilterCheckboxes.forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', renderCircuitMap);
            }
        });

        // Note Modal Listeners
        if (noteCloseBtn) {
            noteCloseBtn.onclick = function() {
                if (noteModalElement) noteModalElement.style.display = "none";
                // Don't reset IDs if in location setting mode
                if (!isLocationSettingMode) {
                    currentProblemId = null;
                }
            };
        }

        if (saveNoteBtn) {
            saveNoteBtn.onclick = () => {
                if (currentCircuitId && currentProblemId) {
                    noteModal.saveNote(currentCircuitId, currentProblemId, noteStatusSelect, noteInput);
                    // Re-render the appropriate map
                    if (currentCircuitId === getCircuitIdFromUrl()) {
                        renderCircuitMap();
                    } else {
                        if (globalProblemPins) {
                            map.renderGlobalMap(globalProblemPins, getGlobalFilterState());
                        }
                    }
                    if (noteModalElement) noteModalElement.style.display = "none";
                }
            };
        }

        if (viewProblemDetailsBtn) {
            viewProblemDetailsBtn.addEventListener('click', () => {
                if (currentCircuitId && currentProblemId) {
                    navigateToProblemDetail(currentCircuitId, currentProblemId);
                }
            });
        }
    }

    // Initialize the map page
    function init() {
        // Load all circuit data
        dataManager.loadCircuits();

        // Initialize the appropriate map view
        initMapView();

        // Set up event listeners
        initEventListeners();
    }

    // Run initialization when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);

})();
