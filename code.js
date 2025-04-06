// Grade colors and their corresponding display names
const colorOptions = {

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

// Store all circuits
let circuits = [];
let currentCircuitId = null;

// Modal elements
const modal = document.getElementById('new-circuit-modal');
const newCircuitBtn = document.getElementById('new-circuit-btn');
const closeModalBtn = document.getElementById('close-modal');
const newCircuitForm = document.getElementById('new-circuit-form');
const circuitNameInput = document.getElementById('circuit-name');
const circuitColorSelect = document.getElementById('circuit-color');

// Circuit navigation
const backToCircuitsBtn = document.getElementById('back-to-circuits');
const circuitDetailsSection = document.getElementById('circuit-details');
const circuitListSection = document.getElementById('circuit-list');

 // Get the note modal
const noteModal = document.getElementById("noteModal");

// Get the button that opens the note modal
// const noteBtn = document.getElementById("noteBtn");

// Get the <span> element that closes the note modal
const noteCloseBtn = document.getElementById("noteClose");
const saveNoteBtn = document.getElementById("saveNote");
const noteInput = document.getElementById("noteInput");
const noteModalTitle = document.getElementById("noteModalTitle");
const noteStatusSelect = document.getElementById("noteStatusSelect");
const mapLocationInput = document.getElementById("mapLocation");

let selectedProblemId = null;
let mapViewVisible = false;

function selectProblemForLocation(problemId) {
    selectedProblemId = problemId;
    mapViewVisible = true;
    const problemGrid = document.getElementById('problem-grid');
    const mapView = document.getElementById('map-view');
    problemGrid.style.display = 'none';
    mapView.style.display = 'block';
    renderProblems();
    renderMap();
}
// Function to render the map with problem pins
// Updated function to ensure pins appear on top of the map
function renderMap() {
    const circuit = circuits.find(c => c.id === currentCircuitId);
    if (!circuit) return;
    
    const mapImage = document.getElementById('map-image');
    mapImage.style.cursor = selectedProblemId ? 'crosshair' : 'default';
    
    const problemPins = document.getElementById('problem-pins');
    problemPins.innerHTML = '';
    
    circuit.problems.forEach(problem => {
        if (problem.mapLocation) {
            console.log('problem.mapLocation:', problem.mapLocation);
            const [x, y] = problem.mapLocation.split(',').map(Number);
            if (isNaN(x) || isNaN(y)) return;
            
            // Calculate position as percentage of natural image dimensions
            const xPercent = (x / mapImage.naturalWidth) * 100;
            const yPercent = (y / mapImage.naturalHeight) * 100;
            
            const pin = document.createElement('div');
            pin.className = 'problem-pin';
            pin.style.position = 'absolute';
            pin.style.left = `${xPercent}%`;
            pin.style.top = `${yPercent}%`;
            
            // Add status indicator to pin
            if (problem.status) {
                pin.classList.add(problem.status);
            } else {
                pin.classList.add('unattempted');
            }
            
            pin.textContent = problem.id;
            problemPins.appendChild(pin);
            
            // Add click handler to pins if needed
            pin.addEventListener('click', (e) => {
                // Option to open note modal when clicking on pins
                e.stopPropagation();
                openNoteModal(problem.id);
            });
        }
    });
}


const mapImage = document.getElementById('map-image');
mapImage.addEventListener('click', (e) => {
    if (selectedProblemId) {
        // Stop event propagation
        e.stopPropagation();
        
        const rect = mapImage.getBoundingClientRect();
        
        // Calculate position relative to the image's natural dimensions
        const x = Math.round((e.clientX - rect.left) / rect.width * mapImage.naturalWidth);
        const y = Math.round((e.clientY - rect.top) / rect.height * mapImage.naturalHeight);
        
        console.log('Click coordinates on image:', e.clientX - rect.left, e.clientY - rect.top);
        console.log('Normalized coordinates:', x, y);
        
        const circuit = circuits.find(c => c.id === currentCircuitId);
        if (!circuit) return;
        
        const problem = circuit.problems.find(p => p.id === selectedProblemId);
        if (problem) {
            problem.mapLocation = `${x},${y}`;
            saveCircuits();
            renderMap();
            
            // Optionally provide feedback
            console.log(`Set location for problem #${selectedProblemId} at ${x},${y}`);
        }
    }
});

// Make sure problem pins don't interfere with map clicking
document.getElementById('problem-pins').addEventListener('click', (e) => {
    // Only stop propagation if clicking on an actual pin
    if (e.target.classList.contains('problem-pin')) {
        e.stopPropagation();
    }
});

// Function to toggle between problem grid and map view
function toggleView() {
    mapViewVisible = !mapViewVisible;
    const problemGrid = document.getElementById('problem-grid');
    const mapView = document.getElementById('map-view');

    if (mapViewVisible) {
        problemGrid.style.display = 'none';
        mapView.style.display = 'block';
    } else {
        problemGrid.style.display = 'grid';
        mapView.style.display = 'none';
        selectedProblemId = null; // Clear selectedProblemId when exiting map view
    }
    renderMap();
}

// Close note modal function
noteCloseBtn.onclick = function() {
    noteModal.style.display = "none";
}

// Save note function
saveNoteBtn.onclick = function() {
    if (selectedProblemId) {
        const newStatus = noteStatusSelect.value;
        const circuit = circuits.find(c => c.id === currentCircuitId);
        if (circuit) {
            const problem = circuit.problems.find(p => p.id === selectedProblemId);
            if (problem) {
                problem.status = newStatus;
            }
        }
        addNoteToProblem(currentCircuitId, selectedProblemId, noteInput.value);
        renderProblems(); // re-render the problems
        renderCircuitsList(); // Update the circuit list
        renderMap();
    }
    selectedProblemId = null; // Clear selectedProblemId after saving
    noteModal.style.display = "none";
};

function openNoteModal(problemId) {
    selectedProblemId = problemId;
    const circuit = circuits.find(c => c.id === currentCircuitId);
    if (!circuit) return;

    const problem = circuit.problems.find(p => p.id === problemId);
    if (!problem) return;

    noteModalTitle.textContent = `Note for Problem #${problemId}`;
    noteInput.value = problem.note || '';
    noteStatusSelect.value = problem.status;

    const setLocationBtn = document.getElementById('setLocationBtn');
    setLocationBtn.style.display = "block";
    setLocationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectProblemForLocation(problemId);
        noteModal.style.display = "none";
    });

    noteModal.style.display = "block";
}

