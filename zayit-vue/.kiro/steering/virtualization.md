# BookLineViewer Virtualization Architecture

## Overview

Semi-virtualization system with progressive loading, memory management, and reactive search.

## Components

### **BookLineViewerState**
- `lines.value` - Currently visible lines (UI layer)
- `lineBuffer` - All loaded content (source of truth)
- `bufferUpdateCount` - Reactive counter for search updates

### **Loading Strategy**
1. **Progressive Loading** - Background loads all lines into buffer
2. **Intersection Observer** - Loads visible lines into UI + buffer
3. **Memory Cleanup** - Removes non-visible lines from UI, keeps in buffer

## Flow

### **Initial Load**
```
Book loads → Progressive loading starts → Buffer fills gradually
```

### **Visibility**
```
Line visible → Intersection observer → Load to UI + Buffer
Line hidden → Cleanup → Remove from UI, keep in buffer
```

### **Search**
```
User searches → Search buffer only → Auto re-search on buffer updates
```

## Buffer Management

### **Loading**
- **Intersection observer**: Immediate load to UI + buffer
- **Background loading**: Progressive load to buffer only
- **Buffer is complete**: Contains all loaded content always

### **Cleanup**
- **Memory buffer size**: 50 lines (regular), 500 lines (inline mode)
- **Load buffer size**: 20 lines around visible area
- **Cleanup delay**: 500ms debounced

### **Search Integration**
- **Source**: Buffer only (`getBufferLinesForSearch()`)
- **Reactive**: Re-searches when `bufferUpdateCount` changes
- **Complete**: Finds all loaded content regardless of UI state

## Key Rules

1. **Buffer is source of truth** - contains all loaded content
2. **UI is viewport** - only visible + buffer zone
3. **Search uses buffer** - never searches UI directly
4. **Immediate buffer updates** - content added to buffer when loaded
5. **No content loss** - cleanup moves to buffer, never deletes

## Performance

- **Memory efficient**: Only renders visible + buffer zone
- **Search complete**: Finds all loaded content
- **Responsive**: No blocking operations
- **Adaptive**: Larger buffer for inline mode