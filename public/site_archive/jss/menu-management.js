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
  let modal = document.getElementById('menu-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'menu-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = content;
  modal.classList.add('active');
  console.log('Modal shown');
}
function hideModal() {
  console.log('Hiding menu modal');
  const modal = document.getElementById('menu-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}
function showStatusMessage(type, message) {
  console.log(`Status message (${type}): ${message}`);
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3e3);
}
function initMenuManagement() {
  console.log('Initializing menu management...');
  const addMenuBtn = document.getElementById('add-menu-btn');
  const menuList = document.getElementById('menu-list');
  console.log('Menu elements:', { addMenuBtn: addMenuBtn, menuList: menuList });
  if (!addMenuBtn || !menuList) {
    console.error('Menu elements not found!');
    return;
  }
  let activeVenue = 'farewell';
  document.querySelectorAll('.venue-tabs .tab-btn').forEach((tab) => {
    tab.addEventListener('click', function () {
      activeVenue = this.dataset.venue;
      loadMenus(activeVenue);
    });
  });
  addMenuBtn.addEventListener('click', () => {
    console.log('Add menu button clicked');
    openMenuModal();
  });
  loadMenus(activeVenue);
}
async function loadMenus(venue) {
  console.log(`Loading menus for venue: ${venue}`);
  const menuList = document.getElementById('menu-list');
  if (!menuList) {
    console.error('Menu list element not found!');
    return;
  }
  menuList.innerHTML = '<div class="loading-spinner"></div>';
  try {
    if (venue !== 'farewell') {
      menuList.innerHTML = `<div class="info-message">\n                <p>Howdy doesn't have a digital menu. Only Farewell Cafe has menu management.</p>\n            </div>`;
      return;
    }
    menuList.innerHTML = '';
    const farewellMenu = { id: 1, name: 'Farewell Cafe Menu', venue: 'farewell' };
    const menuCard = createMenuCard(farewellMenu, venue);
    menuList.appendChild(menuCard);
  } catch (error) {
    console.error('Error loading menus:', error);
    menuList.innerHTML = `<div class="error-state">\n            <p>Error loading menu: ${error.message}</p>\n            <button class="btn btn-primary" onclick="loadMenus('${venue}')">Retry</button>\n        </div>`;
  }
}
async function createDefaultMenu(venue) {
  const response = await fetch(`/api/admin/venues/${venue}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ venue: venue, name: 'Drinks Menu', display_order: 0 }),
  });
  if (!response.ok) throw new Error('Failed to create default menu');
  return await response.json();
}
function createMenuCard(menu, venue) {
  console.log(`Creating menu card for: ${menu.name}`);
  const menuCard = document.createElement('div');
  menuCard.className = 'menu-card';
  menuCard.dataset.menuId = menu.id;
  menuCard.innerHTML = `\n        <div class="menu-card-header">\n            <h4>${escapeHTML(menu.name)}</h4>\n            <div class="menu-card-actions">\n                <button class="btn btn-sm btn-primary menu-edit-btn" title="Edit Menu">\n                    <i class="fas fa-edit"></i> Edit\n                </button>\n                <button class="btn btn-sm btn-danger menu-delete-btn" title="Delete Menu">\n                    <i class="fas fa-trash"></i> Delete\n                </button>\n            </div>\n        </div>\n        <div class="menu-items-container">\n            <div class="menu-items-loading">Loading items...</div>\n        </div>\n        <div class="menu-card-footer">\n            <button class="btn btn-secondary add-menu-item-btn">\n                <i class="fas fa-plus"></i> Add Item\n            </button>\n        </div>\n    `;
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
  loadMenuItems(menu.id, menuCard.querySelector('.menu-items-container'));
  return menuCard;
}
async function loadMenuItems(menuId, container) {
  try {
    const response = await fetch(`/api/admin/venues/farewell/menu-items`);
    if (!response.ok)
      throw new Error(`Failed to load menu items: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log('Menu items data:', data);
    if (data.success && data.data && data.data.length > 0) {
      container.innerHTML = '';
      const table = document.createElement('table');
      table.className = 'menu-items-table';
      table.innerHTML = `\n                <thead>\n                    <tr>\n                        <th>Name</th>\n                        <th>Category</th>\n                        <th>Price</th>\n                        <th>Status</th>\n                        <th>Actions</th>\n                    </tr>\n                </thead>\n                <tbody></tbody>\n            `;
      const tbody = table.querySelector('tbody');
      data.data.forEach((item) => {
        console.log('Processing menu item:', item);
        const row = document.createElement('tr');
        row.className = item.active ? 'item-active' : 'item-inactive';
        row.innerHTML = `\n                    <td>${escapeHTML(item.name)}</td>\n                    <td>${escapeHTML(item.category || '')}</td>\n                    <td>$${parseFloat(item.price).toFixed(2)}</td>\n                    <td>${item.active ? '<span class="status-active">Active</span>' : '<span class="status-inactive">Inactive</span>'}</td>\n                    <td>\n                        <button class="btn btn-sm btn-primary item-edit-btn" title="Edit Item">\n                            <i class="fas fa-edit"></i> Edit\n                        </button>\n                        <button class="btn btn-sm btn-danger item-delete-btn" title="Delete Item">\n                            <i class="fas fa-trash"></i> Delete\n                        </button>\n                    </td>\n                `;
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
      container.innerHTML =
        '<p class="empty-state">No items in this menu yet. Click "Add Item" to create one.</p>';
    }
  } catch (error) {
    console.error('Error loading menu items:', error);
    container.innerHTML = `\n            <p class="error-message">Failed to load menu items: ${error.message}</p>\n            <button class="btn btn-sm btn-secondary retry-load-items-btn">Retry</button>\n        `;
    const retryBtn = container.querySelector('.retry-load-items-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => loadMenuItems(menuId, container));
    }
  }
}
function openMenuModal(menu = null) {
  const isEdit = !!menu;
  const activeVenue = document.querySelector('.venue-tabs .tab-btn.active').dataset.venue;
  const modalContent = `\n        <div class="modal-header">\n            <h3>${isEdit ? 'Edit Menu Section' : 'Add Menu Section'}</h3>\n            <button class="modal-close" aria-label="Close modal">&times;</button>\n        </div>\n        <div class="modal-body">\n            <form id="menu-form">\n                <div class="form-group">\n                    <label for="menu-name">Menu Name</label>\n                    <input type="text" id="menu-name" class="form-control" value="${isEdit ? escapeHTML(menu.name) : ''}" required>\n                </div>\n                <div class="form-group">\n                    <label for="menu-venue">Venue</label>\n                    <select id="menu-venue" class="form-control" required>\n                        <option value="farewell" ${activeVenue === 'farewell' ? 'selected' : ''}>Farewell Cafe</option>\n                        <option value="howdy" ${activeVenue === 'howdy' ? 'selected' : ''}>Howdy</option>\n                    </select>\n                </div>\n                <div class="form-group">\n                    <label for="menu-display-order">Display Order</label>\n                    <input type="number" id="menu-display-order" class="form-control" value="${isEdit ? menu.display_order : '0'}" min="0">\n                </div>\n                <div class="form-group">\n                    <label for="menu-active">\n                        <input type="checkbox" id="menu-active" ${isEdit && menu.active ? 'checked' : ''}>\n                        Active\n                    </label>\n                </div>\n            </form>\n        </div>\n        <div class="modal-footer">\n            <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>\n            <button type="button" class="btn btn-primary" id="save-menu-btn">Save</button>\n        </div>\n    `;
  showModal(modalContent);
  document.querySelector('.modal-close').addEventListener('click', hideModal);
  document.querySelector('.modal-cancel').addEventListener('click', hideModal);
  document.getElementById('save-menu-btn').addEventListener('click', async () => {
    const name = document.getElementById('menu-name').value.trim();
    const venue = document.getElementById('menu-venue').value;
    const display_order = parseInt(document.getElementById('menu-display-order').value) || 0;
    const active = document.getElementById('menu-active').checked;
    if (!name) {
      showStatusMessage('error', 'Menu name is required');
      return;
    }
    try {
      let response;
      if (isEdit) {
        console.log(`Updating menu ${menu.id} with:`, {
          venue: venue,
          name: name,
          display_order: display_order,
          active: active,
        });
        response = await fetch(`/api/admin/venues/${venue}/menu/${menu.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venue: venue,
            name: name,
            display_order: display_order,
            active: active,
          }),
        });
      } else {
        console.log(`Creating new menu with:`, {
          venue: venue,
          name: name,
          display_order: display_order,
        });
        response = await fetch(`/api/admin/venues/${venue}/menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venue: venue,
            name: name,
            display_order: display_order,
            active: true,
          }),
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save menu: ${errorData.error || response.statusText}`);
      }
      loadMenus(venue);
      hideModal();
      showStatusMessage('success', `Menu ${isEdit ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving menu:', error);
      showStatusMessage('error', `Failed to save menu: ${error.message}`);
    }
  });
}
function openMenuItemModal(item = null, menuId) {
  const isEdit = !!item;
  const categories = [
    'Cocktails',
    'Domestics',
    'Boulevard',
    'Seasonal',
    'Craft/Import',
    'Booze-Free',
  ];
  const modalContent = `\n        <div class="modal-header">\n            <h3>${isEdit ? 'Edit Menu Item' : 'Add Menu Item'}</h3>\n            <button class="modal-close" aria-label="Close modal">&times;</button>\n        </div>\n        <div class="modal-body">\n            <form id="menu-item-form">\n                <input type="hidden" id="menu-item-menu-id" value="${menuId}">\n                \n                <div class="form-group">\n                    <label for="menu-item-name">Name</label>\n                    <input type="text" id="menu-item-name" class="form-control" value="${isEdit ? escapeHTML(item.name) : ''}" required>\n                </div>\n                \n                <div class="form-group">\n                    <label for="menu-item-category">Category</label>\n                    <select id="menu-item-category" class="form-control" required>\n                        <option value="">Select Category</option>\n                        ${categories.map((category) => `\n                            <option value="${category}" ${isEdit && item.category === category ? 'selected' : ''}>\n                                ${category}\n                            </option>\n                        `).join('')}\n                    </select>\n                </div>\n                \n                <div class="form-group">\n                    <label for="menu-item-price">Price</label>\n                    <div class="input-group">\n                        <div class="input-group-prepend">\n                            <span class="input-group-text">$</span>\n                        </div>\n                        <input type="number" id="menu-item-price" class="form-control" value="${isEdit ? item.price : ''}" step="0.01" min="0" required>\n                    </div>\n                </div>\n                \n                <div class="form-group">\n                    <label for="menu-item-description">Description</label>\n                    <textarea id="menu-item-description" class="form-control" rows="3">${isEdit && item.description ? escapeHTML(item.description) : ''}</textarea>\n                    <small class="form-text text-muted">Optional. Used mainly for cocktails.</small>\n                </div>\n                \n                <div class="form-group">\n                    <label for="menu-item-display-order">Display Order</label>\n                    <input type="number" id="menu-item-display-order" class="form-control" value="${isEdit ? item.display_order : '0'}" min="0">\n                </div>\n                \n                <div class="form-group">\n                    <label for="menu-item-active">\n                        <input type="checkbox" id="menu-item-active" ${isEdit && item.active ? 'checked' : ''}>\n                        Active\n                    </label>\n                </div>\n            </form>\n        </div>\n        <div class="modal-footer">\n            <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>\n            <button type="button" class="btn btn-primary" id="save-menu-item-btn">Save</button>\n        </div>\n    `;
  showModal(modalContent);
  document.querySelector('.modal-close').addEventListener('click', hideModal);
  document.querySelector('.modal-cancel').addEventListener('click', hideModal);
  document.getElementById('save-menu-item-btn').addEventListener('click', async () => {
    const menuId = document.getElementById('menu-item-menu-id').value;
    const name = document.getElementById('menu-item-name').value.trim();
    const category = document.getElementById('menu-item-category').value;
    const price = parseFloat(document.getElementById('menu-item-price').value) || 0;
    const description = document.getElementById('menu-item-description').value.trim();
    const display_order = parseInt(document.getElementById('menu-item-display-order').value) || 0;
    const active = document.getElementById('menu-item-active').checked;
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
        menuId: menuId,
        name: name,
        category: category,
        price: price,
        description: description,
        display_order: display_order,
        active: active,
      });
      if (isEdit) {
        response = await fetch(`/api/admin/menu-items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            description: description,
            price: price,
            category: category,
            display_order: display_order,
            active: active,
          }),
        });
      } else {
        const venue =
          document.querySelector('.venue-tabs .tab-btn.active')?.dataset.venue || 'farewell';
        response = await fetch(`/api/admin/venues/${venue}/menu-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_id: menuId,
            name: name,
            description: description,
            price: price,
            category: category,
            display_order: display_order,
            active: true,
          }),
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save menu item: ${errorData.error || response.statusText}`);
      }
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
async function deleteMenu(menuId, venue) {
  console.log(`Deleting menu ID: ${menuId}`);
  if (
    !confirm(
      'Are you sure you want to delete this menu? This will also delete all items in this menu.'
    )
  ) {
    return;
  }
  try {
    const response = await fetch(`/api/admin/venues/${venue}/menu/${menuId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to delete menu: ${errorData.error || response.statusText}`);
    }
    const activeVenue =
      document.querySelector('.venue-tabs .tab-btn.active')?.dataset.venue || venue;
    loadMenus(activeVenue);
    showStatusMessage('success', 'Menu deleted successfully!');
  } catch (error) {
    console.error('Error deleting menu:', error);
    showStatusMessage('error', `Failed to delete menu: ${error.message}`);
  }
}
async function deleteMenuItem(itemId, menuId) {
  if (!confirm('Are you sure you want to delete this menu item?')) {
    return;
  }
  try {
    const response = await fetch(`/api/admin/menu-items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to delete menu item: ${errorData.error || response.statusText}`);
    }
    const menuCard = document.querySelector(`.menu-card[data-menu-id="${menuId}"]`);
    if (menuCard) {
      loadMenuItems(menuId, menuCard.querySelector('.menu-items-container'));
      showStatusMessage('success', 'Menu item deleted successfully!');
    } else {
      const activeVenue =
        document.querySelector('.venue-tabs .tab-btn.active')?.dataset.venue || 'farewell';
      loadMenus(activeVenue);
      showStatusMessage('success', 'Menu item deleted successfully!');
    }
  } catch (error) {
    console.error('Error deleting menu item:', error);
    showStatusMessage('error', `Failed to delete menu item: ${error.message}`);
  }
}
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM loaded, initializing menu management...');
  const style = document.createElement('style');
  style.textContent = `\n    \n    #menu-modal {\n        position: fixed;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        background-color: #00000080;\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        z-index: 1000;\n        opacity: 0;\n        visibility: hidden;\n        transition: opacity 0.3s, visibility 0.3s;\n    }\n\n    #menu-modal.active {\n        opacity: 1;\n        visibility: visible;\n    }\n\n    #menu-modal .modal-header {\n        padding: 15px;\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        border-bottom: 1px solid #e0e0e0;\n        background-color: #f8f9fa;\n    }\n\n    #menu-modal .modal-header h3 {\n        margin: 0;\n        color: #333;\n    }\n\n    #menu-modal .modal-close {\n        background: none;\n        border: none;\n        font-size: 24px;\n        cursor: pointer;\n        color: #666;\n    }\n\n    #menu-modal .modal-body {\n        padding: 15px;\n        background-color: white;\n    }\n\n    #menu-modal .modal-footer {\n        padding: 15px;\n        border-top: 1px solid #e0e0e0;\n        text-align: right;\n        background-color: #f8f9fa;\n    }\n\n    #menu-modal .form-group {\n        margin-bottom: 15px;\n    }\n\n    #menu-modal label {\n        display: block;\n        margin-bottom: 5px;\n        font-weight: 500;\n        color: #333;\n    }\n\n    #menu-modal .form-control {\n        width: 100%;\n        padding: 8px 12px;\n        border: 1px solid #ddd;\n        border-radius: 4px;\n        font-size: 14px;\n    }\n\n    .toast-container {\n        position: fixed;\n        top: 20px;\n        right: 20px;\n        z-index: 1100;\n    }\n\n    .toast {\n        padding: 10px 15px;\n        margin-bottom: 10px;\n        border-radius: 4px;\n        color: white;\n        box-shadow: 0 2px 5px #00000033;\n        opacity: 1;\n        transition: opacity 0.3s;\n    }\n\n    .toast.fade-out {\n        opacity: 0;\n    }\n\n    .toast-success {\n        background-color: #4CAF50;\n    }\n\n    .toast-error {\n        background-color: #F44336;\n    }\n\n    .toast-warning {\n        background-color: #FF9800;\n    }\n\n    \n    .menu-card {\n        border: 1px solid #e0e0e0;\n        border-radius: 5px;\n        margin-bottom: 20px;\n        box-shadow: 0 2px 4px #0000000d;\n    }\n\n    .menu-card-header {\n        padding: 15px;\n        background-color: #f8f9fa;\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        border-bottom: 1px solid #e0e0e0;\n    }\n\n    .menu-card-header h4 {\n        margin: 0;\n        font-weight: 600;\n    }\n\n    .menu-items-container {\n        padding: 15px;\n    }\n\n    .menu-card-footer {\n        padding: 15px;\n        border-top: 1px solid #e0e0e0;\n        text-align: right;\n    }\n\n    .menu-items-table {\n        width: 100%;\n        border-collapse: collapse;\n    }\n\n    .menu-items-table th,\n    .menu-items-table td {\n        padding: 10px;\n        text-align: left;\n        border-bottom: 1px solid #e0e0e0;\n    }\n\n    .menu-items-table th {\n        font-weight: 600;\n        background-color: #f8f9fa;\n    }\n\n    .empty-state {\n        text-align: center;\n        padding: 20px;\n        color: #6c757d;\n    }\n\n    .loading-spinner {\n        text-align: center;\n        padding: 20px;\n    }\n\n    .loading-spinner:after {\n        content: '';\n        display: inline-block;\n        width: 30px;\n        height: 30px;\n        border: 3px solid #f3f3f3;\n        border-top: 3px solid #3498db;\n        border-radius: 50%;\n        animation: spin 1s linear infinite;\n    }\n\n    @keyframes spin {\n        0% { transform: rotate(0deg); }\n        100% { transform: rotate(360deg); }\n    }\n\n    .error-message {\n        color: #dc3545;\n        padding: 10px;\n        border: 1px solid #dc3545;\n        border-radius: 4px;\n        margin-bottom: 10px;\n    }\n    `;
  document.head.appendChild(style);
  initMenuManagement();
});