// Populate color dropdown from colorOptions
function populateColorDropdown() {
    circuitColorSelect.innerHTML = '';

    Object.entries(colorOptions).forEach(([key, info]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = info.label;
        circuitColorSelect.appendChild(option);
    });
}

// Load circuits from localStorage
function loadCircuits() {
    const savedCircuits = localStorage.getItem('boulderingCircuits');
    if (savedCircuits) {
        circuits = JSON.parse(savedCircuits);
        // Ensure each circuit has a lastViewed property
        circuits.forEach(circuit => {
            if (circuit.lastViewed === undefined) {
                circuit.lastViewed = null;
            }
        });
    }

   

    const lastCircuitId = localStorage.getItem('lastCircuitId');

    if (lastCircuitId && circuits.find(c => c.id === lastCircuitId)) {
        currentCircuitId = lastCircuitId;
        loadCircuitDetails();
    } else {
        currentCircuitId = null;
        circuitDetailsSection.style.display = 'none';
        circuitListSection.style.display = 'block';
    }

    renderCircuitsList();
}

// Save circuits to localStorage
function saveCircuits() {
    localStorage.setItem('boulderingCircuits', JSON.stringify(circuits));
}

// Render the list of circuits
function renderCircuitsList() {
    const container = document.getElementById('circuits-container');
    container.innerHTML = '';

    // Sort circuits by lastViewed (most recent first)
    circuits.sort((a, b) => {
        if (a.lastViewed === null && b.lastViewed === null) return 0;
        if (a.lastViewed === null) return 1;
        if (b.lastViewed === null) return -1;
        return b.lastViewed - a.lastViewed;
    });

    circuits.forEach(circuit => {
        const item = document.createElement('div');
        item.className = `circuit-item ${circuit.id === currentCircuitId ? 'active' : ''}`;

        const sentCount = circuit.problems.filter(p => p.status === 'sent').length;
        const flashedCount = circuit.problems.filter(p => p.status === 'flashed').length;
        const totalSent = sentCount + flashedCount;
        const percentage = Math.round((totalSent / circuit.problems.length) * 100);
        const colorInfo = colorOptions[circuit.colorKey];
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
            currentCircuitId = btn.dataset.id;
            localStorage.setItem('lastCircuitId', currentCircuitId);
            saveCircuits();
            loadCircuitDetails();
            renderCircuitsList();
        });
    });


    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (circuits.length <= 1) {
                alert('You must have at least one circuit.');
                return;
            }

            if (confirm('Are you sure you want to delete this circuit?')) {
                circuits = circuits.filter(c => c.id !== id);

                // If we're deleting the current circuit, switch to the first one
                if (id === currentCircuitId) {
                    currentCircuitId = circuits[0].id;
                }

                saveCircuits();
                renderCircuitsList();
            }
        });
    });
}

function increaseProblemCount() {
    const circuit = circuits.find(c => c.id === currentCircuitId);
    if (!circuit) return;

    const newProblemId = circuit.problems.length + 1;
        circuit.problems.push({
            id: newProblemId,
            status: 'unattempted'
        });
        saveCircuits();
        renderProblems();
        renderCircuitsList();
        loadCircuitDetails();
}

