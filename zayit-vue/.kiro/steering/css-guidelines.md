# CSS Guidelines

When working with CSS in this project:

0. **Prefer global CSS over scoped CSS** - Before adding scoped styles to a component, check if the styling can be achieved with existing global utility classes or if a new global utility class would be more reusable. Only use scoped CSS for truly component-specific styles that won't be reused elsewhere.

1. **Check existing utility classes first** - Review `src/assets/styles/main.css` before creating new CSS rules. The project has utility classes like:
   - `.flex-row`, `.flex-column`, `.flex-center`
   - `.flex-110`, `.flex-11a`
   - `.justify-end`, `.flex-center-end`, `.flex-center-start`
   - `.bold`, `.ellipsis`, `.center-text`
   - `.bar` (for header/dropdown bars)

2. **Avoid duplicating CSS** - Don't recreate styles that already exist in global stylesheets or are browser defaults

3. **Use existing classes** - Prefer combining utility classes over writing new scoped styles when possible

4. **Keep scoped styles minimal** - Only add component-specific styles that can't be achieved with existing utilities

5. **Button icons are themed by default** - All `img` and `svg` elements inside buttons automatically get proper sizing and dark mode theming via `src/assets/styles/button.css`. Never add `.themed-icon` class to buttons.

6. **Fix only what's requested** - When fixing CSS issues, only modify the specific problem mentioned. Don't change other styles, formatting, or unrelated code.

7. **CSS Class Ordering** - When applying multiple CSS classes to an element, order from most generic (applies to any element) to most specific (applies to specific contexts):
   - Layout (flex-row, flex-column, flex-center, flex-110) - applies to any element
   - Sizing (height-fill, width-fill, overflow-y) - applies to any element
   - Interactive states (hover-bg, focus-accent, click-effect, keyboard-active) - applies to any interactive element
   - Cursor (c-pointer) - applies to any element
   - Typography (bold, text-secondary, smaller-em, line-1.4) - applies only to text elements
   - Component utilities (bar, tree-node, reactive-icon) - applies to specific component types
   - Component-specific classes (last) - applies to one specific component
   
   Example: `class="flex-row flex-110 hover-bg focus-accent click-effect c-pointer bold tree-node reactive-icon custom-class"`

8. **Empty states and messages** - Use the `BookIconWithText` component for empty states, no results messages, and similar informational displays. This provides consistent styling with a centered book icon and text:
   ```vue
   <BookIconWithText text="לא נמצאו תוצאות" />
   ```
   The component is located at `src/components/icons/BookIconWithText.vue` and automatically handles:
   - Centered layout with proper spacing
   - Styled book icon (3rem size, accent color)
   - Bold text below the icon
   - Full height/width container

9. **Reactive icons** - To make icons react to parent hover/focus states, apply the `reactive-icon` class to the parent element, not the icon itself. Then use scoped CSS with `:deep()` to target the icon's SVG:
   ```vue
   <template>
     <div class="tree-node reactive-icon">
       <BookIcon />
     </div>
   </template>
   
   <style scoped>
   .tree-node:hover :deep(svg),
   .tree-node:focus :deep(svg) {
     fill: var(--accent-color);
   }
   </style>
   ```

10. **Parent Controls Child Layout** - Layout classes that control how a child component fits within its parent's layout should be applied by the parent, not on the child's root element. This includes:
   - Flex properties: `flex-110`, `flex-11a`
   - Sizing: `height-fill`, `width-fill`
   - Positioning within parent layout
   
   The child component should only define its internal structure, not how it fits into its parent's layout. This keeps layout responsibility with the parent and makes components more reusable.
   
   - BAD: Child component has layout classes on its root element
   - GOOD: Parent applies layout classes when using the child component
   
   Example:
   ```vue
   <!-- Parent component controls child layout -->
   <ChildComponent class="flex-110 height-fill" />
   
   <!-- Child component only defines internal structure -->
   <template>
     <div class="flex-column">
       <div>Internal content</div>
     </div>
   </template>
   ```
