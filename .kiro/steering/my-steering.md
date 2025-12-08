# My Steering Rules

Custom project-specific guidelines and preferences.

## CSS Patterns

### Dropdown/Absolute Positioning
When creating dropdowns or absolutely positioned elements:

**Preferred Pattern:**
```css
.parent {
  position: relative; /* Positioning context */
}

.child {
  position: absolute; /* Positioned relative to parent */
  top: 100%; /* Position directly below parent */
  left: 0;
  right: 0;
}
```

**Avoid:**
```css
.child {
  position: absolute;
  top: 3rem; /* Hardcoded values */
  width: 100%;
}
```

**Benefits:**
- More maintainable (no hardcoded values)
- Automatically adjusts if parent size changes
- Clearer parent-child relationship
- Standard CSS pattern

## Data Architecture

### Unified JSON Approach
Both C# and TypeScript should return flat JSON data from database queries. Tree building happens in JavaScript using shared utilities.

**Pattern:**
1. Database returns flat data with pre-computed paths
2. Bridge passes flat JSON to stores/components
3. Shared utility functions build tree structures
4. Single source of truth for tree building logic

**Benefits:**
- C# and TypeScript produce identical structures
- Easier to maintain and debug
- Consistent data format across platforms

### Path Naming
Use `path` instead of `fullCategory` for hierarchical paths:
- More intuitive naming
- Use `>` as separator (e.g., `תנ"ך > תורה > בראשית`)
- No trailing separators

## Search Behavior

### Clear Search on View Switch
Always clear search queries when switching between different views (e.g., CategoryTree ↔ TocTree).

**Implementation:**
Use watchers on the view-determining property to automatically clear search state.

```typescript
watch(() => tabsStore.activeTab?.bookId, () => {
  searchInput.value = ''
  debouncedSearchQuery.value = ''
})
```