function decreaseProblemCount() {
     const circuit = circuits.find(c => c.id === currentCircuitId);
    if (!circuit) return;

    if (circuit.problems.length <= 1) {
        alert('Cannot reduce the number of problems to 0.');
        return;
    }

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

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Create a new circuit
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

    circuits.push(newCircuit);
    currentCircuitId = id;
    saveCircuits();
}

// Generate problems based on count and color
function generateProblems(count, colorKey) {
    let problems = [];
    const colorInfo = colorOptions[colorKey];

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

// Function to add notes to problems
function addNoteToProblem(circuitId, problemId, note) {
    const circuit = circuits.find(c => c.id === circuitId);
    if (!circuit) return;

    const problem = circuit.problems.find(p => p.id === problemId);
    if (problem) {
        problem.note = note;
        saveCircuits();
        renderProblems();
    }
}

// Generate default circuit name based on date and color
function generateDefaultCircuitName(colorKey) {
    const date = new Date();
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const colorName = colorOptions[colorKey].label.split(' ')[0];

    return `${month} ${year} ${colorName} Circuit`;
}

// Load current circuit details
function updateLastViewed(circuitId) {
    const circuit = circuits.find(c => c.id === circuitId);
    if (!circuit) return;

    circuit.lastViewed = Date.now();
    saveCircuits();
}

function loadCircuitDetails() {
    const circuit = circuits.find(c => c.id === currentCircuitId);
    if (!circuit) return;

    updateLastViewed(circuit.id);
    console.log(`Circuit ${circuit.name} lastViewed: ${circuit.lastViewed}`);
    document.getElementById('circuit-name-display').textContent = circuit.name;

    // Set the color display
    const colorInfo = colorOptions[circuit.colorKey];
    const colorBox = document.getElementById('circuit-color-box');
    const colorLabel = document.getElementById('circuit-color-label');

    if (colorInfo.type === 'gradient') {
        colorBox.style.background = `linear-gradient(to bottom right, ${colorInfo.colors[0]} 50%, ${colorInfo.colors[1]} 50%)`;
    } else {
        colorBox.style.backgroundColor = colorInfo.color;
    }
    colorLabel.textContent = colorInfo.label;

    // Show circuit details and hide circuit list
    circuitListSection.style.display = 'none';
    circuitDetailsSection.style.display = 'block';

    localStorage.setItem('lastCircuitId', currentCircuitId);
    renderProblems();
    renderMap();

    const increaseButton = document.getElementById('increase-problems');
    const decreaseButton = document.getElementById('decrease-problems');
    const toggleViewButton = document.getElementById('toggle-view');

    increaseButton.removeEventListener('click', increaseProblemCount);
    decreaseButton.removeEventListener('click', decreaseProblemCount);
    toggleViewButton.removeEventListener('click', toggleView);

    increaseButton.addEventListener('click', increaseProblemCount);
    decreaseButton.addEventListener('click', decreaseProblemCount);
    toggleViewButton.addEventListener('click', toggleView);
}

// Render the problems grid for current circuit
function renderProblems() {
    const circuit = circuits.find(c => c.id === currentCircuitId);
    if (!circuit) return;

    updateLastViewed(circuit.id);

    const grid = document.getElementById('problem-grid');
    grid.innerHTML = '';

    const showUnattempted = document.getElementById('show-unattempted').checked;
    const showFlashed = document.getElementById('show-flashed').checked;
    const showSent = document.getElementById('show-sent').checked;
    const showProject = document.getElementById('show-project').checked;

    let filteredProblems = [...circuit.problems];
    const colorInfo = colorOptions[circuit.colorKey];

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
            if (selectedProblemId === null) {
                toggleProblem(problem.id);
            }
        });

        const noteEl = document.createElement('div');
        noteEl.className = 'problem-note';
        noteEl.textContent = problem.note || '';
        problemEl.appendChild(noteEl);

        grid.appendChild(problemEl);
    });

    updateStats();

    function showNoteInput(problemId, target) {
        const circuit = circuits.find(c => c.id === currentCircuitId);
        if (!circuit) return;

        const problem = circuit.problems.find(p => p.id === problemId);
        if (!problem) return;

        // Create input element
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.className = 'note-input';
        inputEl.value = problem.note || '';

        // Event listener for saving the note
        inputEl.addEventListener('blur', () => {
            addNoteToProblem(currentCircuitId, problemId, inputEl.value);
            renderProblems(); // Re-render problems to display the note
        });

        // Replace the number with the input field
        target.innerHTML = '';
        target.appendChild(inputEl);
        inputEl.focus();
    }
}

