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
        const savedCircuits = localStorage.getItem('boulderingCircuits');
        if (savedCircuits) {
            const circuits = JSON.parse(savedCircuits);
            // Ensure each circuit has a lastViewed property
            circuits.forEach(circuit => {
                if (circuit.lastViewed === undefined) {
                    circuit.lastViewed = null;
                }
            });
            state.setCircuits(circuits);
        }
        
        const lastCircuitId = localStorage.getItem('lastCircuitId');
        
        if (lastCircuitId && state.getState().circuits.find(c => c.id === lastCircuitId)) {
            state.setCurrentCircuitId(lastCircuitId);
            return true; // Circuit found and set
        } else {
            state.setCurrentCircuitId(null);
            return false; // No circuit found
        }
    }
    
    /**
     * Save circuits to localStorage
     */
    function saveCircuits() {
        localStorage.setItem('boulderingCircuits', JSON.stringify(state.getState().circuits));
        if (state.getState().currentCircuitId) {
            localStorage.setItem('lastCircuitId', state.getState().currentCircuitId);
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
     * @returns {string} The ID of the new circuit
     */
    function createNewCircuit(name, problemCount, colorKey) {
        const id = utils.generateId();
        const problems = generateProblems(problemCount, colorKey);
        
        const newCircuit = {
            id,
            name,
            colorKey,
            problems,
            lastViewed: null
        };
        
        const circuits = [...state.getState().circuits, newCircuit];
        state.setCircuits(circuits);
        state.setCurrentCircuitId(id);
        saveCircuits();
        return id;
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
        exportCircuitsToText
    };
})();
