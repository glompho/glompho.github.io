/**
 * Bouldering Problems Tracker - Utilities
 * Contains utility functions used throughout the application.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Get access to the config
    const { config } = window.BoulderingApp || {};
    
    /**
     * Generate a unique ID
     * @returns {string} A unique identifier
     */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Generate default circuit name based on date and color
     * @param {string} colorKey - The color key to use in the name
     * @returns {string} A generated circuit name
     */
    function generateDefaultCircuitName(colorKey) {
        const date = new Date();
        const month = config.MONTHS[date.getMonth()];
        const year = date.getFullYear();
        const colorName = config.COLOR_OPTIONS[colorKey].label.split(' ')[0];
        
        return `${month} ${year} ${colorName} Circuit`;
    }

    // Expose utility functions to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.utils = {
        generateId,
        generateDefaultCircuitName
    };
})();
