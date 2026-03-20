// Menu Management functionality for admin dashboard

// Helper functions
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showModal(content) {
    console.log('Showing menu modal with content');
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('menu-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'menu-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    // Set content
    modal.innerHTML = content;
    
    // Show modal
    modal.classList.add('active');
    
    console.log('Modal shown');
}

function hideModal() {
    console.log('Hiding menu modal');
    
    // Find and hide modal
    const modal = document.getElementById('menu-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showStatusMessage(type, message) {
    console.log(`Status message (${type}): ${message}`);
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

// Initialize menu management
function initMenuManagement() {
    console.log('Initializing menu management...');
    
    // Menu section elements
    const addMenuBtn = document.getElementById('add-menu-btn');
    const menuList = document.getElementById('menu-list');
    
    console.log('Menu elements:', { addMenuBtn, menuList });
    
    if (!addMenuBtn || !menuList) {
        console.error('Menu elements not found!');
        return;
    }
    
    let activeVenue = 'farewell'; // Default venue
    
    // Listen for venue tab changes
    document.querySelectorAll('.venue-tabs .tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            activeVenue = this.dataset.venue;
            loadMenus(activeVenue);
        });
    });
    
    // Add menu button click handler
    addMenuBtn.addEventListener('click', () => {
        console.log('Add menu button clicked');
        openMenuModal();
    });
    
    // Initial load of menus for default venue
    loadMenus(activeVenue);
}

// Load menus for a specific venue
async function loadMenus(venue) {
    console.log(`Loading menus for venue: ${venue}`);
    
    const menuList = document.getElementById('menu-list');
    if (!menuList) {
        console.error('Menu list element not found!');
        return;
    }
    
    // Clear existing content
    menuList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        // SIMPLIFIED LOGIC: Only Farewell has a menu, Howdy doesn't
        if (venue !== 'farewell') {
            menuList.innerHTML = `<div class="info-message">
                <p>Howdy doesn't have a digital menu. Only Farewell Cafe has menu management.</p>
            </div>`;
            return;
        }
        
        // For Farewell, create ONE menu section containing all menu items
        menuList.innerHTML = '';
        
        const farewellMenu = {
            id: 1,
            name: 'Farewell Cafe Menu',
            venue: 'farewell'
        };
        
        const menuCard = createMenuCard(farewellMenu, venue);
        menuList.appendChild(menuCard);
        
    } catch (error) {
        console.error('Error loading menus:', error);
        menuList.innerHTML = `<div class="error-state">
            <p>Error loading menu: ${error.message}</p>
            <button class="btn btn-primary" onclick="loadMenus('${venue}')">Retry</button>
        </div>`;
    }
}

// Helper function to create a default menu if none exists
async function createDefaultMenu(venue) {
    const response = await fetch(`/api/admin/venues/${venue}/menu`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            venue,
            name: 'Drinks Menu',
            display_order: 0
        })
    });
    
    if (!response.ok) throw new Error('Failed to create default menu');
    
    return await response.json();
}

// Create a menu card
function createMenuCard(menu, venue) {
    console.log(`Creating menu card for: ${menu.name}`);
    
    const menuCard = document.createElement('div');
    menuCard.className = 'menu-card';
    menuCard.dataset.menuId = menu.id;
    
    menuCard.innerHTML = `
        <div class="menu-card-header">
            <h4>${escapeHTML(menu.name)}</h4>
            <div class="menu-card-actions">
                <button class="btn btn-sm btn-primary menu-edit-btn" title="Edit Menu">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger menu-delete-btn" title="Delete Menu">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
        <div class="menu-items-container">
            <div class="menu-items-loading">Loading items...</div>
        </div>
        <div class="menu-card-footer">
            <button class="btn btn-secondary add-menu-item-btn">
                <i class="fas fa-plus"></i> Add Item
            </button>
        </div>
    `;
    
    // Add event listeners
    menuCard.querySelector('.menu-edit-btn').addEventListener('click', () => {
        console.log(`Edit menu clicked for: ${menu.name}`);
        openMenuModal(menu);
    });
    
    menuCard.querySelector('.menu-delete-btn').addEventListener('click', () => {
        console.log(`Delete menu clicked for: ${menu.name}`);
        deleteMenu(menu.id, venue);
    });
    
    menuCard.querySelector('.add-menu-item-btn').addEventListener('click', () => {
        console.log(`Add menu item clicked for menu: ${menu.name}`);
        openMenuItemModal(null, menu.id);
    });
    
    // Load menu items
    loadMenuItems(menu.id, menuCard.querySelector('.menu-items-container'));
    
    return menuCard;
}

