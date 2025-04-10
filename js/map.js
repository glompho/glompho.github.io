/**
 * Bouldering Problems Tracker - Map Functionality
 * Handles map rendering and location handling.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Get access to the app modules
    const { state, elements, dataManager } = window.BoulderingApp || {};
    
    /**
     * Select a problem for location placement on the map
     * @param {number} problemId - The ID of the problem to place on the map
     */
    function selectProblemForLocation(problemId) {
        state.setSelectedProblemId(problemId);
        state.setMapViewVisible(true);
        
        elements.problemGrid.style.display = 'none';
        elements.mapView.style.display = 'block';
        
        renderMap();
    }

    /**
     * Render the map with problem pins
     * Ensures pins appear on top of the map
     */
    function renderMap() {
        const circuit = state.getCurrentCircuit();
        if (!circuit) return;
        
        elements.mapImage.style.cursor = state.getState().selectedProblemId ? 'crosshair' : 'default';
        elements.problemPins.innerHTML = '';
        
        circuit.problems.forEach(problem => {
            if (!problem.mapLocation) return;
            
            const [x, y] = problem.mapLocation.split(',').map(Number);
            if (isNaN(x) || isNaN(y)) return;
            
            // Calculate position as percentage of natural image dimensions
            const xPercent = (x / elements.mapImage.naturalWidth) * 100;
            const yPercent = (y / elements.mapImage.naturalHeight) * 100;
            
            const pin = document.createElement('div');
            pin.className = 'problem-pin';
            pin.style.position = 'absolute';
            pin.style.left = `${xPercent}%`;
            pin.style.top = `${yPercent}%`;
            
            // Add status indicator to pin
            pin.classList.add(problem.status || 'unattempted');
            pin.textContent = problem.id;
            
            elements.problemPins.appendChild(pin);
            
            // Add click handler to pins
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                window.BoulderingApp.noteModal.openNoteModal(problem.id);
            });
        });
    }

    /**
     * Toggle between problem grid and map view
     */
    function toggleView() {
        const currentState = state.getState();
        state.setMapViewVisible(!currentState.mapViewVisible);
        
        if (state.getState().mapViewVisible) {
            elements.problemGrid.style.display = 'none';
            elements.mapView.style.display = 'block';
        } else {
            elements.problemGrid.style.display = 'grid';
            elements.mapView.style.display = 'none';
            state.setSelectedProblemId(null); // Clear selectedProblemId when exiting map view
        }
        renderMap();
    }

    /**
     * Handle map click to set problem location
     * @param {Event} e - The click event
     */
    function handleMapClick(e) {
        const selectedProblemId = state.getState().selectedProblemId;
        if (!selectedProblemId) return;
        
        e.stopPropagation();
        
        const rect = elements.mapImage.getBoundingClientRect();
        
        // Calculate position relative to the image's natural dimensions
        const x = Math.round((e.clientX - rect.left) / rect.width * elements.mapImage.naturalWidth);
        const y = Math.round((e.clientY - rect.top) / rect.height * elements.mapImage.naturalHeight);
        
        console.log('Click coordinates on image:', e.clientX - rect.left, e.clientY - rect.top);
        console.log('Normalized coordinates:', x, y);
        
        const circuit = state.getCurrentCircuit();
        if (!circuit) return;
        
        const problem = circuit.problems.find(p => p.id === selectedProblemId);
        if (problem) {
            problem.mapLocation = `${x},${y}`;
            dataManager.saveCircuits();
            renderMap();
            
            // Optionally provide feedback
            console.log(`Set location for problem #${selectedProblemId} at ${x},${y}`);
        }
    }

    // Expose map functionality to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.map = {
        selectProblemForLocation,
        renderMap,
        toggleView,
        handleMapClick
    };
})();
