/**
 * Bouldering Problems Tracker - State Management
 * Manages the application state and provides access to it.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Get access to the config
    const { config } = window.BoulderingApp || {};

    // Application state
    let state = {
        circuits: [],
        currentCircuitId: null,
        selectedProblemId: null,
        mapViewVisible: false
    };

    /**
     * Get the current circuit based on currentCircuitId
     * @returns {Object|null} The current circuit or null if not found
     */
    function getCurrentCircuit() {
        return state.circuits.find(c => c.id === state.currentCircuitId);
    }

    // Expose state management to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.state = {
        getState: () => state,
        setState: (newState) => {
            state = { ...state, ...newState };
        },
        getCurrentCircuit,
        setCurrentCircuitId: (id) => {
            state.currentCircuitId = id;
        },
        setSelectedProblemId: (id) => {
            state.selectedProblemId = id;
        },
        setMapViewVisible: (visible) => {
            state.mapViewVisible = visible;
        },
        setCircuits: (circuits) => {
            state.circuits = circuits;
        }
    };
})();
