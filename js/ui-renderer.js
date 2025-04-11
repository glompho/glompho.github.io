/**
 * Bouldering Problems Tracker - UI Renderer
 * Handles UI rendering for the application.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Get access to the app modules
    const { config, state, dataManager, map, noteModal } = window.BoulderingApp || {};

    /**
     * Populate color dropdown from COLOR_OPTIONS
     * @param {HTMLSelectElement} selectElement - The select element to populate.
     */
    function populateColorDropdown(selectElement) {
        if (!selectElement) {
            console.warn("populateColorDropdown: selectElement is null or undefined.");
            return;
        }

        selectElement.innerHTML = '';

        Object.entries(config.COLOR_OPTIONS).forEach(([key, info]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = info.label;
            selectElement.appendChild(option);
        });
    }

    /**
     * Render the list of circuits
     * @param {HTMLElement} container - The container element to render the circuits list into.
     * @param {function} navigateToProblems - Function to navigate to the problems page.
     */
    function renderCircuitsList(container, navigateToProblems) {
        if (!container) {
            console.warn("renderCircuitsList: container is null or undefined.");
            return;
        }

        console.log("Rendering circuits list with container:", container);
        console.log("Navigate function provided:", !!navigateToProblems);

        container.innerHTML = '';

        const circuits = state.getState().circuits;
        console.log("Circuits to render:", circuits);

        // Sort circuits by lastViewed (most recent first)
        circuits.sort((a, b) => {
            if (a.lastViewed === null && b.lastViewed === null) return 0;
            if (a.lastViewed === null) return 1;
            if (b.lastViewed === null) return -1;
            return b.lastViewed - a.lastViewed;
        });

        circuits.forEach(circuit => {
            const item = document.createElement('div');
            item.className = `circuit-item ${circuit.id === state.getState().currentCircuitId ? 'active' : ''}`;
            item.dataset.circuitId = circuit.id; // Store circuit ID for navigation

            const sentCount = circuit.problems.filter(p => p.status === 'sent').length;
            const flashedCount = circuit.problems.filter(p => p.status === 'flashed').length;
            const totalSent = sentCount + flashedCount;
            const percentage = Math.round((totalSent / circuit.problems.length) * 100);
            const colorInfo = config.COLOR_OPTIONS[circuit.colorKey];
            const projectCount = circuit.problems.filter(p => p.status === 'project').length;

            let colorIndicatorStyle = '';
            if (colorInfo.type === 'gradient') {
                colorIndicatorStyle = `background: linear-gradient(to bottom right, ${colorInfo.colors[0]} 50%, ${colorInfo.colors[1]} 50%);`;
            } else {
                colorIndicatorStyle = `background-color: ${colorInfo.color};`;
            }

            item.innerHTML = `
                <div class="circuit-info">
                    <span class="circuit-color-indicator" style="${colorIndicatorStyle}"></span>
                    <strong>${circuit.name}</strong> (${totalSent}/${circuit.problems.length} - ${percentage}%)
                    <br>Project: <span id="project-count-list">${projectCount}</span>
                    <br>Last Viewed: ${circuit.lastViewed ? new Date(circuit.lastViewed).toLocaleDateString() + ' ' + new Date(circuit.lastViewed).toLocaleTimeString() : 'Never'}
                </div>
                <div class="circuit-actions">
                    <button class="select-btn" data-id="${circuit.id}">View</button>
                    <button class="delete-btn" data-id="${circuit.id}">Delete</button>
                </div>
            `;

            container.appendChild(item);
        });

        // No longer attaching event listeners here; moved to circuits-page.js
    }

    /**
     * Display circuit details
     * @param {object} circuit - The circuit object to display details for.
     * @param {HTMLElement} nameDisplay - Element to display the circuit name.
     * @param {HTMLElement} colorBox - Element to display the circuit color.
     * @param {HTMLElement} colorLabel - Element to display the circuit color label.
     */
    function displayCircuitDetails(circuit, nameDisplay, colorBox, colorLabel) {
        if (!circuit || !nameDisplay || !colorBox || !colorLabel) {
            console.warn("displayCircuitDetails: One or more arguments are null or undefined.");
            return;
        }

        nameDisplay.textContent = circuit.name;

        // Set the color display
        const colorInfo = config.COLOR_OPTIONS[circuit.colorKey];
        if (colorInfo.type === 'gradient') {
            colorBox.style.background = `linear-gradient(to bottom right, ${colorInfo.colors[0]} 50%, ${colorInfo.colors[1]} 50%)`;
        } else {
            colorBox.style.backgroundColor = colorInfo.color;
        }
        colorLabel.textContent = colorInfo.label;
    }

    /**
     * Render the problems grid for current circuit
     * @param {string} circuitId - The ID of the circuit to render problems for.
     * @param {HTMLElement} problemGrid - The container element for the problem grid.
     * @param {object} filterState - Object containing the state of the filter checkboxes.
     */
    function renderProblems(circuitId, problemGrid, filterState) {
        if (!circuitId || !problemGrid || !filterState) {
            console.warn("renderProblems: One or more arguments are null or undefined.");
            return;
        }

        const circuit = state.getCircuitById(circuitId);
        if (!circuit) {
            console.warn(`renderProblems: Circuit with ID ${circuitId} not found.`);
            return;
        }

        problemGrid.innerHTML = '';

        const { unattempted, flashed, sent, project } = filterState;

        let filteredProblems = [...circuit.problems];
        const colorInfo = config.COLOR_OPTIONS[circuit.colorKey];

        // Apply completion filters
        filteredProblems = filteredProblems.filter(p => {
            if (p.status === 'unattempted' && unattempted) return true;
            if (p.status === 'flashed' && flashed) return true;
            if (p.status === 'sent' && sent) return true;
            if (p.status === 'project' && project) return true;
            return false;
        });

        // Sort by problem number
        filteredProblems.sort((a, b) => a.id - b.id);

        // Create problem elements
        filteredProblems.forEach(problem => {
            const problemEl = document.createElement('div');
            problemEl.className = `problem ${problem.status}`;
            problemEl.dataset.problemId = problem.id; // Store problem ID

            if (colorInfo.type === 'gradient') {
                problemEl.style.background = `linear-gradient(to bottom right, ${colorInfo.colors[0]} 50%, ${colorInfo.colors[1]} 50%)`;
            } else {
                problemEl.style.backgroundColor = colorInfo.color;
            }

            // Adjust text color for better contrast
            if (circuit.colorKey === 'yellow' || circuit.colorKey === 'white') {
                problemEl.style.color = 'black';
                problemEl.style.textShadow = 'none';
            }

            const numberEl = document.createElement('span');
            numberEl.className = 'problem-number';
            numberEl.textContent = problem.id;

            problemEl.appendChild(numberEl);

            // Add note icon
            const noteIcon = document.createElement('span');
            noteIcon.className = 'note-icon' + (problem.note ? ' has-note' : '');
            noteIcon.textContent = problem.note ? '✍️' : '📝';
            // No event listener here; click handled by delegated event listener on problemGrid

            problemEl.appendChild(noteIcon);

            let statusSymbol = '';
            if (problem.status === 'flashed') statusSymbol = '⚡';
            if (problem.status === 'sent') statusSymbol = '✓';
            if (problem.status === 'project') statusSymbol = '🚧';
            problemEl.appendChild(document.createTextNode(statusSymbol));

            problemGrid.appendChild(problemEl);
        });
    }

    /**
     * Update statistics display
     * @param {string} circuitId - The ID of the circuit to update stats for.
     * @param {HTMLElement} totalCountElement - Element to display the total problem count.
     * @param {HTMLElement} flashedCountElement - Element to display the flashed problem count.
     * @param {HTMLElement} sentCountElement - Element to display the sent problem count.
     * @param {HTMLElement} projectCountElement - Element to display the project problem count.
     */
    function updateStats(circuitId, totalCountElement, flashedCountElement, sentCountElement, projectCountElement) {
        if (!circuitId || !totalCountElement || !flashedCountElement || !sentCountElement || !projectCountElement) {
            console.warn("updateStats: One or more arguments are null or undefined.");
            return;
        }

        const circuit = state.getCircuitById(circuitId);
        if (!circuit) {
            console.warn(`updateStats: Circuit with ID ${circuitId} not found.`);
            return;
        }

        const totalCount = circuit.problems.length;
        const flashedCount = circuit.problems.filter(p => p.status === 'flashed').length;
        const totalSent = circuit.problems.filter(p => p.status === 'sent' || p.status === 'flashed').length;
        const projectCount = circuit.problems.filter(p => p.status === 'project').length;

        totalCountElement.textContent = totalCount;
        flashedCountElement.textContent = flashedCount;
        sentCountElement.textContent = totalSent;
        projectCountElement.textContent = projectCount;
    }

    // No more increaseProblemCount, decreaseProblemCount, toggleProblem, resetProgress here
    // These functions are now handled directly in problems-page.js

    // Expose UI rendering functions to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.uiRenderer = {
        populateColorDropdown,
        renderCircuitsList,
        displayCircuitDetails,
        renderProblems,
        updateStats
    };
})();
