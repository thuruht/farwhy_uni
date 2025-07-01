// Menu Management functionality for admin dashboard

// Add this code to the end of admin-unified.js

// Initialize menu management
function initMenuManagement() {
    // Menu section elements
    const addMenuBtn = document.getElementById('add-menu-btn');
    const menuList = document.getElementById('menu-list');
    let activeVenue = 'farewell'; // Default venue
    
    // Listen for venue tab changes
    document.querySelectorAll('.venue-tabs .tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            activeVenue = this.dataset.venue;
            loadMenus(activeVenue);
        });
    });
    
    // Load menus when the venue section is shown
    if (addMenuBtn && menuList) {
        // Add menu button click handler
        addMenuBtn.addEventListener('click', () => openMenuModal());
        
        // Initial load of menus for default venue
        loadMenus(activeVenue);
    }
}

// Load menus for a specific venue
async function loadMenus(venue) {
    const menuList = document.getElementById('menu-list');
    if (!menuList) return;
    
    // Clear existing content
    menuList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await fetch(`/api/venues/${venue}/menu`);
        if (!response.ok) throw new Error('Failed to load menus');
        
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            menuList.innerHTML = '';
            
            data.data.forEach(menu => {
                const menuCard = createMenuCard(menu, venue);
                menuList.appendChild(menuCard);
            });
        } else {
            menuList.innerHTML = `<div class="empty-state">
                <p>No menu sections found for ${venue}. Click "Add Menu Section" to create one.</p>
            </div>`;
        }
    } catch (error) {
        console.error('Error loading menus:', error);
        menuList.innerHTML = `<div class="error-message">
            <p>Failed to load menus. Please try again later.</p>
        </div>`;
    }
}

// Create a menu card
function createMenuCard(menu, venue) {
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
    menuCard.querySelector('.menu-edit-btn').addEventListener('click', () => openMenuModal(menu));
    menuCard.querySelector('.menu-delete-btn').addEventListener('click', () => deleteMenu(menu.id));
    menuCard.querySelector('.add-menu-item-btn').addEventListener('click', () => openMenuItemModal(null, menu.id));
    
    // Load menu items
    loadMenuItems(menu.id, menuCard.querySelector('.menu-items-container'));
    
    return menuCard;
}

// Load menu items for a specific menu
async function loadMenuItems(menuId, container) {
    try {
        const response = await fetch(`/api/menu/${menuId}`);
        if (!response.ok) throw new Error('Failed to load menu items');
        
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
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
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            
            // Add menu items to the table
            const tbody = table.querySelector('tbody');
            data.data.forEach(item => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${escapeHTML(item.name)}</td>
                    <td>${escapeHTML(item.category || '')}</td>
                    <td>$${parseFloat(item.price).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary item-edit-btn" title="Edit Item">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger item-delete-btn" title="Delete Item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                // Add event listeners
                row.querySelector('.item-edit-btn').addEventListener('click', () => openMenuItemModal(item, menuId));
                row.querySelector('.item-delete-btn').addEventListener('click', () => deleteMenuItem(item.id));
                
                tbody.appendChild(row);
            });
            
            container.appendChild(table);
        } else {
            container.innerHTML = '<p class="empty-state">No items in this menu yet. Click "Add Item" to create one.</p>';
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
        container.innerHTML = '<p class="error-message">Failed to load menu items. Please try again later.</p>';
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
                // Update existing menu
                response = await fetch(`/api/venues/${venue}/menu/${menu.id}`, {
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
                // Create new menu
                response = await fetch(`/api/venues/${venue}/menu`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        venue,
                        name,
                        display_order
                    })
                });
            }
            
            if (!response.ok) throw new Error('Failed to save menu');
            
            // Reload menus and hide modal
            loadMenus(venue);
            hideModal();
            showStatusMessage('success', `Menu ${isEdit ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Error saving menu:', error);
            showStatusMessage('error', 'Failed to save menu. Please try again.');
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
            
            if (isEdit) {
                // Update existing menu item
                response = await fetch(`/api/menu-items/${item.id}`, {
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
                // Create new menu item
                response = await fetch(`/api/venues/farewell/menu-items`, {
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
                        display_order
                    })
                });
            }
            
            if (!response.ok) throw new Error('Failed to save menu item');
            
            // Reload menu items and hide modal
            const menuCard = document.querySelector(`.menu-card[data-menu-id="${menuId}"]`);
            if (menuCard) {
                loadMenuItems(menuId, menuCard.querySelector('.menu-items-container'));
            }
            
            hideModal();
            showStatusMessage('success', `Menu item ${isEdit ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Error saving menu item:', error);
            showStatusMessage('error', 'Failed to save menu item. Please try again.');
        }
    });
}

// Delete a menu
async function deleteMenu(menuId) {
    if (!confirm('Are you sure you want to delete this menu? This will also delete all items in this menu.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/venues/farewell/menu/${menuId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete menu');
        
        // Reload menus
        const activeVenue = document.querySelector('.venue-tabs .tab-btn.active').dataset.venue;
        loadMenus(activeVenue);
        
        showStatusMessage('success', 'Menu deleted successfully!');
    } catch (error) {
        console.error('Error deleting menu:', error);
        showStatusMessage('error', 'Failed to delete menu. Please try again.');
    }
}

// Delete a menu item
async function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/menu-items/${itemId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete menu item');
        
        // Reload the menu items
        const menuCard = document.querySelector(`.menu-card`);
        if (menuCard) {
            const menuId = menuCard.dataset.menuId;
            loadMenuItems(menuId, menuCard.querySelector('.menu-items-container'));
        }
        
        showStatusMessage('success', 'Menu item deleted successfully!');
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showStatusMessage('error', 'Failed to delete menu item. Please try again.');
    }
}

// Add the menu initialization to the main init function
document.addEventListener('DOMContentLoaded', function() {
    // Existing initialization code...
    
    // Initialize menu management
    initMenuManagement();
});
