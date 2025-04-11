/**
 * Bouldering Problems Tracker - Note Modal
 * Handles note modal functionality.
 * Updated to work with separate HTML pages.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Get access to the app modules
    const { dataManager, map } = window.BoulderingApp || {};
    
    /**
     * Open the note modal for a specific problem
     * @param {string} circuitId - The ID of the circuit
     * @param {string} problemId - The ID of the problem to open notes for
     * @param {string} circuitName - Optional circuit name for display in the modal
     */
    function openModal(circuitId, problemId, circuitName) {
        // Get DOM elements - these might be different on each page
        const noteModal = document.getElementById('noteModal');
        const noteModalTitle = document.getElementById('noteModalTitle');
        const noteStatusSelect = document.getElementById('noteStatusSelect');
        const noteInput = document.getElementById('noteInput');
        const setLocationBtn = document.getElementById('setLocationBtn');
        const noteModalCircuitName = document.getElementById('noteModalCircuitName');
        
        if (!noteModal) {
            console.error("Note modal element not found");
            return;
        }
        
        // Get the problem data
        const problem = dataManager.getProblemById(circuitId, problemId);
        if (!problem) {
            console.error(`Problem with ID ${problemId} not found in circuit ${circuitId}`);
            return;
        }
        
        // Update modal content
        if (noteModalTitle) {
            noteModalTitle.textContent = `Problem ${problem.id}`;
        }
        
        if (noteModalCircuitName && circuitName) {
            noteModalCircuitName.textContent = circuitName;
        }
        
        if (noteStatusSelect) {
            noteStatusSelect.value = problem.status || 'unattempted';
        }
        
        if (noteInput) {
            noteInput.value = problem.note || '';
        }
        
        // Set up location button if available
        if (setLocationBtn) {
            // Remove any existing event listeners to prevent duplicates
            const newSetLocationBtn = setLocationBtn.cloneNode(true);
            setLocationBtn.parentNode.replaceChild(newSetLocationBtn, setLocationBtn);
            
            newSetLocationBtn.addEventListener('click', () => {
                if (map && map.startPlacingProblem) {
                    map.startPlacingProblem(circuitId, problemId);
                }
                noteModal.style.display = "none";
            });
        }
        
        // Show the modal
        noteModal.style.display = "block";
    }
    
    /**
     * Save the note and status for a problem
     * @param {string} circuitId - The ID of the circuit
     * @param {string} problemId - The ID of the problem
     * @param {HTMLElement} statusSelect - The status select element
     * @param {HTMLElement} noteTextarea - The note textarea element
     */
    function saveNote(circuitId, problemId, statusSelect, noteTextarea) {
        if (!circuitId || !problemId) {
            console.error("Missing circuit ID or problem ID for saving note");
            return;
        }
        
        // Get values from DOM elements if provided
        const newStatus = statusSelect ? statusSelect.value : null;
        const newNote = noteTextarea ? noteTextarea.value : null;
        
        // Update the problem
        dataManager.updateProblemDetails(circuitId, problemId, {
            status: newStatus,
            note: newNote
        });
        
        // Close the modal if it exists
        const noteModal = document.getElementById('noteModal');
        if (noteModal) {
            noteModal.style.display = "none";
        }
    }
    
    // Expose note modal functionality to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.noteModal = {
        openModal,
        saveNote
    };
})();
