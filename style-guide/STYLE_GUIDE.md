# Farewell/Howdy Unified Project - Style Guide

## Overview

This style guide documents the design system and UI patterns used throughout the Farewell/Howdy unified project. It provides guidelines for maintaining visual consistency across both the public site and admin interface.

## Color Palette

### Primary Colors
```css
:root {
    --pupil: #d990ff;           /* Purple - Primary accent */
    --redd: #ff2b13;            /* Red - Alert/warning */
    --lima: #b0ee00;            /* Lime - Success/primary action */
    --blew: #00e2ff;            /* Blue - Information */
    --primary-bg-color: #b0ee00; /* Main background (Farewell) */
    --secondary-bg-color: #D990FF; /* Main background (Howdy) */
    --accent-color: #ff2b13;     /* Accent for highlights */
    --text-color: #010101;       /* Primary text */
}
```

### Venue-Specific Colors
- **Farewell**: Lime green (`#b0ee00`) with background texture `bg4.png`
- **Howdy**: Purple (`#D990FF`) with background texture `bg7.png`

## Typography

### Font Stack
```css
/* Primary fonts */
--font-howder: 'ds', sans-serif;      /* Howdy venue branding */
--font-main: 'hnb2', sans-serif;      /* Primary UI text */
--font-secondary: 'kb', sans-serif;    /* Secondary text */
--font-db: 'db', sans-serif;          /* Display text */
--font-mt: 'mt', sans-serif;          /* Alternative display */
```

### Font Hierarchy
- **Headers**: `hnb2` font family, bold weight
- **Body text**: `kb` font family, normal weight
- **Venue branding**: `ds` for Howdy, custom fonts for Farewell
- **Buttons**: `hnb2` font family, bold weight

## Layout System

### Spacing
```css
--padding-small: 24px;
--padding-medium: 32px;
--padding-large: 36px;
```

### Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## Components

### Buttons

#### Primary Button
```css
.btn-primary {
    background: var(--lima);
    color: var(--text-color);
    border: 2px solid #000;
    font-family: var(--font-main);
    font-weight: bold;
    padding: 12px 24px;
    border-radius: 0;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    background: #a0dd00;
    transform: translateY(-2px);
}
```

#### Secondary Button
```css
.btn-secondary {
    background: transparent;
    color: var(--text-color);
    border: 2px solid var(--text-color);
    font-family: var(--font-main);
    padding: 12px 24px;
    border-radius: 0;
}
```

#### Admin Button
```css
.admin-btn {
    background: var(--pupil);
    color: white;
    border: none;
    padding: 10px 20px;
    font-family: var(--font-main);
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
}
```

### Cards

#### Event Card
```css
.event-card {
    background: var(--card-bg-color);
    border: 2px solid #000;
    margin: var(--padding-small);
    padding: var(--padding-medium);
    position: relative;
}

.event-card img {
    width: 100%;
    height: auto;
    border: 1px solid #000;
}
```

#### Menu Card
```css
.menu-card {
    background: #fff;
    border: 2px solid #000;
    padding: var(--padding-medium);
    margin-bottom: var(--padding-small);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
}
```

### Forms

#### Form Elements
```css
.form-control {
    width: 100%;
    padding: 12px;
    border: 2px solid #000;
    background: #fff;
    font-family: var(--font-secondary);
    border-radius: 0;
}

.form-control:focus {
    outline: none;
    border-color: var(--lima);
    box-shadow: 0 0 0 2px rgba(176, 238, 0, 0.2);
}
```

#### Labels
```css
label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    font-family: var(--font-main);
    color: var(--text-color);
}
```

### Navigation

#### Primary Navigation
```css
.nav {
    background: var(--nav-bg-color);
    border-bottom: var(--nav-border-color) 2px solid;
    padding: var(--padding-small);
}

.nav-link {
    color: var(--text-color);
    text-decoration: none;
    font-family: var(--font-main);
    font-weight: bold;
    padding: 8px 16px;
    transition: background 0.3s ease;
}

.nav-link:hover {
    background: var(--lima);
}
```

### Modals

#### Modal Structure
```css
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 1000;
}

.modal-content {
    background: #fff;
    margin: 5% auto;
    padding: var(--padding-large);
    width: 90%;
    max-width: 600px;
    border: 3px solid #000;
    position: relative;
}
```

## Admin Interface Patterns

### Dashboard Layout
- Clean, grid-based layout
- Consistent spacing using CSS custom properties
- Clear section dividers
- Responsive design patterns

### Action Buttons
- Grouped logically by function
- Consistent styling across sections
- Clear visual hierarchy (primary vs secondary actions)
- Accessibility considerations (ARIA labels, keyboard navigation)

### Data Tables
- Zebra striping for readability
- Consistent column alignment
- Action buttons grouped in final column
- Responsive stacking on mobile

## Accessibility Guidelines

### Color Contrast
- Ensure minimum 4.5:1 contrast ratio for normal text
- Use 3:1 ratio for large text (18pt+ or 14pt+ bold)
- Never rely on color alone to convey information

### Typography
- Minimum 16px font size for body text
- Clear font hierarchy with size and weight differences
- Adequate line spacing (1.4-1.6 line height)

### Interactive Elements
- Minimum 44px touch target size
- Clear focus indicators
- Keyboard navigation support
- Meaningful link text

## File Organization

### CSS Structure
- `ccssss.css` - Main site styles and variables
- `fleeting-journey.css` - Literary theme styles
- `unified-buttons.css` - Button components
- `literary-admin.css` - Admin interface styles
- `menu-management.css` - Menu-specific styles

### Asset Organization
- Fonts: `/public/fnt/`
- Images: `/public/img/`
- Icons: SVG format preferred
- Background textures: PNG format

## Development Guidelines

### CSS Best Practices
- Use CSS custom properties for consistent theming
- Follow BEM naming convention for new components
- Minimize specificity conflicts
- Group related styles logically

### Responsive Design
- Mobile-first approach
- Use relative units (rem, em, %) where appropriate
- Test across device sizes
- Consider touch interactions on mobile

### Performance
- Optimize images for web
- Use modern image formats (WebP, AVIF) with fallbacks
- Minimize CSS bundle size
- Use font-display: swap for custom fonts

## Brand Guidelines

### Farewell Cafe
- Primary color: Lime green (`#b0ee00`)
- Personality: Energetic, vibrant, music-focused
- Typography: Bold, industrial fonts
- Imagery: High contrast, punk/alternative aesthetic

### Howdy Hideout
- Primary color: Purple (`#d990ff`)
- Personality: Welcoming, community-focused
- Typography: Friendly, rounded fonts
- Imagery: Warm, inclusive, diverse

## Common Patterns

### Page Headers
```html
<header class="page-header">
    <h1 class="page-title">Page Title</h1>
    <p class="page-subtitle">Optional subtitle</p>
</header>
```

### Content Sections
```html
<section class="content-section">
    <div class="section-header">
        <h2 class="section-title">Section Title</h2>
        <div class="section-actions">
            <button class="btn-primary">Primary Action</button>
            <button class="btn-secondary">Secondary Action</button>
        </div>
    </div>
    <div class="section-content">
        <!-- Content here -->
    </div>
</section>
```

### Loading States
```html
<div class="loading-state">
    <div class="loading-spinner"></div>
    <p class="loading-text">Loading...</p>
</div>
```

## Quality Assurance

### Testing Checklist
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Print styles (where applicable)

### Code Review Guidelines
- Consistent naming conventions
- Proper component documentation
- Accessibility attributes included
- Performance considerations addressed
- Brand guidelines followed

---

*This style guide is a living document that should be updated as the design system evolves.*
