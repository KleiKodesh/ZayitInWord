# Zayit Vue

A Hebrew text viewer application built with Vue 3, TypeScript, and Vite.

## Architecture

This application follows a **container/presentational pattern** with **centralized routing state**:

- **Tab Store (Pinia)** - Manages application-level navigation state (active tab, content type, book selection). Acts as a lightweight router coordinating between components.

- **Smart Components** - Self-contained components (CategoryTree, TocTree) that read from and write to the tab store for navigation, while maintaining their own local UI state (keyboard navigation, search filtering, animations).

- **Functional Composition** - Each component is independently functional and can work in isolation. The tab store provides coordination without tight coupling.

This pattern combines:
- **Flux/Redux principles** - Unidirectional data flow for navigation state
- **Component autonomy** - Local state management for UI concerns
- **Separation of concerns** - Application state (tabs) vs component state (UI)

## Theming

The application uses a custom theming system that combines:
- **Windows 11 Fluent Design** color palette
- **VS Code** style design and layout

All colors are defined as CSS variables in `src/assets/theme.css`:

**For image files (PNG/SVG):**
```vue
<img src="icon.png" class="themed-icon" />
```
Automatically inverts colors in dark mode.