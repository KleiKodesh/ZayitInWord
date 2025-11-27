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

## Composables

The app uses **VueUse** for common UI patterns. Custom composables are in `src/composables/`:

### `useClickOutside`

Handles click-outside detection for dropdowns, modals, and popovers:

```vue
<script setup>
import { ref } from 'vue'
import { useClickOutside } from '@/composables/useClickOutside'

const dropdownRef = ref(null)
const isOpen = ref(false)

useClickOutside(dropdownRef, () => {
  isOpen.value = false
})
</script>

<template>
  <div ref="dropdownRef">
    <button @click="isOpen = !isOpen">Toggle</button>
    <div v-if="isOpen">Dropdown content</div>
  </div>
</template>
```

**Note:** VueUse adds ~1-2 KB to the bundle but provides tree-shaking, so only imported utilities are included.

## Build Configuration

This application uses **single-file offline mode** via `vite-plugin-singlefile`:

- All JavaScript, CSS, and assets (images, fonts) are inlined into a single `index.html`
- No external dependencies or network requests required
- Perfect for WebView2 integration and offline usage
- Build output: `dist/index.html` (~500KB-1MB depending on assets)

**Configuration highlights:**
- `assetsInlineLimit: 100000000` - Inline all assets as base64
- `inlineDynamicImports: true` - No code splitting
- `cssCodeSplit: false` - Single CSS bundle

**Dependency considerations:** When adding new libraries, prefer lightweight alternatives to minimize bundle size. The entire app must fit in a single HTML file.

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