// Load menu items for a specific menu
async function loadMenuItems(menuId, container) {
    try {
        // Since our system is venue-based, use the venue endpoint instead of menu ID
        // For now, we assume 'farewell' venue - this could be made dynamic later
        const response = await fetch(`/api/admin/venues/farewell/menu-items`);
        if (!response.ok) throw new Error(`Failed to load menu items: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        console.log('Menu items data:', data);
        
        if (data.success && data.data && data.data.length > 0) {
            container.innerHTML = '';
            
            // Create a table for menu items
            const table = document.createElement('table');
            table.className = 'menu-items-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            
// Add menu items to the table
            const tbody = table.querySelector('tbody');
            data.data.forEach(item => {
                console.log('Processing menu item:', item);
                const row = document.createElement('tr');
                row.className = item.active ? 'item-active' : 'item-inactive';
                
                row.innerHTML = `
                    <td>${escapeHTML(item.name)}</td>
                    <td>${escapeHTML(item.category || '')}</td>
                    <td>$${parseFloat(item.price).toFixed(2)}</td>
                    <td>${item.active ? '<span class="status-active">Active</span>' : '<span class="status-inactive">Inactive</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary item-edit-btn" title="Edit Item">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger item-delete-btn" title="Delete Item">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                
                // Add event listeners
                row.querySelector('.item-edit-btn').addEventListener('click', () => {
                    console.log('Edit item clicked for:', item);
                    openMenuItemModal(item, menuId);
                });
                
                row.querySelector('.item-delete-btn').addEventListener('click', () => {
                    console.log('Delete item clicked for:', item);
                    deleteMenuItem(item.id, menuId);
                });
                
                tbody.appendChild(row);
            });
            
            container.appendChild(table);
        } else {
            container.innerHTML = '<p class="empty-state">No items in this menu yet. Click "Add Item" to create one.</p>';
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
        container.innerHTML = `
            <p class="error-message">Failed to load menu items: ${error.message}</p>
            <button class="btn btn-sm btn-secondary retry-load-items-btn">Retry</button>
        `;
        
        // Add retry button functionality
        const retryBtn = container.querySelector('.retry-load-items-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => loadMenuItems(menuId, container));
        }
    }
}

