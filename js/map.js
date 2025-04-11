/**
 * Bouldering Problems Tracker - Map Functionality
 * Handles map rendering and location handling.
 * Updated to work with separate map.html page.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Get access to the app modules
    const { state, dataManager, config } = window.BoulderingApp || {};
    
    // Track the problem being placed on the map
    let placingProblemCircuitId = null;
    let placingProblemId = null;
    
    /**
     * Start placing a problem on the map
     * @param {string} circuitId - The ID of the circuit
     * @param {string} problemId - The ID of the problem to place on the map
     */
    function startPlacingProblem(circuitId, problemId) {
        placingProblemCircuitId = circuitId;
        placingProblemId = problemId;
        
        // Navigate to the map page with circuit and problem IDs
        window.location.href = `map.html?circuitId=${circuitId}&problemId=${problemId}`;
    }

    /**
     * Render problem pins for a specific circuit
     * @param {string} circuitId - The ID of the circuit to render pins for
     * @param {HTMLElement} pinsContainer - The container element for the pins
     * @param {object} filterState - The filter state object
     */
    function renderProblemPins(circuitId, pinsContainer, filterState) {
        if (!circuitId || !pinsContainer) {
            console.error("Missing circuit ID or pins container for rendering pins");
            return;
        }
        
        // Clear existing pins
        pinsContainer.innerHTML = '';
        
        // Get the circuit
        const circuit = dataManager.getCircuitById(circuitId);
        if (!circuit) {
            console.error(`Circuit with ID ${circuitId} not found.`);
            return;
        }
        
        // Get problems for this circuit
        const problems = dataManager.getProblemsForCircuit(circuitId);
        
        // Render pins for problems with locations
        problems.forEach(problem => {
            if (!problem.location) return;
            
            // Apply filters if provided
            if (filterState && !filterState[problem.status]) return;
            
            // Create pin element
            const pin = document.createElement('div');
            pin.className = `problem-pin ${problem.status}`;
            pin.dataset.problemId = problem.id;
            pin.dataset.circuitId = circuitId;
            pin.style.left = `${problem.location.x}%`;
            pin.style.top = `${problem.location.y}%`;
            
            // Style pin based on status
            pin.style.backgroundColor = config.STATUS_COLORS[problem.status] || '#888';
            
            // Add problem number as tooltip
            pin.title = `Problem ${problem.number}`;
            
            pinsContainer.appendChild(pin);
        });
    }

    /**
     * Render the global map with pins from all circuits
     * @param {HTMLElement} pinsContainer - The container element for the pins
     * @param {object} filterState - The filter state object
     */
    function renderGlobalMap(pinsContainer, filterState) {
        if (!pinsContainer) {
            console.error("Missing pins container for rendering global map");
            return;
        }
        
        // Clear existing pins
        pinsContainer.innerHTML = '';
        
        // Get all circuits
        const circuits = dataManager.getAllCircuits();
        
        // Render pins for all problems with locations across all circuits
        circuits.forEach(circuit => {
            const problems = dataManager.getProblemsForCircuit(circuit.id);
            
            problems.forEach(problem => {
                if (!problem.location) return;
                
                // Apply filters if provided
                if (filterState && !filterState[problem.status]) return;
                
                // Create pin element
                const pin = document.createElement('div');
                pin.className = `problem-pin ${problem.status}`;
                pin.dataset.problemId = problem.id;
                pin.dataset.circuitId = circuit.id;
                pin.style.left = `${problem.location.x}%`;
                pin.style.top = `${problem.location.y}%`;
                
                // Style pin based on status
                pin.style.backgroundColor = config.STATUS_COLORS[problem.status] || '#888';
                
                // Add circuit and problem info as tooltip
                pin.title = `${circuit.name} - Problem ${problem.number}`;
                
                pinsContainer.appendChild(pin);
            });
        });
    }

    /**
     * Handle map click to set problem location
     * @param {Event} event - The click event
     * @param {HTMLElement} mapImage - The map image element
     */
    function handleMapClick(event, mapImage) {
        if (!placingProblemCircuitId || !placingProblemId) {
            console.warn("No problem selected for location placement");
            return;
        }
        
        const rect = mapImage.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        
        // Update the problem's location
        dataManager.updateProblemLocation(placingProblemCircuitId, placingProblemId, { x, y });
        
        // Provide feedback
        console.log(`Set location for problem ${placingProblemId} at x:${x.toFixed(1)}%, y:${y.toFixed(1)}%`);
    }

    /**
     * Update a problem's location
     * @param {string} circuitId - The ID of the circuit
     * @param {string} problemId - The ID of the problem
     * @param {object} location - The location object with x and y properties
     */
    function updateProblemLocation(circuitId, problemId, location) {
        dataManager.updateProblemLocation(circuitId, problemId, location);
    }

    // Expose map functionality to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.map = {
        startPlacingProblem,
        renderProblemPins,
        renderGlobalMap,
        handleMapClick,
        updateProblemLocation
    };

})();
