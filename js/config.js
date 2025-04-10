/**
 * Bouldering Problems Tracker - Configuration
 * Contains constants and configuration settings for the application.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    /**
     * Grade colors and their corresponding display names
     * Each color can be a solid color or a gradient
     */
    const COLOR_OPTIONS = {
        green: { color: "#32CD32", label: "Green" },
        blue: { color: "#1E90FF", label: "Blue" },
        purple: { color: "#A020F0", label: "Purple" },
        red: { color: "#DC143C", label: "Red" },
        yellow: { color: "#FFD700", label: "Yellow" },
        irnBru: { 
            colors: ["#0099CC", "#FF6600"], 
            label: "IrnBru (Blue/Orange)",
            type: "gradient"
        },
        wasp: {
            colors: ["#FFD700", "#000000"],
            label: "Wasp (Yellow/Black)",
            type: "gradient"  
        },
        murple: {
            colors: ["#4FFFB0", "#800080"],
            label: "Murple (Mint/Purple)",
            type: "gradient"
        }
    };

    /**
     * Problem status options
     */
    const PROBLEM_STATUSES = ['unattempted', 'flashed', 'sent', 'project'];

    /**
     * Month names for date formatting
     */
    const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Expose constants to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.config = {
        COLOR_OPTIONS,
        PROBLEM_STATUSES,
        MONTHS
    };
})();
