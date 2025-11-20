# VS Code Design System

This project follows Visual Studio Code's design language and color system.

## Color Variables

All colors are defined as CSS custom properties in `src/App.vue`:

### Light Theme
- `--bg-primary: #ffffff` - Main background
- `--bg-secondary: #f3f3f3` - Secondary background (headers, sidebars)
- `--text-primary: #3b3b3b` - Primary text color
- `--text-secondary: #6c6c6c` - Secondary text color
- `--border-color: #e5e5e5` - Border color
- `--hover-bg: rgba(90, 93, 94, 0.1)` - Hover state background
- `--active-bg: rgba(90, 93, 94, 0.15)` - Active/pressed state background
- `--accent-color: #007acc` - Accent color (VS Code blue)
- `--accent-bg: rgba(0, 122, 204, 0.1)` - Accent background

### Dark Theme
- `--bg-primary: #1e1e1e` - Main background
- `--bg-secondary: #252526` - Secondary background
- `--text-primary: #cccccc` - Primary text color
- `--text-secondary: #858585` - Secondary text color
- `--border-color: #3e3e42` - Border color
- `--hover-bg: rgba(90, 93, 94, 0.31)` - Hover state background
- `--active-bg: rgba(90, 93, 94, 0.5)` - Active/pressed state background
- `--accent-color: #0e639c` - Accent color (darker blue for dark theme)
- `--accent-bg: rgba(14, 99, 156, 0.3)` - Accent background

## Design Principles

### 1. Use CSS Variables
Always use CSS custom properties instead of hardcoded colors:
```css
/* Good */
color: var(--text-primary);
background: var(--hover-bg);

/* Bad */
color: #3b3b3b;
background: rgba(90, 93, 94, 0.1);
```

### 2. Consistent Spacing
- Standard padding: `8px`, `12px`, `16px`, `20px`
- Gap between elements: `4px`, `8px`, `12px`
- Border radius: `4px` (standard), `50%` (circular buttons)

### 3. Typography

#### UI Text
- Font family: `'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif`
- Font sizes: `11px`, `12px`, `13px`, `14px`, `18px`, `20px`
- Font weights: `400` (normal), `500` (medium), `600` (semibold)

#### Document Headers (h1-h6)
Headers follow a clear visual hierarchy:

- **H1** - Main title
  - Font size: `2em`
  - Font weight: `700` (bold)
  - Bottom border: `2px solid`
  - Use for: Book titles, major divisions

- **H2** - Major section
  - Font size: `1.6em`
  - Font weight: `700` (bold)
  - Bottom border: `1px solid`
  - Use for: Chapter titles, main sections

- **H3** - Subsection
  - Font size: `1.4em`
  - Font weight: `600` (semibold)
  - No border
  - Use for: Section headings

- **H4** - Minor heading
  - Font size: `1.2em`
  - Font weight: `600` (semibold)
  - Use for: Subsection headings

- **H5** - Small heading
  - Font size: `1.1em`
  - Font weight: `600` (semibold)
  - Use for: Minor divisions

- **H6** - Smallest heading
  - Font size: `0.9em`
  - Font weight: `600` (semibold)
  - Text transform: `uppercase`
  - Letter spacing: `0.05em`
  - Use for: Labels, small divisions

### 4. Interactive States
All interactive elements should have:
- Hover state: `background: var(--hover-bg)`
- Active/pressed state: `background: var(--active-bg)`
- Focus state: `outline: 2px solid var(--accent-color)`
- Smooth transitions: `transition: all 0.1s ease` or `0.2s ease`

### 5. Shadows
Use subtle shadows for depth:
- Light shadow: `box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1)`
- Medium shadow: `box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15)`

### 6. Backdrop Filters
For semi-transparent overlays:
```css
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
```

### 7. Icons
- Use themed icons with the `.themed-icon` class for automatic dark mode support
- Icon sizes: `16px`, `18px`, `20px`, `24px`
- Icon opacity: `0.7` (default), `1` (hover/active)

## Component Patterns

### Buttons
```css
.button {
  background: transparent;
  border: none;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.button:hover {
  background: var(--hover-bg);
}

.button:active {
  background: var(--active-bg);
  transform: scale(0.95);
}
```

### List Items
```css
.list-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.1s ease;
  border-bottom: 1px solid var(--border-color);
}

.list-item:hover {
  background: var(--hover-bg);
}

.list-item.active {
  background: var(--accent-bg);
  color: var(--accent-color);
  border-right: 3px solid var(--accent-color);
}
```

### Dropdowns
```css
.dropdown {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
```

## Accessibility

- All interactive elements must be keyboard accessible
- Use proper ARIA labels where needed
- Maintain sufficient color contrast (WCAG AA minimum)
- Support both light and dark themes
- Provide focus indicators for keyboard navigation

## Special Cases

### Green Accent (Advance Button)
The advance/play button uses a green color for visual distinction:
```css
color: #22c55e;
background: rgba(34, 197, 94, 0.1); /* on hover */
```

### Diacritics States
Special orange/red colors for text filtering states:
```css
.state-1 {
  background: rgba(255, 165, 0, 0.15);
  color: #ff8c00;
}

.state-2 {
  background: rgba(255, 69, 0, 0.15);
  color: #ff4500;
}
```

These are intentional exceptions to the standard color system for functional clarity.