// Toggle problem completion status
function toggleProblem(id) {
    const circuit = circuits.find(c => c.id === currentCircuitId);
    if (!circuit) return;

    const problem = circuit.problems.find(p => p.id === id);
    if (problem) {
        const statuses = ['unattempted', 'flashed', 'sent', 'project'];
        const currentStatusIndex = statuses.indexOf(problem.status);
        problem.status = statuses[(currentStatusIndex + 1) % statuses.length];
        saveCircuits();
        renderProblems();
        renderCircuitsList(); // Update the completion stats in the list
    }
}

// Update statistics
function updateStats() {
    const circuit = circuits.find(c => c.id === currentCircuitId);
    if (!circuit) return;

    const totalCount = circuit.problems.length;
    const flashedCount = circuit.problems.filter(p => p.status === 'flashed').length;
    const totalSent = circuit.problems.filter(p => p.status === 'sent' || p.status === 'flashed').length;
    const projectCount = circuit.problems.filter(p => p.status === 'project').length;

    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('flashed-count').textContent = flashedCount;
    document.getElementById('sent-count').textContent = totalSent;
    document.getElementById('project-count').textContent = projectCount;
}

// Modal handling
newCircuitBtn.onclick = function() {
    // Generate default name based on the first color option
    const defaultColorKey = Object.keys(colorOptions)[0];
    circuitColorSelect.value = defaultColorKey;
    circuitNameInput.value = generateDefaultCircuitName(defaultColorKey);

    modal.style.display = 'block';
}

// Update the default name when color changes
circuitColorSelect.onchange = function() {
    circuitNameInput.value = generateDefaultCircuitName(this.value);
}

closeModalBtn.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Form submission
newCircuitForm.onsubmit = function(e) {
    e.preventDefault();

    const name = circuitNameInput.value;
    const count = parseInt(document.getElementById('problem-count').value);
    const colorKey = circuitColorSelect.value;

    createNewCircuit(name, count, colorKey);
    renderCircuitsList();
    loadCircuitDetails();

    // Close modal and reset form
    modal.style.display = 'none';
    newCircuitForm.reset();
}

// Reset progress
document.getElementById('reset-progress').addEventListener('click', () => {
    const circuit = circuits.find(c => c.id === currentCircuitId);
    if (!circuit) return;

    if (confirm('Are you sure you want to reset all progress for this circuit?')) {
        circuit.problems.forEach(p => p.status = 'unattempted');
        saveCircuits();
        renderProblems();
        renderCircuitsList();
    }
});

// Back to circuits list
backToCircuitsBtn.addEventListener('click', () => {
    circuitDetailsSection.style.display = 'none';
    circuitListSection.style.display = 'block';
});

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

function parseCircuitData(dataStr) {
    const circuits = [];
    let currentCircuit = null;
    let state = 'HEADER';

    dataStr.split('\n').forEach(line => {
        if (line.startsWith('=== BOULDERING CIRCUITS v1 ===')) {
            state = 'CIRCUIT';
        } else if (line.startsWith('=== CIRCUIT ===')) {
            state = 'CIRCUIT';
            currentCircuit = { problems: [] };
            circuits.push(currentCircuit);
        } else if (line.startsWith('=== PROBLEMS ===')) {
            state = 'PROBLEMS';
        } else if (state === 'CIRCUIT') {
            const [key, ...vals] = line.split(': ');
            const val = vals.join(': '); // Handle values with colons
            if (key === 'ID') currentCircuit.id = val;
            if (key === 'Name') currentCircuit.name = val;
            if (key === 'Color') currentCircuit.colorKey = val;
             if (key === 'LastViewed') {
                currentCircuit.lastViewed = val === 'Never' ? null : new Date(val).getTime();
            }
        } else if (state === 'PROBLEMS') {
            const match = line.match(/(\d+): Status-(\w+) Note-(.*)/);
            if (match) {
                currentCircuit.problems.push({
                    id: parseInt(match[1]),
                    status: match[2],
                    note: match[3].trim() || ''
                });
            }
        }
    });

    return circuits;
}

// Add event listener to the import button
document.getElementById('import-circuits-btn').addEventListener('click', () => {
    document.getElementById('import-circuits-input').addEventListener('change', importCircuits);
    document.getElementById('import-circuits-input').click();
});

// Add event listener to the export button
document.getElementById('export-circuits-btn').addEventListener('click', exportCircuits);

// Set up event listeners for filters
document.getElementById('show-unattempted').addEventListener('change', renderProblems);
document.getElementById('show-flashed').addEventListener('change', renderProblems);
document.getElementById('show-sent').addEventListener('change', renderProblems);
document.getElementById('show-project').addEventListener('change', renderProblems);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Populate the color dropdown
    populateColorDropdown();
    // Clear lastCircuitId from localStorage
    loadCircuits();
});
