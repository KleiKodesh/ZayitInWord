# Sample Data Structure Documentation

This directory contains sample data for testing the Zayit application.

## Files

### 1. sampleTreeData.json
Tree structure for the landing page book browser.

**Structure:**
- `tree`: Array of top-level categories (hierarchical)
- `allBooks`: Flat array of all books for search

**Category fields:**
- `id`: Unique category ID
- `parentId`: Parent category ID (0 for root)
- `title`: Category name (Hebrew)
- `level`: Hierarchy level (1 = root, 2 = subcategory, etc.)
- `books`: Array of books in this category
- `children`: Array of child categories

**Book fields:**
- `id`: Unique book ID
- `categoryId`: Parent category ID
- `title`: Book title (Hebrew)
- `heShortDesc`: Short description (Hebrew)
- `fullCategory`: Full category path (e.g., "תנ\"ך > תורה")
- `orderIndex`: Display order within category
- `totalLines`: Total number of lines in book
- `hasTargumConnection`: 1 if has Targum, 0 otherwise
- `hasReferenceConnection`: 1 if has references, 0 otherwise
- `hasCommentaryConnection`: 1 if has commentary, 0 otherwise
- `hasOtherConnection`: 1 if has other connections, 0 otherwise

### 2. sampleTocData.json
Table of Contents structure for book navigation.

**Structure:**
- `tree`: Hierarchical TOC entries (for tree display)
- `allTocs`: Flat array of all TOC entries (for search)

**TocEntry fields:**
- `id`: Unique TOC entry ID
- `bookId`: Book this TOC belongs to
- `parentId`: Parent TOC entry ID (0 for root)
- `textId`: Optional text section ID
- `level`: Hierarchy level (1 = section, 2 = chapter, etc.)
- `lineId`: Line ID to navigate to when clicked
- `isLastChild`: Boolean indicating if this is the last child of parent
- `hasChildren`: Boolean indicating if this entry has children
- `text`: Display text (Hebrew)
- `path`: Full path for search (e.g., "בראשית / פרשת בראשית")
- `children`: Array of child TOC entries (only in tree structure)
- `isExpanded`: Boolean for UI state (optional)

### 3. sampleContentData.json
Sample book content showing how lines are structured.

**Structure:**
- `bookId`: Book ID
- `bookTitle`: Book title (Hebrew)
- `lines`: Array of content lines
- `metadata`: Book metadata

**Line fields:**
- `id`: Unique line ID (matches lineId in TOC)
- `html`: HTML content for the line

**Note:** In production, content is delivered dynamically by C# backend using the `addLine()` or `addLines()` methods. This file is just for reference.

## Data Flow

1. **Landing Page**: Uses `sampleTreeData.json` to display book categories and search
2. **Book Selection**: User clicks a book → opens in new tab
3. **TOC Request**: When book opens, TOC is requested using `GetToc` command
4. **TOC Display**: `sampleTocData.json` structure is used to display TOC sidebar
5. **Content Loading**: C# backend sends HTML lines via `addLine()` or `addLines()`
6. **Navigation**: Clicking TOC entry scrolls to corresponding `lineId`

## Hebrew Text Notes

- All Hebrew text uses proper Unicode characters
- Text includes vowel points (nikud) where appropriate
- Direction is RTL (right-to-left) handled by CSS
- Verse numbers use Hebrew letters in `<span class='verse-num'>` tags
