/**
 * Bouldering Problems Tracker - Data Manager
 * Handles data operations like loading and saving circuits.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Get access to the app modules
    const { state, utils } = window.BoulderingApp || {};
    
    /**
     * Load circuits from localStorage
     */
    function loadCircuits() {
        console.log("Loading circuits from localStorage");
        const savedCircuits = localStorage.getItem('boulderingCircuits');
        console.log("Saved circuits from localStorage:", savedCircuits);
        
        if (savedCircuits) {
            try {
                const circuits = JSON.parse(savedCircuits);
                console.log("Parsed circuits:", circuits);
                
                // Ensure each circuit has a lastViewed property
                circuits.forEach(circuit => {
                    if (circuit.lastViewed === undefined) {
                        circuit.lastViewed = null;
                    }
                });
                
                state.setCircuits(circuits);
                console.log("Circuits set in state:", state.getState().circuits);
            } catch (error) {
                console.error("Error parsing circuits from localStorage:", error);
                state.setCircuits([]);
            }
        } else {
            console.log("No circuits found in localStorage, setting empty array");
            state.setCircuits([]);
        }
        
        const lastCircuitId = localStorage.getItem('lastCircuitId');
        console.log("Last circuit ID from localStorage:", lastCircuitId);
        
        if (lastCircuitId && state.getState().circuits.find(c => c.id === lastCircuitId)) {
            state.setCurrentCircuitId(lastCircuitId);
            console.log("Current circuit ID set to:", lastCircuitId);
            return true; // Circuit found and set
        } else {
            state.setCurrentCircuitId(null);
            console.log("Current circuit ID set to null");
            return false; // No circuit found
        }
    }
    
    /**
     * Save circuits to localStorage
     */
    function saveCircuits() {
        console.log("Saving circuits to localStorage");
        const circuits = state.getState().circuits;
        console.log("Circuits to save:", circuits);
        
        localStorage.setItem('boulderingCircuits', JSON.stringify(circuits));
        console.log("Saved circuits to localStorage");
        
        const currentCircuitId = state.getState().currentCircuitId;
        if (currentCircuitId) {
            localStorage.setItem('lastCircuitId', currentCircuitId);
            console.log("Saved lastCircuitId to localStorage:", currentCircuitId);
        }
    }
    
    /**
     * Update the lastViewed timestamp for a circuit
     * @param {string} circuitId - The ID of the circuit to update
     */
    function updateLastViewed(circuitId) {
        const circuits = state.getState().circuits;
        const circuit = circuits.find(c => c.id === circuitId);
        if (!circuit) return;
        
        circuit.lastViewed = Date.now();
        state.setCircuits(circuits);
        saveCircuits();
    }
    
    /**
     * Create a new circuit
     * @param {string} name - The name of the circuit
     * @param {number} problemCount - The number of problems in the circuit
     * @param {string} colorKey - The color key for the circuit
     * @returns {object} The new circuit object
     */
    function createNewCircuit(name, problemCount, colorKey) {
        console.log("Creating new circuit with name:", name, "problemCount:", problemCount, "colorKey:", colorKey);
        
        const id = utils.generateId();
        console.log("Generated ID:", id);
        
        const problems = generateProblems(problemCount, colorKey);
        console.log("Generated problems:", problems);
        
        const newCircuit = {
            id,
            name,
            colorKey,
            problems,
            lastViewed: Date.now() // Set lastViewed to current time
        };
        console.log("New circuit object:", newCircuit);
        
        const circuits = [...state.getState().circuits, newCircuit];
        console.log("Updated circuits array:", circuits);
        
        state.setCircuits(circuits);
        state.setCurrentCircuitId(id);
        saveCircuits();
        
        return newCircuit; // Return the entire circuit object
    }
    
    /**
     * Generate problems based on count and color
     * @param {number} count - The number of problems to generate
     * @param {string} colorKey - The color key for the problems
     * @returns {Array} An array of problem objects
     */
    function generateProblems(count, colorKey) {
        let problems = [];
        
        // Create all problems with the same color
        for (let i = 1; i <= count; i++) {
            let problem = {
                id: i,
                status: 'unattempted', // Default status
                note: '', // Add note property
                mapLocation: null
            };
            
            problems.push(problem);
        }
        
        return problems;
    }
    
    /**
     * Add a note to a problem
     * @param {string} circuitId - The ID of the circuit
     * @param {number} problemId - The ID of the problem
     * @param {string} note - The note text
     */
    function addNoteToProblem(circuitId, problemId, note) {
        const circuits = state.getState().circuits;
        const circuit = circuits.find(c => c.id === circuitId);
        if (!circuit) return;
        
        const problem = circuit.problems.find(p => p.id === problemId);
        if (problem) {
            problem.note = note;
            state.setCircuits(circuits);
            saveCircuits();
        }
    }
    
    /**
     * Parse circuit data from exported text format
     * @param {string} dataStr - The exported circuit data
     * @returns {Array} An array of circuit objects
     */
    function parseCircuitData(dataStr) {
        const circuits = [];
        let currentCircuit = null;
        let parseState = 'HEADER';
        
        dataStr.split('\n').forEach(line => {
            if (line.startsWith('=== BOULDERING CIRCUITS v1 ===')) {
                parseState = 'CIRCUIT';
            } else if (line.startsWith('=== CIRCUIT ===')) {
                parseState = 'CIRCUIT';
                currentCircuit = { problems: [] };
                circuits.push(currentCircuit);
            } else if (line.startsWith('=== PROBLEMS ===')) {
                parseState = 'PROBLEMS';
            } else if (parseState === 'CIRCUIT') {
                const [key, ...vals] = line.split(': ');
                const val = vals.join(': '); // Handle values with colons
                if (key === 'ID') currentCircuit.id = val;
                if (key === 'Name') currentCircuit.name = val;
                if (key === 'Color') currentCircuit.colorKey = val;
                if (key === 'LastViewed') {
                    currentCircuit.lastViewed = val === 'Never' ? null : new Date(val).getTime();
                }
            } else if (parseState === 'PROBLEMS') {
                const match = line.match(/(\d+): Status-(\w+) Note-(.*)/);
                if (match) {
                    currentCircuit.problems.push({
                        id: parseInt(match[1]),
                        status: match[2],
                        note: match[3].trim() || '',
                        mapLocation: null // Default to null for imported problems
                    });
                }
            }
        });
        
        return circuits;
    }

    /**
     * Export circuits to a text format
     * @returns {string} The exported circuit data
     */
    function exportCircuitsToText() {
        const circuits = state.getState().circuits;
        if (!circuits.length) {
            return null;
        }
        
        let dataStr = "=== BOULDERING CIRCUITS v1 ===\n\n";
        
        circuits.forEach(circuit => {
            dataStr += "=== CIRCUIT ===\n";
            dataStr += `ID: ${circuit.id}\n`;
            dataStr += `Name: ${circuit.name}\n`;
            dataStr += `Color: ${circuit.colorKey}\n`;
            dataStr += `LastViewed: ${circuit.lastViewed ? new Date(circuit.lastViewed).toLocaleDateString() + ' ' + new Date(circuit.lastViewed).toLocaleTimeString() : 'Never'}\n`;
            dataStr += "\n=== PROBLEMS ===\n";
            circuit.problems.forEach(problem => {
                dataStr += `${problem.id}: Status-${problem.status} Note-${problem.note || ''}\n`;
            });
            dataStr += "\n";
        });
        
        return dataStr;
    }

    /**
     * Get a circuit by ID
     * @param {string} circuitId - The ID of the circuit to get
     * @returns {object|null} The circuit object or null if not found
     */
    function getCircuitById(circuitId) {
        console.log("Getting circuit by ID:", circuitId);
        const circuits = state.getState().circuits;
        console.log("Available circuits:", circuits);
        
        const circuit = circuits.find(c => c.id === circuitId);
        console.log("Found circuit:", circuit);
        
        return circuit || null;
    }
    
    /**
     * Get a problem by ID
     * @param {string} circuitId - The ID of the circuit
     * @param {string} problemId - The ID of the problem
     * @returns {object|null} The problem object or null if not found
     */
    function getProblemById(circuitId, problemId) {
        const circuit = getCircuitById(circuitId);
        if (!circuit) return null;
        
        return circuit.problems.find(p => p.id == problemId) || null;
    }
    
    /**
     * Get all problems for a circuit
     * @param {string} circuitId - The ID of the circuit
     * @returns {Array} An array of problem objects
     */
    function getProblemsForCircuit(circuitId) {
        const circuit = getCircuitById(circuitId);
        return circuit ? circuit.problems : [];
    }
    
    /**
     * Update a problem's location
     * @param {string} circuitId - The ID of the circuit
     * @param {string} problemId - The ID of the problem
     * @param {object} location - The location object with x and y properties
     */
    function updateProblemLocation(circuitId, problemId, location) {
        const circuits = state.getState().circuits;
        const circuit = circuits.find(c => c.id === circuitId);
        if (!circuit) return;
        
        const problem = circuit.problems.find(p => p.id == problemId);
        if (problem) {
            problem.location = location;
            state.setCircuits(circuits);
            saveCircuits();
        }
    }
    
    /**
     * Get all circuits
     * @returns {Array} An array of all circuit objects
     */
    function getAllCircuits() {
        return state.getState().circuits;
    }
    
    /**
     * Update a problem's status and note
     * @param {string} circuitId - The ID of the circuit
     * @param {string} problemId - The ID of the problem
     * @param {object} details - Object with status and note properties
     */
    function updateProblemDetails(circuitId, problemId, details) {
        const circuits = state.getState().circuits;
        const circuit = circuits.find(c => c.id === circuitId);
        if (!circuit) return;
        
        const problem = circuit.problems.find(p => p.id == problemId);
        if (problem) {
            if (details.status) problem.status = details.status;
            if (details.note !== undefined) problem.note = details.note;
            if (details.location) problem.location = details.location;
            
            state.setCircuits(circuits);
            saveCircuits();
        }
    }
    
    /**
     * Reset progress for all problems in a circuit
     * @param {string} circuitId - The ID of the circuit
     */
    function resetCircuitProgress(circuitId) {
        const circuits = state.getState().circuits;
        const circuit = circuits.find(c => c.id === circuitId);
        if (!circuit) return;
        
        circuit.problems.forEach(problem => {
            problem.status = 'unattempted';
            problem.note = '';
        });
        
        state.setCircuits(circuits);
        saveCircuits();
    }
    
    /**
     * Increase the number of problems in a circuit
     * @param {string} circuitId - The ID of the circuit
     */
    function increaseProblemCount(circuitId) {
        const circuits = state.getState().circuits;
        const circuit = circuits.find(c => c.id === circuitId);
        if (!circuit) return;
        
        const currentCount = circuit.problems.length;
        const newProblem = {
            id: currentCount + 1,
            status: 'unattempted',
            note: '',
            location: null
        };
        
        circuit.problems.push(newProblem);
        state.setCircuits(circuits);
        saveCircuits();
    }
    
    /**
     * Decrease the number of problems in a circuit
     * @param {string} circuitId - The ID of the circuit
     */
    function decreaseProblemCount(circuitId) {
        const circuits = state.getState().circuits;
        const circuit = circuits.find(c => c.id === circuitId);
        if (!circuit || circuit.problems.length <= 1) return;
        
        circuit.problems.pop();
        state.setCircuits(circuits);
        saveCircuits();
    }

    // Expose data management functions to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.dataManager = {
        loadCircuits,
        saveCircuits,
        updateLastViewed,
        createNewCircuit,
        generateProblems,
        addNoteToProblem,
        parseCircuitData,
        exportCircuitsToText,
        getCircuitById,
        getProblemById,
        getProblemsForCircuit,
        updateProblemLocation,
        getAllCircuits,
        updateProblemDetails,
        resetCircuitProgress,
        increaseProblemCount,
        decreaseProblemCount
    };
})();