// Open the menu modal (create or edit)
function openMenuModal(menu = null) {
    const isEdit = !!menu;
    const activeVenue = document.querySelector('.venue-tabs .tab-btn.active').dataset.venue;
    
    // Create modal content
    const modalContent = `
        <div class="modal-header">
            <h3>${isEdit ? 'Edit Menu Section' : 'Add Menu Section'}</h3>
            <button class="modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body">
            <form id="menu-form">
                <div class="form-group">
                    <label for="menu-name">Menu Name</label>
                    <input type="text" id="menu-name" class="form-control" value="${isEdit ? escapeHTML(menu.name) : ''}" required>
                </div>
                <div class="form-group">
                    <label for="menu-venue">Venue</label>
                    <select id="menu-venue" class="form-control" required>
                        <option value="farewell" ${activeVenue === 'farewell' ? 'selected' : ''}>Farewell Cafe</option>
                        <option value="howdy" ${activeVenue === 'howdy' ? 'selected' : ''}>Howdy</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="menu-display-order">Display Order</label>
                    <input type="number" id="menu-display-order" class="form-control" value="${isEdit ? menu.display_order : '0'}" min="0">
                </div>
                <div class="form-group">
                    <label for="menu-active">
                        <input type="checkbox" id="menu-active" ${isEdit && menu.active ? 'checked' : ''}>
                        Active
                    </label>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
            <button type="button" class="btn btn-primary" id="save-menu-btn">Save</button>
        </div>
    `;
    
    // Show modal
    showModal(modalContent);
    
    // Add event listeners
    document.querySelector('.modal-close').addEventListener('click', hideModal);
    document.querySelector('.modal-cancel').addEventListener('click', hideModal);
    document.getElementById('save-menu-btn').addEventListener('click', async () => {
        // Get form values
        const name = document.getElementById('menu-name').value.trim();
        const venue = document.getElementById('menu-venue').value;
        const display_order = parseInt(document.getElementById('menu-display-order').value) || 0;
        const active = document.getElementById('menu-active').checked;
        
        // Validate form
        if (!name) {
            showStatusMessage('error', 'Menu name is required');
            return;
        }
        
        try {
            let response;
            
            if (isEdit) {
                // Update existing menu - use admin API
                console.log(`Updating menu ${menu.id} with:`, { venue, name, display_order, active });
                response = await fetch(`/api/admin/venues/${venue}/menu/${menu.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        venue,
                        name,
                        display_order,
                        active
                    })
                });
            } else {
                // Create new menu - use admin API
                console.log(`Creating new menu with:`, { venue, name, display_order });
                response = await fetch(`/api/admin/venues/${venue}/menu`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        venue,
                        name,
                        display_order,
                        active: true
                    })
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to save menu: ${errorData.error || response.statusText}`);
            }
            
            // Reload menus and hide modal
            loadMenus(venue);
            hideModal();
            showStatusMessage('success', `Menu ${isEdit ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Error saving menu:', error);
            showStatusMessage('error', `Failed to save menu: ${error.message}`);
        }
    });
}

// Open the menu item modal (create or edit)
function openMenuItemModal(item = null, menuId) {
    const isEdit = !!item;
    
    // Get categories from existing items
    const categories = [
        'Cocktails',
        'Domestics',
        'Boulevard',
        'Seasonal',
        'Craft/Import',
        'Booze-Free'
    ];
    
    // Create modal content
    const modalContent = `
        <div class="modal-header">
            <h3>${isEdit ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
            <button class="modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body">
            <form id="menu-item-form">
                <input type="hidden" id="menu-item-menu-id" value="${menuId}">
                
                <div class="form-group">
                    <label for="menu-item-name">Name</label>
                    <input type="text" id="menu-item-name" class="form-control" value="${isEdit ? escapeHTML(item.name) : ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="menu-item-category">Category</label>
                    <select id="menu-item-category" class="form-control" required>
                        <option value="">Select Category</option>
                        ${categories.map(category => `
                            <option value="${category}" ${isEdit && item.category === category ? 'selected' : ''}>
                                ${category}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="menu-item-price">Price</label>
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text">$</span>
                        </div>
                        <input type="number" id="menu-item-price" class="form-control" value="${isEdit ? item.price : ''}" step="0.01" min="0" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="menu-item-description">Description</label>
                    <textarea id="menu-item-description" class="form-control" rows="3">${isEdit && item.description ? escapeHTML(item.description) : ''}</textarea>
                    <small class="form-text text-muted">Optional. Used mainly for cocktails.</small>
                </div>
                
                <div class="form-group">
                    <label for="menu-item-display-order">Display Order</label>
                    <input type="number" id="menu-item-display-order" class="form-control" value="${isEdit ? item.display_order : '0'}" min="0">
                </div>
                
                <div class="form-group">
                    <label for="menu-item-active">
                        <input type="checkbox" id="menu-item-active" ${isEdit && item.active ? 'checked' : ''}>
                        Active
                    </label>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
            <button type="button" class="btn btn-primary" id="save-menu-item-btn">Save</button>
        </div>
    `;
    
    // Show modal
    showModal(modalContent);
    
    // Add event listeners
    document.querySelector('.modal-close').addEventListener('click', hideModal);
    document.querySelector('.modal-cancel').addEventListener('click', hideModal);
    document.getElementById('save-menu-item-btn').addEventListener('click', async () => {
        // Get form values
        const menuId = document.getElementById('menu-item-menu-id').value;
        const name = document.getElementById('menu-item-name').value.trim();
        const category = document.getElementById('menu-item-category').value;
        const price = parseFloat(document.getElementById('menu-item-price').value) || 0;
        const description = document.getElementById('menu-item-description').value.trim();
        const display_order = parseInt(document.getElementById('menu-item-display-order').value) || 0;
        const active = document.getElementById('menu-item-active').checked;
        
        // Validate form
        if (!name) {
            showStatusMessage('error', 'Item name is required');
            return;
        }
        
        if (!category) {
            showStatusMessage('error', 'Category is required');
            return;
        }
        
        try {
            let response;
            console.log(`${isEdit ? 'Updating' : 'Creating'} menu item with:`, {
                menuId, name, category, price, description, display_order, active
            });
            
            if (isEdit) {
                // Update existing menu item - use admin API
                response = await fetch(`/api/admin/menu-items/${item.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        description,
                        price,
                        category,
                        display_order,
                        active
                    })
                });
            } else {
                // Create new menu item - use admin API with correct endpoint
                const venue = document.querySelector('.venue-tabs .tab-btn.active')?.dataset.venue || 'farewell';
                response = await fetch(`/api/admin/venues/${venue}/menu-items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        menu_id: menuId,
                        name,
                        description,
                        price,
                        category,
                        display_order,
                        active: true
                    })
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to save menu item: ${errorData.error || response.statusText}`);
            }
            
            // Reload menu items and hide modal
            const menuCard = document.querySelector(`.menu-card[data-menu-id="${menuId}"]`);
            if (menuCard) {
                loadMenuItems(menuId, menuCard.querySelector('.menu-items-container'));
            }
            
            hideModal();
            showStatusMessage('success', `Menu item ${isEdit ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Error saving menu item:', error);
            showStatusMessage('error', `Failed to save menu item: ${error.message}`);
        }
    });
}

// Delete a menu
async function deleteMenu(menuId, venue) {
    console.log(`Deleting menu ID: ${menuId}`);
    
    if (!confirm('Are you sure you want to delete this menu? This will also delete all items in this menu.')) {
        return;
    }
    
    try {
        // Use the admin API endpoint
        const response = await fetch(`/api/admin/venues/${venue}/menu/${menuId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to delete menu: ${errorData.error || response.statusText}`);
        }
        
        // Reload menus
        const activeVenue = document.querySelector('.venue-tabs .tab-btn.active')?.dataset.venue || venue;
        loadMenus(activeVenue);
        
        showStatusMessage('success', 'Menu deleted successfully!');
    } catch (error) {
        console.error('Error deleting menu:', error);
        showStatusMessage('error', `Failed to delete menu: ${error.message}`);
    }
}

// Delete a menu item
async function deleteMenuItem(itemId, menuId) {
    if (!confirm('Are you sure you want to delete this menu item?')) {
        return;
    }
    
    try {
        // Use the admin API endpoint
        const response = await fetch(`/api/admin/menu-items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to delete menu item: ${errorData.error || response.statusText}`);
        }
        
        // Reload the menu items
        const menuCard = document.querySelector(`.menu-card[data-menu-id="${menuId}"]`);
        if (menuCard) {
            loadMenuItems(menuId, menuCard.querySelector('.menu-items-container'));
            showStatusMessage('success', 'Menu item deleted successfully!');
        } else {
            // Fallback if menu card is not found - reload all menus
            const activeVenue = document.querySelector('.venue-tabs .tab-btn.active')?.dataset.venue || 'farewell';
            loadMenus(activeVenue);
            showStatusMessage('success', 'Menu item deleted successfully!');
        }
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showStatusMessage('error', `Failed to delete menu item: ${error.message}`);
    }
}

// Add the menu initialization to the main init function
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing menu management...');
    
    // Add CSS for the menu modal and toasts
    const style = document.createElement('style');
    style.textContent = `
    /* Menu Management Styles */
    #menu-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s;
    }

    #menu-modal.active {
        opacity: 1;
        visibility: visible;
    }

    #menu-modal .modal-header {
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e0e0e0;
        background-color: #f8f9fa;
    }

    #menu-modal .modal-header h3 {
        margin: 0;
        color: #333;
    }

    #menu-modal .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    }

    #menu-modal .modal-body {
        padding: 15px;
        background-color: white;
    }

    #menu-modal .modal-footer {
        padding: 15px;
        border-top: 1px solid #e0e0e0;
        text-align: right;
        background-color: #f8f9fa;
    }

    #menu-modal .form-group {
        margin-bottom: 15px;
    }

    #menu-modal label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #333;
    }

    #menu-modal .form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }

    .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1100;
    }

    .toast {
        padding: 10px 15px;
        margin-bottom: 10px;
        border-radius: 4px;
        color: white;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        opacity: 1;
        transition: opacity 0.3s;
    }

    .toast.fade-out {
        opacity: 0;
    }

    .toast-success {
        background-color: #4CAF50;
    }

    .toast-error {
        background-color: #F44336;
    }

    .toast-warning {
        background-color: #FF9800;
    }

    /* Menu Cards */
    .menu-card {
        border: 1px solid #e0e0e0;
        border-radius: 5px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .menu-card-header {
        padding: 15px;
        background-color: #f8f9fa;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e0e0e0;
    }

    .menu-card-header h4 {
        margin: 0;
        font-weight: 600;
    }

    .menu-items-container {
        padding: 15px;
    }

    .menu-card-footer {
        padding: 15px;
        border-top: 1px solid #e0e0e0;
        text-align: right;
    }

    .menu-items-table {
        width: 100%;
        border-collapse: collapse;
    }

    .menu-items-table th,
    .menu-items-table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
    }

    .menu-items-table th {
        font-weight: 600;
        background-color: #f8f9fa;
    }

    .empty-state {
        text-align: center;
        padding: 20px;
        color: #6c757d;
    }

    .loading-spinner {
        text-align: center;
        padding: 20px;
    }

    .loading-spinner:after {
        content: '';
        display: inline-block;
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .error-message {
        color: #dc3545;
        padding: 10px;
        border: 1px solid #dc3545;
        border-radius: 4px;
        margin-bottom: 10px;
    }
    `;

    document.head.appendChild(style);
    
    // Initialize menu management
    initMenuManagement();
});
