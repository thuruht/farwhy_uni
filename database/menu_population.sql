-- menu_population.sql
-- Script to populate menu items for Farewell

-- First, let's check if we already have a menu entry, if not create one
INSERT OR IGNORE INTO menus (id, venue, name, display_order, active, created_at, updated_at)
VALUES (1, 'farewell', 'Main Menu', 1, 1, datetime('now'), datetime('now'));

-- Clear existing menu items if any (to avoid duplicates)
UPDATE menu_items SET active = 0 WHERE menu_id = 1;

-- Cocktails
INSERT INTO menu_items (menu_id, name, description, price, category, display_order, active)
VALUES 
(1, 'STRAY DOG', 'Tito''s vodka, kahlua, non-dairy milk.', 9, 'Cocktails', 1, 1),
(1, 'CRANSYLVANIA', 'Old grandad bourbon, cranberry juice, lemon juice, maple syrup, sparkling water.', 9, 'Cocktails', 2, 1),
(1, 'RYE & GOSLING', 'Roulette rye, lime juice, ginger beer, aromatic bitters.', 7, 'Cocktails', 3, 1),
(1, 'LEAKY ROOF', 'Farewell''s mystery liquor concoction, triple sec, sweet n'' sour, cola.', 9, 'Cocktails', 4, 1),
(1, 'YUPPIE SPEEDBALL', 'Jose cuervo blanco tequila, revel berry yerba mate, pear liquor, grenadine.', 9, 'Cocktails', 5, 1),
(1, 'WELL SHOT', '', 4, 'Cocktails', 6, 1),
(1, 'WELL MIX', '', 5, 'Cocktails', 7, 1);

-- Domestics
INSERT INTO menu_items (menu_id, name, description, price, category, display_order, active)
VALUES 
(1, 'Hamm''s', NULL, 3, 'Domestics', 1, 1),
(1, 'PBR', NULL, 5, 'Domestics', 2, 1),
(1, 'Rolling Rock', NULL, 4, 'Domestics', 3, 1),
(1, 'Miller Lite', NULL, 5, 'Domestics', 4, 1),
(1, 'Bud Light', NULL, 6, 'Domestics', 5, 1),
(1, 'Bud Heavy', NULL, 6, 'Domestics', 6, 1),
(1, 'Coors Banquet', NULL, 5, 'Domestics', 7, 1),
(1, 'Michelob', NULL, 6, 'Domestics', 8, 1),
(1, 'Yeungling', NULL, 5, 'Domestics', 9, 1),
(1, 'Twisted Tea', NULL, 5, 'Domestics', 10, 1);

-- Boulevard
INSERT INTO menu_items (menu_id, name, description, price, category, display_order, active)
VALUES 
(1, 'Wheat', NULL, 5, 'Boulevard', 1, 1),
(1, 'Pale Ale', NULL, 5, 'Boulevard', 2, 1),
(1, 'Tank 7', NULL, 7, 'Boulevard', 3, 1),
(1, 'Space Camper', NULL, 5, 'Boulevard', 4, 1),
(1, 'Quirk', NULL, 6, 'Boulevard', 5, 1);

-- Seasonal
INSERT INTO menu_items (menu_id, name, description, price, category, display_order, active)
VALUES 
(1, 'TL Monk & Honey', NULL, 6, 'Seasonal', 1, 1),
(1, 'Mother''s Coffee Stout', NULL, 5, 'Seasonal', 2, 1);

-- Craft/Import
INSERT INTO menu_items (menu_id, name, description, price, category, display_order, active)
VALUES 
(1, 'Modelo', NULL, 5, 'Craft/Import', 1, 1),
(1, 'Victoria', NULL, 5, 'Craft/Import', 2, 1),
(1, 'Guinness', NULL, 6, 'Craft/Import', 3, 1),
(1, 'Stella', NULL, 5, 'Craft/Import', 4, 1),
(1, 'Blue Moon', NULL, 6, 'Craft/Import', 5, 1),
(1, 'Founder''s IPA', NULL, 5, 'Craft/Import', 6, 1),
(1, 'Lagunita''s IPA', NULL, 5, 'Craft/Import', 7, 1),
(1, 'Sea Quench Sour', NULL, 6, 'Craft/Import', 8, 1),
(1, 'Angry Orchard', NULL, 5, 'Craft/Import', 9, 1),
(1, 'Blake''s Ciders', NULL, 7, 'Craft/Import', 10, 1),
(1, 'Stiegl Radler', NULL, 8, 'Craft/Import', 11, 1);

-- Booze-Free
INSERT INTO menu_items (menu_id, name, description, price, category, display_order, active)
VALUES 
(1, 'Athletics', NULL, 5, 'Booze-Free', 1, 1),
(1, 'Coors Edge N/A', NULL, 4, 'Booze-Free', 2, 1),
(1, 'Red Bull', NULL, 5, 'Booze-Free', 3, 1),
(1, 'AriZona Iced Tea', NULL, 2.50, 'Booze-Free', 4, 1),
(1, 'Yerba Mate', NULL, 5, 'Booze-Free', 5, 1),
(1, 'Waterloo', NULL, 2, 'Booze-Free', 6, 1),
(1, 'Coke', NULL, 2, 'Booze-Free', 7, 1),
(1, 'Diet Coke', NULL, 2, 'Booze-Free', 8, 1),
(1, 'Sprite', NULL, 2, 'Booze-Free', 9, 1),
(1, 'Ginger Ale', NULL, 2, 'Booze-Free', 10, 1),
(1, 'Casamara', NULL, 6, 'Booze-Free', 11, 1);
