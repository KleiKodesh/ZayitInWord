# BookLineViewer Virtualization Architecture

## Overview

Semi-virtualization system with progressive loading, memory management, and reactive search.

## Components

### **BookLineViewerState**
- `lines.value` - Currently visible lines (UI layer)
- `lineBuffer` - All loaded content (source of truth)
- `bufferUpdateCount` - Reactive counter for search updates

### **Loading Strategy**
1. **Progressive Loading** - ALWAYS happens via background loading (regardless of virtualization setting)
2. **Intersection Observer** - Only active when virtualization is ON - loads visible lines into UI + buffer
3. **Memory Cleanup** - Only when virtualization is ON - removes non-visible lines from UI, keeps in buffer

## Flow

### **Initial Load**
```
Book loads → Progressive loading ALWAYS starts → Buffer fills gradually
```

### **Virtualization ON**
```
Line visible → Intersection observer → Load to UI + Buffer
Line hidden → Cleanup → Remove from UI, keep in buffer
```

### **Virtualization OFF**
```
Progressive loading → All content goes to UI immediately (no cleanup)
```

### **Search**
```
User searches → Search buffer only → Auto re-search on buffer updates
```

## Buffer Management

### **Loading (ALWAYS ACTIVE)**
- **Background loading**: Progressive load to buffer (ALWAYS happens)
- **Intersection observer**: Only when virtualization ON - immediate load to UI + buffer
- **Buffer is complete**: Contains all loaded content always

### **Cleanup (ONLY WHEN VIRTUALIZATION ON)**
- **Memory buffer size**: 50 lines (regular), 500 lines (inline mode)
- **Load buffer size**: 20 lines around visible area
- **Cleanup delay**: 500ms debounced

### **Search Integration**
- **Source**: Buffer only (`getBufferLinesForSearch()`)
- **Reactive**: Re-searches when `bufferUpdateCount` changes
- **Complete**: Finds all loaded content regardless of UI state

## Key Rules

1. **Progressive loading ALWAYS happens** - regardless of virtualization setting
2. **Buffer is source of truth** - contains all loaded content
3. **UI is viewport** - only visible + buffer zone (when virtualization ON)
4. **Search uses buffer** - never searches UI directly
5. **Immediate buffer updates** - content added to buffer when loaded
6. **No content loss** - cleanup moves to buffer, never deletes
7. **Virtualization setting only controls memory management** - NOT progressive loading

## Virtualization Setting Effects

### **When ON (Default)**
- Progressive loading fills buffer
- Intersection observer manages UI rendering
- Memory cleanup removes non-visible lines from UI
- Search uses buffer (finds all loaded content)

### **When OFF**
- Progressive loading fills buffer
- All buffer content immediately copied to UI
- No intersection observer
- No memory cleanup
- Search uses buffer (finds all loaded content)

## Performance

- **Memory efficient**: Only renders visible + buffer zone (when virtualization ON)
- **Search complete**: Finds all loaded content (always uses buffer)
- **Responsive**: No blocking operations
- **Adaptive**: Larger buffer for inline mode