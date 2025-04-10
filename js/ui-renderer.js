/**
 * Bouldering Problems Tracker - UI Renderer
 * Handles UI rendering for the application.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Get access to the app modules
    const { config, state, elements, dataManager, map, noteModal } = window.BoulderingApp || {};
    
    /**
     * Populate color dropdown from COLOR_OPTIONS
     */
    function populateColorDropdown() {
        elements.circuitColorSelect.innerHTML = '';
        
        Object.entries(config.COLOR_OPTIONS).forEach(([key, info]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = info.label;
            elements.circuitColorSelect.appendChild(option);
        });
    }
    
    /**
     * Render the list of circuits
     */
    function renderCircuitsList() {
        const container = document.getElementById('circuits-container');
        container.innerHTML = '';
        
        const circuits = state.getState().circuits;
        
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
        
        // Add event listeners
        document.querySelectorAll('.select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.setCurrentCircuitId(btn.dataset.id);
                localStorage.setItem('lastCircuitId', state.getState().currentCircuitId);
                dataManager.saveCircuits();
                loadCircuitDetails();
                renderCircuitsList();
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (state.getState().circuits.length <= 1) {
                    alert('You must have at least one circuit.');
                    return;
                }
                
                if (confirm('Are you sure you want to delete this circuit?')) {
                    const circuits = state.getState().circuits.filter(c => c.id !== id);
                    state.setCircuits(circuits);
                    
                    // If we're deleting the current circuit, switch to the first one
                    if (id === state.getState().currentCircuitId) {
                        state.setCurrentCircuitId(circuits[0].id);
                    }
                    
                    dataManager.saveCircuits();
                    renderCircuitsList();
                }
            });
        });
    }
    
    /**
     * Load current circuit details
     */
    function loadCircuitDetails() {
        const circuit = state.getCurrentCircuit();
        if (!circuit) return;
        
        dataManager.updateLastViewed(circuit.id);
        console.log(`Circuit ${circuit.name} lastViewed: ${circuit.lastViewed}`);
        
        document.getElementById('circuit-name-display').textContent = circuit.name;
        
        // Set the color display
        const colorInfo = config.COLOR_OPTIONS[circuit.colorKey];
        const colorBox = document.getElementById('circuit-color-box');
        const colorLabel = document.getElementById('circuit-color-label');
        
        if (colorInfo.type === 'gradient') {
            colorBox.style.background = `linear-gradient(to bottom right, ${colorInfo.colors[0]} 50%, ${colorInfo.colors[1]} 50%)`;
        } else {
            colorBox.style.backgroundColor = colorInfo.color;
        }
        colorLabel.textContent = colorInfo.label;
        
        // Show circuit details and hide circuit list
        elements.circuitListSection.style.display = 'none';
        elements.circuitDetailsSection.style.display = 'block';
        
        localStorage.setItem('lastCircuitId', state.getState().currentCircuitId);
        renderProblems();
        map.renderMap();
        
        // Remove existing event listeners to prevent duplicates
        const increaseButton = elements.increaseProblems;
        const decreaseButton = elements.decreaseProblems;
        const toggleViewButton = elements.toggleView;
        
        const newIncreaseButton = increaseButton.cloneNode(true);
        const newDecreaseButton = decreaseButton.cloneNode(true);
        const newToggleViewButton = toggleViewButton.cloneNode(true);
        
        increaseButton.parentNode.replaceChild(newIncreaseButton, increaseButton);
        decreaseButton.parentNode.replaceChild(newDecreaseButton, decreaseButton);
        toggleViewButton.parentNode.replaceChild(newToggleViewButton, toggleViewButton);
        
        // Update references in elements object
        elements.increaseProblems = newIncreaseButton;
        elements.decreaseProblems = newDecreaseButton;
        elements.toggleView = newToggleViewButton;
        
        // Add new event listeners
        elements.increaseProblems.addEventListener('click', increaseProblemCount);
        elements.decreaseProblems.addEventListener('click', decreaseProblemCount);
        elements.toggleView.addEventListener('click', map.toggleView);
    }
    
    /**
     * Render the problems grid for current circuit
     */
    function renderProblems() {
        const circuit = state.getCurrentCircuit();
        if (!circuit) return;
        
        dataManager.updateLastViewed(circuit.id);
        
        elements.problemGrid.innerHTML = '';
        
        const showUnattempted = elements.showUnattempted.checked;
        const showFlashed = elements.showFlashed.checked;
        const showSent = elements.showSent.checked;
        const showProject = elements.showProject.checked;
        
        let filteredProblems = [...circuit.problems];
        const colorInfo = config.COLOR_OPTIONS[circuit.colorKey];
        
        // Apply completion filters
        filteredProblems = filteredProblems.filter(p => {
            if (p.status === 'unattempted' && showUnattempted) return true;
            if (p.status === 'flashed' && showFlashed) return true;
            if (p.status === 'sent' && showSent) return true;
            if (p.status === 'project' && showProject) return true;
            return false;
        });
        
        // Sort by problem number
        filteredProblems.sort((a, b) => a.id - b.id);
        
        // Create problem elements
        filteredProblems.forEach(problem => {
            const problemEl = document.createElement('div');
            problemEl.className = `problem ${problem.status}`;
            
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
            noteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                noteModal.openNoteModal(problem.id);
            });
            problemEl.appendChild(noteIcon);
            
            let statusSymbol = '';
            if (problem.status === 'flashed') statusSymbol = '⚡';
            if (problem.status === 'sent') statusSymbol = '✓';
            if (problem.status === 'project') statusSymbol = '🚧';
            problemEl.appendChild(document.createTextNode(statusSymbol));
            
            let timer;
            problemEl.addEventListener('touchstart', (e) => {
                if ('ontouchstart' in window) {
                    timer = setTimeout(() => {
                        noteModal.openNoteModal(problem.id);
                    }, 500);
                }
            });
            
            problemEl.addEventListener('touchend', () => {
                clearTimeout(timer);
            });
            
            problemEl.addEventListener('click', () => {
                if (state.getState().selectedProblemId === null) {
                    toggleProblem(problem.id);
                }
            });
            
            const noteEl = document.createElement('div');
            noteEl.className = 'problem-note';
            noteEl.textContent = problem.note || '';
            problemEl.appendChild(noteEl);
            
            elements.problemGrid.appendChild(problemEl);
        });
        
        updateStats();
    }
    
    /**
     * Update statistics display
     */
    function updateStats() {
        const circuit = state.getCurrentCircuit();
        if (!circuit) return;
        
        const totalCount = circuit.problems.length;
        const flashedCount = circuit.problems.filter(p => p.status === 'flashed').length;
        const totalSent = circuit.problems.filter(p => p.status === 'sent' || p.status === 'flashed').length;
        const projectCount = circuit.problems.filter(p => p.status === 'project').length;
        
        elements.totalCount.textContent = totalCount;
        elements.flashedCount.textContent = flashedCount;
        elements.sentCount.textContent = totalSent;
        elements.projectCount.textContent = projectCount;
    }
    
    /**
     * Increase the problem count for the current circuit
     */
    function increaseProblemCount() {
        const circuit = state.getCurrentCircuit();
        if (!circuit) return;
        
        const newProblemId = circuit.problems.length + 1;
        circuit.problems.push({
            id: newProblemId,
            status: 'unattempted',
            note: '',
            mapLocation: null
        });
        
        dataManager.saveCircuits();
        renderProblems();
        renderCircuitsList();
        loadCircuitDetails();
    }
    
    /**
     * Decrease the problem count for the current circuit
     */
    function decreaseProblemCount() {
        const circuit = state.getCurrentCircuit();
        if (!circuit) return;
        
        if (circuit.problems.length <= 1) {
            alert('Cannot reduce the number of problems to 0.');
            return;
        }
        
        const problemIndex = circuit.problems.length - 1;
        const problem = circuit.problems[problemIndex];
        
        if (problem && problem.status !== 'unattempted') {
            if (!confirm(`Are you sure you want to delete problem #${problem.id}? It is marked as ${problem.status}.`)) {
                return;
            }
        }
        
        circuit.problems.splice(problemIndex, 1);
        
        // Re-number the problems
        if (circuit.problems.length > 0) {
            for (let i = 0; i < circuit.problems.length; i++) {
                circuit.problems[i].id = i + 1;
            }
        }
        
        dataManager.saveCircuits();
        renderProblems();
        renderCircuitsList();
        loadCircuitDetails();
    }
    
    /**
     * Toggle problem completion status
     * @param {number} id - The ID of the problem to toggle
     */
    function toggleProblem(id) {
        const circuit = state.getCurrentCircuit();
        if (!circuit) return;
        
        const problem = circuit.problems.find(p => p.id === id);
        if (problem) {
            const currentStatusIndex = config.PROBLEM_STATUSES.indexOf(problem.status);
            problem.status = config.PROBLEM_STATUSES[(currentStatusIndex + 1) % config.PROBLEM_STATUSES.length];
            dataManager.saveCircuits();
            renderProblems();
            renderCircuitsList(); // Update the completion stats in the list
        }
    }
    
    /**
     * Reset progress for all problems in the current circuit
     */
    function resetProgress() {
        const circuit = state.getCurrentCircuit();
        if (!circuit) return;
        
        if (confirm('Are you sure you want to reset all progress for this circuit?')) {
            circuit.problems.forEach(p => p.status = 'unattempted');
            dataManager.saveCircuits();
            renderProblems();
            renderCircuitsList();
        }
    }

    // Expose UI rendering functions to other modules
    window.BoulderingApp = window.BoulderingApp || {};
    window.BoulderingApp.uiRenderer = {
        populateColorDropdown,
        renderCircuitsList,
        loadCircuitDetails,
        renderProblems,
        updateStats,
        increaseProblemCount,
        decreaseProblemCount,
        toggleProblem,
        resetProgress
    };
})();
