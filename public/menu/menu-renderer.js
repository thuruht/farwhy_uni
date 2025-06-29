// Dynamic Menu Renderer for Farewell/Howdy
// This script dynamically updates the menu content based on the API data

document.addEventListener('DOMContentLoaded', function() {
    console.log('Menu renderer initialized');
    loadMenuData();
});

// Function to load menu data from the API
async function loadMenuData() {
    try {
        // Try to fetch menu data from API
        const response = await fetch('/api/venues/farewell/menu');
        
        // If API request succeeds, update the menu
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
                updateMenuContent(data.data);
                return;
            }
        }
        
        // If API fails or returns empty data, use existing static content
        console.log('Using existing static menu content');
    } catch (error) {
        console.error('Error loading menu data:', error);
        // On error, keep the existing static content
    }
}

// Function to update menu content based on API data
function updateMenuContent(menuData) {
    console.log('Updating menu content with:', menuData);
    
    // Group menu items by category
    const categorizedItems = {};
    menuData.forEach(item => {
        if (!categorizedItems[item.category]) {
            categorizedItems[item.category] = [];
        }
        categorizedItems[item.category].push(item);
    });
    
    // Update cocktails section
    if (categorizedItems['Cocktails']) {
        updateCocktailsSection(categorizedItems['Cocktails']);
    }
    
    // Update beer sections (multiple beer-related categories)
    updateBeerSections(categorizedItems);
    
    console.log('Menu update complete');
}

// Function to update the cocktails section
function updateCocktailsSection(cocktails) {
    const cocktailSection = document.querySelector('.cocktail-section');
    if (!cocktailSection) return;
    
    // Clear existing cocktails except the cowboy image
    const cowboyImage = cocktailSection.querySelector('.cowboy');
    cocktailSection.innerHTML = '';
    
    // Add cowboy image back if it existed
    if (cowboyImage) {
        cocktailSection.appendChild(cowboyImage);
    }
    
    // Add cocktail items
    cocktails.forEach(cocktail => {
        if (cocktail.description) {
            // Standard cocktail with description
            const cocktailEl = document.createElement('div');
            cocktailEl.className = 'cocktail';
            cocktailEl.innerHTML = `
                <div class="cocktail-name">${cocktail.name}</div>
                <div class="cocktail-details">
                    <div class="cocktail-ingredients">${cocktail.description}</div>
                    <div class="cocktail-price">${cocktail.price}</div>
                </div>
            `;
            cocktailSection.appendChild(cocktailEl);
        } else {
            // Simple cocktail without description (just name and price)
            const cocktailEl = document.createElement('div');
            cocktailEl.className = 'cocktail-simple';
            cocktailEl.innerHTML = `
                <div class="cocktail-name">${cocktail.name}</div>
                <div class="cocktail-price">${cocktail.price}</div>
            `;
            cocktailSection.appendChild(cocktailEl);
        }
    });
    
    // Add divider at the end
    const divider = document.createElement('div');
    divider.className = 'divider';
    cocktailSection.appendChild(divider);
}

// Function to update beer sections (Domestics, Boulevard, Seasonal, Craft/Import, Booze-Free)
function updateBeerSections(categorizedItems) {
    const beerCategories = ['Domestics', 'Boulevard', 'Seasonal', 'Craft/Import', 'Booze-Free'];
    
    beerCategories.forEach(category => {
        if (categorizedItems[category]) {
            updateBeerCategory(category, categorizedItems[category]);
        }
    });
}

// Function to update a specific beer category
function updateBeerCategory(category, items) {
    // Find the section for this category
    const sectionHeader = Array.from(document.querySelectorAll('.menu-section h1'))
        .find(el => el.textContent.trim() === category);
    
    if (!sectionHeader) return;
    
    const section = sectionHeader.closest('.menu-section');
    if (!section) return;
    
    // Clear existing items (keep the header)
    const header = section.querySelector('h1');
    section.innerHTML = '';
    section.appendChild(header);
    
    // Add items
    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'beer-item';
        itemEl.innerHTML = `
            <span class="beer-name">${item.name}</span>
            <span class="beer-price">${item.price}</span>
        `;
        section.appendChild(itemEl);
    });
}
