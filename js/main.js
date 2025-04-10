/**
 * Bouldering Problems Tracker - Main
 * Handles initialization and event listeners.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Get access to the app modules
    const { 
        config, 
        state, 
        elements, 
        utils, 
        dataManager, 
        map, 
        noteModal, 
        uiRenderer 
    } = window.BoulderingApp || {};
    
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
                uiRenderer.renderCircuitsList();
            } catch (error) {
                console.error('Error importing circuits:', error);
                alert('Error importing circuits: Invalid file format.');
            }
        };
        reader.readAsText(file);
    }
    
    // Initialize event listeners
    function initEventListeners() {
        // Map click handler and controls
        document.getElementById('done-mapping').addEventListener('click', map.toggleView);
        elements.mapImage.addEventListener('click', map.handleMapClick);
        
        // Make sure problem pins don't interfere with map clicking
        elements.problemPins.addEventListener('click', (e) => {
            // Only stop propagation if clicking on an actual pin
            if (e.target.classList.contains('problem-pin')) {
                e.stopPropagation();
            }
        });
        
        // Note modal handlers
        elements.noteCloseBtn.onclick = function() {
            elements.noteModal.style.display = "none";
        };
        
        elements.saveNoteBtn.onclick = noteModal.saveNote;
        
        // Circuit modal handlers
        elements.newCircuitBtn.onclick = function() {
            // Generate default name based on the first color option
            const defaultColorKey = Object.keys(config.COLOR_OPTIONS)[0];
            elements.circuitColorSelect.value = defaultColorKey;
            elements.circuitNameInput.value = utils.generateDefaultCircuitName(defaultColorKey);
            
            elements.modal.style.display = 'block';
        };
        
        // Update the default name when color changes
        elements.circuitColorSelect.onchange = function() {
            elements.circuitNameInput.value = utils.generateDefaultCircuitName(this.value);
        };
        
        elements.closeModalBtn.onclick = function() {
            elements.modal.style.display = 'none';
        };
        
        window.onclick = function(event) {
            if (event.target === elements.modal) {
                elements.modal.style.display = 'none';
            }
        };
        
        // Form submission
        elements.newCircuitForm.onsubmit = function(e) {
            e.preventDefault();
            
            const name = elements.circuitNameInput.value;
            const count = parseInt(document.getElementById('problem-count').value);
            const colorKey = elements.circuitColorSelect.value;
            
            dataManager.createNewCircuit(name, count, colorKey);
            uiRenderer.renderCircuitsList();
            uiRenderer.loadCircuitDetails();
            
            // Close modal and reset form
            elements.modal.style.display = 'none';
            elements.newCircuitForm.reset();
        };
        
        // Reset progress
        elements.resetProgress.addEventListener('click', uiRenderer.resetProgress);
        
        // Back to circuits list
        elements.backToCircuitsBtn.addEventListener('click', () => {
            elements.circuitDetailsSection.style.display = 'none';
            elements.circuitListSection.style.display = 'block';
        });
        
        // Import/Export
        elements.exportCircuits.addEventListener('click', exportCircuits);
        
        elements.importCircuits.addEventListener('click', () => {
            // Remove any existing event listeners to prevent duplicates
            const newInput = elements.importCircuitsInput.cloneNode(true);
            elements.importCircuitsInput.parentNode.replaceChild(newInput, elements.importCircuitsInput);
            elements.importCircuitsInput = newInput;
            
            elements.importCircuitsInput.addEventListener('change', importCircuits);
            elements.importCircuitsInput.click();
        });
        
        // Filter checkboxes
        elements.showUnattempted.addEventListener('change', uiRenderer.renderProblems);
        elements.showFlashed.addEventListener('change', uiRenderer.renderProblems);
        elements.showSent.addEventListener('change', uiRenderer.renderProblems);
        elements.showProject.addEventListener('change', uiRenderer.renderProblems);
    }
    
    // Initialize the app
    function init() {
        // Populate the color dropdown
        uiRenderer.populateColorDropdown();
        
        // Set up event listeners
        initEventListeners();
        
        // Load circuits from localStorage
        const circuitFound = dataManager.loadCircuits();
        
        if (circuitFound) {
            uiRenderer.loadCircuitDetails();
        } else {
            elements.circuitDetailsSection.style.display = 'none';
            elements.circuitListSection.style.display = 'block';
        }
        
        uiRenderer.renderCircuitsList();
    }
    
    // Run initialization when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
    
})();
