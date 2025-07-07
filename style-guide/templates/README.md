# Component Templates

This directory contains reusable templates for common UI components in the Farewell/Howdy unified project.

## Template Files

### HTML Templates

- **page-template.html** - Base page structure with header, navigation, content areas, and footer
- **event-card.html** - Event display component with image, details, and actions
- **menu-components.html** - Menu item, category, and full menu templates
- **admin-form.html** - Administrative form template with validation and modal support

### CSS Template Structure

When creating new components, follow this CSS structure pattern:

```css
/* Component name and description */
.component-name {
    /* Container styles */
    display: block;
    position: relative;
    
    /* Use CSS custom properties for consistency */
    margin: var(--padding-small) 0;
    padding: var(--padding-medium);
    background: var(--card-bg-color);
    border: 2px solid var(--text-color);
    
    /* Typography */
    font-family: var(--font-main);
    color: var(--text-color);
    
    /* Transitions */
    transition: all var(--transition-speed) ease;
}

/* BEM naming convention for sub-elements */
.component-name__header { }
.component-name__content { }
.component-name__actions { }

/* BEM modifiers for variants */
.component-name--featured { }
.component-name--disabled { }
.component-name--loading { }

/* Responsive breakpoints */
@media (max-width: 768px) { }

/* Accessibility considerations */
@media (prefers-reduced-motion: reduce) { }
@media (prefers-contrast: high) { }
```

## Template Variables

Templates use Handlebars-style syntax with double curly braces:

- `{{VARIABLE_NAME}}` - Simple variable substitution
- `{{#if CONDITION}}...{{/if}}` - Conditional blocks
- `{{#each ARRAY}}...{{/each}}` - Iteration blocks
- `{{#unless CONDITION}}...{{/unless}}` - Negative conditionals

## Usage Guidelines

### Creating New Components

1. Start with the appropriate template
2. Replace placeholder variables with actual values
3. Follow the established design patterns
4. Include proper accessibility attributes
5. Test across different screen sizes
6. Validate HTML and CSS

### Naming Conventions

- **CSS Classes**: Use BEM methodology (block__element--modifier)
- **IDs**: Use kebab-case for form elements and unique identifiers
- **Variables**: Use SCREAMING_SNAKE_CASE for template variables
- **Files**: Use kebab-case for file names

### Accessibility Requirements

- Include proper ARIA attributes
- Ensure keyboard navigation support
- Maintain color contrast ratios
- Provide alternative text for images
- Use semantic HTML elements

### Component Checklist

- [ ] Responsive design implemented
- [ ] Accessibility attributes included
- [ ] Browser compatibility tested
- [ ] Performance optimized
- [ ] Documentation updated
- [ ] Visual design matches style guide

## Example Implementation

To use the event-card template:

```javascript
const eventCardHTML = eventCardTemplate
    .replace('{{EVENT_ID}}', event.id)
    .replace('{{EVENT_TITLE}}', event.title)
    .replace('{{EVENT_IMAGE_URL}}', event.flyer_image_url)
    .replace('{{EVENT_DATE_DISPLAY}}', formatDate(event.date))
    // ... continue for all variables
```

Or with a templating engine:

```javascript
const template = Handlebars.compile(eventCardTemplate);
const html = template({
    EVENT_ID: event.id,
    EVENT_TITLE: event.title,
    EVENT_IMAGE_URL: event.flyer_image_url,
    EVENT_DATE_DISPLAY: formatDate(event.date)
});
```

## Testing Templates

1. **Visual Testing**: Verify appearance across browsers and devices
2. **Functional Testing**: Ensure interactive elements work correctly
3. **Accessibility Testing**: Use screen readers and keyboard navigation
4. **Performance Testing**: Check loading times and rendering performance
5. **Content Testing**: Test with various content lengths and types

## Maintenance

- Review templates quarterly for outdated patterns
- Update based on user feedback and analytics
- Ensure consistency with evolving design system
- Keep documentation current with code changes
