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
        
        // If that fails, try the unified menu endpoint
        const unifiedResponse = await fetch('/api/menu');
        if (unifiedResponse.ok) {
            const unifiedData = await unifiedResponse.json();
            if (unifiedData.success && Array.isArray(unifiedData.data) && unifiedData.data.length > 0) {
                console.log('Using unified menu API data');
                updateMenuContent(unifiedData.data);
                return;
            }
        }
        
        // If both API calls fail or return empty data, use existing static content
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
    
    // Clear existing dynamic content containers to prevent duplicates
    const cocktailsContainer = document.querySelector('.cocktail-section');
    const domesticsContainer = document.getElementById('domestics-container');
    const boulevardContainer = document.getElementById('boulevard-container');
    const seasonalContainer = document.getElementById('seasonal-container');
    const craftImportContainer = document.getElementById('craft-import-container');
    const boozeFreeContainer = document.getElementById('booze-free-container');

    // Update each section if it exists
    if (categorizedItems['Cocktails'] && cocktailsContainer) {
        updateCocktailsSection(categorizedItems['Cocktails'], cocktailsContainer);
    }
    
    if (categorizedItems['Domestics'] && domesticsContainer) {
        updateBeerSection(categorizedItems['Domestics'], domesticsContainer);
    }
    
    if (categorizedItems['Boulevard'] && boulevardContainer) {
        updateBeerSection(categorizedItems['Boulevard'], boulevardContainer);
    }
    
    if (categorizedItems['Seasonal'] && seasonalContainer) {
        updateBeerSection(categorizedItems['Seasonal'], seasonalContainer);
    }
    
    if (categorizedItems['Craft/Import'] && craftImportContainer) {
        updateBeerSection(categorizedItems['Craft/Import'], craftImportContainer);
    }
    
    if (categorizedItems['Booze-Free'] && boozeFreeContainer) {
        updateBeerSection(categorizedItems['Booze-Free'], boozeFreeContainer);
    }
    
    // Apply animations
    applyAnimations();
    
    console.log('Menu update complete');
}

// Function to update the cocktails section
function updateCocktailsSection(cocktails, container) {
    // Preserve any special elements like images
    const specialElements = [];
    container.querySelectorAll('.cowboy, .cocktail-header, h2, .section-divider').forEach(el => {
        specialElements.push(el.cloneNode(true));
    });
    
    // Clear the container
    container.innerHTML = '';
    
    // Add back special elements
    specialElements.forEach(el => {
        container.appendChild(el);
    });
    
    // Add cocktail items
    cocktails.forEach(cocktail => {
        const cocktailEl = document.createElement('div');
        
        if (cocktail.description) {
            // Standard cocktail with description
            cocktailEl.className = 'cocktail';
            cocktailEl.innerHTML = `
                <div class="cocktail-name">${cocktail.name}</div>
                <div class="cocktail-details">
                    <div class="cocktail-ingredients">${cocktail.description}</div>
                    <div class="cocktail-price">$${parseFloat(cocktail.price).toFixed(2)}</div>
                </div>
            `;
        } else {
            // Simple cocktail without description (just name and price)
            cocktailEl.className = 'cocktail-simple';
            cocktailEl.innerHTML = `
                <div class="cocktail-name">${cocktail.name}</div>
                <div class="cocktail-price">$${parseFloat(cocktail.price).toFixed(2)}</div>
            `;
        }
        
        container.appendChild(cocktailEl);
    });
    
    // Add divider at the end if it doesn't already exist
    if (!container.querySelector('.divider')) {
        const divider = document.createElement('div');
        divider.className = 'divider';
        container.appendChild(divider);
    }
}

// Function to update beer sections
function updateBeerSection(items, container) {
    // Preserve header if it exists
    const header = container.parentElement.querySelector('h1, h2, h3, h4, h5, h6');
    
    // Clear the container
    container.innerHTML = '';
    
    // Add beer items
    items.forEach(item => {
        const beerEl = document.createElement('div');
        beerEl.className = 'beer-item';
        beerEl.innerHTML = `
            <span class="beer-name">${item.name}</span>
            <span class="beer-price">$${parseFloat(item.price).toFixed(2)}</span>
        `;
        container.appendChild(beerEl);
    });
}

// Function to apply animations
function applyAnimations() {
    // Check if GSAP is available
    if (typeof gsap !== 'undefined') {
        // Animate the menu header on load
        gsap.from(".menu-header img", { 
            duration: 1, 
            y: -50, 
            opacity: 0, 
            ease: "bounce", 
            stagger: 0.2 
        });
        
        // Animate the menu items
        const allItems = document.querySelectorAll(".cocktail, .cocktail-simple, .beer-item");
        gsap.from(allItems, {
            duration: 0.5,
            opacity: 0,
            y: 20,
            stagger: 0.05,
            ease: "power2.out"
        });
    } else {
        console.log('GSAP not available, skipping animations');
    }
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
