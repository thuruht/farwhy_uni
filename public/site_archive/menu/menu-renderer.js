document.addEventListener('DOMContentLoaded', function () {
  console.log('Menu renderer initialized');
  loadMenuData();
});
async function loadMenuData() {
  try {
    console.log('Attempting to fetch menu data from /api/menu endpoint');
    const unifiedResponse = await fetch('/api/menu');
    if (unifiedResponse.ok) {
      const unifiedData = await unifiedResponse.json();
      console.log('Unified API response:', unifiedData);
      if (unifiedData.success && Array.isArray(unifiedData.data) && unifiedData.data.length > 0) {
        console.log('Using unified menu API data, found', unifiedData.data.length, 'items');
        updateMenuContent(unifiedData.data);
        return;
      } else {
        console.warn('Unified API returned success=false or empty data array');
      }
    } else {
      console.warn('Unified API response not OK:', unifiedResponse.status);
    }
    console.log('Attempting to fetch menu data from venue-specific endpoint');
    const response = await fetch('/api/venues/farewell/menu-items');
    if (response.ok) {
      const data = await response.json();
      console.log('Venue-specific API response:', data);
      if (data.success && data.data && data.data.length > 0) {
        console.log('Using venue-specific menu API data');
        updateMenuContent(data.data);
        return;
      } else {
        console.warn('Venue API returned success=false or empty data array');
      }
    } else {
      console.warn('Venue API response not OK:', response.status);
    }
    console.log('Using existing static menu content (fallback)');
    useStaticMenuData();
  } catch (error) {
    console.error('Error loading menu data:', error);
    useStaticMenuData();
  }
}
function updateMenuContent(menuItems) {
  console.log('Updating menu content with:', menuItems);
  const categorizedItems = {};
  menuItems.forEach((item) => {
    const category = item.category || 'Uncategorized';
    if (!categorizedItems[category]) {
      categorizedItems[category] = [];
    }
    categorizedItems[category].push(item);
  });
  console.log('Categorized items:', Object.keys(categorizedItems));
  if (categorizedItems['Cocktails']) {
    updateCocktailsSection(categorizedItems['Cocktails']);
  }
  updateBeerSection('Domestics', categorizedItems['Domestics'] || []);
  updateBeerSection('Boulevard', categorizedItems['Boulevard'] || []);
  updateBeerSection('Seasonal', categorizedItems['Seasonal'] || []);
  updateBeerSection('Craft/Import', categorizedItems['Craft/Import'] || []);
  updateBeerSection('Booze-Free', categorizedItems['Booze-Free'] || []);
  applyAnimations();
  console.log('Menu update complete');
}
function updateCocktailsSection(cocktails) {
  const container = document.getElementById('cocktails-container');
  if (!container) return;
  container.innerHTML = '';
  cocktails.forEach((cocktail, index) => {
    if (index === 2) {
      const cowboyDiv = document.createElement('div');
      cowboyDiv.className = 'cowboy';
      cowboyDiv.innerHTML = '<img src="./ohel.png" alt="Cowboy illustration">';
      container.appendChild(cowboyDiv);
    }
    if (cocktail.description && cocktail.description.trim()) {
      const cocktailEl = document.createElement('div');
      cocktailEl.className = 'cocktail';
      cocktailEl.innerHTML = `\n                <div class="cocktail-name">${cocktail.name}</div>\n                <div class="cocktail-details">\n                    <div class="cocktail-ingredients">${cocktail.description}</div>\n                    <div class="cocktail-price">$${parseFloat(cocktail.price).toFixed(2).replace(/\.00$/, '')}</div>\n                </div>\n            `;
      container.appendChild(cocktailEl);
    } else {
      const cocktailEl = document.createElement('div');
      cocktailEl.className = 'cocktail-simple';
      cocktailEl.innerHTML = `\n                <div class="cocktail-name">${cocktail.name}</div>\n                <div class="cocktail-price">$${parseFloat(cocktail.price).toFixed(2).replace(/\.00$/, '')}</div>\n            `;
      container.appendChild(cocktailEl);
      if (index === cocktails.length - 2) {
        const br = document.createElement('br');
        container.appendChild(br);
      }
    }
  });
  const divider = document.createElement('div');
  divider.className = 'divider';
  container.appendChild(divider);
}
function updateBeerSection(category, items) {
  let containerId = category.toLowerCase().replace('/', '-') + '-container';
  console.log(
    `Updating beer section '${category}' with ${items.length} items, targeting container ID: ${containerId}`
  );
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container not found for category "${category}" with ID "${containerId}"`);
    return;
  }
  container.innerHTML = '';
  items.forEach((item) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'beer-item';
    const nameHtml =
      item.name.toLowerCase() === 'yeungling' ? `<del>${item.name}</del>` : item.name;
    itemEl.innerHTML = `\n            <span class="beer-name">${nameHtml}</span>\n            <span class="beer-price">$${parseFloat(item.price).toFixed(2).replace(/\.00$/, '')}</span>\n        `;
    container.appendChild(itemEl);
  });
  console.log(`Finished updating beer section '${category}' with ${items.length} items`);
}
function applyAnimations() {
  if (typeof gsap !== 'undefined') {
    gsap.from('.menu-header img', {
      duration: 1,
      y: -50,
      opacity: 0,
      ease: 'bounce',
      stagger: 0.2,
    });
    const allItems = document.querySelectorAll('.cocktail, .cocktail-simple, .beer-item');
    gsap.from(allItems, { duration: 0.5, opacity: 0, y: 20, stagger: 0.05, ease: 'power2.out' });
  } else {
    console.log('GSAP not available, skipping animations');
  }
}
function useStaticMenuData() {
  const cocktails = [
    { name: 'STRAY DOG', price: '9', description: "Tito's vodka, kahlua, non-dairy milk." },
    {
      name: 'CRANSYLVANIA',
      price: '9',
      description:
        'Old grandad bourbon, cranberry juice, lemon juice, maple syrup, sparkling water.',
    },
    {
      name: 'RYE & GOSLING',
      price: '7',
      description: 'Roulette rye, lime juice, ginger beer, aromatic bitters.',
    },
    {
      name: 'LEAKY ROOF',
      price: '9',
      description: "Farewell's mystery liquor concoction, triple sec, sweet n' sour, cola.",
    },
    {
      name: 'YUPPIE SPEEDBALL',
      price: '9',
      description: 'Jose cuervo blanco tequila, revel berry yerba mate, pear liquor, grenadine.',
    },
    { name: 'WELL SHOT', price: '4', description: '' },
    { name: 'WELL MIX', price: '5', description: '' },
  ];
  const domestics = [
    { name: "Hamm's", price: '3' },
    { name: 'PBR', price: '5' },
    { name: 'Rolling Rock', price: '4' },
    { name: 'Miller Lite', price: '5' },
    { name: 'Bud Light', price: '6' },
    { name: 'Bud Heavy', price: '6' },
    { name: 'Coors Banquet', price: '5' },
    { name: 'Michelob', price: '6' },
    { name: 'Yeungling', price: '5' },
    { name: 'Twisted Tea', price: '5' },
  ];
  const boulevard = [
    { name: 'Wheat', price: '5' },
    { name: 'Pale Ale', price: '5' },
    { name: 'Tank 7', price: '7' },
    { name: 'Space Camper', price: '5' },
    { name: 'Quirk', price: '6' },
  ];
  const seasonal = [
    { name: 'TL Monk & Honey', price: '6' },
    { name: "Mother's Coffee Stout", price: '5' },
  ];
  const craftImport = [
    { name: 'Modelo', price: '5' },
    { name: 'Victoria', price: '5' },
    { name: 'Guinness', price: '6' },
    { name: 'Stella', price: '5' },
    { name: 'Blue Moon', price: '6' },
    { name: "Founder's IPA", price: '5' },
    { name: "Lagunita's IPA", price: '5' },
    { name: 'Sea Quench Sour', price: '6' },
    { name: 'Angry Orchard', price: '5' },
    { name: "Blake's Ciders", price: '7' },
    { name: 'Stiegl Radler', price: '8' },
  ];
  const boozeFree = [
    { name: 'Athletics', price: '5' },
    { name: 'Coors Edge N/A', price: '4' },
    { name: 'Red Bull', price: '5' },
    { name: 'AriZona Iced Tea', price: '2.50' },
    { name: 'Yerba Mate', price: '5' },
    { name: 'Waterloo', price: '2' },
    { name: 'Coke', price: '2' },
    { name: 'Diet Coke', price: '2' },
    { name: 'Sprite', price: '2' },
    { name: 'Ginger Ale', price: '2' },
    { name: 'Casamara', price: '6' },
  ];
  updateCocktailsSection(cocktails);
  updateBeerSection('Domestics', domestics);
  updateBeerSection('Boulevard', boulevard);
  updateBeerSection('Seasonal', seasonal);
  updateBeerSection('Craft/Import', craftImport);
  updateBeerSection('Booze-Free', boozeFree);
}
