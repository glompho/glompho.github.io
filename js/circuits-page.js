/**
 * Bouldering Problems Tracker - Circuits Page Logic
 * Handles initialization and event listeners specific to circuits.html.
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
        // elements, // Removed - elements are gathered locally now
        utils,
        dataManager,
        map, // Needed for view all on map functionality
        uiRenderer
    } = window.BoulderingApp;

    // DOM Elements specific to this page (index.html / circuits list)
    const circuitsContainer = document.getElementById('circuits-container');
    const newCircuitBtn = document.getElementById('new-circuit-btn');
    const testCircuitBtn = document.getElementById('test-circuit-btn');
    const viewAllOnMapBtn = document.getElementById('view-all-on-map-btn');
    const exportCircuitsBtn = document.getElementById('export-circuits-btn');
    const importCircuitsBtn = document.getElementById('import-circuits-btn');
    const importCircuitsInput = document.getElementById('import-circuits-input');
    const modal = document.getElementById('new-circuit-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const newCircuitForm = document.getElementById('new-circuit-form');
    const circuitNameInput = document.getElementById('circuit-name');
    const circuitColorSelect = document.getElementById('circuit-color');
    const problemCountInput = document.getElementById('problem-count'); // Added for form handler

    /**
     * Export circuits to a text file
     */
    function exportCircuits() {
        const dataStr = dataManager.exportCircuitsToText();
        if (!dataStr) {
            alert('No circuits to export.');
            return;
        }

        const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileName = 'circuits.txt';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
    }

    /**
     * Import circuits from a text file
     * @param {Event} event - The file input change event
     */
    function importCircuits(event) {
        const file = event.target.files[0];
        if (!file) {
            alert('No file selected.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const dataStr = e.target.result;
            try {
                const parsedCircuits = dataManager.parseCircuitData(dataStr);

                // ID Preservation Logic
                const existingCircuits = state.getState().circuits;
                const existingIds = new Set(existingCircuits.map(c => c.id));

                parsedCircuits.forEach(c => {
                    if (!c.id || existingIds.has(c.id)) {
                        c.id = utils.generateId(); // Only generate new ID if conflict exists
                    }
                    existingIds.add(c.id); // Add the new id to the set
                });

                state.setCircuits(parsedCircuits);
                dataManager.saveCircuits();
                alert('Circuits imported successfully!');
                dataManager.loadCircuits(); // Reload the circuits
                if (circuitsContainer) {
                    uiRenderer.renderCircuitsList(circuitsContainer, navigateToProblems); // Re-render list
                }
            } catch (error) {
                console.error('Error importing circuits:', error);
                alert('Error importing circuits: Invalid file format.');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Navigate to the problems page for a specific circuit.
     * @param {string} circuitId - The ID of the circuit to view.
     */
    function navigateToProblems(circuitId) {
        console.log("Navigating to problems page with circuit ID:", circuitId);
        window.location.href = `problems.html?circuitId=${circuitId}`;
    }

    /**
     * Navigate to the global map page.
     */
    function navigateToGlobalMap() {
        window.location.href = 'map.html';
    }


    // Initialize event listeners for the circuits page
    function initEventListeners() {
        // Ensure elements are available on this page
        if (!newCircuitBtn || !modal || !closeModalBtn || !newCircuitForm || !exportCircuitsBtn || !importCircuitsBtn || !viewAllOnMapBtn || !circuitsContainer) {
            console.warn("One or more expected elements not found on index.html (circuits page). Skipping some event listeners.");
            // return; // Allow partial functionality
        }
        
        // Test Circuit button
        if (testCircuitBtn) {
            testCircuitBtn.addEventListener('click', () => {
                console.log("Creating test circuit");
                const testCircuit = dataManager.createNewCircuit("Test Circuit", 10, "green");
                console.log("Created test circuit:", testCircuit);
                
                if (circuitsContainer) {
                    uiRenderer.renderCircuitsList(circuitsContainer, navigateToProblems);
                }
                
                // Navigate to the test circuit
                navigateToProblems(testCircuit.id);
            });
        }

        // Circuit modal handlers
        if (newCircuitBtn) {
            newCircuitBtn.onclick = function() {
                // Generate default name based on the first color option
                const defaultColorKey = Object.keys(config.COLOR_OPTIONS)[0];
                if (circuitColorSelect) {
                     circuitColorSelect.value = defaultColorKey;
                }
                 if (circuitNameInput) {
                    circuitNameInput.value = utils.generateDefaultCircuitName(defaultColorKey);
                 }
                if (modal) modal.style.display = 'block';
            };
        }


        // Update the default name when color changes
        if (circuitColorSelect) {
            circuitColorSelect.onchange = function() {
                 if (circuitNameInput) {
                    circuitNameInput.value = utils.generateDefaultCircuitName(this.value);
                 }
            };
        }

        if (closeModalBtn) {
            closeModalBtn.onclick = function() {
                if (modal) modal.style.display = 'none';
            };
        }


        window.onclick = function(event) {
            if (modal && event.target === modal) {
                modal.style.display = 'none';
            }
        };

        // Form submission
        if (newCircuitForm) {
            newCircuitForm.onsubmit = function(e) {
                e.preventDefault();

                const name = circuitNameInput ? circuitNameInput.value : 'Unnamed Circuit';
                // const countInput = document.getElementById('problem-count'); // Already have problemCountInput
                // const colorSelect = document.getElementById('circuit-color'); // Already have circuitColorSelect

                if (!problemCountInput || !circuitColorSelect) {
                    console.error("Problem count or color select element not found in modal.");
                    return;
                }

                const count = parseInt(problemCountInput.value);
                const colorKey = circuitColorSelect.value;

                const newCircuit = dataManager.createNewCircuit(name, count, colorKey);
                console.log("Created new circuit:", newCircuit);
                
                // Pass the container element directly to the renderer
                if (circuitsContainer) {
                    uiRenderer.renderCircuitsList(circuitsContainer, navigateToProblems); // Pass container
                }
                
        // Close modal and reset form
        if (modal) modal.style.display = 'none';
        newCircuitForm.reset();

        // Navigate directly to the new circuit's problems page
        navigateToProblems(newCircuit.id);
            };
        }


        // Import/Export
        if (exportCircuitsBtn) {
            exportCircuitsBtn.addEventListener('click', exportCircuits);
        }

        if (importCircuitsBtn) {
            importCircuitsBtn.addEventListener('click', () => {
                // Ensure the input element exists
                if (!importCircuitsInput) {
                    console.error("Import circuits input element not found.");
                    return;
                }
                // Remove any existing event listeners to prevent duplicates
                // Cloning and replacing is a good way to ensure this
                const newInput = importCircuitsInput.cloneNode(true);
                importCircuitsInput.parentNode.replaceChild(newInput, importCircuitsInput);
                // Update the reference in this scope AFTER replacing
                // Note: This assumes importCircuitsInput was declared with 'let' or 'var' if you need to reassign.
                // Since it's const, we'll just use the new node directly for the listener.
                newInput.addEventListener('change', importCircuits);
                newInput.click();
            });
        }


        // View All on Map button
        if (viewAllOnMapBtn) {
            viewAllOnMapBtn.addEventListener('click', navigateToGlobalMap);
        }


        // Add event listener for clicking on circuit items (delegated to container)
        if (circuitsContainer) {
            circuitsContainer.addEventListener('click', (event) => {
                // Handle "View" button clicks
                if (event.target.classList.contains('select-btn')) {
                    const circuitId = event.target.dataset.id;
                    if (circuitId) {
                        navigateToProblems(circuitId);
                    }
                    return;
                }
                
                // Handle "Delete" button clicks
                if (event.target.classList.contains('delete-btn')) {
                    const circuitId = event.target.dataset.id;
                    if (circuitId && confirm('Are you sure you want to delete this circuit?')) {
                        const circuits = state.getState().circuits.filter(c => c.id !== circuitId);
                        state.setCircuits(circuits);
                        dataManager.saveCircuits();
                        if (circuitsContainer) {
                            uiRenderer.renderCircuitsList(circuitsContainer, navigateToProblems);
                        }
                    }
                    return;
                }
                
                // Handle clicks on the circuit item itself (not on buttons)
                const circuitItem = event.target.closest('.circuit-item');
                if (circuitItem && circuitItem.dataset.circuitId && !event.target.closest('button')) {
                    navigateToProblems(circuitItem.dataset.circuitId);
                }
            });
        }

    }

    // Initialize the circuits page
    function init() {
        // Populate the color dropdown in the modal
        if (circuitColorSelect) {
            // Pass the select element directly
            uiRenderer.populateColorDropdown(circuitColorSelect);
        } else {
            console.warn("Circuit color select element not found for populating dropdown.");
        }

        // Load circuits from localStorage
        dataManager.loadCircuits();

        // Render the list of circuits, passing the container and navigation function
        if (circuitsContainer) {
            uiRenderer.renderCircuitsList(circuitsContainer, navigateToProblems);
        } else {
            console.warn("Circuits container element not found for rendering list.");
        }


        // Set up event listeners for this page
        initEventListeners();
    }

    // Run initialization when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);

})();
