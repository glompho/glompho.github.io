/**
 * Bouldering Problems Tracker - DOM Elements
 * Contains references to all DOM elements used in the application.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // DOM elements collection
    const elements = {
        // Circuit modal elements
        modal: document.getElementById('new-circuit-modal'),
        newCircuitBtn: document.getElementById('new-circuit-btn'),
        closeModalBtn: document.getElementById('close-modal'),
        newCircuitForm: document.getElementById('new-circuit-form'),
        circuitNameInput: document.getElementById('circuit-name'),
        circuitColorSelect: document.getElementById('circuit-color'),
        
        // Circuit navigation
        backToCircuitsBtn: document.getElementById('back-to-circuits'),
        circuitDetailsSection: document.getElementById('circuit-details'),
        circuitListSection: document.getElementById('circuit-list'),
        
        // Note modal
        noteModal: document.getElementById("noteModal"),
        noteCloseBtn: document.getElementById("noteClose"),
        saveNoteBtn: document.getElementById("saveNote"),
        noteInput: document.getElementById("noteInput"),
        noteModalTitle: document.getElementById("noteModalTitle"),
        noteStatusSelect: document.getElementById("noteStatusSelect"),
        
        // Map elements
        mapImage: document.getElementById('map-image'),
        problemPins: document.getElementById('problem-pins'),
        
        // Problem management
        problemGrid: document.getElementById('problem-grid'),
        mapView: document.getElementById('map-view'),
        
        // Stats elements
        totalCount: document.getElementById('total-count'),
        flashedCount: document.getElementById('flashed-count'),
        sentCount: document.getElementById('sent-count'),
        projectCount: document.getElementById('project-count'),
        
        // Filter checkboxes
        showUnattempted: document.getElementById('show-unattempted'),
        showFlashed: document.getElementById('show-flashed'),
        showSent: document.getElementById('show-sent'),
        showProject: document.getElementById('show-project'),
        
        // Buttons
        resetProgress: document.getElementById('reset-progress'),
        increaseProblems: document.getElementById('increase-problems'),
        decreaseProblems: document.getElementById('decrease-problems'),
        toggleView: document.getElementById('toggle-view'),
        exportCircuits: document.getElementById('export-circuits-btn'),
        importCircuits: document.getElementById('import-circuits-btn'),
        importCircuitsInput: document.getElementById('import-circuits-input')
    };

    // Expose DOM elements to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.elements = elements;
})();
