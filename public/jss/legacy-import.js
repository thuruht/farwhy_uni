// legacy-import.js - Import and deduplicate events from legacy system

// Configuration for legacy API endpoints
const LEGACY_ENDPOINTS = {
    farewell: 'https://fygw0.kcmo.xyz/list/farewell',
    howdy: 'https://fygw0.kcmo.xyz/list/howdy'
};

// Global variables for import process
let importInProgress = false;
let importResults = [];

// Initialize import functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for import button
    const importBtn = document.getElementById('import-legacy-events-btn');
    if (importBtn) {
        importBtn.addEventListener('click', openImportLegacyModal);
    }
});

function openImportLegacyModal() {
    const modal = document.getElementById('import-legacy-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Reset form state
        document.getElementById('import-farewell').checked = true;
        document.getElementById('import-howdy').checked = true;
        document.getElementById('dry-run-mode').checked = true;
        
        // Hide progress section
        const progressDiv = document.getElementById('import-progress');
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
        
        // Reset button
        const startBtn = document.getElementById('start-import-btn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Import';
        }
    }
}

function closeImportLegacyModal() {
    const modal = document.getElementById('import-legacy-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    importInProgress = false;
}

async function startLegacyImport() {
    if (importInProgress) return;
    
    importInProgress = true;
    importResults = [];
    
    const startBtn = document.getElementById('start-import-btn');
    const progressDiv = document.getElementById('import-progress');
    const statusDiv = document.getElementById('import-status');
    const resultsDiv = document.getElementById('import-results');
    
    // Get import settings
    const importFarewell = document.getElementById('import-farewell').checked;
    const importHowdy = document.getElementById('import-howdy').checked;
    const dryRun = document.getElementById('dry-run-mode').checked;
    
    // Show progress section
    progressDiv.style.display = 'block';
    startBtn.disabled = true;
    startBtn.textContent = 'Importing...';
    
    statusDiv.textContent = 'Starting import process...';
    resultsDiv.innerHTML = '';
    
    try {
        // Step 1: Fetch current events from our system
        statusDiv.textContent = 'Fetching current events...';
        const currentEvents = await fetchCurrentEvents();
        
        // Step 2: Fetch legacy events
        const legacyEvents = [];
        
        if (importFarewell) {
            statusDiv.textContent = 'Fetching Farewell events from legacy system...';
            const farewellEvents = await fetchLegacyEvents('farewell');
            legacyEvents.push(...farewellEvents);
        }
        
        if (importHowdy) {
            statusDiv.textContent = 'Fetching Howdy events from legacy system...';
            const howdyEvents = await fetchLegacyEvents('howdy');
            legacyEvents.push(...howdyEvents);
        }
        
        statusDiv.textContent = `Processing ${legacyEvents.length} legacy events...`;
        
        // Step 3: Process and deduplicate events
        for (const legacyEvent of legacyEvents) {
            const result = await processLegacyEvent(legacyEvent, currentEvents, dryRun);
            importResults.push(result);
            updateImportResults();
        }
        
        // Step 4: Complete
        const importedCount = importResults.filter(r => r.action === 'imported').length;
        const skippedCount = importResults.filter(r => r.action === 'skipped').length;
        
        if (dryRun) {
            statusDiv.textContent = `Preview complete: ${importedCount} events would be imported, ${skippedCount} duplicates skipped`;
        } else {
            statusDiv.textContent = `Import complete: ${importedCount} events imported, ${skippedCount} duplicates skipped`;
            // Refresh the events list
            if (typeof loadEvents === 'function') {
                setTimeout(loadEvents, 1000);
            }
        }
        
    } catch (error) {
        console.error('Import error:', error);
        statusDiv.textContent = `Import failed: ${error.message}`;
    } finally {
        importInProgress = false;
        startBtn.disabled = false;
        startBtn.textContent = dryRun ? 'Start Preview' : 'Start Import';
    }
}

async function fetchCurrentEvents() {
    try {
        const response = await fetch('/api/events', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getJwtToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch current events: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching current events:', error);
        throw error;
    }
}

async function fetchLegacyEvents(venue) {
    try {
        const endpoint = LEGACY_ENDPOINTS[venue];
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ${venue} events: ${response.status}`);
        }
        
        const events = await response.json();
        return events.map(event => ({
            ...event,
            venue: venue // Ensure venue is set correctly
        }));
    } catch (error) {
        console.error(`Error fetching legacy events for ${venue}:`, error);
        throw error;
    }
}

function isDuplicateEvent(legacyEvent, currentEvents) {
    // Check for duplicates based on title, date, and venue
    return currentEvents.some(currentEvent => {
        const titleMatch = currentEvent.title.toLowerCase().trim() === legacyEvent.title.toLowerCase().trim();
        const dateMatch = currentEvent.date === legacyEvent.date;
        const venueMatch = currentEvent.venue === legacyEvent.venue;
        
        return titleMatch && dateMatch && venueMatch;
    });
}

async function processLegacyEvent(legacyEvent, currentEvents, dryRun) {
    const isDuplicate = isDuplicateEvent(legacyEvent, currentEvents);
    
    if (isDuplicate) {
        return {
            title: legacyEvent.title,
            date: legacyEvent.date,
            venue: legacyEvent.venue,
            action: 'skipped',
            reason: 'Duplicate event found'
        };
    }
    
    if (dryRun) {
        return {
            title: legacyEvent.title,
            date: legacyEvent.date,
            venue: legacyEvent.venue,
            action: 'preview',
            reason: 'Would be imported'
        };
    }
    
    // Import the event
    try {
        const newEvent = {
            title: legacyEvent.title,
            description: legacyEvent.description || '',
            date: legacyEvent.date,
            event_time: legacyEvent.time || '',
            venue: legacyEvent.venue,
            flyer_image_url: legacyEvent.imageUrl || '',
            // Map additional fields if they exist
            ticket_url: legacyEvent.ticket_url || '',
            price: legacyEvent.price || '',
            age_restriction: legacyEvent.age_restriction || ''
        };
        
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getJwtToken()}`
            },
            body: JSON.stringify(newEvent)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create event: ${response.status}`);
        }
        
        return {
            title: legacyEvent.title,
            date: legacyEvent.date,
            venue: legacyEvent.venue,
            action: 'imported',
            reason: 'Successfully imported'
        };
        
    } catch (error) {
        console.error('Error importing event:', error);
        return {
            title: legacyEvent.title,
            date: legacyEvent.date,
            venue: legacyEvent.venue,
            action: 'error',
            reason: `Import failed: ${error.message}`
        };
    }
}

function updateImportResults() {
    const resultsDiv = document.getElementById('import-results');
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = '';
    
    importResults.forEach(result => {
        const item = document.createElement('div');
        item.className = 'import-result-item';
        
        const info = document.createElement('div');
        info.innerHTML = `
            <strong>${result.title}</strong><br>
            <small>${result.date} - ${result.venue}</small>
        `;
        
        const action = document.createElement('span');
        action.className = `result-action ${result.action}`;
        action.textContent = result.action === 'preview' ? 'WOULD IMPORT' : 
                           result.action === 'imported' ? 'IMPORTED' :
                           result.action === 'skipped' ? 'SKIPPED' : 'ERROR';
        
        item.appendChild(info);
        item.appendChild(action);
        resultsDiv.appendChild(item);
    });
    
    // Scroll to bottom to show latest results
    resultsDiv.scrollTop = resultsDiv.scrollHeight;
}

function getJwtToken() {
    // This function should return the JWT token used for authentication
    // It should match the token retrieval method used in the main admin system
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken') || '';
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('import-legacy-modal');
    if (modal && e.target === modal) {
        closeImportLegacyModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('import-legacy-modal');
        if (modal && modal.style.display === 'flex') {
            closeImportLegacyModal();
        }
    }
});
