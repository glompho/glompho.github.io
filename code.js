/**
 * Bouldering Problems Tracker
 * A web application for tracking bouldering circuits and problems.
 */

// Wrap everything in an IIFE to avoid global scope pollution
(function() {
    'use strict';

    //=============================================================================
    // CONFIGURATION
    //=============================================================================

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

    //=============================================================================
    // STATE MANAGEMENT
    //=============================================================================

    // Application state
    let state = {
        circuits: [],
        currentCircuitId: null,
        selectedProblemId: null,
        mapViewVisible: false
    };

    //=============================================================================
    // DOM ELEMENTS
    //=============================================================================

    // Circuit modal elements
    const elements = {
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

    //=============================================================================
    // UTILITY FUNCTIONS
    //=============================================================================
    
    /**
     * Get the current circuit based on currentCircuitId
     * @returns {Object|null} The current circuit or null if not found
     */
    function getCurrentCircuit() {
        return state.circuits.find(c => c.id === state.currentCircuitId);
    }
    
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
        const month = MONTHS[date.getMonth()];
        const year = date.getFullYear();
        const colorName = COLOR_OPTIONS[colorKey].label.split(' ')[0];
        
        return `${month} ${year} ${colorName} Circuit`;
    }

    //=============================================================================
    // DATA MANAGEMENT
    //=============================================================================
    
    /**
     * Load circuits from localStorage
     */
    function loadCircuits() {
        const savedCircuits = localStorage.getItem('boulderingCircuits');
        if (savedCircuits) {
            state.circuits = JSON.parse(savedCircuits);
            // Ensure each circuit has a lastViewed property
            state.circuits.forEach(circuit => {
                if (circuit.lastViewed === undefined) {
                    circuit.lastViewed = null;
                }
            });
        }
        
        const lastCircuitId = localStorage.getItem('lastCircuitId');
        
        if (lastCircuitId && state.circuits.find(c => c.id === lastCircuitId)) {
            state.currentCircuitId = lastCircuitId;
            loadCircuitDetails();
        } else {
            state.currentCircuitId = null;
            elements.circuitDetailsSection.style.display = 'none';
            elements.circuitListSection.style.display = 'block';
        }
        
        renderCircuitsList();
    }
    
    /**
     * Save circuits to localStorage
     */
    function saveCircuits() {
        localStorage.setItem('boulderingCircuits', JSON.stringify(state.circuits));
    }
    
    /**
     * Update the lastViewed timestamp for a circuit
     * @param {string} circuitId - The ID of the circuit to update
     */
    function updateLastViewed(circuitId) {
        const circuit = state.circuits.find(c => c.id === circuitId);
        if (!circuit) return;
        
        circuit.lastViewed = Date.now();
        saveCircuits();
    }
    
    /**
     * Create a new circuit
     * @param {string} name - The name of the circuit
     * @param {number} problemCount - The number of problems in the circuit
     * @param {string} colorKey - The color key for the circuit
     */
    function createNewCircuit(name, problemCount, colorKey) {
        const id = generateId();
        const problems = generateProblems(problemCount, colorKey);
        
        const newCircuit = {
            id,
            name,
            colorKey,
            problems,
            lastViewed: null
        };
        
        state.circuits.push(newCircuit);
        state.currentCircuitId = id;
        saveCircuits();
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
        const circuit = state.circuits.find(c => c.id === circuitId);
        if (!circuit) return;
        
        const problem = circuit.problems.find(p => p.id === problemId);
        if (problem) {
            problem.note = note;
            saveCircuits();
            renderProblems();
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

    //=============================================================================
    // MAP FUNCTIONALITY
    //=============================================================================

    /**
     * Select a problem for location placement on the map
     * @param {number} problemId - The ID of the problem to place on the map
     */
    function selectProblemForLocation(problemId) {
        state.selectedProblemId = problemId;
        state.mapViewVisible = true;
        
        elements.problemGrid.style.display = 'none';
        elements.mapView.style.display = 'block';
        
        renderProblems();
        renderMap();
    }

    /**
     * Render the map with problem pins
     * Ensures pins appear on top of the map
     */
    function renderMap() {
        const circuit = getCurrentCircuit();
        if (!circuit) return;
        
        elements.mapImage.style.cursor = state.selectedProblemId ? 'crosshair' : 'default';
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
                openNoteModal(problem.id);
            });
        });
    }

    /**
     * Toggle between problem grid and map view
     */
    function toggleView() {
        state.mapViewVisible = !state.mapViewVisible;
        
        if (state.mapViewVisible) {
            elements.problemGrid.style.display = 'none';
            elements.mapView.style.display = 'block';
        } else {
            elements.problemGrid.style.display = 'grid';
            elements.mapView.style.display = 'none';
            state.selectedProblemId = null; // Clear selectedProblemId when exiting map view
        }
        renderMap();
    }

    /**
     * Handle map click to set problem location
     * @param {Event} e - The click event
     */
    function handleMapClick(e) {
        if (!state.selectedProblemId) return;
        
        e.stopPropagation();
        
        const rect = elements.mapImage.getBoundingClientRect();
        
        // Calculate position relative to the image's natural dimensions
        const x = Math.round((e.clientX - rect.left) / rect.width * elements.mapImage.naturalWidth);
        const y = Math.round((e.clientY - rect.top) / rect.height * elements.mapImage.naturalHeight);
        
        console.log('Click coordinates on image:', e.clientX - rect.left, e.clientY - rect.top);
        console.log('Normalized coordinates:', x, y);
        
        const circuit = getCurrentCircuit();
        if (!circuit) return;
        
        const problem = circuit.problems.find(p => p.id === state.selectedProblemId);
        if (problem) {
            problem.mapLocation = `${x},${y}`;
            saveCircuits();
            renderMap();
            
            // Optionally provide feedback
            console.log(`Set location for problem #${state.selectedProblemId} at ${x},${y}`);
        }
    }

    //=============================================================================
    // NOTE MODAL FUNCTIONALITY
    //=============================================================================

    /**
     * Open the note modal for a specific problem
     * @param {number} problemId - The ID of the problem to open notes for
     */
    function openNoteModal(problemId) {
        state.selectedProblemId = problemId;
        const circuit = getCurrentCircuit();
        if (!circuit) return;

        const problem = circuit.problems.find(p => p.id === problemId);
        if (!problem) return;

        elements.noteModalTitle.textContent = `Note for Problem #${problemId}`;
        elements.noteInput.value = problem.note || '';
        elements.noteStatusSelect.value = problem.status;

        const setLocationBtn = document.getElementById('setLocationBtn');
        setLocationBtn.style.display = "block";
        
        // Remove any existing event listeners to prevent duplicates
        const newSetLocationBtn = setLocationBtn.cloneNode(true);
        setLocationBtn.parentNode.replaceChild(newSetLocationBtn, setLocationBtn);
        
        newSetLocationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectProblemForLocation(problemId);
            elements.noteModal.style.display = "none";
        });

        elements.noteModal.style.display = "block";
    }
    
    /**
     * Save the note and status for the selected problem
     */
    function saveNote() {
        if (!state.selectedProblemId) return;
        
        const newStatus = elements.noteStatusSelect.value;
        const circuit = getCurrentCircuit();
        
        if (circuit) {
            const problem = circuit.problems.find(p => p.id === state.selectedProblemId);
            if (problem) {
                problem.status = newStatus;
                problem.note = elements.noteInput.value;
                saveCircuits();
                renderProblems();
                renderCircuitsList();
                renderMap();
            }
        }
        
        state.selectedProblemId = null; // Clear selectedProblemId after saving
        elements.noteModal.style.display = "none";
    }
    
    //=============================================================================
    // UI RENDERING
    //=============================================================================
    
    /**
     * Populate color dropdown from COLOR_OPTIONS
     */
    function populateColorDropdown() {
        elements.circuitColorSelect.innerHTML = '';
        
        Object.entries(COLOR_OPTIONS).forEach(([key, info]) => {
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
        
        // Sort circuits by lastViewed (most recent first)
        state.circuits.sort((a, b) => {
            if (a.lastViewed === null && b.lastViewed === null) return 0;
            if (a.lastViewed === null) return 1;
            if (b.lastViewed === null) return -1;
            return b.lastViewed - a.lastViewed;
        });
        
        state.circuits.forEach(circuit => {
            const item = document.createElement('div');
            item.className = `circuit-item ${circuit.id === state.currentCircuitId ? 'active' : ''}`;
            
            const sentCount = circuit.problems.filter(p => p.status === 'sent').length;
            const flashedCount = circuit.problems.filter(p => p.status === 'flashed').length;
            const totalSent = sentCount + flashedCount;
            const percentage = Math.round((totalSent / circuit.problems.length) * 100);
            const colorInfo = COLOR_OPTIONS[circuit.colorKey];
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
                state.currentCircuitId = btn.dataset.id;
                localStorage.setItem('lastCircuitId', state.currentCircuitId);
                saveCircuits();
                loadCircuitDetails();
                renderCircuitsList();
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (state.circuits.length <= 1) {
                    alert('You must have at least one circuit.');
                    return;
                }
                
                if (confirm('Are you sure you want to delete this circuit?')) {
                    state.circuits = state.circuits.filter(c => c.id !== id);
                    
                    // If we're deleting the current circuit, switch to the first one
                    if (id === state.currentCircuitId) {
                        state.currentCircuitId = state.circuits[0].id;
                    }
                    
                    saveCircuits();
                    renderCircuitsList();
                }
            });
        });
    }
    
    /**
     * Load current circuit details
     */
    function loadCircuitDetails() {
        const circuit = getCurrentCircuit();
        if (!circuit) return;
        
        updateLastViewed(circuit.id);
        console.log(`Circuit ${circuit.name} lastViewed: ${circuit.lastViewed}`);
        
        document.getElementById('circuit-name-display').textContent = circuit.name;
        
        // Set the color display
        const colorInfo = COLOR_OPTIONS[circuit.colorKey];
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
        
        localStorage.setItem('lastCircuitId', state.currentCircuitId);
        renderProblems();
        renderMap();
        
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
        elements.toggleView.addEventListener('click', toggleView);
    }
    
    /**
     * Render the problems grid for current circuit
     */
    function renderProblems() {
        const circuit = getCurrentCircuit();
        if (!circuit) return;
        
        updateLastViewed(circuit.id);
        
        elements.problemGrid.innerHTML = '';
        
        const showUnattempted = elements.showUnattempted.checked;
        const showFlashed = elements.showFlashed.checked;
        const showSent = elements.showSent.checked;
        const showProject = elements.showProject.checked;
        
        let filteredProblems = [...circuit.problems];
        const colorInfo = COLOR_OPTIONS[circuit.colorKey];
        
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
                openNoteModal(problem.id);
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
                        openNoteModal(problem.id);
                    }, 500);
                }
            });
            
            problemEl.addEventListener('touchend', () => {
                clearTimeout(timer);
            });
            
            problemEl.addEventListener('click', () => {
                if (state.selectedProblemId === null) {
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
        const circuit = getCurrentCircuit();
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
    
    //=============================================================================
    // PROBLEM MANAGEMENT
    //=============================================================================
    
    /**
     * Increase the problem count for the current circuit
     */
    function increaseProblemCount() {
        const circuit = getCurrentCircuit();
        if (!circuit) return;
        
        const newProblemId = circuit.problems.length + 1;
        circuit.problems.push({
            id: newProblemId,
            status: 'unattempted',
            note: '',
            mapLocation: null
        });
        
        saveCircuits();
        renderProblems();
        renderCircuitsList();
        loadCircuitDetails();
    }
    
    /**
     * Decrease the problem count for the current circuit
     */
    function decreaseProblemCount() {
        const circuit = getCurrentCircuit();
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
        
        saveCircuits();
        renderProblems();
        renderCircuitsList();
        loadCircuitDetails();
    }
    
    /**
     * Toggle problem completion status
     * @param {number} id - The ID of the problem to toggle
     */
    function toggleProblem(id) {
        const circuit = getCurrentCircuit();
        if (!circuit) return;
        
        const problem = circuit.problems.find(p => p.id === id);
        if (problem) {
            const currentStatusIndex = PROBLEM_STATUSES.indexOf(problem.status);
            problem.status = PROBLEM_STATUSES[(currentStatusIndex + 1) % PROBLEM_STATUSES.length];
            saveCircuits();
            renderProblems();
            renderCircuitsList(); // Update the completion stats in the list
        }
    }
    
    /**
     * Reset progress for all problems in the current circuit
     */
    function resetProgress() {
        const circuit = getCurrentCircuit();
        if (!circuit) return;
        
        if (confirm('Are you sure you want to reset all progress for this circuit?')) {
            circuit.problems.forEach(p => p.status = 'unattempted');
            saveCircuits();
            renderProblems();
            renderCircuitsList();
        }
    }
    
    //=============================================================================
    // IMPORT/EXPORT FUNCTIONALITY
    //=============================================================================
    
    /**
     * Export circuits to a text file
     */
    function exportCircuits() {
        const circuits = JSON.parse(localStorage.getItem('boulderingCircuits') || '[]');
        if (!circuits.length) {
            alert('No circuits to export.');
            return;
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
        
        const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileName = 'circuits.txt';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
    }
    
    /**
     * Import circuits from a text file
     * @param {Event} event - The file input change event
     */
    function importCircuits(event) {
        const file = event.target.files[0];
        if (!file) {
            alert('No file selected.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataStr = e.target.result;
            try {
                const parsedCircuits = parseCircuitData(dataStr);
                
                // ID Preservation Logic
                const existingCircuits = JSON.parse(localStorage.getItem('boulderingCircuits') || '[]');
                const existingIds = new Set(existingCircuits.map(c => c.id));
                
                parsedCircuits.forEach(c => {
                    if (!c.id || existingIds.has(c.id)) {
                        c.id = generateId(); // Only generate new ID if conflict exists
                    }
                    existingIds.add(c.id); // Add the new id to the set
                });
                
                localStorage.setItem('boulderingCircuits', JSON.stringify(parsedCircuits));
                alert('Circuits imported successfully!');
                loadCircuits(); // Reload the circuits
            } catch (error) {
                console.error('Error importing circuits:', error);
                alert('Error importing circuits: Invalid file format.');
            }
        };
        reader.readAsText(file);
    }
    
    //=============================================================================
    // EVENT LISTENERS
    //=============================================================================
    
    // Initialize event listeners
    function initEventListeners() {
        // Map click handler
        elements.mapImage.addEventListener('click', handleMapClick);
        
        // Make sure problem pins don't interfere with map clicking
        elements.problemPins.addEventListener('click', (e) => {
            // Only stop propagation if clicking on an actual pin
            if (e.target.classList.contains('problem-pin')) {
                e.stopPropagation();
            }
        });
        
        // Note modal handlers
        elements.noteCloseBtn.onclick = function() {
            elements.noteModal.style.display = "none";
        };
        
        elements.saveNoteBtn.onclick = saveNote;
        
        // Circuit modal handlers
        elements.newCircuitBtn.onclick = function() {
            // Generate default name based on the first color option
            const defaultColorKey = Object.keys(COLOR_OPTIONS)[0];
            elements.circuitColorSelect.value = defaultColorKey;
            elements.circuitNameInput.value = generateDefaultCircuitName(defaultColorKey);
            
            elements.modal.style.display = 'block';
        };
        
        // Update the default name when color changes
        elements.circuitColorSelect.onchange = function() {
            elements.circuitNameInput.value = generateDefaultCircuitName(this.value);
        };
        
        elements.closeModalBtn.onclick = function() {
            elements.modal.style.display = 'none';
        };
        
        window.onclick = function(event) {
            if (event.target === elements.modal) {
                elements.modal.style.display = 'none';
            }
        };
        
        // Form submission
        elements.newCircuitForm.onsubmit = function(e) {
            e.preventDefault();
            
            const name = elements.circuitNameInput.value;
            const count = parseInt(document.getElementById('problem-count').value);
            const colorKey = elements.circuitColorSelect.value;
            
            createNewCircuit(name, count, colorKey);
            renderCircuitsList();
            loadCircuitDetails();
            
            // Close modal and reset form
            elements.modal.style.display = 'none';
            elements.newCircuitForm.reset();
        };
        
        // Reset progress
        elements.resetProgress.addEventListener('click', resetProgress);
        
        // Back to circuits list
        elements.backToCircuitsBtn.addEventListener('click', () => {
            elements.circuitDetailsSection.style.display = 'none';
            elements.circuitListSection.style.display = 'block';
        });
        
        // Import/Export
        elements.exportCircuits.addEventListener('click', exportCircuits);
        
        elements.importCircuits.addEventListener('click', () => {
            // Remove any existing event listeners to prevent duplicates
            const newInput = elements.importCircuitsInput.cloneNode(true);
            elements.importCircuitsInput.parentNode.replaceChild(newInput, elements.importCircuitsInput);
            elements.importCircuitsInput = newInput;
            
            elements.importCircuitsInput.addEventListener('change', importCircuits);
            elements.importCircuitsInput.click();
        });
        
        // Filter checkboxes
        elements.showUnattempted.addEventListener('change', renderProblems);
        elements.showFlashed.addEventListener('change', renderProblems);
        elements.showSent.addEventListener('change', renderProblems);
        elements.showProject.addEventListener('change', renderProblems);
    }
    
    //=============================================================================
    // INITIALIZATION
    //=============================================================================
    
    // Initialize the app
    function init() {
        // Populate the color dropdown
        populateColorDropdown();
        
        // Set up event listeners
        initEventListeners();
        
        // Load circuits from localStorage
        loadCircuits();
    }
    
    // Run initialization when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
    
})(); // Close the IIFE
