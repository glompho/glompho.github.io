/**
 * Bouldering Problems Tracker - Note Modal
 * Handles note modal functionality.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Get access to the app modules
    const { state, elements, dataManager, map } = window.BoulderingApp || {};
    
    /**
     * Open the note modal for a specific problem
     * @param {number} problemId - The ID of the problem to open notes for
     */
    function openNoteModal(problemId) {
        state.setSelectedProblemId(problemId);
        const circuit = state.getCurrentCircuit();
        if (!circuit) return;

        const problem = circuit.problems.find(p => p.id === problemId);
        if (!problem) return;

        elements.noteModalTitle.textContent = `Note for Problem #${problemId}`;
        elements.noteInput.value = problem.note || '';
        elements.noteStatusSelect.value = problem.status;

        const setLocationBtn = document.getElementById('setLocationBtn');
        setLocationBtn.style.display = "block";
        
        // Remove any existing event listeners to prevent duplicates
        const newSetLocationBtn = setLocationBtn.cloneNode(true);
        setLocationBtn.parentNode.replaceChild(newSetLocationBtn, setLocationBtn);
        
        newSetLocationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            map.selectProblemForLocation(problemId);
            elements.noteModal.style.display = "none";
        });

        elements.noteModal.style.display = "block";
    }
    
    /**
     * Save the note and status for the selected problem
     */
    function saveNote() {
        const selectedProblemId = state.getState().selectedProblemId;
        if (!selectedProblemId) return;
        
        const newStatus = elements.noteStatusSelect.value;
        const circuit = state.getCurrentCircuit();
        
        if (circuit) {
            const problem = circuit.problems.find(p => p.id === selectedProblemId);
            if (problem) {
                problem.status = newStatus;
                problem.note = elements.noteInput.value;
                dataManager.saveCircuits();
                
                // Trigger UI updates
                if (window.BoulderingApp.uiRenderer) {
                    window.BoulderingApp.uiRenderer.renderProblems();
                    window.BoulderingApp.uiRenderer.renderCircuitsList();
                }
                
                if (map) {
                    map.renderMap();
                }
            }
        }
        
        state.setSelectedProblemId(null); // Clear selectedProblemId after saving
        elements.noteModal.style.display = "none";
    }
    
    // Expose note modal functionality to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.noteModal = {
        openNoteModal,
        saveNote
    };
})();
