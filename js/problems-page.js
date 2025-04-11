/**
 * Bouldering Problems Tracker - Problems Page Logic
 * Handles initialization and event listeners specific to problems.html.
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
        noteModal,
        uiRenderer
    } = window.BoulderingApp;

    // DOM Elements specific to this page (problems.html)
    const circuitDetailsSection = document.getElementById('circuit-details'); // Main container might be useful
    const circuitNameDisplay = document.getElementById('circuit-name-display');
    const circuitColorDisplay = document.getElementById('circuit-color-display');
    const circuitColorBox = document.getElementById('circuit-color-box');
    const circuitColorLabel = document.getElementById('circuit-color-label');
    const showUnattemptedCheckbox = document.getElementById('show-unattempted');
    const showFlashedCheckbox = document.getElementById('show-flashed');
    const showSentCheckbox = document.getElementById('show-sent');
    const showProjectCheckbox = document.getElementById('show-project');
    const totalCountSpan = document.getElementById('total-count');
    const flashedCountSpan = document.getElementById('flashed-count');
    const sentCountSpan = document.getElementById('sent-count');
    const projectCountSpan = document.getElementById('project-count');
    const resetProgressBtn = document.getElementById('reset-progress');
    const increaseProblemsBtn = document.getElementById('increase-problems');
    const decreaseProblemsBtn = document.getElementById('decrease-problems');
    const backToCircuitsBtn = document.getElementById('back-to-circuits');
    const toggleViewBtn = document.getElementById('toggle-view');
    const problemGrid = document.getElementById('problem-grid');
    const mapView = document.getElementById('map-view');
    const mapContainer = document.getElementById('map-container'); // Inside map view
    const mapImage = document.getElementById('map-image');       // Inside map view
    const problemPins = document.getElementById('problem-pins');   // Inside map view
    const doneMappingBtn = document.getElementById('done-mapping'); // Inside map view

    // Note Modal elements (assuming they are included in problems.html)
    const noteModalElement = document.getElementById('noteModal');
    const noteCloseBtn = document.getElementById('noteClose');
    const noteModalTitle = document.getElementById('noteModalTitle');
    const noteStatusSelect = document.getElementById('noteStatusSelect');
    const noteInput = document.getElementById('noteInput');
    const setLocationBtn = document.getElementById('setLocationBtn');
    const saveNoteBtn = document.getElementById('saveNote');
    const viewProblemDetailsBtn = document.getElementById('view-problem-details');

    let currentCircuitId = null;
    let currentProblemId = null; // To track which problem's note modal is open

    /**
     * Get circuit ID from URL query parameters.
     * @returns {string|null} The circuit ID or null if not found.
     */
    function getCircuitIdFromUrl() {
        const urlParams = window.location.search;
        console.log("URL params:", urlParams);
        
        const params = new URLSearchParams(urlParams);
        const circuitId = params.get('circuitId');
        console.log("Parsed circuit ID:", circuitId);
        
        return circuitId;
    }

    /**
     * Navigate back to the circuits list page.
     */
    function navigateToCircuits() {
        window.location.href = 'index.html';
    }

    /**
     * Navigate to the problem detail page.
     * @param {string} problemId - The ID of the problem to view.
     */
    function navigateToProblemDetail(problemId) {
         if (!currentCircuitId || !problemId) {
            console.error("Missing circuit or problem ID for navigation.");
            return;
         }
        window.location.href = `problem-detail.html?circuitId=${currentCircuitId}&problemId=${problemId}`;
    }

    /**
     * Navigate to the map view page for the current circuit.
     */
    function navigateToMapView() {
        if (!currentCircuitId) {
            console.warn("No circuit ID available for map navigation.");
            return;
        }
        window.location.href = `map.html?circuitId=${currentCircuitId}`;
    }

    /**
     * Handles clicks on problem elements to open the note modal.
     * @param {Event} event - The click event.
     */
    function handleProblemClick(event) {
        const problemElement = event.target.closest('.problem');
        if (problemElement && problemElement.dataset.problemId) {
            currentProblemId = problemElement.dataset.problemId;
            const problem = dataManager.getProblemById(currentCircuitId, currentProblemId);
            if (problem) {
                noteModal.openModal(currentCircuitId, currentProblemId);
            } else {
                console.error(`Problem with ID ${currentProblemId} not found in circuit ${currentCircuitId}`);
                currentProblemId = null; // Reset if problem not found
            }
        }
    }

    // Initialize event listeners for the problems page
    function initEventListeners() {
        // Back to circuits list
        if (backToCircuitsBtn) {
            backToCircuitsBtn.addEventListener('click', navigateToCircuits);
        } else {
            console.warn("Back to Circuits button not found.");
        }

        // Problem grid clicks (delegated)
        if (problemGrid) {
            problemGrid.addEventListener('click', handleProblemClick);
        } else {
            console.warn("Problem grid element not found.");
        }

        // Note modal close button
        if (noteCloseBtn) {
            noteCloseBtn.onclick = function() {
                if (noteModalElement) noteModalElement.style.display = "none";
                currentProblemId = null; // Reset problem ID when modal closes
            };
        } else {
             console.warn("Note modal close button not found.");
        }


        // Note modal save button
        if (saveNoteBtn) {
            saveNoteBtn.onclick = () => {
                if (currentCircuitId && currentProblemId) {
                    // Pass necessary elements to noteModal.saveNote if it needs them
                    noteModal.saveNote(currentCircuitId, currentProblemId, noteStatusSelect, noteInput);
                    // Re-render problems to reflect status change
                    // Pass necessary elements to uiRenderer methods
                    if (problemGrid) {
                        uiRenderer.renderProblems(currentCircuitId, problemGrid, getFilterState());
                    }
                    if (totalCountSpan && flashedCountSpan && sentCountSpan && projectCountSpan) {
                        uiRenderer.updateStats(currentCircuitId, totalCountSpan, flashedCountSpan, sentCountSpan, projectCountSpan);
                    }
                } else {
                    console.error("Cannot save note without current circuit and problem ID.");
                }
            };
        } else {
             console.warn("Note modal save button not found.");
        }


        // Note modal "Set Location" button
        if (setLocationBtn) {
            setLocationBtn.onclick = () => {
                if (currentCircuitId && currentProblemId) {
                    // Pass necessary map elements if needed by startPlacingProblem
                    map.startPlacingProblem(currentCircuitId, currentProblemId);
                    if (noteModalElement) noteModalElement.style.display = 'none'; // Close modal
                    navigateToMapView(); // Navigate to map page instead of toggling view
                } else {
                     console.error("Cannot set location without current circuit and problem ID.");
                }
            };
        } else {
             console.warn("Note modal set location button not found.");
        }


         // Note modal "View Full Details" button
         if (viewProblemDetailsBtn) {
             viewProblemDetailsBtn.addEventListener('click', () => {
                 if (currentProblemId) {
                     navigateToProblemDetail(currentProblemId);
                 } else {
                     console.error("No problem selected to view details.");
                 }
             });
         } else {
              console.warn("Note modal view details button not found.");
         }


        // Toggle Map View button - now navigates to map page
        if (toggleViewBtn) {
            toggleViewBtn.addEventListener('click', navigateToMapView);
        } else {
             console.warn("Toggle view button not found.");
        }


        // Done Mapping button (on map view) - should not be needed in problems page anymore
        if (doneMappingBtn) {
            doneMappingBtn.addEventListener('click', () => {
                console.warn("Done mapping button should not be visible on problems page.");
                // Hide the map view if it's somehow visible
                if (mapView) mapView.style.display = 'none';
                if (problemGrid) problemGrid.style.display = 'block';
            });
        }


        // Filter checkboxes
        const filterCheckboxes = [showUnattemptedCheckbox, showFlashedCheckbox, showSentCheckbox, showProjectCheckbox];
        filterCheckboxes.forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    if (problemGrid) {
                        // Pass container and filter state
                        uiRenderer.renderProblems(currentCircuitId, problemGrid, getFilterState());
                    }
                });
            } else {
                 console.warn("One or more filter checkboxes not found.");
            }
        });

        // Stats buttons
        if (resetProgressBtn) {
            resetProgressBtn.addEventListener('click', () => {
                if (currentCircuitId && confirm('Are you sure you want to reset progress for this circuit?')) {
                    dataManager.resetCircuitProgress(currentCircuitId);
                    if (problemGrid) uiRenderer.renderProblems(currentCircuitId, problemGrid, getFilterState());
                    if (totalCountSpan && flashedCountSpan && sentCountSpan && projectCountSpan) uiRenderer.updateStats(currentCircuitId, totalCountSpan, flashedCountSpan, sentCountSpan, projectCountSpan);
                }
            });
        } else {
             console.warn("Reset progress button not found.");
        }

        if (increaseProblemsBtn) {
             increaseProblemsBtn.addEventListener('click', () => {
                 if (currentCircuitId) {
                     dataManager.increaseProblemCount(currentCircuitId);
                     if (problemGrid) uiRenderer.renderProblems(currentCircuitId, problemGrid, getFilterState());
                     if (totalCountSpan && flashedCountSpan && sentCountSpan && projectCountSpan) uiRenderer.updateStats(currentCircuitId, totalCountSpan, flashedCountSpan, sentCountSpan, projectCountSpan);
                 }
             });
        } else {
              console.warn("Increase problems button not found.");
        }

        if (decreaseProblemsBtn) {
             decreaseProblemsBtn.addEventListener('click', () => {
                 if (currentCircuitId) {
                     dataManager.decreaseProblemCount(currentCircuitId);
                     if (problemGrid) uiRenderer.renderProblems(currentCircuitId, problemGrid, getFilterState());
                     if (totalCountSpan && flashedCountSpan && sentCountSpan && projectCountSpan) uiRenderer.updateStats(currentCircuitId, totalCountSpan, flashedCountSpan, sentCountSpan, projectCountSpan);
                 }
             });
        } else {
              console.warn("Decrease problems button not found.");
        }

    }

     /**
      * Gets the current state of the filter checkboxes.
      * @returns {object} Filter state object.
      */
     function getFilterState() {
         return {
             unattempted: showUnattemptedCheckbox ? showUnattemptedCheckbox.checked : true,
             flashed: showFlashedCheckbox ? showFlashedCheckbox.checked : true,
             sent: showSentCheckbox ? showSentCheckbox.checked : true,
             project: showProjectCheckbox ? showProjectCheckbox.checked : true,
         };
     }


    // Initialize the problems page
    function init() {
        currentCircuitId = getCircuitIdFromUrl();
        console.log("Circuit ID from URL:", currentCircuitId);

        if (!currentCircuitId) {
            console.error("Circuit ID not found in URL.");
            //alert("Could not load circuit details. Returning to circuits list.");
            //navigateToCircuits();
            return;
        }

        // Load all circuits first (needed for dataManager functions)
        dataManager.loadCircuits();
        console.log("Loaded circuits:", state.getState().circuits);

        // Load details for the specific circuit
        const circuit = dataManager.getCircuitById(currentCircuitId);
        console.log("Found circuit:", circuit);

        if (!circuit) {
            console.error(`Circuit with ID ${currentCircuitId} not found.`);
            //alert("Circuit not found. Returning to circuits list.");
            //navigateToCircuits();
            return;
        }
        
        // Update the lastViewed timestamp for this circuit
        dataManager.updateLastViewed(currentCircuitId);

        // Update UI with circuit details - Pass elements to the renderer
        if (circuitNameDisplay && circuitColorBox && circuitColorLabel) {
            uiRenderer.displayCircuitDetails(circuit, circuitNameDisplay, circuitColorBox, circuitColorLabel);
        } else {
            console.warn("One or more elements for displaying circuit details not found.");
        }

        // Render problems for this circuit - Pass elements
        if (problemGrid) {
            uiRenderer.renderProblems(currentCircuitId, problemGrid, getFilterState());
        } else {
            console.warn("Problem grid element not found for rendering problems.");
        }

        // Update stats - Pass elements
        if (totalCountSpan && flashedCountSpan && sentCountSpan && projectCountSpan) {
            uiRenderer.updateStats(currentCircuitId, totalCountSpan, flashedCountSpan, sentCountSpan, projectCountSpan);
        } else {
            console.warn("One or more stat elements not found.");
        }


        // Set up event listeners for this page
        initEventListeners();

        // Ensure map is initially hidden - not needed anymore as map is a separate page
        if (mapView) {
            mapView.style.display = 'none';
        }
         if (problemGrid) {
             problemGrid.style.display = 'block'; // Ensure grid is visible
         }
    }

    // Run initialization when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);

})();
